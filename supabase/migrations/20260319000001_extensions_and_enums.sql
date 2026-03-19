-- ===========================================
-- Migration 001: Extensions & ENUM Types
-- +um Database Schema
-- ===========================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM Types
CREATE TYPE user_role AS ENUM ('user', 'restaurant_admin', 'super_admin');
CREATE TYPE plan_type AS ENUM ('monthly', 'annual');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'expired');
CREATE TYPE coupon_status AS ENUM ('available', 'used', 'expired');
CREATE TYPE coupon_source AS ENUM ('subscription', 'referral', 'review', 'social');
CREATE TYPE benefit_category AS ENUM ('prato', 'drink', 'sobremesa', 'combo');
CREATE TYPE referral_status AS ENUM ('pending', 'completed');
CREATE TYPE social_proof_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE social_proof_type AS ENUM ('screenshot', 'link');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('pix', 'credit_card', 'boleto');
