import { ref, set, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { db } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 初始化監聽狀態
onValue(ref(db, 'settings/finalGender'), (snapshot) => {
    document.getElementById('current-gender-display').innerText = snapshot.val() || '未設定';
});

// 1. 性別設定
document.getElementById('btn-set-boy').onclick = () => set(ref(db, 'settings/finalGender'), 'BOY');
document.getElementById('btn-set-girl').onclick = () => set(ref(db, 'settings/finalGender'), 'GIRL');

// 2. Friend Group 管理
document.getElementById('btn-add-group').onclick = () => {
    const name = document.getElementById('group-name-input').value.trim();
    if (name) {
        push(ref(db, 'friendGroups'), { name });
        document.getElementById('group-name-input').value = '';
    }
};

onValue(ref(db, 'friendGroups'), (snapshot) => {
    const list = document.getElementById('group-list');
    const select = document.getElementById('q-group-select');
    list.innerHTML = '';
    select.innerHTML = '<option value="common">-- 共同題目 --</option>';

    snapshot.forEach((child) => {
        const id = child.key;
        const data = child.val();

        // 渲染選單
        const opt = document.createElement('option');
        opt.value = id;
        opt.innerText = data.name;
        select.appendChild(opt);

        // 渲染列表
        const li = document.createElement('li');
        li.className = 'data-item';
        li.innerHTML = `<span>${data.name}</span>`;
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-del';
        delBtn.innerText = '刪除';
        delBtn.onclick = () => remove(ref(db, `friendGroups/${id}`));
        li.appendChild(delBtn);
        list.appendChild(li);
    });
});

// 3. Game 1 題目
document.getElementById('btn-add-g1-q').onclick = () => {
    const group = document.getElementById('q-group-select').value;
    const question = document.getElementById('g1-q-text').value.trim();
    const opts = Array.from(document.querySelectorAll('.g1-opt-input')).map(i => i.value.trim());
    const correctIndex = parseInt(document.getElementById('g1-correct-idx').value);

    if (question && opts.every(o => o !== '')) {
        push(ref(db, `game1Questions/${group}`), { question, options: opts, correctIndex });
        document.getElementById('g1-q-text').value = '';
        document.querySelectorAll('.g1-opt-input').forEach(i => i.value = '');
    }
};

// 4. Bingo 管理
document.getElementById('btn-add-bingo').onclick = () => {
    const text = document.getElementById('bingo-item-input').value.trim();
    if (text) {
        push(ref(db, 'bingoItems'), text);
        document.getElementById('bingo-item-input').value = '';
    }
};

onValue(ref(db, 'bingoItems'), (snapshot) => {
    const list = document.getElementById('bingo-list');
    list.innerHTML = '';
    snapshot.forEach((child) => {
        const li = document.createElement('li');
        li.className = 'data-item';
        li.innerHTML = `<span>${child.val()}</span>`;
        const delBtn = document.createElement('button');
        delBtn.className = 'btn-del';
        delBtn.innerText = '刪除';
        delBtn.onclick = () => remove(ref(db, `bingoItems/${child.key}`));
        li.appendChild(delBtn);
        list.appendChild(li);
    });
});

// 5. Game 3 搶答題
document.getElementById('btn-add-g3-q').onclick = () => {
    const question = document.getElementById('g3-q-text').value.trim();
    const opts = Array.from(document.querySelectorAll('.g3-opt-input')).map(i => i.value.trim());
    const correctIndex = parseInt(document.getElementById('g3-correct-idx').value);

    if (question && opts.every(o => o !== '')) {
        push(ref(db, 'game3Questions'), { question, options: opts, correctIndex });
        document.getElementById('g3-q-text').value = '';
        document.querySelectorAll('.g3-opt-input').forEach(i => i.value = '');
    }
};

// 6. 關卡切換控制
document.querySelectorAll('.step-btn').forEach(btn => {
    btn.onclick = () => set(ref(db, 'gameState/currentStep'), btn.dataset.step);
});

document.getElementById('btn-trigger-reveal').onclick = () => {
    onValue(ref(db, 'settings/finalGender'), (snapshot) => {
        const gender = snapshot.val() || 'GIRL';
        set(ref(db, 'gameState'), {
            currentStep: 'REVEAL',
            startTimestamp: Date.now(),
            revealResult: gender
        });
    }, { onlyOnce: true });
};
