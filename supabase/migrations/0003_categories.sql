-- 0003: categories — kategori sistem (user_id null) dan kategori khusus pengguna.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 60),
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now(),
  constraint categories_user_type_name_key unique (user_id, type, name)
);

comment on table public.categories is 'user_id null = kategori sistem yang tersedia untuk semua pengguna.';

create index if not exists categories_user_type_idx on public.categories (user_id, type);

-- Kategori sistem tidak boleh duplikat per (type, name).
create unique index if not exists categories_system_type_name_key
  on public.categories (type, name)
  where user_id is null;
