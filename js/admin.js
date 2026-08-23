import { ref, set, onValue, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { db } from "./firebase-config.js";

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
    if (name === '') {
        alert('請輸入 Group 名稱');
        return;
    }
    push(ref(db, 'friendGroups'), { name }).then(() => {
        document.getElementById('group-name-input').value = '';
        document.getElementById('group-name-input').focus();
    }).catch((error) => {
        alert('新增失敗: ' + error.message);
    });
};

onValue(ref(db, 'friendGroups'), (snapshot) => {
    const list = document.getElementById('group-list');
    const select = document.getElementById('q-group-select');
    list.innerHTML = '';
    select.innerHTML = '<option value="common">-- 共同題目 --</option>';

    if (snapshot.exists()) {
        snapshot.forEach((child) => {
            const id = child.key;
            const data = child.val();

            // 渲染選單
            const opt = document.createElement('option');
            opt.value = id;
            opt.innerText = `📌 ${data.name}`;
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
    }
});

// 3. Game 1 題目
document.getElementById('btn-add-g1-q').onclick = () => {
    const groupSelect = document.getElementById('q-group-select');
    const group = groupSelect.value;
    const question = document.getElementById('g1-q-text').value.trim();
    const opts = Array.from(document.querySelectorAll('.g1-opt-input')).map(i => i.value.trim());
    const correctIndex = parseInt(document.getElementById('g1-correct-idx').value);

    // 驗證輸入
    if (!question) {
        alert('請輸入題目');
        return;
    }

    if (!opts.every(o => o !== '')) {
        alert('請填寫所有 4 個選項');
        return;
    }

    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        alert('請選擇正確的答案索引 (0-3)');
        return;
    }

    // 確認 group 有選
    if (!group) {
        alert('請選擇題目所屬 Group');
        return;
    }

    push(ref(db, `game1Questions/${group}`), { question, options: opts, correctIndex }).then(() => {
        document.getElementById('g1-q-text').value = '';
        document.querySelectorAll('.g1-opt-input').forEach(i => i.value = '');
        document.getElementById('g1-correct-idx').value = '0';
        alert('✅ 題目已新增');
    }).catch((error) => {
        alert('新增失敗: ' + error.message);
    });
};

// 展示已新增的 Game 1 題目
onValue(ref(db, 'game1Questions'), (snapshot) => {
    const list = document.getElementById('g1-questions-list');
    list.innerHTML = '';

    if (snapshot.exists()) {
        snapshot.forEach((groupChild) => {
            const groupId = groupChild.key;
            const groupName = groupId === 'common' ? '【共同題】' : `【${groupId}】`;
            
            groupChild.forEach((questionChild) => {
                const data = questionChild.val();
                const li = document.createElement('li');
                li.className = 'data-item';
                li.innerHTML = `
                    <span>
                        ${groupName} ${data.question}
                        <br><small>✓ 答案: 選項 ${data.correctIndex + 1}</small>
                    </span>
                `;
                const delBtn = document.createElement('button');
                delBtn.className = 'btn-del';
                delBtn.innerText = '刪除';
                delBtn.onclick = () => remove(ref(db, `game1Questions/${groupId}/${questionChild.key}`));
                li.appendChild(delBtn);
                list.appendChild(li);
            });
        });
    }
});

// 4. Bingo 管理
document.getElementById('btn-add-bingo').onclick = () => {
    const text = document.getElementById('bingo-item-input').value.trim();
    if (!text) {
        alert('請輸入線索');
        return;
    }
    push(ref(db, 'bingoItems'), text).then(() => {
        document.getElementById('bingo-item-input').value = '';
        document.getElementById('bingo-item-input').focus();
    }).catch((error) => {
        alert('新增失敗: ' + error.message);
    });
};

onValue(ref(db, 'bingoItems'), (snapshot) => {
    const list = document.getElementById('bingo-list');
    list.innerHTML = '';

    if (snapshot.exists()) {
        snapshot.forEach((child) => {
            const li = document.createElement('li');
            li.className = 'data-item';
            li.innerHTML = `<span>🎲 ${child.val()}</span>`;
            const delBtn = document.createElement('button');
            delBtn.className = 'btn-del';
            delBtn.innerText = '刪除';
            delBtn.onclick = () => remove(ref(db, `bingoItems/${child.key}`));
            li.appendChild(delBtn);
            list.appendChild(li);
        });
    }
});

// 5. Game 3 搶答題
document.getElementById('btn-add-g3-q').onclick = () => {
    const question = document.getElementById('g3-q-text').value.trim();
    const opts = Array.from(document.querySelectorAll('.g3-opt-input')).map(i => i.value.trim());
    const correctIndex = parseInt(document.getElementById('g3-correct-idx').value);

    // 驗證輸入
    if (!question) {
        alert('請輸入題目');
        return;
    }

    if (!opts.every(o => o !== '')) {
        alert('請填寫所有 4 個選項');
        return;
    }

    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        alert('請選擇正確的答案索引 (0-3)');
        return;
    }

    push(ref(db, 'game3Questions'), { question, options: opts, correctIndex }).then(() => {
        document.getElementById('g3-q-text').value = '';
        document.querySelectorAll('.g3-opt-input').forEach(i => i.value = '');
        document.getElementById('g3-correct-idx').value = '0';
        alert('✅ 題目已新增');
    }).catch((error) => {
        alert('新增失敗: ' + error.message);
    });
};

// 展示已新增的 Game 3 題目
onValue(ref(db, 'game3Questions'), (snapshot) => {
    const list = document.getElementById('g3-questions-list');
    list.innerHTML = '';

    if (snapshot.exists()) {
        let count = 1;
        snapshot.forEach((child) => {
            const data = child.val();
            const li = document.createElement('li');
            li.className = 'data-item';
            li.innerHTML = `
                <span>
                    第 ${count} 題: ${data.question}
                    <br><small>✓ 答案: 選項 ${data.correctIndex + 1}</small>
                </span>
            `;
            const delBtn = document.createElement('button');
            delBtn.className = 'btn-del';
            delBtn.innerText = '刪除';
            delBtn.onclick = () => remove(ref(db, `game3Questions/${child.key}`));
            li.appendChild(delBtn);
            list.appendChild(li);
            count++;
        });
    }
});

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
