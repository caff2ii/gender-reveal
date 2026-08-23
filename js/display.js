import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { db } from "./firebase-config.js";

// 1. 全域關卡同步
onValue(ref(db, 'gameState'), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

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

// 2. 監聽入場人數 (LOGIN 階段)
onValue(ref(db, 'players'), (snapshot) => {
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    const el = document.getElementById('player-count-display');
    if (el) el.innerText = `已入場偵探人數：${count} 人`;
});

// 3. 監聽陣營比例 (GAME3 階段)
onValue(ref(db, 'teams'), (snapshot) => {
    let boyCount = 0;
    let girlCount = 0;

    if (snapshot.exists()) {
        const teams = snapshot.val();
        Object.values(teams).forEach(t => {
            if (t === 'boy') boyCount++;
            if (t === 'girl') girlCount++;
        });
    }

    const total = boyCount + girlCount || 1;
    const boyPct = Math.round((boyCount / total) * 100);
    const girlPct = 100 - boyPct;

    const barBoy = document.getElementById('bar-boy');
    const barGirl = document.getElementById('bar-girl');

    if (barBoy && barGirl) {
        barBoy.style.width = `${boyPct}%`;
        barBoy.innerText = `👦 Team Boy: ${boyCount} (${boyPct}%)`;
        barGirl.style.width = `${girlPct}%`;
        barGirl.innerText = `👧 Team Girl: ${girlCount} (${girlPct}%)`;
    }
});

// 4. 投影幕 10 秒倒數與全螢幕煙花
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

            // 觸發持續性高規格禮炮煙花 (連續 5 秒)
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

// 自動取得當前賓客端 URL（若在 display.html，自動轉為 index.html）
const guestUrl = new URL('index.html', window.location.href).href;

// 自動生成 QR Code
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
