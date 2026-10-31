/* ============================================================
 * 星际求知号 - BOSS 周挑战（综合大考）+ 全科自由练（共用组卷）
 * 基础卷 15 题：英语拼写 4 + 语文 3 + 数学思维 3 + 科学道法 3 + 初中知识 2
 * 出题铁律（v39）：只出已学内容——英语取掌握词、语文取已学诗词/读过的文章、
 * 科学道法取已学课时、初中知识取收下过的卡；某科还没学就让卷子变短，绝不回退未学题库
 * ⚡ 拔高 3 题（v40，在基础卷之上追加）：拔高 ≠ 超纲——考"已学知识的变式与迁移"：
 *   英语=高熟练词的句子语境拼词 / 语文=已学诗的诗句排序 / 数学=两步生活应用题
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
    if (!this.plan.length) { toast('已学的内容还不够组卷，先去各学科探索一下吧！'); return; }
    this.total = this.plan.length; /* 只出已学内容：没开的学科少出几题，卷子按实际题数结算 */
    this.boostTotal = this.plan.filter(p => p.boost).length; /* ⚡ 拔高题数（结算单列一行） */
    this.boostOk = 0;
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
    /* 带空题检测的入卷：题型还没学过（make 返回空）就直接放弃这一格，不硬凑未学内容 */
    const addRetryQ = (make, sigOf, times = 8) => {
      for (let t = 0; t < times; t++) {
        const item = make();
        if (!item) return;
        if (add(item, sigOf(item))) return;
      }
    };
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
    /* 语文 3 题：诗词 / 阅读或古文 / 词语或诗词（没学过的题型整格跳过，不回退全库） */
    const poemOk = CN_POEMS.some(p => (Store.state.chinese.learned || {})[p.id] || Store.state.chinese.stars[p.id]);
    const cnKinds = ['read', 'guwen'].filter(k => (k === 'read' ? Store.state.chinese.reads : Store.state.chinese.guwen).length);
    if (poemOk) addRetryQ(() => this.cnQuestion('poem'), it => 'cn:' + qSig(it.q));
    if (cnKinds.length) addRetryQ(() => this.cnQuestion(this.pick(cnKinds)), it => 'cn:' + qSig(it.q));
    addRetryQ(() => this.cnQuestion(this.pick(['idiom'].concat(poemOk ? ['poem'] : []))), it => 'cn:' + qSig(it.q));
    /* 数学思维 3 题：随机三种题型，内容不重复 */
    shuffle(['genSeq', 'genClever', 'genCycle', 'genJitu', 'gen24']).slice(0, 3)
      .forEach(g => addRetry(() => {
        const q = MathThink[g]();
        return { tag: '🧠 数学 · 思维挑战', q, run: (root, done) => this.runThink(q, root, done) };
      }, it => 'math:' + qSig(it.q)));
    /* 科学道法 3 题：只从已学课时出题，两科各 1 道（错题优先）+ 任意 1 道，题不重复 */
    const defs = SubjectUI.defs.filter(d => this.sciPool(d).length);
    if (defs.length) {
      const first = this.pick(defs);
      const second = defs.find(d => d.id !== first.id) || first;
      addRetryQ(() => this.sciQuestion(first), it => 'sci:' + qSig(it.q));
      addRetryQ(() => this.sciQuestion(second), it => 'sci:' + qSig(it.q));
      addRetryQ(() => this.sciQuestion(this.pick(defs)), it => 'sci:' + qSig(it.q));
    }
    /* 初中知识 2 题：只出收下过的知识卡，题不重复 */
    this.juniorQuestions(4).slice(0, 2).forEach(q => add({
      tag: '🌟 初中星知识', q,
      run: (root, done) => this.runChoice(this.jrToChoice(q), root, done)
    }, 'jr:' + qSig(q)));
    /* ⚡ 拔高 3 题（v40）：不超纲，考已学知识的变式与迁移
     * 1) 英语：box≥4 高熟练词的句子语境拼词（无中文，靠例句猜词；不够熟词就跳过） */
    const boostWords = Object.keys(Store.state.srs).filter(id => {
      const w = Store.findWord(id);
      return Store.state.srs[id].box >= 4 && w && !used.has('en:' + w.word.toLowerCase());
    });
    if (boostWords.length) {
      const bw = Store.findWord(this.pick(boostWords));
      const bmode = !bw.phrase && Quest.canClozeSpell(bw) ? 'clozeSpell' : 'spellHard';
      add({ tag: '⚡ 英语 · 拔高拼句', boost: true, w: bw,
        run: (root, done) => this.runEn(bw, bmode, root, done) }, 'ben:' + bw.word.toLowerCase());
    }
    /* 2) 语文：已学诗的诗句排序（考全诗结构记忆，一错即计失误但可排完） */
    addRetryQ(() => this.cnOrderQ(), it => 'cnord:' + it.sig);
    /* 3) 数学：两步生活应用题（与应用题专项共用出题器），数字键盘作答 */
    addRetryQ(() => {
      const app = MathDrill.genApp2();
      const q = { kind: 'input', text: app.text, ans: app.ans, tip: app.tip };
      return { tag: '⚡ 数学 · 拔高应用', boost: true, q, run: (root, done) => this.runThink(q, root, done) };
    }, it => 'mapp:' + qSig(it.q));
    return shuffle(plan);
  },

  /* ---------- 语文题（只出已学：没学过的题型返回 null，由组卷跳过） ---------- */
  cnQuestion(type) {
    if (type === 'poem') {
      const learned = CN_POEMS.filter(p => (Store.state.chinese.learned || {})[p.id] || Store.state.chinese.stars[p.id]);
      if (!learned.length) return null; /* 诗词还没学过就不出，不再回退全库 */
      const p = this.pick(learned);
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
      if (!pool.length) return null; /* 还没读过短文就不出，不再回退全库 */
      const p = this.pick(pool);
      const q = Object.assign({}, this.pick(p.qs));
      return { tag: '📖 语文 · 阅读理解', q, run: (root, done) => this.runCn(q, root, done) };
    }
    if (type === 'guwen') {
      const done = Store.state.chinese.guwen || [];
      const pool = CN_GUWEN.filter(g => done.includes(g.id));
      if (!pool.length) return null; /* 还没读过小古文就不出，不再回退全库 */
      const p = this.pick(pool);
      const q = Object.assign({}, this.pick(p.qs));
      return { tag: '📖 语文 · 小古文', q, run: (root, done) => this.runCn(q, root, done) };
    }
    const q = Object.assign({}, this.pick(Math.random() < 0.5 ? CN_IDIOMS : CN_TRAPS));
    return { tag: '📖 语文 · 词语实战', q, run: (root, done) => this.runCn(q, root, done) };
  },

  /* ⚡ 语文拔高：诗句排序——从已学诗抽一首，句子打乱按原顺序点回（考全诗结构记忆） */
  cnOrderQ() {
    const learned = CN_POEMS.filter(p => (Store.state.chinese.learned || {})[p.id] || Store.state.chinese.stars[p.id]);
    if (!learned.length) return null;
    const p = this.pick(learned);
    if (p.lines.length < 3) return null;
    return {
      tag: '⚡ 语文 · 诗句排序', boost: true, sig: 'ord:' + p.id,
      title: `把《${p.title}》的诗句按原顺序排回来`,
      lines: p.lines.slice(),
      tip: `《${p.title}》全诗：${p.lines.join('，')}。`
    };
  },
  /* 诗句排序交互：复用科学实验步骤的样式；点错计 1 次失误但仍可排完再走 */
  runOrder(q, root, done) {
    root.innerHTML = '';
    root.appendChild(this.hdr());
    let nextIdx = 0, bad = false, finished = false;
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'margin-top:10px;min-height:20px;line-height:1.8;text-align:left' });
    const nextBtn = h('button', {
      class: 'btn btn-main big cn-next', style: 'display:none;margin-top:10px',
      onclick: () => { Sound.tap(); done(!bad); }
    }, '下一题 →');
    const area = h('div', { class: 'steps-area' });
    shuffle(q.lines.map((t, i) => ({ t, i }))).forEach(b => {
      const no = h('span', { class: 'step-no' }, '?');
      const blk = h('button', {
        class: 'step-block', onclick: () => {
          if (finished || blk.classList.contains('locked')) return;
          if (b.i === nextIdx) {
            no.textContent = nextIdx + 1;
            blk.classList.add('locked');
            Sound.tap();
            nextIdx++;
            if (nextIdx >= q.lines.length) {
              finished = true;
              Sound.correct();
              tipEl.innerHTML = (bad ? '✅ 排完了（中途点错过一次）· ' : '✅ 完美复原！') + q.tip;
              nextBtn.style.display = '';
            }
          } else {
            bad = true;
            Sound.wrong();
            blk.classList.add('shake');
            setTimeout(() => blk.classList.remove('shake'), 500);
            tipEl.innerHTML = '⚠️ 这句不在下一位——先想想哪句在前（已记 1 次失误，还能继续排完）';
          }
        }
      }, no, b.t);
      area.appendChild(blk);
    });
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, '⚡ 诗句排序 · 拔高'),
      h('div', { class: 'drill-text' }, q.title),
      h('div', { class: 'tiny', style: 'margin-bottom:2px' }, '按诗的原顺序，依次点击下面的诗句：'),
      area, tipEl, nextBtn
    ));
  },

  /* 该学科已学课时的题目池（闯过课才有记录，没学过的课不出题） */
  sciPool(def) {
    const done = (Store.state.subjects[def.id] || {}).done || {};
    return def.units.flatMap(u => u.lessons.flatMap(l => l.qs)).filter(q => done[q.lesson]);
  },

  /* ---------- 科学/道法题：错题优先，只出已学课时 ---------- */
  sciQuestion(def) {
    const learnedQs = this.sciPool(def);
    if (!learnedQs.length) return null;
    const done = (Store.state.subjects[def.id] || {}).done || {};
    const wrong = (Store.subjectWrong(def.id) || []).filter(q => done[q.lesson]);
    const q = wrong.length ? this.pick(wrong) : this.pick(learnedQs);
    return { tag: `${def.emoji} ${def.name}`, q, run: (root, done) => this.runSci(def, q, root, done) };
  },

  /* ---------- 初中知识题：只出收下过的知识卡 ---------- */
  juniorQuestions(n) {
    const seen = Object.keys(Store.state.junior.seen || {}).filter(id => Store.state.junior.seen[id]);
    if (!seen.length) return []; /* 一张卡都没收下过就不出，不再回退全库 */
    const pool = [];
    shuffle(seen).forEach(id => (JUNIOR_QUIZ[id] || []).forEach(q => pool.push(q)));
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
      h('div', { class: 'splash-sub' }, `${this.plan.length} 道题 · 英语拼写 / 语文 / 数学思维 / 科学道法 / 初中知识`),
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
    if (ok && this.cur && this.cur.boost) this.boostOk++;
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
      this.boostTotal ? h('div', { class: 'tiny', style: 'margin-top:6px' },
        `⚡ 拔高题答对 ${this.boostOk} / ${this.boostTotal}${this.boostOk === this.boostTotal ? ' · 变式题也难不倒你！' : ' · 拔高题都是学过的知识换了个考法，再来试试'}`) : '',
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
