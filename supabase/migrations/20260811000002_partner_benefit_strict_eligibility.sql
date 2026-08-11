-- Keep the partner benefit rule aligned with the product promise: an active
-- item must be available on at least four distinct days of the week.

create or replace function public.is_partner_benefit_eligible(
  p_restaurant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with active_items as (
    select exists (
      select 1
      from public.dishes d
      where d.restaurant_id = p_restaurant_id
        and coalesce(d.is_active, false) = true
    )
    or exists (
      select 1
      from public.benefits b
      where b.restaurant_id = p_restaurant_id
        and coalesce(b.is_active, false) = true
    ) as has_items
  ),
  scoped_rules as (
    select br.*
    from public.benefit_rules br
    where br.restaurant_id = p_restaurant_id
       or br.benefit_id in (
         select b.id
         from public.benefits b
         where b.restaurant_id = p_restaurant_id
       )
  ),
  active_rule_days as (
    select distinct day_value
    from scoped_rules sr
    cross join lateral unnest(
      coalesce(sr.available_days, array[]::integer[])
    ) as day_value
    where coalesce(sr.is_active, true) = true
  )
  select
    exists (
      select 1
      from public.restaurants r
      where r.id = p_restaurant_id
        and coalesce(r.is_active, false) = true
    )
    and (select has_items from active_items)
    and (select count(*) from active_rule_days) >= 4;
$$;
