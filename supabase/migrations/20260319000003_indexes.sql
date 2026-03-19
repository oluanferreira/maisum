-- ===========================================
-- Migration 003: Indexes
-- ===========================================

-- Restaurants
CREATE INDEX idx_restaurants_city ON restaurants(city_id) WHERE is_active = true;
CREATE INDEX idx_restaurants_location ON restaurants(latitude, longitude) WHERE is_active = true;
CREATE INDEX idx_restaurants_admin ON restaurants(admin_user_id);

-- Coupons
CREATE INDEX idx_coupons_user_status ON coupons(user_id, status);
CREATE INDEX idx_coupons_user_restaurant ON coupons(user_id, restaurant_id, status);
CREATE INDEX idx_coupons_expires ON coupons(expires_at) WHERE status = 'available';

-- Subscriptions
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_abacatepay ON subscriptions(abacatepay_subscription_id);

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(conversation_id) WHERE is_read = false;

-- Conversations
CREATE INDEX idx_conversations_user ON conversations(user_id, last_message_at DESC);
CREATE INDEX idx_conversations_restaurant ON conversations(restaurant_id, last_message_at DESC);

-- Reviews
CREATE INDEX idx_reviews_restaurant ON reviews(restaurant_id, rating);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- Referrals
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);

-- Social Proofs
CREATE INDEX idx_social_proofs_pending ON social_proofs(status) WHERE status = 'pending';
CREATE INDEX idx_social_proofs_restaurant ON social_proofs(restaurant_id, status);

-- Benefits
CREATE INDEX idx_benefits_restaurant ON benefits(restaurant_id) WHERE is_active = true;

-- Payments
CREATE INDEX idx_payments_subscription ON payments(subscription_id, created_at DESC);
