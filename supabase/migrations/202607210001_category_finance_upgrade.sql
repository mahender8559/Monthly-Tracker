-- Category-based finance upgrade. Existing ledger rows are retained unchanged.
create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  icon text not null default '📦',
  color text not null default '#6366f1',
  display_order integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  description text not null default '',
  amount numeric(14,2) not null check (amount >= 0),
  date date not null default current_date,
  month text not null,
  payment_method text not null default 'UPI' check (payment_method in ('Cash', 'UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Wallet')),
  notes text,
  transaction_type text not null default 'Actual Expense' check (transaction_type in ('Income', 'Planned Expense', 'Actual Expense', 'Future Purchase', 'Billed Credit Card', 'Unbilled Credit Card', 'Investment', 'Savings', 'Legacy Other')),
  recurring_frequency text check (recurring_frequency in ('Weekly', 'Monthly', 'Yearly')),
  next_due_date date,
  legacy_ledger_id text unique,
  created_at timestamptz not null default now()
);

-- Also updates a partially applied migration from an earlier run.
alter table public.transactions drop constraint if exists transactions_transaction_type_check;
alter table public.transactions add constraint transactions_transaction_type_check check (transaction_type in ('Income', 'Planned Expense', 'Actual Expense', 'Future Purchase', 'Billed Credit Card', 'Unbilled Credit Card', 'Investment', 'Savings', 'Legacy Other'));

create table if not exists public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month text not null,
  amount numeric(14,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

create index if not exists categories_user_order_idx on public.categories(user_id, display_order, name);
create index if not exists transactions_user_month_idx on public.transactions(user_id, month, date desc);
create index if not exists transactions_category_idx on public.transactions(category_id, date desc);

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.category_budgets enable row level security;

drop policy if exists "Users manage their categories" on public.categories;
create policy "Users manage their categories" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage their transactions" on public.transactions;
create policy "Users manage their transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage their category budgets" on public.category_budgets;
create policy "Users manage their category budgets" on public.category_budgets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Categories are intentionally user-created. No default rows are seeded for new accounts.

-- Lossless compatibility migration: legacy ledger remains available and each row is copied once.
do $$
begin
  if to_regclass('public.ledger') is not null then
    insert into public.categories (user_id, name, icon, color, display_order, is_default)
    select distinct l.user_id, l.category, '📦', '#6366f1', 999, false
    from public.ledger l
    where l.user_id is not null and coalesce(trim(l.category), '') <> ''
    on conflict (user_id, name) do nothing;

    insert into public.transactions (user_id, category_id, description, amount, date, month, payment_method, notes, transaction_type, legacy_ledger_id)
    select l.user_id, c.id, l.category, coalesce(l.amount, 0), coalesce(l.target_date, to_date(l.month || ' 01', 'FMMonth YYYY DD')), l.month,
      case when l.type in ('Billed Credit Card', 'Unbilled Credit Card') then 'Credit Card' else 'UPI' end,
      'Migrated from legacy ledger',
      case l.type
        when 'Future Purchases' then 'Future Purchase'
        when 'Summary' then case when l.category = 'Savings' then 'Savings' else 'Investment' end
        when 'Income' then 'Income'
        when 'Planned Expense' then 'Planned Expense'
        when 'Actual Expense' then 'Actual Expense'
        when 'Billed Credit Card' then 'Billed Credit Card'
        when 'Unbilled Credit Card' then 'Unbilled Credit Card'
        else 'Legacy Other'
      end,
      l.id::text
    from public.ledger l
    join public.categories c on c.user_id = l.user_id and c.name = l.category
    where l.user_id is not null and coalesce(trim(l.category), '') <> ''
    on conflict (legacy_ledger_id) do nothing;
  end if;
end $$;
