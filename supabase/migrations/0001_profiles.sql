-- 0001: profiles — preferensi pengguna, satu baris per auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  base_currency text not null default 'IDR' check (base_currency in ('IDR', 'MYR')),
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Preferensi per pengguna; id sama dengan auth.users.id.';
comment on column public.profiles.timezone is 'Nama zona waktu IANA, mis. Asia/Makassar. Dipakai untuk batas hari & periode laporan.';
