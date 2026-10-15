-- 0002: balances — saldo awal per mata uang. Satu baris per (user, currency).
-- Baris dibuat saat pengguna pertama kali menyimpan saldo awal; setelah itu tidak diubah lagi dari UI.
create table if not exists public.balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  currency text not null check (currency in ('IDR', 'MYR')),
  initial_balance numeric(20, 2) not null default 0 check (initial_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint balances_user_currency_key unique (user_id, currency)
);

comment on table public.balances is 'Saldo awal per mata uang. Saldo berjalan = initial_balance + pemasukan - pengeluaran (dihitung, bukan disimpan).';

create index if not exists balances_user_id_idx on public.balances (user_id);
