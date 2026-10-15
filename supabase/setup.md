# Setup Supabase

Panduan menyiapkan backend Supabase untuk Finus (Auth + Postgres + RLS).

## 1. Buat proyek

1. Masuk https://supabase.com/dashboard → **New project**.
2. Simpan **project ref**, **database password**, dan pilih region terdekat.
3. Tunggu sampai provisioning selesai.

## 2. Ambil kredensial untuk frontend

Dashboard → **Project Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / publishable key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Salin `.env.example` menjadi `.env.local` lalu isi keduanya:

```bash
copy .env.example .env.local
```

> Hanya key publik yang boleh masuk frontend. **Jangan** memakai `service_role` key di `.env.local`, kode klien, atau environment Vercel. Key itu melewati RLS.

## 3. Jalankan migration

Migration harus dijalankan **berurutan** pada schema `public`:

| File | Isi |
|---|---|
| `0001_profiles.sql` | Tabel `profiles` + constraint |
| `0002_balances.sql` | Tabel `balances` + unique `(user_id, currency)` |
| `0003_categories.sql` | Tabel `categories` + unique kategori sistem |
| `0004_transactions.sql` | Tabel `transactions` + constraint nilai + indeks |
| `0005_exchange_rates.sql` | Tabel `exchange_rates` + indeks |
| `0006_triggers.sql` | `updated_at`, bootstrap profil, validasi kategori transaksi |
| `0007_rls_policies.sql` | Aktifkan RLS + policy per tabel |

Pilih salah satu cara:

### A. SQL Editor (tanpa CLI)

Dashboard → **SQL Editor** → tempel isi file satu per satu secara berurutan → **Run**.
Setelah itu jalankan `seed.sql` untuk kategori sistem.

### B. Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

`db push` menjalankan semua file di `supabase/migrations/`. Untuk seed:

```bash
npx supabase db execute --file supabase/seed.sql
# atau tempel isi seed.sql ke SQL Editor
```

## 4. Aktifkan Email Auth

Dashboard → **Authentication → Providers → Email**: pastikan Email aktif.
Untuk pengembangan cepat, matikan **Confirm email** agar akun baru bisa langsung login.
Jika Confirm email aktif, tambahkan URL aplikasi ke **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (lokal) atau `https://<domain-vercel>` (produksi)
- **Redirect URLs**: tambahkan keduanya plus wildcard bila perlu, mis. `http://localhost:3000/**`

## 5. Yang otomatis terjadi

- **Akun baru** → trigger `on_auth_user_created` membuat baris `profiles` (timezone default `Asia/Jakarta`, mata uang utama `IDR`).
- **Kategori default** → kategori sistem (`user_id IS NULL`) dari `seed.sql`, tersedia untuk semua pengguna.
- **Saldo awal** tidak dibuat otomatis. Aplikasi membuat baris `balances` saat pengguna menyimpan saldo awal, sekali per mata uang.

## 6. Model keamanan

- RLS aktif pada `profiles`, `balances`, `categories`, `transactions`, `exchange_rates`.
- Policy hanya mengizinkan baris dengan `user_id = auth.uid()` (khusus `categories`: kategori sistem selalu terbaca, tetapi hanya bisa ditulis oleh service/trigger).
- Trigger `validate_transaction_category` menolak kategori milik pengguna lain dan kategori dengan jenis yang tidak cocok — berlaku meski request dikirim di luar UI.
- Tanpa login, tidak ada baris yang dapat dibaca/ditulis.

## 7. Verifikasi RLS (uji manual, disarankan)

Dengan dua akun A dan B:

1. Login sebagai A, buat beberapa transaksi.
2. Login sebagai B — daftar transaksi harus kosong, saldo B sendiri, dan percobaan mengubah transaksi A harus gagal.
3. Jalankan dari **SQL Editor** (berjalan sebagai `postgres`, jadi RLS dilewati) untuk memastikan datanya benar-benar ada, bukan hilang:

   ```sql
   select user_id, count(*) from public.transactions group by user_id;
   ```

Untuk menguji RLS pada level API, pakai anon key + access token pengguna A lewat `curl`/REST dan pastikan baris pengguna B tidak kembali.
