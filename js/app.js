import { ref, set, onValue, push, get, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { db } from "./firebase-config.js";

let currentPlayer = null;
let currentStep = "LOGIN";
let currentPlayerScore = 0;
let cluesCache = {};

// ==================== Utility Functions ====================
function showSection(step) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`step-${step}`);
    if (target) target.classList.add('active');
}

function updatePlayerBadge() {
    const badge = document.getElementById('player-badge');
    if (currentPlayer) {
        badge.innerText = `🕵️ ${currentPlayer.name} (${currentPlayer.group || '無Group'}) | 分數: ${currentPlayerScore}`;
    }
}

// ==================== Load Clues Cache ====================
onValue(ref(db, 'gameConfig/clues'), (snapshot) => {
    cluesCache = {};
    if (snapshot.exists()) {
        snapshot.forEach((child) => {
            cluesCache[child.key] = child.val();
        });
    }
});

// ==================== Get Unlocked Clues for Player ====================
function getUnlockedClues() {
    const unlockedClues = [];
    Object.values(cluesCache).forEach(clue => {
        if (currentPlayerScore >= clue.scoreThreshold) {
            unlockedClues.push(clue);
        }
    });
    return unlockedClues.sort((a, b) => a.scoreThreshold - b.scoreThreshold);
}

// ==================== Render Clues Section ====================
function renderCluesForStep(step) {
    const container = document.getElementById(`${step}-clues-display`);
    if (!container) return;

    const unlockedClues = getUnlockedClues();
    container.innerHTML = '';

    if (unlockedClues.length === 0) {
        container.innerHTML = '<p style="opacity: 0.7; text-align: center;">還沒有解鎖線索</p>';
        return;
    }

    unlockedClues.forEach(clue => {
        const clueDiv = document.createElement('div');
        clueDiv.className = 'clue-container';
        let content = `<div class="clue-text">✓ ${clue.text}</div>`;
        
        if (clue.imageUrl) {
            content += `<img src="${clue.imageUrl}" alt="clue" class="clue-image">`;
        }
        
        clueDiv.innerHTML = content;
        container.appendChild(clueDiv);
    });
}

// ==================== Game State Monitoring ====================
onValue(ref(db, 'gameState'), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    currentStep = data.currentStep;
    showSection(currentStep);

    if (currentStep === 'REVEAL' && data.startTimestamp) {
        startCountdownAndReveal(data.startTimestamp, data.revealResult);
    }
});

// ==================== Player Registration ====================
document.getElementById('btn-join-app').addEventListener('click', async () => {
    const name = document.getElementById('player-name-input').value.trim();
    const group = document.getElementById('player-group-select').value;

    if (!name) {
        alert('請輸入代號或名字');
        return;
    }

    if (!group) {
        alert('請選擇所屬 Group');
        return;
    }

    try {
        const playerId = Date.now().toString();
        await set(ref(db, `players/${playerId}`), {
            name,
            group,
            score: 0,
            votes: {},
            joinedAt: Date.now()
        });

        currentPlayer = { id: playerId, name, group };
        currentPlayerScore = 0;
        updatePlayerBadge();

        document.getElementById('player-name-input').value = '';
        alert(`✅ 歡迎 ${name}！已進入現場`);
    } catch (error) {
        alert('登記失敗: ' + error.message);
    }
});

// ==================== Load Groups ====================
onValue(ref(db, 'friendGroups'), (snapshot) => {
    const select = document.getElementById('player-group-select');
    select.innerHTML = '<option value="">-- 請選擇 --</option>';

    if (snapshot.exists()) {
        snapshot.forEach((child) => {
            const opt = document.createElement('option');
            opt.value = child.val().name;
            opt.innerText = child.val().name;
            select.appendChild(opt);
        });
    }
});

// ==================== Monitor Player Score ====================
function monitorPlayerScore() {
    if (!currentPlayer) return;

    onValue(ref(db, `players/${currentPlayer.id}/score`), (snapshot) => {
        currentPlayerScore = snapshot.val() || 0;
        updatePlayerBadge();

        // Update all score displays
        document.getElementById('g1-player-score').innerText = currentPlayerScore;
        document.getElementById('g2-player-score').innerText = currentPlayerScore;
        document.getElementById('g3-player-score').innerText = currentPlayerScore;

        // Re-render clues for all steps
        renderCluesForStep('g1');
        renderCluesForStep('g2');
        renderCluesForStep('g3');
    });
}

// ==================== Game 1: Quiz Voting ====================
function loadGame1Question() {
    onValue(ref(db, 'game1Questions/common'), (snapshot) => {
        const container = document.getElementById('g1-opts-box');
        container.innerHTML = '';

        if (!snapshot.exists()) {
            container.innerHTML = '<p style="opacity: 0.7;">暫無題目</p>';
            return;
        }

        const questions = [];
        snapshot.forEach(child => questions.push({ id: child.key, ...child.val() }));

        if (questions.length === 0) return;

        const randomQ = questions[Math.floor(Math.random() * questions.length)];
        document.getElementById('g1-q-title').innerText = randomQ.question;

        randomQ.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.addEventListener('click', async () => {
                try {
                    const voteData = {};
                    voteData['GAME1'] = idx;
                    await update(ref(db, `players/${currentPlayer.id}/votes`), voteData);
                    document.getElementById('g1-my-choice').innerText = `選項 ${idx + 1}`;
                    alert('✅ 已投票');
                } catch (error) {
                    alert('投票失敗: ' + error.message);
                }
            });
            container.appendChild(btn);
        });

        renderCluesForStep('g1');
    });
}

// ==================== Game 2: Bingo ====================
function loadGame2Bingo() {
    onValue(ref(db, 'bingoItems'), (snapshot) => {
        const grid = document.getElementById('bingo-board-grid');
        grid.innerHTML = '';

        if (!snapshot.exists()) {
            grid.innerHTML = '<p style="opacity: 0.7;">暫無線索</p>';
            return;
        }

        const items = [];
        snapshot.forEach(child => items.push(child.val()));

        items.slice(0, 25).forEach((item, idx) => {
            const cell = document.createElement('div');
            cell.className = 'bingo-cell';
            cell.innerText = item;
            cell.addEventListener('click', async () => {
                cell.classList.toggle('selected');
                try {
                    const voteData = {};
                    voteData[`GAME2_${idx}`] = true;
                    await update(ref(db, `players/${currentPlayer.id}/votes`), voteData);
                } catch (error) {
                    console.error('Bingo selection failed:', error);
                }
            });
            grid.appendChild(cell);
        });

        renderCluesForStep('g2');
    });
}

// ==================== Game 3: Team Selection & Voting ====================
document.getElementById('btn-team-boy').addEventListener('click', async () => {
    if (!currentPlayer) return;
    try {
        const voteData = { GAME3: 'boy' };
        await update(ref(db, `players/${currentPlayer.id}/votes`), voteData);
        document.getElementById('btn-team-boy').classList.add('selected');
        document.getElementById('btn-team-girl').classList.remove('selected');
        document.getElementById('g3-my-choice').innerText = '👦 男寶';
    } catch (error) {
        alert('選擇失敗: ' + error.message);
    }
});

document.getElementById('btn-team-girl').addEventListener('click', async () => {
    if (!currentPlayer) return;
    try {
        const voteData = { GAME3: 'girl' };
        await update(ref(db, `players/${currentPlayer.id}/votes`), voteData);
        document.getElementById('btn-team-girl').classList.add('selected');
        document.getElementById('btn-team-boy').classList.remove('selected');
        document.getElementById('g3-my-choice').innerText = '👧 女寶';
    } catch (error) {
        alert('選擇失敗: ' + error.message);
    }
});

function loadGame3Questions() {
    onValue(ref(db, 'game3Questions'), (snapshot) => {
        const container = document.getElementById('g3-opts-box');
        container.innerHTML = '';

        if (!snapshot.exists()) {
            container.innerHTML = '<p style="opacity: 0.7;">等待搶答題目...</p>';
            return;
        }

        const questions = [];
        snapshot.forEach(child => questions.push({ id: child.key, ...child.val() }));

        if (questions.length === 0) return;

        const randomQ = questions[Math.floor(Math.random() * questions.length)];
        document.getElementById('g3-q-title').innerText = randomQ.question;

        randomQ.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.addEventListener('click', async () => {
                try {
                    const voteData = {};
                    voteData['G3_ANSWER'] = idx;
                    await update(ref(db, `players/${currentPlayer.id}/votes`), voteData);
                    alert('✅ 已回答');
                } catch (error) {
                    alert('回答失敗: ' + error.message);
                }
            });
            container.appendChild(btn);
        });

        renderCluesForStep('g3');
    });
}

// ==================== Reveal Countdown ====================
function startCountdownAndReveal(startTimestamp, result) {
    const timerEl = document.getElementById('countdown-timer-display');
    const resultEl = document.getElementById('final-gender-result');

    const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
        const remaining = 10 - elapsed;

        if (remaining > 0) {
            timerEl.innerText = remaining;
        } else {
            clearInterval(interval);
            timerEl.style.display = 'none';
            resultEl.style.display = 'block';

            const isGirl = result === 'GIRL';
            resultEl.innerText = isGirl ? "👧 IT'S A GIRL! 🎀" : "👦 IT'S A BOY! 💙";
            resultEl.style.color = isGirl ? "var(--girl-color)" : "var(--boy-color)";

            // Trigger confetti
            if (typeof confetti === 'function') {
                const duration = 5 * 1000;
                const end = Date.now() + duration;

                (function frame() {
                    confetti({
                        particleCount: 7,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0 },
                        colors: isGirl ? ['#f5a623', '#ff6b6b'] : ['#4a90e2', '#50e3c2']
                    });
                    confetti({
                        particleCount: 7,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 },
                        colors: isGirl ? ['#f5a623', '#ff6b6b'] : ['#4a90e2', '#50e3c2']
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                }());
            }
        }
    }, 200);
}

// ==================== Step-Specific Loaders ====================
onValue(ref(db, 'gameState/currentStep'), (snapshot) => {
    const step = snapshot.val() || 'LOGIN';
    
    if (step === 'GAME1') {
        loadGame1Question();
    } else if (step === 'GAME2') {
        loadGame2Bingo();
    } else if (step === 'GAME3') {
        loadGame3Questions();
    }
});

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
    monitorPlayerScore();
    renderCluesForStep('g1');
    renderCluesForStep('g2');
    renderCluesForStep('g3');
});
