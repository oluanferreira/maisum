-- MAISUM-UPG-5.1 — essential funnel events
-- Kept in monorepo so restaurant/admin surfaces share the same contract.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  anonymous_id text NULL,
  source text NOT NULL DEFAULT 'app_web',
  pathname text NULL,
  restaurant_id uuid NULL,
  dish_id uuid NULL,
  coupon_id uuid NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT analytics_events_event_name_chk CHECK (
    event_name IN (
      'landing_visited',
      'account_created',
      'restaurant_list_viewed',
      'dishes_tab_opened',
      'restaurant_detail_opened',
      'dish_detail_opened',
      'experience_generated',
      'experience_validated',
      'second_use_returned'
    )
  ),
  CONSTRAINT analytics_events_source_chk CHECK (char_length(source) BETWEEN 1 AND 80),
  CONSTRAINT analytics_events_anonymous_id_len_chk CHECK (anonymous_id IS NULL OR char_length(anonymous_id) <= 128)
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_time
  ON public.analytics_events(event_name, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time
  ON public.analytics_events(user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_restaurant_time
  ON public.analytics_events(restaurant_id, occurred_at DESC)
  WHERE restaurant_id IS NOT NULL;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analytics_events_super_admin_select ON public.analytics_events;
CREATE POLICY analytics_events_super_admin_select
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

DROP POLICY IF EXISTS analytics_events_own_select ON public.analytics_events;
CREATE POLICY analytics_events_own_select
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.track_funnel_event(
  p_event_name text,
  p_source text DEFAULT 'app_web',
  p_pathname text DEFAULT NULL,
  p_restaurant_id uuid DEFAULT NULL,
  p_dish_id uuid DEFAULT NULL,
  p_coupon_id uuid DEFAULT NULL,
  p_anonymous_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $function$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO public.analytics_events (
    event_name,
    user_id,
    anonymous_id,
    source,
    pathname,
    restaurant_id,
    dish_id,
    coupon_id,
    metadata
  )
  VALUES (
    p_event_name,
    auth.uid(),
    NULLIF(left(COALESCE(p_anonymous_id, ''), 128), ''),
    left(COALESCE(NULLIF(p_source, ''), 'app_web'), 80),
    NULLIF(left(COALESCE(p_pathname, ''), 300), ''),
    p_restaurant_id,
    p_dish_id,
    p_coupon_id,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
EXCEPTION
  WHEN check_violation OR invalid_text_representation THEN
    RAISE LOG 'track_funnel_event rejected event=% source=%: %', p_event_name, p_source, SQLERRM;
    RETURN NULL;
  WHEN OTHERS THEN
    RAISE LOG 'track_funnel_event failed event=% source=%: %', p_event_name, p_source, SQLERRM;
    RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.track_funnel_event(text, text, text, uuid, uuid, uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_funnel_event(text, text, text, uuid, uuid, uuid, text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.track_funnel_event(text, text, text, uuid, uuid, uuid, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_funnel_event(text, text, text, uuid, uuid, uuid, text, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'Usuário'),
    'user'
  );

  INSERT INTO public.analytics_events (event_name, user_id, source, pathname, metadata)
  VALUES (
    'account_created',
    NEW.id,
    'auth',
    '/auth/callback',
    jsonb_build_object('provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'unknown'))
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$function$;
