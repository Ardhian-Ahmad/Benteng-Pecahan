// Modul Atribut & Skill Menara (Data-Driven Configuration)
// Angka waktu menggunakan 'Frame' (60 Frame = 1 Detik).

const towerConfig = {
    ice: { 
        id: 'ice', name: "Menara Es", icon: "❄️", cost: 1, 
        desc: "Melambatkan musuh. Cepat tapi damage kecil. Durasi slow ditingkatkan di level 3", 
        levels: [
            // Lvl 1: Slow 50% selama 1 detik
            { range: 140, cooldown: 20, damage: 8, upgradeCost: 2, effect: { type: 'slow', amount: 0.5, duration: 60 } },   
            // Lvl 2: Slow 65% selama 1.5 detik
            { range: 160, cooldown: 18, damage: 15, upgradeCost: 4, effect: { type: 'slow', amount: 0.65, duration: 90 } }, 
            // Lvl 3: Slow 80% selama 2 detik
            { range: 180, cooldown: 15, damage: 25, upgradeCost: null, effect: { type: 'slow', amount: 0.8, duration: 120 } } 
        ]
    },
    fire: { 
        id: 'fire', name: "Menara Api", icon: "🔥", cost: 2, 
        desc: "Efek membakar (Damage over Time) tiap setengah detik. Durasi burn ditingkatkan di level 3", 
        levels: [
            // Lvl 1: Bakar 5 DMG selama 3 detik
            { range: 160, cooldown: 60, damage: 25, upgradeCost: 3, effect: { type: 'burn', tickDamage: 5, duration: 180 } }, 
            // Lvl 2: Bakar 10 DMG selama 4 detik
            { range: 180, cooldown: 55, damage: 45, upgradeCost: 5, effect: { type: 'burn', tickDamage: 10, duration: 240 } }, 
            // Lvl 3: Bakar 20 DMG selama 5 detik
            { range: 200, cooldown: 50, damage: 70, upgradeCost: null, effect: { type: 'burn', tickDamage: 20, duration: 300 } } 
        ]
    },
    lightning: { 
        id: 'lightning', name: "Menara Petir", icon: "⚡", cost: 3, 
        desc: "Sangat lambat. Damage berlipat ganda melawan Tank. Damage 1050 pada tank di level 3", 
        levels: [
            // Lvl 1: Damage x2 melawan Tank
            { range: 220, cooldown: 150, damage: 100, upgradeCost: 5, effect: { type: 'pierce', multiplier: 2.0 } }, 
            // Lvl 2: Damage x2.5 melawan Tank
            { range: 240, cooldown: 140, damage: 180, upgradeCost: 8, effect: { type: 'pierce', multiplier: 2.5 } }, 
            // Lvl 3: Damage x3.5 melawan Tank
            { range: 270, cooldown: 120, damage: 300, upgradeCost: null, effect: { type: 'pierce', multiplier: 3.5 } } 
        ]
    },
    barracks: { 
        id: 'barracks', name: "Barak Pasukan", icon: "🛡️", cost: 2, 
        desc: "Memanggil prajurit penahan. Level 3 memunculkan Kapten Emas.", 
        levels: [
            // Lvl 1: 3 Prajurit Standar
            { range: 0, cooldown: 180, upgradeCost: 3, spawnCount: 3, hasLeader: false, 
              soldier: { hp: 100, damage: 10, radius: 10, color: '#2ecc71' } },
            // Lvl 2: 3 Prajurit Kuat
            { range: 0, cooldown: 160, upgradeCost: 5, spawnCount: 3, hasLeader: false, 
              soldier: { hp: 150, damage: 20, radius: 10, color: '#27ae60' } },
            // Lvl 3: 2 Prajurit Elit + 1 Kapten Emas
            { range: 0, cooldown: 140, upgradeCost: null, spawnCount: 3, hasLeader: true, 
              soldier: { hp: 200, damage: 30, radius: 10, color: '#27ae60' },
              leader: { hp: 500, damage: 70, radius: 14, color: '#f1c40f' } 
            }
        ]
    }
};
