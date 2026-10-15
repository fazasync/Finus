-- 0004: transactions — pemasukan & pengeluaran.
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  type text not null check (type in ('income', 'expense')),
  description text not null check (length(btrim(description)) between 1 and 200),
  amount numeric(20, 2) not null check (amount > 0),
  currency text not null check (currency in ('IDR', 'MYR')),
  exchange_rate numeric(20, 6) check (exchange_rate is null or exchange_rate > 0),
  transaction_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.transactions is 'Nominal selalu positif; jenis menentukan arah. exchange_rate = snapshot IDR per 1 MYR saat transaksi dibuat (null bila tidak perlu konversi).';

create index if not exists transactions_user_at_idx on public.transactions (user_id, transaction_at desc);
create index if not exists transactions_user_type_idx on public.transactions (user_id, type);
create index if not exists transactions_user_currency_idx on public.transactions (user_id, currency);
create index if not exists transactions_user_category_idx on public.transactions (user_id, category_id);
