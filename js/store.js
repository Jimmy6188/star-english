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
      settings: { dailyNew: 4, dailyReview: 10, sessionLimitMin: 20, soundOff: false, pin: '1234', activePacks: null, grade: 4, range: 'below', warmupPerDay: 1 },
      coins: 0,
      pet: { name: '小星', fed: 0 },
      streak: { count: 0, lastDone: null, shields: 2, shieldWeek: null },
      srs: {},        // id -> {box, due, ok, bad, wrongStreak, learnedAt}
      album: {},      // id -> {at, gold}
      today: { date: todayStr(), newDone: 0, revDone: 0, minutes: 0, questDone: false, mistakes: 0 },
      history: {},    // date -> {done, minutes, news, revs, shieldUsed}
      custom: [],     // 自定义词（cat:'custom'）
      rankIdx: 0,     // 当前段位
      pendingPromotion: null, // 待展示的晋升弹窗 {name, reward}
      boss: { week: null, done: false, best: 0 }, // 每周 BOSS 挑战
      badges: {},            // 徽章 id -> 获得日期
      pendingBadges: [],     // 待展示的徽章 id 队列
      dictations: [],        // 听写测验记录 {at, correct, total}
      spoken: {},            // 跟读过的词 id -> 日期（奖励每词一次）
      stats: { drillsDone: 0 }
    };
  }

  let state = freshState();

  /* 存档迁移（避免老存档被新数值回退，并补齐新增字段） */
  function migrate() {
    if (!state.badges) state.badges = {};
    if (!state.pendingBadges) state.pendingBadges = [];
    if (!state.dictations) state.dictations = [];
    if (!state.spoken) state.spoken = {};
    if (!state.stats) state.stats = { drillsDone: 0 };
    if (state.today && state.today.mistakes === undefined) state.today.mistakes = 0;
    if (state.settings.warmupPerDay === undefined) state.settings.warmupPerDay = 1;
    if (!state.settings.eco2) {
      state.settings.eco2 = true;
      if (state.pet.fed >= 30) state.pet.fed = Math.max(state.pet.fed, 60); // 旧满级机甲伙伴保级
      // 10~29 次喂食在新阈值下仍是小机器人，无需处理
    }
    let r = 0;
    RANKS.forEach((x, i) => { if (learnedCount() >= x.need) r = i; });
    if (state.rankIdx === undefined || state.rankIdx === null || r > state.rankIdx) state.rankIdx = r;
  }

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
    migrate();
    save();
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 存储满等异常忽略 */ }
  }

  function ensureToday() {
    const t = todayStr();
    if (state.today.date !== t) state.today = { date: t, newDone: 0, revDone: 0, minutes: 0, questDone: false, mistakes: 0 };
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
    const packs = TEXTBOOK_PACKS.concat(WORD_PACKS).slice();
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

  /* 新词池：当前年级词为主，低年级温故词每天限量穿插（默认 1 个），教材包优先 */
  function newPool(cap) {
    const grade = state.settings.grade;
    const queues = activePacks().map(p => ({
      textbook: !!p.textbook,
      take: p.textbook ? 2 : 1,
      ws: p.words
        .filter(w => !state.srs[w.word.toLowerCase()] && gradeOk(w))
        .sort((a, b) => a.level - b.level || a.word.localeCompare(b.word))
    })).filter(q => q.ws.length);
    queues.sort((a, b) => (b.textbook ? 1 : 0) - (a.textbook ? 1 : 0));
    const seq = [];
    let more = true;
    while (more) {
      more = false;
      for (const q of queues) {
        for (let k = 0; k < q.take; k++) {
          const w = q.ws.shift();
          if (w) { more = true; seq.push(w.word.toLowerCase()); }
        }
      }
    }
    /* 分池：当前年级（含自定义词）为主池，其它年级为温故/挑战池 */
    const main = seq.filter(id => { const w = findWord(id); return !w.grade || w.grade === grade; });
    const other = seq.filter(id => !main.includes(id))
      .sort((a, b) => (findWord(a).grade || grade) - (findWord(b).grade || grade));
    /* 组合：把温故/挑战词均匀撒进队列，数量受 warmupPerDay 限制 */
    const warmN = Math.min(cap, other.length, Math.max(0, state.settings.warmupPerDay == null ? 1 : state.settings.warmupPerDay));
    const warmIdx = new Set();
    for (let j = 0; j < warmN; j++) warmIdx.add(Math.min(cap - 1, Math.floor((j + 0.5) * cap / warmN)));
    const out = [];
    const mainQ = main.slice(), otherQ = other.slice();
    for (let i = 0; i < cap; i++) {
      if (warmIdx.has(i) && otherQ.length) out.push(otherQ.shift());
      else if (mainQ.length) out.push(mainQ.shift());
      else if (otherQ.length) out.push(otherQ.shift());
      else break;
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
    if (hadWrong) addMistake();
    const promo = checkRank();
    checkBadges();
    save();
    return { gold, newSticker, reward, promo };
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
      addMistake();
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
    checkBadges();
    save();
  }

  /* ---------- 段位与 BOSS ---------- */
  function learnedCount() {
    return Object.keys(state.srs).filter(id => findWord(id)).length;
  }
  function checkRank() {
    let r = 0;
    RANKS.forEach((x, i) => { if (learnedCount() >= x.need) r = i; });
    if (r > (state.rankIdx || 0)) {
      state.rankIdx = r;
      const reward = RANKS[r].reward || 0;
      state.coins += reward;
      state.pendingPromotion = { name: RANKS[r].name, reward, idx: r };
      return state.pendingPromotion;
    }
    return null;
  }
  function rankInfo() {
    const idx = state.rankIdx || 0;
    return { idx, name: RANKS[idx].name, next: RANKS[idx + 1] || null, learned: learnedCount() };
  }
  function bossInfo() {
    const wk = weekKey();
    if (state.boss.week !== wk) state.boss = { week: wk, done: false, best: 0 };
    return state.boss;
  }
  function bossComplete(score, total, passed) {
    const b = bossInfo();
    if (score > (b.best || 0)) { b.best = score; b.total = total; }
    if (passed) b.done = true;
    checkBadges();
    save();
  }

  /* ---------- 成就徽章 ---------- */
  function addMistake() {
    state.today.mistakes = (state.today.mistakes || 0) + 1;
  }
  function checkBadges() {
    const t = todayStr();
    ACHIEVEMENTS.forEach(a => {
      if (state.badges[a.id]) return;
      let ok = false;
      try { ok = a.cond(state, { allPacks }); } catch (e) { ok = false; }
      if (ok) {
        state.badges[a.id] = t;
        state.pendingBadges.push(a.id);
      }
    });
  }
  function popPendingBadge() {
    return state.pendingBadges.length ? state.pendingBadges.shift() : null;
  }
  function noteDictation(correct, total) {
    state.dictations.push({ at: todayStr(), correct, total });
    if (state.dictations.length > 10) state.dictations = state.dictations.slice(-10);
    checkBadges();
    save();
  }
  /* 跟读奖励：每个词只奖一次 +3 金币 */
  function markSpoken(id) {
    if (state.spoken[id]) return { first: false };
    state.spoken[id] = todayStr();
    state.coins += 3;
    checkBadges();
    save();
    return { first: true };
  }
  function markDrillDone() {
    state.stats.drillsDone = (state.stats.drillsDone || 0) + 1;
    checkBadges();
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
    checkBadges();
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
    rankInfo, checkRank, learnedCount, bossInfo, bossComplete,
    addMistake, checkBadges, popPendingBadge, noteDictation, markDrillDone, markSpoken,
    petStage, feedPet, setSetting,
    addCustomWords, removeCustomWord,
    exportJSON, importJSON, resetProgress, factoryReset,
    isFirstRun, markGreeted, FEED_COST
  };
})();
