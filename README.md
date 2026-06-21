# 🎓 AI-Based Personalized Learning Management System (LMS)

Platform E-Learning inovatif yang dirancang untuk memberikan pengalaman belajar yang terpersonalisasi dengan integrasi kecerdasan buatan (AI). Proyek ini dibangun menggunakan arsitektur modern Next.js (App Router) dan Supabase sebagai *backend-as-a-service*, serta memanfaatkan keunggulan Google Gemini API untuk fitur AI.

## ✨ Fitur Utama

### 👨‍🎓 Untuk Siswa (Student)
* **Personalized Recommendations:** Rekomendasi kursus, materi belajar, dan alur orientasi (*onboarding*) cerdas berbasis AI yang disesuaikan dengan profil masing-masing siswa.
* **Interactive Learning:** Akses materi kursus, pengerjaan tugas (*assessment*), dan pelacakan perkembangan belajar secara *real-time*.
* **AI Chat Assistant:** Widget chat cerdas yang siap membantu siswa menjawab pertanyaan seputar materi pelajaran kapan saja.
* **Dashboard Siswa:** Tampilan komprehensif untuk memantau pencapaian (*achievements*), kursus yang sedang diikuti, dan riwayat laporan.

### 👨‍🏫 Untuk Guru (Teacher)
* **Course & Content Builder:** Antarmuka pembuat kursus yang intuitif untuk menyusun struktur materi, silabus, dan mengunggah file penunjang belajar.
* **Assessment Management:** Fasilitas untuk merancang kuis dan tugas untuk mengevaluasi pemahaman siswa.
* **AI-Assisted Grading:** Saran penilaian (*Grade Suggestion*) otomatis menggunakan analisis AI berdasarkan kualitas pengumpulan tugas siswa.
* **Manajemen Siswa:** Memantau siswa yang terdaftar dalam kursus, melacak pengumpulan tugas, dan memberikan umpan balik (*feedback*) secara langsung.

### 🛡️ Untuk Admin
* **Analitik & Laporan:** Pantau lalu lintas dan aktivitas platform e-learning secara menyeluruh.
* **Manajemen Pengguna:** Pengaturan *Role-Based Access Control* (Admin, Teacher, Student).
* **Manajemen Kursus Global:** Kontrol kualitas, kurasi, dan status publikasi semua kursus di dalam sistem.

## 🛠️ Tech Stack (Teknologi yang Digunakan)

* **Frontend:** Next.js (React, App Router), TypeScript
* **Backend & Database:** Supabase (PostgreSQL, Authentication, Storage, RLS Policies)
* **AI Engine:** Google Gemini API
* **Styling/UI:** Tailwind CSS & Komponen UI kustom

## 📂 Struktur Direktori Utama

* `/app` - Direktori utama App Router Next.js (berisi *API routes*, *pages* untuk autentikasi, dashboard, dan course).
* `/components` - Komponen antarmuka React yang dapat digunakan kembali (termasuk widget AI Chat, Builder materi/tugas, dan Navbar).
* `/lib` - Konfigurasi dan utilitas pendukung (klien Supabase, setup Gemini API, utilitas ekspor, dan *helper* autentikasi).
* `/supabase` - Kumpulan skrip SQL untuk skema database, aturan RLS, fungsi *roles*, migrasi tabel integrasi AI, serta data sampel (*seed*).

## 🚀 Cara Menjalankan Secara Lokal (How to Run)

### 1. Persyaratan Sistem (Prerequisites)
* Node.js (versi 18 atau lebih baru)
* Akun Supabase (supabase.com)
* API Key dari Google AI Studio (aistudio.google.com) untuk Gemini

### 2. Instalasi Dependensi
Lakukan *clone* repositori ini ke komputer Anda, lalu jalankan perintah instalasi berikut di terminal:

git clone <url-repositori-anda>
cd e-learning
npm install


### 3. Konfigurasi Environment Variables
Buat file bernama `.env.local` di *root* direktori proyek dan isi dengan kredensial berikut (sesuaikan dengan proyek Supabase dan kunci Gemini Anda):

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key


### 4. Setup Database (Supabase)
Jalankan deretan *query* SQL yang terdapat pada folder `supabase/` di SQL Editor pada dashboard Supabase Anda secara berurutan:
1. `supabase/schema.sql` (Inisialisasi tabel dasar)
2. `supabase/storage_setup.sql` (Konfigurasi *bucket* penyimpanan file)
3. Jalankan file migrasi lainnya secara berurutan (misal: `migration_roles.sql`, `migration_ai_integration.sql`, `migration_admin_crud.sql`, dll) untuk memastikan semua fitur terhubung.
4. *(Opsional)* Jalankan `supabase/seed.sql` atau `seed_expanded.sql` untuk memasukkan *dummy data* awal sebagai uji coba.

### 5. Jalankan Development Server
Mulai server untuk lingkungan *development*:

npm run dev

Buka http://localhost:3000 di browser untuk melihat hasilnya. Platform E-Learning Anda kini siap digunakan!
