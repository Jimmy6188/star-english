/* ============================================================
 * 星际求知号 - 状态存储与调度
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
      settings: { dailyNew: 4, dailyReview: 10, sessionLimitMin: 20, soundOff: false, pin: '1234', activePacks: null, grade: 4, range: 'below', warmupPerDay: 1, theme: 'auto', dailyCoinCap: 150, challengePerDay: 1 },
      coins: 0,
      pet: { name: '小星', fed: 0, outfits: { owned: [], worn: {} } },
      streak: { count: 0, best: 0, lastDone: null, shields: 2, shieldWeek: null },
      srs: {},        // id -> {box, due, ok, bad, wrongStreak, learnedAt}
      album: {},      // id -> {at, gold}
      today: { date: todayStr(), newDone: 0, revDone: 0, minutes: 0, questDone: false, mistakes: 0, enDone: false, mathDone: false, cnRounds: 0, coinsEarned: 0, tripleDone: false, mint: {}, capHit: false, capToastShown: false, boxOpened: 0, enReadDone: false },
      subjects: { science: subjFresh(), daofa: subjFresh() },
      shop: { rewards: [], pending: [], history: [] },
      history: {},    // date -> {done, minutes, news, revs, shieldUsed}
      custom: [],     // 自定义词（cat:'custom'）
      rankIdx: 0,     // 当前段位
      pendingPromotion: null, // 待展示的晋升弹窗 {name, reward}
      boss: { week: null, done: false, best: 0 }, // 每周 BOSS 挑战
      badges: {},            // 徽章 id -> 获得日期
      pendingBadges: [],     // 待展示的徽章 id 队列
      dictations: [],        // 听写测验记录 {at, correct, total}
      spoken: {},            // 跟读过的词 id -> 日期（奖励每词一次）
      math: { wrong: [], wrongP: [], best: 0, runs: [], planets: 0, goodRuns: 0, level: 2, seconds: 60 },
      chinese: { stars: {}, reads: [], wrong: [], guwen: [] },
      phonics: { rounds: 0 }, // 词族拼读累计轮数
      enRead: { reads: [] }, // 已读完的英语短文 id
      sentence: { runs: 0, done: [], best: 0, layout: 'abc', hard: {} }, // 句子默写：轮数/已默写句子 id/最好成绩/键盘排列(abc|qwerty)/难词复现计数
      junior: { seen: {} },  // 每日一星：已收下的初中知识卡 id -> 日期
      stats: { drillsDone: 0, thinkDone: 0, boxesOpened: 0 }
    };
  }

  let state = freshState();

  /* 存档迁移（避免老存档被新数值回退，并补齐新增字段） */
  function migrate() {
    if (!state.badges) state.badges = {};
    if (!state.pendingBadges) state.pendingBadges = [];
    if (!state.dictations) state.dictations = [];
    if (!state.spoken) state.spoken = {};
    if (!state.math) state.math = { wrong: [], best: 0, runs: [], planets: 0, goodRuns: 0, level: 2, seconds: 60 };
    if (state.math.wrong === undefined) state.math.wrong = [];
    if (state.math.wrongP === undefined) state.math.wrongP = [];
    if (state.math.level === undefined) state.math.level = 2;
    if (state.math.seconds === undefined) state.math.seconds = 60;
    if (!state.chinese) state.chinese = { stars: {}, reads: [], wrong: [] };
    if (!state.chinese.stars) state.chinese.stars = {};
    if (!state.chinese.reads) state.chinese.reads = [];
    if (!state.chinese.wrong) state.chinese.wrong = [];
    if (!state.chinese.guwen) state.chinese.guwen = [];
    if (!state.chinese.learned) state.chinese.learned = {}; /* v23：诗词"已学习"记录 */
    if (!state.phonics) state.phonics = { rounds: 0 };
    if (!state.shop) state.shop = { rewards: [], pending: [], history: [] };
    if (state.today && state.today.coinsEarned === undefined) state.today.coinsEarned = 0;
    if (state.today && state.today.cnRounds === undefined) state.today.cnRounds = 0;
    if (state.today && state.today.mint === undefined) state.today.mint = {};
    if (state.today && state.today.capHit === undefined) state.today.capHit = false;
    if (state.today && state.today.capToastShown === undefined) state.today.capToastShown = false;
    if (state.today && state.today.boxOpened === undefined) state.today.boxOpened = 0;
    if (state.today && state.today.enReadDone === undefined) state.today.enReadDone = false;
    if (!state.enRead) state.enRead = { reads: [] };
    if (!state.junior) state.junior = { seen: {} }; /* v26：每日一星知识卡 */
    if (!state.sentence) state.sentence = { runs: 0, done: [], best: 0 }; /* v30：句子默写 */
    if (state.sentence.layout === undefined) state.sentence.layout = 'abc'; /* v31：键盘排列，默认字母序 */
    if (!state.sentence.hard) state.sentence.hard = {}; /* v31：句中难词复现计数 */
    if (!state.pet.outfits) state.pet.outfits = { owned: [], worn: {} };
    if (state.stats && !state.stats.thinkDone) state.stats.thinkDone = 0;
    if (state.stats && !state.stats.boxesOpened) state.stats.boxesOpened = 0;
    if (state.settings.dailyCoinCap === undefined) state.settings.dailyCoinCap = 150;
    if (state.settings.challengePerDay === undefined) state.settings.challengePerDay = 1;
    /* eco3（v21 金币收紧）：旧默认上限 200 一并降到 150；家长手调过的值不动 */
    if (!state.settings.eco3) {
      state.settings.eco3 = true;
      if (state.settings.dailyCoinCap === 200) state.settings.dailyCoinCap = 150;
    }
    /* 新增挑战星系后，老存档的 activePacks 里可能没有它，补上 */
    if (Array.isArray(state.settings.activePacks) && !state.settings.activePacks.includes('challenge')) state.settings.activePacks.push('challenge');
    if (!state.stats) state.stats = { drillsDone: 0 };
    if (state.today && state.today.mistakes === undefined) state.today.mistakes = 0;
    if (state.settings.warmupPerDay === undefined) state.settings.warmupPerDay = 1;
    if (!state.settings.theme) state.settings.theme = 'auto';
    if (state.today && state.today.tripleDone === undefined) state.today.tripleDone = false;
    if (!state.subjects) state.subjects = {};
    ['science', 'daofa'].forEach(id => {
      if (!state.subjects[id]) state.subjects[id] = subjFresh();
      const sj = state.subjects[id];
      if (!sj.done) sj.done = {};
      if (!sj.wrong) sj.wrong = [];
    });
    if (state.streak.best === undefined) state.streak.best = state.streak.count || 0;
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
    if (state.today.date !== t) state.today = { date: t, newDone: 0, revDone: 0, minutes: 0, questDone: false, mistakes: 0, enDone: false, mathDone: false, cnRounds: 0, coinsEarned: 0, tripleDone: false, mint: {}, capHit: false, capToastShown: false, boxOpened: 0, enReadDone: false };
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

  /* 新词池：当前年级词为主，低年级温故词 + 高年级挑战词每天限量穿插，教材包优先 */
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
    /* 分池：当前年级（含自定义词）为主池，其它年级为温故池 */
    const main = seq.filter(id => { const w = findWord(id); return !w.grade || w.grade === grade; });
    const other = seq.filter(id => !main.includes(id))
      .sort((a, b) => (findWord(a).grade || grade) - (findWord(b).grade || grade));

    /* 挑战池：高年级词无视词汇范围限量混入（学有余力也够得着） */
    const warmN = Math.min(cap, other.length, Math.max(0, state.settings.warmupPerDay == null ? 1 : state.settings.warmupPerDay));
    const chN = Math.min(Math.max(0, state.settings.challengePerDay == null ? 1 : state.settings.challengePerDay), Math.max(0, cap - warmN));
    const chIds = [];
    if (chN > 0) {
      const cand = [];
      activePacks().forEach(p => p.words.forEach(w => {
        const id = w.word.toLowerCase();
        if (w.grade && w.grade > grade && !state.srs[id] && !main.includes(id) && !other.includes(id)) cand.push(id);
      }));
      cand.sort((a, b) => (findWord(a).grade - findWord(b).grade) || ((findWord(a).level || 1) - (findWord(b).level || 1)));
      chIds.push(...cand.slice(0, chN));
    }

    /* 组合：把温故/挑战词均匀撒进队列 */
    const spice = other.slice(0, warmN).concat(chIds);
    const spiceIdx = new Set();
    for (let j = 0; j < spice.length; j++) spiceIdx.add(Math.min(cap - 1, Math.floor((j + 0.5) * cap / spice.length)));
    const out = [];
    const mainQ = main.slice(), spiceQ = spice.slice(), otherQ = other.slice(warmN);
    for (let i = 0; i < cap; i++) {
      if (spiceIdx.has(i) && spiceQ.length) out.push(spiceQ.shift());
      else if (mainQ.length) out.push(mainQ.shift());
      else if (spiceQ.length) out.push(spiceQ.shift());
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
  /* 新词首次拼对：进入 SRS + 发贴纸；高年级挑战词金币加成（提示改为直接花金币，不再扣奖励） */
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
    const w = findWord(id);
    const isChallenge = !!(w && w.grade && w.grade > state.settings.grade);
    const reward = earn(Math.max(2, COIN_NEW + (isChallenge ? COIN_CHALLENGE_NEW : 0) - (hadWrong ? 2 : 0)));
    if (hadWrong) addMistake();
    const promo = checkRank();
    checkBadges();
    save();
    return { gold, newSticker, reward, promo };
  }

  /* 复习结果；挑战词复习答对小加成 */
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
    let reward = 0;
    if (correct) {
      const w = findWord(id);
      const isChallenge = !!(w && w.grade && w.grade > state.settings.grade);
      reward = earn(COIN_REVIEW + (isChallenge ? COIN_CHALLENGE_REVIEW : 0));
    } else reward = earn(1);
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

  /* ---------- 金币经济 ----------
   * earn(n, opts): 唯一入账口。受每日上限约束（opts.ignoreCap 可豁免，用于段位/BOSS 等里程碑），
   * 返回实际入账数（触顶时可能小于 n）。入账后立刻刷新顶栏金币。
   * earnScaled(type, base): 可重复活动专用——当天第 1 次全额、第 2 次四折、第 3 次起 1 枚，
   * 引导"首刷"而不是刷重复内容。 */
  function earn(n, opts) {
    let added = Math.max(0, Math.round(n));
    const cap = Math.max(0, state.settings.dailyCoinCap || 0);
    const already = state.today.coinsEarned || 0;
    if (cap > 0 && !(opts && opts.ignoreCap) && already + added > cap) {
      added = Math.max(0, cap - already);
      state.today.capHit = true;
      if (!state.today.capToastShown) {
        state.today.capToastShown = true;
        try { toast(`🪙 今日金币已达上限 ${cap}，明天继续加油！`); } catch (e) { /* UI 未就绪时忽略 */ }
      }
    }
    if (added > 0) {
      state.coins += added;
      state.today.coinsEarned = already + added;
      try { if (typeof updateTop === 'function') updateTop(); } catch (e) { /* UI 未就绪时忽略 */ }
    }
    return added;
  }
  function earnScaled(type, base) {
    if (!state.today.mint) state.today.mint = {};
    const n = state.today.mint[type] || 0;
    state.today.mint[type] = n + 1;
    const mult = n === 0 ? 1 : (n === 1 ? 0.4 : 0);
    const amt = n >= 2 ? 1 : Math.round(base * mult);
    return earn(amt);
  }
  /* 花金币（提示、星盒、装扮）：钱不够返回 false */
  function spend(n) {
    if (state.coins < n) return false;
    state.coins -= n;
    try { if (typeof updateTop === 'function') updateTop(); } catch (e) { /* UI 未就绪时忽略 */ }
    save();
    return true;
  }
  function addCoins(n, opts) { const got = earn(n, opts); save(); return got; }

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
    earn(COIN_QUEST_BONUS);
    if (st.shieldWeek !== weekKey()) { st.shieldWeek = weekKey(); st.shields = 2; }
    if (st.lastDone === t) { /* 今天已完成过 */ }
    else if (st.lastDone && diffDays(st.lastDone, t) === 1) st.count++;
    else st.count = 1;
    st.best = Math.max(st.best || 0, st.count);
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
      earn(reward, { ignoreCap: true }); // 段位晋升是里程碑奖励，不受每日上限影响
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
  /* 击伤奖励每周只发一次；返回 true 表示本次是本周第一次击伤 */
  function bossHurtReward() {
    const b = bossInfo();
    if (b.hurtWeek === weekKey()) return false;
    b.hurtWeek = weekKey();
    save();
    return true;
  }

  /* ---------- 金币兑换连击护盾（大额出口） ----------
   * 500 🪙 换一张护盾；持有上限 SHIELD_MAX，每周自动补的 2 张也计入上限。 */
  function buyShield() {
    const st = state.streak;
    if (st.shieldWeek !== weekKey()) { st.shieldWeek = weekKey(); st.shields = 2; }
    if (st.shields >= SHIELD_MAX) return { ok: false, msg: `护盾已满 ${SHIELD_MAX} 张，先留着用吧` };
    if (!spend(SHIELD_COST)) return { ok: false, msg: '金币还不够' };
    st.shields++;
    checkBadges();
    save();
    return { ok: true, shields: st.shields };
  }

  /* ---------- 成就徽章 ---------- */
  function addMistake() {
    state.today.mistakes = (state.today.mistakes || 0) + 1;
  }
  function markEnglishDone() { state.today.enDone = true; save(); }

  /* ---------- 语文星系 ---------- */
  function markCnStar(poemId, allOk) {
    if (allOk) state.chinese.stars[poemId] = todayStr();
    const got = earnScaled('poem', allOk ? 12 : 4);
    checkBadges();
    save();
    return got;
  }
  function markCnRead(passageId) {
    if (!state.chinese.reads.includes(passageId)) state.chinese.reads.push(passageId);
    save();
  }
  /* 阅读训练营一轮结束统一入账（原来每题发一次，改为整轮一次） */
  function finishCnRead(passageId, correct, total) {
    const got = earnScaled('cnread', correct * 3 + (correct === total ? 5 : 0));
    markCnRead(passageId);
    checkBadges();
    save();
    return got;
  }
  function finishCnWords(correct) {
    const got = earnScaled('cnwords', correct * 3);
    checkBadges();
    save();
    return got;
  }
  /* 小古文一篇读完（原文+3 题），难度高于普通阅读，单价 5/题 */
  function finishCnGuwen(passageId, correct, total) {
    if (!state.chinese.guwen.includes(passageId)) state.chinese.guwen.push(passageId);
    const got = earnScaled('guwen', correct * 4 + (correct === total ? 5 : 0));
    checkBadges();
    save();
    return got;
  }
  /* 词族拼读一轮结束 */
  function markPhonicsRound(correct, total) {
    if (!state.phonics) state.phonics = { rounds: 0 };
    state.phonics.rounds = (state.phonics.rounds || 0) + 1;
    const got = earnScaled('phonics', correct * 4 + (correct === total ? 5 : 0));
    checkBadges();
    save();
    return got;
  }
  function addCnWrong(q) {
    const w = state.chinese.wrong;
    if (w.some(x => x.q === q.q)) return;
    w.push({ q: q.q, opts: q.opts, ans: q.ans, tip: q.tip || '' });
    if (w.length > 20) state.chinese.wrong = w.slice(-20);
    save();
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
  /* ---------- 数学星系 ---------- */
  function addMathWrong(q, a) {
    const m = state.math;
    if (m.wrong.some(x => x.q === q)) return;
    m.wrong.push({ q, a });
    if (m.wrong.length > 20) m.wrong = m.wrong.slice(-20);
    save();
  }
  function clearMathWrong(q) {
    state.math.wrong = state.math.wrong.filter(x => x.q !== q);
    save();
  }
  function finishMathRun(correct, seconds, wrongList) {
    ensureToday();
    /* 难度加成：挑战档（两步混合）金币 ×1.5；首刷全额、重刷递减 */
    const lv = state.math.level || 2;
    const base = correct * 1 + (correct >= 15 ? 8 : correct >= 8 ? 4 : 0);
    const coinsGain = earnScaled('sprint', Math.round(base * (lv === 3 ? 1.5 : 1)));
    state.today.mathDone = true;
    const m = state.math;
    const isNewBest = correct > (m.best || 0);
    if (isNewBest) m.best = correct;
    m.runs = m.runs || [];
    m.runs.push({ at: todayStr(), correct, seconds });
    if (m.runs.length > 10) m.runs = m.runs.slice(-10);
    let planetLit = false;
    if (correct >= 10) {
      m.goodRuns = (m.goodRuns || 0) + 1;
      const target = Math.min(10, Math.ceil(m.goodRuns / 2));
      if (target > (m.planets || 0)) { m.planets = target; planetLit = true; }
    }
    completeQuest();
    checkBadges();
    save();
    return { coinsGain, planetLit, planets: m.planets || 0, isNewBest };
  }
  function setMath(k, v) { state.math[k] = v; save(); }
  function addPracticeWrong(item) {
    const m = state.math;
    if (m.wrongP.some(x => x.q === item.q)) return;
    m.wrongP.push({ q: item.text, a: item.ans, tip: item.tip || '' });
    if (m.wrongP.length > 20) m.wrongP = m.wrongP.slice(-20);
    save();
  }
  function clearPracticeWrong(q) {
    state.math.wrongP = state.math.wrongP.filter(x => x.q !== q);
    save();
  }
  /* 练习场一组结束统一入账（原来每题发一次） */
  function finishPracticeRun(correct) {
    const got = earnScaled('practice', correct * 4);
    save();
    return got;
  }
  /* 次科（科学/道法）一轮结束统一入账 */
  function finishSubjectRound(id, correct, total) {
    subjectAddRound(id);
    const got = earnScaled(id, correct * 3 + (correct === total ? 5 : 0));
    save();
    return got;
  }
  /* 数学思维挑战一组结束 */
  function finishThinkRun(correct, total) {
    ensureToday();
    const got = earnScaled('think', correct * 5 + (correct === total ? 8 : 0));
    state.stats.thinkDone = (state.stats.thinkDone || 0) + 1;
    checkBadges();
    save();
    return got;
  }

  /* ---------- 机器伙伴装扮（长期金币出口） ---------- */
  function outfitState() {
    if (!state.pet.outfits) state.pet.outfits = { owned: [], worn: {} };
    return state.pet.outfits;
  }
  function buyOutfit(id) {
    const item = PET_OUTFITS.find(o => o.id === id);
    if (!item) return { ok: false, msg: '没有这个装扮' };
    const o = outfitState();
    if (o.owned.includes(id)) return { ok: false, msg: '已经拥有啦' };
    if (state.coins < item.price) return { ok: false, msg: '金币还不够' };
    state.coins -= item.price;
    o.owned.push(id);
    checkBadges();
    save();
    return { ok: true, item };
  }
  function wearOutfit(cat, id) {
    const o = outfitState();
    if (id) {
      if (!o.owned.includes(id)) return;
      o.worn[cat] = id;
    } else delete o.worn[cat];
    save();
  }
  /* ---------- 神秘星盒（每天限 2 个，概率掉落装扮/金币） ---------- */
  function openStarBox() {
    if ((state.today.boxOpened || 0) >= 2) return { ok: false, msg: '今天已经开过 2 个星盒啦，明天再来！' };
    if (!spend(STAR_BOX_COST)) return { ok: false, msg: '金币还不够' };
    ensureToday();
    state.today.boxOpened = (state.today.boxOpened || 0) + 1;
    state.stats.boxesOpened = (state.stats.boxesOpened || 0) + 1;
    const o = outfitState();
    const unowned = tier => PET_OUTFITS.filter(x => (tier === 'gold' ? !!x.gold : !x.gold) && !o.owned.includes(x.id));
    const roll = Math.random();
    let drop;
    const anyLeft = unowned('normal').length || unowned('gold').length;
    if (!anyLeft || roll < 0.55) {
      const c = Math.floor(Math.random() * 36) + 5;
      earn(c, { ignoreCap: true });
      drop = { kind: 'coins', n: c };
    } else {
      const tier = roll < 0.85 ? 'normal' : 'gold';
      let pool = unowned(tier);
      if (!pool.length) pool = unowned(tier === 'gold' ? 'normal' : 'gold');
      if (pool.length) {
        const item = pool[Math.floor(Math.random() * pool.length)];
        o.owned.push(item.id);
        drop = { kind: 'outfit', item };
      } else {
        earn(40, { ignoreCap: true });
        drop = { kind: 'coins', n: 40 };
      }
    }
    checkBadges();
    save();
    return { ok: true, drop };
  }
  /* ---------- 英语每日短文 ---------- */
  function markEnRead(pid) {
    if (!state.enRead) state.enRead = { reads: [] };
    if (!state.enRead.reads.includes(pid)) state.enRead.reads.push(pid);
    state.today.enReadDone = true;
    checkBadges();
    save();
  }

  /* ---------- 英语句子默写 ----------
   * 每默写完一句记一个 id（供抽题时优先出新句）；一轮结束后记轮数与最好成绩。 */
  function markSentence(sid) {
    if (!state.sentence) state.sentence = { runs: 0, done: [], best: 0 };
    if (!state.sentence.done.includes(sid)) {
      state.sentence.done.push(sid);
      save();
    }
  }
  function bumpSentenceRun(perfect) {
    if (!state.sentence) state.sentence = { runs: 0, done: [], best: 0 };
    state.sentence.runs = (state.sentence.runs || 0) + 1;
    state.sentence.best = Math.max(state.sentence.best || 0, perfect || 0);
    save();
  }
  /* 句子默写键盘排列：abc=字母顺序（低年级找字母快）/ qwerty=和电脑一致 */
  function setSentenceLayout(layout) {
    if (!state.sentence) state.sentence = {};
    state.sentence.layout = layout === 'qwerty' ? 'qwerty' : 'abc';
    save();
  }
  /* 句中拼错的词计入难词表：之后抽句优先出含这些词的句子，及时复现 */
  function bumpSentenceHard(words) {
    if (!state.sentence) state.sentence = {};
    if (!state.sentence.hard) state.sentence.hard = {};
    words.forEach(w => { state.sentence.hard[w] = (state.sentence.hard[w] || 0) + 1; });
    /* 只留最有价值的 60 个，防止无限增长 */
    const keys = Object.keys(state.sentence.hard);
    if (keys.length > 60) {
      keys.sort((a, b) => state.sentence.hard[b] - state.sentence.hard[a]);
      state.sentence.hard = Object.fromEntries(keys.slice(0, 60).map(k => [k, state.sentence.hard[k]]));
    }
    save();
  }

  /* ---------- 每日一星（初中知识浸润卡） ----------
   * 每天只发一张：点"看懂了"记入 seen 并 +1 金币（受每日上限约束）。
   * 当天领过后首页只显示"已收下"，防止一天连刷；全部看完后随机重温。 */
  function juniorClaimedToday() {
    const t = todayStr();
    const seen = (state.junior && state.junior.seen) || {};
    return Object.keys(seen).some(id => seen[id] === t);
  }
  function nextJuniorCard() {
    if (typeof JUNIOR_CARDS === 'undefined' || !JUNIOR_CARDS.length) return null;
    const seen = (state.junior && state.junior.seen) || {};
    if (juniorClaimedToday()) {
      const id = Object.keys(seen).find(k => seen[k] === todayStr());
      return JUNIOR_CARDS.find(c => c.id === id) || JUNIOR_CARDS[0];
    }
    return JUNIOR_CARDS.find(c => !seen[c.id]) || JUNIOR_CARDS[Math.floor(Math.random() * JUNIOR_CARDS.length)];
  }
  function markJuniorSeen(id) {
    if (!state.junior) state.junior = { seen: {} };
    if (!state.junior.seen) state.junior.seen = {};
    if (state.junior.seen[id] || juniorClaimedToday()) return { ok: false, already: true };
    state.junior.seen[id] = todayStr();
    earn(1);
    checkBadges();
    save();
    return { ok: true };
  }

  /* ---------- 兑换商店 ---------- */
  function addShopReward(emoji, name, cost) {
    state.shop.rewards.push({ id: 'rw' + Date.now(), emoji: emoji || '🎁', name, cost: Math.max(1, cost) });
    save();
  }
  function removeShopReward(id) {
    state.shop.rewards = state.shop.rewards.filter(r => r.id !== id);
    save();
  }
  function redeemReward(id) {
    const r = state.shop.rewards.find(x => x.id === id);
    if (!r) return { ok: false, msg: '奖励不存在' };
    if (state.shop.pending.some(p => p.rewardId === id)) return { ok: false, msg: '这个奖励已在兑现队列里啦' };
    if (state.coins < r.cost) return { ok: false, msg: '金币还不够' };
    state.coins -= r.cost;
    state.shop.pending.push({ id: 'pd' + Date.now(), rewardId: id, name: r.name, emoji: r.emoji, cost: r.cost, at: todayStr() });
    try { if (typeof updateTop === 'function') updateTop(); } catch (e) { /* UI 未就绪时忽略 */ }
    save();
    return { ok: true };
  }
  function approveRedeem(pid) {
    const p = state.shop.pending.find(x => x.id === pid);
    if (!p) return;
    state.shop.pending = state.shop.pending.filter(x => x.id !== pid);
    state.shop.history.unshift({ at: todayStr(), name: p.name, emoji: p.emoji, cost: p.cost });
    if (state.shop.history.length > 20) state.shop.history = state.shop.history.slice(0, 20);
    save();
  }
  function rejectRedeem(pid) {
    const p = state.shop.pending.find(x => x.id === pid);
    if (!p) return;
    state.shop.pending = state.shop.pending.filter(x => x.id !== pid);
    state.coins += p.cost; // 退还金币
    save();
  }
  function tomorrowDueCount() {
    const t = addDays(todayStr(), 1);
    return Object.keys(state.srs).filter(id => state.srs[id].due === t && findWord(id)).length;
  }

  /* 跟读奖励：每个词只奖一次 +3 金币 */
  function markSpoken(id) {
    if (state.spoken[id]) return { first: false };
    state.spoken[id] = todayStr();
    earn(3);
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
    /* 只清学习记录（图鉴/连击/错题/成长数据），保留设置、词库、金币、兑换商店和宠物装扮 */
    const keep = {
      settings: state.settings,
      pet: { name: state.pet.name, fed: 0, outfits: state.pet.outfits || { owned: [], worn: {} } },
      custom: state.custom,
      coins: state.coins,
      shop: state.shop
    };
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

  /* ---------- 次科（科学/道法）：周任务与题库状态 ---------- */
  function subjFresh() { return { week: null, rounds: 0, done: {}, wrong: [] }; }
  function subjectState(id) {
    if (!state.subjects[id]) state.subjects[id] = subjFresh();
    const sj = state.subjects[id];
    if (!sj.done) sj.done = {};
    if (!sj.wrong) sj.wrong = [];
    return sj;
  }
  /* 本周完成轮数（跨周自动归零） */
  function subjectWeek(id) {
    const sj = subjectState(id);
    const wk = weekKey();
    if (sj.week !== wk) { sj.week = wk; sj.rounds = 0; }
    return sj.rounds;
  }
  function subjectAddRound(id) {
    const sj = subjectState(id);
    subjectWeek(id);
    sj.rounds++;
    save();
    return sj.rounds;
  }
  function subjectMarkDone(id, lessonId) {
    const sj = subjectState(id);
    sj.done[lessonId] = (sj.done[lessonId] || 0) + 1;
    save();
  }
  function subjectWrong(id) { return subjectState(id).wrong; }
  function subjectAddWrong(id, q) {
    const sj = subjectState(id);
    if (!sj.wrong.some(x => x.q === q.q)) sj.wrong.push(q);
    save();
  }
  function subjectClearWrong(id, q) {
    const sj = subjectState(id);
    sj.wrong = sj.wrong.filter(x => x.q !== q.q);
    save();
  }

  return {
    get state() { return state; },
    load, save, todayStr, addDays, diffDays,
    allPacks, activePacks, isActive, findWord, newPool, dueList,
    masterWord, reviewWord, addMinutes, completeQuest,
    isWeak, weakList, addCoins,
    earnScaled, spend, buyShield,
    rankInfo, checkRank, learnedCount, bossInfo, bossComplete, bossHurtReward,
    addMistake, markEnglishDone, checkBadges, popPendingBadge, noteDictation, markDrillDone, markSpoken,
    addMathWrong, clearMathWrong, finishMathRun, setMath, addPracticeWrong, clearPracticeWrong,
    finishPracticeRun, finishSubjectRound, finishThinkRun,
    markCnStar, markCnRead, addCnWrong, finishCnRead, finishCnWords, finishCnGuwen, markPhonicsRound,
    subjectWeek, subjectAddRound, subjectMarkDone, subjectWrong, subjectAddWrong, subjectClearWrong,
    addShopReward, removeShopReward, redeemReward, approveRedeem, rejectRedeem, tomorrowDueCount,
    petStage, feedPet, setSetting,
    buyOutfit, wearOutfit, openStarBox, markEnRead,
    markSentence, bumpSentenceRun, setSentenceLayout, bumpSentenceHard,
    nextJuniorCard, markJuniorSeen,
    addCustomWords, removeCustomWord,
    exportJSON, importJSON, resetProgress, factoryReset,
    isFirstRun, markGreeted, FEED_COST
  };
})();
