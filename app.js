// --- KONFIGURASI DASAR KANVAS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Mengatur ukuran kanvas sesuai layar
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- STATE (KONDISI) GAME ---
let baseHp = 10;
let currentEnergy = 0; // Disimpan dalam desimal untuk kalkulasi mesin
let enemies = [];
let towers = [];
let projectiles = [];
let frameCount = 0;
let placingTowerType = null;
let placingTowerCost = 0;

// Daftar pecahan yang akan muncul sebagai gelembung
const fractionVariants = [
    { text: "1/4", value: 0.25 },
    { text: "1/2", value: 0.5 },
    { text: "3/4", value: 0.75 },
    { text: "1", value: 1.0 }
];

// --- JALUR MUSUH (COORDINATE MOVEMENT) ---
// Membuat titik koordinat sederhana (Zigzag)
const path = [
    { x: -50, y: canvas.height * 0.3 },
    { x: canvas.width * 0.4, y: canvas.height * 0.3 },
    { x: canvas.width * 0.4, y: canvas.height * 0.7 },
    { x: canvas.width * 0.8, y: canvas.height * 0.7 },
    { x: canvas.width * 0.8, y: canvas.height * 0.2 },
    { x: canvas.width + 50, y: canvas.height * 0.2 }
];

// --- KELAS OBJEK GAME ---
class Enemy {
    constructor() {
        this.x = path[0].x;
        this.y = path[0].y;
        this.pathIndex = 1;
        this.speed = 1.5;
        this.hp = 100;
        this.maxHp = 100;
        this.radius = 15;
    }

    update() {
        if (this.pathIndex < path.length) {
            let target = path[this.pathIndex];
            let dx = target.x - this.x;
            let dy = target.y - this.y;
            let distance = Math.hypot(dx, dy);

            if (distance < this.speed) {
                this.x = target.x;
                this.y = target.y;
                this.pathIndex++;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        } else {
            // Musuh mencapai benteng
            baseHp--;
            document.getElementById('base-hp').innerText = baseHp;
            this.hp = 0; // Hilangkan musuh
        }
    }

    draw() {
        ctx.fillStyle = '#e94560';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bar Darah (HP)
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 15, this.y - 25, 30, 5);
        ctx.fillStyle = 'lightgreen';
        ctx.fillRect(this.x - 15, this.y - 25, 30 * (this.hp / this.maxHp), 5);
    }
}

class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.range = 150;
        this.cooldown = 60; // Tembak setiap 60 frame (1 detik)
        this.timer = 0;
        this.color = type === 'ice' ? '#a2d5f2' : type === 'fire' ? '#ff7b54' : '#ffd700';
    }

    update() {
        this.timer++;
        if (this.timer >= this.cooldown) {
            // Cari musuh terdekat
            let target = null;
            let closestDist = this.range;
            for (let enemy of enemies) {
                let dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    target = enemy;
                }
            }

            if (target) {
                projectiles.push(new Projectile(this.x, this.y, target, this.type));
                this.timer = 0;
            }
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
        
        // Render radius serangan transparan
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.fill();
    }
}

class Projectile {
    constructor(x, y, target, type) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = 5;
        this.type = type;
        this.damage = type === 'fire' ? 40 : type === 'lightning' ? 80 : 20;
    }

    update() {
        let dx = this.target.x - this.x;
        let dy = this.target.y - this.y;
        let distance = Math.hypot(dx, dy);

        if (distance < this.speed) {
            this.target.hp -= this.damage;
            this.active = false;
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    draw() {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- LOGIKA GAME & UI ---

// Fungsi helper mengubah nilai desimal ke string pecahan (0.75 -> "3/4")
function decimalToFractionStr(decimal) {
    if (decimal === 0) return "0";
    let whole = Math.floor(decimal);
    let rem = decimal - whole;
    let frac = "";
    if (rem === 0.25) frac = "1/4";
    else if (rem === 0.5) frac = "1/2";
    else if (rem === 0.75) frac = "3/4";
    
    if (whole > 0 && frac !== "") return `${whole} ${frac}`;
    if (whole > 0 && frac === "") return `${whole}`;
    return frac;
}

// Memperbarui tampilan UI & Cek tombol
function updateUI() {
    document.getElementById('energy-display').innerText = decimalToFractionStr(currentEnergy);
    
    document.querySelectorAll('.tower-btn').forEach(btn => {
        let cost = parseFloat(btn.getAttribute('data-cost'));
        if (currentEnergy >= cost) {
            btn.classList.remove('disabled');
        } else {
            btn.classList.add('disabled');
        }
    });
}

// Interaksi Gelembung Pecahan
function spawnFractionBubble() {
    const pool = document.getElementById('fraction-pool');
    if (pool.children.length >= 6) return; // Maksimal 6 gelembung di layar

    let randomFrac = fractionVariants[Math.floor(Math.random() * fractionVariants.length)];
    let bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerText = randomFrac.text;

    bubble.addEventListener('pointerdown', function() {
        currentEnergy += randomFrac.value;
        updateUI();
        pool.removeChild(bubble);
    });

    pool.appendChild(bubble);
}

// Interaksi Toko Menara
document.querySelectorAll('.tower-btn').forEach(btn => {
    btn.addEventListener('pointerdown', function(e) {
        let cost = parseFloat(this.getAttribute('data-cost'));
        let type = this.getAttribute('data-type');
        
        if (currentEnergy >= cost) {
            placingTowerType = type;
            placingTowerCost = cost;
            document.getElementById('message-area').innerText = "Sentuh area kosong di peta untuk membangun!";
        }
    });
});

// Penempatan Menara di Kanvas
canvas.addEventListener('pointerdown', function(e) {
    if (placingTowerType) {
        let rect = canvas.getBoundingClientRect();
        let mouseX = e.clientX - rect.left;
        let mouseY = e.clientY - rect.top;

        // Beli dan Tempatkan
        currentEnergy -= placingTowerCost;
        towers.push(new Tower(mouseX, mouseY, placingTowerType));
        
        // Reset state
        placingTowerType = null;
        updateUI();
        document.getElementById('message-area').innerText = "Menara berhasil dibangun!";
    }
});

// --- RENDER & GAME LOOP MAIN ENGINE ---
function drawMap() {
    ctx.strokeStyle = '#4b5d67';
    ctx.lineWidth = 40;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
}

function gameLoop() {
    // Bersihkan layar setiap frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawMap();

    // Spawn Musuh setiap 2 detik (120 frame pada 60fps)
    if (frameCount % 120 === 0) {
        enemies.push(new Enemy());
    }

    // Spawn Gelembung setiap 1.5 detik
    if (frameCount % 90 === 0) {
        spawnFractionBubble();
    }

    // Update & Draw Objek
    towers.forEach(t => { t.update(); t.draw(); });
    
    enemies.forEach(e => { e.update(); e.draw(); });
    enemies = enemies.filter(e => e.hp > 0); // Hapus musuh mati

    projectiles.forEach(p => { p.update(); p.draw(); });
    projectiles = projectiles.filter(p => p.active !== false);

    frameCount++;
    requestAnimationFrame(gameLoop);
}

// Mulai Game
updateUI();
gameLoop();
