import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { db } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let player = { name: '', group: '', team: '' };

// 1. 載入 Friend Groups
onValue(ref(db, 'friendGroups'), (snapshot) => {
    const select = document.getElementById('player-group-select');
    select.innerHTML = '<option value="">請選擇你的 Group</option>';
    snapshot.forEach((child) => {
        const opt = document.createElement('option');
        opt.value = child.key;
        opt.innerText = child.val().name;
        select.appendChild(opt);
    });
});

// 2. 登記登入
document.getElementById('btn-join-app').onclick = () => {
    const name = document.getElementById('player-name-input').value.trim();
    const group = document.getElementById('player-group-select').value;
    if (!name || !group) {
        alert('請輸入代號並選擇 Group！');
        return;
    }
    player.name = name;
    player.group = group;
    document.getElementById('player-badge').innerText = `偵探：${player.name}`;
    alert('已成功登入！請等待主持人切換關卡。');
};

// 3. 監聽全域關卡切換
onValue(ref(db, 'gameState'), (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    showSection(data.currentStep);

    if (data.currentStep === 'GAME2') loadBingoBoard();
    if (data.currentStep === 'REVEAL' && data.startTimestamp) {
        startCountdown(data.startTimestamp, data.revealResult);
    }
});

function showSection(step) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`step-${step}`);
    if (target) target.classList.add('active');
}

// 4. Bingo 繪製
function loadBingoBoard() {
    const grid = document.getElementById('bingo-board-grid');
    if (grid.children.length > 0) return; // 避免重複渲染

    onValue(ref(db, 'bingoItems'), (snapshot) => {
        const items = [];
        snapshot.forEach(c => items.push(c.val()));
        grid.innerHTML = '';
        
        // 隨機抽 9 格
        const shuffled = items.sort(() => 0.5 - Math.random()).slice(0, 9);
        shuffled.forEach(text => {
            const cell = document.createElement('div');
            cell.className = 'bingo-cell';
            cell.innerText = text;
            cell.onclick = () => cell.classList.toggle('marked');
            grid.appendChild(cell);
        });
    }, { onlyOnce: true });
}

// 5. Team 選擇
document.getElementById('btn-team-boy').onclick = () => selectTeam('boy');
document.getElementById('btn-team-girl').onclick = () => selectTeam('girl');

function selectTeam(team) {
    player.team = team;
    document.getElementById('btn-team-boy').classList.toggle('selected', team === 'boy');
    document.getElementById('btn-team-girl').classList.toggle('selected', team === 'girl');
}

// 6. 同步倒數與煙花
function startCountdown(startTimestamp, result) {
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

            // 觸發煙花
            if (typeof confetti === 'function') {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            }
        }
    }, 200);
}
