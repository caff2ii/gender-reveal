// Gender Reveal Party Game - Configuration
// Pure frontend implementation with Firebase Realtime Database

window.CONFIG = {
  // Firebase Configuration
  firebaseConfig: {
    apiKey: "AIzaSyCEqNyvMHsTiGu-8q3WoK1eBHWJaw8KCJA",
    authDomain: "gender-reveal-party-905de.firebaseapp.com",
    databaseURL: "https://gender-reveal-party-905de-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gender-reveal-party-905de",
    storageBucket: "gender-reveal-party-905de.firebasestorage.app",
    messagingSenderId: "972856514197",
    appId: "1:972856514197:web:d18fd6e881e6992bdfad9c"
  },

  // Admin/Secret Password
  adminPassword: "1125",

  // Game Phases (12 phases total)
  phases: [
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

  // Friend Groups (7 groups)
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

  // Teams
  teams: {
    BOY: "BOY",
    GIRL: "GIRL"
  },

  // Game 1 Settings
  game1: {
    groupQuizCount: 3,
    commonQuizCount: 5,
    groupQuizScore: 1000,
    commonQuizBaseScore: 1000,
    commonQuizSpeedBonusMultiplier: 33.3,
    commonQuizTimeout: 15,
    // Default delay (ms) between each option appearing when options are revealed -
    // overridable live by the host and synced to players/display via game_state.option_reveal_step_ms
    optionRevealStepMs: 500,
    participationReward: "level1",
    top10BonusRewards: ["level2", "level3"]
  },

  // Game 2 Settings
  game2: {
    bingoBoardSize: 9, // 3x3
    bingoLinesToComplete: 2,
    bingoTop10Cutoff: 10,
    bingoParticipationReward: "level1",
    bingoTop10Rewards: ["level2", "level3"],
    bingoOneLineReward: ["level2"]
  },

  // Clue Settings
  clues: {
    totalClues: 9,
    level1Count: 3,
    level2Count: 3,
    level3Count: 3,
    levels: ["level1", "level2", "level3"]
  },

  // Game 3 Settings
  game3: {
    participationReward: "level1",
    winnerRewards: ["level2", "level3"]
  },

  // Final Choice Settings
  finalChoice: {
    lockAfterSubmit: true
  },

  // Reveal Settings
  reveal: {
    countdownSeconds: 5,
    animationDuration: 3000
  },

  // Player Settings
  player: {
    pinLength: 4,
    pinMin: 0,
    pinMax: 9999,
    localStorageKey: "genderRevealPlayer"
  },

  // Reset Settings
  reset: {
    preservePaths: ["questions", "bingo_phrases", "clues", "secret_gender"],
    clearPaths: ["players", "game_state"]
  },

  // Database Paths
  dbPaths: {
    gameState: "game_state",
    secretGender: "secret_gender",
    players: "players",
    questions: "questions",
    groupQuiz: "questions/group_quiz",
    commonQuiz: "questions/common_quiz",
    clues: "clues",
    bingoPhrases: "bingo_phrases"
  },

  // Sound Configuration
  sound: {
    stages: {
      onboardingStory: "",
      game1: "",
      game2: "",
      game3: "",
      finalReveal: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a731ae.mp3"
    },
    sfx: {
      button: "",
      correct: "",
      wrong: "",
      bingo: "",
      countdown: "",
      revealHit: "",
      confetti: "",
      fireworks: ""
    }
  },

  // QR Code Settings
  qr: {
    size: 200,
    margin: 10
  },

  // Visual Settings
  visual: {
    // Pre-reveal neutral colors
    colors: {
      charcoal: "#1a1a1a",
      ink: "#0d0d0d",
      slate: "#334155",
      offWhite: "#f8f8f8",
      paper: "#fafaf9",
      electricBlue: "#3b82f6",
      coral: "#f97316",
      pink: "#ec4899",
      amber: "#f59e0b",
      boyBlue: "#3b82f6",
      girlPink: "#ec4899"
    },
    // Typography
    fonts: {
      heading: "Space Grotesk, Sora, DM Sans, sans-serif",
      mono: "IBM Plex Mono, JetBrains Mono, monospace",
      body: "system-ui, -apple-system, sans-serif"
    },
    // Animation timings
    animations: {
      fast: 150,
      normal: 300,
      slow: 500,
      reveal: 3000
    }
  },

  // CDN URLs
  cdn: {
    tailwind: "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css",
    firebaseApp: "https://cdn.jsdelivr.net/npm/firebase@10.8.0/firebase-app-compat.js",
    firebaseDatabase: "https://cdn.jsdelivr.net/npm/firebase@10.8.0/firebase-database-compat.js",
    howler: "https://cdn.jsdelivr.net/npm/howler@2.2.4/dist/howler.min.js",
    confetti: "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js",
    qrCode: "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
  }
};

// Utility Functions
window.GenderRevealUtils = {
  // Generate random 4-digit PIN
  randomPin: function() {
    const min = window.CONFIG.player.pinMin;
    const max = window.CONFIG.player.pinMax;
    const pin = Math.floor(Math.random() * (max - min + 1)) + min;
    return pin.toString().padStart(4, '0');
  },

  // Get player URL from current location
  getPlayerUrl: function() {
    const path = window.location.pathname;
    const baseUrl = window.location.origin + path.replace(/\/[^/]*\.html$/, '/index.html');
    return baseUrl;
  },

  // Escape HTML to prevent XSS
  escapeHtml: function(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Get phase index
  phaseIndex: function(phase) {
    return window.CONFIG.phases.indexOf(phase);
  },

  // Check if phase is valid
  isValidPhase: function(phase) {
    return window.CONFIG.phases.includes(phase);
  },

  // Convert Firebase object to array
  objectToArray: function(obj) {
    if (!obj) return [];
    return Object.keys(obj).map(key => ({
      id: key,
      ...obj[key]
    }));
  },

  // Get group display name from ID
  groupName: function(groupId) {
    return window.CONFIG.groups[groupId] || groupId;
  },

  // Format PIN with leading zeros
  formatPin: function(pin) {
    return pin.toString().padStart(4, '0');
  },

  // Calculate common quiz score with speed bonus
  calculateCommonQuizScore: function(remainingSeconds) {
    const baseScore = window.CONFIG.game1.commonQuizBaseScore;
    const bonus = Math.floor(remainingSeconds * window.CONFIG.game1.commonQuizSpeedBonusMultiplier);
    return baseScore + bonus;
  },

  // Check if clue level is available for player
  isClueLevelAvailable: function(player, level) {
    const unlocked = player.unlocked_clues || [];
    const levelClues = unlocked.filter(c => c.startsWith(level));
    return levelClues.length < 3;
  },

  // Give clue to player with overflow logic
  giveClue: function(player, level) {
    if (!player.unlocked_clues) {
      player.unlocked_clues = [];
    }

    const unlocked = player.unlocked_clues;
    const levelClues = unlocked.filter(c => c.startsWith(level));

    if (levelClues.length < 3) {
      // Give this level
      const clueIndex = levelClues.length + 1;
      unlocked.push(`${level}_${clueIndex}`);
      return true;
    } else if (level === "level3" && this.isClueLevelAvailable(player, "level2")) {
      // Overflow to level2
      return this.giveClue(player, "level2");
    } else if (level === "level2" && this.isClueLevelAvailable(player, "level1")) {
      // Overflow to level1
      return this.giveClue(player, "level1");
    }

    // Level1 full or no overflow available
    return false;
  },

  // Calculate bingo lines from marked cells
  calculateBingoLines: function(markedCells) {
    const lines = [
      // Horizontal
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      // Vertical
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      // Diagonal
      [0, 4, 8],
      [2, 4, 6]
    ];

    let lineCount = 0;
    for (const line of lines) {
      if (line.every(cell => markedCells.includes(cell))) {
        lineCount++;
      }
    }
    return lineCount;
  },

  // Check if player is near completing a line
  isNearLine: function(markedCells, targetLines) {
    const currentLines = this.calculateBingoLines(markedCells);
    return currentLines === targetLines - 1;
  },

  // Get current page name
  getCurrentPage: function() {
    const path = window.location.pathname;
    const match = path.match(/\/([^/]+)\.html$/);
    return match ? match[1] : 'index';
  },

  // Format timestamp for display
  formatTimestamp: function(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }
};

// Initialize on load
window.addEventListener('DOMContentLoaded', function() {
  console.log('Gender Reveal Game Config Loaded');
  console.log('Current Page:', window.GenderRevealUtils.getCurrentPage());
});