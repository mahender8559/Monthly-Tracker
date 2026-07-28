alter table public.user_settings
  add column if not exists billing_cycle_start_day integer not null default 1
  check (billing_cycle_start_day between 1 and 28);
