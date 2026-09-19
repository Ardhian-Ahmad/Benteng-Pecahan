// Modul Karakteristik Musuh dan Boss
// Anda bisa menyesuaikan kecepatan (baseSpeed) dan darah (baseHp) di sini.

const enemyTypesArr = [
    { 
        type: "normal", 
        color: '#e94560', 
        baseHp: 100, 
        baseSpeed: 1.5, 
        radius: 18, 
        isBoss: false 
    }, 
    { 
        type: "fast", 
        color: '#f9d342', 
        baseHp: 50, 
        baseSpeed: 3.5, 
        radius: 15, 
        isBoss: false 
    },   
    { 
        type: "tank", 
        color: '#9b59b6', 
        baseHp: 350, 
        baseSpeed: 0.8, 
        radius: 25, 
        isBoss: false 
    }    
];

const bossType = { 
    type: "boss", 
    color: '#ff0044', 
    baseHp: 3000, 
    baseSpeed: 0.6, 
    radius: 50, 
    isBoss: true 
};
