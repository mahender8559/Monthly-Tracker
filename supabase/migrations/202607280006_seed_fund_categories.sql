-- Savings and Investments are required transaction categories used to keep the
-- liquid-funds KPI in sync.
insert into public.categories (user_id, name, icon, color, display_order, is_default)
select u.id, required.name, required.icon, required.color, required.display_order, true
from auth.users u
cross join (values
  ('Savings', '💰', '#8b5cf6', -2),
  ('Investments', '📈', '#4f46e5', -1)
) as required(name, icon, color, display_order)
on conflict (user_id, name) do update set is_default = true;

create or replace function public.seed_required_fund_categories()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.categories (user_id, name, icon, color, display_order, is_default)
  values
    (new.id, 'Savings', '💰', '#8b5cf6', -2, true),
    (new.id, 'Investments', '📈', '#4f46e5', -1, true)
  on conflict (user_id, name) do update set is_default = true;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_required_fund_categories on auth.users;
create trigger on_auth_user_created_required_fund_categories
  after insert on auth.users
  for each row execute function public.seed_required_fund_categories();
