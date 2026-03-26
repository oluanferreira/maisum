-- ===========================================
-- Migration 010: Enhance Benefits System
-- Adds: photo, price, promo description per benefit
-- Adds: per-benefit rules (benefit_id FK on benefit_rules)
-- Updates: get_restaurant_detail RPC with nested rules
-- ===========================================

-- 1. New columns on benefits
ALTER TABLE benefits ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE benefits ADD COLUMN IF NOT EXISTS original_price INT;        -- centavos (R$45,00 = 4500)
ALTER TABLE benefits ADD COLUMN IF NOT EXISTS promo_description TEXT;    -- ex: "Leve 2, pague 1"

-- 2. Per-benefit rules (benefit_id FK on benefit_rules)
ALTER TABLE benefit_rules ADD COLUMN IF NOT EXISTS benefit_id UUID REFERENCES benefits(id) ON DELETE CASCADE;

-- 3. Index for per-benefit rule lookups
CREATE INDEX IF NOT EXISTS idx_benefit_rules_benefit_id ON benefit_rules(benefit_id) WHERE benefit_id IS NOT NULL;

-- 4. Migrate existing global rules → per-benefit rules
-- For each global rule (benefit_id IS NULL), create a copy for every active benefit in that restaurant
INSERT INTO benefit_rules (restaurant_id, benefit_id, available_days, available_hours_start, available_hours_end, daily_limit, is_active)
SELECT br.restaurant_id, b.id, br.available_days, br.available_hours_start, br.available_hours_end, br.daily_limit, br.is_active
FROM benefit_rules br
JOIN benefits b ON b.restaurant_id = br.restaurant_id AND b.is_active = true
WHERE br.benefit_id IS NULL;

-- 5. Updated RPC: get_restaurant_detail — now returns per-benefit rules nested
CREATE OR REPLACE FUNCTION get_restaurant_detail(p_restaurant_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'restaurant', row_to_json(r),
    'avg_rating', COALESCE((SELECT AVG(rating)::NUMERIC(2,1) FROM reviews WHERE restaurant_id = p_restaurant_id), 0),
    'review_count', (SELECT COUNT(*) FROM reviews WHERE restaurant_id = p_restaurant_id),
    'benefits', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', b.id,
          'name', b.name,
          'description', b.description,
          'category', b.category,
          'photo_url', b.photo_url,
          'original_price', b.original_price,
          'promo_description', b.promo_description,
          'is_active', b.is_active,
          'rules', (
            SELECT COALESCE(json_agg(
              json_build_object(
                'id', br.id,
                'available_days', br.available_days,
                'available_hours_start', br.available_hours_start,
                'available_hours_end', br.available_hours_end,
                'daily_limit', br.daily_limit,
                'is_active', br.is_active
              )
            ), '[]'::json)
            FROM benefit_rules br
            WHERE br.is_active = true
              AND (br.benefit_id = b.id OR (br.benefit_id IS NULL AND br.restaurant_id = p_restaurant_id))
          )
        )
      ), '[]'::json)
      FROM benefits b
      WHERE b.restaurant_id = p_restaurant_id AND b.is_active = true
    )
  )
  FROM restaurants r WHERE r.id = p_restaurant_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
