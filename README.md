# 🏰 Benteng Pecahan - Cloud-Based Educational Tower Defense

**Benteng Pecahan** adalah *game* edukasi interaktif bergenre *Tower Defense* yang dirancang untuk membantu siswa kelas 6 SD menguasai materi matematika (Pecahan, Desimal, dan Persentase). 

Dibangun dengan **Vanilla HTML5, CSS3, dan JavaScript**, *game* ini dioptimalkan untuk dimainkan secara kolaboratif di atas **Papan Interaktif Digital (PID) 70 inci** menggunakan layar sentuh, namun tetap sangat responsif saat diakses melalui PC, Tablet, maupun *Smartphone*. 

Arsitektur pergerakan koordinat tingkat mesin (*engine-level*), pembangkitan sintesis audio 8-bit multikanal, serta implementasi animasi prosedural (*squash & stretch*) di dalam *game* ini juga menjadikannya studi kasus yang sangat relevan untuk dieksplorasi dalam kelas ekstrakurikuler *coding* dan animasi tingkat dasar.

---

## 🎮 Fitur Utama (Pembaruan Terbaru)

* **Cloud Leaderboard (Google Sheets API):** Sistem *Hall of Fame* terintegrasi secara *online*, mengirim dan menarik data skor 10 tim terbaik secara *real-time* menggunakan *backend* Google Apps Script.
* **Vector Sprite Injection & Procedural Animation:** Karakter dan menara tidak menggunakan gambar eksternal yang membebani *server*, melainkan menggunakan injeksi *SVG Data URIs* yang dianimasikan dengan efek pemantulan matematis.
* **Data-Driven Architecture:** Atribut menara, gelombang musuh, dan bank soal dipisah ke dalam modul mandiri. Modifikasi parameter *game* (seperti efek *Slow*, *Burn*, dan *Armor Piercing*) bisa dilakukan tanpa menyentuh *core engine*.
* **Ensiklopedia Dinamis (Galeri):** Menu Galeri secara otomatis melakukan sinkronisasi dengan data di `towers.js` dan `enemies.js` untuk menampilkan atribut *damage*, kecepatan, dan harga secara *real-time*.
* **Sistem Anti-Spam Kuis:** Menjawab salah akan memberikan penalti pengurangan Energi, memaksa siswa untuk menghitung alih-alih menebak secara acak.
* **Smooth UI/UX:** Notifikasi pergantian *wave* menggunakan animasi *Toast Popup* (meluncur memantul) agar tidak menghalangi visibilitas pemain terhadap peta.

---

## 🏗️ Struktur Direktori Moduler

```text
📁 benteng-pecahan/
├── 📄 index.html      # Kerangka UI, Layout Menu, Popup Wave, dan Canvas Game
├── 📄 style.css       # Styling responsif (Flexbox Dynamic Viewport & Cubic-Bezier)
├── 📄 questions.js    # [DATA] Bank soal matematika & pecahan
├── 📄 enemies.js      # [DATA] Atribut musuh & Boss (HP, Speed, Radius)
├── 📄 towers.js       # [DATA] Atribut leveling menara, skill khusus, & prajurit
├── 📄 app.js          # [ENGINE] Logika game loop, fetch API, SVG renderer, & audio
└── 📄 README.md       # Dokumentasi proyek

```

⚙️ Panduan Setup Database Online (Penting untuk Forking)
Jika Anda melakukan fork repository ini, fitur Papan Peringkat tidak akan berjalan sampai Anda menautkannya dengan akun Google Anda sendiri. Ikuti langkah berikut:

Buat Google Sheets baru (misal: "Database Benteng Pecahan").

Buat header di kolom A1 dan B1: Nama Tim dan Skor.

Klik menu Ekstensi > Apps Script.

Copy-paste kode backend (tersedia di panduan developer / issue tracker).

Klik Terapkan (Deploy) > Deployment Baru.

Pilih Aplikasi Web dengan akses ke Siapa Saja (Anyone).

Salin URL Web App yang diberikan.

Buka file app.js di baris paling atas, tempelkan URL tersebut pada:
const GOOGLE_SHEET_URL = "URL_ANDA_DI_SINI";

🛠️ Cara Modifikasi (Untuk Guru)
Proyek ini sangat mudah disesuaikan untuk mata pelajaran atau tingkat kesulitan lain:

Mengubah Soal: Buka file questions.js dan sesuaikan array quizBank.

Mengubah Meta Permainan: Buka towers.js untuk mengonfigurasi tingkat upgrade, durasi efek terbakar (burn), persentase pelambatan es (slow), atau HP prajurit penahan.

Mengubah Kekuatan Boss: Buka enemies.js untuk mengatur atribut bossType.

👨‍🏫 Kredit Pengembangan
Diciptakan dan dirancang oleh Mirza Ardhian Ahmad.

Game ini adalah manifestasi bahwa pendidik dapat merakit alat bantu ajar tingkat lanjut berstandar industri dengan memanfaatkan HTML5 Canvas terbuka untuk menciptakan pengalaman belajar yang imersif, kompetitif, dan kolaboratif.
