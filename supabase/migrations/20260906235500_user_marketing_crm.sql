-- +UM user marketing CRM: contact queue, lifecycle segmentation and email campaign outbox.

CREATE TABLE IF NOT EXISTS public.crm_contacts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  manual_status text NOT NULL DEFAULT 'open' CHECK (manual_status IN ('open','contacted','follow_up','won','lost','paused')),
  owner_note text,
  next_follow_up_at timestamptz,
  last_whatsapp_opened_at timestamptz,
  last_email_sent_at timestamptz,
  do_not_contact_email boolean NOT NULL DEFAULT false,
  do_not_contact_whatsapp boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_marketing_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_opt_in boolean NOT NULL DEFAULT false,
  whatsapp_opt_in boolean NOT NULL DEFAULT false,
  email_unsubscribed_at timestamptz,
  whatsapp_unsubscribed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_contact_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('whatsapp','email','system')),
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_contact_events_user_idx
  ON public.crm_contact_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS crm_contacts_followup_idx
  ON public.crm_contacts(next_follow_up_at)
  WHERE next_follow_up_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.crm_email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  preview_text text,
  html_body text NOT NULL,
  segment text NOT NULL DEFAULT 'all_opted_in' CHECK (segment IN ('all_opted_in','registered','coupon_ready','offer_active','offer_expired','customer')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','sending','sent','cancelled')),
  scheduled_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.crm_email_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed','skipped')),
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  provider_message_id text,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS crm_email_outbox_due_idx
  ON public.crm_email_outbox(status, scheduled_at)
  WHERE status = 'pending';

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_marketing_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contact_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_email_outbox ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.crm_contacts FROM anon, authenticated;
REVOKE ALL ON public.crm_marketing_preferences FROM anon, authenticated;
REVOKE ALL ON public.crm_contact_events FROM anon, authenticated;
REVOKE ALL ON public.crm_email_campaigns FROM anon, authenticated;
REVOKE ALL ON public.crm_email_outbox FROM anon, authenticated;

-- Seed all current end users into the CRM without exposing auth.users directly.
INSERT INTO public.crm_contacts (user_id)
SELECT p.id
FROM public.profiles p
WHERE p.role::text = 'user'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.crm_marketing_preferences (user_id, email_opt_in, whatsapp_opt_in)
SELECT p.id,
       (p.offer_contact_opt_in_at IS NOT NULL),
       (p.offer_contact_opt_in_at IS NOT NULL)
FROM public.profiles p
WHERE p.role::text = 'user'
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ensure_crm_contact_for_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
BEGIN
  IF NEW.role::text = 'user' THEN
    INSERT INTO public.crm_contacts (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.crm_marketing_preferences (user_id, email_opt_in, whatsapp_opt_in)
    VALUES (
      NEW.id,
      NEW.offer_contact_opt_in_at IS NOT NULL,
      NEW.offer_contact_opt_in_at IS NOT NULL
    )
    ON CONFLICT (user_id) DO UPDATE
      SET email_opt_in = CASE WHEN NEW.offer_contact_opt_in_at IS NOT NULL THEN true ELSE crm_marketing_preferences.email_opt_in END,
          whatsapp_opt_in = CASE WHEN NEW.offer_contact_opt_in_at IS NOT NULL THEN true ELSE crm_marketing_preferences.whatsapp_opt_in END,
          updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_ensure_crm_contact_for_profile ON public.profiles;
CREATE TRIGGER trg_ensure_crm_contact_for_profile
AFTER INSERT OR UPDATE OF role, offer_contact_opt_in_at ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.ensure_crm_contact_for_profile();

CREATE OR REPLACE FUNCTION public.crm_lifecycle_stage(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = p_user_id
        AND s.status::text = 'active'
        AND s.current_period_end > now()
    ) THEN 'customer'
    WHEN EXISTS (
      SELECT 1 FROM public.first_use_offers o
      WHERE o.user_id = p_user_id
        AND o.status = 'active'
        AND o.expires_at > now()
    ) THEN 'offer_active'
    WHEN EXISTS (
      SELECT 1 FROM public.first_use_offers o
      WHERE o.user_id = p_user_id
        AND (o.status = 'expired' OR (o.status = 'active' AND o.expires_at <= now()))
    ) THEN 'offer_expired'
    WHEN EXISTS (
      SELECT 1 FROM public.acquisition_redemptions ar
      JOIN public.coupons c ON c.id = ar.coupon_id
      WHERE ar.user_id = p_user_id AND c.status::text = 'used'
    ) THEN 'first_use_done'
    WHEN EXISTS (
      SELECT 1 FROM public.acquisition_redemptions ar
      JOIN public.coupons c ON c.id = ar.coupon_id
      WHERE ar.user_id = p_user_id AND c.status::text = 'available'
    ) THEN 'coupon_ready'
    WHEN EXISTS (
      SELECT 1 FROM public.coupons c
      WHERE c.user_id = p_user_id AND c.status::text = 'used'
    ) THEN 'engaged'
    ELSE 'registered'
  END;
$function$;

CREATE OR REPLACE FUNCTION public.get_crm_contacts(
  p_stage text DEFAULT NULL,
  p_limit integer DEFAULT 250
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, auth, pg_temp
AS $function$
DECLARE
  v_role public.user_role;
  v_result jsonb;
BEGIN
  SELECT public.get_user_role() INTO v_role;
  IF v_role IS DISTINCT FROM 'super_admin'::public.user_role THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH base AS (
    SELECT
      p.id AS user_id,
      p.full_name,
      u.email,
      p.whatsapp_number,
      p.created_at,
      public.crm_lifecycle_stage(p.id) AS lifecycle_stage,
      c.manual_status,
      c.owner_note,
      c.next_follow_up_at,
      c.last_whatsapp_opened_at,
      c.last_email_sent_at,
      c.do_not_contact_email,
      c.do_not_contact_whatsapp,
      coalesce(mp.email_opt_in, p.offer_contact_opt_in_at IS NOT NULL) AS email_opt_in,
      coalesce(mp.whatsapp_opt_in, p.offer_contact_opt_in_at IS NOT NULL) AS whatsapp_opt_in,
      mp.email_unsubscribed_at,
      mp.whatsapp_unsubscribed_at,
      ar.campaign_key,
      i.display_name AS influencer_name,
      i.slug AS influencer_slug,
      (SELECT max(cp.used_at) FROM public.coupons cp WHERE cp.user_id = p.id AND cp.status::text = 'used') AS last_use_at,
      (SELECT max(pay.paid_at) FROM public.payments pay JOIN public.subscriptions ss ON ss.id = pay.subscription_id WHERE ss.user_id = p.id AND pay.status::text = 'paid') AS last_purchase_at,
      (SELECT max(o.expires_at) FROM public.first_use_offers o WHERE o.user_id = p.id) AS offer_expires_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.crm_contacts c ON c.user_id = p.id
    LEFT JOIN public.crm_marketing_preferences mp ON mp.user_id = p.id
    LEFT JOIN LATERAL (
      SELECT ar1.* FROM public.acquisition_redemptions ar1
      WHERE ar1.user_id = p.id
      ORDER BY ar1.redeemed_at DESC LIMIT 1
    ) ar ON true
    LEFT JOIN public.influencers i ON i.id = ar.influencer_id
    WHERE p.role::text = 'user'
  ), ranked AS (
    SELECT b.*,
      CASE b.lifecycle_stage
        WHEN 'offer_active' THEN 100
        WHEN 'offer_expired' THEN 90
        WHEN 'first_use_done' THEN 82
        WHEN 'coupon_ready' THEN 72
        WHEN 'engaged' THEN 60
        WHEN 'registered' THEN 45
        WHEN 'customer' THEN 10
        ELSE 0
      END AS priority_score
    FROM base b
    WHERE p_stage IS NULL OR b.lifecycle_stage = p_stage
  )
  SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.priority_score DESC, coalesce(r.next_follow_up_at, r.created_at) ASC), '[]'::jsonb)
    INTO v_result
  FROM (SELECT * FROM ranked LIMIT greatest(1, least(coalesce(p_limit, 250), 1000))) r;

  RETURN v_result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_crm_contacts(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_crm_contacts(text, integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.crm_mark_contact_event(
  p_user_id uuid,
  p_channel text,
  p_event_type text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
DECLARE
  v_role public.user_role;
BEGIN
  SELECT public.get_user_role() INTO v_role;
  IF v_role IS DISTINCT FROM 'super_admin'::public.user_role THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_channel NOT IN ('whatsapp','email','system') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_channel');
  END IF;

  INSERT INTO public.crm_contacts (user_id, manual_status)
  VALUES (p_user_id, CASE WHEN p_event_type IN ('whatsapp_opened','email_sent') THEN 'contacted' ELSE 'open' END)
  ON CONFLICT (user_id) DO UPDATE SET
    manual_status = CASE WHEN p_event_type IN ('whatsapp_opened','email_sent') THEN 'contacted' ELSE crm_contacts.manual_status END,
    last_whatsapp_opened_at = CASE WHEN p_event_type = 'whatsapp_opened' THEN now() ELSE crm_contacts.last_whatsapp_opened_at END,
    last_email_sent_at = CASE WHEN p_event_type = 'email_sent' THEN now() ELSE crm_contacts.last_email_sent_at END,
    updated_at = now();

  INSERT INTO public.crm_contact_events(user_id, channel, event_type, metadata, actor_user_id)
  VALUES (p_user_id, p_channel, p_event_type, coalesce(p_metadata, '{}'::jsonb), auth.uid());

  RETURN jsonb_build_object('ok', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.crm_mark_contact_event(uuid, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_mark_contact_event(uuid, text, text, jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.crm_update_contact(
  p_user_id uuid,
  p_manual_status text DEFAULT NULL,
  p_owner_note text DEFAULT NULL,
  p_next_follow_up_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $function$
DECLARE
  v_role public.user_role;
BEGIN
  SELECT public.get_user_role() INTO v_role;
  IF v_role IS DISTINCT FROM 'super_admin'::public.user_role THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  INSERT INTO public.crm_contacts(user_id, manual_status, owner_note, next_follow_up_at)
  VALUES (p_user_id, coalesce(p_manual_status, 'open'), p_owner_note, p_next_follow_up_at)
  ON CONFLICT (user_id) DO UPDATE SET
    manual_status = coalesce(p_manual_status, crm_contacts.manual_status),
    owner_note = coalesce(p_owner_note, crm_contacts.owner_note),
    next_follow_up_at = p_next_follow_up_at,
    updated_at = now();

  RETURN jsonb_build_object('ok', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.crm_update_contact(uuid, text, text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_update_contact(uuid, text, text, timestamptz) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.crm_queue_email_campaign(p_campaign_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, auth, pg_temp
AS $function$
DECLARE
  v_role public.user_role;
  v_campaign public.crm_email_campaigns%ROWTYPE;
  v_count integer := 0;
BEGIN
  SELECT public.get_user_role() INTO v_role;
  IF v_role IS DISTINCT FROM 'super_admin'::public.user_role THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_campaign FROM public.crm_email_campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF v_campaign.id IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF v_campaign.status NOT IN ('draft','queued') THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid_status'); END IF;

  INSERT INTO public.crm_email_outbox(campaign_id, user_id, destination, scheduled_at)
  SELECT v_campaign.id, p.id, u.email, coalesce(v_campaign.scheduled_at, now())
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.crm_marketing_preferences mp ON mp.user_id = p.id
  LEFT JOIN public.crm_contacts cc ON cc.user_id = p.id
  WHERE p.role::text = 'user'
    AND nullif(btrim(coalesce(u.email,'')), '') IS NOT NULL
    AND coalesce(mp.email_opt_in, p.offer_contact_opt_in_at IS NOT NULL) = true
    AND mp.email_unsubscribed_at IS NULL
    AND coalesce(cc.do_not_contact_email, false) = false
    AND (
      v_campaign.segment = 'all_opted_in'
      OR public.crm_lifecycle_stage(p.id) = v_campaign.segment
    )
  ON CONFLICT (campaign_id, user_id) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  UPDATE public.crm_email_campaigns
     SET status = 'queued', updated_at = now()
   WHERE id = v_campaign.id;

  RETURN jsonb_build_object('ok', true, 'queued', v_count);
END;
$function$;

REVOKE ALL ON FUNCTION public.crm_queue_email_campaign(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_queue_email_campaign(uuid) TO authenticated, service_role;
