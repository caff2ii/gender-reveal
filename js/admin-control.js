import { ref, set, onValue, push, remove, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { db } from "./firebase-config.js";

const ADMIN_PASSWORD = "1025";
let currentStep = "LOGIN";

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

    // 更新 Game 1 控制按鈕狀態
    updateG1ControlButtons();
});

document.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        try {
            if (btn.dataset.step === 'GAME1') {
                // 進入 Game 1 時重置為 Group 專屬題階段
                await update(ref(db, 'gameState'), {
                    currentStep: 'GAME1',
                    game1Phase: 'GROUP',
                    game1ActiveQ: null,
                    game1CommonAllAnswered: false
                });
            } else {
                await set(ref(db, 'gameState/currentStep'), btn.dataset.step);
            }
        } catch (error) {
            console.error('Error updating step:', error);
            alert('更新失敗: ' + error.message);
        }
    });
});

// ==================== Game 1 控制（Group 專屬題 → 共同題）====================
let g1ControlPhase = 'GROUP';
let g1ControlCommonData = {};
let g1ControlActiveQId = null;
let g1ControlCommonAllAnswered = false;
let g1ControlGroupAllAnswered = false;

function updateG1ControlButtons() {
    const g1ControlSection = document.getElementById('g1-control-section');
    if (!g1ControlSection) return;

    // 只有喺 GAME1 階段先顯示控制區
    g1ControlSection.style.display = currentStep === 'GAME1' ? '' : 'none';

    const btnEnterCommon = document.getElementById('btn-g1-enter-common');
    const btnNextQ = document.getElementById('btn-g1-next-q');
    const statusEl = document.getElementById('g1-control-status');
    const progressEl = document.getElementById('g1-control-progress');

    if (!btnEnterCommon || !btnNextQ || !statusEl) return;

    if (g1ControlPhase === 'GROUP') {
        // Group 階段：顯示「進入共同題」按鈕
        btnEnterCommon.style.display = '';
        btnNextQ.style.display = 'none';

        if (g1ControlGroupAllAnswered) {
            statusEl.innerText = '✅ 所有玩家已答完 Group 專屬題！可以進入共同題 Part！';
            btnEnterCommon.style.background = '#ff9800';
            btnEnterCommon.innerText = '🌐 進入共同題 Part（可以撳喇！）';
        } else {
            statusEl.innerText = '📋 目前階段：Group 專屬題（等所有玩家答完）';
            btnEnterCommon.style.background = '#4CAF50';
            btnEnterCommon.innerText = '🌐 進入共同題 Part';
        }

        if (progressEl) progressEl.style.display = '';
    } else {
        // 共同題階段：顯示「下一題」按鈕
        btnEnterCommon.style.display = 'none';
        btnNextQ.style.display = '';

        const commonIds = Object.keys(g1ControlCommonData);
        const total = commonIds.length;
        const currentIdx = commonIds.indexOf(g1ControlActiveQId);

        if (currentIdx === -1) {
            // 未有生效題目
            btnNextQ.innerText = '➡️ 下一題';
            btnNextQ.disabled = true;
            statusEl.innerText = `🌐 共同題階段（共 ${total} 條）——尚未揀選題目`;
        } else if (currentIdx >= total - 1) {
            btnNextQ.innerText = '✅ 完成所有共同題';
            btnNextQ.disabled = true;
            statusEl.innerText = `🌐 共同題 ${currentIdx + 1}/${total}（最後一題）`;
        } else {
            btnNextQ.innerText = `➡️ 下一題（${currentIdx + 1}/${total}）`;
            btnNextQ.disabled = false;
            statusEl.innerText = `🌐 共同題 ${currentIdx + 1}/${total}`;
        }

        if (progressEl) progressEl.style.display = 'none';
    }
}

// 監聽 Game 1 階段
onValue(ref(db, 'gameState/game1Phase'), (snap) => {
    g1ControlPhase = snap.val() || 'GROUP';
    updateG1ControlButtons();
});

// 監聽共同題資料
onValue(ref(db, 'game1Questions/common'), (snap) => {
    g1ControlCommonData = snap.exists() ? snap.val() : {};
    updateG1ControlButtons();
});

// 監聽當前共同題
onValue(ref(db, 'gameState/game1ActiveQ'), (snap) => {
    g1ControlActiveQId = snap.val();
    updateG1ControlButtons();
});

// 監聽所有玩家是否已答完所有 Group 專屬題
onValue(ref(db, 'gameState/game1GroupAllAnswered'), (snap) => {
    g1ControlGroupAllAnswered = snap.val() || false;
    updateG1ControlButtons();
});

// 監聽所有玩家是否已答完當前共同題
onValue(ref(db, 'gameState/game1CommonAllAnswered'), (snap) => {
    g1ControlCommonAllAnswered = snap.val() || false;
    const statusEl = document.getElementById('g1-control-status');
    if (statusEl && g1ControlPhase === 'COMMON' && g1ControlCommonAllAnswered) {
        statusEl.innerText += ' ✅ 所有玩家已答完，可以切下一題！';
    }
});

// 「進入共同題」按鈕：手動切換去共同題階段
const btnG1EnterCommon = document.getElementById('btn-g1-enter-common');
if (btnG1EnterCommon) {
    btnG1EnterCommon.addEventListener('click', async () => {
        try {
            const commonSnap = await get(ref(db, 'game1Questions/common'));
            if (!commonSnap.exists() || Object.keys(commonSnap.val()).length === 0) {
                alert('尚未設定共同題目！請先喺後台設定新增共同題。');
                return;
            }

            const ids = Object.keys(commonSnap.val());
            await update(ref(db, 'gameState'), {
                game1Phase: 'COMMON',
                game1ActiveQ: ids[0],
                game1CommonAllAnswered: false
            });
            alert('✅ 已進入共同題階段！');
        } catch (error) {
            console.error('進入共同題失敗:', error);
            alert('進入共同題失敗: ' + error.message);
        }
    });
}

// 「下一題」按鈕：切換到下一條共同題
const btnG1NextQ = document.getElementById('btn-g1-next-q');
if (btnG1NextQ) {
    btnG1NextQ.addEventListener('click', async () => {
        try {
            const commonIds = Object.keys(g1ControlCommonData);
            const currentIdx = commonIds.indexOf(g1ControlActiveQId);
            const nextIdx = currentIdx + 1;

            if (nextIdx >= commonIds.length) {
                alert('已經係最後一題！');
                return;
            }

            await update(ref(db, 'gameState'), {
                game1ActiveQ: commonIds[nextIdx],
                game1CommonAllAnswered: false
            });
            alert('✅ 已切換到下一題！');
        } catch (error) {
            console.error('切換下一題失敗:', error);
            alert('切換下一題失敗: ' + error.message);
        }
    });
}

// ==================== Gender Setting Status（只顯示已設定與否，不洩露內容）====================
onValue(ref(db, 'settings/finalGender'), (snapshot) => {
    const isSet = snapshot.exists() && snapshot.val();
    document.getElementById('current-gender-display').innerText = isSet ? '已設定 ✅' : '未設定 ❌';
}, (error) => {
    console.error('載入性別狀態失敗:', error);
});

// ==================== Testing Reset ====================
document.getElementById('btn-reset-testing').addEventListener('click', async () => {
    const confirmed = confirm('⚠️ 確認要重置遊戲數據？（測試用）\n\n玩家數據、分數、投票會被清除；題目、線索會保留。');
    if (!confirmed) return;

    try {
        // 只清除玩家數據同遊戲狀態；題目、線索保留
        await set(ref(db, 'players'), {});
        await set(ref(db, 'gameState'), { currentStep: 'LOGIN' });
        
        alert('✅ 已重置玩家數據並返回登入階段（題目、線索已保留）');
    } catch (error) {
        console.error('重置失敗:', error);
        alert('重置失敗: ' + error.message);
    }
});

// ==================== Reveal Trigger ====================
document.getElementById('btn-trigger-reveal').addEventListener('click', async () => {
    try {
        // 觸發時先讀取最終性別（控制台全程唔會顯示內容）
        const snap = await get(ref(db, 'settings/finalGender'));
        const finalGender = snap.val();

        if (!finalGender) {
            alert('尚未設定最終性別！請通知知情人喺 gender-setting.html 頁面設定。');
            return;
        }

        await set(ref(db, 'gameState'), {
            currentStep: 'REVEAL',
            startTimestamp: Date.now(),
            revealResult: finalGender
        });
    } catch (error) {
        console.error('觸發失敗:', error);
        alert('觸發失敗: ' + error.message);
    }
});

// ==================== Initialize ====================
function onDOMReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

onDOMReady(initializeAuth);
