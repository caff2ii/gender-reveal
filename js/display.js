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

// ==================== Dynamic Vote Monitoring Per Game Step ====================
function updateVotesForStep(step) {
    const barBoyEl = document.getElementById(`bar-boy-${step.toLowerCase()}`);
    const barGirlEl = document.getElementById(`bar-girl-${step.toLowerCase()}`);

    if (!barBoyEl || !barGirlEl) return;

    onValue(ref(db, 'players'), (snapshot) => {
        let boyCount = 0;
        let girlCount = 0;

        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const player = child.val();
                if (player.votes && player.votes[step]) {
                    if (player.votes[step] === 'boy') boyCount++;
                    else if (player.votes[step] === 'girl') girlCount++;
                }
            });
        }

        const total = boyCount + girlCount || 1;
        const boyPct = Math.round((boyCount / total) * 100);
        const girlPct = 100 - boyPct;

        barBoyEl.style.width = `${boyPct}%`;
        barBoyEl.innerText = `👦 Team Boy: ${boyCount} (${boyPct}%)`;
        
        barGirlEl.style.width = `${girlPct}%`;
        barGirlEl.innerText = `👧 Team Girl: ${girlCount} (${girlPct}%)`;
    });
}

// Monitor votes for all game steps
onValue(ref(db, 'gameState/currentStep'), (snapshot) => {
    const step = snapshot.val() || 'LOGIN';
    if (step === 'GAME1' || step === 'GAME2' || step === 'GAME3') {
        updateVotesForStep(step);
    }
});

updateVotesForStep('GAME1');
updateVotesForStep('GAME2');
updateVotesForStep('GAME3');

// ==================== Real-Time Leaderboard ====================
function updateLeaderboard() {
    onValue(ref(db, 'players'), (snapshot) => {
        const container = document.getElementById('leaderboard-display');
        const players = [];

        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const player = child.val();
                players.push({
                    id: child.key,
                    name: player.name || 'Unknown',
                    score: player.score || 0
                });
            });
        }

        // Sort by score descending
        players.sort((a, b) => b.score - a.score);

        // Render leaderboard
        container.innerHTML = '';
        players.slice(0, 12).forEach((p, idx) => {
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
    });
}

// Update leaderboard every 1 second during GAME3
setInterval(() => {
    if (currentStep === 'GAME3') {
        updateLeaderboard();
    }
}, 1000);

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
