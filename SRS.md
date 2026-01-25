# 3. Kebutuhan Antarmuka Eksternal

## 3.1 Antarmuka Pengguna
Antarmuka pengguna dibangun sebagai aplikasi web modern (Web App) yang responsif, memastikan kenyamanan akses baik melalui perangkat mobile (smartphone) maupun desktop.

**Prinsip Desain & Fitur Utama:**

*   **Nasabah:**
    *   **Dashboard Utama:** Menampilkan ringkasan Saldo Total dan Notifikasi terkini.
    *   **Menu Riwayat:** Memantau status transaksi (Pending, Diproses, Selesai, Ditolak) baik untuk penyetoran sampah maupun penarikan saldo.
    *   **Fitur Penarikan:** Interface untuk mengajukan pencairan saldo dengan alur status yang jelas.
    *   **Peta Lokasi:** Integrasi peta (Leaflet) untuk melihat lokasi Bank Sampah terdekat.
    *   **Profil:** Manajemen data diri pengguna.

*   **Petugas:**
    *   **Dashboard Operasional:** Daftar antrian setoran yang perlu diverifikasi.
    *   **Input Penyetoran:** Formulir digital untuk memasukkan jenis dan berat sampah, yang otomatis terhitung berdasarkan harga terkini.
    *   **Persetujuan Penarikan:** Menu verifikasi untuk menyetujui atau menolak pengajuan dana dari nasabah.
    *   **Cetak Struk:** Fitur export/cetak bukti transaksi (PDF).

*   **Admin:**
    *   **Monitoring Sistem:** Dashboard analitik untuk melihat prediksi dan statistik sampah.
    *   **Manajemen Master Data:** Pengelolaan data bank sampah, harga satuan sampah, dan akun pengguna.

## 3.2 Antarmuka Perangkat Keras
*   **Perangkat Pengguna (Client):**
    *   **Perangkat:** Smartphone (Android/iOS) atau Komputer (PC/Laptop).
    *   **Kamera (Opsional):** Digunakan melalui input file sistem untuk mengunggah bukti/foto jika diperlukan.
    *   **GPS:** Diperlukan untuk fitur pencarian lokasi bank sampah (Geolocation).
*   **Infrastruktur Cloud (Serverless):**
    *   **Hosting & App Server:** Dikelola oleh **Vercel** (untuk menjalankan kode website & API).
    *   **Database Server:** Dikelola oleh **Supabase** (untuk penyimpanan data real-time).

## 3.3 Antarmuka Perangkat Lunak
Spesifikasi teknologi yang digunakan dalam pengembangan sistem ini:

*   **Frontend Framework:** Next.js 16 (React) - Menggantikan arsitektur lama, memberikan performa lebih cepat dan SEO friendly.
*   **Styling:** Tailwind CSS - Untuk desain antarmuka yang konsisten dan responsif.
*   **Backend:** Next.js Server Actions & API Routes - Logika backend terintegrasi langsung dalam framework Next.js.
*   **Database:** Supabase (PostgreSQL) - Penyimpanan data relasional yang real-time dan aman.
*   **Autentikasi:** Supabase Auth - Manajemen login, register, dan proteksi rute (termasuk verifikasi OTP via Email).
*   **Peta & Lokasi:** Leaflet / React-Leaflet - Library untuk visualisasi peta interaktif.
*   **Report & Dokumen:** jspdf & html2canvas - Library untuk pembuatan laporan dan struk digital format PDF.

## 3.4 Antarmuka Komunikasi
*   **Protokol Jaringan:** HTTPS/TLS - Enkripsi standar industri untuk menjaga keamanan data saat transit antara browser pengguna dan server.
*   **Format Data API:** JSON (JavaScript Object Notation) - Standar pertukaran data yang ringan.
*   **Komunikasi Real-time:** WebSocket (via Supabase Realtime) - Untuk update status notifikasi atau perubahan data secara langsung tanpa refresh halaman.
