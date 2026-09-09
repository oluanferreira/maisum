create table if not exists public.crm_automation_controls (
  id smallint primary key default 1 check (id = 1),
  email_lifecycle_enabled boolean not null default false,
  whatsapp_lifecycle_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.crm_automation_controls(id,email_lifecycle_enabled,whatsapp_lifecycle_enabled)
values(1,false,false)
on conflict(id) do update set
  email_lifecycle_enabled=false,
  whatsapp_lifecycle_enabled=false,
  updated_at=now();

alter table public.crm_automation_controls enable row level security;
revoke all on public.crm_automation_controls from anon, authenticated;
grant select on public.crm_automation_controls to service_role;

create or replace function public.queue_lifecycle_email(
  p_user_id uuid,
  p_funnel_key text,
  p_step_key text,
  p_source_key text,
  p_template_key text,
  p_scheduled_at timestamptz,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path to 'public','auth','pg_temp'
as $function$
declare
  v_email text;
  v_enabled boolean := false;
begin
  select email_lifecycle_enabled into v_enabled
  from public.crm_automation_controls
  where id=1;

  if coalesce(v_enabled,false)=false then return; end if;

  select email into v_email from auth.users where id=p_user_id;
  if nullif(btrim(coalesce(v_email,'')),'') is null then return; end if;

  insert into public.lifecycle_email_outbox(user_id,funnel_key,step_key,source_key,destination,template_key,payload,scheduled_at)
  values(p_user_id,p_funnel_key,p_step_key,p_source_key,v_email,p_template_key,coalesce(p_payload,'{}'::jsonb),p_scheduled_at)
  on conflict(user_id,funnel_key,step_key,source_key) do nothing;
end;
$function$;

create or replace function public.guard_offer_notification_opt_in()
returns trigger
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_enabled boolean := false;
begin
  select whatsapp_lifecycle_enabled into v_enabled
  from public.crm_automation_controls
  where id=1;

  if coalesce(v_enabled,false)=false then return null; end if;
  if exists (select 1 from public.profiles where id=NEW.user_id and offer_contact_opt_in_at is not null) then return NEW; end if;
  return null;
end;
$function$;

update public.lifecycle_email_outbox
set status='cancelled', last_error='automation_paused_for_copy_review'
where status in ('pending','processing');

update public.offer_notification_outbox
set status='skipped', last_error='automation_paused_for_copy_review'
where status in ('pending','processing');