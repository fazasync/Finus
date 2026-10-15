# Finus — Personal Finance Tracker (IDR / MYR)

Aplikasi web pencatatan keuangan pribadi: mencatat pemasukan/pengeluaran, memantau saldo IDR dan MYR secara terpisah, mengatur kurs manual, mencari riwayat transaksi, dan melihat laporan pengeluaran tujuh hari terakhir.

Kebutuhan produk, aturan bisnis, dan spesifikasi desain ada di `.agents/prd.md` dan `.agents/design.md`.

## Stack

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, `cacheComponents`) |
| UI | React 19, Tailwind CSS v4 (CSS-first, tanpa `tailwind.config.*`) |
| Bahasa | TypeScript strict |
| Data & Auth | Supabase (`@supabase/supabase-js`) — Postgres + Supabase Auth, RLS wajib |
| Grafik | Recharts |
| Test | Vitest |
| Deploy | Vercel |

Catatan: repo ini memakai Next.js App Router. Struktur `src/`, React Router, dan env `VITE_*` yang disebut di `.agents/task-instruction.md` **tidak** dipakai; pemetaan adaptasinya ada di `.agents/task-todolist.md`.

## Persyaratan

- Node.js 22+ (dikembangkan pada Node 24)
- npm
- Proyek Supabase (gratis cukup) untuk fitur autentikasi dan data

## Instalasi

```bash
npm install
```

## Environment Variables

Salin contoh lalu isi kredensial Supabase:

```bash
copy .env.example .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon/publishable-key>
```

Ambil dari Supabase Dashboard → **Project Settings → API**.

> Semua variabel `NEXT_PUBLIC_*` ikut ter-bundle ke browser. **Jangan pernah** menaruh `service_role` key (atau secret apa pun) di variabel `NEXT_PUBLIC_*`, di kode klien, atau di environment Vercel frontend. Key itu melewati RLS dan akan membocorkan seluruh data.

## Development

```bash
npm run dev
```

Buka http://localhost:3000

## Perintah Pemeriksaan

```bash
npm run lint        # ESLint (flat config)
npx tsc --noEmit    # Type-check (belum ada script npm terpisah)
npx vitest run      # Unit test logika (saldo, konversi, laporan, tanggal)
npm run build       # Production build
```

## Database (Supabase)

Semua skema, constraint, trigger, dan policy RLS ada di `supabase/migrations/`, dengan panduan langkah demi langkah di [`supabase/setup.md`](supabase/setup.md). Ada juga `supabase/seed.sql` untuk kategori awal (biasanya tidak perlu karena bootstrap kategori dijalankan otomatis saat akun dibuat).

Ringkas, salah satu dari:

1. **Dashboard SQL Editor** — jalankan isi setiap file di `supabase/migrations/` secara berurutan (`0001_...` → `0006_...`).
2. **Supabase CLI**:
   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   ```

## Keamanan & RLS

- Row Level Security **aktif di semua tabel data pengguna**. Setiap policy mencocokkan pemilik baris dengan `auth.uid()`; permintaan tanpa login ditolak.
- Isolasi akun tidak bergantung pada UI. Route guard di aplikasi hanya untuk pengalaman pengguna — batas keamanan sebenarnya adalah policy RLS, yang tetap berlaku meski request dibuat di luar aplikasi.
- Frontend hanya memakai **anon/publishable key** bersama RLS. `service_role` key tidak pernah ada di kode atau environment frontend.
- Saldo selalu dihitung dari `initial_balance` + transaksi tersimpan, bukan dari nilai yang dikirim browser.

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Di Vercel, **Import Git Repository** (preset framework Next.js terdeteksi otomatis; biarkan build command default `next build`).
3. Tambahkan environment variables `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (jangan `service_role`).
4. Terapkan migration ke proyek Supabase produksi (lihat `supabase/setup.md`).
5. Di Supabase → **Authentication → URL Configuration**, tambahkan domain Vercel ke **Site URL** dan **Redirect URLs**.
6. Deploy, lalu uji login, CRUD transaksi, saldo, kurs, laporan, dan logout dari HP maupun desktop.

## Struktur Proyek

```text
app/
  (auth)/            # halaman login & register
  (app)/             # area privat: dashboard, transactions, reports, settings
components/
  ui/                # button, input, card, dialog, badge, toast, state
  layout/            # AppShell, sidebar desktop, bottom nav mobile, PageHeader
  transactions/ dashboard/ reports/ providers/
lib/
  supabase/          # konfigurasi client
  currency.ts date.ts balance.ts validation.ts
supabase/
  migrations/ seed.sql setup.md
types/
```
