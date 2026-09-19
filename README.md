# 🏰 Benteng Pecahan - Educational Tower Defense

**Benteng Pecahan** adalah sebuah *game* edukasi interaktif bergenre *Tower Defense* yang dirancang untuk membantu siswa kelas 6 SD menguasai materi matematika (Pecahan, Desimal, dan Persentase). 

Game ini dikembangkan secara spesifik untuk dimainkan secara kolaboratif di atas **Papan Interaktif Digital (PID) 70 inci**, menggunakan pendekatan visual-spasial yang responsif terhadap sentuhan jari (*multi-touch*), namun tetap dapat dimainkan dengan sempurna di PC, Tablet, maupun *Smartphone*.

---

## 🎮 Fitur Utama

* **Integrasi Kuis & Gameplay:** Pemain tidak mendapatkan sumber daya secara otomatis. Mereka harus memecahkan soal matematika dengan cepat untuk mendapatkan "Energi".
* **Sistem Anti-Spam:** Menjawab salah akan memberikan penalti pengurangan Energi, mencegah siswa menebak jawaban secara asal.
* **Data-Driven Architecture:** Atribut menara, musuh, dan bank soal dipisah ke dalam modul mandiri (`.js` terpisah) sehingga guru lain dapat memodifikasi keseimbangan game tanpa perlu menyentuh *core engine*.
* **Ensiklopedia Dinamis (Galeri):** Memiliki menu Galeri terintegrasi yang membaca dan menampilkan statistik menara dan musuh langsung dari modul data.
* **Sistem Progresi Penuh:** Terdiri dari 3 Level dengan tata letak peta (*map*) yang berbeda, sistem *Wave* (gelombang musuh), dan *Boss Area of Effect (AoE)* di akhir setiap level.
* **Hall of Fame (Local Storage):** Menyimpan papan peringkat tim terbaik secara lokal di *browser* perangkat.
* **Audio Sintetis 8-bit:** Menggunakan *Web Audio API* untuk menghasilkan *sound effect* (SFX) bergaya *retro* tanpa membebani ukuran proyek dengan file MP3 eksternal.

---

## 🏗️ Struktur Direktori

Proyek ini dibangun menggunakan **Vanilla HTML5, CSS3, dan JavaScript murni** (tanpa *framework* eksternal), mengandalkan HTML5 `<canvas>` untuk pergerakan *engine* berkinerja tinggi.

```text
📁 benteng-pecahan/
├── 📄 index.html      # Kerangka UI, Layout Menu, dan Canvas Game
├── 📄 style.css       # Styling responsif (Flexbox Dynamic Viewport)
├── 📄 questions.js    # [MODUL] Bank soal matematika & pecahan
├── 📄 enemies.js      # [MODUL] Data tipe monster, HP, dan kecepatan
├── 📄 towers.js       # [MODUL] Data harga, damage, dan skill menara
├── 📄 app.js          # [ENGINE] Logika game loop, rendering grafis, dan audio
└── 📄 README.md       # Dokumentasi proyek
