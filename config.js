window.CONFIG = {
  // 1. Firebase Configuration
  firebase: {
    apiKey: "AIzaSyCEqNyvMHsTiGu-8q3WoK1eBHWJaw8KCJA",
    authDomain: "gender-reveal-party-905de.firebaseapp.com",
    databaseURL: "https://gender-reveal-party-905de-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gender-reveal-party-905de",
    storageBucket: "gender-reveal-party-905de.firebasestorage.app",
    messagingSenderId: "972856514197",
    appId: "1:972856514197:web:d18fd6e881e6992bdfad9c"
  },

  // 2. Security Passwords
  passwords: {
    admin: "1125",
    secret: "1125"
  },

  // 3. Game Phases Definition & Sequence
  phases: {
    ONBOARDING: "ONBOARDING",
    BACKGROUND_STORY: "BACKGROUND_STORY",
    GAME1_RULES: "GAME1_RULES",
    GAME1_QUIZ: "GAME1_QUIZ",
    GAME1_SETTLE: "GAME1_SETTLE",
    GAME2_RULES: "GAME2_RULES",
    GAME2_BINGO: "GAME2_BINGO",
    GAME2_SETTLE: "GAME2_SETTLE",
    GAME3_RULES: "GAME3_RULES",
    GAME3_TEAM_SELECT: "GAME3_TEAM_SELECT",
    FINAL_CHOICE: "FINAL_CHOICE",
    GRAND_REVEAL: "GRAND_REVEAL"
  },

  phaseOrder: [
    "ONBOARDING",
    "BACKGROUND_STORY",
    "GAME1_RULES",
    "GAME1_QUIZ",
    "GAME1_SETTLE",
    "GAME2_RULES",
    "GAME2_BINGO",
    "GAME2_SETTLE",
    "GAME3_RULES",
    "GAME3_TEAM_SELECT",
    "FINAL_CHOICE",
    "GRAND_REVEAL"
  ],

  // 4. Friend Groups Definition
  groups: {
    group_ccbc: "CCBC",
    group_hiking: "偽E真I行山團",
    group_southdinner: "南區食飯",
    group_fridaydinner: "FRIDAY DINNER",
    group_boardgame: "東區桌遊美食",
    group_agewell: "Uniting Agewell",
    group_prayer: "Praise and Pray"
  },

  groupIds: [
    "group_ccbc",
    "group_hiking",
    "group_southdinner",
    "group_fridaydinner",
    "group_boardgame",
    "group_agewell",
    "group_prayer"
  ],

  // 5. Game Rules & Settings
  game1: {
    groupQuizCount: 3,
    commonQuizCount: 5,
    commonQuizCountdown: 15, // seconds
    groupQuizPoints: 1000,
    commonQuizBasePoints: 1000,
    commonQuizSpeedMultiplier: 33.3
  },

  game2: {
    gridSize: 3,
    totalBoardCells: 9,
    targetLinesToComplete: 2,
    cutoffBatchLimit: 10
  },

  // 6. Sound Settings (Howler.js Audio URLs)
  sound: {
    bgmAmbient: "",
    bgmTense: "",
    sfx: {
      button: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
      correct: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
      wrong: "https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3",
      bingo: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
      countdown: "https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3",
      revealHit: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
      fireworks: "https://assets.mixkit.co/active_storage/sfx/1430/1430-preview.mp3"
    }
  },

  // 7. CDN Library URLs
  cdn: {
    tailwind: "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.js",
    firebaseApp: "https://cdn.jsdelivr.net/npm/firebase@10.8.0/firebase-app-compat.js",
    firebaseDatabase: "https://cdn.jsdelivr.net/npm/firebase@10.8.0/firebase-database-compat.js",
    howler: "https://cdn.jsdelivr.net/npm/howler@2.2.4/dist/howler.min.js",
    confetti: "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js",
    qrcode: "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"
  }
};

// Global Helper Utilities
window.GenderRevealUtils = {
  // 1. 生成唯一 4 位數 PIN 碼 (帶前導零)
  generatePin: function(existingPlayersObj) {
    var existingPins = [];
    if (existingPlayersObj) {
      Object.keys(existingPlayersObj).forEach(function(key) {
        if (existingPlayersObj[key] && existingPlayersObj[key].pin) {
          existingPins.push(existingPlayersObj[key].pin);
        }
      });
    }
    
    var pin;
    do {
      var num = Math.floor(Math.random() * 10000);
      pin = num.toString().padStart(4, '0');
    } while (existingPins.includes(pin));
    
    return pin;
  },

  // 2. 安全字串 HTML 轉義（防 XSS）
  escapeHtml: function(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // 3. 根據 Group ID 取得顯示名稱
  groupName: function(groupId) {
    return window.CONFIG.groups[groupId] || groupId;
  },

  // 4. 計算 Clue 派發與向下溢位邏輯 (Lv3 -> Lv2 -> Lv1)
  // return: { updatedUnlocked: [...], addedClueId: "..." }
  assignClueWithOverflow: function(currentUnlocked, targetLevel, allCluesObj) {
    currentUnlocked = currentUnlocked || [];
    allCluesObj = allCluesObj || {};

    var lv1Ids = Object.keys(allCluesObj.level1 || {});
    var lv2Ids = Object.keys(allCluesObj.level2 || {});
    var lv3Ids = Object.keys(allCluesObj.level3 || {});

    var targetsToTry = [];
    if (targetLevel === 'level3') targetsToTry = ['level3', 'level2', 'level1'];
    else if (targetLevel === 'level2') targetsToTry = ['level2', 'level1'];
    else if (targetLevel === 'level1') targetsToTry = ['level1'];

    var newlyAdded = null;

    for (var i = 0; i < targetsToTry.length; i++) {
      var lvl = targetsToTry[i];
      var availablePool = [];
      if (lvl === 'level3') availablePool = lv3Ids;
      else if (lvl === 'level2') availablePool = lv2Ids;
      else if (lvl === 'level1') availablePool = lv1Ids;

      // 尋找該層級中尚未被解鎖的 Clue
      for (var j = 0; j < availablePool.length; j++) {
        var cid = availablePool[j];
        if (!currentUnlocked.includes(cid)) {
          newlyAdded = cid;
          break;
        }
      }
      if (newlyAdded) break; // 已順利找到可派送的 Clue
    }

    var nextUnlocked = currentUnlocked.slice();
    if (newlyAdded) {
      nextUnlocked.push(newlyAdded);
    }

    return {
      unlocked_clues: nextUnlocked,
      addedClueId: newlyAdded
    };
  }
};
