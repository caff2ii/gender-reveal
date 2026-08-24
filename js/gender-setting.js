import { ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { db } from "./firebase-config.js";

const GENDER_PASSWORD = "102512";

// ==================== Auth ====================
function initializeAuth() {
    const isAuthenticated = sessionStorage.getItem('genderSettingAuth');
    if (isAuthenticated === 'true') {
        showPanel();
    } else {
        showAuthScreen();
    }
}

function showAuthScreen() {
    const authScreen = document.createElement('div');
    authScreen.className = 'auth-screen active';
    authScreen.innerHTML = `
        <div class="auth-box">
            <h2>🔒 保密設定</h2>
            <p>請輸入知情人密碼</p>
            <input type="password" id="password-input" placeholder="輸入密碼" autocomplete="off">
            <button id="auth-submit">進入設定</button>
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
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
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
                background: #1a1a2e;
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
        if (e.key === 'Enter') authenticate();
    });
    document.getElementById('auth-submit').addEventListener('click', authenticate);
}

function authenticate() {
    const password = document.getElementById('password-input').value;
    const errorMsg = document.getElementById('auth-error');
    
    if (password === GENDER_PASSWORD) {
        sessionStorage.setItem('genderSettingAuth', 'true');
        document.querySelector('.auth-screen').remove();
        showPanel();
    } else {
        errorMsg.style.display = 'block';
        document.getElementById('password-input').value = '';
        document.getElementById('password-input').focus();
    }
}

function showPanel() {
    // 面板本身已喺 HTML 入面，登入後即時監聽資料
}

// ==================== Gender Setting ====================
const genderDisplay = document.getElementById('current-gender-display');
const btnBoy = document.getElementById('btn-set-boy');
const btnGirl = document.getElementById('btn-set-girl');

onValue(ref(db, 'settings/finalGender'), (snapshot) => {
    const gender = snapshot.val();
    
    if (gender === 'BOY') {
        genderDisplay.innerText = '👦 男寶寶';
        btnBoy.classList.add('active');
        btnGirl.classList.remove('active');
    } else if (gender === 'GIRL') {
        genderDisplay.innerText = '👧 女寶寶';
        btnGirl.classList.add('active');
        btnBoy.classList.remove('active');
    } else {
        genderDisplay.innerText = '未設定';
        btnBoy.classList.remove('active');
        btnGirl.classList.remove('active');
    }
}, (error) => {
    console.error('載入性別設定失敗:', error);
    genderDisplay.innerText = '❌ 載入失敗';
});

btnBoy.addEventListener('click', async () => {
    if (!confirm('確定設定最終性別為「男寶寶」？')) return;
    try {
        await set(ref(db, 'settings/finalGender'), 'BOY');
        alert('✅ 已設定為 👦 男寶寶（請立即離開頁面避免洩密）');
    } catch (error) {
        console.error('設定失敗:', error);
        alert('設定失敗: ' + error.message);
    }
});

btnGirl.addEventListener('click', async () => {
    if (!confirm('確定設定最終性別為「女寶寶」？')) return;
    try {
        await set(ref(db, 'settings/finalGender'), 'GIRL');
        alert('✅ 已設定為 👧 女寶寶（請立即離開頁面避免洩密）');
    } catch (error) {
        console.error('設定失敗:', error);
        alert('設定失敗: ' + error.message);
    }
});

document.getElementById('btn-clear-gender').addEventListener('click', async () => {
    if (!confirm('確定清除性別設定？（重置後需重新設定先可以觸發 REVEAL）')) return;
    try {
        await set(ref(db, 'settings/finalGender'), null);
        alert('✅ 已清除性別設定');
    } catch (error) {
        console.error('清除失敗:', error);
        alert('清除失敗: ' + error.message);
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
