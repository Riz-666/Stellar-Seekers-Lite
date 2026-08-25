# Community Hub — Setup Guide

## 🚀 Cara Deploy

### 1. Setup Google Sheets (Backend)
1. Buka Google Sheets → buat spreadsheet baru
2. Rename sheet pertama jadi `Members`
3. Isi baris 1 (header) persis seperti ini:
ID | Nickname | MainJob | BuffLand | KodeLand | WhatsApp | Status | AlasanNonaktif | Tanggal

4. Klik **Extensions → Apps Script**
5. Hapus semua kode, paste isi `code.gs`
6. **GANTI** `ADMIN_PASSWORD` di baris atas dengan password lo
7. Klik **Deploy → New deployment**
   - Pilih type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Klik **Deploy**, authorize kalau diminta
9. **Copy URL** yang muncul (format: `https://script.google.com/macros/s/XXXXX/exec`)

### 2. Setup Frontend
1. Buka file `js/config.js`
2. Paste URL Apps Script tadi ke `API_URL`
3. Ganti `ADMIN_PASSWORD` di config.js sama dengan di Apps Script

### 3. Deploy ke Netlify
1. Login ke netlify.com
2. Drag & drop folder project ke Netlify dashboard
3. Selesai! Website lo live

## 🔐 Link-link Penting

- **Homepage**: `https://domainlo.netlify.app/`
- **Form Daftar** (hidden): `https://domainlo.netlify.app/daftar.html`
- **Edit Data** (link pribadi): `https://domainlo.netlify.app/edit.html?id=UUID_MEMBER`
- **Admin Panel**: `https://domainlo.netlify.app/admin.html`

## 🛡️ Keamanan

- WhatsApp **tidak** tampil di list publik
- Link edit per-member pakai UUID (sulit ditebak)
- Export data butuh password admin
- Input disanitasi untuk mencegah XSS
- Password admin disimpan di server (Apps Script), tidak di-expose ke client

## 💡 Tips

- Kalau mau ganti password, ubah di 2 tempat: `code.gs` dan `js/config.js`
- Data bisa dilihat & diedit manual langsung di Google Sheets
- Backup otomatis karena data ada di Google Drive lo