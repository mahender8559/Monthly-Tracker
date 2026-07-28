-- Cleans up installations that ran the original category migration with default seeding enabled.
drop trigger if exists on_auth_user_created_categories on auth.users;
drop function if exists public.handle_new_user_categories();
drop function if exists public.seed_default_categories(uuid);

-- Keep categories that are already referenced by migrated transactions, but remove unused seeded examples.
delete from public.categories c
where c.is_default = true
  and not exists (select 1 from public.transactions t where t.category_id = c.id);

-- Referenced categories are real user data after migration, not defaults.
update public.categories set is_default = false where is_default = true;
