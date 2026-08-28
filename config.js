/* Gender Reveal Party Game — shared configuration and Firebase data layer.
 * 1. Paste the Web app config from Firebase Console below.
 * 2. Deploy this folder to GitHub Pages. Player QR links then derive automatically.
 * Existing database schema is preserved: bingo_phrases, common_quiz, group_quiz,
 * clues and secret_gender are never changed by Reset All Data.
 */
window.GENDER_REVEAL_CONFIG = {
  firebase: {
    apiKey: "AIzaSyCEqNyvMHsTiGu-8q3WoK1eBHWJaw8KCJA",
    authDomain: "gender-reveal-party-905de.firebaseapp.com",
    databaseURL: "https://gender-reveal-party-905de-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gender-reveal-party-905de",
    storageBucket: "gender-reveal-party-905de.firebasestorage.app",
    messagingSenderId: "972856514197",
    appId: "1:972856514197:web:d18fd6e881e6992bdfad9c"
  },
  adminPassword: "1125",
  ambientBgmUrl: "", // optional: replace with a royalty-free audio URL
  tenseBgmUrl: "",   // optional: replace with a royalty-free audio URL
  phases: ["ONBOARDING","BACKGROUND_STORY","GAME1_RULES","GAME1_QUIZ","GAME1_SETTLE","GAME2_RULES","GAME2_BINGO","GAME2_SETTLE","GAME3_RULES","GAME3_TEAM_SELECT","FINAL_CHOICE","GRAND_REVEAL"],
  groups: [
    ["group_agewell", "Uniting Agewell"], ["group_boardgame", "東區桌遊美食"],
    ["group_ccbc", "CCBC"], ["group_fridaydinner", "Friday Dinner"],
    ["group_hiking", "偽E真I行山團"], ["group_prayer", "Praise and Pray"],
    ["group_southdinner", "南區食飯"]
  ]
};

(function () {
  const C = window.GENDER_REVEAL_CONFIG;
  const configured = C.firebase.apiKey !== "PASTE_FIREBASE_API_KEY";
  window.Game = {
    configured,
    db: null,
    stateRef: null,
    init() {
      if (!configured) return false;
      if (!firebase.apps.length) firebase.initializeApp(C.firebase);
      this.db = firebase.database(); this.stateRef = this.db.ref("game_state");
      return true;
    },
    playerUrl() {
      const u = new URL("index.html", window.location.href);
      u.search = ""; u.hash = ""; return u.href;
    },
    ref(path) { return this.db.ref(path); },
    now: () => firebase.database.ServerValue.TIMESTAMP,
    async state() { return (await this.stateRef.once("value")).val() || {}; },
    setPhase(phase) { return this.stateRef.update({ current_phase: phase, phase_changed_at: this.now() }); },
    baseState() { return { current_phase: "ONBOARDING", current_question_index: 0, drawn_bingo_phrases: {}, current_bingo_phrase: null, bingo_cutoff: false, winning_team: "" }; },
    async resetGame() { await this.ref("players").remove(); await this.stateRef.set(this.baseState()); },
    async ensureState() { const s = await this.state(); if (!s.current_phase) await this.stateRef.update(this.baseState()); },
    async uniquePin() {
      for (let i = 0; i < 30; i++) { const pin = String(Math.floor(1000 + Math.random() * 9000)); const v = await this.ref("players").orderByChild("pin").equalTo(pin).once("value"); if (!v.exists()) return pin; }
      throw new Error("Could not generate a unique PIN. Please retry.");
    },
    normalizeCollection(v) { return Array.isArray(v) ? v.filter(Boolean) : Object.entries(v || {}).map(([id, value]) => ({ id, ...(typeof value === "object" ? value : { value }) })); },
    questionText(q) { return q.question || q.text || q.title || q.prompt || "Question unavailable"; },
    questionOptions(q) {
      if (Array.isArray(q.options)) return q.options;
      if (q.answers && typeof q.answers === "object") return Object.values(q.answers);
      return [q.option_a || q.a || q.A, q.option_b || q.b || q.B, q.option_c || q.c || q.C, q.option_d || q.d || q.D].filter(x => x != null);
    },
    isCorrect(q, index) {
      const answer = q.correct_answer ?? q.correct ?? q.answer ?? q.correctAnswer;
      if (typeof answer === "number") return answer === index;
      const opts = this.questionOptions(q); const letter = "ABCD"[index];
      return String(answer).trim().toLowerCase() === letter.toLowerCase() || String(answer).trim() === String(opts[index]).trim();
    },
    lineCount(marks) {
      const m = marks || {}; const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      return lines.filter(line => line.every(i => m[i])).length;
    },
    async awardOnce(playerId, awardKey, levels) {
      const clues = (await this.ref("clues").once("value")).val() || {};
      return this.ref("players/" + playerId).transaction(p => {
        if (!p || (p.awards && p.awards[awardKey])) return p;
        p.awards ||= {}; p.awards[awardKey] = true; p.clue_library ||= { level1: [], level2: [], level3: [] };
        for (const requested of levels) { let level=requested; while (level >= 1) { const key="level"+level, pool=this.normalizeCollection(clues[key]), owned=new Set(p.clue_library[key]||[]), candidate=pool.find(x=>!owned.has(x.id)); if(candidate){p.clue_library[key].push(candidate.id);break;} level--; } }
        return p;
      });
    },
    async addClues(playerId, levels) {
      const snap = await this.ref("clues").once("value"), clues = snap.val() || {};
      return this.ref("players/" + playerId).transaction(p => {
        if (!p) return p; p.clue_library ||= { level1: [], level2: [], level3: [] };
        for (const requested of levels) {
          let level = requested;
          while (level >= 1) {
            const key = "level" + level, pool = this.normalizeCollection(clues[key]);
            const owned = new Set(p.clue_library[key] || []); const candidate = pool.find(x => !owned.has(x.id));
            if (candidate) { p.clue_library[key].push(candidate.id); break; }
            level--;
          }
        } return p;
      });
    }
  };
})();
