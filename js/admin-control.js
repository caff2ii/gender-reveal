import { ref, set, onValue, push, remove, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { db } from "./firebase-config.js";

const ADMIN_PASSWORD = "1025";
let currentStep = "LOGIN";
let currentGender = null;

// ==================== Auth ====================
function initializeAuth() {
    const isAuthenticated = sessionStorage.getItem('adminControlAuth');
    if (isAuthenticated === 'true') {
        showDashboard();
    } else {
        showAuthScreen();
    }
}

function showAuthScreen() {
    const authScreen = document.createElement('div');
    authScreen.className = 'auth-screen active';
    authScreen.innerHTML = `
        <div class="auth-box">
            <h2>🔐 後台控制</h2>
            <p>請輸入管理員密碼</p>
            <input type="password" id="password-input" placeholder="輸入密碼" autocomplete="off">
            <button id="auth-submit">進入後台</button>
            <div class="auth-error" id="auth-error">❌ 密碼錯誤</div>
        </div>
        <style>
            .auth-screen {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                z-index: 9999;
                justify-content: center;
                align-items: center;
            }
            .auth-screen.active { display: flex; }
            .auth-box {
                background: white;
                padding: 40px;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 400px;
            }
            .auth-box h2 { color: #333; margin: 0 0 10px 0; }
            .auth-box p { color: #666; margin-bottom: 20px; }
            .auth-box input {
                width: 100%;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                margin-bottom: 15px;
                box-sizing: border-box;
                text-align: center;
                letter-spacing: 2px;
            }
            .auth-box button {
                width: 100%;
                padding: 12px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
            }
            .auth-error { color: #e74c3c; display: none; margin-top: 10px; }
        </style>
    `;
    document.body.appendChild(authScreen);
    
    document.getElementById('password-input').focus();
    document.getElementById('password-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') authenticateAdmin();
    });
    document.getElementById('auth-submit').addEventListener('click', authenticateAdmin);
}

function authenticateAdmin() {
    const password = document.getElementById('password-input').value;
    const errorMsg = document.getElementById('auth-error');
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminControlAuth', 'true');
        document.querySelector('.auth-screen').remove();
        showDashboard();
    } else {
        errorMsg.style.display = 'block';
        document.getElementById('password-input').value = '';
        document.getElementById('password-input').focus();
    }
}

function showDashboard() {
    document.querySelector('body').style.display = 'block';
}

// ==================== Stage Control ====================
onValue(ref(db, 'gameState/currentStep'), (snapshot) => {
    currentStep = snapshot.val() || 'LOGIN';
    document.getElementById('current-step-display').innerText = currentStep;
    
    // Update button states
    document.querySelectorAll('.step-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.step === currentStep);
    });
});

document.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        try {
            await set(ref(db, 'gameState/currentStep'), btn.dataset.step);
        } catch (error) {
            console.error('Error updating step:', error);
            alert('更新失敗: ' + error.message);
        }
    });
});

// ==================== Gender Setting ====================
onValue(ref(db, 'settings/finalGender'), (snapshot) => {
    currentGender = snapshot.val() || null;
    document.getElementById('current-gender-display').innerText = currentGender === 'BOY' ? '👦 男寶寶' : currentGender === 'GIRL' ? '👧 女寶寶' : '未設定';
    
    document.getElementById('btn-set-boy').classList.toggle('active', currentGender === 'BOY');
    document.getElementById('btn-set-girl').classList.toggle('active', currentGender === 'GIRL');
});

document.getElementById('btn-set-boy').addEventListener('click', async () => {
    try {
        await set(ref(db, 'settings/finalGender'), 'BOY');
    } catch (error) {
        alert('設定失敗: ' + error.message);
    }
});

document.getElementById('btn-set-girl').addEventListener('click', async () => {
    try {
        await set(ref(db, 'settings/finalGender'), 'GIRL');
    } catch (error) {
        alert('設定失敗: ' + error.message);
    }
});

// ==================== Vote Monitor ====================
function updateVoteRatio() {
    onValue(ref(db, `players`), (snapshot) => {
        let boyCount = 0;
        let girlCount = 0;

        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const player = child.val();
                if (player.votes && player.votes[currentStep]) {
                    if (player.votes[currentStep] === 'boy') boyCount++;
                    else if (player.votes[currentStep] === 'girl') girlCount++;
                }
            });
        }

        const total = boyCount + girlCount || 1;
        const boyPct = Math.round((boyCount / total) * 100);
        const girlPct = 100 - boyPct;

        document.getElementById('boy-count').innerText = boyCount;
        document.getElementById('girl-count').innerText = girlCount;

        document.getElementById('vote-boy-display').style.flex = boyPct;
        document.getElementById('vote-boy-display').innerText = `👦 ${boyCount} (${boyPct}%)`;

        document.getElementById('vote-girl-display').style.flex = girlPct;
        document.getElementById('vote-girl-display').innerText = `👧 ${girlCount} (${girlPct}%)`;
    });
}

// Update vote ratio when step changes
onValue(ref(db, 'gameState/currentStep'), () => {
    updateVoteRatio();
});

updateVoteRatio();

// ==================== Leaderboard ====================
function updateLeaderboard() {
    onValue(ref(db, 'players'), (snapshot) => {
        const container = document.getElementById('leaderboard-container');
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

        // Populate select dropdown
        const playerSelect = document.getElementById('player-select');
        playerSelect.innerHTML = '<option value="">-- 選擇玩家 --</option>';
        players.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.innerText = `${p.name} (${p.score})`;
            playerSelect.appendChild(opt);
        });

        // Render leaderboard
        container.innerHTML = '';
        players.forEach((p, idx) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <div class="leaderboard-rank">${idx + 1}</div>
                <div class="leaderboard-name">${p.name}</div>
                <div class="leaderboard-score">${p.score} 分</div>
            `;
            container.appendChild(item);
        });

        if (players.length === 0) {
            container.innerHTML = '<div style="text-align: center; opacity: 0.7;">暫無玩家</div>';
        }
    });
}

updateLeaderboard();

// ==================== Score Management ====================
document.getElementById('btn-add-score').addEventListener('click', async () => {
    const playerId = document.getElementById('player-select').value;
    const amount = parseInt(document.getElementById('score-amount').value) || 0;

    if (!playerId) {
        alert('請選擇玩家');
        return;
    }

    if (amount === 0) {
        alert('請輸入分數');
        return;
    }

    try {
        const snapshot = await get(ref(db, `players/${playerId}/score`));
        const currentScore = snapshot.val() || 0;
        const newScore = currentScore + amount;
        
        await set(ref(db, `players/${playerId}/score`), newScore);
        document.getElementById('score-amount').value = '';
        alert(`✅ 已添加 ${amount} 分`);
    } catch (error) {
        alert('添加分數失敗: ' + error.message);
    }
});

document.getElementById('btn-sub-score').addEventListener('click', async () => {
    const playerId = document.getElementById('player-select').value;
    const amount = parseInt(document.getElementById('score-amount').value) || 0;

    if (!playerId) {
        alert('請選擇玩家');
        return;
    }

    if (amount === 0) {
        alert('請輸入分數');
        return;
    }

    try {
        const snapshot = await get(ref(db, `players/${playerId}/score`));
        const currentScore = snapshot.val() || 0;
        const newScore = Math.max(0, currentScore - amount);
        
        await set(ref(db, `players/${playerId}/score`), newScore);
        document.getElementById('score-amount').value = '';
        alert(`✅ 已扣除 ${amount} 分`);
    } catch (error) {
        alert('扣除分數失敗: ' + error.message);
    }
});

// ==================== Reveal Trigger ====================
document.getElementById('btn-trigger-reveal').addEventListener('click', async () => {
    if (!currentGender) {
        alert('請先設定最終性別');
        return;
    }

    try {
        await set(ref(db, 'gameState'), {
            currentStep: 'REVEAL',
            startTimestamp: Date.now(),
            revealResult: currentGender
        });
    } catch (error) {
        alert('觸發失敗: ' + error.message);
    }
});

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', initializeAuth);
