-- ===========================================
-- Migration 006: Auth RPC Functions
-- ===========================================

-- Promote user to restaurant_admin (only super_admin can call)
CREATE OR REPLACE FUNCTION promote_to_restaurant_admin(p_user_id UUID, p_restaurant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF get_user_role() != 'super_admin' THEN
    RAISE EXCEPTION 'Apenas super_admin pode promover usuarios';
  END IF;

  UPDATE profiles SET role = 'restaurant_admin' WHERE id = p_user_id;
  UPDATE restaurants SET admin_user_id = p_user_id WHERE id = p_restaurant_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
