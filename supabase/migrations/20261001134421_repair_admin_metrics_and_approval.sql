-- Restore partner signup trigger omitted from the database snapshot migration.
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


REVOKE ALL ON FUNCTION public.handle_partner_application_signup() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_partner_application_signup() TO postgres;

CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_metrics record;
BEGIN
 IF public.get_user_role() IS DISTINCT FROM 'super_admin'::public.user_role THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_metrics FROM public.admin_revenue_dashboard_metrics;
 RETURN json_build_object(
  'total_users',v_metrics.total_users,
  'active_subscribers',(SELECT count(DISTINCT user_id) FROM public.subscriptions WHERE status='active' AND current_period_end>now()),
  'mrr',v_metrics.mrr_cents,
  'coupons_redeemed',v_metrics.coupons_redeemed,
  'active_restaurants',v_metrics.active_partners,
  'total_referrals',(SELECT count(*) FROM public.referrals),
  'referral_conversion',(SELECT coalesce(count(*) FILTER(WHERE status='completed')::numeric/nullif(count(*),0),0) FROM public.referrals));
END; $$;
REVOKE ALL ON FUNCTION public.get_admin_metrics() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_admin_metrics() TO authenticated,service_role;
