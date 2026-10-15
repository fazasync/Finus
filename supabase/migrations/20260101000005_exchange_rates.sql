-- 0005: exchange_rates — riwayat kurs manual (append-only). rate = IDR per 1 MYR.
create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rate numeric(20, 6) not null check (rate > 0),
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.exchange_rates is 'Riwayat kurs; pembaruan selalu menambah baris baru. Transaksi lama menyimpan snapshot sendiri.';
comment on column public.exchange_rates.rate is 'Jumlah IDR untuk 1 MYR. Harus > 0.';

create index if not exists exchange_rates_user_effective_idx
  on public.exchange_rates (user_id, effective_at desc);
