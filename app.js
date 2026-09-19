// --- KONFIGURASI DASAR KANVAS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- STATE (KONDISI) GAME ---
let gameStarted = false;
let baseHp = 10;
let currentEnergy = 0; // Energi sekarang dalam bentuk poin bulat (1, 2, 3)
let enemies = [];
let towers = [];
let projectiles = [];
let frameCount = 0;
let placingTowerType = null;
let placingTowerCost = 0;

// --- BANK SOAL PECAHAN (EDUKASI) ---
const quizBank = [
    { q: "1/2 + 1/4 = ...", options: ["3/4", "1/4", "1"], answer: "3/4" },
    { q: "Bentuk sederhana dari 4/8 adalah...", options: ["1/4", "1/3", "1/2"], answer: "1/2" },
    { q: "1 - 1/3 = ...", options: ["1/3", "2/3", "1"], answer: "2/3" },
    { q: "Pecahan senilai dengan 2/3", options: ["4/6", "3/4", "4/5"], answer: "4/6" },
    { q: "1/2 x 1/2 = ...", options: ["1/4", "1", "2/4"], answer: "1/4" },
    { q: "Manakah yang paling besar?", options: ["1/2", "3/4", "1/4"], answer: "3/4" }
];
let currentQuestion = null;

// --- VARIASI MUSUH ---
const enemyTypes = [
    { name: "Normal", color: '#e94560', maxHp: 100, speed: 1.5, radius: 15 }, // Merah (Standar)
    { name: "Cepat", color: '#f9d342', maxHp: 60, speed: 2.8, radius: 12 },   // Kuning (Cepat, HP tipis)
    { name: "Tank", color: '#9b59b6', maxHp: 300, speed: 0.8, radius: 22 }    // Ungu (Lambat, HP tebal)
];

// Koordinat Jalur Musuh
const path = [
    { x: -50, y: canvas.height * 0.3 },
    { x: canvas.width * 0.4, y: canvas.height * 0.3 },
    { x: canvas.width * 0.4, y: canvas.height * 0.7 },
    { x: canvas.width * 0.8, y: canvas.height * 0.7 },
    { x: canvas.width * 0.8, y: canvas.height * 0.2 },
    { x: canvas.width + 50, y: canvas.height * 0.2 }
];

// --- FUNGSI KUIS EDUKASI ---
function loadNextQuestion() {
    // Pilih soal acak
    currentQuestion = quizBank[Math.floor(Math.random() * quizBank.length)];
    document.getElementById('question-text').innerText = "Soal: " + currentQuestion.q;
    
    // Acak posisi jawaban
    let shuffledOptions = [...currentQuestion.options].sort(() => Math.random() - 0.5);
    let buttons = document.querySelectorAll('.quiz-btn');
    
    buttons.forEach((btn, index) => {
        btn.innerText = shuffledOptions[index];
        btn.style.background = "#4ecca3"; // Kembalikan warna ke hijau
    });
}

function checkAnswer(btn) {
    if(btn.innerText === currentQuestion.answer) {
        currentEnergy += 1; // Jawaban benar = 1 Energi
        updateUI();
        document.getElementById('message-area').innerText = "BENAR! +1 Energi ⭐";
        document.getElementById('message-area').style.color = "#f9d342";
        btn.style.background = "#ffd700"; // Efek emas
        setTimeout(loadNextQuestion, 500); // Ganti soal setelah 0.5 detik
    } else {
        document.getElementById('message-area').innerText = "SALAH! Coba lagi.";
        document.getElementById('message-area').style.color = "red";
        btn.style.background = "#e94560"; // Tombol jadi merah jika salah
    }
}

// --- KELAS OBJEK GAME ---
class Enemy {
    constructor(typeParams) {
        this.x = path[0].x;
        this.y = path[0].y;
        this.pathIndex = 1;
        this.speed = typeParams.speed;
        this.hp = typeParams.maxHp;
        this.maxHp = typeParams.maxHp;
        this.radius = typeParams.radius;
        this.color = typeParams.color;
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
            baseHp--;
            document.getElementById('base-hp').innerText = baseHp;
            this.hp = 0; 
            if(baseHp <= 0) alert("GAME OVER! Benteng Hancur. Muat ulang halaman untuk bermain lagi.");
        }
    }

    draw() {
        ctx.fillStyle = this.color;
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
        this.cooldown = type === 'ice' ? 40 : type === 'fire' ? 80 : 120; 
        this.timer = 0;
        this.color = type === 'ice' ? '#a2d5f2' : type === 'fire' ? '#ff7b54' : '#ffd700';
    }

    update() {
        this.timer++;
        if (this.timer >= this.cooldown) {
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
        this.speed = 8;
        this.type = type;
        this.damage = type === 'fire' ? 30 : type === 'lightning' ? 100 : 15;
    }

    update() {
        let dx = this.target.x - this.x;
        let dy = this.target.y - this.y;
        let distance = Math.hypot(dx, dy);

        if (distance < this.speed) {
            this.target.hp -= this.damage;
            if(this.type === 'ice') this.target.speed *= 0.9; // Efek melambat
            this.active = false;
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    draw() {
        ctx.fillStyle = this.type === 'ice' ? '#fff' : this.type === 'fire' ? 'orange' : 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// --- LOGIKA UI & INTERAKSI PEMAIN ---
function updateUI() {
    document.getElementById('energy-display').innerText = currentEnergy;
    
    document.querySelectorAll('.tower-btn').forEach(btn => {
        let cost = parseInt(btn.getAttribute('data-cost'));
        if (currentEnergy >= cost) {
            btn.classList.remove('disabled');
        } else {
            btn.classList.add('disabled');
        }
    });
}

// Beli Menara
document.querySelectorAll('.tower-btn').forEach(btn => {
    btn.addEventListener('pointerdown', function(e) {
        let cost = parseInt(this.getAttribute('data-cost'));
        let type = this.getAttribute('data-type');
        
        if (currentEnergy >= cost) {
            placingTowerType = type;
            placingTowerCost = cost;
            document.getElementById('message-area').innerText = "Sentuh peta untuk menaruh menara!";
            document.getElementById('message-area').style.color = "#4ecca3";
        }
    });
});

// Letakkan Menara di Peta
canvas.addEventListener('pointerdown', function(e) {
    if (placingTowerType) {
        let rect = canvas.getBoundingClientRect();
        let mouseX = e.clientX - rect.left;
        let mouseY = e.clientY - rect.top;

        currentEnergy -= placingTowerCost;
        towers.push(new Tower(mouseX, mouseY, placingTowerType));
        
        placingTowerType = null;
        updateUI();
        document.getElementById('message-area').innerText = "Jawab soal di bawah untuk energi!";
    }
});

// --- RENDER & GAME LOOP MAIN ENGINE ---
function drawMap() {
    ctx.strokeStyle = '#4b5d67';
    ctx.lineWidth = 50;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
}

function gameLoop() {
    if(!gameStarted) return; // Tunggu tombol mulai ditekan

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();

    // Spawn Musuh secara acak setiap 2 detik (120 frame)
    if (frameCount % 120 === 0) {
        let randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        enemies.push(new Enemy(randomType));
    }

    towers.forEach(t => { t.update(); t.draw(); });
    
    enemies.forEach(e => { e.update(); e.draw(); });
    enemies = enemies.filter(e => e.hp > 0); 

    projectiles.forEach(p => { p.update(); p.draw(); });
    projectiles = projectiles.filter(p => p.active !== false);

    frameCount++;
    if(baseHp > 0) {
        requestAnimationFrame(gameLoop);
    }
}

// --- TOMBOL MULAI ---
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-screen').classList.add('hidden');
    gameStarted = true;
    loadNextQuestion(); // Memanggil soal pertama
    updateUI();
    gameLoop(); // Menjalankan engine
});
