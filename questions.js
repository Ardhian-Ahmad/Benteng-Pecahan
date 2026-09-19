// Modul Bank Soal Pecahan Edukatif
// Anda bisa menambahkan soal baru di dalam kurung siku [...] ini.

const quizBank = [
    { q: "1/2 + 1/4 = ...", options: ["3/4", "1/4", "1"], answer: "3/4" },
    { q: "Sederhanakan 6/8", options: ["1/4", "3/4", "1/2"], answer: "3/4" },
    { q: "1 - 1/3 = ...", options: ["1/3", "2/3", "1"], answer: "2/3" },
    { q: "Senilai dengan 1/3", options: ["2/6", "3/4", "4/5"], answer: "2/6" },
    { q: "Visual 🟩🟩🟩⬜", options: ["3/4", "1/4", "1/2"], answer: "3/4" },
    { q: "Visual ⬛⬛⬜⬜", options: ["1/2", "1/4", "3/4"], answer: "1/2" },
    { q: "Desimal dari 1/2", options: ["0.5", "0.2", "1.2"], answer: "0.5" },
    { q: "Persen dari 1/4", options: ["25%", "40%", "50%"], answer: "25%" },
    { q: "2/5 + 1/5 = ...", options: ["3/5", "3/10", "2/5"], answer: "3/5" },
    { q: "1/2 x 1/2 = ...", options: ["1/4", "1", "2/4"], answer: "1/4" },
    { q: "3/4 - 1/4 = ...", options: ["2/4", "1/4", "1"], answer: "2/4" },
    { q: "Pizza potong 8, sisa 4. Pecahannya?", options: ["4/8", "2/8", "6/8"], answer: "4/8" }
        // --- Kategori Operasi Dasar (Penjumlahan & Pengurangan) ---
    { q: "1/5 + 2/5 = ...", options: ["3/5", "3/10", "4/5"], answer: "3/5" },
    { q: "4/7 - 2/7 = ...", options: ["2/7", "6/7", "2/14"], answer: "2/7" },
    { q: "1/3 + 1/3 = ...", options: ["2/3", "2/6", "1"], answer: "2/3" },
    { q: "5/6 - 4/6 = ...", options: ["1/6", "1/12", "9/6"], answer: "1/6" },
    { q: "1 - 1/4 = ...", options: ["3/4", "1/4", "2/4"], answer: "3/4" },
    { q: "1 - 2/5 = ...", options: ["3/5", "1/5", "4/5"], answer: "3/5" },
    { q: "2/3 + 1/3 = ...", options: ["1", "3/6", "2/6"], answer: "1" },

    // --- Kategori Pecahan Senilai & Penyederhanaan ---
    { q: "Sederhanakan 2/4", options: ["1/2", "1/4", "3/4"], answer: "1/2" },
    { q: "Sederhanakan 4/10", options: ["2/5", "1/5", "4/5"], answer: "2/5" },
    { q: "Sederhanakan 5/10", options: ["1/2", "1/5", "2/5"], answer: "1/2" },
    { q: "Sederhanakan 3/9", options: ["1/3", "1/9", "2/3"], answer: "1/3" },
    { q: "Senilai dengan 1/2", options: ["4/8", "3/8", "2/8"], answer: "4/8" },
    { q: "Senilai dengan 2/3", options: ["4/6", "3/6", "2/6"], answer: "4/6" },
    { q: "Senilai dengan 3/4", options: ["6/8", "5/8", "4/8"], answer: "6/8" },

    // --- Kategori Visual (Kotak/Emoji) ---
    { q: "Visual 🟩⬜⬜⬜", options: ["1/4", "3/4", "1/2"], answer: "1/4" },
    { q: "Visual 🟩🟩⬜⬜", options: ["2/4", "1/4", "3/4"], answer: "2/4" },
    { q: "Visual ⬛⬛⬛⬜⬜", options: ["3/5", "2/5", "1/5"], answer: "3/5" },
    { q: "Visual ⬛⬜⬜⬜⬜", options: ["1/5", "4/5", "2/5"], answer: "1/5" },
    { q: "Visual 🔷🔷🔷🔷⬜⬜", options: ["4/6", "2/6", "1/2"], answer: "4/6" },
    { q: "Visual 🍎🍎⬜", options: ["2/3", "1/3", "1/2"], answer: "2/3" },

    // --- Kategori Konversi (Desimal & Persen) ---
    { q: "Desimal dari 1/4", options: ["0.25", "0.4", "0.5"], answer: "0.25" },
    { q: "Desimal dari 3/4", options: ["0.75", "0.34", "0.5"], answer: "0.75" },
    { q: "Desimal dari 1/5", options: ["0.2", "0.1", "0.5"], answer: "0.2" },
    { q: "Persen dari 1/2", options: ["50%", "20%", "12%"], answer: "50%" },
    { q: "Persen dari 3/4", options: ["75%", "34%", "25%"], answer: "75%" },
    { q: "Persen dari 1/10", options: ["10%", "1%", "100%"], answer: "10%" },

    // --- Kategori Perkalian Dasar ---
    { q: "1/3 x 1/2 = ...", options: ["1/6", "2/5", "1/5"], answer: "1/6" },
    { q: "1/4 x 1/2 = ...", options: ["1/8", "2/6", "1/6"], answer: "1/8" },
    { q: "2 x 1/4 = ...", options: ["2/4", "1/4", "2/2"], answer: "2/4" },
    { q: "3 x 1/3 = ...", options: ["1", "3/9", "1/3"], answer: "1" },

    // --- Kategori Soal Cerita Sehari-hari ---
    { q: "Ibu potong kue jadi 4, dimakan 1. Sisa kue?", options: ["3/4", "1/4", "2/4"], answer: "3/4" },
    { q: "Cokelat isi 6 kotak, dimakan 2. Pecahannya?", options: ["2/6", "4/6", "1/6"], answer: "2/6" },
    { q: "Ada 5 balon, 2 meletus. Berapa bagian yang meletus?", options: ["2/5", "3/5", "1/5"], answer: "2/5" },
    { q: "Andi punya 1 semangka, dipotong dua. Satu bagian nilainya?", options: ["1/2", "1/1", "2/2"], answer: "1/2" },
    { q: "Martabak dipotong 6, laku 3. Bagian yang laku adalah?", options: ["3/6", "2/6", "1/6"], answer: "3/6" },
    { q: "Budi minum setengah botol air. Pecahannya?", options: ["1/2", "1/3", "1/4"], answer: "1/2" },
];
