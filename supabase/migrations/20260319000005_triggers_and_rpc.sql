-- ===========================================
-- Migration 005: Triggers & RPC Functions
-- ===========================================

-- ========== TRIGGERS ==========

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- ========== RPC FUNCTIONS ==========

-- Get restaurant with average rating
CREATE OR REPLACE FUNCTION get_restaurant_detail(p_restaurant_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'restaurant', row_to_json(r),
    'avg_rating', COALESCE((SELECT AVG(rating)::NUMERIC(2,1) FROM reviews WHERE restaurant_id = p_restaurant_id), 0),
    'review_count', (SELECT COUNT(*) FROM reviews WHERE restaurant_id = p_restaurant_id),
    'benefits', (SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json) FROM benefits b WHERE b.restaurant_id = p_restaurant_id AND b.is_active = true),
    'rules', (SELECT COALESCE(json_agg(row_to_json(br)), '[]'::json) FROM benefit_rules br WHERE br.restaurant_id = p_restaurant_id AND br.is_active = true)
  )
  FROM restaurants r WHERE r.id = p_restaurant_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get nearby restaurants (Haversine formula)
CREATE OR REPLACE FUNCTION get_nearby_restaurants(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_radius_km DOUBLE PRECISION DEFAULT 10)
RETURNS SETOF restaurants AS $$
  SELECT *
  FROM restaurants
  WHERE is_active = true
    AND (
      6371 * acos(
        cos(radians(p_lat)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(latitude))
      )
    ) <= p_radius_km
  ORDER BY (
    6371 * acos(
      cos(radians(p_lat)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(latitude))
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Validate coupon (called by restaurant scanner)
CREATE OR REPLACE FUNCTION validate_coupon(p_coupon_id UUID, p_restaurant_id UUID)
RETURNS JSON AS $$
DECLARE
  v_coupon coupons;
BEGIN
  SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id;

  IF v_coupon IS NULL THEN
    RETURN json_build_object('valid', false, 'reason', 'Cupom nao encontrado');
  END IF;

  IF v_coupon.status != 'available' THEN
    RETURN json_build_object('valid', false, 'reason', 'Cupom ja utilizado ou expirado');
  END IF;

  IF v_coupon.expires_at < now() THEN
    UPDATE coupons SET status = 'expired' WHERE id = p_coupon_id;
    RETURN json_build_object('valid', false, 'reason', 'Cupom expirado');
  END IF;

  -- Mark as used
  UPDATE coupons
  SET status = 'used', used_at = now(), restaurant_id = p_restaurant_id
  WHERE id = p_coupon_id;

  RETURN json_build_object(
    'valid', true,
    'user_name', (SELECT full_name FROM profiles WHERE id = v_coupon.user_id),
    'coupon_id', p_coupon_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allocate coupons for subscription
CREATE OR REPLACE FUNCTION allocate_coupons(p_user_id UUID, p_subscription_id UUID, p_plan plan_type)
RETURNS INT AS $$
DECLARE
  v_count INT;
  v_expires TIMESTAMPTZ;
BEGIN
  IF p_plan = 'monthly' THEN
    v_count := 10;
    v_expires := now() + INTERVAL '30 days';
  ELSE
    v_count := 100;
    v_expires := now() + INTERVAL '365 days';
  END IF;

  INSERT INTO coupons (user_id, subscription_id, status, expires_at, source)
  SELECT p_user_id, p_subscription_id, 'available', v_expires, 'subscription'
  FROM generate_series(1, v_count);

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant extra coupons (referral, review, social)
CREATE OR REPLACE FUNCTION grant_extra_coupons(p_user_id UUID, p_count INT, p_source coupon_source)
RETURNS BOOLEAN AS $$
DECLARE
  v_current INT;
  v_sub subscriptions;
BEGIN
  SELECT extra_coupons_this_month INTO v_current FROM profiles WHERE id = p_user_id;
  IF v_current + p_count > 10 THEN
    RETURN false;
  END IF;

  SELECT * INTO v_sub FROM subscriptions WHERE user_id = p_user_id AND status = 'active' LIMIT 1;
  IF v_sub IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO coupons (user_id, subscription_id, status, expires_at, source)
  SELECT p_user_id, v_sub.id, 'available', v_sub.current_period_end, p_source
  FROM generate_series(1, p_count);

  UPDATE profiles SET extra_coupons_this_month = extra_coupons_this_month + p_count WHERE id = p_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restaurant metrics dashboard
CREATE OR REPLACE FUNCTION get_restaurant_metrics(p_restaurant_id UUID, p_days INT DEFAULT 30)
RETURNS JSON AS $$
  SELECT json_build_object(
    'coupons_validated', (SELECT COUNT(*) FROM coupons WHERE restaurant_id = p_restaurant_id AND used_at > now() - (p_days || ' days')::INTERVAL),
    'unique_customers', (SELECT COUNT(DISTINCT user_id) FROM coupons WHERE restaurant_id = p_restaurant_id AND used_at > now() - (p_days || ' days')::INTERVAL),
    'avg_rating', (SELECT COALESCE(AVG(rating)::NUMERIC(2,1), 0) FROM reviews WHERE restaurant_id = p_restaurant_id),
    'total_reviews', (SELECT COUNT(*) FROM reviews WHERE restaurant_id = p_restaurant_id),
    'daily_coupons', (
      SELECT COALESCE(json_agg(json_build_object('date', d, 'count', c)), '[]'::json)
      FROM (
        SELECT used_at::DATE as d, COUNT(*) as c
        FROM coupons
        WHERE restaurant_id = p_restaurant_id AND used_at > now() - (p_days || ' days')::INTERVAL
        GROUP BY used_at::DATE ORDER BY d
      ) sub
    )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Admin metrics dashboard
CREATE OR REPLACE FUNCTION get_admin_metrics()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles WHERE role = 'user'),
    'active_subscribers', (SELECT COUNT(*) FROM subscriptions WHERE status = 'active'),
    'mrr', (SELECT COALESCE(SUM(CASE WHEN plan_type = 'monthly' THEN 1490 ELSE 749 END), 0) FROM subscriptions WHERE status = 'active'),
    'coupons_redeemed', (SELECT COUNT(*) FROM coupons WHERE status = 'used'),
    'active_restaurants', (SELECT COUNT(*) FROM restaurants WHERE is_active = true),
    'total_referrals', (SELECT COUNT(*) FROM referrals),
    'referral_conversion', (SELECT COALESCE(
      (COUNT(*) FILTER (WHERE status = 'completed'))::NUMERIC / NULLIF(COUNT(*), 0), 0
    ) FROM referrals)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
