create table if not exists public.crm_marketing_funnels (
  id uuid primary key default gen_random_uuid(), funnel_key text not null unique, category text not null, name text not null,
  description text, status text not null default 'draft' check (status in ('draft','active','paused','archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.crm_marketing_funnel_steps (
  id uuid primary key default gen_random_uuid(), funnel_id uuid not null references public.crm_marketing_funnels(id) on delete cascade,
  step_key text not null, position integer not null default 1, name text not null, description text, trigger_stage text,
  channel text not null default 'email' check (channel in ('email','whatsapp','system')),
  status text not null default 'draft' check (status in ('draft','active','paused','archived')),
  delay_minutes integer not null default 0 check (delay_minutes >= 0), experiment_key text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(funnel_id, step_key)
);

create table if not exists public.crm_marketing_email_variants (
  id uuid primary key default gen_random_uuid(), step_id uuid not null references public.crm_marketing_funnel_steps(id) on delete cascade,
  variant_key text not null, subject text not null, preheader text, headline text, body_text text not null,
  cta_label text not null, cta_path text not null, weight integer not null default 100 check (weight > 0), is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(step_id, variant_key)
);

alter table public.crm_marketing_funnels enable row level security;
alter table public.crm_marketing_funnel_steps enable row level security;
alter table public.crm_marketing_email_variants enable row level security;
revoke all on public.crm_marketing_funnels from anon, authenticated;
revoke all on public.crm_marketing_funnel_steps from anon, authenticated;
revoke all on public.crm_marketing_email_variants from anon, authenticated;

do $$
declare v_funnel_id uuid; v_step_id uuid;
begin
  insert into public.crm_marketing_funnels(funnel_key,category,name,description,status,updated_at)
  values('meu_primeiro_plusum','Aquisição','Meu Primeiro +UM','Levar pessoas elegíveis da descoberta até a ativação e primeiro uso do Meu Primeiro +UM.','draft',now())
  on conflict(funnel_key) do update set category=excluded.category,name=excluded.name,description=excluded.description,updated_at=now()
  returning id into v_funnel_id;

  insert into public.crm_marketing_funnel_steps(funnel_id,step_key,position,name,description,trigger_stage,channel,status,delay_minutes,experiment_key,updated_at)
  values(v_funnel_id,'invite_initial',1,'Convite inicial','Primeiro contato para gerar abertura, clique e ativação do Meu Primeiro +UM.','first_plusum_eligible','email','draft',0,'meu-primeiro-plusum-email-ab-202609',now())
  on conflict(funnel_id,step_key) do update set position=excluded.position,name=excluded.name,description=excluded.description,trigger_stage=excluded.trigger_stage,channel=excluded.channel,experiment_key=excluded.experiment_key,updated_at=now()
  returning id into v_step_id;

  insert into public.crm_marketing_email_variants(step_id,variant_key,subject,preheader,headline,body_text,cta_label,cta_path,weight,is_active,updated_at)
  values
    (v_step_id,'A','VOCÊ GANHOU SEU PRIMEIRO +UM','Escolha uma experiência. Leve alguém. Viva a cidade em dobro.','Seu primeiro +UM começa aqui.',E'Oi, {{nome}}.\n\nTem coisas que são melhores de viver do que de explicar.\n\nPor isso, seu Meu Primeiro +UM é por nossa conta.\n\nEscolha uma experiência em Vitória da Conquista.\nLeve alguém com você.\nPeça 1 e ganhe +1.\n\nSem assinatura para começar.\n\nPrimeiro, viva a experiência.\nDepois, você decide se quer mais cidade, mais histórias e mais +UM.\n\n+UM\nViva a cidade em dobro.','QUERO MEU PRIMEIRO +UM','/ativar/UM-ZRPLK4AM6L4CK25B5P',100,true,now()),
    (v_step_id,'B','VOCÊ GANHOU UMA EXPERIÊNCIA EM DOBRO','Seu primeiro +UM está liberado. Escolha onde usar e leve alguém com você.','Uma experiência. Em dobro.',E'Oi, {{nome}}.\n\nTem lugares que você quer conhecer.\nE tem gente que faz qualquer experiência ficar melhor.\n\nNo seu Meu Primeiro +UM, você escolhe os dois.\n\nEscolha onde ir.\nLeve alguém com você.\n\nVocês pedem dois itens participantes.\nVocê paga por um.\n\nO +1 é por nossa conta.\n\nSeu primeiro +UM já está liberado.\n\nAgora só falta escolher onde viver a experiência — e quem vai viver com você.\n\n+UM\nViva a cidade em dobro.','RESGATAR MEU +UM','/ativar/UM-ZRPLK4AM6L4CK25B5P',100,true,now()),
    (v_step_id,'C','O +UM TE DEU UM PRESENTE','Tem um +UM esperando por você. É por nossa conta.','Tem um +UM esperando por você.',E'Oi, {{nome}}.\n\nA gente podia te mandar mais um e-mail contando como o +UM funciona.\n\nPreferimos te dar um presente.\n\nSeu primeiro +UM.\n\nEscolha uma experiência em Vitória da Conquista, leve alguém com você e aproveite:\n\n1 pedido + 1 por conta do +UM.\n\nÉ simples assim.\n\nSem precisar assinar para usar.\n\nSeu presente já está liberado.\nAgora só falta escolher onde aproveitar.\n\n+UM\nViva a cidade em dobro.','RESGATAR MEU PRESENTE','/ativar/UM-ZRPLK4AM6L4CK25B5P',100,true,now())
  on conflict(step_id,variant_key) do update set subject=excluded.subject,preheader=excluded.preheader,headline=excluded.headline,body_text=excluded.body_text,cta_label=excluded.cta_label,cta_path=excluded.cta_path,weight=excluded.weight,is_active=excluded.is_active,updated_at=now();

  insert into public.crm_marketing_funnel_steps(funnel_id,step_key,position,name,description,trigger_stage,channel,status,delay_minutes,updated_at)
  values
    (v_funnel_id,'activated_not_used',2,'Ativou, ainda não usou','Nutrição depois da ativação para levar ao primeiro uso.','first_plusum_ready','email','paused',0,now()),
    (v_funnel_id,'first_use_completed',3,'Primeiro +UM utilizado','Fechamento do funil de experiência e transição para o funil Passaporte.','passport_offer_active','system','paused',0,now())
  on conflict(funnel_id,step_key) do update set position=excluded.position,name=excluded.name,description=excluded.description,trigger_stage=excluded.trigger_stage,channel=excluded.channel,updated_at=now();
end $$;

create or replace function public.render_crm_marketing_email(p_headline text,p_body text,p_cta_label text,p_cta_path text)
returns text language plpgsql immutable set search_path to 'public','pg_temp' as $$
declare v_body text;
begin
  v_body := replace(replace(replace(replace(replace(coalesce(p_body,''),'&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;'),'''','&#039;');
  v_body := replace(v_body,E'\n\n','</p><p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#27231f">');
  v_body := replace(v_body,E'\n','<br>');
  return '<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:32px 18px"><div style="font-size:34px;font-weight:800;color:#e55934;margin-bottom:24px">+UM</div><div style="background:#ffffff;border-radius:20px;padding:28px"><h1 style="margin:0 0 22px;font-size:30px;line-height:1.15;color:#171412">'||coalesce(p_headline,'')||'</h1><p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#27231f">'||v_body||'</p><p style="margin:26px 0 0"><a href="'||coalesce(p_cta_path,'/')||'" style="display:inline-block;background:#e55934;color:#fff;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:999px">'||coalesce(p_cta_label,'Abrir o +UM')||'</a></p></div><p style="font-size:12px;line-height:1.5;color:#777;margin:18px 6px 0">Você recebe novidades porque autorizou comunicações do +UM. Você pode alterar suas preferências no seu perfil.</p></div></body></html>';
end; $$;

update public.crm_email_campaigns c set subject=v.subject,preview_text=v.preheader,html_body=public.render_crm_marketing_email(v.headline,v.body_text,v.cta_label,v.cta_path),cta_path=v.cta_path,updated_at=now()
from public.crm_marketing_email_variants v join public.crm_marketing_funnel_steps s on s.id=v.step_id
where c.experiment_key=s.experiment_key and c.variant_key=v.variant_key and c.status='draft';

create or replace function public.admin_update_crm_marketing_step(p_step_id uuid,p_name text,p_description text,p_status text,p_delay_minutes integer)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp' as $$
declare v_role public.user_role;
begin
  select public.get_user_role() into v_role; if v_role is distinct from 'super_admin'::public.user_role then raise exception 'forbidden'; end if;
  if p_status not in ('draft','active','paused','archived') then return jsonb_build_object('ok',false,'error','invalid_status'); end if;
  if p_delay_minutes < 0 then return jsonb_build_object('ok',false,'error','invalid_delay'); end if;
  update public.crm_marketing_funnel_steps set name=btrim(p_name),description=nullif(btrim(coalesce(p_description,'')),''),status=p_status,delay_minutes=p_delay_minutes,updated_at=now() where id=p_step_id;
  if not found then return jsonb_build_object('ok',false,'error','not_found'); end if; return jsonb_build_object('ok',true);
end; $$;

create or replace function public.admin_update_crm_marketing_email_variant(p_variant_id uuid,p_subject text,p_preheader text,p_headline text,p_body_text text,p_cta_label text,p_cta_path text,p_is_active boolean default true)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp' as $$
declare v_role public.user_role; v_experiment_key text; v_variant_key text; v_html text;
begin
  select public.get_user_role() into v_role; if v_role is distinct from 'super_admin'::public.user_role then raise exception 'forbidden'; end if;
  if nullif(btrim(coalesce(p_subject,'')),'') is null or nullif(btrim(coalesce(p_body_text,'')),'') is null or nullif(btrim(coalesce(p_cta_label,'')),'') is null or nullif(btrim(coalesce(p_cta_path,'')),'') is null then return jsonb_build_object('ok',false,'error','invalid_input'); end if;
  update public.crm_marketing_email_variants v set subject=btrim(p_subject),preheader=nullif(btrim(coalesce(p_preheader,'')),''),headline=nullif(btrim(coalesce(p_headline,'')),''),body_text=p_body_text,cta_label=btrim(p_cta_label),cta_path=btrim(p_cta_path),is_active=coalesce(p_is_active,true),updated_at=now()
  where v.id=p_variant_id returning v.variant_key,(select s.experiment_key from public.crm_marketing_funnel_steps s where s.id=v.step_id),public.render_crm_marketing_email(nullif(btrim(coalesce(p_headline,'')),''),p_body_text,btrim(p_cta_label),btrim(p_cta_path)) into v_variant_key,v_experiment_key,v_html;
  if v_variant_key is null then return jsonb_build_object('ok',false,'error','not_found'); end if;
  if v_experiment_key is not null then update public.crm_email_campaigns set subject=btrim(p_subject),preview_text=nullif(btrim(coalesce(p_preheader,'')),''),html_body=v_html,cta_path=btrim(p_cta_path),updated_at=now() where experiment_key=v_experiment_key and variant_key=v_variant_key and status='draft'; end if;
  return jsonb_build_object('ok',true);
end; $$;

create or replace function public.get_crm_marketing_funnels_dashboard()
returns jsonb language plpgsql security definer set search_path to 'public','auth','pg_temp' as $$
declare v_role public.user_role; v_result jsonb;
begin
  select public.get_user_role() into v_role; if v_role is distinct from 'super_admin'::public.user_role then raise exception 'forbidden'; end if;
  with funnel_rows as (
    select f.id,f.funnel_key,f.category,f.name,f.description,f.status,f.created_at,f.updated_at,
      case when f.funnel_key='meu_primeiro_plusum' then jsonb_build_object(
        'eligible',(select count(*) from public.profiles p join public.crm_contacts c on c.user_id=p.id where p.role::text='user' and c.excluded_at is null and public.crm_commercial_stage(p.id)='first_plusum_eligible'),
        'email_sent',(select count(*) from public.crm_email_outbox o join public.crm_email_campaigns c2 on c2.id=o.campaign_id where c2.experiment_key='meu-primeiro-plusum-email-ab-202609' and o.status='sent'),
        'opened',(select count(distinct e.outbox_id) from public.crm_email_tracking_events e join public.crm_email_outbox o on o.id=e.outbox_id join public.crm_email_campaigns c2 on c2.id=o.campaign_id where c2.experiment_key='meu-primeiro-plusum-email-ab-202609' and e.event_type='open'),
        'clicked',(select count(distinct e.outbox_id) from public.crm_email_tracking_events e join public.crm_email_outbox o on o.id=e.outbox_id join public.crm_email_campaigns c2 on c2.id=o.campaign_id where c2.experiment_key='meu-primeiro-plusum-email-ab-202609' and e.event_type='click'),
        'activated',(select count(*) from public.acquisition_redemptions ar where ar.utm_campaign='meu_primeiro_plusum_ab_202609'),
        'first_use',(select count(*) from public.acquisition_redemptions ar join public.coupons cp on cp.id=ar.coupon_id where ar.utm_campaign='meu_primeiro_plusum_ab_202609' and cp.status::text='used')) else '{}'::jsonb end as metrics,
      (select coalesce(jsonb_agg(jsonb_build_object(
        'id',s.id,'step_key',s.step_key,'position',s.position,'name',s.name,'description',s.description,'trigger_stage',s.trigger_stage,'channel',s.channel,'status',s.status,'delay_minutes',s.delay_minutes,'experiment_key',s.experiment_key,
        'metrics',case when s.step_key='invite_initial' then jsonb_build_object(
          'assigned',(select count(*) from public.crm_email_experiment_assignments a where a.experiment_key=s.experiment_key),
          'sent',(select count(*) from public.crm_email_outbox o join public.crm_email_campaigns c2 on c2.id=o.campaign_id where c2.experiment_key=s.experiment_key and o.status='sent'),
          'opened',(select count(distinct e.outbox_id) from public.crm_email_tracking_events e join public.crm_email_outbox o on o.id=e.outbox_id join public.crm_email_campaigns c2 on c2.id=o.campaign_id where c2.experiment_key=s.experiment_key and e.event_type='open'),
          'clicked',(select count(distinct e.outbox_id) from public.crm_email_tracking_events e join public.crm_email_outbox o on o.id=e.outbox_id join public.crm_email_campaigns c2 on c2.id=o.campaign_id where c2.experiment_key=s.experiment_key and e.event_type='click'),
          'activated',(select count(*) from public.acquisition_redemptions ar where ar.utm_campaign='meu_primeiro_plusum_ab_202609'))
          when s.step_key='activated_not_used' then jsonb_build_object('contacts',(select count(*) from public.profiles p join public.crm_contacts c on c.user_id=p.id where c.excluded_at is null and public.crm_commercial_stage(p.id)='first_plusum_ready'))
          when s.step_key='first_use_completed' then jsonb_build_object('contacts',(select count(*) from public.acquisition_redemptions ar join public.coupons cp on cp.id=ar.coupon_id where cp.status::text='used')) else '{}'::jsonb end,
        'variants',(select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'variant_key',v.variant_key,'subject',v.subject,'preheader',v.preheader,'headline',v.headline,'body_text',v.body_text,'cta_label',v.cta_label,'cta_path',v.cta_path,'weight',v.weight,'is_active',v.is_active) order by v.variant_key),'[]'::jsonb) from public.crm_marketing_email_variants v where v.step_id=s.id)) order by s.position),'[]'::jsonb)
       from public.crm_marketing_funnel_steps s where s.funnel_id=f.id) as steps
    from public.crm_marketing_funnels f)
  select coalesce(jsonb_agg(to_jsonb(fr) order by fr.category,fr.name),'[]'::jsonb) into v_result from funnel_rows fr;
  return v_result;
end; $$;

grant execute on function public.get_crm_marketing_funnels_dashboard() to authenticated;
grant execute on function public.admin_update_crm_marketing_step(uuid,text,text,text,integer) to authenticated;
grant execute on function public.admin_update_crm_marketing_email_variant(uuid,text,text,text,text,text,text,boolean) to authenticated;