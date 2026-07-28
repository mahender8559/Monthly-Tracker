-- Days 29–31 use the last calendar day when a month is shorter.
alter table public.user_settings
  drop constraint if exists user_settings_billing_cycle_start_day_check;

alter table public.user_settings
  add constraint user_settings_billing_cycle_start_day_check
  check (billing_cycle_start_day between 1 and 31);
