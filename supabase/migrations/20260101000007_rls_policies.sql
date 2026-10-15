-- 0007: Row Level Security — batas keamanan utama aplikasi.
-- Frontend hanya memakai anon/publishable key; isolasi antar akun bergantung pada policy ini.

alter table public.profiles enable row level security;
alter table public.balances enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.exchange_rates enable row level security;

-- profiles ---------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- balances ---------------------------------------------------------------
drop policy if exists balances_select_own on public.balances;
create policy balances_select_own on public.balances
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists balances_insert_own on public.balances;
create policy balances_insert_own on public.balances
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists balances_update_own on public.balances;
create policy balances_update_own on public.balances
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists balances_delete_own on public.balances;
create policy balances_delete_own on public.balances
  for delete to authenticated
  using (user_id = auth.uid());

-- categories -------------------------------------------------------------
-- Baca: kategori sistem (user_id null) + kategori milik sendiri.
-- Tulis: hanya kategori milik sendiri; kategori sistem tidak dapat diubah klien.
drop policy if exists categories_select_visible on public.categories;
create policy categories_select_visible on public.categories
  for select to authenticated
  using (user_id is null or user_id = auth.uid());

drop policy if exists categories_insert_own on public.categories;
create policy categories_insert_own on public.categories
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists categories_update_own on public.categories;
create policy categories_update_own on public.categories
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists categories_delete_own on public.categories;
create policy categories_delete_own on public.categories
  for delete to authenticated
  using (user_id = auth.uid());

-- transactions -----------------------------------------------------------
drop policy if exists transactions_select_own on public.transactions;
create policy transactions_select_own on public.transactions
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists transactions_insert_own on public.transactions;
create policy transactions_insert_own on public.transactions
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists transactions_update_own on public.transactions;
create policy transactions_update_own on public.transactions
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists transactions_delete_own on public.transactions;
create policy transactions_delete_own on public.transactions
  for delete to authenticated
  using (user_id = auth.uid());

-- exchange_rates ---------------------------------------------------------
-- Append-only dari sisi klien: baris lama tidak diubah/dihapus.
drop policy if exists exchange_rates_select_own on public.exchange_rates;
create policy exchange_rates_select_own on public.exchange_rates
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists exchange_rates_insert_own on public.exchange_rates;
create policy exchange_rates_insert_own on public.exchange_rates
  for insert to authenticated
  with check (user_id = auth.uid());
