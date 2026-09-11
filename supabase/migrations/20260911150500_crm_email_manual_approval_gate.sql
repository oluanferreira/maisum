alter table public.crm_email_campaigns
  add column if not exists approval_status text not null default 'pending_approval',
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid,
  add column if not exists approval_note text,
  add column if not exists funnel_step_id uuid references public.crm_marketing_funnel_steps(id) on delete set null,
  add column if not exists theme_key text,
  add column if not exists send_window_label text,
  add column if not exists desired_send_time time,
  add column if not exists allowed_weekdays smallint[],
  add column if not exists headline text,
  add column if not exists body_text text,
  add column if not exists cta_label text,
  add column if not exists hero_image_url text,
  add column if not exists attribution_window_hours integer not null default 72;

do $$ begin
  if not exists(select 1 from pg_constraint where conname='crm_email_campaigns_approval_status_check') then
    alter table public.crm_email_campaigns add constraint crm_email_campaigns_approval_status_check check (approval_status in ('pending_approval','approved','rejected','legacy_sent'));
  end if;
  if not exists(select 1 from pg_constraint where conname='crm_email_campaigns_attribution_window_check') then
    alter table public.crm_email_campaigns add constraint crm_email_campaigns_attribution_window_check check (attribution_window_hours between 1 and 168);
  end if;
  if not exists(select 1 from pg_constraint where conname='crm_email_campaigns_allowed_weekdays_check') then
    alter table public.crm_email_campaigns add constraint crm_email_campaigns_allowed_weekdays_check check (allowed_weekdays is null or allowed_weekdays <@ array[0,1,2,3,4,5,6]::smallint[]);
  end if;
end $$;

create or replace function public.admin_set_crm_email_campaign_approval(p_campaign_id uuid,p_action text,p_note text default null)
returns jsonb language plpgsql security definer set search_path to 'public','auth','pg_temp' as $$
declare v_role public.user_role; v_status text;
begin
  select public.get_user_role() into v_role;
  if v_role is distinct from 'super_admin'::public.user_role then raise exception 'forbidden'; end if;
  select status into v_status from public.crm_email_campaigns where id=p_campaign_id for update;
  if v_status is null then return jsonb_build_object('ok',false,'error','not_found'); end if;
  if v_status in ('sending','sent','cancelled') then return jsonb_build_object('ok',false,'error','immutable_status'); end if;
  if p_action='approve' then
    update public.crm_email_campaigns set approval_status='approved',approved_at=now(),approved_by=auth.uid(),approval_note=nullif(btrim(coalesce(p_note,'')),''),updated_at=now() where id=p_campaign_id;
  elsif p_action='revoke' then
    update public.crm_email_campaigns set approval_status='pending_approval',approved_at=null,approved_by=null,approval_note=nullif(btrim(coalesce(p_note,'')),''),updated_at=now() where id=p_campaign_id;
  elsif p_action='reject' then
    update public.crm_email_campaigns set approval_status='rejected',approved_at=null,approved_by=auth.uid(),approval_note=nullif(btrim(coalesce(p_note,'')),''),updated_at=now() where id=p_campaign_id;
  else return jsonb_build_object('ok',false,'error','invalid_action');
  end if;
  return jsonb_build_object('ok',true);
end $$;

create or replace function public.crm_queue_email_campaign(p_campaign_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','auth','pg_temp' as $$
declare v_role public.user_role; v_campaign public.crm_email_campaigns%rowtype; v_count integer:=0;
begin
  select public.get_user_role() into v_role;
  if v_role is distinct from 'super_admin'::public.user_role then raise exception 'forbidden'; end if;
  select * into v_campaign from public.crm_email_campaigns where id=p_campaign_id for update;
  if v_campaign.id is null then return jsonb_build_object('ok',false,'error','not_found'); end if;
  if v_campaign.status not in ('draft','queued') then return jsonb_build_object('ok',false,'error','invalid_status'); end if;
  if v_campaign.approval_status <> 'approved' then return jsonb_build_object('ok',false,'error','approval_required'); end if;
  if v_campaign.funnel_step_id is not null and v_campaign.scheduled_at is null then return jsonb_build_object('ok',false,'error','schedule_required'); end if;
  insert into public.crm_email_outbox(campaign_id,user_id,destination,scheduled_at)
  select v_campaign.id,p.id,u.email,coalesce(v_campaign.scheduled_at,now())
  from public.profiles p join auth.users u on u.id=p.id
  left join public.crm_marketing_preferences mp on mp.user_id=p.id
  left join public.crm_contacts cc on cc.user_id=p.id
  where p.role::text='user' and nullif(btrim(coalesce(u.email,'')),'') is not null
    and coalesce(mp.email_opt_in,p.offer_contact_opt_in_at is not null)=true
    and mp.email_unsubscribed_at is null and coalesce(cc.do_not_contact_email,false)=false and cc.excluded_at is null
    and (v_campaign.segment='all_opted_in' or public.crm_lifecycle_stage(p.id)=v_campaign.segment or public.crm_commercial_stage(p.id)=v_campaign.segment)
  on conflict(campaign_id,user_id) do nothing;
  get diagnostics v_count=row_count;
  update public.crm_email_campaigns set status='queued',updated_at=now() where id=v_campaign.id;
  return jsonb_build_object('ok',true,'queued',v_count);
end $$;

create or replace function public.claim_due_crm_emails(p_limit integer default 50)
returns table(id uuid,campaign_id uuid,user_id uuid,destination text,subject text,preview_text text,html_body text,attempts integer)
language plpgsql security definer set search_path to 'public','pg_temp' as $$
begin
  return query with picked as (
    select o.id from public.crm_email_outbox o join public.crm_email_campaigns cam on cam.id=o.campaign_id
    where o.status='pending' and o.scheduled_at<=now() and cam.approval_status='approved'
    order by o.scheduled_at,o.created_at for update of o skip locked limit greatest(1,least(coalesce(p_limit,50),100))
  ), claimed as (
    update public.crm_email_outbox o set status='processing',attempts=o.attempts+1 from picked p where o.id=p.id returning o.*
  )
  select c.id,c.campaign_id,c.user_id,c.destination,cam.subject,cam.preview_text,cam.html_body,c.attempts from claimed c join public.crm_email_campaigns cam on cam.id=c.campaign_id;
end $$;

revoke all on function public.admin_set_crm_email_campaign_approval(uuid,text,text) from public,anon;
grant execute on function public.admin_set_crm_email_campaign_approval(uuid,text,text) to authenticated;
