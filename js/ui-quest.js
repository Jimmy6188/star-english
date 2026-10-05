/* ============================================================
 * 星际求知号 - 任务流引擎
 * 新词学习 → 拼写闯关（字母块） → 传送奖励动画
 * 复习按熟练度分级出题：听音选图 / 看图选词 / 句子填空 /
 * 拼写（高阶混入干扰字母）/ 听写挑战（隐藏中文）
 * 错词挑战：针对错题本的专项击破
 * ============================================================ */

const Quest = {
  items: [], idx: 0, startedTs: 0, freeMode: false, drillMode: false, bossMode: false, bossWrong: 0, warnedLimit: false,

  qroot() { return $('#quest-root'); },

  start(free) {
    Sound.stopSpeak();
    this.freeMode = !!free;
    this.drillMode = false;
    this.bossMode = false;
    this.dictMode = false;
    this.dictResults = [];
    this.bossWrong = 0;
    this.bossWasDone = false;
    const s = Store.state;
    if (!free) {
      const newCap = Math.max(0, s.settings.dailyNew - s.today.newDone);
      const revCap = Math.max(0, s.settings.dailyReview - s.today.revDone);
      const nq = Store.newPool(newCap).map(id => ({ id, kind: 'new' }));
      const rq = shuffle(Store.dueList().slice(0, revCap)).map(id => ({ id, kind: 'review' }));
      const items = [];
      while (nq.length || rq.length) {
        if (rq.length) items.push(rq.shift());
        if (rq.length) items.push(rq.shift());
        if (nq.length) items.push(nq.shift());
      }
      if (!items.length) { toast('今天没有新词，也没有待复习的词，明天再来！'); return; }
      this.items = items;
    } else {
      const learned = Object.keys(Store.state.srs).filter(id => Store.findWord(id));
      if (learned.length < 4) { toast('先学几个新词，再来自由练习吧'); return; }
      this.items = shuffle(learned).slice(0, 5).map(id => ({ id, kind: 'review' }));
    }
    this.idx = 0;
    this.startedTs = Date.now();
    this.warnedLimit = false;
    showScreen('quest');
    this.splash();
  },

  /* 错词挑战：专打错题本里的老对手 */
  startDrill() {
    Sound.stopSpeak();
    const weak = Store.weakList(5);
    if (!weak.length) { toast('现在没有老对手，先去学新词吧！'); return; }
    this.freeMode = false;
    this.drillMode = true;
    this.bossMode = false;
    this.dictMode = false;
    this.bossWrong = 0;
    this.items = weak.map(id => ({ id, kind: 'review' }));
    this.idx = 0;
    this.startedTs = Date.now();
    this.warnedLimit = false;
    showScreen('quest');
    this.splash();
  },

  /* 每周日 BOSS 挑战：10 道纯拼写高阶题，失误 ≤1 击败 / ≤3 击伤 / 更多则战败
   * 战败词自动进错题本，当天可无限次再战（奖励每周只发一次） */
  startBoss() {
    Sound.stopSpeak();
    const pool = Object.keys(Store.state.srs).filter(id => Store.state.srs[id].box >= 3 && Store.findWord(id));
    if (pool.length < 5) { toast('BOSS 挑战需要先掌握 5 个以上较熟的词，先去冒险吧！'); return; }
    this.freeMode = false;
    this.drillMode = false;
    this.bossMode = true;
    this.dictMode = false;
    this.bossWrong = 0;
    this.bossWasDone = Store.bossInfo().done; // 本周已通关 → 本次是友谊赛
    this.items = shuffle(pool).slice(0, 10).map(id => ({ id, kind: 'review' }));
    this.idx = 0;
    this.startedTs = Date.now();
    this.warnedLimit = false;
    showScreen('quest');
    this.splash();
  },

  /* 听写小测验：家长发起，每词一次机会，错词自动进错题本 */
  startDictation() {
    Sound.stopSpeak();
    const learned = Object.keys(Store.state.srs).filter(id => Store.findWord(id));
    if (learned.length < 5) { toast('至少学会 5 个词才能听写哦'); return; }
    this.freeMode = false;
    this.drillMode = false;
    this.bossMode = false;
    this.dictMode = true;
    this.dictResults = [];
    this.items = shuffle(learned).slice(0, 10).map(id => ({ id, kind: 'review' }));
    this.idx = 0;
    this.startedTs = Date.now();
    this.warnedLimit = false;
    showScreen('quest');
    this.splash();
  },

  dictNext() {
    if (this.idx >= this.items.length) { this.finish(); return; }
    const item = this.items[this.idx];
    const w = Store.findWord(item.id);
    if (!w) { this.idx++; this.dictNext(); return; }
    this.renderDictation(w);
  },

  /* ---------- 听写题 ---------- */
  renderDictation(w) {
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    const target = w.word.toLowerCase();
    let answer = [];
    const self = this;

    const slotsEl = h('div', { class: 'slots' });
    const tilesEl = h('div', { class: 'tiles' });
    const slotEls = [];
    for (let i = 0; i < target.length; i++) {
      const sl = h('span', {
        class: 'slot', onclick: () => {
          if (!answer.length) return;
          const last = answer.pop();
          last.tile.classList.remove('used');
          Sound.tap();
          refresh();
        }
      });
      slotEls.push(sl);
      slotsEl.appendChild(sl);
    }
    function refresh() {
      slotEls.forEach((sl, i) => {
        sl.textContent = answer[i] ? answer[i].ch : '';
        sl.classList.toggle('filled', !!answer[i]);
      });
    }
    shuffle(target.split('')).forEach(ch => {
      const t = h('button', {
        class: 'tile', onclick: () => {
          if (t.classList.contains('used') || answer.length >= target.length) return;
          t.classList.add('used');
          answer.push({ ch, tile: t });
          Sound.tap();
          refresh();
          if (answer.length === target.length) setTimeout(check, 250);
        }
      }, ch);
      tilesEl.appendChild(t);
    });

    function check() {
      const ok = answer.map(a => a.ch).join('') === target;
      Store.reviewWord(target, ok);
      if (!ok) Store.addMistake();
      self.dictResults.push({ word: w.word, zh: w.zh, ok });
      if (ok) Store.addCoins(3);
      root.innerHTML = '';
      root.appendChild(self.progressHeader());
      root.appendChild(h('div', { class: 'card spell-card center' },
        h('div', { class: 'intro-emoji', style: ok ? '' : 'filter:grayscale(1) opacity(.55)' }, w.emoji),
        h('div', { class: 'mz-word' }, w.word),
        h('div', { class: 'intro-zh' }, w.zh),
        h('div', { class: 'tiny', style: 'margin-top:8px' }, ok ? '✅ 拼对了！ +3 🪙' : '这是正确拼写，已收进错题本')
      ));
      if (ok) Sound.correct(); else Sound.wrong();
      setTimeout(() => { self.idx++; self.dictNext(); }, ok ? 1400 : 2400);
    }

    root.appendChild(h('div', { class: 'card spell-card' },
      h('div', { class: 'spell-prompt' }, `📝 听写第 ${this.idx + 1} 题（共 ${this.items.length} 题）`),
      h('div', { class: 'spell-zh' }, w.zh),
      h('button', { class: 'speak-btn xl', onclick: () => Sound.speak(w.word) }, '🔊'),
      h('div', { class: 'tiny' }, '听发音看中文拼单词 · 只有一次机会！'),
      slotsEl,
      tilesEl
    ));
    setTimeout(() => Sound.speak(w.word), 350);
  },

  splash() {
    const n = this.items.length;
    this.qroot().innerHTML = '';
    const icon = this.dictMode ? '📝' : (this.bossMode ? '👑' : (this.drillMode ? '⚡' : '🚀'));
    const title = this.dictMode ? '听写小测验' : (this.bossMode ? 'BOSS 周挑战！' : (this.drillMode ? '错词来袭！' : (this.freeMode ? '自由练习起飞！' : '今日冒险开始！')));
    const sub = this.dictMode ? `${n} 个词 · 每词只有一次机会` : (this.bossMode ? `${n} 道纯拼写高阶题 · 失误 ≤1 击败 · ≤3 击伤` : (this.drillMode ? `${n} 个老对手等你击退` : (this.freeMode ? '5 个复习挑战' : `共 ${n} 个挑战关卡`)));
    this.qroot().appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, icon),
      h('div', { class: 'splash-title' }, title),
      h('div', { class: 'splash-sub' }, sub),
      h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); this.next(); } }, '出发 →')
    ));
  },

  checkLimit() {
    if (this.freeMode || this.drillMode || this.bossMode || this.warnedLimit) return;
    const min = (Date.now() - this.startedTs) / 60000;
    if (min > Store.state.settings.sessionLimitMin) {
      this.warnedLimit = true;
      toast(`${Store.state.pet.name} 快没电了，做完这关就休息一下吧 🔋`);
    }
  },

  /* 复习题型按熟练度（Leitner 盒子）分级，越熟越难；词组同样走全字母拼写 */
  pickReviewMode(item) {
    if (item.mode) return item.mode;
    const w = Store.findWord(item.id);
    const rec = Store.state.srs[item.id];
    const box = rec ? rec.box : 1;
    const isPhrase = !!(w && w.phrase);
    if (this.bossMode) {
      /* BOSS 只考主动输出：单词=听写拼写 或 句子填空拼写（无中文、无选项）；词组=全字母拼写 */
      return !isPhrase && Math.random() < 0.4 && this.canClozeSpell(w) ? 'clozeSpell' : 'spellHard';
    }
    if (this.drillMode) return 'spell';
    if (isPhrase) {
      if (box >= 4) return 'spellHard';
      if (box === 3) return 'spell';
      if (box === 2) return Math.random() < 0.6 ? 'wordPick' : 'listen';
      return 'listen';
    }
    if (box >= 4) return 'spellHard';
    if (box === 3) return Math.random() < 0.5 ? 'cloze' : 'spellDecoy';
    if (box === 2) return Math.random() < 0.6 ? 'wordPick' : 'listen';
    return 'listen';
  },

  next() {
    this.checkLimit();
    if (this.idx >= this.items.length) { this.finish(); return; }
    const item = this.items[this.idx];
    const w = Store.findWord(item.id);
    if (!w) { this.idx++; this.next(); return; }
    if (item.kind === 'new') { this.renderIntro(w); return; }
    if (this.dictMode) { this.renderDictation(w); return; }
    const mode = this.pickReviewMode(item);
    item.mode = mode;
    if (mode === 'spellHard') this.renderSpelling(w, false, { hardMode: true, decoys: true });
    else if (mode === 'clozeSpell') this.renderSpelling(w, false, { hardMode: true, decoys: true, cloze: true });
    else if (mode === 'spellDecoy') this.renderSpelling(w, false, { decoys: true });
    else if (mode === 'spell') this.renderSpelling(w, false);
    else if (mode === 'cloze') this.renderCloze(w);
    else if (mode === 'wordPick') this.renderWordPick(w);
    else this.renderListening(w);
  },

  progressHeader() {
    return h('div', { class: 'quest-top' },
      h('button', {
        class: 'quest-exit', onclick: () => confirmModal('退出冒险？', this.dictMode ? '退出后本次听写作废，成绩不保存。' : '今天学的进度会保留，随时可以回来继续。', () => {
          this.addMinutes(); showScreen('home'); renderHome();
        })
      }, '✕'),
      h('div', { class: 'quest-prog' }, `${this.idx + 1} / ${this.items.length}`)
    );
  },

  addMinutes() {
    const min = Math.round((Date.now() - this.startedTs) / 60000);
    if (min > 0) Store.addMinutes(Math.min(60, min));
  },

  /* 取同星系的干扰项（不足时从全部词库补） */
  distractors(w, n = 3) {
    const pack = Store.allPacks().find(p => p.id === w.cat) || Store.allPacks()[0];
    const others = pack.words.filter(x => x.word.toLowerCase() !== w.word.toLowerCase());
    const pool = others.length >= n ? others : Store.allPacks().flatMap(p => p.words).filter(x => x.word.toLowerCase() !== w.word.toLowerCase());
    return shuffle(pool).slice(0, n);
  },

  /* 句子填空拼写：例句里必须出现该词（允许 s/es 变形）才可用 */
  clozeRe(w) {
    return new RegExp('\\b' + w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(s|es)?\\b', 'i');
  },
  canClozeSpell(w) {
    return !!w.ex && this.clozeRe(w).test(w.ex);
  },

  /* ---------- 新词学习卡 ---------- */
  renderIntro(w) {
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    const cur = Store.state.settings.grade;
    const badge = w.grade && w.grade !== cur
      ? h('div', { class: 'grade-badge ' + (w.grade < cur ? 'g-low' : 'g-high') }, gradeLabel(w))
      : '';
    const card = h('div', { class: 'card intro-card' },
      h('div', { class: 'intro-tag' }, '✨ 发现新单词'),
      badge,
      h('div', { class: 'intro-emoji' }, w.emoji),
      h('div', { class: 'intro-word-row' },
        h('span', { class: 'intro-word' + (w.phrase ? ' phrase' : '') }, w.word),
        h('button', { class: 'speak-btn big', onclick: () => Sound.speak(w.word) }, '🔊')
      ),
      h('div', { class: 'intro-zh' }, w.zh),
      h('div', { class: 'intro-ex' },
        h('button', { class: 'speak-btn', onclick: () => Sound.speak(w.ex) }, '🔊 '),
        h('span', {}, w.ex)
      ),
      h('div', { class: 'tiny intro-exzh' }, w.exZh),
      w.phrase ? '' : h('button', { class: 'btn small', style: 'margin:4px 0', onclick: () => Sound.speak(w.word.split('').join(', ') + '. ' + w.word, 0.7) }, '🔤 拼读一下（听每个字母）'),
      buildSpeakPanel(w),
      h('button', {
        class: 'btn btn-main big',
        onclick: () => { Sound.tap(); this.renderSpelling(w, true); }
      }, '进入拼写舱 →')
    );
    root.appendChild(card);
    setTimeout(() => Sound.speak(w.word), 400);
  },

  /* ---------- 拼写挑战 ----------
   * opts: hardMode=听写挑战(隐藏中文) decoys=混入干扰字母 cloze=句子填空拼写（BOSS 专用：给英文句子语境，不给中文）
   * BOSS 规则：不显示幽灵答案、不提供提示；同一题错 2 次即失守，词自动进错题本 */
  renderSpelling(w, isNew, opts = {}) {
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    const isPhrase = !!w.phrase;
    const target = w.word.toLowerCase();
    /* 词组也按字母拼：空格不进字母序列，槽位按单词分组、词间留空隙 */
    const seq = isPhrase ? target.replace(/ /g, '') : target;
    let answer = [];
    let hints = 0, wrongs = 0;

    /* 句子填空拼写（仅单词）：从例句挖出目标词，靠语境拼词 */
    const useCloze = !isPhrase && !!opts.cloze && this.canClozeSpell(w);
    let clozeBefore = '', clozeAfter = '', spokenText = w.word;
    if (useCloze) {
      const m = w.ex.match(this.clozeRe(w));
      clozeBefore = w.ex.slice(0, m.index);
      clozeAfter = w.ex.slice(m.index + m[0].length);
      spokenText = w.ex.replace(this.clozeRe(w), 'something');
    }

    const slotsEl = h('div', { class: 'slots' });
    const tilesEl = h('div', { class: 'tiles' });
    const ghostEl = h('div', { class: 'ghost-word', style: 'visibility:hidden' }, target);

    const slotEls = [];
    const mkSlot = () => {
      const s = h('span', {
        class: 'slot', onclick: () => {
          if (!answer.length) return;
          const last = answer.pop();
          last.tile.classList.remove('used');
          Sound.tap();
          refresh();
        }
      });
      slotEls.push(s);
      slotsEl.appendChild(s);
    };
    if (isPhrase) {
      target.split(' ').forEach((word, wi) => {
        if (wi > 0) slotsEl.appendChild(h('span', { class: 'slot-gap' }));
        for (let i = 0; i < word.length; i++) mkSlot();
      });
    } else {
      for (let i = 0; i < target.length; i++) mkSlot();
    }

    function refresh() {
      slotEls.forEach((s, i) => {
        s.textContent = answer[i] ? answer[i].ch : '';
        s.classList.toggle('filled', !!answer[i]);
      });
    }

    let letters = seq.split('');
    if (opts.decoys && seq.length >= 4) {
      const pool = 'abcdefghilmnoprstuw'.split('').filter(c => !seq.includes(c));
      letters = letters.concat(shuffle(pool).slice(0, 2));
    }
    shuffle(letters).forEach(ch => {
      const t = h('button', {
        class: 'tile', onclick: () => {
          if (t.classList.contains('used') || answer.length >= seq.length) return;
          t.classList.add('used');
          answer.push({ ch, tile: t });
          Sound.tap();
          Sound.speak(ch, 1.1); // 字母点读：放一个字母听一个字母音
          refresh();
          if (answer.length === seq.length) setTimeout(check, 250);
        }
      }, ch);
      tilesEl.appendChild(t);
    });

    function doHint() {
      if (answer.length >= seq.length) return;
      /* 提示直接花金币（复习和新词统一），金币不够时不可用 */
      if (!Store.spend(HINT_COST)) { toast('金币不够啦，提示需要 2 🪙'); return; }
      updateTop();
      const needCh = seq[answer.length];
      let tile = Array.from(tilesEl.children).find(t => !t.classList.contains('used') && t.textContent === needCh);
      while (!tile && answer.length) { // 需要的字母被误放在前面时，先释放最前面的字母
        const first = answer.shift();
        first.tile.classList.remove('used');
        tile = Array.from(tilesEl.children).find(t => !t.classList.contains('used') && t.textContent === needCh);
      }
      if (!tile) return;
      tile.classList.add('used');
      answer.push({ ch: needCh, tile });
      hints++;
      Sound.tap();
      refresh();
      if (answer.length === seq.length) setTimeout(check, 250);
    }

    const self = this;
    function check() {
      const guess = answer.map(a => a.ch).join('');
      if (guess === seq) {
        self.success(w, isNew, hints, wrongs);
      } else {
        wrongs++;
        if (self.bossMode) self.bossWrong++;
        Store.addMistake();
        Sound.wrong();
        /* 拼错一次后才亮出"拼读一下"，避免字母点读提前泄露答案 */
        if (spellBtn) spellBtn.style.display = '';
        if (self.bossMode && wrongs >= 2) {
          /* BOSS：本题失守，不亮答案硬扛；词记入错题本，看一眼正确拼写后继续 */
          Store.reviewWord(target, false);
          self.bossFail(w);
          return;
        }
        slotsEl.classList.add('shake');
        setTimeout(() => slotsEl.classList.remove('shake'), 450);
        answer = [];
        Array.from(tilesEl.children).forEach(t => t.classList.remove('used'));
        refresh();
        if (wrongs >= 2) ghostEl.style.visibility = 'visible';
      }
    }

    /* 新词刚在上一屏教过，拼读按钮直接可用；复习/听写挑战先藏起来，拼错后再出现 */
    const spellBtn = h('button', {
      class: 'btn', style: isNew ? '' : 'display:none',
      onclick: () => Sound.speak(w.word.split('').join(', ') + '. ' + w.word, 0.7)
    }, '🔤 拼读一下');

    root.appendChild(h('div', { class: 'card spell-card' },
      h('div', { class: 'spell-prompt' },
        useCloze ? '📖 读句子，把缺的词拼出来！'
          : (isNew ? (isPhrase ? '把词组的字母拼出来！' : '把新单词拼出来！')
            : (opts.hardMode ? '⚡ 听写挑战：听发音拼写' : (isPhrase ? '复习：拼出这个词组' : '复习：拼出这个单词')))),
      opts.hardMode ? '' : h('div', { class: 'spell-zh' }, w.zh),
      useCloze ? h('div', { class: 'cloze-line' }, clozeBefore, h('span', { class: 'cloze-blank' }, '＿＿＿＿'), clozeAfter) : '',
      h('button', { class: 'speak-btn xl', onclick: () => Sound.speak(spokenText) }, '🔊'),
      h('div', { class: 'tiny' },
        useCloze ? '🔊 可重听整句（缺的词会读成 something）· 不给中文，靠句子猜词'
          : (opts.decoys ? '小心！字母块里有捣蛋鬼' : (isPhrase ? '听发音，把词组的每个字母按顺序放好' : '听发音，从下面选出字母'))),
      slotsEl,
      ghostEl,
      tilesEl,
      this.bossMode ? '' : h('div', { class: 'row-gap center' },
        spellBtn,
        h('button', { class: 'btn', onclick: doHint }, '💡 提示一下 (-2🪙)')
      )
    ));
    setTimeout(() => Sound.speak(spokenText), 350);
  },

  /* BOSS 战败一题：亮出正确答案加深印象，随后自动进入下一题 */
  bossFail(w) {
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    root.appendChild(h('div', { class: 'card spell-card center' },
      h('div', { class: 'intro-emoji', style: 'filter:grayscale(1) opacity(.6)' }, w.emoji),
      h('div', { class: 'mz-word' }, w.word),
      h('div', { class: 'intro-zh' }, w.zh),
      h('div', { class: 'tiny', style: 'margin-top:8px' }, '💥 这一题失守！正确拼写记住了吗？词已收进错题本')
    ));
    setTimeout(() => { this.idx++; this.next(); }, 2000);
  },

  /* ---------- 听音选图 ---------- */
  renderListening(w) {
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    const opts = shuffle([w, ...this.distractors(w)]);
    let recordedWrong = false;
    const self = this;

    const grid = h('div', { class: 'listen-grid' });
    opts.forEach(o => {
      const oid = o.word.toLowerCase();
      grid.appendChild(h('button', {
        class: 'listen-opt', 'data-id': oid,
        onclick: e => {
          if (e.currentTarget.classList.contains('dead')) return;
          if (oid === w.word.toLowerCase()) {
            const reward = Store.reviewWord(w.word.toLowerCase(), true);
            Sound.correct();
            const c = centerOf(e.currentTarget);
            burst(c.x, c.y, { count: 10, emojis: ['✨', '⭐'], power: 60 });
            floatText(c.x, c.y - 20, `+${reward} 🪙`);
            Sound.speak(w.word);
            e.currentTarget.classList.add('right');
            setTimeout(() => { self.idx++; self.next(); }, 1000);
          } else {
            if (!recordedWrong) { recordedWrong = true; if (self.bossMode) self.bossWrong++; Store.reviewWord(w.word.toLowerCase(), false); }
            Sound.wrong();
            e.currentTarget.classList.add('dead');
          }
        }
      }, h('span', { class: 'listen-emoji' }, o.emoji)));
    });

    root.appendChild(h('div', { class: 'card listen-card' },
      h('div', { class: 'spell-prompt' }, '听！是哪个词？'),
      h('button', { class: 'speak-btn xl', onclick: () => Sound.speak(w.word) }, '🔊'),
      grid
    ));
    setTimeout(() => Sound.speak(w.word), 350);
  },

  /* ---------- 看图选词 ---------- */
  renderWordPick(w) {
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    const opts = shuffle([w, ...this.distractors(w)]);
    let recordedWrong = false;
    const self = this;

    const grid = h('div', { class: 'pick-grid' });
    opts.forEach(o => {
      const oid = o.word.toLowerCase();
      grid.appendChild(h('button', {
        class: 'pick-opt', 'data-id': oid,
        onclick: e => {
          if (e.currentTarget.classList.contains('dead')) return;
          if (oid === w.word.toLowerCase()) {
            const reward = Store.reviewWord(w.word.toLowerCase(), true);
            Sound.correct();
            const c = centerOf(e.currentTarget);
            burst(c.x, c.y, { count: 8, emojis: ['✨', '⭐'], power: 50 });
            floatText(c.x, c.y - 20, `+${reward} 🪙`);
            Sound.speak(w.word);
            e.currentTarget.classList.add('right');
            setTimeout(() => { self.idx++; self.next(); }, 1000);
          } else {
            if (!recordedWrong) { recordedWrong = true; if (self.bossMode) self.bossWrong++; Store.reviewWord(w.word.toLowerCase(), false); }
            Sound.wrong();
            e.currentTarget.classList.add('dead');
          }
        }
      }, o.word));
    });

    root.appendChild(h('div', { class: 'card listen-card' },
      h('div', { class: 'spell-prompt' }, '这个词怎么写？'),
      h('div', { class: 'pick-emoji' }, w.emoji),
      grid
    ));
  },

  /* ---------- 句子填空 ---------- */
  renderCloze(w) {
    const id = w.word.toLowerCase();
    const wordRe = new RegExp('\\b' + w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(s|es)?\\b', 'i');
    if (!w.ex || !wordRe.test(w.ex)) { this.renderWordPick(w); return; } // 例句不含原词则降级
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    const opts = shuffle([w, ...this.distractors(w)]);
    let recordedWrong = false;
    const self = this;

    const blankEl = h('span', { class: 'cloze-blank' }, '＿＿＿＿');
    const grid = h('div', { class: 'pick-grid' });
    opts.forEach(o => {
      const oid = o.word.toLowerCase();
      grid.appendChild(h('button', {
        class: 'pick-opt', 'data-id': oid,
        onclick: e => {
          if (e.currentTarget.classList.contains('dead')) return;
          if (oid === id) {
            const reward = Store.reviewWord(id, true);
            Sound.correct();
            blankEl.textContent = w.word;
            blankEl.classList.add('filled');
            const c = centerOf(e.currentTarget);
            burst(c.x, c.y, { count: 8, emojis: ['✨', '⭐'], power: 50 });
            floatText(c.x, c.y - 20, `+${reward} 🪙`);
            setTimeout(() => Sound.speak(w.ex), 250);
            e.currentTarget.classList.add('right');
            setTimeout(() => { self.idx++; self.next(); }, 1400);
          } else {
            if (!recordedWrong) { recordedWrong = true; if (self.bossMode) self.bossWrong++; Store.reviewWord(id, false); }
            Sound.wrong();
            e.currentTarget.classList.add('dead');
          }
        }
      }, o.word));
    });

    root.appendChild(h('div', { class: 'card listen-card' },
      h('div', { class: 'spell-prompt' }, '选词把句子补充完整'),
      (() => {
        const m = w.ex.match(wordRe);
        const before = w.ex.slice(0, m.index);
        const after = w.ex.slice(m.index + m[0].length);
        return h('div', { class: 'cloze-line' }, before, blankEl, after);
      })(),
      h('div', { class: 'cloze-zh' }, `提示：${w.zh}`),
      grid
    ));
  },

  /* ---------- 拼写成功 ---------- */
  success(w, isNew, hints, wrongs) {
    const root = this.qroot();
    root.innerHTML = '';
    let gold = false, reward = 0;

    if (isNew) {
      const r = Store.masterWord(w.word.toLowerCase(), hints, wrongs > 0);
      gold = r.gold; reward = r.reward;
      if (gold) Sound.gold(); else { Sound.teleport(); Sound.correct(); }
    } else {
      reward = Store.reviewWord(w.word.toLowerCase(), true);
      Sound.correct();
    }

    const overlay = h('div', { class: 'mz-overlay' });
    const ring = h('div', { class: 'mz-ring' });
    const emoji = h('div', { class: 'mz-emoji ' + (gold ? 'gold' : '') }, w.emoji);
    overlay.appendChild(ring);
    overlay.appendChild(emoji);
    overlay.appendChild(h('div', { class: 'mz-word ' + (gold ? 'gold-text' : '') }, w.word));
    const msg = isNew ? rnd(PRAISE_WORDS) + ' 新贴纸已收入图鉴！'
      : (this.drillMode ? '击败！连错清零，世界和平了' : '复习通过！');
    overlay.appendChild(h('div', { class: 'mz-msg' }, msg));
    if (gold) overlay.appendChild(h('div', { class: 'mz-gold-banner' }, '🌟 稀有 · 超新星贴纸！'));
    overlay.appendChild(h('div', { class: 'mz-coin' }, `+${reward} 🪙`));
    root.appendChild(overlay);

    setTimeout(() => {
      const c = centerOf(emoji);
      burst(c.x, c.y, {
        count: gold ? 30 : 16,
        emojis: gold ? ['🌟', '✨', '💫', '⭐'] : ['✨', '⭐'],
        power: gold ? 150 : 100
      });
      flyTo(emoji, '#nav-album .ni', w.emoji);
      floatText(c.x, c.y + 60, `+${reward} 🪙`, '#ffd166');
    }, 650);

    setTimeout(() => { this.idx++; this.next(); }, gold ? 2800 : 2100);
  },

  /* ---------- 完成 ---------- */
  finish() {
    this.addMinutes();
    updateTop(); // 结算页立刻同步顶栏金币
    if (!this.freeMode && !this.drillMode && !this.bossMode && !this.dictMode) {
      Store.markEnglishDone();
      Store.completeQuest();
      Sound.stamp();
    }
    let icon = '🚀', title = '今日任务完成！', sub = `已盖章！🔥 连续航行 ${Store.state.streak.count} 天 · 获得任务奖励 +${COIN_QUEST_BONUS} 🪙`;
    if (this.freeMode) {
      icon = '💪'; title = '练习完成！'; sub = '复习让记忆更牢固，明天见！';
    } else if (this.drillMode) {
      Store.addCoins(10);
      Store.markDrillDone();
      Sound.gold();
      icon = '⚡'; title = '老对手全部击退！'; sub = '错词都答对啦，连错清零 · 挑战奖励 +10 🪙';
    } else if (this.dictMode) {
      const total = this.dictResults.length;
      const correct = this.dictResults.filter(r => r.ok).length;
      Store.noteDictation(correct, total);
      icon = correct === total ? '💯' : '📝';
      title = `听写成绩 ${correct} / ${total}`;
      sub = correct === total ? '满分！太厉害了！🎉' : (correct >= Math.ceil(total * 0.8) ? '很棒！错词已收进错题本' : '错词已收进错题本，练一练再测一次！');
    } else if (this.bossMode) {
      /* 分级结算：≤1 击败 +50（每周一次）/ ≤3 击伤 +10 / 更多失败 0 币；友谊赛（本周已通关再战）+3 参与奖 */
      const total = this.items.length;
      const score = Math.max(0, total - this.bossWrong);
      if (this.bossWasDone) {
        Store.bossComplete(score, total, true);
        Store.addCoins(3); // 友谊赛参与奖，受每日上限约束
        icon = '🤝'; title = '友谊赛完成！';
        sub = `成绩 ${score}/${total} · 本周的 BOSS 已被击败，切磋奖励 +3 🪙`;
      } else if (this.bossWrong <= 1) {
        Store.bossComplete(score, total, true);
        Store.addCoins(COIN_BOSS, { ignoreCap: true }); // 周挑战是里程碑，不受每日上限影响
        Sound.gold();
        icon = '👑'; title = 'BOSS 被击败啦！';
        sub = `成绩 ${score}/${total} · 失误 ${this.bossWrong} · 通关奖励 +${COIN_BOSS} 🪙（本周只发这一次）`;
      } else if (this.bossWrong <= 3) {
        Store.bossComplete(score, total, false);
        const firstHurt = Store.bossHurtReward();
        if (firstHurt) Store.addCoins(10, { ignoreCap: true });
        else Store.addCoins(3);
        icon = '🛡️'; title = 'BOSS 残血逃跑了！';
        sub = `成绩 ${score}/${total} · 失误 ${this.bossWrong} · ` +
          (firstHurt ? '击伤奖励 +10 🪙（本周一次）' : '本周击伤奖已领过，切磋 +3 🪙') +
          ' · 今天可再战，或练练错题下周日复仇！';
      } else {
        Store.bossComplete(score, total, false);
        icon = '💀'; title = 'BOSS 挡住了这次进攻…';
        sub = `成绩 ${score}/${total} · 失误 ${this.bossWrong} · 答错的词已收进错题本，先去练一练再回来报仇！`;
      }
    }
    Sound.coin();
    const root = this.qroot();
    root.innerHTML = '';
    const card = h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, icon),
      h('div', { class: 'finish-title' }, title),
      h('div', { class: 'finish-sub' }, sub),
      this.dictMode ? h('div', { class: 'dict-report' },
        this.dictResults.map(r => h('div', { class: 'pack-row' },
          h('span', {}, `${r.word}`, h('span', { class: 'tiny' }, `　${r.zh}`)),
          h('span', {}, r.ok ? '✅' : '❌')
        ))) : '',
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      this.bossMode ? h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.startBoss(); } }, '⚔️ 再战一次'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
      ) : h('button', { class: 'btn btn-main big', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
    );
    root.appendChild(card);
    setTimeout(() => {
      const c = centerOf($('.finish-stamp'));
      burst(c.x, c.y, { count: 30, emojis: ['🎉', '⭐', '✨', '🚀', '💛'], power: 160 });
    }, 300);
  }
};


/* ============================================================
 * 跟读舱（方案A）：本地录音 → 与标准发音回放对比
 * 录音即录即弃，不上传不保存；每词首次"读得像"奖励 +3 金币
 * ============================================================ */
function buildSpeakPanel(w) {
  const id = w.word.toLowerCase();
  const wrap = h('div', { class: 'talk-panel' });
  let mediaStream = null, rec = null, chunks = [], mime = '', recUrl = null, timer = null, t0 = 0;

  function pickMime() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mp4;codecs=aac', 'audio/aac'];
    try {
      return types.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
    } catch (e) { return ''; }
  }

  async function openMic() {
    if (mediaStream) return true;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) return false;
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mime = pickMime();
      return true;
    } catch (e) { return false; }
  }

  function closeMic() {
    if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null; }
  }

  function renderIdle() {
    wrap.innerHTML = '';
    wrap.appendChild(h('button', { class: 'btn talk-btn', onclick: start }, '🎤 跟读试试'));
  }

  async function start() {
    Sound.tap();
    wrap.innerHTML = '';
    wrap.appendChild(h('div', { class: 'tiny center', style: 'padding:8px' }, '🎙 正在打开麦克风…'));
    const ok = await openMic();
    if (!ok) {
      wrap.innerHTML = '';
      wrap.appendChild(h('div', { class: 'tiny center', style: 'padding:8px;line-height:1.7' },
        '🎙 无法使用麦克风。请检查：浏览器是否允许本页使用麦克风；iPad 需在系统设置里允许；跟读功能需要 https 或 localhost 环境（网址收藏方式打开的本地文件不支持）。'));
      wrap.appendChild(h('button', { class: 'btn small', style: 'margin-top:6px', onclick: () => { renderIdle(); } }, '返回'));
      return;
    }
    renderReady();
  }

  function renderReady() {
    wrap.innerHTML = '';
    wrap.appendChild(h('div', { class: 'center' },
      h('button', { class: 'btn talk-rec-btn', onclick: startRec }, '🎤 开始'),
      h('div', { class: 'tiny', style: 'margin-top:6px' }, `点一下开始，大声读 "${w.word}"（最长 4 秒）`)
    ));
    wrap.appendChild(h('button', { class: 'btn small talk-collapse', onclick: () => { closeMic(); renderIdle(); } }, '收起'));
  }

  async function startRec() {
    if (!mediaStream) {
      const ok = await openMic();
      if (!ok) { renderRecorded(null); return; }
    }
    chunks = [];
    try {
      rec = new MediaRecorder(mediaStream, mime ? { mimeType: mime } : undefined);
    } catch (e) {
      try { rec = new MediaRecorder(mediaStream); } catch (e2) { renderRecorded(null); return; }
    }
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = onRecStop;
    rec.start();
    t0 = Date.now();
    wrap.innerHTML = '';
    const label = h('div', { class: 'rec-timer' }, '0.0s');
    timer = setInterval(() => {
      label.textContent = ((Date.now() - t0) / 1000).toFixed(1) + 's';
      if (Date.now() - t0 >= 4000) stopRec();
    }, 100);
    wrap.appendChild(h('div', { class: 'center' },
      h('button', { class: 'btn talk-rec-btn rec', onclick: stopRec }, '⏹ 停止'),
      label
    ));
  }

  function stopRec() {
    clearInterval(timer);
    try { if (rec && rec.state !== 'inactive') rec.stop(); }
    catch (e) { renderRecorded(null); }
  }

  function onRecStop() {
    let url = null;
    try {
      const blob = new Blob(chunks, { type: mime || 'audio/webm' });
      if (recUrl) URL.revokeObjectURL(recUrl);
      recUrl = URL.createObjectURL(blob);
      url = recUrl;
    } catch (e) { url = null; }
    renderRecorded(url);
  }

  function renderRecorded(url) {
    wrap.innerHTML = '';
    if (!url) {
      wrap.appendChild(h('div', { class: 'tiny center', style: 'padding:8px' }, '录音失败了，再试一次吧'));
      wrap.appendChild(h('button', { class: 'btn small', onclick: renderReady }, '重录'));
      return;
    }
    wrap.appendChild(h('div', { class: 'talk-compare' },
      h('button', { class: 'btn talk-play', onclick: () => Sound.speak(w.word) }, '🔊 听标准发音'),
      h('audio', { controls: '', src: url, class: 'talk-mine' })
    ));
    wrap.appendChild(h('div', { class: 'row-gap center', style: 'justify-content:center' },
      h('button', { class: 'btn small', onclick: renderReady }, '🔄 再录一次'),
      h('button', {
        class: 'btn small btn-on',
        onclick: e => {
          const r = Store.markSpoken(id);
          if (r.first) {
            Sound.coin();
            const c = centerOf(e.currentTarget);
            burst(c.x, c.y, { count: 8, emojis: ['🎤', '⭐'], power: 60 });
            floatText(c.x, c.y - 16, '+3 🪙');
          } else Sound.correct();
          e.currentTarget.textContent = r.first ? '👍 太棒了！+3 🪙' : '👍 读得像！';
          e.currentTarget.disabled = true;
        }
      }, '👍 读得像！')
    ));
  }

  /* 面板被移出页面（任务推进/退出）或离开任务屏时，释放麦克风 */
  const release = () => closeMic();
  document.addEventListener('talk-release', release);
  const mo = new MutationObserver(() => {
    if (!wrap.isConnected) {
      closeMic();
      document.removeEventListener('talk-release', release);
      mo.disconnect();
    }
  });
  requestAnimationFrame(() => {
    const rootEl = $('#quest-root');
    if (rootEl) mo.observe(rootEl, { childList: true });
    if (!wrap.isConnected) { closeMic(); document.removeEventListener('talk-release', release); mo.disconnect(); }
  });

  renderIdle();
  return wrap;
}
