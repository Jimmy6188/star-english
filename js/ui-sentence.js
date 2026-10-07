/* ============================================================
 * 星际求知号 - 英语句子默写（看中文 → 逐词拼出英文句子）
 * - 全键盘打字（默认字母顺序排列，可切电脑 QWERTY；也支持实体键盘）
 * - 单词逐个判定：拼对这个词才能进入下一个；拼错的词清空重试，不能跳过
 * - 第一个词确认后首字母自动变大写；句末标点自动补，不用手动输入
 * - 整句拼对后撒花并朗读整句（TTS）
 * - 每个词错 2 次后出现提示按钮（-2🪙 补一个正确字母，锁定的字母删不掉）
 * - 句中连错 2 次的词进"难词表"：之后抽句优先出含它的句子，及时复现
 * - 收益走 earnScaled 递减体系；默写进度记 Store.state.sentence.done
 * ============================================================ */

const SentWrite = {
  /* 电脑键盘排列：和实体键盘一致，适合已会打字的大孩子 */
  ROWS: [
    'qwertyuiop'.split(''),
    'asdfghjkl'.split('').concat(["'"]),
    ['\u21E7', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '\u232B'],
    ['\u2423 \u786E\u8BA4']
  ],
  /* 字母顺序排列：26 个字母按 ABC 排，低年级找字母最快（默认） */
  ABC_ROWS: [
    'abcdefghij'.split(''),
    'klmnopqrst'.split(''),
    ['\u21E7', 'u', 'v', 'w', 'x', 'y', 'z', "'", '\u232B'],
    ['\u2423 \u786E\u8BA4']
  ],
  RUN: 8,
  SHIFT: '\u21E7', DEL: '\u232B', OK: '\u2423 \u786E\u8BA4',

  keyRows() {
    return this.layout() === 'qwerty' ? this.ROWS : this.ABC_ROWS;
  },
  layout() {
    const l = Store.state.sentence && Store.state.sentence.layout;
    return l === 'qwerty' ? 'qwerty' : 'abc';
  },

  start() {
    Sound.stopSpeak();
    this.list = this.pickRun();
    this.idx = 0;
    this.perfectCnt = 0;   // 一遍过（无拼错）的句子数
    this.fixedCnt = 0;    // 拼错过但最终改对的词数
    showScreen('quest');
    this.renderIntro();
  },

  /* 抽一轮句子：优先没默写过的，其中再优先出含"难词表"单词的句子，按难度由易到难 */
  pickRun() {
    const st = Store.state.sentence || {};
    const done = st.done || [];
    const hard = new Set(Object.keys(st.hard || {}));
    const isFresh = s => !done.includes(s.id);
    const hasHard = s => s.en.toLowerCase().replace(/[^a-z' ]/g, ' ').split(' ')
      .some(w => hard.has(w));
    const fresh = SENTENCE_BANK.filter(isFresh);
    /* 难词优先：最多带 3 句含难词的新句子，做到"错过的词过一会又见到" */
    let pool;
    if (fresh.length >= this.RUN) {
      const boost = shuffle(fresh.filter(hasHard)).slice(0, 3);
      const rest = shuffle(fresh.filter(s => !boost.includes(s))).slice(0, this.RUN - boost.length);
      pool = boost.concat(rest);
    } else {
      pool = shuffle(SENTENCE_BANK).slice(0, this.RUN);
    }
    return pool.sort((a, b) => a.lv - b.lv);
  },

  cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); },

  /* 'The cat is black.' → { words:['the','cat','is','black'], punct:'.' } */
  parse(sent) {
    const m = sent.match(/^(.*?)([.!?])$/);
    return {
      words: (m ? m[1] : sent).toLowerCase().split(' '),
      punct: m ? m[2] : '.'
    };
  },

  exitBtn(prog) {
    return h('div', { class: 'quest-top' },
      h('button', {
        class: 'quest-exit',
        onclick: () => { Sound.stopSpeak(); this.leave(); showScreen('home'); renderHome(); }
      }, '\u2715'),
      h('div', { class: 'quest-prog' }, prog)
    );
  },

  renderIntro() {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.exitBtn('\u2318\uFE0F 句子默写'));
    /* 键盘排列切换：默认字母序（低年级照字母表找字母更快），可切电脑 QWERTY */
    const lay = this.layout();
    const mkLay = (l, label, desc) => h('button', {
      class: 'btn small' + (lay === l ? ' btn-on' : ''),
      style: 'flex-direction:column;line-height:1.35;padding:8px 10px',
      onclick: () => {
        Sound.tap();
        Store.setSentenceLayout(l);
        toast(l === 'abc' ? '键盘换成字母顺序了' : '键盘换成电脑排列了');
        this.renderIntro();
      }
    }, h('span', {}, label), h('span', { class: 'tiny' }, desc));
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, '\u2318\uFE0F'),
      h('div', { class: 'splash-title' }, '英语句子默写'),
      h('div', { class: 'splash-sub' }, `${this.list.length} 句 · 看中文拼英文 · 由易到难 · 拼错不能跳过`),
      h('div', { class: 'intro-zh', style: 'margin-top:6px;line-height:1.7' },
        '\u{1F4A1} 一个词一个词地拼：拼对这个词才能到下一个词，拼错会清空重试。\n' +
        '句首大写和句末标点都会自动变好，你只管敲字母。\n' +
        '连错 2 次的词会记进难词表，之后还会再遇到它，直到拼熟。'),
      h('div', { class: 'sw-tools', style: 'margin:10px 0 2px' },
        mkLay('abc', '\u{1F524} 字母顺序', '按 ABC 排，好找字母'),
        mkLay('qwerty', '\u2328\uFE0F 电脑排列', '和真键盘一致')),
      h('button', {
        class: 'btn btn-main big', style: 'margin-top:12px',
        onclick: () => { Sound.tap(); this.idx = 0; this.renderSentence(); }
      }, '开始默写 \u2192')
    ));
  },

  renderSentence() {
    if (this.idx >= this.list.length) { this.finish(); return; }
    const sent = this.list[this.idx];
    const { words, punct } = this.parse(sent.en);
    this.cur = sent;
    this.words = words;
    this.punct = punct;
    this.caps = (sent.caps || []).map(x => x.toLowerCase()); // 句中需保持大写的词（English / I）
    this.wi = 0;                        // 当前拼第几个词
    this.typed = [];                    // 当前词已敲入的字母
    this.locked = [];                   // 提示锁定的字母（删不掉）
    this.wrongs = words.map(() => 0);   // 每个词拼错次数
    this.hardMarked = new Set();        // 本句已记入难词表的词（避免重复计数）
    this.doneW = words.map(() => false);
    this.shown = words.map(() => '');
    this.shift = false;
    this.resultShown = false;

    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.exitBtn(`\u53E5 ${this.idx + 1} / ${this.list.length}`));

    /* ---- 中文提示 + 每个词一组字母格（句末标点自动补） ---- */
    const wordsEl = h('div', { class: 'sw-words' });
    const wordEls = words.map((w, i) => {
      const cells = w.split('').map(() => h('span', { class: 'sw-cell' }));
      const el = h('div', { class: 'sw-word' }, cells);
      wordsEl.appendChild(el);
      return el;
    });
    wordsEl.appendChild(h('span', { class: 'sw-punct' }, punct));
    this.wordEls = wordEls;

    /* ---- 工具栏：听发音 / 提示 ---- */
    const hearBtn = h('button', {
      class: 'btn small',
      onclick: () => { Sound.tap(); Sound.speak(this.words[this.wi], 0.8); }
    }, '\u{1F50A} 听这个词');
    const hintBtn = h('button', {
      class: 'btn small', style: 'display:none',
      onclick: () => this.hint()
    }, `\u{1F4A1} 提示一下 (-${HINT_COST}\u{1FA99})`);
    this.hintBtn = hintBtn;

    /* ---- 全键盘 ---- */
    const kb = h('div', { class: 'kb' });
    this.keyEls = {};
    const mkKey = (label, cls, fn) => {
      const b = h('button', { class: 'kb-key ' + (cls || ''), onclick: fn }, label);
      if (this.keyEls[label] === undefined) this.keyEls[label] = b;
      return b;
    };
    this.keyRows().forEach(row => {
      const rowEl = h('div', { class: 'kb-row' });
      row.forEach(k => {
        if (k === this.SHIFT) rowEl.appendChild(mkKey(k, 'fn', () => this.toggleShift()));
        else if (k === this.DEL) rowEl.appendChild(mkKey(k, 'fn', () => { Sound.tap(); this.backspace(); }));
        else if (k === this.OK) rowEl.appendChild(mkKey(k, 'ok wide', () => { Sound.tap(); this.confirmWord(); }));
        else rowEl.appendChild(mkKey(k, '', () => this.pressKey(k)));
      });
      kb.appendChild(rowEl);
    });
    /* ---- 拼对后的结果区（先藏起来） ---- */
    const result = h('div', { class: 'sw-result', style: 'display:none' });
    this.resultEl = result;
    const fullEn = h('div', { class: 'sw-en' }, '');
    const hearAllBtn = h('button', {
      class: 'btn', style: 'margin-top:8px',
      onclick: () => { Sound.tap(); Sound.speak(this.fullText(), 0.8); }
    }, '\u{1F50A} 再听一遍');
    const nextBtn = h('button', {
      class: 'btn btn-main big', style: 'margin-top:8px',
      onclick: () => { Sound.tap(); this.idx++; this.renderSentence(); }
    }, '');
    this.nextBtn = nextBtn;
    result.appendChild(fullEn);
    result.appendChild(h('div', { class: 'tiny', style: 'margin-top:4px' }, this.cur.zh));
    result.appendChild(h('div', { class: 'row-gap center', style: 'margin-top:8px' }, hearAllBtn, nextBtn));

    const card = h('div', { class: 'card spell-card' },
      h('div', { class: 'sw-zh' }, this.cur.zh),
      wordsEl,
      h('div', { class: 'sw-tools' }, hearBtn, hintBtn),
      kb,
      result
    );
    root.appendChild(card);

    this.paint();
    this.setActive(0);
    this.bindKey();
    setTimeout(() => Sound.speak(this.words[0], 0.8), 350); // 先听第一个词热身
  },

  /* ---------- 键盘 ---------- */
  pressKey(k) {
    if (this.resultShown) return;
    Sound.tap();
    const ch = this.shift ? k.toUpperCase() : k;
    this.shift = false;
    this.paintKeys();
    this.type(ch);
  },
  toggleShift() {
    if (this.resultShown) return;
    this.shift = !this.shift;
    Sound.tap();
    this.paintKeys();
  },
  paintKeys() {
    if (this.keyEls[this.SHIFT]) this.keyEls[this.SHIFT].classList.toggle('on', this.shift);
    'abcdefghijklmnopqrstuvwxyz'.split('').forEach(k => {
      const b = this.keyEls[k];
      if (b) b.textContent = this.shift ? k.toUpperCase() : k;
    });
  },
  type(ch) {
    const w = this.words[this.wi];
    if (!w || this.typed.length >= w.length) return;
    this.typed.push(ch);
    this.paintCurrent();
  },
  backspace() {
    if (this.resultShown) return;
    const last = this.typed.length - 1;
    if (last < 0) return;
    if (last < this.locked.length) return; // 提示锁定的字母删不掉
    this.typed.pop();
    this.paintCurrent();
  },
  confirmWord() {
    if (this.resultShown) return;
    const i = this.wi, w = this.words[i];
    const guess = this.typed.join('').toLowerCase();
    if (guess === w) {
      /* 拼对：第一个词和句中固定大写的词自动大写，锁定为绿色 */
      Sound.correct();
      this.doneW[i] = true;
      let txt = this.typed.join('');
      if (i === 0 || this.caps.includes(w)) txt = this.cap(txt);
      this.shown[i] = txt;
      if (this.wrongs[i] > 0) this.fixedCnt++;
      this.wi++;
      this.typed = [];
      this.locked = [];
      this.shift = false;
      this.paintKeys();
      if (this.wi >= this.words.length) { this.sentenceDone(); return; }
      this.paint();
      this.setActive(this.wi);
      setTimeout(() => Sound.speak(this.words[this.wi], 0.8), 250);
    } else {
      /* 拼错：清掉未锁定的输入，必须重试，不能跳到下一个词 */
      this.wrongs[i]++;
      Sound.wrong();
      const el = this.wordEls[i];
      el.classList.add('bad');
      setTimeout(() => el.classList.remove('bad'), 450);
      this.typed = this.locked.slice();
      this.paintCurrent();
      if (this.wrongs[i] >= 2) {
        /* 同一个词在同一句里连错 2 次：进难词表，之后优先复现（每题只记一次） */
        if (!this.hardMarked.has(w)) {
          this.hardMarked.add(w);
          Store.bumpSentenceHard([w]);
        }
        if (this.hintBtn) {
          this.hintBtn.style.display = '';
          toast('连错 2 次啦，点「提示」补一个字母吧');
        }
      }
    }
  },
  hint() {
    if (this.resultShown) return;
    if (!Store.spend(HINT_COST)) { toast('金币不够啦，提示需要 2 \u{1FA99}'); return; }
    updateTop();
    const w = this.words[this.wi];
    if (!w || this.typed.length >= w.length) return;
    const ch = w[this.typed.length];
    this.typed.push(ch);
    this.locked.push(ch);
    Sound.tap();
    this.paintCurrent();
  },

  /* ---------- 渲染 ---------- */
  paint() {
    this.wordEls.forEach((el, i) => {
      el.classList.toggle('active', i === this.wi && !this.doneW[i]);
      el.classList.toggle('done', this.doneW[i]);
      const cells = el.querySelectorAll('.sw-cell');
      const text = this.doneW[i] ? this.shown[i] : (i === this.wi ? this.typed.join('') : '');
      cells.forEach((c, j) => { c.textContent = text[j] || ''; });
    });
    if (this.hintBtn) this.hintBtn.style.display = this.wrongs[this.wi] >= 2 ? '' : 'none';
  },
  paintCurrent() { this.paint(); },
  setActive(wi) {
    this.wordEls.forEach((el, i) => el.classList.toggle('active', i === wi && !this.doneW[i]));
    if (wi > 0) {
      const el = this.wordEls[wi];
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  },
  fullText() {
    return this.words.map((w, i) => {
      const s = (i === 0 || this.caps.includes(w)) ? this.cap(w) : w;
      return this.doneW && this.doneW[i] ? (this.shown[i] || s) : s;
    }).join(' ') + this.punct;
  },

  /* ---------- 整句完成 ---------- */
  sentenceDone() {
    this.resultShown = true;
    this.wordEls.forEach(el => el.classList.remove('active'));
    if (this.wrongs.every(x => x === 0)) this.perfectCnt++;
    Store.markSentence(this.cur.id);
    Sound.gold();
    const c = centerOf($('.sw-words'));
    burst(c.x, c.y, { count: 26, emojis: ['\u2B50', '\u2728', '\u{1F389}'], power: 150 });
    /* 亮出整句英文，并朗读 */
    this.resultEl.querySelector('.sw-en').textContent = this.fullText();
    this.nextBtn.textContent = (this.idx + 1 >= this.list.length) ? '看成绩 \u2192' : '下一句 \u2192';
    this.resultEl.style.display = '';
    setTimeout(() => Sound.speak(this.fullText(), 0.78), 350);
  },

  /* ---------- 实体键盘支持 ---------- */
  bindKey() {
    this.unbindKey();
    this._onKey = e => {
      if (this.resultShown) return;
      const k = e.key;
      if (k === 'Backspace') { e.preventDefault(); this.backspace(); return; }
      if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
        this.confirmWord();
        return;
      }
      if (/^[a-zA-Z']$/.test(k)) {
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') document.activeElement.blur();
        this.shift = e.shiftKey;
        this.pressKey(k.toLowerCase());
      }
    };
    window.addEventListener('keydown', this._onKey);
  },
  unbindKey() {
    if (this._onKey) window.removeEventListener('keydown', this._onKey);
    this._onKey = null;
  },
  leave() { this.unbindKey(); },

  /* ---------- 结算 ---------- */
  finish() {
    this.unbindKey();
    updateTop();
    const perfect = this.perfectCnt;
    const total = this.list.length;
    const allOk = perfect === total;
    const gain = Store.earnScaled('sentence', perfect * 4 + (allOk ? 5 : 0));
    Store.bumpSentenceRun(perfect);
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.exitBtn('\u2318\uFE0F 句子默写'));
    root.appendChild(h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, allOk ? '\u{1F3C6}' : '\u2318\uFE0F'),
      h('div', { class: 'finish-title' }, `一遍拼对 ${perfect} / ${total} 句`),
      h('div', { class: 'finish-sub' },
        `获得 +${gain} \u{1FA99} · 拼错又改对的词 ${this.fixedCnt} 个${(Store.state.today.mint.sentence || 0) > 1 ? '（今日重刷，奖励减半）' : ''}`),
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.start(); } }, '再来一组'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); this.leave(); showScreen('home'); renderHome(); } }, '返回空间站')
      )
    ));
    if (allOk) {
      const c = centerOf($('.finish-stamp'));
      burst(c.x, c.y, { count: 30, emojis: ['\u{1F3C6}', '\u2B50', '\u{1F389}'], power: 160 });
    }
  }
};
