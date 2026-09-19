// Modul Atribut & Skill Menara
const towerConfig = {
    ice: { 
        id: 'ice',
        name: "Menara Es", 
        icon: "❄️", 
        cost: 1, 
        range: 140, 
        cooldown: 20, // Sangat cepat
        baseDamage: 8, 
        desc: "Membekukan musuh. Mengurangi kecepatan jalan sebesar 50% selama 2 detik.", 
        effect: 'slow' 
    },
    fire: { 
        id: 'fire',
        name: "Menara Api", 
        icon: "🔥", 
        cost: 2, 
        range: 160, 
        cooldown: 60, 
        baseDamage: 15, 
        desc: "Membakar musuh. Memberikan efek Damage over Time (Terbakar) selama 3 detik.", 
        effect: 'burn' 
    },
    lightning: { 
        id: 'lightning',
        name: "Menara Petir", 
        icon: "⚡", 
        cost: 3, 
        range: 220, 
        cooldown: 150, // Sangat lambat
        baseDamage: 120, 
        desc: "Serangan mematikan. Damage x2 saat mengenai monster tipe Tank/Baja.", 
        effect: 'pierce' 
    },
    barracks: { 
        id: 'barracks',
        name: "Barak Pasukan", 
        icon: "🛡️", 
        cost: 2, 
        range: 0, 
        cooldown: 180, 
        baseDamage: 10, 
        desc: "Mengerahkan 3 prajurit untuk menahan jalan. Pukulan prajurit memiliki radius ledakan (AoE).", 
        effect: 'spawn' 
    }
};
