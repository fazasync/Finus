-- 0006: trigger umum — updated_at, bootstrap profil, validasi kategori transaksi.

-- updated_at otomatis.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists balances_set_updated_at on public.balances;
create trigger balances_set_updated_at
  before update on public.balances
  for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- Buat profil otomatis saat akun baru terdaftar.
-- Saldo awal TIDAK dibuat di sini: baris balances dibuat saat pengguna menyimpan saldo awal
-- (agar aturan "saldo awal hanya diisi sekali" tetap sederhana dan eksplisit).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Pastikan transaksi hanya memakai kategori milik sendiri atau kategori sistem,
-- dan jenis kategori cocok dengan jenis transaksi. Berlaku juga di luar UI.
create or replace function public.validate_transaction_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  category_owner uuid;
  category_type text;
begin
  select c.user_id, c.type
    into category_owner, category_type
  from public.categories c
  where c.id = new.category_id;

  if category_type is null then
    raise exception 'Kategori tidak ditemukan.';
  end if;

  if category_owner is not null and category_owner <> new.user_id then
    raise exception 'Kategori bukan milik pengguna ini.';
  end if;

  if category_type <> new.type then
    raise exception 'Jenis kategori tidak cocok dengan jenis transaksi.';
  end if;

  return new;
end;
$$;

drop trigger if exists transactions_validate_category on public.transactions;
create trigger transactions_validate_category
  before insert or update of category_id, type, user_id on public.transactions
  for each row execute function public.validate_transaction_category();
