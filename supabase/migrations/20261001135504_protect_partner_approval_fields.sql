CREATE OR REPLACE FUNCTION private.guard_partner_approval_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND public.get_user_role() IS DISTINCT FROM 'super_admin'::public.user_role THEN
  IF TG_OP='INSERT' THEN
   IF NEW.partner_status IS DISTINCT FROM 'pending' OR NEW.is_active THEN
    RAISE EXCEPTION 'partner_approval_requires_admin' USING ERRCODE='42501';
   END IF;
  ELSIF NEW.partner_status IS DISTINCT FROM OLD.partner_status
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.admin_user_id IS DISTINCT FROM OLD.admin_user_id THEN
   RAISE EXCEPTION 'partner_approval_requires_admin' USING ERRCODE='42501';
  END IF;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_partner_approval_fields() FROM PUBLIC,anon,authenticated,service_role;
DROP TRIGGER IF EXISTS guard_partner_approval_fields ON public.restaurants;
CREATE TRIGGER guard_partner_approval_fields BEFORE INSERT OR UPDATE ON public.restaurants
FOR EACH ROW EXECUTE FUNCTION private.guard_partner_approval_fields();
