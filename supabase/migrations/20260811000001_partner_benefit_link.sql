-- Generate the short-lived link used to connect a partner benefit after Google OAuth.
--
-- The link-token tables and the eligibility/connect RPCs are already part of the
-- +um app database. This function is intentionally the only write entry point
-- exposed to restaurant admins: the raw token never gets stored, and the caller
-- must own the restaurant (or be a super admin).

create or replace function public.create_partner_user_benefit_link_token(
  p_restaurant_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_token text;
  v_expires_at timestamptz := now() + interval '15 minutes';
  v_eligible boolean;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'unauthenticated');
  end if;

  if not exists (
    select 1
    from public.restaurants r
    where r.id = p_restaurant_id
      and coalesce(r.is_active, false) = true
      and (
        r.admin_user_id = v_user_id
        or public.get_user_role() = 'super_admin'
      )
  ) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  v_eligible := public.is_partner_benefit_eligible(p_restaurant_id);
  if not v_eligible then
    return jsonb_build_object(
      'ok', false,
      'eligible', false,
      'error', 'not_eligible'
    );
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.partner_user_benefit_link_tokens (
    token_hash,
    restaurant_id,
    created_by,
    expires_at
  ) values (
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    p_restaurant_id,
    v_user_id,
    v_expires_at
  );

  return jsonb_build_object(
    'ok', true,
    'eligible', true,
    'token', v_token,
    'expires_at', v_expires_at
  );
end;
$$;

revoke all on function public.create_partner_user_benefit_link_token(uuid) from public;
grant execute on function public.create_partner_user_benefit_link_token(uuid) to authenticated;
