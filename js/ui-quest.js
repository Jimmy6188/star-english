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

  /* 每周日 BOSS 挑战：10 道高阶大题，失误 ≤2 次算通关 */
  startBoss() {
    Sound.stopSpeak();
    const pool = Object.keys(Store.state.srs).filter(id => Store.state.srs[id].box >= 3 && Store.findWord(id));
    if (pool.length < 5) { toast('BOSS 挑战需要先掌握 5 个以上较熟的词，先去冒险吧！'); return; }
    this.freeMode = false;
    this.drillMode = false;
    this.bossMode = true;
    this.dictMode = false;
    this.bossWrong = 0;
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
    const sub = this.dictMode ? `${n} 个词 · 每词只有一次机会` : (this.bossMode ? `${n} 道高阶大题，失误 2 次以内通关` : (this.drillMode ? `${n} 个老对手等你击退` : (this.freeMode ? '5 个复习挑战' : `共 ${n} 个挑战关卡`)));
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

  /* 复习题型按熟练度（Leitner 盒子）分级，越熟越难；词组走词块排序 */
  pickReviewMode(item) {
    if (item.mode) return item.mode;
    const w = Store.findWord(item.id);
    const rec = Store.state.srs[item.id];
    const box = rec ? rec.box : 1;
    const isPhrase = !!(w && w.phrase);
    if (this.bossMode) {
      if (isPhrase) return box >= 3 ? (Math.random() < 0.6 ? 'orderHard' : 'order') : 'wordPick';
      if (box >= 4) return 'spellHard';
      if (box === 3) return Math.random() < 0.6 ? 'cloze' : 'spellDecoy';
      if (box === 2) return 'wordPick';
      return 'listen';
    }
    if (this.drillMode) return isPhrase ? 'order' : 'spell';
    if (isPhrase) {
      if (box >= 4) return 'orderHard';
      if (box >= 3) return 'order';
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
    else if (mode === 'spellDecoy') this.renderSpelling(w, false, { decoys: true });
    else if (mode === 'spell') this.renderSpelling(w, false);
    else if (mode === 'orderHard') this.renderWordOrder(w, { hardMode: true });
    else if (mode === 'order') this.renderWordOrder(w, {});
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
      buildSpeakPanel(w),
      h('button', {
        class: 'btn btn-main big',
        onclick: () => { Sound.tap(); w.phrase ? this.renderWordOrder(w, { isNew: true }) : this.renderSpelling(w, true); }
      }, w.phrase ? '进入组装舱 →' : '进入拼写舱 →')
    );
    root.appendChild(card);
    setTimeout(() => Sound.speak(w.word), 400);
  },

  /* ---------- 拼写挑战 ---------- */
  /* opts: hardMode=听写挑战(隐藏中文) decoys=混入干扰字母 */
  renderSpelling(w, isNew, opts = {}) {
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    const target = w.word.toLowerCase();
    let answer = [];
    let hints = 0, wrongs = 0;

    const slotsEl = h('div', { class: 'slots' });
    const tilesEl = h('div', { class: 'tiles' });
    const ghostEl = h('div', { class: 'ghost-word', style: 'visibility:hidden' }, target);

    const slotEls = [];
    for (let i = 0; i < target.length; i++) {
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
    }

    function refresh() {
      slotEls.forEach((s, i) => {
        s.textContent = answer[i] ? answer[i].ch : '';
        s.classList.toggle('filled', !!answer[i]);
      });
    }

    let letters = target.split('');
    if (opts.decoys && target.length >= 4) {
      const pool = 'abcdefghilmnoprstuw'.split('').filter(c => !target.includes(c));
      letters = letters.concat(shuffle(pool).slice(0, 2));
    }
    shuffle(letters).forEach(ch => {
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

    function doHint() {
      if (answer.length >= target.length) return;
      const needCh = target[answer.length];
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
      if (answer.length === target.length) setTimeout(check, 250);
    }

    const self = this;
    function check() {
      const guess = answer.map(a => a.ch).join('');
      if (guess === target) {
        self.success(w, isNew, hints, wrongs);
      } else {
        wrongs++;
        if (self.bossMode) self.bossWrong++;
        Store.addMistake();
        Sound.wrong();
        slotsEl.classList.add('shake');
        setTimeout(() => slotsEl.classList.remove('shake'), 450);
        answer = [];
        Array.from(tilesEl.children).forEach(t => t.classList.remove('used'));
        refresh();
        if (wrongs >= 2) ghostEl.style.visibility = 'visible';
      }
    }

    root.appendChild(h('div', { class: 'card spell-card' },
      h('div', { class: 'spell-prompt' },
        isNew ? '把新单词拼出来！' : (opts.hardMode ? '⚡ 听写挑战：听发音拼写' : '复习：拼出这个单词')),
      opts.hardMode ? '' : h('div', { class: 'spell-zh' }, w.zh),
      h('button', { class: 'speak-btn xl', onclick: () => Sound.speak(w.word) }, '🔊'),
      h('div', { class: 'tiny' }, opts.decoys ? '小心！字母块里有捣蛋鬼' : '听发音，从下面选出字母'),
      slotsEl,
      ghostEl,
      tilesEl,
      h('div', { class: 'row-gap center' },
        h('button', { class: 'btn', onclick: doHint }, '💡 提示一下 (-2🪙)')
      )
    ));
    setTimeout(() => Sound.speak(w.word), 350);
  },

  /* ---------- 词组排序挑战（词块组装） ---------- */
  /* opts: hardMode=听写挑战(隐藏中文) isNew=新词首次（计入图鉴与金币） */
  renderWordOrder(w, opts = {}) {
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    const target = w.word.toLowerCase();
    const chunks = w.word.split(' ');
    let answer = [];
    let hints = 0, wrongs = 0;

    const slotsEl = h('div', { class: 'slots chunk-slots' });
    const tilesEl = h('div', { class: 'tiles' });
    const ghostEl = h('div', { class: 'ghost-word', style: 'visibility:hidden' }, w.word);

    const slotEls = chunks.map(() => {
      const s = h('span', {
        class: 'slot chunk',
        onclick: () => {
          if (!answer.length) return;
          const last = answer.pop();
          last.tile.classList.remove('used');
          Sound.tap();
          refresh();
        }
      });
      slotsEl.appendChild(s);
      return s;
    });

    function refresh() {
      slotEls.forEach((s, i) => {
        s.textContent = answer[i] ? answer[i].ch : '';
        s.classList.toggle('filled', !!answer[i]);
      });
    }

    shuffle(chunks.slice()).forEach(ch => {
      const t = h('button', {
        class: 'tile chunk', onclick: () => {
          if (t.classList.contains('used') || answer.length >= chunks.length) return;
          t.classList.add('used');
          answer.push({ ch, tile: t });
          Sound.tap();
          refresh();
          if (answer.length === chunks.length) setTimeout(check, 250);
        }
      }, ch);
      tilesEl.appendChild(t);
    });

    function doHint() {
      if (answer.length >= chunks.length) return;
      const need = chunks[answer.length].toLowerCase();
      let tile = Array.from(tilesEl.children).find(t => !t.classList.contains('used') && t.textContent.toLowerCase() === need);
      while (!tile && answer.length) {
        const first = answer.shift();
        first.tile.classList.remove('used');
        tile = Array.from(tilesEl.children).find(t => !t.classList.contains('used') && t.textContent.toLowerCase() === need);
      }
      if (!tile) return;
      tile.classList.add('used');
      answer.push({ ch: tile.textContent, tile });
      hints++;
      Sound.tap();
      refresh();
      if (answer.length === chunks.length) setTimeout(check, 250);
    }

    const self = this;
    function check() {
      const guess = answer.map(a => a.ch.toLowerCase()).join(' ');
      if (guess === target) {
        self.success(w, !!opts.isNew, hints, wrongs);
      } else {
        wrongs++;
        if (self.bossMode) self.bossWrong++;
        Store.addMistake();
        Sound.wrong();
        slotsEl.classList.add('shake');
        setTimeout(() => slotsEl.classList.remove('shake'), 450);
        answer = [];
        Array.from(tilesEl.children).forEach(t => t.classList.remove('used'));
        refresh();
        if (wrongs >= 2) ghostEl.style.visibility = 'visible';
      }
    }

    root.appendChild(h('div', { class: 'card spell-card' },
      h('div', { class: 'spell-prompt' }, opts.hardMode ? '⚡ 听写挑战：按顺序排出词组' : '把词组排出来！'),
      opts.hardMode ? '' : h('div', { class: 'spell-zh' }, w.zh),
      h('button', { class: 'speak-btn xl', onclick: () => Sound.speak(w.word) }, '🔊'),
      h('div', { class: 'tiny' }, '按顺序点击下面的单词块'),
      slotsEl,
      ghostEl,
      tilesEl,
      h('div', { class: 'row-gap center' },
        h('button', { class: 'btn', onclick: doHint }, '💡 提示一下 (-2🪙)')
      )
    ));
    setTimeout(() => Sound.speak(w.word), 350);
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
      const total = this.items.length;
      const score = Math.max(0, total - this.bossWrong);
      const passed = this.bossWrong <= 2;
      Store.bossComplete(score, total, passed);
      if (passed) { Store.addCoins(COIN_BOSS); Sound.gold(); }
      icon = passed ? '👑' : '🛡️';
      title = passed ? 'BOSS 被击败啦！' : 'BOSS 没被击倒，再来一次！';
      sub = `成绩 ${score}/${total} · ` + (passed ? `通关奖励 +${COIN_BOSS} 🪙（本周已通关）` : '失误超过 2 次没通关，回去练练再战！');
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
      h('button', { class: 'btn btn-main big', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
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

  function startRec() {
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
    closeMic();
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

  renderIdle();
  return wrap;
}
