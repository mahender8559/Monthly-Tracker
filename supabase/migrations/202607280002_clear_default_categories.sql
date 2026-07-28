-- Remove seeded default categories for all users and unassign any linked transactions.
update public.transactions
set category_id = null
where category_id in (
  select id from public.categories where is_default = true
);

delete from public.category_budgets
where category_id in (
  select id from public.categories where is_default = true
);

delete from public.categories
where is_default = true;
