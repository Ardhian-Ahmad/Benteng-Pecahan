// Modul Karakteristik Musuh dan Boss (Hard Mode)
// Anda bisa menyesuaikan kecepatan (baseSpeed) dan darah (baseHp) di sini.
// Note: Kecepatan 1.0 berarti musuh berpindah 1 piksel per frame (60 piksel per detik).

const enemyTypesArr = [
    { 
        type: "normal", 
        color: '#e94560', 
        baseHp: 150,     // Naik dari 100
        baseSpeed: 1.8,  // Naik dari 1.5
        radius: 18, 
        isBoss: false 
    }, 
    { 
        type: "fast", 
        color: '#f9d342', 
        baseHp: 80,      // Naik dari 50 (masih rentan, tapi butuh lebih dari 1 tembakan awal)
        baseSpeed: 4.5,  // Naik dari 3.5 (Sangat cepat! Hampir butuh Menara Es atau Barak untuk menahan)
        radius: 15, 
        isBoss: false 
    },   
    { 
        type: "tank", 
        color: '#9b59b6', 
        baseHp: 550,     // Naik drastis dari 350. Memaksa pemain membeli Menara Petir!
        baseSpeed: 0.9,  // Naik dari 0.8
        radius: 25, 
        isBoss: false 
    }    
];

// BOSS: Muncul di akhir setiap Level
const bossType = { 
    type: "boss", 
    color: '#ff0044', 
    baseHp: 4500,    // Naik drastis dari 3000. 
    baseSpeed: 0.7,  // Naik dari 0.6
    radius: 50, 
    isBoss: true 
};
