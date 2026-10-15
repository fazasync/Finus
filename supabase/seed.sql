-- Kategori sistem default (user_id null) — tersedia untuk semua pengguna.
-- Aman dijalankan berulang kali.
insert into public.categories (user_id, name, type) values
  (null, 'Gaji', 'income'),
  (null, 'Bonus', 'income'),
  (null, 'Investasi', 'income'),
  (null, 'Pendapatan Lain', 'income'),
  (null, 'Makanan & Minuman', 'expense'),
  (null, 'Transportasi', 'expense'),
  (null, 'Belanja', 'expense'),
  (null, 'Tagihan', 'expense'),
  (null, 'Kesehatan', 'expense'),
  (null, 'Pendidikan', 'expense'),
  (null, 'Hiburan', 'expense'),
  (null, 'Rumah Tangga', 'expense'),
  (null, 'Lainnya', 'expense')
on conflict (type, name) where user_id is null do nothing;
