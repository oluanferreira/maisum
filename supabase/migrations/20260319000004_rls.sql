-- ===========================================
-- Migration 004: RLS Policies + Helper Functions
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_invites ENABLE ROW LEVEL SECURITY;

-- Helper Functions
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_restaurant_id()
RETURNS UUID AS $$
  SELECT id FROM restaurants WHERE admin_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========== PROFILES ==========
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Super admin can view all profiles" ON profiles FOR SELECT USING (get_user_role() = 'super_admin');
CREATE POLICY "Super admin can update all profiles" ON profiles FOR UPDATE USING (get_user_role() = 'super_admin');

-- ========== CITIES ==========
CREATE POLICY "Anyone can view active cities" ON cities FOR SELECT USING (is_active = true);
CREATE POLICY "Super admin full access to cities" ON cities FOR ALL USING (get_user_role() = 'super_admin');

-- ========== RESTAURANTS ==========
CREATE POLICY "Anyone can view active restaurants" ON restaurants FOR SELECT USING (is_active = true);
CREATE POLICY "Restaurant admin can view own" ON restaurants FOR SELECT USING (admin_user_id = auth.uid());
CREATE POLICY "Restaurant admin can update own" ON restaurants FOR UPDATE USING (admin_user_id = auth.uid());
CREATE POLICY "Super admin full access restaurants" ON restaurants FOR ALL USING (get_user_role() = 'super_admin');

-- ========== RESTAURANT INVITES ==========
CREATE POLICY "Super admin manages invites" ON restaurant_invites FOR ALL USING (get_user_role() = 'super_admin');
CREATE POLICY "Public can read valid invites" ON restaurant_invites FOR SELECT USING (used_at IS NULL AND expires_at > now());

-- ========== SUBSCRIPTIONS ==========
CREATE POLICY "Users view own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Super admin view all subscriptions" ON subscriptions FOR SELECT USING (get_user_role() = 'super_admin');

-- ========== COUPONS ==========
CREATE POLICY "Users view own coupons" ON coupons FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Restaurant admin view coupons for restaurant" ON coupons FOR SELECT USING (restaurant_id = get_my_restaurant_id());
CREATE POLICY "Super admin view all coupons" ON coupons FOR SELECT USING (get_user_role() = 'super_admin');

-- ========== BENEFITS ==========
CREATE POLICY "Anyone can view active benefits" ON benefits FOR SELECT USING (is_active = true);
CREATE POLICY "Restaurant admin manages own benefits" ON benefits FOR ALL USING (restaurant_id = get_my_restaurant_id());
CREATE POLICY "Super admin full access benefits" ON benefits FOR ALL USING (get_user_role() = 'super_admin');

-- ========== BENEFIT RULES ==========
CREATE POLICY "Anyone can view active rules" ON benefit_rules FOR SELECT USING (is_active = true);
CREATE POLICY "Restaurant admin manages own rules" ON benefit_rules FOR ALL USING (restaurant_id = get_my_restaurant_id());
CREATE POLICY "Super admin full access rules" ON benefit_rules FOR ALL USING (get_user_role() = 'super_admin');

-- ========== REVIEWS ==========
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Super admin can manage reviews" ON reviews FOR ALL USING (get_user_role() = 'super_admin');

-- ========== CONVERSATIONS ==========
CREATE POLICY "Users view own conversations" ON conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Restaurant admin views their conversations" ON conversations FOR SELECT USING (restaurant_id = get_my_restaurant_id());
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (user_id = auth.uid());

-- ========== MESSAGES ==========
CREATE POLICY "Participants can view messages" ON messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid() OR restaurant_id = get_my_restaurant_id()
  ));
CREATE POLICY "Participants can send messages" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid() OR restaurant_id = get_my_restaurant_id()
  ));
CREATE POLICY "Recipient can mark as read" ON messages FOR UPDATE
  USING (sender_id != auth.uid() AND conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid() OR restaurant_id = get_my_restaurant_id()
  ));

-- ========== REFERRALS ==========
CREATE POLICY "Users view own referrals" ON referrals FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY "Super admin view all referrals" ON referrals FOR SELECT USING (get_user_role() = 'super_admin');

-- ========== SOCIAL PROOFS ==========
CREATE POLICY "Users view own proofs" ON social_proofs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can submit proofs" ON social_proofs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Restaurant admin views their proofs" ON social_proofs FOR SELECT USING (restaurant_id = get_my_restaurant_id());
CREATE POLICY "Restaurant admin can review proofs" ON social_proofs FOR UPDATE USING (restaurant_id = get_my_restaurant_id());
CREATE POLICY "Super admin full access proofs" ON social_proofs FOR ALL USING (get_user_role() = 'super_admin');

-- ========== PAYMENTS ==========
CREATE POLICY "Users view own payments" ON payments FOR SELECT
  USING (subscription_id IN (SELECT id FROM subscriptions WHERE user_id = auth.uid()));
CREATE POLICY "Super admin view all payments" ON payments FOR SELECT USING (get_user_role() = 'super_admin');

-- ========== PUSH TOKENS ==========
CREATE POLICY "Users manage own tokens" ON push_tokens FOR ALL USING (user_id = auth.uid());
