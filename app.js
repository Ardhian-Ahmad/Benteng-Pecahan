// Masukkan URL Aplikasi Web Google Apps Script Anda di dalam tanda kutip ini:
const GOOGLE_SHEET_URL = "PASTE_URL_WEB_APP_DISINI";

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const W = 1200; const H = 700;
canvas.width = W; canvas.height = H;

function getPointerPos(e) {
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width; let scaleY = canvas.height / rect.height;
    let clientX = e.clientX, clientY = e.clientY;
    if (e.touches && e.touches.length > 0) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
}

// --- AUDIO ---
let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}
function playSound(freq, type, duration, vol = 0.1) {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
}
const sfx = {
    shoot: () => playSound(400 + Math.random()*100, 'square', 0.1, 0.05),
    hit: () => playSound(100, 'sawtooth', 0.1, 0.1),
    burn: () => playSound(50, 'sawtooth', 0.05, 0.05),
    correct: () => { playSound(600, 'sine', 0.1); setTimeout(()=>playSound(900, 'sine', 0.2), 100); },
    wrong: () => playSound(200, 'sawtooth', 0.3, 0.2),
    upgrade: () => { playSound(400, 'square', 0.1); setTimeout(()=>playSound(800, 'square', 0.2), 100); },
    bossWarn: () => playSound(150, 'square', 0.3, 0.3),
    bossDestroy: () => playSound(50, 'sawtooth', 0.8, 0.5)
};

function showMessage(text, color = "#4ecca3") {
    let msg = document.getElementById('message-area');
    msg.innerText = text; msg.style.color = color;
}

// --- INISIALISASI UI DINAMIS ---
function buildShopAndGallery() {
    let shopContainer = document.getElementById('shop-buttons-container');
    let galTower = document.getElementById('tower-gallery-list');
    let galEnemy = document.getElementById('enemy-gallery-list');
    
    shopContainer.innerHTML = '';
    Object.values(towerConfig).forEach(t => {
        shopContainer.innerHTML += `
            <button class="tower-btn" data-type="${t.id}" data-cost="${t.cost}" onclick="selectTower('${t.id}', ${t.cost})">
                <span class="tower-name">${t.icon} ${t.name}</span>
                <span class="tower-cost">${t.cost} Energi</span>
            </button>
        `;
        galTower.innerHTML += `
            <div class="gallery-card">
                <div class="card-icon">${t.icon}</div>
                <div class="card-info">
                    <h4>${t.name}</h4>
                    <span class="badge badge-cost">Harga: ${t.cost} ⭐</span>
                    <span class="badge badge-dmg">Dmg: ${t.baseDamage}</span>
                    <p>${t.desc}</p>
                </div>
            </div>
        `;
    });

    galEnemy.innerHTML = '';
    enemyTypesArr.forEach(e => {
        galEnemy.innerHTML += `
            <div class="gallery-card">
                <div class="card-icon" style="background:${e.color}">👾</div>
                <div class="card-info">
                    <h4>Tipe: ${e.type.toUpperCase()}</h4>
                    <span class="badge badge-dmg">HP: ${e.baseHp}</span>
                    <span class="badge badge-speed">Speed: ${e.baseSpeed}</span>
                </div>
            </div>
        `;
    });
    galEnemy.innerHTML += `
        <div class="gallery-card" style="border: 2px solid #ff0044;">
            <div class="card-icon" style="background:${bossType.color}">👑</div>
            <div class="card-info">
                <h4>${bossType.type.toUpperCase()}</h4>
                <span class="badge badge-dmg">HP: ${bossType.baseHp}</span>
                <span class="badge badge-speed">Skill: Hancurkan Menara</span>
                <p>Monster mematikan! Instant Game Over jika lolos.</p>
            </div>
        </div>
    `;
}

// --- STATE GAME ---
let gameStarted = false; let isGameWon = false; let isGameOver = false;
let teamName = "Tim Misterius";
let baseHp = 10; let currentEnergy = 0; let score = 0; let frameCount = 0;
let enemies = []; let towers = []; let projectiles = []; let soldiers = []; let particles = [];
let placingTowerType = null; let placingTowerCost = 0;

const levelConfig = [
    { level: 1, maxWaves: 5, baseEnemyCount: 4, hpMult: 1.0, speedMult: 1.0 },
    { level: 2, maxWaves: 6, baseEnemyCount: 6, hpMult: 1.5, speedMult: 1.1 },
    { level: 3, maxWaves: 8, baseEnemyCount: 8, hpMult: 2.2, speedMult: 1.3 }
];
let currentLevelIdx = 0; let currentWave = 1; let enemiesToSpawn = 0; let enemiesSpawned = 0; let waveActive = false; let currentPath = [];

function loadMapForLevel(level) {
    if (level === 0) currentPath = [{x:-50, y:H*0.3}, {x:W*0.3, y:H*0.3}, {x:W*0.3, y:H*0.7}, {x:W*0.7, y:H*0.7}, {x:W*0.7, y:H*0.2}, {x:W+50, y:H*0.2}];
    if (level === 1) currentPath = [{x:W*0.2, y:-50}, {x:W*0.2, y:H*0.5}, {x:W*0.6, y:H*0.5}, {x:W*0.6, y:H*0.8}, {x:W+50, y:H*0.8}];
    if (level === 2) currentPath = [{x:-50, y:H*0.8}, {x:W*0.2, y:H*0.8}, {x:W*0.2, y:H*0.3}, {x:W*0.5, y:H*0.3}, {x:W*0.5, y:H*0.8}, {x:W*0.8, y:H*0.8}, {x:W*0.8, y:-50}];
}

// --- KUIS ---
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
    updateUI(); setTimeout(loadNextQuestion, 1500);
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
    for(let t of towers) if(Math.hypot(t.x-x, t.y-y) < 60) return true; 
    for(let i=0; i<currentPath.length-1; i++) {
        let d = distToSegment(x, y, currentPath[i].x, currentPath[i].y, currentPath[i+1].x, currentPath[i+1].y);
        if(d.dist < 60) return true; 
    }
    return false;
}

// --- ENTITAS ---
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.vx = (Math.random() - 0.5) * 6; this.vy = (Math.random() - 0.5) * 6;
        this.life = 1.0;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= 0.05; }
    draw() { ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, 6, 6); ctx.globalAlpha = 1.0; }
}
function spawnParticles(x, y, color) { for(let i=0; i<10; i++) particles.push(new Particle(x, y, color)); }

class Soldier {
    constructor(x, y) {
        this.x = x + (Math.random()-0.5)*40; this.y = y + (Math.random()-0.5)*40;
        this.hp = 100; this.damage = towerConfig.barracks.baseDamage; this.radius = 10;
        this.isDead = false;
    }
    attack(enemiesList) {
        let hit = false;
        for(let e of enemiesList) {
            if(Math.hypot(this.x - e.x, this.y - e.y) < 50) { 
                e.takeDamage(this.damage); hit = true;
            }
        }
        if(hit) { spawnParticles(this.x, this.y, '#27ae60'); sfx.hit(); }
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
        
        this.type = typeParams.type; this.isBoss = typeParams.isBoss;
        this.normalSpeed = typeParams.baseSpeed * (this.isBoss ? 1 : config.speedMult);
        this.speed = this.normalSpeed;
        this.maxHp = typeParams.baseHp * (this.isBoss ? 1 : config.hpMult);
        this.hp = this.maxHp; this.radius = typeParams.radius;
        this.color = typeParams.color;
        
        this.abilityTimer = 0; this.isCasting = false;
        this.slowTimer = 0; this.burnTimer = 0; this.burnDamage = 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if(this.hp <= 0 && !this.isDead) {
            this.isDead = true;
            score += this.isBoss ? 500 : (this.type === 'tank' ? 30 : 20);
            updateUI();
        }
    }

    update() {
        if (this.burnTimer > 0) {
            this.burnTimer--;
            if(this.burnTimer % 30 === 0) { 
                this.takeDamage(this.burnDamage);
                spawnParticles(this.x, this.y, 'orange'); sfx.burn();
            }
        }

        if (this.slowTimer > 0) { this.slowTimer--; this.speed = this.normalSpeed * 0.5; } 
        else { this.speed = this.normalSpeed; }

        let blocked = false;
        for (let i = soldiers.length - 1; i >= 0; i--) {
            let s = soldiers[i];
            if (!s.isDead && Math.hypot(this.x - s.x, this.y - s.y) < this.radius + s.radius + 5) {
                blocked = true;
                if (frameCount % 60 === 0) { 
                    s.hp -= (this.isBoss ? 50 : 15);
                    s.attack(enemies);
                }
                if (s.hp <= 0) { s.isDead = true; soldiers.splice(i, 1); }
                break;
            }
        }
        
        this.speed = (blocked || this.isCasting) ? 0 : this.speed;

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
                    this.rotation = angle; 
                }
            }

            if (this.isBoss && towers.length > 0) {
                this.abilityTimer++;
                if (this.abilityTimer === 300) { this.isCasting = true; showMessage("⚠️ BOSS BERSIAK!", "orange"); sfx.bossWarn(); }
                if (this.abilityTimer >= 400) { 
                    this.isCasting = false; this.abilityTimer = 0;
                    for (let i = towers.length - 1; i >= 0; i--) {
                        if (Math.hypot(this.x - towers[i].x, this.y - towers[i].y) < 180) {
                            spawnParticles(towers[i].x, towers[i].y, 'red');
                            towers.splice(i, 1); sfx.bossDestroy();
                            showMessage("⚠️ MENARA HANCUR!", "red");
                            break; 
                        }
                    }
                }
            }
        } else {
            if (this.isBoss) {
                baseHp = 0; document.getElementById('base-hp').innerText = baseHp; this.hp = 0; 
                if(!isGameOver) { showMessage("⚠️ BENTENG DIHANCURKAN BOSS!", "red"); handleEndGame(false); }
            } else {
                baseHp -= 1; document.getElementById('base-hp').innerText = baseHp; this.hp = 0; 
                if(baseHp <= 0 && !isGameOver) handleEndGame(false);
            }
        }
    }

    draw() {
        if(this.isBoss) {
            ctx.beginPath(); ctx.arc(this.x, this.y, 180, 0, Math.PI * 2);
            ctx.fillStyle = this.isCasting ? "rgba(255, 165, 0, 0.3)" : "rgba(255, 0, 0, 0.1)"; ctx.fill();
        }

        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation || 0);

        if (this.type === 'normal') {
            ctx.fillStyle = this.slowTimer > 0 ? '#a2d5f2' : this.color; 
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle='white'; ctx.beginPath(); ctx.arc(6, -6, 5, 0, Math.PI*2); ctx.arc(6, 6, 5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle='black'; ctx.beginPath(); ctx.arc(7, -6, 2, 0, Math.PI*2); ctx.arc(7, 6, 2, 0, Math.PI*2); ctx.fill();
        } 
        else if (this.type === 'fast') {
            ctx.fillStyle = this.slowTimer > 0 ? '#a2d5f2' : this.color;
            ctx.beginPath(); ctx.moveTo(this.radius+5, 0); ctx.lineTo(-this.radius, -this.radius); ctx.lineTo(-this.radius/2, 0); ctx.lineTo(-this.radius, this.radius); ctx.closePath(); ctx.fill();
        } 
        else if (this.type === 'tank') {
            ctx.fillStyle = this.slowTimer > 0 ? '#a2d5f2' : this.color; 
            ctx.fillRect(-this.radius, -this.radius, this.radius*2, this.radius*2);
            ctx.fillStyle = 'gray'; ctx.fillRect(-this.radius-5, -this.radius/2, 5, this.radius); ctx.fillRect(this.radius, -this.radius/2, 5, this.radius);
        } 
        else if (this.isBoss) {
            ctx.fillStyle = this.slowTimer > 0 ? '#a2d5f2' : this.color; 
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'gold'; ctx.beginPath(); ctx.moveTo(0, -this.radius-25); ctx.lineTo(20, -this.radius); ctx.lineTo(-20, -this.radius); ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
        }

        if(this.burnTimer > 0) {
            ctx.fillStyle = 'orange'; ctx.beginPath(); ctx.moveTo(0, -this.radius); ctx.lineTo(8, -this.radius-15); ctx.lineTo(-8, -this.radius-15); ctx.closePath(); ctx.fill();
        }

        ctx.restore();
        ctx.fillStyle = 'red'; ctx.fillRect(this.x - 15, this.y - this.radius - 15, 30, 5);
        ctx.fillStyle = 'lightgreen'; ctx.fillRect(this.x - 15, this.y - this.radius - 15, 30 * (this.hp / this.maxHp), 5);
    }
}

class Tower {
    constructor(x, y, typeId) {
        let conf = towerConfig[typeId];
        this.x = x; this.y = y; this.type = typeId; this.tier = 1;
        this.range = conf.range; this.cooldown = conf.cooldown; 
        this.baseDamage = conf.baseDamage; this.effect = conf.effect;
        this.upgradeCost = conf.cost * 2;
        
        if(typeId === 'barracks') {
            this.color = '#27ae60'; this.mySoldiers = [];
            this.spawnX = 0; this.spawnY = 0; this.calculateSpawnPoint();
            for(let i=0; i<3; i++) this.spawnOneSoldier();
        } else {
            this.color = typeId === 'ice' ? '#a2d5f2' : typeId === 'fire' ? '#ff7b54' : '#ffd700';
        }
        this.timer = 0;
    }

    calculateSpawnPoint() {
        let minDist = Infinity;
        for(let i=0; i<currentPath.length-1; i++) {
            let d = distToSegment(this.x, this.y, currentPath[i].x, currentPath[i].y, currentPath[i+1].x, currentPath[i+1].y);
            if(d.dist < minDist) { minDist = d.dist; this.spawnX = d.px; this.spawnY = d.py; }
        }
    }

    spawnOneSoldier() {
        let s = new Soldier(this.spawnX, this.spawnY);
        this.mySoldiers.push(s); soldiers.push(s);
    }

    update() {
        if(this.type === 'barracks') {
            this.mySoldiers = this.mySoldiers.filter(s => !s.isDead);
            if(this.mySoldiers.length < 3) {
                this.timer++;
                if(this.timer >= this.cooldown) { this.spawnOneSoldier(); this.timer = 0; }
            } else { this.timer = 0; }
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
                projectiles.push(new Projectile(this.x, this.y, target, this.type, this.tier, this.baseDamage, this.effect));
                sfx.shoot(); this.timer = 0;
            }
        }
    }

    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, 60, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(233, 69, 96, 0.15)"; ctx.fill();

        ctx.fillStyle = this.color;
        if(this.type === 'barracks') {
            ctx.beginPath(); ctx.arc(this.x, this.y, 25, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillRect(this.x - 25, this.y - 25, 50, 50);
            ctx.beginPath(); ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.05)"; ctx.fill();
        }
        ctx.fillStyle = "white"; ctx.font = "bold 16px Arial";
        ctx.fillText("Lv." + this.tier, this.x - 15, this.y + 6);
    }
}

class Projectile {
    constructor(x, y, target, type, tier, baseDamage, effect) {
        this.x = x; this.y = y; this.target = target; this.type = type;
        this.speed = 15;
        this.damage = baseDamage * (1 + (tier-1)*0.5); 
        this.effect = effect; this.tier = tier;
    }

    update() {
        if(this.target.hp <= 0) { this.active = false; return; }
        let dx = this.target.x - this.x, dy = this.target.y - this.y;
        let distance = Math.hypot(dx, dy);

        if (distance < this.speed) {
            if (this.effect === 'pierce' && this.target.type === 'tank') this.damage *= 2; 

            this.target.takeDamage(this.damage);

            if (this.effect === 'slow') this.target.slowTimer = 120; 
            if (this.effect === 'burn') {
                this.target.burnTimer = 180; 
                this.target.burnDamage = 5 * this.tier; 
            }
            
            this.active = false; sfx.hit();
            spawnParticles(this.target.x, this.target.y, this.type === 'fire'?'orange':'#fff');
        } else {
            this.x += (dx / distance) * this.speed; this.y += (dy / distance) * this.speed;
        }
    }

    draw() {
        ctx.fillStyle = this.type === 'ice' ? '#fff' : this.type === 'fire' ? 'orange' : 'yellow';
        ctx.beginPath(); ctx.arc(this.x, this.y, 6, 0, Math.PI * 2); ctx.fill();
    }
}

// --- INTERAKSI KANVAS ---
function selectTower(type, cost) {
    if (currentEnergy >= cost) {
        placingTowerType = type; placingTowerCost = cost;
        showMessage("Sentuh area cetak biru yang aman untuk menaruh!");
    }
}

canvas.addEventListener('pointerdown', function(e) {
    initAudio();
    let pos = getPointerPos(e);
    let mouseX = pos.x, mouseY = pos.y;

    if (placingTowerType && !isGameOver && !isGameWon) {
        if(isInvalidPlacement(mouseX, mouseY)) {
            showMessage("Zona Merah! Terlalu dekat dengan jalan/menara!", "red");
            sfx.wrong(); return;
        }
        currentEnergy -= placingTowerCost;
        towers.push(new Tower(mouseX, mouseY, placingTowerType));
        placingTowerType = null; updateUI();
        showMessage("Jawab soal di bawah untuk energi!");
        return;
    }

    if(!placingTowerType && !isGameOver) {
        for(let t of towers) {
            if(Math.hypot(mouseX - t.x, mouseY - t.y) < 40) {
                if(t.tier < 3 && currentEnergy >= t.upgradeCost) {
                    currentEnergy -= t.upgradeCost;
                    t.tier++; t.range *= 1.15; t.upgradeCost *= 2;
                    sfx.upgrade(); spawnParticles(t.x, t.y, '#ffd700'); updateUI();
                    showMessage(`${towerConfig[t.type].name} Naik ke Lv.${t.tier}!`);
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

// --- LOGIKA WAVE ---
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

// ==========================================
// INTEGRASI API GOOGLE SHEETS (LEADERBOARD)
// ==========================================
function renderLeaderboard(hofData) {
    let listHTML = "<ol style='padding-left: 20px; text-align:left;'>";
    if(!hofData || hofData.length === 0) {
        listHTML += "<li>Belum ada data juara di Server.</li>";
    } else {
        hofData.forEach(e => { 
            listHTML += `<li style='margin-bottom:8px'><b>${e.name}</b> : ${e.score} Pts</li>`; 
        });
    }
    listHTML += "</ol>";
    document.getElementById('leaderboard-list').innerHTML = listHTML;
}

function handleEndGame(isWin) {
    isGameOver = true; isGameWon = isWin;
    document.getElementById('announcement-overlay').classList.add('hidden');
    
    document.getElementById('final-score-text').innerText = `Skor Akhir ${teamName}: ${score}`;
    document.getElementById('final-score-text').classList.remove('hidden');
    
    // UI Loading State
    document.getElementById('leaderboard-list').innerHTML = "<p style='text-align:center; color:#f9d342;'>Menyimpan skor ke server... 📡</p>";
    document.getElementById('hof-gameover-controls').classList.add('hidden');
    document.getElementById('hof-close-btn').classList.add('hidden');
    document.getElementById('hof-screen').classList.remove('hidden');

    // POST ke Google Sheets
    let formData = new URLSearchParams();
    formData.append('name', teamName);
    formData.append('score', score);

    fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        renderLeaderboard(data.leaderboard);
        document.getElementById('hof-gameover-controls').classList.remove('hidden');
    })
    .catch(error => {
        document.getElementById('leaderboard-list').innerHTML = "<p style='color:red; text-align:center;'>Gagal terhubung ke server Google Sheets.</p>";
        document.getElementById('hof-gameover-controls').classList.remove('hidden');
    });
}

// --- RENDER PETA ---
function drawMap() {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"; ctx.lineWidth = 1;
    for(let i=0; i<W; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke(); }
    for(let i=0; i<H; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(W,i); ctx.stroke(); }

    ctx.strokeStyle = "rgba(233, 69, 96, 0.15)"; ctx.lineWidth = 120; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(currentPath[0].x, currentPath[0].y);
    for (let i = 1; i < currentPath.length; i++) ctx.lineTo(currentPath[i].x, currentPath[i].y);
    ctx.stroke();

    ctx.strokeStyle = '#4b5d67'; ctx.lineWidth = 60; 
    ctx.beginPath(); ctx.moveTo(currentPath[0].x, currentPath[0].y);
    for (let i = 1; i < currentPath.length; i++) ctx.lineTo(currentPath[i].x, currentPath[i].y);
    ctx.stroke();
    
    ctx.fillStyle = "#e94560"; ctx.beginPath(); ctx.arc(currentPath[0].x, currentPath[0].y, 30, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#4ecca3"; ctx.beginPath(); ctx.arc(currentPath[currentPath.length-1].x, currentPath[currentPath.length-1].y, 40, 0, Math.PI*2); ctx.fill();
}

function gameLoop() {
    if(!gameStarted || isGameOver || isGameWon) return; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();

    if (waveActive && enemiesSpawned < enemiesToSpawn) {
        let config = levelConfig[currentLevelIdx];
        if (currentWave === config.maxWaves && enemiesSpawned === enemiesToSpawn - 1) {
            enemies.push(new Enemy(bossType)); enemiesSpawned++; sfx.bossWarn();
        } else {
            let spawnInterval = 120 - (currentLevelIdx * 20); 
            if (frameCount % spawnInterval === 0) {
                let availableTypes = (currentLevelIdx === 0 && currentWave === 1) ? [enemyTypesArr[0], enemyTypesArr[2]] : enemyTypesArr;
                let randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                enemies.push(new Enemy(randomType)); enemiesSpawned++;
            }
        }
    }

    towers.forEach(t => t.update()); towers.forEach(t => t.draw());
    soldiers.forEach(s => s.draw());
    enemies.forEach(e => { e.update(); e.draw(); });
    enemies = enemies.filter(e => e.hp > 0 && !e.isDead); 
    projectiles.forEach(p => { p.update(); p.draw(); });
    projectiles = projectiles.filter(p => p.active !== false);
    particles.forEach(p => { p.update(); p.draw(); });
    particles = particles.filter(p => p.life > 0);

    checkWaveProgress(); 
    frameCount++;
    if(baseHp > 0) requestAnimationFrame(gameLoop);
}

// --- MENU NAVIGATION CONTROLS ---
window.onload = () => { buildShopAndGallery(); };

function startGame() {
    let nameInput = document.getElementById('team-name-input').value.trim();
    if(!nameInput) { alert("Masukkan Nama Tim dulu!"); return; }
    
    initAudio(); teamName = nameInput;
    document.getElementById('team-display').innerText = teamName;
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    
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

function showGallery() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('gallery-screen').classList.remove('hidden');
}

function hideGallery() {
    document.getElementById('gallery-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
}

function showHoF() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('final-score-text').classList.add('hidden');
    document.getElementById('hof-gameover-controls').classList.add('hidden');
    document.getElementById('hof-close-btn').classList.remove('hidden');
    
    document.getElementById('leaderboard-list').innerHTML = "<p style='text-align:center; color:#f9d342;'>Mengambil data dari server... 📡</p>";
    document.getElementById('hof-screen').classList.remove('hidden');

    // GET dari Google Sheets
    fetch(GOOGLE_SHEET_URL)
    .then(response => response.json())
    .then(data => { renderLeaderboard(data.leaderboard); })
    .catch(error => {
        document.getElementById('leaderboard-list').innerHTML = "<p style='color:red; text-align:center;'>Gagal terhubung ke server Google Sheets.</p>";
    });
}

function hideHoF() {
    document.getElementById('hof-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
}
