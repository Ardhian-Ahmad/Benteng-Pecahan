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
let score = 0;
let enemies = [];
let towers = [];
let projectiles = [];
let frameCount = 0;
let placingTowerType = null;
let placingTowerCost = 0;

// --- SISTEM LEVEL & WAVE ---
const levelConfig = [
    { level: 1, maxWaves: 5, baseEnemyCount: 5, hpMult: 1.0, speedMult: 1.0 },
    { level: 2, maxWaves: 6, baseEnemyCount: 8, hpMult: 1.5, speedMult: 1.2 },
    { level: 3, maxWaves: 8, baseEnemyCount: 12, hpMult: 2.5, speedMult: 1.5 }
];

let currentLevelIdx = 0;
let currentWave = 1;
let enemiesToSpawn = 0;
let enemiesSpawned = 0;
let waveActive = false;

// --- BANK SOAL EDUKASI (Diperluas) ---
const quizBank = [
    { q: "1/2 + 1/4 = ...", options: ["3/4", "1/4", "1"], answer: "3/4" },
    { q: "Bentuk sederhana 6/8 adalah...", options: ["1/4", "3/4", "1/2"], answer: "3/4" },
    { q: "1 - 1/3 = ...", options: ["1/3", "2/3", "1"], answer: "2/3" },
    { q: "Pecahan senilai dengan 1/3", options: ["2/6", "3/4", "4/5"], answer: "2/6" },
    { q: "2/3 x 1/2 = ...", options: ["1/3", "2/5", "1/6"], answer: "1/3" },
    { q: "Mana yang paling besar?", options: ["1/2", "3/4", "1/3"], answer: "3/4" },
    { q: "Bentuk desimal dari 1/2", options: ["0.5", "0.2", "1.2"], answer: "0.5" },
    { q: "Bentuk persen dari 1/4", options: ["25%", "40%", "50%"], answer: "25%" },
    { q: "3/4 - 1/4 = ...", options: ["1/2", "1/4", "2/4"], answer: "1/2" },
    { q: "1/5 + 2/5 = ...", options: ["3/5", "3/10", "2/5"], answer: "3/5" }
];
let currentQuestion = null;
let isAnswering = false; // Anti-spam lock

// --- MUSUH, BOSS & JALUR ---
const enemyTypes = [
    { name: "Normal", color: '#e94560', baseHp: 100, baseSpeed: 1.5, radius: 15, isBoss: false }, 
    { name: "Cepat", color: '#f9d342', baseHp: 60, baseSpeed: 2.8, radius: 12, isBoss: false },   
    { name: "Tank", color: '#9b59b6', baseHp: 250, baseSpeed: 0.8, radius: 22, isBoss: false }    
];

const bossTypes = [
    { name: "Boss 1", color: '#ff0044', baseHp: 1500, baseSpeed: 0.5, radius: 45, isBoss: true },
    { name: "Boss 2", color: '#ff0044', baseHp: 3000, baseSpeed: 0.6, radius: 55, isBoss: true },
    { name: "Boss 3", color: '#ff0044', baseHp: 6000, baseSpeed: 0.7, radius: 65, isBoss: true }
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
        btn.classList.remove('locked');
    });
    isAnswering = false;
}

function checkAnswer(btn) {
    if(isAnswering) return; // Kunci tombol jika sedang jeda
    isAnswering = true;

    let buttons = document.querySelectorAll('.quiz-btn');
    buttons.forEach(b => b.classList.add('locked'));

    let msg = document.getElementById('message-area');
    if(btn.innerText === currentQuestion.answer) {
        currentEnergy += 1;
        score += 10; // Skor tambahan jawab benar
        msg.innerText = "BENAR! +1 Energi ⭐";
        msg.style.color = "#f9d342";
        btn.style.background = "#ffd700"; 
    } else {
        currentEnergy = Math.max(0, currentEnergy - 1); // PENALTI ENERGI
        msg.innerText = "SALAH! Energi -1 ❌";
        msg.style.color = "red";
        btn.style.background = "#e94560"; 
    }
    updateUI();
    setTimeout(loadNextQuestion, 1500); // Jeda 1.5 detik anti-spam
}

function updateUI() {
    document.getElementById('energy-display').innerText = currentEnergy;
    document.getElementById('score-display').innerText = score;
    document.querySelectorAll('.tower-btn').forEach(btn => {
        let cost = parseInt(btn.getAttribute('data-cost'));
        if (currentEnergy >= cost) btn.classList.remove('disabled');
        else btn.classList.add('disabled');
    });
}

// --- PEMBELIAN & PENEMPATAN MENARA ---
function selectTower(type, cost) {
    if (currentEnergy >= cost) {
        placingTowerType = type;
        placingTowerCost = cost;
        document.getElementById('message-area').innerText = "Sentuh peta untuk menaruh menara!";
        document.getElementById('message-area').style.color = "#4ecca3";
    }
}

canvas.addEventListener('pointerdown', function(e) {
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
});

// --- LOGIKA WAVE & LEVEL ---
function startWave() {
    let config = levelConfig[currentLevelIdx];
    enemiesToSpawn = config.baseEnemyCount + (currentWave * 2);
    enemiesSpawned = 0;
    waveActive = true;
    document.getElementById('wave-display').innerText = `Lvl ${config.level} - Wave ${currentWave} / ${config.maxWaves}`;
    document.getElementById('announcement-overlay').classList.add('hidden');
}

function showAnnouncement(title, desc, timeoutDuration) {
    document.getElementById('announce-title').innerText = title;
    document.getElementById('announce-desc').innerText = desc;
    document.getElementById('announcement-overlay').classList.remove('hidden');
    if(timeoutDuration > 0) setTimeout(startWave, timeoutDuration);
}

function checkWaveProgress() {
    if (waveActive && enemiesSpawned >= enemiesToSpawn && enemies.length === 0) {
        waveActive = false; 
        let config = levelConfig[currentLevelIdx];
        
        if (currentWave < config.maxWaves) {
            currentWave++;
            showAnnouncement(`Wave Selesai!`, `Persiapan Wave ${currentWave}...`, 3000);
        } else {
            if (currentLevelIdx < levelConfig.length - 1) {
                currentLevelIdx++;
                currentWave = 1;
                showAnnouncement(`Level ${config.level} Selesai!`, `Memasuki Level ${levelConfig[currentLevelIdx].level}...`, 4000);
            } else {
                handleEndGame(true); // Game Tamat Menang
            }
        }
    }
}

function handleEndGame(isWin) {
    isGameOver = true;
    isGameWon = isWin;
    document.getElementById('announcement-overlay').classList.add('hidden');
    
    // Minta Nama Tim
    let teamName = prompt(isWin ? "🏆 SELAMAT ANDA MENANG! Masukkan Nama Tim:" : "💀 GAME OVER! Masukkan Nama Tim:");
    if(!teamName) teamName = "Tim Misterius";

    // Simpan ke LocalStorage
    let hof = JSON.parse(localStorage.getItem('pecahanHOF')) || [];
    hof.push({ name: teamName, score: score });
    hof.sort((a,b) => b.score - a.score);
    hof = hof.slice(0, 5); // Simpan top 5
    localStorage.setItem('pecahanHOF', JSON.stringify(hof));

    // Tampilkan Papan Peringkat
    document.getElementById('final-score-text').innerText = `Skor Akhir Tim ${teamName}: ${score}`;
    let listHTML = "<ol style='padding-left: 20px;'>";
    hof.forEach(entry => {
        listHTML += `<li style='margin-bottom:8px'><b>${entry.name}</b> : ${entry.score} Poin</li>`;
    });
    listHTML += "</ol>";
    document.getElementById('leaderboard-list').innerHTML = listHTML;
    
    document.getElementById('hof-screen').classList.remove('hidden');
}

// --- KELAS ENTITAS ---
class Enemy {
    constructor(typeParams) {
        let config = levelConfig[currentLevelIdx];
        this.x = path[0].x;
        this.y = path[0].y;
        this.pathIndex = 1;
        this.isBoss = typeParams.isBoss;
        this.isDead = false;
        
        this.speed = typeParams.baseSpeed * (this.isBoss ? 1 : config.speedMult);
        this.maxHp = typeParams.baseHp * (this.isBoss ? 1 : config.hpMult);
        this.hp = this.maxHp;
        this.radius = typeParams.radius;
        this.color = typeParams.color;
        
        this.abilityTimer = 0; // Timer untuk skill boss
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

            // Skill Boss: Hancurkan Menara Acak setiap 5 detik (300 frame)
            if (this.isBoss && towers.length > 0) {
                this.abilityTimer++;
                if (this.abilityTimer >= 300) {
                    let targetIdx = Math.floor(Math.random() * towers.length);
                    towers.splice(targetIdx, 1); // Hapus menara
                    document.getElementById('message-area').innerText = "⚠️ BOSS MEMAKAN MENARA!";
                    document.getElementById('message-area').style.color = "red";
                    this.abilityTimer = 0;
                }
            }

        } else {
            baseHp -= this.isBoss ? 5 : 1; // Boss merusak lebih parah
            document.getElementById('base-hp').innerText = baseHp;
            this.hp = 0; 
            if(baseHp <= 0 && !isGameOver) handleEndGame(false);
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Mahkota untuk Boss
        if(this.isBoss) {
            ctx.fillStyle = "gold";
            ctx.fillRect(this.x - 10, this.y - this.radius - 15, 20, 10);
        }

        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 15, this.y - this.radius - 25, 30, 5);
        ctx.fillStyle = 'lightgreen';
        ctx.fillRect(this.x - 15, this.y - this.radius - 25, 30 * (this.hp / this.maxHp), 5);
    }
}

class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.range = type === 'ice' ? 120 : type === 'fire' ? 150 : 200;
        // Rebalance Speed: Ice (30f = 0.5s), Fire (60f = 1s), Lightning (150f = 2.5s)
        this.cooldown = type === 'ice' ? 30 : type === 'fire' ? 60 : 150; 
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
        this.speed = 10;
        this.type = type;
        // Rebalance Damage: Ice (10), Fire (35), Lightning (150)
        this.damage = type === 'fire' ? 35 : type === 'lightning' ? 150 : 10;
    }

    update() {
        if(this.target.hp <= 0) { this.active = false; return; } // Target sudah mati

        let dx = this.target.x - this.x;
        let dy = this.target.y - this.y;
        let distance = Math.hypot(dx, dy);

        if (distance < this.speed) {
            this.target.hp -= this.damage;
            if(this.type === 'ice') this.target.speed = Math.max(0.5, this.target.speed * 0.9); 
            this.active = false;

            // Logika Kematian & Skor
            if(this.target.hp <= 0 && !this.target.isDead) {
                this.target.isDead = true;
                score += this.target.isBoss ? 500 : 20; // Skor bunuh monster
                updateUI();
            }
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
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
}

function gameLoop() {
    if(!gameStarted || isGameOver) return; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();

    // Spawn Logic
    if (waveActive && enemiesSpawned < enemiesToSpawn) {
        let config = levelConfig[currentLevelIdx];
        
        // Cek jika ini adalah saatnya memunculkan BOSS
        if (currentWave === config.maxWaves && enemiesSpawned === enemiesToSpawn - 1) {
            enemies.push(new Enemy(bossTypes[currentLevelIdx]));
            enemiesSpawned++;
            document.getElementById('message-area').innerText = "⚠️ PERINGATAN: BOSS DATANG! ⚠️";
            document.getElementById('message-area').style.color = "red";
        } 
        else {
            let spawnInterval = 120 - (currentLevelIdx * 20); 
            if (frameCount % spawnInterval === 0) {
                let randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
                enemies.push(new Enemy(randomType));
                enemiesSpawned++;
            }
        }
    }

    towers.forEach(t => { t.update(); t.draw(); });
    
    enemies.forEach(e => { e.update(); e.draw(); });
    enemies = enemies.filter(e => e.hp > 0); 

    projectiles.forEach(p => { p.update(); p.draw(); });
    projectiles = projectiles.filter(p => p.active !== false);

    checkWaveProgress(); 

    frameCount++;
    if(baseHp > 0) requestAnimationFrame(gameLoop);
}

// --- KONTROL MULAI ---
function startGame() {
    if(gameStarted) return; 
    document.getElementById('start-screen').classList.add('hidden');
    gameStarted = true;
    loadNextQuestion(); 
    updateUI();
    startWave(); 
    gameLoop(); 
}
