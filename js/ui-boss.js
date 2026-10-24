/* ============================================================
 * 星际求知号 - BOSS 周挑战（综合大考）
 * 15 题全科混合：英语拼写 4 + 语文 3 + 数学思维 3 + 科学道法 3 + 初中知识 2
 * 规则：选择/判断类答错即 1 次失误；英语拼写连错 2 次算失守；全程无提示
 * 结算照旧：失误 ≤1 击败 +50（每周一次）/ ≤3 击伤 +10 / 更多战败；周日开放
 * 错题照旧流进各学科错题本；英语拼写题复用 Quest（bossMode 规则 + bossHook 接管流程）
 * ============================================================ */

const BossAll = {
  total: 15, idx: 0, wrong: 0, plan: [], cur: null, wasDone: false,

  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  start(free) {
    Sound.stopSpeak();
    this.free = !!free; /* 自由练模式：主科全达后随时玩，不影响周奖励 */
    const pool = Object.keys(Store.state.srs).filter(id => Store.state.srs[id].box >= 3 && Store.findWord(id));
    if (pool.length < 5) { toast('综合练习需要先掌握 5 个以上较熟的词，先去冒险吧！'); return; }
    this.wasDone = this.free || Store.bossInfo().done; // 自由练/本周已通关 → 走友谊赛结算
    this.plan = this.buildPlan(shuffle(pool));
    this.idx = 0;
    this.wrong = 0;
setQuestSub('var(--gold-strong)');
    showScreen('quest');
    this.renderIntro();
  },

  /* ---------- 组卷：15 题，学科顺序随机，同卷不出现重复题 ---------- */
  buildPlan(enPool) {
    const plan = [];
    const used = new Set();
    /* 带重试的入卷：签名重复就重新生成，8 次仍重不到就作罢（保底不空题） */
    const add = (item, sig) => {
      if (used.has(sig)) return false;
      used.add(sig);
      plan.push(item);
      return true;
    };
    const addRetry = (make, sigOf, times = 8) => {
      for (let t = 0; t < times; t++) {
        const item = make();
        if (add(item, sigOf(item))) return;
      }
    };
    const qSig = q => (q.q || q.text || '') + '|' + (q.ans != null ? q.ans : (q.ansIdx != null ? q.ansIdx : JSON.stringify(q.opts || '')));
    /* 英语 4 题：词不重复（听写高阶 / 纯手写 / 听写高阶 / 句子填空；词组或不含原词的例句自动降级为听写） */
    const modes = ['spellHard', 'spellWrite', 'spellHard', 'clozeSpell'];
    enPool.slice(0, 4).forEach((id, i) => {
      const w = Store.findWord(id);
      let mode = modes[i];
      if (w.phrase) mode = 'spellHard';
      if (mode === 'clozeSpell' && !Quest.canClozeSpell(w)) mode = 'spellHard';
      const tag = mode === 'spellWrite' ? '🔤 英语 · 手写拼写' : '🔤 英语 · 高阶拼写';
      add({ tag, w, run: (root, done) => this.runEn(w, mode, root, done) }, 'en:' + w.word.toLowerCase());
    });
    /* 语文 3 题：诗词 / 阅读或古文 / 词语或诗词 */
    addRetry(() => this.cnQuestion('poem'), it => 'cn:' + qSig(it.q));
    addRetry(() => this.cnQuestion(this.pick(['read', 'guwen'])), it => 'cn:' + qSig(it.q));
    addRetry(() => this.cnQuestion(this.pick(['idiom', 'poem'])), it => 'cn:' + qSig(it.q));
    /* 数学思维 3 题：随机三种题型，内容不重复 */
    shuffle(['genSeq', 'genClever', 'genCycle', 'genJitu', 'gen24']).slice(0, 3)
      .forEach(g => addRetry(() => {
        const q = MathThink[g]();
        return { tag: '🧠 数学 · 思维挑战', q, run: (root, done) => this.runThink(q, root, done) };
      }, it => 'math:' + qSig(it.q)));
    /* 科学道法 3 题：两科各 1 道（错题优先）+ 任意 1 道，题不重复 */
    const defs = SubjectUI.defs.slice();
    if (defs.length) {
      const first = this.pick(defs);
      const second = defs.find(d => d.id !== first.id) || first;
      addRetry(() => this.sciQuestion(first), it => 'sci:' + qSig(it.q));
      addRetry(() => this.sciQuestion(second), it => 'sci:' + qSig(it.q));
      addRetry(() => this.sciQuestion(this.pick(defs)), it => 'sci:' + qSig(it.q));
    }
    /* 初中知识 2 题：学过的卡优先，题不重复 */
    this.juniorQuestions(4).slice(0, 2).forEach(q => add({
      tag: '🌟 初中星知识', q,
      run: (root, done) => this.runChoice(this.jrToChoice(q), root, done)
    }, 'jr:' + qSig(q)));
    return shuffle(plan);
  },

  /* ---------- 语文题 ---------- */
  cnQuestion(type) {
    if (type === 'poem') {
      const learned = CN_POEMS.filter(p => (Store.state.chinese.learned || {})[p.id] || Store.state.chinese.stars[p.id]);
      const p = this.pick(learned.length ? learned : CN_POEMS);
      const kind = this.pick(['next', 'fill', 'author', 'understand']);
      if (kind === 'fill') {
        const q = Chinese.poemFillQ(p);
        return { tag: '📖 语文 · 名句填空', q, run: (root, done) => this.runCn(q, root, done) };
      }
      if (kind === 'author') {
        const wrongs = shuffle(CN_AUTHORS.filter(a => a !== p.author)).slice(0, 3);
        const opts = shuffle([p.author, ...wrongs]);
        const q = { q: `《${p.title}》的作者是？`, opts, ans: opts.indexOf(p.author), tip: `《${p.title}》是${p.dynasty}代诗人${p.author}的作品。` };
        return { tag: '📖 语文 · 诗词', q, run: (root, done) => this.runCn(q, root, done) };
      }
      if (kind === 'understand') {
        const q = Object.assign({}, p.understand);
        return { tag: '📖 语文 · 诗意理解', q, run: (root, done) => this.runCn(q, root, done) };
      }
      const i = Math.floor(Math.random() * (p.lines.length - 1));
      const correctLine = p.lines[i + 1];
      const others = shuffle(CN_POEMS.filter(x => x.id !== p.id).map(x => x.lines[Math.min(i + 1, x.lines.length - 1)])).slice(0, 3);
      const opts = shuffle([correctLine, ...others]);
      const q = { q: `“${p.lines[i]}”的下一句是？`, opts, ans: opts.indexOf(correctLine), tip: `《${p.title}》全诗：${p.lines.join('，')}。` };
      return { tag: '📖 语文 · 诗词接下句', q, run: (root, done) => this.runCn(q, root, done) };
    }
    if (type === 'read') {
      const done = Store.state.chinese.reads || [];
      const pool = CN_READINGS.filter(r => done.includes(r.id));
      const p = this.pick(pool.length ? pool : CN_READINGS);
      const q = Object.assign({}, this.pick(p.qs));
      return { tag: '📖 语文 · 阅读理解', q, run: (root, done) => this.runCn(q, root, done) };
    }
    if (type === 'guwen') {
      const done = Store.state.chinese.guwen || [];
      const pool = CN_GUWEN.filter(g => done.includes(g.id));
      const p = this.pick(pool.length ? pool : CN_GUWEN);
      const q = Object.assign({}, this.pick(p.qs));
      return { tag: '📖 语文 · 小古文', q, run: (root, done) => this.runCn(q, root, done) };
    }
    const q = Object.assign({}, this.pick(Math.random() < 0.5 ? CN_IDIOMS : CN_TRAPS));
    return { tag: '📖 语文 · 词语实战', q, run: (root, done) => this.runCn(q, root, done) };
  },

  /* ---------- 科学/道法题：错题优先 ---------- */
  sciQuestion(def) {
    const wrong = Store.subjectWrong(def.id) || [];
    const all = def.units.flatMap(u => u.lessons.flatMap(l => l.qs));
    const q = wrong.length ? this.pick(wrong) : this.pick(all);
    return { tag: `${def.emoji} ${def.name}`, q, run: (root, done) => this.runSci(def, q, root, done) };
  },

  /* ---------- 初中知识题：学过的卡优先 ---------- */
  juniorQuestions(n) {
    const seen = Object.keys(Store.state.junior.seen || {}).filter(id => Store.state.junior.seen[id]);
    const ids = shuffle(seen.length ? seen : Object.keys(JUNIOR_QUIZ));
    const pool = [];
    ids.forEach(id => (JUNIOR_QUIZ[id] || []).forEach(q => pool.push(q)));
    return shuffle(pool).slice(0, n);
  },
  /* JUNIOR_QUIZ 的 opts[0] 是正确项，转成通用选择题格式 */
  jrToChoice(q) {
    const opts = shuffle(q.opts.slice());
    return { text: q.q, opts, ansIdx: opts.indexOf(q.opts[0]), tip: q.tip };
  },

  /* ---------- 各学科渲染 ---------- */
  /* 语文：复用 Chinese.ask（字块/手写切换、错题本都现成） */
  runCn(q, root, done) {
    Chinese.ask(q, 0, 2, done, this.hdr());
  },
  /* 科学道法：复用 SubjectUI.ask（choice/judge/cloze/steps 全支持） */
  runSci(def, q, root, done) {
    SubjectUI.ask(def, q, 0, 2, done, this.hdr());
  },
  /* 英语拼写：复用 Quest.renderSpelling，bossHook 接管流程（结果走 enResult 面板） */
  runEn(w, mode, root, done) {
    Quest.bossMode = true;
    Quest.bossHook = (ok, reward, reason) => this.enResult(w, ok, reward || 0, done, reason);
    const opts = mode === 'spellWrite' ? { write: true }
      : mode === 'clozeSpell' ? { hardMode: true, decoys: true, cloze: true }
        : { hardMode: true, decoys: true };
    Quest.renderSpelling(w, false, opts, this.hdr());
  },
  /* 英语拼写结果面板：和其他题型一个节奏——看完解释，点确定再走 */
  enResult(w, ok, reward, done, reason) {
    Quest.bossHook = null;
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.hdr());
    const failText = reason === 'write'
      ? '对照下上面的正确拼写，记住它 · 词已收进错题本'
      : '连错 2 次，这一题失守 · 正确拼写在上面，词已收进错题本';
    root.appendChild(h('div', { class: 'card drill-card center' },
      h('div', { style: 'font-size:40px' }, ok ? '✅' : '❌'),
      h('div', { class: 'mz-word' }, w.word),
      ipaEl(w),
      h('div', { class: 'intro-zh' }, w.zh),
      h('div', { class: 'tiny', style: 'margin-top:8px;line-height:1.7' },
        ok ? (reward ? `拼对了！复习奖励 +${reward} 🪙` : '拼对了！') : failText),
      h('button', {
        class: 'btn btn-main big cn-next', style: 'margin-top:12px',
        onclick: () => { Sound.tap(); done(ok); }
      }, '下一题 →')
    ));
  },
  /* 数学思维/初中知识：选择题 */
  runChoice(q, root, done) {
    root.innerHTML = '';
    root.appendChild(this.hdr());
    const optsEl = h('div', { class: 'cn-opts' });
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'margin-top:10px;min-height:20px;line-height:1.8;text-align:left' });
    const nextBtn = h('button', {
      class: 'btn btn-main big cn-next', style: 'display:none;margin-top:10px',
      onclick: () => { Sound.tap(); done(answeredOk); }
    }, '下一题 →');
    let answered = false, answeredOk = false;
    q.opts.forEach((t, i) => {
      optsEl.appendChild(h('button', {
        class: 'cn-opt', 'data-i': String(i),
        onclick: e => {
          if (answered) return;
          answered = true;
          answeredOk = i === q.ansIdx;
          if (answeredOk) {
            Sound.correct();
            e.currentTarget.classList.add('right');
            const c = centerOf(e.currentTarget);
            burst(c.x, c.y, { count: 8, colors: ['#58e08a', '#ffd166'], power: 50 });
          } else {
            Sound.wrong();
            e.currentTarget.classList.add('wrong');
            const right = Array.from(optsEl.children).find(x => x.dataset.i === String(q.ansIdx));
            if (right) right.classList.add('right');
          }
          Array.from(optsEl.children).forEach(b => { b.disabled = true; });
          tipEl.innerHTML = (answeredOk ? '✅ ' : '❌ ') + (q.tip || '');
          nextBtn.style.display = '';
        }
      }, t));
    });
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-text', style: 'text-align:left;white-space:pre-line' }, q.text),
      optsEl, tipEl, nextBtn
    ));
  },
  /* 数学思维：数字填空题 */
  runInput(q, root, done) {
    root.innerHTML = '';
    root.appendChild(this.hdr());
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'margin-top:10px;min-height:20px;line-height:1.8;text-align:left' });
    const nextBtn = h('button', {
      class: 'btn btn-main big cn-next', style: 'display:none;margin-top:10px',
      onclick: () => { Sound.tap(); done(answeredOk); }
    }, '下一题 →');
    const inputEl = h('div', { class: 'drill-input' }, '_');
    let val = '', answered = false, answeredOk = false;
    const refresh = () => {
      inputEl.textContent = val === '' ? '_' : val;
      inputEl.classList.toggle('filled', val !== '');
    };
    const submit = () => {
      if (answered || val === '') return;
      answered = true;
      answeredOk = parseInt(val, 10) === q.ans;
      if (answeredOk) Sound.correct(); else Sound.wrong();
      tipEl.innerHTML = (answeredOk ? '✅ ' : '❌ ') + (q.tip || '');
      nextBtn.style.display = '';
    };
    const key = d => {
      if (answered) return;
      Sound.tap();
      if (d === 'del') val = val.slice(0, -1);
      else if (d === 'ok') { submit(); return; }
      else if (val.length < 7) val += d;
      refresh();
    };
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-text', style: 'text-align:left;white-space:pre-line' }, q.text),
      inputEl,
      h('div', { class: 'drill-pad' },
        '1234567890'.split('').map(d => h('button', { class: 'drill-key', onclick: () => key(d) }, d)),
        h('button', { class: 'drill-key wide', onclick: () => key('del') }, '⌫'),
        h('button', { class: 'drill-key ok', onclick: () => key('ok') }, '✔')
      ),
      tipEl, nextBtn
    ));
  },
  runThink(q, root, done) {
    if (q.kind === 'input') this.runInput(q, root, done);
    else this.runChoice(q, root, done);
  },

  /* ---------- 流程 ---------- */
  hdr() {
    const tag = this.cur && this.cur.tag ? this.cur.tag : '';
    return h('div', {},
      h('div', { class: 'quest-top' },
        h('button', {
          class: 'quest-exit',
          onclick: () => confirmModal('退出大考？', '进度将不保存，确定退出吗？', () => this.abort())
        }, icon('x')),
        h('div', { class: 'quest-prog' }, `${this.free ? '🎯' : '👑'} 第 ${this.idx + 1} / ${this.total} 题 · 失误 ${this.wrong}`)
      ),
      tag ? h('div', { class: 'boss-tag' }, tag) : ''
    );
  },

  abort() {
    Sound.stopSpeak();
    Quest.bossHook = null;
    Quest.bossMode = false;
    showScreen('home');
    renderHome();
  },

  renderIntro() {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.stopSpeak(); showScreen('home'); renderHome(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, this.free ? '🎯 全科自由练' : '👑 BOSS 周挑战')
    ));
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, this.free ? '🎯' : '👑'),
      h('div', { class: 'splash-title' }, this.free ? '全科自由练 · 三科主科一起复习' : 'BOSS 周挑战 · 全科综合大考'),
      h('div', { class: 'splash-sub' }, '15 道题 · 英语拼写 / 语文 / 数学思维 / 科学道法 / 初中知识'),
      h('div', { class: 'intro-zh', style: 'margin-top:6px;line-height:1.7' }, this.free ? '主科任务全部完成后解锁：英语、语文、数学混在一起练，题多又全。答错的题会收进对应学科的错题本。可以反复玩，每次 +3 🪙。' :
        `选择和判断题答错就记 1 次失误，英语拼写连错 2 次算失守。\n失误 ≤1 击败 BOSS +${COIN_BOSS} 🪙 · ≤3 击伤 +10 🪙 · 奖励每周只发一次。\n答错的题会收进对应学科的错题本，正好知道哪里没学牢。`),
      h('button', { class: 'btn btn-main big', style: 'margin-top:12px', onclick: () => { Sound.tap(); this.begin(); } }, '开考 →')
    ));
  },

  begin() {
    Sound.stopSpeak();
    this.renderOne();
  },

  renderOne() {
    if (this.idx >= this.total) { this.finish(); return; }
    this.cur = this.plan[this.idx];
    const root = $('#quest-root');
    root.innerHTML = '';
    this.cur.run(root, ok => this.answer(ok));
  },

  answer(ok) {
    if (!ok) this.wrong++;
    this.idx++;
    if (this.idx >= this.total) { this.finish(); return; }
    this.renderOne();
  },

  /* ---------- 结算：规则与旧版 BOSS 一致 ---------- */
  finish() {
    Sound.stopSpeak();
    Quest.bossHook = null;
    Quest.bossMode = false;
    updateTop();
    const total = this.total;
    const score = Math.max(0, total - this.wrong);
    let icon = '💀', title = 'BOSS 挡住了这次进攻…', sub = '';
    if (this.free) {
      Store.addCoins(3);
      icon = '🎯'; title = '自由练完成！';
      sub = `成绩 ${score}/${total} · 全科混合 · 切磋奖励 +3 🪙`;
    } else if (this.wasDone) {
      Store.bossComplete(score, total, true);
      Store.addCoins(3);
      icon = '🤝'; title = '友谊赛完成！';
      sub = `成绩 ${score}/${total} · 本周的 BOSS 已被击败，切磋奖励 +3 🪙`;
    } else if (this.wrong <= 1) {
      Store.bossComplete(score, total, true);
      Store.addCoins(COIN_BOSS, { ignoreCap: true });
      Sound.gold();
      icon = '👑'; title = 'BOSS 被击败啦！';
      sub = `成绩 ${score}/${total} · 失误 ${this.wrong} · 通关奖励 +${COIN_BOSS} 🪙（本周只发这一次）`;
    } else if (this.wrong <= 3) {
      Store.bossComplete(score, total, false);
      const firstHurt = Store.bossHurtReward();
      if (firstHurt) Store.addCoins(10, { ignoreCap: true });
      else Store.addCoins(3);
      icon = '🛡️'; title = 'BOSS 残血逃跑了！';
      sub = `成绩 ${score}/${total} · 失误 ${this.wrong} · ` +
        (firstHurt ? '击伤奖励 +10 🪙（每周一次）' : '本周击伤奖已领过，切磋 +3 🪙') +
        ' · 今天可再战，或练练错题下周日复仇！';
    } else {
      Store.bossComplete(score, total, false);
      sub = `成绩 ${score}/${total} · 失误 ${this.wrong} · 答错的题已收进各科错题本，先去练一练再回来报仇！`;
    }
    Sound.coin();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, icon),
      h('div', { class: 'finish-title' }, title),
      h('div', { class: 'finish-sub' }, sub),
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.start(this.free); } }, '⚔️ 再战一次'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); showScreen('home'); renderHome(); } }, '返回空间站')
      )
    ));
    /* v37：BOSS 结算宠物表情——击败/击伤→cheer，战败→expect（鼓励不惩罚） */
    petSay(this.wrong <= 3 || this.free || this.wasDone ? 'cheer' : 'expect', 3200);
    const c = centerOf($('.finish-stamp'));
    burst(c.x, c.y, { count: 30, emojis: ['🎉', '⭐', '✨', '🚀', '💛'], power: 160 });
    renderHome();
  }
};
