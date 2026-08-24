import { ref, set, onValue, push, remove, update, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { db } from "./firebase-config.js";

const ADMIN_PASSWORD = "1025";

// ==================== Auth ====================
function initializeAuth() {
    const isAuthenticated = sessionStorage.getItem('adminSettingsAuth');
    if (isAuthenticated === 'true') {
        showSettings();
    } else {
        showAuthScreen();
    }
}

function showAuthScreen() {
    const authScreen = document.createElement('div');
    authScreen.className = 'auth-screen active';
    authScreen.innerHTML = `
        <div class="auth-box">
            <h2>🔐 後台設定</h2>
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
        sessionStorage.setItem('adminSettingsAuth', 'true');
        document.querySelector('.auth-screen').remove();
        showSettings();
    } else {
        errorMsg.style.display = 'block';
        document.getElementById('password-input').value = '';
        document.getElementById('password-input').focus();
    }
}

function showSettings() {
    document.querySelector('body').style.display = 'block';
}

// ==================== Game 1 Questions ====================
function loadG1Questions() {
    onValue(ref(db, 'game1Questions/common'), (snapshot) => {
        const container = document.getElementById('g1-questions-container');
        container.innerHTML = '';

        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const data = child.val();
                const item = document.createElement('div');
                item.className = 'question-item';
                const optsHtml = data.options.map((opt, i) =>
                    `<div class="opt-line${i === data.correctIndex ? ' correct' : ''}">${i === data.correctIndex ? '✓ ' : ''}${i + 1}. ${opt}</div>`
                ).join('');
                item.innerHTML = `
                    <div class="question-text">
                        <strong>${data.question}</strong>
                        <div class="options-list">${optsHtml}</div>
                    </div>
                    <button class="btn-delete" data-key="${child.key}">刪除</button>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<div class="loading">暫無題目</div>';
        }

        // Add delete handlers
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    await remove(ref(db, `game1Questions/common/${btn.dataset.key}`));
                } catch (error) {
                    alert('刪除失敗: ' + error.message);
                }
            });
        });
    });
}

document.getElementById('btn-add-g1-q').addEventListener('click', async () => {
    const question = document.getElementById('g1-q-text').value.trim();
    const opts = Array.from(document.querySelectorAll('.g1-opt-input')).map(i => i.value.trim());
    const correctIndex = parseInt(document.getElementById('g1-correct-idx').value);

    if (!question) {
        alert('請輸入題目');
        return;
    }

    if (!opts.every(o => o !== '')) {
        alert('請填寫所有 4 個選項');
        return;
    }

    try {
        await push(ref(db, 'game1Questions/common'), { 
            question, 
            options: opts, 
            correctIndex 
        });
        
        document.getElementById('g1-q-text').value = '';
        document.querySelectorAll('.g1-opt-input').forEach(i => i.value = '');
        alert('✅ 題目已新增');
    } catch (error) {
        alert('新增失敗: ' + error.message);
    }
});

loadG1Questions();

// ==================== Game 2 Clues & Score Tiers ====================
function loadCluesTiers() {
    onValue(ref(db, 'gameConfig/clues'), (snapshot) => {
        const container = document.getElementById('clues-tiers-container');
        container.innerHTML = '';

        if (snapshot.exists()) {
            const tiers = snapshot.val();
            Object.entries(tiers).forEach(([key, tier]) => {
                const item = document.createElement('div');
                item.className = 'clue-item';
                const displayImage = tier.imageUrl ? `<br><img src="${tier.imageUrl}" style="max-width: 100px; margin-top: 8px; border-radius: 4px;">` : '';
                item.innerHTML = `
                    <div class="clue-text">
                        <strong>等級 ${tier.level} - ${tier.scoreThreshold} 分</strong>
                        <br>${tier.text}${displayImage}
                    </div>
                    <button class="btn-delete" data-key="${key}">刪除</button>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<div class="loading">暫無線索</div>';
        }

        // Add delete handlers
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    await remove(ref(db, `gameConfig/clues/${btn.dataset.key}`));
                } catch (error) {
                    alert('刪除失敗: ' + error.message);
                }
            });
        });
    });
}

document.getElementById('btn-add-tier').addEventListener('click', async () => {
    const scoreThreshold = parseInt(document.getElementById('tier-score').value);
    const level = parseInt(document.getElementById('tier-level').value);
    const text = document.getElementById('tier-clue-text').value.trim();
    const imageUrl = document.getElementById('tier-clue-image').value.trim();

    if (!text) {
        alert('請輸入線索文本');
        return;
    }

    if (isNaN(scoreThreshold) || scoreThreshold < 0) {
        alert('請輸入有效的計分門檻');
        return;
    }

    try {
        const tierKey = `tier${level}_${Date.now()}`;
        await set(ref(db, `gameConfig/clues/${tierKey}`), {
            level,
            scoreThreshold,
            text,
            imageUrl: imageUrl || null
        });

        document.getElementById('tier-score').value = '';
        document.getElementById('tier-clue-text').value = '';
        document.getElementById('tier-clue-image').value = '';
        alert('✅ 等級已新增');
    } catch (error) {
        alert('新增失敗: ' + error.message);
    }
});

loadCluesTiers();

// ==================== Game 3 Questions ====================
function loadG3Questions() {
    onValue(ref(db, 'game3Questions'), (snapshot) => {
        const container = document.getElementById('g3-questions-container');
        container.innerHTML = '';

        if (snapshot.exists()) {
            let count = 1;
            snapshot.forEach((child) => {
                const data = child.val();
                const item = document.createElement('div');
                item.className = 'question-item';
                const optsHtml = data.options.map((opt, i) =>
                    `<div class="opt-line${i === data.correctIndex ? ' correct' : ''}">${i === data.correctIndex ? '✓ ' : ''}${i + 1}. ${opt}</div>`
                ).join('');
                item.innerHTML = `
                    <div class="question-text">
                        <strong>第 ${count} 題: ${data.question}</strong>
                        <div class="options-list">${optsHtml}</div>
                    </div>
                    <button class="btn-delete" data-key="${child.key}">刪除</button>
                `;
                container.appendChild(item);
                count++;
            });
        } else {
            container.innerHTML = '<div class="loading">暫無搶答題</div>';
        }

        // Add delete handlers
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    await remove(ref(db, `game3Questions/${btn.dataset.key}`));
                } catch (error) {
                    alert('刪除失敗: ' + error.message);
                }
            });
        });
    });
}

document.getElementById('btn-add-g3-q').addEventListener('click', async () => {
    const question = document.getElementById('g3-q-text').value.trim();
    const opts = Array.from(document.querySelectorAll('.g3-opt-input')).map(i => i.value.trim());
    const correctIndex = parseInt(document.getElementById('g3-correct-idx').value);

    if (!question) {
        alert('請輸入題目');
        return;
    }

    if (!opts.every(o => o !== '')) {
        alert('請填寫所有 4 個選項');
        return;
    }

    try {
        await push(ref(db, 'game3Questions'), { 
            question, 
            options: opts, 
            correctIndex 
        });
        
        document.getElementById('g3-q-text').value = '';
        document.querySelectorAll('.g3-opt-input').forEach(i => i.value = '');
        alert('✅ 搶答題已新增');
    } catch (error) {
        alert('新增失敗: ' + error.message);
    }
});

loadG3Questions();

// ==================== Reset All Data ====================
document.getElementById('btn-reset-all').addEventListener('click', async () => {
    const confirmed = confirm('⚠️ 確認要清除所有遊戲數據？此操作不可復原！');
    if (!confirmed) return;

    const confirmed2 = confirm('🚨 再次確認清除？所有玩家數據、分數、投票都會被刪除！');
    if (!confirmed2) return;

    try {
        await set(ref(db, 'players'), {});
        await set(ref(db, 'gameState'), { currentStep: 'LOGIN' });
        await set(ref(db, 'game1Questions'), {});
        await set(ref(db, 'game3Questions'), {});
        await set(ref(db, 'bingoItems'), {});
        await set(ref(db, 'gameConfig/clues'), {});
        await set(ref(db, 'settings/finalGender'), null);
        
        alert('✅ 所有遊戲數據已重置');
    } catch (error) {
        alert('重置失敗: ' + error.message);
    }
});

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', initializeAuth);
