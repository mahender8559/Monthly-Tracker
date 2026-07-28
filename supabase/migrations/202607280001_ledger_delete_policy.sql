-- Ensure ledger rows can be deleted and edited by the owning user.
create table if not exists public.ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  category text not null,
  amount numeric(14,2) not null default 0,
  type text not null,
  target_date date,
  created_at timestamptz not null default now()
);

alter table public.ledger add column if not exists user_id uuid;
alter table public.ledger add column if not exists month text;
alter table public.ledger add column if not exists category text;
alter table public.ledger add column if not exists amount numeric(14,2);
alter table public.ledger add column if not exists type text;
alter table public.ledger add column if not exists target_date date;
alter table public.ledger add column if not exists created_at timestamptz default now();

alter table public.ledger alter column user_id set not null;
alter table public.ledger alter column month set not null;
alter table public.ledger alter column category set not null;
alter table public.ledger alter column amount set default 0;
alter table public.ledger alter column type set not null;

alter table public.ledger enable row level security;

drop policy if exists "Users manage their ledger" on public.ledger;
create policy "Users manage their ledger" on public.ledger for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
