/**
 * config.js
 * ------------------------------------------------------------
 * Gender Reveal 多螢幕互動派對系統 — 全域設定檔
 * 此檔案必須喺所有 HTML (index / display / host / admin / secret)
 * 之前用 <script src="config.js"></script> 引入。
 * ------------------------------------------------------------
 * 【必須自行填寫】
 * 1. firebaseConfig — 請貼上你自己 Firebase 專案嘅設定
 *    (Firebase Console > 專案設定 > 一般 > 你的應用程式 > SDK 設定和配置)
 * 2. sounds.bgm_ambient / sounds.bgm_tense — 請填入你自己揀嘅背景音樂連結
 *    (其餘 SFX 短音效已由系統提供免費素材連結，如失效可自行更換)
 * ------------------------------------------------------------
 */

const CONFIG = {

  // ============================================================
  // 1. Firebase 專案設定 — 【請替換成你自己嘅專案資料】
  // ============================================================
  firebaseConfig: {
    apiKey: "AIzaSyCEqNyvMHsTiGu-8q3WoK1eBHWJaw8KCJA",
    authDomain: "gender-reveal-party-905de.firebaseapp.com",
    databaseURL: "https://gender-reveal-party-905de-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gender-reveal-party-905de",
    storageBucket: "gender-reveal-party-905de.firebasestorage.app",
    messagingSenderId: "972856514197",
    appId: "1:972856514197:web:d18fd6e881e6992bdfad9c"
  },

  // ============================================================
  // 2. 簡易密碼保護（admin.html / secret.html 共用）
  // ------------------------------------------------------------
  // 注意：呢個純前端方案冇後端驗證，密碼會出現喺原始碼入面，
  // 只能防止一般人誤入 / 亂咁撞網址，唔應視為真正安全機制。
  // ============================================================
  accessPassword: "1125",

  // ============================================================
  // 3. Friend Group 對應表（英文 ID 作 Firebase key，中文作顯示名稱）
  // ============================================================
  groups: {
    group_ccbc:        "CCBC",
    group_hiking:      "偽E真I行山團",
    group_southdinner: "南區食飯",
    group_fridaydinner:"FRIDAY DINNER",
    group_boardgame:   "東區桌遊美食",
    group_agewell:     "Uniting Agewell",
    group_prayer:      "Praise and Pray"
  },

  // ============================================================
  // 4. 遊戲規則相關常數
  // ============================================================
  game: {
    // Game 1 計分
    exclusiveQuizFixedScore: 1000,      // 專屬題固定分
    commonQuizBaseScore: 1000,          // 共同題基礎分
    commonQuizTimeBonusPerSecond: 33.3, // 共同題每剩 1 秒加分
    commonQuizCountdownSeconds: 15,     // 共同題搶答倒數秒數

    // Game 1 結算：名次 -> 線索等級 門檻
    game1RankThresholds: {
      top: 10,     // Rank 1–10  -> Lv3
      mid: 20      // Rank 11–20 -> Lv2；21+ -> Lv1
    },

    // Game 2 Bingo
    bingoBoardSize: 9,          // 3x3
    bingoLinesToQualify: 2,     // 達標所需連線數
    bingoQualifyCap: 10,        // 達標第 10 位（含並列）後 cutoff
    bingoOneLineFallbackLevels: ["level1", "level2"], // 結算前僅連 1 線 -> Lv1+Lv2
    bingoZeroLineFallbackLevel: "level1",             // 結算前 0 線 -> 保底 Lv1

    // Game 3 勝方線索
    game3WinnerLevels: ["level2", "level3"],

    // 線索遞補優先序（由高至低，滿咗就向下遞補）
    clueFallbackOrder: ["level3", "level2", "level1"],
    cluesPerLevel: 3,           // 每個 Level 3 條，全場共 9 條

    // Grand Reveal
    revealCountdownSeconds: 5
  },

  // ============================================================
  // 5. 音效資源（Howler.js 使用）
  // ------------------------------------------------------------
  // bgm_ambient / bgm_tense 為背景音樂，請自行替換為你揀嘅連結。
  // 其餘 SFX 為免費素材（Mixkit），如現場網路不穩定或連結失效，
  // 建議 party 前一日測試，並可自行下載後改用本機 / 自家 CDN 路徑。
  // ============================================================
  sounds: {
    // 背景音樂（待機 / 過場用 & 緊張 / 限時用）— 請自行填入你揀嘅連結
    bgm_ambient: "REPLACE_WITH_YOUR_AMBIENT_BGM_URL",
    bgm_tense:   "REPLACE_WITH_YOUR_TENSE_BGM_URL",

    // 短音效（系統提供，免費可商用素材，來源：Mixkit）
    sfx_click:        "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3", // 按鈕點擊
    sfx_correct:      "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3", // 答對
    sfx_wrong:        "https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3", // 答錯
    sfx_countdown_tick:"https://assets.mixkit.co/active_storage/sfx/1054/1054-preview.mp3", // 倒數 tick
    sfx_bingo_line:   "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3", // Bingo 連線
    sfx_unlock_clue:  "https://assets.mixkit.co/active_storage/sfx/2016/2016-preview.mp3", // 解鎖線索
    sfx_drumroll:     "https://assets.mixkit.co/active_storage/sfx/2691/2691-preview.mp3", // Reveal 鼓點
    sfx_reveal_burst: "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3"  // Reveal 爆發
  },

  // ============================================================
  // 6. 頁面路徑（用於 QR Code 產生 & 內部連結）
  // ------------------------------------------------------------
  // playerPagePath 需與實際部署後 index.html 嘅相對路徑一致。
  // 例如部署喺 GitHub Pages 根目錄，維持 "index.html" 即可；
  // 如部署喺子路徑（如 /my-repo/），系統會自動用
  // window.location 推斷完整網址，毋須手動改 domain。
  // ============================================================
  paths: {
    playerPage: "index.html",
    displayPage: "display.html",
    hostPage: "host.html",
    adminPage: "admin.html",
    secretPage: "secret.html"
  },

  // ============================================================
  // 7. 額外 CDN（原 6 大 CDN 之外，QR Code 產生需要）
  // ------------------------------------------------------------
  // display.html 需另外引入以下 CDN 產生玩家進場 QR Code：
  // <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
  // ============================================================
  cdn: {
    qrcode: "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"
  }
};

/**
 * 取得玩家實際進場網址（供 display.html 產生 QR Code 使用）
 * 會根據目前頁面所在位置自動推斷，毋須手動填寫 domain。
 * 例如目前喺 https://username.github.io/repo/display.html
 * 推斷出玩家網址為 https://username.github.io/repo/index.html
 */
function getPlayerPageURL() {
  const base = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
  return base + CONFIG.paths.playerPage;
}

// 供各頁面使用（避免使用 ES module，統一用全域變數以配合 CDN + <script> 直接引入方式）
window.CONFIG = CONFIG;
window.getPlayerPageURL = getPlayerPageURL;
