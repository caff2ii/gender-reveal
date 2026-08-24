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

// ==================== Monitor Player Score & Votes ====================
function monitorPlayerScore() {
    if (!currentPlayer) return;

    onValue(ref(db, `players/${currentPlayer.id}`), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        currentPlayerScore = data.score || 0;
        currentPlayer.votes = data.votes || {};
        updatePlayerBadge();

        // Update all score displays
        document.getElementById('g1-player-score').innerText = currentPlayerScore;
        document.getElementById('g2-player-score').innerText = currentPlayerScore;
        document.getElementById('g3-player-score').innerText = currentPlayerScore;

        // Re-render clues for all steps
        renderCluesForStep('g1');
        renderCluesForStep('g2');
        renderCluesForStep('g3');

        // Re-render Game 1 if active
        if (currentStep === 'GAME1') renderG1();
    });
}

// ==================== Game 1: Quiz Voting（兩階段：Group 專屬題 → 共同題）====================
let g1Phase = 'GROUP';
let g1QuestionsData = {};
let g1ActiveQId = null;
let g1ListenersReady = false;

function loadGame1Question() {
    if (!g1ListenersReady) {
        g1ListenersReady = true;

        onValue(ref(db, 'gameState/game1Phase'), (snap) => {
            const newPhase = snap.val() || 'GROUP';
            g1Phase = newPhase;
            renderG1();
        });

        onValue(ref(db, 'game1Questions'), (snap) => {
            g1QuestionsData = snap.exists() ? snap.val() : {};
            renderG1();
        });

        onValue(ref(db, 'gameState/game1ActiveQ'), (snap) => {
            g1ActiveQId = snap.val();
            renderG1();
        });
    }
    renderG1();
}

// 取得玩家已答嘅 Group 專屬題 id 列表
function getAnsweredGroupQIds() {
    const votes = (currentPlayer && currentPlayer.votes) || {};
    const answered = [];
    Object.keys(votes).forEach(key => {
        if (key.startsWith('GAME1_GROUP_')) {
            answered.push(key.replace('GAME1_GROUP_', ''));
        }
    });
    return answered;
}

// 取得玩家已答嘅共同題 id 列表
function getAnsweredCommonQIds() {
    const votes = (currentPlayer && currentPlayer.votes) || {};
    const answered = [];
    Object.keys(votes).forEach(key => {
        if (key.startsWith('GAME1_COMMON_')) {
            answered.push(key.replace('GAME1_COMMON_', ''));
        }
    });
    return answered;
}

function renderG1() {
    if (currentStep !== 'GAME1') return;

    const container = document.getElementById('g1-opts-box');
    const titleEl = document.getElementById('g1-q-title');
    container.innerHTML = '';

    if (g1Phase === 'GROUP') {
        // 階段一：回答自己 Group 嘅所有專屬題
        const groupPool = currentPlayer && g1QuestionsData.group ? g1QuestionsData.group[currentPlayer.group] : null;
        const poolIds = groupPool ? Object.keys(groupPool) : [];

        if (poolIds.length === 0) {
            titleEl.innerText = '你嘅 Group 暫無專屬題，請稍候...';
            return;
        }

        const answeredIds = getAnsweredGroupQIds();
        const remainingIds = poolIds.filter(id => !answeredIds.includes(id));

        if (remainingIds.length === 0) {
            // 已答完所有 Group 專屬題
            titleEl.innerText = `✅ 你已答完所有 ${poolIds.length} 條 Group 專屬題！等待其他玩家完成...`;
            container.innerHTML = '<p style="text-align:center; opacity:0.8; padding:20px;">⏳ 等緊其他玩家答完，就會自動進入共同題階段</p>';
            renderCluesForStep('g1');
            return;
        }

        // 顯示下一條未答嘅題目
        const nextQId = remainingIds[0];
        const q = groupPool[nextQId];
        const answeredCount = answeredIds.length;
        titleEl.innerText = `👥 [${currentPlayer.group}] 專屬題 (${answeredCount + 1}/${poolIds.length})：${q.question}`;
        renderG1Options(container, q, `GAME1_GROUP_${nextQId}`, checkGroupPhaseComplete);
    } else {
        // 階段二：共同題（大螢幕同步顯示，手機作答）
        const commonPool = g1QuestionsData.common || {};
        const q = g1ActiveQId ? commonPool[g1ActiveQId] : null;

        if (!q) {
            titleEl.innerText = '暫無共同題目';
            return;
        }

        const answeredIds = getAnsweredCommonQIds();
        const alreadyAnswered = answeredIds.includes(g1ActiveQId);

        if (alreadyAnswered) {
            titleEl.innerText = `🌐 共同題：${q.question}`;
            container.innerHTML = '<p style="text-align:center; opacity:0.8; padding:20px;">✅ 你已答完呢題！等待其他玩家完成...<br><br>⏳ 所有玩家答完後，主持人會切換到下一題</p>';
            renderCluesForStep('g1');
            return;
        }

        titleEl.innerText = `🌐 共同題：${q.question}`;
        renderG1Options(container, q, `GAME1_COMMON_${g1ActiveQId}`, checkCommonPhaseComplete);
    }
}

function renderG1Options(container, q, voteKey, afterVote) {
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.addEventListener('click', async () => {
            try {
                const voteData = {};
                voteData[voteKey] = idx;
                await update(ref(db, `players/${currentPlayer.id}/votes`), voteData);
                document.getElementById('g1-my-choice').innerText = `選項 ${idx + 1}`;
                alert('✅ 已投票');
                if (afterVote) await afterVote();
            } catch (error) {
                alert('投票失敗: ' + error.message);
            }
        });
        container.appendChild(btn);
    });

    renderCluesForStep('g1');
}

// 檢查是否所有玩家都完成咗所有 Group 專屬題；係就自動切換去共同題階段
async function checkGroupPhaseComplete() {
    try {
        const [playersSnap, groupQSnap] = await Promise.all([
            get(ref(db, 'players')),
            get(ref(db, 'game1Questions/group'))
        ]);

        if (!playersSnap.exists()) return;

        const groupQs = groupQSnap.exists() ? groupQSnap.val() : {};

        let allDone = true;
        playersSnap.forEach((child) => {
            const p = child.val();
            const groupQuestions = groupQs[p.group] || {};
            const groupQIds = Object.keys(groupQuestions);
            const noGroupQ = groupQIds.length === 0;   // 所在 Group 冇專屬題視為已完成

            if (noGroupQ) return;

            // 檢查玩家是否答完所有 Group 專屬題
            const votes = p.votes || {};
            const allAnswered = groupQIds.every(qid => votes[`GAME1_GROUP_${qid}`] !== undefined);
            if (!allAnswered) allDone = false;
        });

        if (!allDone) return;

        // 全部完成 → 揀第一條共同題並切換階段
        const commonSnap = await get(ref(db, 'game1Questions/common'));
        const updates = { game1Phase: 'COMMON' };
        if (commonSnap.exists()) {
            const ids = Object.keys(commonSnap.val());
            updates.game1ActiveQ = ids[0];   // 由第一題開始
        }
        await update(ref(db, 'gameState'), updates);
    } catch (error) {
        console.error('Check group phase failed:', error);
    }
}

// 檢查是否所有玩家都完成咗當前共同題
async function checkCommonPhaseComplete() {
    try {
        const playersSnap = await get(ref(db, 'players'));
        if (!playersSnap.exists()) return;

        let allDone = true;
        playersSnap.forEach((child) => {
            const p = child.val();
            const votes = p.votes || {};
            if (votes[`GAME1_COMMON_${g1ActiveQId}`] === undefined) {
                allDone = false;
            }
        });

        if (!allDone) return;

        // 所有玩家都答完當前共同題 → 通知 control 可以切下一題
        // 由 control 手動控制下一題，呢度只係更新狀態
        await update(ref(db, 'gameState'), { game1CommonAllAnswered: true });
    } catch (error) {
        console.error('Check common phase complete failed:', error);
    }
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
