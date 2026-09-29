/* ============================================================
 * 星际英语站 - 状态存储与调度
 * localStorage 单机持久化；Leitner 盒子间隔复习；连击与护盾
 * ============================================================ */

const Store = (() => {
  const KEY = 'star-english-v1';
  const todayStr = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  function addDays(s, n) {
    const [y, m, d] = s.split('-').map(Number);
    return todayStr(new Date(y, m - 1, d + n));
  }
  function diffDays(a, b) {
    const [y1, m1, d1] = a.split('-').map(Number);
    const [y2, m2, d2] = b.split('-').map(Number);
    return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
  }
  function weekKey(d = new Date()) {
    const start = new Date(d.getFullYear(), 0, 1);
    const day = Math.floor((d - start) / 86400000);
    return `${d.getFullYear()}-${Math.floor((day + start.getDay()) / 7)}`;
  }

  function freshState() {
    return {
      v: 1,
      settings: { dailyNew: 4, dailyReview: 10, sessionLimitMin: 20, soundOff: false, pin: '1234', activePacks: null, grade: 4, range: 'below' },
      coins: 0,
      pet: { name: '小星', fed: 0 },
      streak: { count: 0, lastDone: null, shields: 2, shieldWeek: null },
      srs: {},        // id -> {box, due, ok, bad, learnedAt}
      album: {},      // id -> {at, gold}
      today: { date: todayStr(), newDone: 0, revDone: 0, minutes: 0, questDone: false },
      history: {},    // date -> {done, minutes, news, revs, shieldUsed}
      custom: []      // 自定义词（cat:'custom'）
    };
  }

  let state = freshState();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.v === 1) state = Object.assign(freshState(), obj);
      }
    } catch (e) { state = freshState(); }
    ensureToday();
    applyShieldBridge();
    save();
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 存储满等异常忽略 */ }
  }

  function ensureToday() {
    const t = todayStr();
    if (state.today.date !== t) state.today = { date: t, newDone: 0, revDone: 0, minutes: 0, questDone: false };
  }

  /* 护盾桥接：昨天漏打卡时自动消耗一张护盾保住连击 */
  function applyShieldBridge() {
    const st = state.streak, t = todayStr();
    if (st.shieldWeek !== weekKey()) { st.shieldWeek = weekKey(); st.shields = 2; }
    if (st.lastDone && diffDays(st.lastDone, t) === 2 && st.shields > 0) {
      st.shields--;
      const yest = addDays(t, -1);
      st.lastDone = yest;
      if (!state.history[yest]) state.history[yest] = {};
      state.history[yest].shieldUsed = true;
    }
  }

  /* ---------- 词库 ---------- */
  function allPacks() {
    const packs = WORD_PACKS.slice();
    if (state.custom.length) {
      packs.push({ id: 'custom', name: '我的星系', emoji: '✨', color: '#ffd166', desc: '家长自定义词库', words: state.custom });
    }
    return packs;
  }
  function isActive(packId) {
    const ap = state.settings.activePacks;
    return !ap || ap.includes(packId);
  }
  function activePacks() { return allPacks().filter(p => isActive(p.id)); }
  function findWord(id) {
    for (const p of allPacks()) {
      const w = p.words.find(w => w.word.toLowerCase() === id);
      if (w) return Object.assign({ cat: p.id, packName: p.name, packColor: p.color }, w);
    }
    return null;
  }

  /* 词汇范围过滤：current=只学当前年级 below=当前+低年级 all=全部（自定义词始终可用） */
  function gradeOk(w) {
    if (!w.grade) return true;
    const { grade, range } = state.settings;
    if (range === 'all') return true;
    if (range === 'current') return w.grade === grade;
    return w.grade <= grade;
  }

  /* 新词池：按星系轮转取词，年级由低到高（先温故再主攻），保证每天词分布在不同主题 */
  function newPool(cap) {
    const queues = activePacks().map(p => {
      const ws = p.words
        .filter(w => !state.srs[w.word.toLowerCase()] && gradeOk(w))
        .sort((a, b) =>
          (a.grade || state.settings.grade) - (b.grade || state.settings.grade) ||
          a.level - b.level || a.word.localeCompare(b.word));
      return { color: p.color, ws };
    }).filter(q => q.ws.length);
    const out = [];
    let more = true;
    while (out.length < cap && more) {
      more = false;
      for (const q of queues) {
        const w = q.ws.shift();
        if (w) { more = true; out.push(w.word.toLowerCase()); if (out.length >= cap) break; }
      }
    }
    return out;
  }

  /* 到期待复习词：错题优先出现 */
  function dueList() {
    const t = todayStr();
    return Object.keys(state.srs)
      .filter(id => state.srs[id].due <= t && findWord(id))
      .sort((a, b) =>
        state.srs[a].due.localeCompare(state.srs[b].due) ||
        weaknessScore(b) - weaknessScore(a) ||
        state.srs[a].box - state.srs[b].box
      );
  }

  /* ---------- 学习记录 ---------- */
  /* 新词首次拼对：进入 SRS + 发贴纸 */
  function masterWord(id, hintsUsed, hadWrong) {
    const t = todayStr();
    const rec = state.srs[id] || { box: 0, ok: 0, bad: 0 };
    rec.box = Math.min(BOX_INTERVALS.length, rec.box + 1);
    rec.due = addDays(t, BOX_INTERVALS[rec.box - 1]);
    rec.ok++;
    if (hadWrong) { rec.bad = (rec.bad || 0) + 1; rec.wrongStreak = 1; rec.lastWrong = t; }
    else rec.wrongStreak = 0;
    rec.learnedAt = rec.learnedAt || t;
    state.srs[id] = rec;
    state.today.newDone++;
    let gold = false, newSticker = false;
    if (!state.album[id]) {
      gold = Math.random() < GOLD_RATE;
      state.album[id] = { at: t, gold };
      newSticker = true;
    }
    const reward = Math.max(2, COIN_NEW - hintsUsed * HINT_COST - (hadWrong ? 2 : 0));
    state.coins += reward;
    save();
    return { gold, newSticker, reward };
  }

  /* 复习结果 */
  function reviewWord(id, correct) {
    const t = todayStr();
    const rec = state.srs[id];
    if (!rec) return 0;
    if (correct) {
      rec.box = Math.min(BOX_INTERVALS.length, rec.box + 1);
      rec.ok++;
      rec.due = addDays(t, BOX_INTERVALS[rec.box - 1]);
      rec.wrongStreak = 0;
    } else {
      rec.box = Math.max(1, rec.box - 1);
      rec.bad = (rec.bad || 0) + 1;
      rec.wrongStreak = (rec.wrongStreak || 0) + 1;
      rec.lastWrong = t;
      rec.due = addDays(t, 1);
    }
    state.today.revDone++;
    const reward = correct ? COIN_REVIEW : 1;
    state.coins += reward;
    save();
    return reward;
  }

  /* ---------- 错题本 ---------- */
  /* 弱词判定：还在连错中，或错误数多于正确数（连续答对会自然"洗白"） */
  function isWeak(id) {
    const rec = state.srs[id];
    if (!rec) return false;
    return (rec.wrongStreak || 0) > 0 || (rec.bad || 0) > rec.ok;
  }
  function weaknessScore(id) {
    const rec = state.srs[id];
    if (!rec) return 0;
    return (rec.wrongStreak || 0) * 3 + (rec.bad || 0);
  }
  function weakList(cap = 10) {
    return Object.keys(state.srs)
      .filter(id => isWeak(id) && findWord(id))
      .sort((a, b) => weaknessScore(b) - weaknessScore(a))
      .slice(0, cap);
  }

  function addCoins(n) { state.coins = Math.max(0, state.coins + n); save(); }

  function addMinutes(min) {
    state.today.minutes = Math.min(180, state.today.minutes + min);
    save();
  }

  /* ---------- 完成每日任务 ---------- */
  function completeQuest() {
    ensureToday();
    if (state.today.questDone) return;
    const st = state.streak, t = state.today.date;
    state.today.questDone = true;
    state.coins += COIN_QUEST_BONUS;
    if (st.shieldWeek !== weekKey()) { st.shieldWeek = weekKey(); st.shields = 2; }
    if (st.lastDone === t) { /* 今天已完成过 */ }
    else if (st.lastDone && diffDays(st.lastDone, t) === 1) st.count++;
    else st.count = 1;
    st.lastDone = t;
    state.history[t] = { done: true, minutes: state.today.minutes, news: state.today.newDone, revs: state.today.revDone };
    save();
  }

  /* ---------- 宠物 ---------- */
  function petStage() {
    let idx = 0;
    PET_STAGES.forEach((s, i) => { if (state.pet.fed >= s.need) idx = i; });
    return idx;
  }
  function feedPet() {
    if (state.coins < FEED_COST) return null;
    const before = petStage();
    state.coins -= FEED_COST;
    state.pet.fed++;
    const after = petStage();
    save();
    return { evolved: after > before, stage: after };
  }

  /* ---------- 设置与数据管理 ---------- */
  function setSetting(k, v) { state.settings[k] = v; save(); }

  function addCustomWords(list) {
    let added = 0;
    for (const w of list) {
      const id = w.word.toLowerCase();
      if (findWord(id)) continue;
      if (state.custom.some(c => c.word.toLowerCase() === id)) continue;
      state.custom.push(Object.assign({ cat: 'custom' }, w));
      added++;
    }
    save();
    return added;
  }
  function removeCustomWord(id) {
    state.custom = state.custom.filter(c => c.word.toLowerCase() !== id);
    save();
  }

  function exportJSON() { return JSON.stringify(state, null, 2); }
  function importJSON(text) {
    const obj = JSON.parse(text);
    if (!obj || obj.v !== 1 || !obj.settings) throw new Error('文件格式不对');
    state = Object.assign(freshState(), obj);
    ensureToday();
    save();
  }
  function resetProgress() {
    const keep = { settings: state.settings, pet: { name: state.pet.name, fed: 0 }, custom: state.custom };
    state = Object.assign(freshState(), keep);
    save();
  }
  function factoryReset() {
    localStorage.removeItem(KEY);
    state = freshState();
    save();
  }

  /* 首次启动检测 */
  function isFirstRun() { return !localStorage.getItem('star-english-greeted'); }
  function markGreeted() { localStorage.setItem('star-english-greeted', '1'); }

  return {
    get state() { return state; },
    load, save, todayStr, addDays, diffDays,
    allPacks, activePacks, isActive, findWord, newPool, dueList,
    masterWord, reviewWord, addMinutes, completeQuest,
    isWeak, weakList, addCoins,
    petStage, feedPet, setSetting,
    addCustomWords, removeCustomWord,
    exportJSON, importJSON, resetProgress, factoryReset,
    isFirstRun, markGreeted, FEED_COST
  };
})();
