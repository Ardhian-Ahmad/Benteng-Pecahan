const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let w, h;
function resizeCanvas() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- SISTEM AUDIO (Web Audio API) ---
let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}
function playSound(freq, type, duration, vol = 0.1) {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
}
const sfx = {
    shoot: () => playSound(400 + Math.random()*100, 'square', 0.1, 0.05),
    hit: () => playSound(100, 'sawtooth', 0.1, 0.1),
    correct: () => { playSound(600, 'sine', 0.1); setTimeout(()=>playSound(900, 'sine', 0.2), 100); },
    wrong: () => playSound(200, 'sawtooth', 0.3, 0.2),
    upgrade: () => { playSound(400, 'square', 0.1); setTimeout(()=>playSound(800, 'square', 0.2), 100); },
    bossWarn: () => playSound(150, 'square', 0.3, 0.3),
    bossDestroy: () => playSound(50, 'sawtooth', 0.8, 0.5)
};

function showMessage(text, color = "#4ecca3") {
    let msg = document.getElementById('message-area');
    msg.innerText = text;
    msg.style.color = color;
}

// --- STATE GAME ---
let gameStarted = false; let isGameWon = false; let isGameOver = false;
let teamName = "Tim Misterius";
let baseHp = 10; let currentEnergy = 0; let score = 0; let frameCount = 0;
let enemies = []; let towers = []; let projectiles = []; let soldiers = []; let particles = [];
let placingTowerType = null; let placingTowerCost = 0;

// --- SISTEM LEVEL, WAVE & PETA ---
const levelConfig = [
    { level: 1, maxWaves: 5, baseEnemyCount: 4, hpMult: 1.0, speedMult: 1.0 },
    { level: 2, maxWaves: 6, baseEnemyCount: 6, hpMult: 1.5, speedMult: 1.1 },
    { level: 3, maxWaves: 8, baseEnemyCount: 8, hpMult: 2.2, speedMult: 1.3 }
];
let currentLevelIdx = 0; let currentWave = 1;
let enemiesToSpawn = 0; let enemiesSpawned = 0; let waveActive = false;
let currentPath = [];

function loadMapForLevel(level) {
    if (level === 0) currentPath = [{x:-50, y:h*0.3}, {x:w*0.3, y:h*0.3}, {x:w*0.3, y:h*0.7}, {x:w*0.7, y:h*0.7}, {x:w*0.7, y:h*0.2}, {x:w+50, y:h*0.2}];
    if (level === 1) currentPath = [{x:w*0.2, y:-50}, {x:w*0.2, y:h*0.5}, {x:w*0.6, y:h*0.5}, {x:w*0.6, y:h*0.8}, {x:w+50, y:h*0.8}];
    if (level === 2) currentPath = [{x:-50, y:h*0.8}, {x:w*0.2, y:h*0.8}, {x:w*0.2, y:h*0.3}, {x:w*0.5, y:h*0.3}, {x:w*0.5, y:h*0.8}, {x:w*0.8, y:h*0.8}, {x:w*0.8, y:-50}];
}

// --- BANK SOAL EDUKASI ---
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
    { q: "1/2 x 1/2 = ...", options: ["1/4", "1", "2/4"], answer: "1/4" }
];
let currentQuestion = null; let isAnswering = false;

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
    if(isAnswering) return; 
    isAnswering = true; initAudio();
    document.querySelectorAll('.quiz-btn').forEach(b => b.classList.add('locked'));

    if(btn.innerText === currentQuestion.answer) {
        currentEnergy += 1; score += 15; 
        showMessage("BENAR! +1 Energi ⭐", "#f9d342");
        btn.style.background = "#ffd700"; sfx.correct();
    } else {
        currentEnergy = Math.max(0, currentEnergy - 1); 
        showMessage("SALAH! Energi -1 ❌", "red");
        btn.style.background = "#e94560"; sfx.wrong();
    }
    updateUI();
    setTimeout(loadNextQuestion, 1500);
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

// --- KALKULASI PETA ---
function distToSegment(px, py, x1, y1, x2, y2) {
    let l2 = (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1);
    if (l2 === 0) return Math.hypot(px-x1, py-y1);
    let t = Math.max(0, Math.min(1, ((px-x1)*(x2-x1) + (py-y1)*(y2-y1)) / l2));
    let pX = x1 + t * (x2 - x1), pY = y1 + t * (y2 - y1);
    return { dist: Math.hypot(px - pX, py - pY), px: pX, py: pY };
}
function isInvalidPlacement(x, y) {
    for(let t of towers) if(Math.hypot(t.x-x, t.y-y) < 50) return true; 
    for(let i=0; i<currentPath.length-1; i++) {
        let d = distToSegment(x, y, currentPath[i].x, currentPath[i].y, currentPath[i+1].x, currentPath[i+1].y);
        if(d.dist < 50) return true; 
    }
    return false;
}

// --- KELAS ENTITAS (Dengan Gambar Custom) ---
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.vx = (Math.random() - 0.5) * 6; this.vy = (Math.random() - 0.5) * 6;
        this.life = 1.0;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= 0.05; }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 4, 4); ctx.globalAlpha = 1.0;
    }
}
function spawnParticles(x, y, color) { for(let i=0; i<10; i++) particles.push(new Particle(x, y, color)); }

class Soldier {
    constructor(x, y) {
        this.x = x + (Math.random()-0.5)*30; this.y = y + (Math.random()-0.5)*30;
        this.hp = 100; this.damage = 10; this.radius = 8;
    }
    draw() {
        ctx.fillStyle = '#27ae60'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'lightgreen'; ctx.fillRect(this.x - 10, this.y - 15, 20 * (this.hp / 100), 4);
    }
}

class Enemy {
    constructor(typeParams) {
        let config = levelConfig[currentLevelIdx];
        this.x = currentPath[0].x; this.y = currentPath[0].y;
        this.pathIndex = 1; this.isDead = false;
        
        this.type = typeParams.type;
        this.isBoss = typeParams.isBoss;
        
        this.normalSpeed = typeParams.baseSpeed * (this.isBoss ? 1 : config.speedMult);
        this.speed = this.normalSpeed;
        this.maxHp = typeParams.baseHp * (this.isBoss ? 1 : config.hpMult);
        this.hp = this.maxHp;
        this.radius = typeParams.radius;
        this.color = typeParams.color;
        this.abilityTimer = 0;
        this.isCasting = false;
    }

    update() {
        let blocked = false;
        for (let i = soldiers.length - 1; i >= 0; i--) {
            let s = soldiers[i];
            if (Math.hypot(this.x - s.x, this.y - s.y) < this.radius + s.radius + 5) {
                blocked = true;
                if (frameCount % 30 === 0) { 
                    s.hp -= (this.isBoss ? 50 : 15);
                    this.hp -= s.damage;
                    spawnParticles(this.x, this.y, '#fff');
                }
                if (s.hp <= 0) soldiers.splice(i, 1);
                break;
            }
        }
        
        this.speed = (blocked || this.isCasting) ? 0 : this.normalSpeed;

        if (this.pathIndex < currentPath.length) {
            if(!blocked && !this.isCasting) {
                let target = currentPath[this.pathIndex];
                let dx = target.x - this.x, dy = target.y - this.y;
                let distance = Math.hypot(dx, dy);

                if (distance < this.speed) {
                    this.x = target.x; this.y = target.y; this.pathIndex++;
                } else {
                    let angle = Math.atan2(dy, dx);
                    this.x += Math.cos(angle) * this.speed; this.y += Math.sin(angle) * this.speed;
                    this.rotation = angle; // Untuk orientasi gambar
                }
            }

            // Skill Boss Nerf: Delay & Hanya Hancurkan 1 Tower
            if (this.isBoss && towers.length > 0) {
                this.abilityTimer++;
                if (this.abilityTimer === 300) { // Peringatan mulai
                    this.isCasting = true;
                    showMessage("⚠️ AWAS! BOSS BERSIAK MENGHANCURKAN 1 MENARA!", "orange");
                    sfx.bossWarn();
                }
                if (this.abilityTimer >= 400) { // Setelah delay ~1.5 detik
                    this.isCasting = false; this.abilityTimer = 0;
                    for (let i = towers.length - 1; i >= 0; i--) {
                        if (Math.hypot(this.x - towers[i].x, this.y - towers[i].y) < 150) {
                            spawnParticles(towers[i].x, towers[i].y, 'red');
                            towers.splice(i, 1);
                            sfx.bossDestroy();
                            showMessage("⚠️ 1 MENARAMU HANCUR!", "red");
                            break; // Hanya hancurkan 1
                        }
                    }
                }
            }
        } else {
            baseHp -= this.isBoss ? 5 : 1; 
            document.getElementById('base-hp').innerText = baseHp;
            this.hp = 0; 
            if(baseHp <= 0 && !isGameOver) handleEndGame(false);
        }
    }

    draw() {
        if(this.isBoss) {
            ctx.beginPath(); ctx.arc(this.x, this.y, 150, 0, Math.PI * 2);
            ctx.fillStyle = this.isCasting ? "rgba(255, 165, 0, 0.3)" : "rgba(255, 0, 0, 0.1)";
            ctx.fill();
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation || 0);

        // Gambar Custom Berdasarkan Tipe Musuh
        if (this.type === 'normal') {
            ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
            // Mata monster
            ctx.fillStyle='white'; ctx.beginPath(); ctx.arc(5, -5, 4, 0, Math.PI*2); ctx.arc(5, 5, 4, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle='black'; ctx.beginPath(); ctx.arc(6, -5, 2, 0, Math.PI*2); ctx.arc(6, 5, 2, 0, Math.PI*2); ctx.fill();
        } 
        else if (this.type === 'fast') {
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.moveTo(this.radius+5, 0); ctx.lineTo(-this.radius, -this.radius); ctx.lineTo(-this.radius/2, 0); ctx.lineTo(-this.radius, this.radius); ctx.closePath(); ctx.fill();
        } 
        else if (this.type === 'tank') {
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.radius, -this.radius, this.radius*2, this.radius*2);
            ctx.fillStyle = 'gray'; // Armor pelat
            ctx.fillRect(-this.radius-4, -this.radius/2, 4, this.radius); ctx.fillRect(this.radius, -this.radius/2, 4, this.radius);
        } 
        else if (this.isBoss) {
            ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
            // Mahkota
            ctx.fillStyle = 'gold'; ctx.beginPath(); ctx.moveTo(0, -this.radius-20); ctx.lineTo(15, -this.radius); ctx.lineTo(-15, -this.radius); ctx.closePath(); ctx.fill();
            // Satu mata besar di tengah
            ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();
        }

        ctx.restore();

        // Bar Darah
        ctx.fillStyle = 'red'; ctx.fillRect(this.x - 15, this.y - this.radius - 15, 30, 5);
        ctx.fillStyle = 'lightgreen'; ctx.fillRect(this.x - 15, this.y - this.radius - 15, 30 * (this.hp / this.maxHp), 5);
    }
}

class Tower {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type; this.tier = 1;
        this.upgradeCost = type === 'barracks' ? 3 : type === 'ice' ? 2 : type === 'fire' ? 3 : 5;
        
        if(type === 'barracks') {
            this.range = 0; this.cooldown = 400; this.color = '#27ae60';
            this.spawnSoldiers();
        } else {
            // Rebalance Range & Cooldown
            this.range = type === 'ice' ? 120 : type === 'fire' ? 140 : 200;
            this.cooldown = type === 'ice' ? 20 : type === 'fire' ? 60 : 150; // Ice sangat cepat, Petir sangat lambat
            this.color = type === 'ice' ? '#a2d5f2' : type === 'fire' ? '#ff7b54' : '#ffd700';
        }
        this.timer = 0;
    }

    spawnSoldiers() {
        let minDist = Infinity, pX = this.x, pY = this.y;
        for(let i=0; i<currentPath.length-1; i++) {
            let d = distToSegment(this.x, this.y, currentPath[i].x, currentPath[i].y, currentPath[i+1].x, currentPath[i+1].y);
            if(d.dist < minDist) { minDist = d.dist; pX = d.px; pY = d.py; }
        }
        for(let i=0; i<3; i++) soldiers.push(new Soldier(pX, pY));
    }

    update() {
        if(this.type === 'barracks') {
            this.timer++;
            if(this.timer >= this.cooldown) { this.spawnSoldiers(); this.timer = 0; }
            return;
        }

        this.timer++;
        if (this.timer >= this.cooldown) {
            let target = null, closestDist = this.range;
            for (let enemy of enemies) {
                let dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist < closestDist) { closestDist = dist; target = enemy; }
            }
            if (target) {
                projectiles.push(new Projectile(this.x, this.y, target, this.type, this.tier));
                sfx.shoot();
                this.timer = 0;
            }
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        if(this.type === 'barracks') {
            ctx.beginPath(); ctx.arc(this.x, this.y, 20, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
            ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)"; ctx.fill();
        }
        ctx.fillStyle = "white"; ctx.font = "14px Arial";
        ctx.fillText("Lv." + this.tier, this.x - 12, this.y + 5);
    }
}

class Projectile {
    constructor(x, y, target, type, tier) {
        this.x = x; this.y = y; this.target = target; this.type = type;
        this.speed = 12;
        // Rebalance Base Damage
        let baseDmg = type === 'fire' ? 25 : type === 'lightning' ? 100 : 8;
        this.damage = baseDmg * (1 + (tier-1)*0.5); 
    }

    update() {
        if(this.target.hp <= 0) { this.active = false; return; }
        let dx = this.target.x - this.x, dy = this.target.y - this.y;
        let distance = Math.hypot(dx, dy);

        if (distance < this.speed) {
            // SISTEM EFEKTIVITAS BENTURAN (Kelemahan Musuh)
            let finalDmg = this.damage;
            if(this.type === 'ice' && this.target.type === 'fast') finalDmg *= 2.0;
            if(this.type === 'fire' && this.target.type === 'normal') finalDmg *= 2.0;
            if(this.type === 'lightning' && this.target.type === 'tank') finalDmg *= 2.0;

            this.target.hp -= finalDmg;
            if(this.type === 'ice') this.target.speed = Math.max(0.5, this.target.speed * 0.85); 
            
            this.active = false;
            sfx.hit();
            spawnParticles(this.target.x, this.target.y, this.type === 'fire'?'orange':'#fff');

            if(this.target.hp <= 0 && !this.target.isDead) {
                this.target.isDead = true;
                score += this.target.isBoss ? 500 : (this.target.type === 'tank' ? 30 : 20); 
                updateUI();
            }
        } else {
            this.x += (dx / distance) * this.speed; this.y += (dy / distance) * this.speed;
        }
    }

    draw() {
        ctx.fillStyle = this.type === 'ice' ? '#fff' : this.type === 'fire' ? 'orange' : 'yellow';
        ctx.beginPath(); ctx.arc(this.x, this.y, 5, 0, Math.PI * 2); ctx.fill();
    }
}

// --- INTERAKSI KANVAS ---
function selectTower(type, cost) {
    if (currentEnergy >= cost) {
        placingTowerType = type; placingTowerCost = cost;
        showMessage("Sentuh peta untuk menaruh menara!");
    }
}

canvas.addEventListener('pointerdown', function(e) {
    initAudio();
    let rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;

    if (placingTowerType && !isGameOver && !isGameWon) {
        if(isInvalidPlacement(mouseX, mouseY)) {
            showMessage("Terlalu dekat dengan jalan/menara!", "red");
            sfx.wrong(); return;
        }
        currentEnergy -= placingTowerCost;
        towers.push(new Tower(mouseX, mouseY, placingTowerType));
        placingTowerType = null;
        updateUI();
        showMessage("Jawab soal di bawah untuk energi!");
        return;
    }

    if(!placingTowerType && !isGameOver) {
        for(let t of towers) {
            if(Math.hypot(mouseX - t.x, mouseY - t.y) < 30) {
                if(t.tier < 3 && currentEnergy >= t.upgradeCost) {
                    currentEnergy -= t.upgradeCost;
                    t.tier++; t.range *= 1.1; t.upgradeCost *= 2;
                    sfx.upgrade(); spawnParticles(t.x, t.y, '#ffd700'); updateUI();
                    showMessage(`${t.type.toUpperCase()} Naik ke Lv.${t.tier}!`);
                } else if(t.tier === 3) {
                    showMessage("Level Maksimal!");
                } else {
                    showMessage(`Butuh ${t.upgradeCost} Energi untuk Upgrade!`, "red");
                }
                return;
            }
        }
    }
});

// --- LOGIKA WAVE & LEVEL ---
const enemyTypesArr = [
    { type: "normal", color: '#e94560', baseHp: 100, baseSpeed: 1.5, radius: 15, isBoss: false }, 
    { type: "fast", color: '#f9d342', baseHp: 50, baseSpeed: 3.5, radius: 12, isBoss: false },   
    { type: "tank", color: '#9b59b6', baseHp: 300, baseSpeed: 0.8, radius: 22, isBoss: false }    
];
const bossType = { type: "boss", color: '#ff0044', baseHp: 2500, baseSpeed: 0.6, radius: 45, isBoss: true };

function startWave() {
    let config = levelConfig[currentLevelIdx];
    enemiesToSpawn = config.baseEnemyCount + (currentWave * 2);
    enemiesSpawned = 0; waveActive = true;
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
                currentLevelIdx++; currentWave = 1;
                loadMapForLevel(currentLevelIdx); 
                towers = []; soldiers = []; projectiles = []; particles = []; 
                showAnnouncement(`Level ${config.level} Selesai!`, `Memasuki Level ${levelConfig[currentLevelIdx].level}...`, 4000);
            } else {
                handleEndGame(true); 
            }
        }
    }
}

function handleEndGame(isWin) {
    isGameOver = true; isGameWon = isWin;
    document.getElementById('announcement-overlay').classList.add('hidden');
    
    let hof = JSON.parse(localStorage.getItem('pecahanHOF')) || [];
    let existingIndex = hof.findIndex(e => e.name === teamName);
    if(existingIndex !== -1) {
        if(score > hof[existingIndex].score) hof[existingIndex].score = score;
    } else {
        hof.push({ name: teamName, score: score });
    }
    hof.sort((a,b) => b.score - a.score);
    hof = hof.slice(0, 5); 
    localStorage.setItem('pecahanHOF', JSON.stringify(hof));

    document.getElementById('final-score-text').innerText = `Skor Akhir ${teamName}: ${score}`;
    let listHTML = "<ol style='padding-left: 20px; font-size:1.5rem; text-align:left;'>";
    hof.forEach(e => { listHTML += `<li style='margin-bottom:8px'><b>${e.name}</b> : ${e.score} Pts</li>`; });
    listHTML += "</ol>";
    document.getElementById('leaderboard-list').innerHTML = listHTML;
    document.getElementById('hof-screen').classList.remove('hidden');
}

// --- RENDER ---
function drawMap() {
    ctx.strokeStyle = '#4b5d67'; ctx.lineWidth = 50; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(currentPath[0].x, currentPath[0].y);
    for (let i = 1; i < currentPath.length; i++) ctx.lineTo(currentPath[i].x, currentPath[i].y);
    ctx.stroke();
}

function gameLoop() {
    if(!gameStarted || isGameOver || isGameWon) return; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();

    if (waveActive && enemiesSpawned < enemiesToSpawn) {
        let config = levelConfig[currentLevelIdx];
        if (currentWave === config.maxWaves && enemiesSpawned === enemiesToSpawn - 1) {
            enemies.push(new Enemy(bossType));
            enemiesSpawned++;
            sfx.bossWarn();
        } else {
            let spawnInterval = 120 - (currentLevelIdx * 20); 
            if (frameCount % spawnInterval === 0) {
                let availableTypes = (currentLevelIdx === 0 && currentWave === 1) ? [enemyTypesArr[0], enemyTypesArr[2]] : enemyTypesArr;
                let randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                enemies.push(new Enemy(randomType));
                enemiesSpawned++;
            }
        }
    }

    towers.forEach(t => { t.update(); t.draw(); });
    soldiers.forEach(s => s.draw());
    enemies.forEach(e => { e.update(); e.draw(); });
    enemies = enemies.filter(e => e.hp > 0); 
    projectiles.forEach(p => { p.update(); p.draw(); });
    projectiles = projectiles.filter(p => p.active !== false);
    particles.forEach(p => { p.update(); p.draw(); });
    particles = particles.filter(p => p.life > 0);

    checkWaveProgress(); 
    frameCount++;
    if(baseHp > 0) requestAnimationFrame(gameLoop);
}

// --- KONTROL TOMBOL ---
function startGame() {
    let nameInput = document.getElementById('team-name-input').value.trim();
    if(!nameInput) { alert("Masukkan Nama Tim dulu!"); return; }
    
    initAudio(); teamName = nameInput;
    document.getElementById('team-display').innerText = teamName;
    document.getElementById('start-screen').classList.add('hidden');
    
    loadMapForLevel(0); gameStarted = true;
    loadNextQuestion(); updateUI(); startWave(); gameLoop(); 
}

function playAgain() {
    initAudio(); isGameOver = false; isGameWon = false;
    baseHp = 10; currentEnergy = 0; score = 0; frameCount = 0;
    currentLevelIdx = 0; currentWave = 1;
    enemies = []; towers = []; projectiles = []; soldiers = []; particles = [];
    
    document.getElementById('base-hp').innerText = baseHp;
    document.getElementById('hof-screen').classList.add('hidden');
    
    loadMapForLevel(0); updateUI(); startWave(); gameLoop();
}
