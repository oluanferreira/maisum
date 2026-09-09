create or replace function public.crm_commercial_stage(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path to 'public','pg_temp'
as $function$
  select case
    when exists (
      select 1 from public.subscriptions s
      where s.user_id = p_user_id
        and s.status::text = 'active'
        and s.current_period_end > now()
    ) then 'passport_active'
    when exists (
      select 1 from public.first_use_offers o
      where o.user_id = p_user_id
        and o.status = 'active'
        and o.expires_at > now()
    ) then 'passport_offer_active'
    when exists (
      select 1 from public.first_use_offers o
      where o.user_id = p_user_id
        and (o.status = 'expired' or (o.status = 'active' and o.expires_at <= now()))
    ) then 'passport_offer_expired'
    when exists (
      select 1
      from public.acquisition_redemptions ar
      join public.coupons c on c.id = ar.coupon_id
      where ar.user_id = p_user_id
        and c.status::text = 'available'
        and c.expires_at > now()
    ) then 'first_plusum_ready'
    when exists (
      select 1
      from public.acquisition_redemptions ar
      join public.coupons c on c.id = ar.coupon_id
      where ar.user_id = p_user_id
        and c.status::text = 'available'
        and c.expires_at <= now()
    ) then 'first_plusum_expired'
    when exists (select 1 from public.subscriptions s where s.user_id = p_user_id)
      or exists (select 1 from public.coupons c where c.user_id = p_user_id and c.status::text = 'used')
      or exists (
        select 1 from public.acquisition_redemptions ar
        join public.coupons c on c.id = ar.coupon_id
        where ar.user_id = p_user_id and c.status::text = 'used'
      )
      then 'passport_recovery'
    else 'first_plusum_eligible'
  end;
$function$;

create or replace function public.crm_commercial_funnel(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path to 'public','pg_temp'
as $function$
  select case
    when public.crm_commercial_stage(p_user_id) in ('first_plusum_eligible','first_plusum_ready','first_plusum_expired')
      then 'first_plusum'
    else 'passport'
  end;
$function$;

create or replace function public.get_crm_contacts_commercial(
  p_funnel text default null,
  p_commercial_stage text default null,
  p_limit integer default 500
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth','pg_temp'
as $function$
declare
  v_role public.user_role;
  v_result jsonb;
begin
  select public.get_user_role() into v_role;
  if v_role is distinct from 'super_admin'::public.user_role then
    raise exception 'forbidden';
  end if;

  if p_funnel is not null and p_funnel not in ('first_plusum','passport') then
    raise exception 'invalid_funnel';
  end if;

  with base as (
    select
      p.id as user_id,
      p.full_name,
      u.email,
      p.whatsapp_number,
      p.created_at,
      public.crm_lifecycle_stage(p.id) as lifecycle_stage,
      public.crm_commercial_funnel(p.id) as commercial_funnel,
      public.crm_commercial_stage(p.id) as commercial_stage,
      c.manual_status,
      c.owner_note,
      c.next_follow_up_at,
      c.last_whatsapp_opened_at,
      c.last_email_sent_at,
      c.do_not_contact_email,
      c.do_not_contact_whatsapp,
      coalesce(mp.email_opt_in,p.offer_contact_opt_in_at is not null) as email_opt_in,
      coalesce(mp.whatsapp_opt_in,p.offer_contact_opt_in_at is not null) as whatsapp_opt_in,
      mp.email_unsubscribed_at,
      mp.whatsapp_unsubscribed_at,
      ar.campaign_key,
      i.display_name as influencer_name,
      i.slug as influencer_slug,
      ar.offer_policy_key as acquisition_offer_policy_key,
      (select max(cp.used_at) from public.coupons cp where cp.user_id=p.id and cp.status::text='used') as last_use_at,
      (select max(pay.paid_at) from public.payments pay join public.subscriptions ss on ss.id=pay.subscription_id where ss.user_id=p.id and pay.status::text='paid') as last_purchase_at,
      (select max(o.expires_at) from public.first_use_offers o where o.user_id=p.id) as offer_expires_at,
      (select o.price_cents from public.first_use_offers o where o.user_id=p.id order by o.created_at desc limit 1) as offer_price_cents,
      exists(select 1 from public.acquisition_redemptions ar0 where ar0.user_id=p.id) as has_first_experience_redemption,
      exists(select 1 from public.subscriptions s0 where s0.user_id=p.id) as has_subscription_history,
      exists(select 1 from public.coupons cp0 where cp0.user_id=p.id and cp0.status::text='used') as has_usage_history
    from public.profiles p
    join auth.users u on u.id=p.id
    join public.crm_contacts c on c.user_id=p.id
    left join public.crm_marketing_preferences mp on mp.user_id=p.id
    left join lateral (
      select ar1.*
      from public.acquisition_redemptions ar1
      where ar1.user_id=p.id
      order by ar1.redeemed_at desc
      limit 1
    ) ar on true
    left join public.influencers i on i.id=ar.influencer_id
    where p.role::text='user'
      and c.excluded_at is null
  ), ranked as (
    select b.*,
      case b.commercial_stage
        when 'passport_offer_active' then 100
        when 'first_plusum_ready' then 90
        when 'passport_offer_expired' then 80
        when 'passport_recovery' then 70
        when 'first_plusum_expired' then 60
        when 'first_plusum_eligible' then 50
        when 'passport_active' then 10
        else 0
      end as priority_score
    from base b
    where (p_funnel is null or b.commercial_funnel=p_funnel)
      and (p_commercial_stage is null or b.commercial_stage=p_commercial_stage)
  )
  select coalesce(
    jsonb_agg(to_jsonb(r) order by r.priority_score desc,coalesce(r.next_follow_up_at,r.created_at) asc),
    '[]'::jsonb
  ) into v_result
  from (
    select * from ranked
    limit greatest(1,least(coalesce(p_limit,500),1000))
  ) r;

  return v_result;
end;
$function$;

grant execute on function public.crm_commercial_stage(uuid) to authenticated, service_role;
grant execute on function public.crm_commercial_funnel(uuid) to authenticated, service_role;
grant execute on function public.get_crm_contacts_commercial(text,text,integer) to authenticated, service_role;