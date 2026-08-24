import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { db } from "./firebase-config.js";

let currentStep = "LOGIN";

// ==================== Global Game State Sync ====================
onValue(ref(db, 'gameState'), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    currentStep = data.currentStep;
    showSection(data.currentStep);

    if (data.currentStep === 'REVEAL' && data.startTimestamp) {
        startDisplayCountdown(data.startTimestamp, data.revealResult);
    }
});

function showSection(step) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`step-${step}`);
    if (target) target.classList.add('active');
}

// ==================== Player Count (LOGIN Stage) ====================
onValue(ref(db, 'players'), (snapshot) => {
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    const el = document.getElementById('player-count-display');
    if (el) el.innerText = `已入場偵探人數：${count} 人`;
});

// ==================== 全域統計：投票比例 + 排行榜（Game 進行中顯示於大螢幕）====================
const GAME_STEPS = ['GAME1', 'GAME2', 'GAME3'];
let latestPlayersSnapshot = null;

function hasAnsweredStep(votes, step) {
    if (!votes) return false;
    if (step === 'GAME1') {
        return votes['GAME1'] !== undefined || votes['GAME1_GROUP'] !== undefined;
    }
    if (step === 'GAME2') {
        return Object.keys(votes).some(k => k.startsWith('GAME2_'));
    }
    return votes[step] !== undefined;
}

function renderGlobalStats() {
    const globalStats = document.getElementById('global-stats');
    const barBoy = document.getElementById('bar-boy-global');
    const barGirl = document.getElementById('bar-girl-global');
    const participationEl = document.getElementById('participation-display');

    // 只喺 Game 進行中顯示
    const showStats = GAME_STEPS.includes(currentStep);
    if (globalStats) globalStats.style.display = showStats ? '' : 'none';
    if (!showStats || !latestPlayersSnapshot) return;

    let boyCount = 0, girlCount = 0, totalPlayers = 0, answered = 0;

    latestPlayersSnapshot.forEach((child) => {
        totalPlayers++;
        const player = child.val();
        if (hasAnsweredStep(player.votes, currentStep)) answered++;

        if (currentStep === 'GAME3' && player.votes && player.votes['GAME3']) {
            if (player.votes['GAME3'] === 'boy') boyCount++;
            else if (player.votes['GAME3'] === 'girl') girlCount++;
        }
    });

    if (currentStep === 'GAME3') {
        // Game 3：顯示男/女陣營投票比例
        const total = boyCount + girlCount || 1;
        const boyPct = Math.round((boyCount / total) * 100);
        barBoy.style.width = `${boyPct}%`;
        barBoy.innerText = `👦 Team Boy: ${boyCount} (${boyPct}%)`;
        barGirl.style.width = `${100 - boyPct}%`;
        barGirl.innerText = `👧 Team Girl: ${girlCount} (${100 - boyPct}%)`;
        if (participationEl) participationEl.innerText = '';
    } else {
        // Game 1/2：顯示作答進度
        barBoy.style.width = '50%';
        barBoy.innerText = '👦 Team Boy';
        barGirl.style.width = '50%';
        barGirl.innerText = '👧 Team Girl';
        if (participationEl) participationEl.innerText = `📝 已回答人數：${answered} / ${totalPlayers}`;
    }
}

function renderLeaderboard() {
    const container = document.getElementById('leaderboard-display');
    if (!container || !latestPlayersSnapshot) return;

    const players = [];
    latestPlayersSnapshot.forEach((child) => {
        const player = child.val();
        players.push({ name: player.name || 'Unknown', score: player.score || 0 });
    });
    players.sort((a, b) => b.score - a.score);

    container.innerHTML = '';
    players.slice(0, 10).forEach((p, idx) => {
        const card = document.createElement('div');
        card.className = 'leaderboard-card';
        card.innerHTML = `
            <div class="leaderboard-rank">${idx + 1}</div>
            <div class="leaderboard-name">${p.name}</div>
            <div class="leaderboard-score">${p.score} 分</div>
        `;
        container.appendChild(card);
    });

    if (players.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; opacity: 0.7;">暫無玩家</div>';
    }
}

onValue(ref(db, 'players'), (snapshot) => {
    latestPlayersSnapshot = snapshot;
    renderGlobalStats();
    renderLeaderboard();
}, (error) => {
    console.error('載入玩家數據失敗:', error);
});

// ==================== GAME1 兩階段顯示（Group 專屬題 → 共同題）====================
let g1DisplayPhase = 'GROUP';
let g1DisplayCommonData = {};
let g1DisplayActiveId = null;

function renderG1Display() {
    const subtitle = document.getElementById('g1-display-subtitle');
    const progressEl = document.getElementById('g1-group-progress');
    const qBox = document.getElementById('g1-display-question');

    if (g1DisplayPhase === 'COMMON') {
        if (subtitle) subtitle.innerText = '請睇住大螢幕題目，喺自己手機選擇答案！';
        if (progressEl) progressEl.style.display = 'none';
        if (qBox) qBox.style.display = 'block';

        const titleEl = document.getElementById('g1-display-q-title');
        const optsEl = document.getElementById('g1-display-q-opts');
        const q = g1DisplayActiveId ? g1DisplayCommonData[g1DisplayActiveId] : null;

        if (titleEl && optsEl) {
            if (q) {
                titleEl.innerText = q.question;
                optsEl.innerHTML = q.options
                    .map((o, i) => `<div>${i + 1}. ${o}</div>`)
                    .join('');
            } else {
                titleEl.innerText = '暫無共同題目';
                optsEl.innerHTML = '';
            }
        }
    } else {
        if (subtitle) subtitle.innerText = '各 Group 專屬問答進行中，請睇自己手機作答！';
        if (progressEl) progressEl.style.display = '';
        if (qBox) qBox.style.display = 'none';
    }
}

onValue(ref(db, 'gameState/game1Phase'), (phaseSnap) => {
    g1DisplayPhase = phaseSnap.val() || 'GROUP';
    renderG1Display();
});

// Group 階段進度：已完成專屬題人數
onValue(ref(db, 'players'), (snap) => {
    let total = 0;
    let answered = 0;
    if (snap.exists()) {
        snap.forEach((child) => {
            total++;
            const v = child.val().votes;
            if (v && v['GAME1_GROUP'] !== undefined) answered++;
        });
    }
    const el = document.getElementById('g1-group-progress');
    if (el) el.innerText = `已完成專屬題：${answered} / ${total} 人`;
});

// 共同題資料 + 當前生效題目 id
onValue(ref(db, 'game1Questions/common'), (snap) => {
    g1DisplayCommonData = snap.exists() ? snap.val() : {};
    renderG1Display();
});

onValue(ref(db, 'gameState/game1ActiveQ'), (snap) => {
    g1DisplayActiveId = snap.val();
    renderG1Display();
});

// 階段切換時更新全域統計顯示
onValue(ref(db, 'gameState/currentStep'), () => {
    renderGlobalStats();
});

// ==================== Display Countdown & Confetti ====================
function startDisplayCountdown(startTimestamp, result) {
    const timerEl = document.getElementById('display-countdown');
    const resultEl = document.getElementById('display-result');

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

            // Trigger continuous premium confetti (5 seconds)
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

// ==================== QR Code Generation ====================
const guestUrl = new URL('index.html', window.location.href).href;

const qrContainer = document.getElementById("qrcode");
if (qrContainer && typeof QRCode !== 'undefined') {
    new QRCode(qrContainer, {
        text: guestUrl,
        width: 250,
        height: 250,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
}
