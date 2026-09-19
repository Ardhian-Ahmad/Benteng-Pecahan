const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- STATE GAME ---
let gameStarted = false;
let isGameWon = false;
let isGameOver = false;
let baseHp = 10;
let currentEnergy = 0; 
let enemies = [];
let towers = [];
let projectiles = [];
let frameCount = 0;
let placingTowerType = null;
let placingTowerCost = 0;

// --- SISTEM LEVEL & WAVE ---
const levelConfig = [
    { level: 1, maxWaves: 5, baseEnemyCount: 5, hpMultiplier: 1.0, speedMultiplier: 1.0 },
    { level: 2, maxWaves: 6, baseEnemyCount: 8, hpMultiplier: 1.5, speedMultiplier: 1.2 },
    { level: 3, maxWaves: 8, baseEnemyCount: 12, hpMultiplier: 2.5, speedMultiplier: 1.5 }
];

let currentLevelIdx = 0;
let currentWave = 1;
let enemiesToSpawn = 0;
let enemiesSpawned = 0;
let waveActive = false;

// --- BANK SOAL EDUKASI ---
const quizBank = [
    { q: "1/2 + 1/4 = ...", options: ["3/4", "1/4", "1"], answer: "3/4" },
    { q: "Bentuk sederhana 4/8 adalah...", options: ["1/4", "1/3", "1/2"], answer: "1/2" },
    { q: "1 - 1/3 = ...", options: ["1/3", "2/3", "1"], answer: "2/3" },
    { q: "Pecahan senilai dengan 2/3", options: ["4/6", "3/4", "4/5"], answer: "4/6" },
    { q: "1/2 x 1/2 = ...", options: ["1/4", "1", "2/4"], answer: "1/4" },
    { q: "Mana yang paling besar?", options: ["1/2", "3/4", "1/4"], answer: "3/4" },
    { q: "1/4 + 1/4 = ...", options: ["1/2", "2/8", "1"], answer: "1/2" },
    { q: "3/4 - 1/4 = ...", options: ["1/2", "1/4", "2/4"], answer: "1/2" }
];
let currentQuestion = null;

// --- MUSUH & JALUR ---
const enemyTypes = [
    { name: "Normal", color: '#e94560', baseHp: 100, baseSpeed: 1.5, radius: 15 }, 
    { name: "Cepat", color: '#f9d342', baseHp: 60, baseSpeed: 2.8, radius: 12 },   
    { name: "Tank", color: '#9b59b6', baseHp: 300, baseSpeed: 0.8, radius: 22 }    
];

const path = [
    { x: -50, y: canvas.height * 0.3 },
    { x: canvas.width * 0.4, y: canvas.height * 0.3 },
    { x: canvas.width * 0.4, y: canvas.height * 0.7 },
    { x: canvas.width * 0.8, y: canvas.height * 0.7 },
    { x: canvas.width * 0.8, y: canvas.height * 0.2 },
    { x: canvas.width + 50, y: canvas.height * 0.2 }
];

// --- FUNGSI UI & KUIS ---
function loadNextQuestion() {
    currentQuestion = quizBank[Math.floor(Math.random() * quizBank.length)];
    document.getElementById('question-text').innerText = "Soal: " + currentQuestion.q;
    let shuffledOptions = [...currentQuestion.options].sort(() => Math.random() - 0.5);
    let buttons = document.querySelectorAll('.quiz-btn');
    buttons.forEach((btn, index) => {
        btn.innerText = shuffledOptions[index];
        btn.style.background = "#4ecca3"; 
    });
}

function checkAnswer(btn) {
    // Hindari double click dari touchstart dan click
    if(btn.style.background === "rgb(255, 215, 0)" || btn.style.background === "rgb(233, 69, 96)") return;

    if(btn.innerText === currentQuestion.answer) {
        currentEnergy += 1;
        updateUI();
        document.getElementById('message-area').innerText = "BENAR! +1 Energi ⭐";
        document.getElementById('message-area').style.color = "#f9d342";
        btn.style.background = "#ffd700"; 
        setTimeout(loadNextQuestion, 400); 
    } else {
        document.getElementById('message-area').innerText = "SALAH! Coba lagi.";
        document.getElementById('message-area').style.color = "red";
        btn.style.background = "#e94560"; 
    }
}

function updateUI() {
    document.getElementById('energy-display').innerText = currentEnergy;
    document.querySelectorAll('.tower-btn').forEach(btn => {
        let cost = parseInt(btn.getAttribute('data-cost'));
        if (currentEnergy >= cost) btn.classList.remove('disabled');
        else btn.classList.add('disabled');
    });
}

// --- PEMBELIAN & PENEMPATAN MENARA ---
// Dipanggil langsung dari atribut HTML (onclick/ontouchstart)
function selectTower(type, cost) {
    if (currentEnergy >= cost) {
        placingTowerType = type;
        placingTowerCost = cost;
        document.getElementById('message-area').innerText = "Sentuh peta untuk menaruh menara!";
        document.getElementById('message-area').style.color = "#4ecca3";
    }
}

// Event listener sentuhan di kanvas (Mendukung PC dan Tablet)
canvas.addEventListener('pointerdown', placeTower);

function placeTower(e) {
    if (placingTowerType && !isGameOver && !isGameWon) {
        let rect = canvas.getBoundingClientRect();
        let mouseX = e.clientX - rect.left;
        let mouseY = e.clientY - rect.top;

        currentEnergy -= placingTowerCost;
        towers.push(new Tower(mouseX, mouseY, placingTowerType));
        placingTowerType = null;
        updateUI();
        document.getElementById('message-area').innerText = "Jawab soal di bawah untuk energi!";
    }
}

// --- LOGIKA WAVE & LEVEL ---
function startWave() {
    let config = levelConfig[currentLevelIdx];
    enemiesToSpawn = config.baseEnemyCount + (currentWave * 2);
    enemiesSpawned = 0;
    waveActive = true;
    document.getElementById('wave-display').innerText = `Level ${config.level} - Wave ${currentWave} / ${config.maxWaves}`;
    document.getElementById('announcement-overlay').classList.add('hidden');
}

function showAnnouncement(title, desc, timeoutDuration) {
    document.getElementById('announce-title').innerText = title;
    document.getElementById('announce-desc').innerText = desc;
    document.getElementById('announcement-overlay').classList.remove('hidden');
    
    if(timeoutDuration > 0) {
        setTimeout(startWave, timeoutDuration);
    }
}

function checkWaveProgress() {
    if (waveActive && enemiesSpawned >= enemiesToSpawn && enemies.length === 0) {
        waveActive = false; // Wave selesai
        let config = levelConfig[currentLevelIdx];
        
        if (currentWave < config.maxWaves) {
            // Lanjut ke wave berikutnya di level yang sama
            currentWave++;
            showAnnouncement(`Wave Selesai!`, `Bersiaplah untuk Wave ${currentWave}...`, 3000);
        } else {
            // Level Selesai
            if (currentLevelIdx < levelConfig.length - 1) {
                currentLevelIdx++;
                currentWave = 1;
                showAnnouncement(`Level ${config.level} Selesai!`, `Memasuki Level ${levelConfig[currentLevelIdx].level}...`, 4000);
            } else {
                // Game Tamat
                isGameWon = true;
                showAnnouncement(`🏆 SELAMAT! 🏆`, `Kamu berhasil memenangkan game ini!`, 0);
            }
        }
    }
}

// --- KELAS ENTITAS ---
class Enemy {
    constructor(typeParams) {
        let config = levelConfig[currentLevelIdx];
        this.x = path[0].x;
        this.y = path[0].y;
        this.pathIndex = 1;
        
        // Atribut ditingkatkan berdasarkan level
        this.speed = typeParams.baseSpeed * config.speedMultiplier;
        this.maxHp = typeParams.baseHp * config.hpMultiplier;
        this.hp = this.maxHp;
        
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
            if(baseHp <= 0 && !isGameOver) {
                isGameOver = true;
                showAnnouncement(`GAME OVER`, `Benteng Hancur! Refresh halaman untuk mengulang.`, 0);
            }
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

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
        this.damage = type === 'fire' ? 40 : type === 'lightning' ? 120 : 15;
    }

    update() {
        let dx = this.target.x - this.x;
        let dy = this.target.y - this.y;
        let distance = Math.hypot(dx, dy);

        if (distance < this.speed) {
            this.target.hp -= this.damage;
            if(this.type === 'ice') this.target.speed *= 0.9; 
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

// --- RENDER & GAME LOOP ---
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
    if(!gameStarted || isGameOver || isGameWon) return; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();

    // Spawn Logic
    if (waveActive && enemiesSpawned < enemiesToSpawn) {
        // Spawn semakin cepat jika level tinggi (interval frame berkurang)
        let spawnInterval = 120 - (currentLevelIdx * 20); 
        if (frameCount % spawnInterval === 0) {
            let randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            enemies.push(new Enemy(randomType));
            enemiesSpawned++;
        }
    }

    towers.forEach(t => { t.update(); t.draw(); });
    
    enemies.forEach(e => { e.update(); e.draw(); });
    enemies = enemies.filter(e => e.hp > 0); 

    projectiles.forEach(p => { p.update(); p.draw(); });
    projectiles = projectiles.filter(p => p.active !== false);

    checkWaveProgress(); // Cek apakah wave sudah selesai

    frameCount++;
    if(baseHp > 0) {
        requestAnimationFrame(gameLoop);
    }
}

// --- KONTROL MULAI ---
function startGame() {
    if(gameStarted) return; 
    document.getElementById('start-screen').classList.add('hidden');
    gameStarted = true;
    loadNextQuestion(); 
    updateUI();
    startWave(); // Memulai Level 1 Wave 1
    gameLoop(); 
}
