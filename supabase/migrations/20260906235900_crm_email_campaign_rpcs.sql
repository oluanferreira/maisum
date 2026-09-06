CREATE OR REPLACE FUNCTION public.crm_create_email_campaign(
  p_name text,
  p_subject text,
  p_preview_text text,
  p_html_body text,
  p_segment text DEFAULT 'all_opted_in',
  p_scheduled_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
DECLARE
  v_role public.user_role;
  v_id uuid;
BEGIN
  SELECT public.get_user_role() INTO v_role;
  IF v_role IS DISTINCT FROM 'super_admin'::public.user_role THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_segment NOT IN ('all_opted_in','registered','coupon_ready','offer_active','offer_expired','customer') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_segment');
  END IF;
  IF nullif(btrim(coalesce(p_name,'')), '') IS NULL
     OR nullif(btrim(coalesce(p_subject,'')), '') IS NULL
     OR nullif(btrim(coalesce(p_html_body,'')), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_input');
  END IF;

  INSERT INTO public.crm_email_campaigns(name, subject, preview_text, html_body, segment, scheduled_at, created_by)
  VALUES (btrim(p_name), btrim(p_subject), nullif(btrim(coalesce(p_preview_text,'')), ''), p_html_body, p_segment, p_scheduled_at, auth.uid())
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'campaign_id', v_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.crm_create_email_campaign(text,text,text,text,text,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_create_email_campaign(text,text,text,text,text,timestamptz) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_crm_email_campaigns(p_limit integer DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
DECLARE
  v_role public.user_role;
  v_result jsonb;
BEGIN
  SELECT public.get_user_role() INTO v_role;
  IF v_role IS DISTINCT FROM 'super_admin'::public.user_role THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC), '[]'::jsonb)
    INTO v_result
  FROM (
    SELECT c.id, c.name, c.subject, c.preview_text, c.segment, c.status, c.scheduled_at, c.created_at,
      count(o.id)::integer AS recipients,
      count(o.id) FILTER (WHERE o.status='sent')::integer AS sent,
      count(o.id) FILTER (WHERE o.status='failed')::integer AS failed
    FROM public.crm_email_campaigns c
    LEFT JOIN public.crm_email_outbox o ON o.campaign_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT greatest(1,least(coalesce(p_limit,50),200))
  ) x;
  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_crm_email_campaigns(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_crm_email_campaigns(integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.claim_due_crm_emails(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  campaign_id uuid,
  user_id uuid,
  destination text,
  subject text,
  preview_text text,
  html_body text,
  attempts integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  WITH picked AS (
    SELECT o.id
    FROM public.crm_email_outbox o
    WHERE o.status='pending' AND o.scheduled_at <= now()
    ORDER BY o.scheduled_at, o.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(1,least(coalesce(p_limit,50),100))
  ), claimed AS (
    UPDATE public.crm_email_outbox o
       SET status='processing', attempts=o.attempts+1
      FROM picked p
     WHERE o.id=p.id
     RETURNING o.*
  )
  SELECT c.id,c.campaign_id,c.user_id,c.destination,cam.subject,cam.preview_text,cam.html_body,c.attempts
  FROM claimed c
  JOIN public.crm_email_campaigns cam ON cam.id=c.campaign_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_due_crm_emails(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_due_crm_emails(integer) TO service_role;
