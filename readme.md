# Community Hub

Community Hub adalah sebuah web-based platform yang dibuat untuk membantu pengelolaan komunitas, khususnya komunitas **Toram Online**.

Website ini menggabungkan beberapa fitur komunitas dalam satu tempat, mulai dari **Toram Tools**, pengelolaan data member, hingga sistem informasi komunitas. Project ini dirancang sebagai sebuah hub yang memudahkan anggota komunitas dalam mengakses tools sekaligus membantu admin dalam mengelola data member.

---

## Features

### Toram Tools

Community Hub menyediakan berbagai tools yang dapat digunakan oleh pemain untuk membantu aktivitas dan kebutuhan dalam game Toram Online.

Tools dapat terus dikembangkan dan ditambahkan sesuai dengan kebutuhan komunitas.

### Member Management

Sistem pengelolaan member memungkinkan komunitas untuk menyimpan dan mengelola informasi anggota secara terpusat.

Data yang dapat dikelola meliputi:

* ID Member
* Nickname
* Main Job
* Buff Land
* Kode Land
* WhatsApp
* Status Member
* Alasan Nonaktif
* Tanggal Pendaftaran atau Pembaruan Data

Informasi kontak seperti WhatsApp tidak ditampilkan pada halaman publik.

### Member Status

Member dapat memiliki status aktif maupun nonaktif.

Untuk member yang tidak lagi aktif, alasan status nonaktif dapat dicatat sebagai bagian dari data komunitas.

### Member Data

Data member disimpan menggunakan Google Sheets sebagai database backend.

Pendekatan ini memungkinkan data tetap mudah diakses dan dikelola oleh administrator tanpa memerlukan database server khusus.

---

## Technology

Project ini menggunakan beberapa layanan dan teknologi berikut:

* HTML
* CSS
* JavaScript
* Google Sheets
* Google Apps Script

Google Sheets digunakan sebagai penyimpanan data, sedangkan Google Apps Script digunakan sebagai API backend yang menghubungkan website dengan data member.

Frontend dapat dijalankan sebagai static website dan di-deploy menggunakan layanan seperti Netlify atau GitHub Pages.

---

## Project Structure

```text
community-hub/
│
├── index.html
├── members.html
├── tools/
│
├── css/
│
├── js/
│   └── config.js
│
├── assets/
│
├── code.gs
│
└── README.md
```

Struktur folder dapat berubah seiring dengan penambahan fitur dan tools baru.

---

## Backend

Backend menggunakan Google Apps Script yang terhubung langsung dengan Google Sheets.

Spreadsheet digunakan sebagai penyimpanan utama data member dengan sheet:

```text
Members
```

Struktur data member:

| Field          | Description                           |
| -------------- | ------------------------------------- |
| ID             | Identitas member                      |
| Nickname       | Nama karakter atau nickname member    |
| MainJob        | Job utama yang digunakan              |
| BuffLand       | Informasi Buff Land                   |
| KodeLand       | Kode atau akses Land                  |
| WhatsApp       | Nomor kontak member                   |
| Status         | Status keanggotaan                    |
| AlasanNonaktif | Keterangan apabila member tidak aktif |
| Tanggal        | Tanggal data dibuat atau diperbarui   |

Google Apps Script berfungsi sebagai API untuk menerima, membaca, memperbarui, dan mengelola data dari frontend.

---

## Configuration

Konfigurasi frontend berada pada:

```text
js/config.js
```

Konfigurasi utama yang digunakan:

```javascript
API_URL
ADMIN_PASSWORD
```

`API_URL` digunakan untuk menghubungkan website dengan Google Apps Script API.

Password administrator digunakan untuk fitur yang membutuhkan akses khusus, seperti pengelolaan atau export data.

---

## Security

Beberapa mekanisme keamanan diterapkan untuk melindungi data member dan fitur administrator.

* Nomor WhatsApp tidak ditampilkan pada daftar publik.
* Data member menggunakan identitas unik.
* Link atau akses edit member menggunakan UUID.
* Input pengguna disanitasi untuk mengurangi risiko XSS.
* Fitur tertentu memerlukan autentikasi administrator.
* Password utama backend disimpan dan divalidasi melalui Google Apps Script.

> Pastikan repository tidak menyimpan credential atau informasi sensitif apabila project dikembangkan menjadi public repository.

---

## Data Management

Karena data disimpan di Google Sheets, administrator tetap dapat melakukan beberapa pengelolaan secara langsung melalui spreadsheet.

Keuntungan pendekatan ini:

* Tidak memerlukan database server terpisah.
* Data mudah dilihat dan dikelola.
* Memanfaatkan penyimpanan Google Drive.
* Mudah digunakan untuk komunitas kecil hingga menengah.
* Data dapat diekspor atau dibackup sesuai kebutuhan.

---

## Deployment

Frontend dapat di-deploy sebagai static website menggunakan platform seperti:

* Netlify
* GitHub Pages
* Cloudflare Pages

Backend tetap menggunakan Google Apps Script sebagai API.

Setelah deployment, frontend hanya perlu dikonfigurasikan agar menggunakan URL Google Apps Script yang sesuai.

---

## Development

Project ini masih dapat terus dikembangkan.

Beberapa kemungkinan pengembangan di masa depan:

* Penambahan Toram Tools.
* Member profile.
* Member search dan filtering.
* Statistik komunitas.
* Activity tracking.
* Guild event management.
* Member contribution system.
* Role dan permission management.
* Dashboard administrator.
* Improved API security.

---

## Contributing

Kontribusi, improvement, dan ide baru selalu dapat membantu pengembangan Community Hub.

Jika ingin melakukan perubahan pada project:

1. Fork repository.
2. Buat branch baru.
3. Lakukan perubahan.
4. Buat pull request.

---

## Disclaimer

Community Hub adalah project komunitas dan tidak berafiliasi secara resmi dengan **Toram Online** atau pihak pengembang game.

Semua nama, aset, dan informasi yang berkaitan dengan Toram Online tetap merupakan milik pemilik hak terkait.

---

## License

Project ini dibuat untuk kebutuhan komunitas.

Silakan menyesuaikan lisensi repository sesuai dengan kebutuhan project.
