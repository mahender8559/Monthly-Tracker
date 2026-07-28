alter table public.categories
  add column if not exists show_in_comparison boolean not null default true;
