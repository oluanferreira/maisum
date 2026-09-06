-- Partner self-registration with admin approval.
-- Production was migrated on 2026-09-06; this file keeps repository state reproducible.

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS partner_status text;

UPDATE public.restaurants
SET partner_status = 'approved'
WHERE partner_status IS NULL;

ALTER TABLE public.restaurants
  ALTER COLUMN partner_status SET DEFAULT 'approved',
  ALTER COLUMN partner_status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'restaurants_partner_status_check'
      AND conrelid = 'public.restaurants'::regclass
  ) THEN
    ALTER TABLE public.restaurants
      ADD CONSTRAINT restaurants_partner_status_check
      CHECK (partner_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_restaurants_partner_status
  ON public.restaurants (partner_status, created_at DESC);

CREATE OR REPLACE FUNCTION public.approve_partner_application(p_restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin_user_id uuid;
BEGIN
  IF public.get_user_role() IS DISTINCT FROM 'super_admin'::public.user_role THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT admin_user_id
  INTO v_admin_user_id
  FROM public.restaurants
  WHERE id = p_restaurant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF v_admin_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'missing_partner_user');
  END IF;

  UPDATE public.profiles
  SET role = 'restaurant_admin'::public.user_role
  WHERE id = v_admin_user_id;

  UPDATE public.restaurants
  SET partner_status = 'approved', is_active = true
  WHERE id = p_restaurant_id;

  RETURN jsonb_build_object('ok', true, 'status', 'approved');
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_partner_application(p_restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin_user_id uuid;
BEGIN
  IF public.get_user_role() IS DISTINCT FROM 'super_admin'::public.user_role THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT admin_user_id
  INTO v_admin_user_id
  FROM public.restaurants
  WHERE id = p_restaurant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  UPDATE public.restaurants
  SET partner_status = 'rejected', is_active = false
  WHERE id = p_restaurant_id;

  IF v_admin_user_id IS NOT NULL THEN
    UPDATE public.profiles
    SET role = 'user'::public.user_role
    WHERE id = v_admin_user_id
      AND role <> 'super_admin'::public.user_role;
  END IF;

  RETURN jsonb_build_object('ok', true, 'status', 'rejected');
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_partner_application_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_city_id uuid;
  v_restaurant_name text;
  v_address text;
  v_cep text;
  v_whatsapp text;
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'partner_application', 'false') <> 'true' THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_city_id := (NEW.raw_user_meta_data->>'restaurant_city_id')::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'invalid_partner_city';
  END;

  IF NOT EXISTS (
    SELECT 1 FROM public.cities
    WHERE id = v_city_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'unsupported_partner_city';
  END IF;

  v_restaurant_name := btrim(COALESCE(NEW.raw_user_meta_data->>'restaurant_name', ''));
  v_address := btrim(COALESCE(NEW.raw_user_meta_data->>'restaurant_address', ''));
  v_cep := regexp_replace(COALESCE(NEW.raw_user_meta_data->>'restaurant_cep', ''), '\D', '', 'g');
  v_whatsapp := regexp_replace(COALESCE(NEW.raw_user_meta_data->>'restaurant_whatsapp', ''), '\D', '', 'g');

  IF char_length(v_restaurant_name) < 2 OR char_length(v_restaurant_name) > 100 THEN
    RAISE EXCEPTION 'invalid_partner_restaurant_name';
  END IF;
  IF char_length(v_address) < 5 OR char_length(v_address) > 500 THEN
    RAISE EXCEPTION 'invalid_partner_address';
  END IF;
  IF v_cep <> '' AND char_length(v_cep) <> 8 THEN
    RAISE EXCEPTION 'invalid_partner_cep';
  END IF;
  IF v_whatsapp <> '' AND char_length(v_whatsapp) < 10 THEN
    RAISE EXCEPTION 'invalid_partner_whatsapp';
  END IF;

  INSERT INTO public.restaurants (
    name, description, address, city_id, phone, cuisine_type,
    latitude, longitude, photos, is_active, admin_user_id, cep,
    whatsapp, contact_name, contact_email, portal_login_email,
    acquisition_notes, partner_status
  )
  VALUES (
    v_restaurant_name, NULL, v_address, v_city_id, NULL, NULL,
    NULL, NULL, ARRAY[]::text[], false, NEW.id, NULLIF(v_cep, ''),
    NULLIF(v_whatsapp, ''),
    NULLIF(btrim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    NEW.email, NEW.email,
    'Autocadastro via parceiro.appmaisum.com.br', 'pending'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_partner_application ON auth.users;
CREATE TRIGGER on_auth_user_partner_application
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_partner_application_signup();

REVOKE EXECUTE ON FUNCTION public.approve_partner_application(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_partner_application(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_partner_application(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_partner_application(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_partner_application_signup() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_partner_application_signup() TO postgres;
