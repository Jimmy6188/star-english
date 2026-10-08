/* ============================================================
 * 星际求知号 - 英语句子默写（看中文 → 逐词拼出英文句子）
 * - 全键盘打字（默认字母顺序排列，可切电脑 QWERTY；也支持实体键盘）
 * - 单词逐个判定：拼对这个词才能进入下一个；拼错的词清空重试，不能跳过
 * - 第一个词确认后首字母自动变大写；句末标点自动补，不用手动输入
 * - 发音按需播放：出题和切词都不自动读，点「🔊 听这个词」才读；整句拼对后朗读整句
 * - 求助三件套（v32）：🔤 看音标 -1🪙 / ✨ 直接帮我拼 -5🪙（补全并锁定）/ ⭐ 收进生词本
 * - 每个词错 2 次后出现提示按钮（-2🪙 补一个正确字母，锁定的字母删不掉）
 * - 句中连错 2 次的词进"难词表"和"生词本"：之后抽句优先出含它的句子，及时复现
 * - 生词本：求助过/手动收进的词在这里复习，拼对 2 次算掌握自动移出
 * - 整句拼对后展示"句子结构卡"（主谓宾等成分，默认折叠）
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
  IPA_COST: 1,      // 看音标费用
  RESCUE_COST: 5,   // "直接帮我拼"费用（补全剩余字母并锁定）
  /* 虚词表：自动收录生词本时跳过（孩子不会卡在 the/is 上）；手动收录仍可加 */
  FUNC_WORDS: new Set(['a', 'an', 'the', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'my', 'your', 'his', 'her', 'its', 'me', 'us', 'him', 'them', 'this', 'that',
    'these', 'those', 'is', 'am', 'are', 'be', 'been', 'do', 'does', 'did', 'can',
    'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'have',
    'has', 'had', 'of', 'at', 'in', 'on', 'to', 'for', 'with', 'by', 'from',
    'about', 'into', 'out', 'up', 'down', 'and', 'or', 'but', 'if', 'so', 'too',
    'very', 'much', 'many', 'some', 'any', 'every', 'no', 'not', "don't"]),
  /* 句子成分 → 配色编号（和 CSS .role-N 对应） */
  ROLE_IDX: { '主语': 0, '谓语': 1, '宾语': 2, '表语': 3, '状语': 4, '补语': 5, '疑问词': 6, '感叹': 7, '语气': 8 },

  keyRows() {
    return this.layout() === 'qwerty' ? this.ROWS : this.ABC_ROWS;
  },
  layout() {
    const l = Store.state.sentence && Store.state.sentence.layout;
    return l === 'qwerty' ? 'qwerty' : 'abc';
  },
  swIpa(w) { return (typeof IPA_DICT !== 'undefined' && IPA_DICT[w]) || ''; },

  start() {
    Sound.stopSpeak();
    this.unbindKey();
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
    this.unbindKey();
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
    const newN = Store.sentenceNewList().length;
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, '\u2318\uFE0F'),
      h('div', { class: 'splash-title' }, '英语句子默写'),
      h('div', { class: 'splash-sub' }, `${this.list.length} 句 · 看中文拼英文 · 由易到难 · 拼错不能跳过`),
      h('div', { class: 'intro-zh', style: 'margin-top:6px;line-height:1.7' },
        '\u{1F4A1} 一个词一个词地拼：拼对这个词才能到下一个词，拼错会清空重试。\n' +
        '先自己想怎么造句——发音不会自动放出来，卡住了再点「\u{1F50A} 听这个词」。\n' +
        '点「❓ 求助」可以看音标（-1\u{1FA99}）、直接拼好这个词（-5\u{1FA99}），求助过的词会收进生词本。\n' +
        '拼对整句后还能点开「句子结构」，认识主谓宾。'),
      h('div', { class: 'row-gap', style: 'margin:10px 0 2px' },
        h('button', {
          class: 'btn', style: 'flex:1',
          onclick: () => { Sound.tap(); this.renderNewBook(); }
        }, `\u{1F4D2} 生词本${newN ? `（${newN}）` : ''}`)),
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
    this.ipaOn = false;                 // 当前词已解锁音标
    this.savedW = false;                // 当前词已收进生词本
    this.helpOpen = false;              // 求助面板展开中

    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.exitBtn(`\u53E5 ${this.idx + 1} / ${this.list.length}`));

    /* ---- 中文提示 + 音标行 + 每个词一组字母格（句末标点自动补） ---- */
    const ipaCap = h('div', { class: 'sw-ipa-cap' }, '');
    this.ipaCapEl = ipaCap;
    const wordsEl = h('div', { class: 'sw-words' });
    const wordEls = words.map((w, i) => {
      const cells = w.split('').map(() => h('span', { class: 'sw-cell' }));
      const el = h('div', { class: 'sw-word' }, cells);
      wordsEl.appendChild(el);
      return el;
    });
    wordsEl.appendChild(h('span', { class: 'sw-punct' }, punct));
    this.wordEls = wordEls;

    /* ---- 工具栏：听发音 / 提示 / 求助 ---- */
    const hearBtn = h('button', {
      class: 'btn small',
      onclick: () => { Sound.tap(); Sound.speak(this.words[this.wi], 0.8); }
    }, '\u{1F50A} 听这个词');
    const hintBtn = h('button', {
      class: 'btn small', style: 'display:none',
      onclick: () => this.hint()
    }, `\u{1F4A1} 提示一下 (-${HINT_COST}\u{1FA99})`);
    this.hintBtn = hintBtn;
    const helpBtn = h('button', {
      class: 'btn small',
      onclick: () => this.toggleHelp()
    }, '❓ 求助');
    this.helpBtn = helpBtn;

    /* ---- 求助面板（默认收起）：看音标 / 直接拼 / 收进生词本 ---- */
    const ipaBtn = h('button', { class: 'btn small', onclick: () => this.buyIpa() }, '');
    const rescueBtn = h('button', {
      class: 'btn small', onclick: () => this.rescue()
    }, `\u2728 直接帮我拼 (-${this.RESCUE_COST}\u{1FA99})`);
    const saveBtn = h('button', { class: 'btn small', onclick: () => this.saveWord() }, '\u2B50 收进生词本');
    this.ipaBtn = ipaBtn; this.rescueBtn = rescueBtn; this.saveBtn = saveBtn;
    const helpPanel = h('div', { class: 'sw-help', style: 'display:none' },
      ipaBtn, rescueBtn, saveBtn,
      h('div', { class: 'tiny', style: 'width:100%;margin-top:2px' }, '求助过的词会自动收进生词本，以后重点复习'));
    this.helpPanel = helpPanel;

    /* ---- 全键盘 ---- */
    const kbWrap = h('div', {});
    this.keyEls = this.mountKb(kbWrap, {
      press: k => this.pressKey(k),
      del: () => { Sound.tap(); this.backspace(); },
      ok: () => { Sound.tap(); this.confirmWord(); },
      shift: () => this.toggleShift()
    });
    /* ---- 拼对后的结果区（先藏起来） ---- */
    const result = h('div', { class: 'sw-result', style: 'display:none' });
    this.resultEl = result;
    const fullEn = h('div', { class: 'sw-en' }, '');
    /* 句子结构卡（默认折叠） */
    const gramWrap = h('div', { class: 'gram-wrap', style: 'display:none' });
    gramWrap.appendChild(this.gramChips(sent));
    gramWrap.appendChild(h('div', { class: 'gram-legend tiny' },
      '主语＝谁 / 什么 · 谓语＝做什么 / 怎么样 · 宾语＝动作的对象 · 表语＝是什么 / 在哪里\n' +
      '状语＝什么时候 / 在哪里 / 怎么样 · 补语＝补充说明宾语 · 疑问词＝问什么 · 感叹＝祝福 / 感叹 · 语气＝客气提问'));
    const gramBtn = h('button', {
      class: 'btn', style: 'margin-top:8px',
      onclick: () => {
        Sound.tap();
        const show = gramWrap.style.display === 'none';
        gramWrap.style.display = show ? '' : 'none';
        gramBtn.textContent = show ? '\u{1F513} 收起句子结构' : '\u{1F50D} 看句子结构（主谓宾）';
      }
    }, '\u{1F50D} 看句子结构（主谓宾）');
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
    result.appendChild(gramBtn);
    result.appendChild(gramWrap);
    result.appendChild(h('div', { class: 'tiny', style: 'margin-top:4px' }, this.cur.zh));
    result.appendChild(h('div', { class: 'row-gap center', style: 'margin-top:8px' }, hearAllBtn, nextBtn));

    const card = h('div', { class: 'card spell-card' },
      h('div', { class: 'sw-zh' }, this.cur.zh),
      ipaCap,
      wordsEl,
      h('div', { class: 'sw-tools' }, hearBtn, hintBtn, helpBtn),
      helpPanel,
      kbWrap,
      result
    );
    root.appendChild(card);

    this.paint();
    this.setActive(0);
    this.bindKey();
    /* 出题不自动发音：让孩子先自己想遣词造句，卡住了自己点「听这个词」 */
  },

  /* ---------- 键盘 ---------- */
  /* 构造全键盘（生词本练习也复用）；handlers={press,del,ok,shift}；noShift 时不放大写键 */
  mountKb(parent, handlers, noShift) {
    const kb = h('div', { class: 'kb' });
    const keyEls = {};
    const mkKey = (label, cls, fn) => {
      const b = h('button', { class: 'kb-key ' + (cls || ''), onclick: fn }, label);
      if (keyEls[label] === undefined) keyEls[label] = b;
      return b;
    };
    this.keyRows().forEach(row => {
      const rowEl = h('div', { class: 'kb-row' });
      row.forEach(k => {
        if (k === this.SHIFT) { if (!noShift) rowEl.appendChild(mkKey(k, 'fn', handlers.shift)); }
        else if (k === this.DEL) rowEl.appendChild(mkKey(k, 'fn', handlers.del));
        else if (k === this.OK) rowEl.appendChild(mkKey(k, 'ok wide', handlers.ok));
        else rowEl.appendChild(mkKey(k, '', () => handlers.press(k)));
      });
      kb.appendChild(rowEl);
    });
    parent.appendChild(kb);
    return keyEls;
  },
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
      this.ipaOn = false;   // 音标按词解锁：下一个词重新付费
      this.savedW = false;  // 生词本收录状态也按词重置
      this.paintKeys();
      if (this.wi >= this.words.length) { this.sentenceDone(); return; }
      this.paint();
      this.setActive(this.wi);
      /* 切词不自动读发音：让孩子接着想下一个词，需要时自己点「听这个词」 */
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
        /* 同一个词在同一句里连错 2 次：进难词表+生词本，之后优先复现（每题只记一次） */
        if (!this.hardMarked.has(w)) {
          this.hardMarked.add(w);
          Store.bumpSentenceHard([w]);
          if (!this.FUNC_WORDS.has(w)) Store.sentenceNewAdd(w, this.cur.id);
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

  /* ---------- 求助三件套（v32） ---------- */
  toggleHelp(force) {
    const show = force !== undefined ? force : !this.helpOpen;
    this.helpOpen = show;
    if (this.helpPanel) this.helpPanel.style.display = show ? '' : 'none';
    if (this.helpBtn) this.helpBtn.classList.toggle('btn-on', show);
    this.paint(); /* 收起时也要重绘：音标行/按钮状态靠这里刷新 */
  },
  buyIpa() {
    if (this.resultShown) return;
    const w = this.words[this.wi];
    const ipa = this.swIpa(w);
    if (!ipa) { toast('这个词暂时没有音标'); return; }
    if (this.ipaOn) return;
    if (!Store.spend(this.IPA_COST)) { toast('金币不够啦，音标需要 1 \u{1FA99}'); return; }
    this.ipaOn = true;
    updateTop();
    Sound.tap();
    this.toggleHelp(false);
  },
  rescue() {
    if (this.resultShown) return;
    const w = this.words[this.wi];
    if (!w || this.typed.length >= w.length) return;
    if (!Store.spend(this.RESCUE_COST)) { toast(`金币不够啦，直接拼需要 ${this.RESCUE_COST} \u{1FA99}`); return; }
    while (this.typed.length < w.length) {
      const ch = w[this.typed.length];
      this.typed.push(ch);
      this.locked.push(ch);
    }
    updateTop();
    Sound.tap();
    const saved = this.autoSaveWord(w);
    this.toggleHelp(false);
    toast(saved ? '已经帮你拼好了，点「确认」过关；这个词收进了生词本'
      : '已经帮你拼好了，点「确认」过关');
  },
  /* 自动收生词本：虚词不收（孩子不会卡在 the/is 上）；返回是否收进 */
  autoSaveWord(w) {
    if (!w || this.FUNC_WORDS.has(w)) return false;
    if (Store.sentenceNewList().some(x => x.word === w)) { this.savedW = true; return true; }
    Store.sentenceNewAdd(w, this.cur.id);
    this.savedW = true;
    return true;
  },
  saveWord() {
    if (this.resultShown) return;
    const w = this.words[this.wi];
    if (!w) return;
    Store.sentenceNewAdd(w, this.cur.id);
    this.savedW = true;
    Sound.tap();
    this.toggleHelp(false);
    toast(`「${w}」已收进生词本`);
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
    /* 音标行：花钱解锁后才显示当前词的音标 */
    if (this.ipaCapEl) {
      const w = this.words[this.wi];
      this.ipaCapEl.textContent = (this.ipaOn && w) ? '/' + this.swIpa(w) + '/' : '';
    }
    /* 求助面板按钮状态 */
    if (this.helpPanel) {
      const w = this.words[this.wi];
      const ipa = this.swIpa(w);
      if (this.ipaOn) {
        this.ipaBtn.textContent = `\u{1F524} /${ipa}/ \u5DF2\u89E3\u9501`;
        this.ipaBtn.disabled = true;
        this.ipaBtn.classList.add('btn-on');
      } else if (ipa) {
        this.ipaBtn.textContent = `\u{1F524} 看音标 (-${this.IPA_COST}\u{1FA99})`;
        this.ipaBtn.disabled = false;
        this.ipaBtn.classList.remove('btn-on');
      } else {
        this.ipaBtn.textContent = '\u{1F524} 音标暂缺';
        this.ipaBtn.disabled = true;
        this.ipaBtn.classList.remove('btn-on');
      }
      if (this.savedW || Store.sentenceNewList().some(x => x.word === w)) {
        this.saveBtn.textContent = '\u2B50 已在生词本';
        this.saveBtn.disabled = true;
      } else {
        this.saveBtn.textContent = '\u2B50 收进生词本';
        this.saveBtn.disabled = false;
      }
      this.rescueBtn.textContent = `\u2728 直接帮我拼 (-${this.RESCUE_COST}\u{1FA99})`;
    }
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

  /* ---------- 句子结构卡 ---------- */
  gramChips(sent) {
    const chips = h('div', { class: 'gram-chips' });
    (sent.gram || []).forEach(seg => {
      const parts = seg.split('|');
      const txt = parts[0];
      const roleFull = parts[1] || '';
      const role = roleFull.split('\u00B7')[0];
      const omit = txt.startsWith('(');
      chips.appendChild(h('span', {
        class: 'gram-chip role-' + (this.ROLE_IDX[role] != null ? this.ROLE_IDX[role] : 0) + (omit ? ' omit' : '')
      },
        h('span', { class: 'gram-t' }, txt),
        h('span', { class: 'gram-r' }, roleFull)
      ));
    });
    return chips;
  },

  /* ---------- 整句完成 ---------- */
  sentenceDone() {
    this.resultShown = true;
    this.wordEls.forEach(el => el.classList.remove('active'));
    this.paint(); /* 最后一个词也要画成"已拼对"的绿色，并清掉音标行 */
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

  /* ---------- 生词本（v32） ---------- */
  renderNewBook() {
    this.unbindKey();
    Sound.stopSpeak();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.exitBtn('\u{1F4D2} 生词本'));
    const list = Store.sentenceNewList();
    const card = h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, '\u{1F4D2} 英语生词本',
        h('span', { class: 'level-badge' }, `${list.length} 个词`)));
    if (!list.length) {
      card.appendChild(h('div', { class: 'intro-zh', style: 'margin-top:8px;line-height:1.7' },
        '还没有生词。\n默写时卡住了求个助，或者点「\u2B50 收进生词本」，词就会来到这里。\n在这里拼对 2 次，这个词就算学会啦。'));
    } else {
      card.appendChild(h('div', { class: 'tiny', style: 'margin:6px 0 2px' },
        '求助过和连错的词都在这里 · 拼对 2 次算学会，自动移出本子'));
      card.appendChild(h('button', {
        class: 'btn btn-main big', style: 'margin:8px 0 4px',
        onclick: () => { Sound.tap(); this.startBookDrill(); }
      }, '\u270D\uFE0F 开始练习 \u2192'));
      list.forEach(rec => {
        const ipa = this.swIpa(rec.word);
        const fromSent = rec.from ? SENTENCE_BANK.find(s => s.id === rec.from) : null;
        const gloss = rec.zh || (fromSent ? fromSent.zh : '');
        card.appendChild(h('div', { class: 'pack-row nb-row' },
          h('span', { class: 'pack-info' },
            h('span', { class: 'nb-word' }, rec.word),
            ipa ? h('span', { class: 'tiny' }, `　/${ipa}/`) : '',
            h('span', { class: 'tiny' }, `　${gloss}${rec.ok ? ` · 已拼对 ${rec.ok} 次` : ''}`)),
          h('span', { class: 'row-gap' },
            h('button', { class: 'speak-btn', onclick: () => { Sound.tap(); Sound.speak(rec.word); } }, '\u{1F50A}'),
            h('button', {
              class: 'btn small',
              onclick: () => { Sound.tap(); Store.sentenceNewRemove(rec.word); toast('已移出生词本'); this.renderNewBook(); }
            }, '\u2715'))
        ));
      });
    }
    card.appendChild(h('div', { class: 'row-gap', style: 'margin-top:10px' },
      h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.start(); } }, '\u2190 回默写首页'),
      h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); this.leave(); showScreen('home'); renderHome(); } }, '返回空间站')));
    root.appendChild(card);
  },

  /* 生词练习：一个词一个词地拼，提示免费；拼对 2 次算掌握 */
  startBookDrill() {
    const list = Store.sentenceNewList();
    if (!list.length) { toast('生词本空空的，先去默写吧'); return; }
    Sound.stopSpeak();
    this.book = list;
    this.bookIdx = 0;
    this.bookMastered = 0;
    showScreen('quest');
    this.renderBookWord();
  },

  renderBookWord() {
    if (this.bookIdx >= this.book.length) { this.finishBook(); return; }
    const rec = this.book[this.bookIdx];
    this.bWord = rec.word;
    this.bTyped = [];
    this.bLocked = [];
    this.bWrongs = 0;
    this.bDone = false;
    const fromSent = rec.from ? SENTENCE_BANK.find(s => s.id === rec.from) : null;
    const gloss = rec.zh ? `意思：${rec.zh}` : (fromSent ? `原句：${fromSent.zh}` : '看提示拼一拼');

    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.exitBtn(`\u{1F4D2} 生词练习 ${this.bookIdx + 1} / ${this.book.length}`));

    const cells = rec.word.split('').map(() => h('span', { class: 'sw-cell' }));
    const wordEl = h('div', { class: 'sw-word active' }, cells);
    this.bCells = cells;
    this.bWordEl = wordEl;

    const nextBtn = h('button', {
      class: 'btn btn-main big', style: 'margin-top:10px;display:none',
      onclick: () => { Sound.tap(); this.bookIdx++; this.renderBookWord(); }
    }, this.bookIdx + 1 >= this.book.length ? '看成绩 \u2192' : '下一个 \u2192');
    this.bNextBtn = nextBtn;
    const tipEl = h('div', { class: 'tiny', style: 'margin-top:8px;min-height:20px' }, '');

    const kbWrap = h('div', {});
    this.bKeyEls = this.mountKb(kbWrap, {
      press: k => this.bookPress(k),
      del: () => { Sound.tap(); this.bookDel(); },
      ok: () => { Sound.tap(); this.bookOk(); },
      shift: () => {}
    }, true);

    root.appendChild(h('div', { class: 'card spell-card' },
      h('div', { class: 'sw-zh' }, gloss),
      h('div', { class: 'sw-words' }, wordEl),
      h('div', { class: 'sw-tools' },
        h('button', { class: 'btn small', onclick: () => { Sound.tap(); Sound.speak(rec.word, 0.8); } }, '\u{1F50A} 听发音'),
        h('button', { class: 'btn small', onclick: () => this.bookHint() }, '\u{1F4A1} 提示一个字母（免费）')),
      kbWrap,
      tipEl,
      nextBtn
    ));
    this.bTipEl = tipEl;
  },

  bookPress(k) {
    if (this.bDone) return;
    Sound.tap();
    if (this.bTyped.length >= this.bWord.length) return;
    this.bTyped.push(k);
    this.paintBook();
  },
  bookDel() {
    if (this.bDone) return;
    const last = this.bTyped.length - 1;
    if (last < 0 || last < this.bLocked.length) return;
    this.bTyped.pop();
    this.paintBook();
  },
  bookHint() {
    if (this.bDone) return;
    if (this.bTyped.length >= this.bWord.length) return;
    this.bTyped.push(this.bWord[this.bTyped.length]);
    this.bLocked.push(this.bWord[this.bLocked.length]);
    Sound.tap();
    this.paintBook();
  },
  bookOk() {
    if (this.bDone) return;
    const w = this.bWord;
    if (this.bTyped.join('').toLowerCase() !== w) {
      this.bWrongs++;
      Sound.wrong();
      this.bWordEl.classList.add('bad');
      setTimeout(() => this.bWordEl.classList.remove('bad'), 450);
      this.bTyped = this.bLocked.slice();
      this.paintBook();
      if (this.bWrongs >= 2 && this.bTipEl) this.bTipEl.textContent = '连错 2 次啦，点「提示一个字母」看看';
      return;
    }
    this.bDone = true;
    Sound.correct();
    this.bWordEl.classList.remove('active');
    this.bWordEl.classList.add('done');
    const r = Store.sentenceNewOk(w);
    if (r.mastered) {
      this.bookMastered++;
      this.bTipEl.innerHTML = '\u{1F389} 拼对 2 次，这个词学会啦！自动移出生词本';
      const c = centerOf(this.bWordEl);
      burst(c.x, c.y, { count: 14, emojis: ['\u2B50', '\u2728'], power: 90 });
    } else {
      this.bTipEl.textContent = `\u2705 拼对了！再拼对 ${2 - r.ok} 次就学会`;
    }
    this.bNextBtn.style.display = '';
  },
  paintBook() {
    this.bCells.forEach((c, j) => { c.textContent = this.bTyped[j] || ''; });
  },

  finishBook() {
    this.unbindKey();
    updateTop();
    const gain = Store.finishSentenceBook(this.bookMastered);
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.exitBtn('\u{1F4D2} 生词练习'));
    root.appendChild(h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, this.bookMastered ? '\u{1F389}' : '\u{1F4D2}'),
      h('div', { class: 'finish-title' }, `练了 ${this.book.length} 个词 · 新学会 ${this.bookMastered} 个`),
      h('div', { class: 'finish-sub' },
        `获得 +${gain} \u{1FA99}${(Store.state.today.mint.sbook || 0) > 1 ? '（今日重练，奖励减半）' : ''} · 生词本还剩 ${Store.sentenceNewList().length} 个词`),
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.startBookDrill(); } }, '再练一组'),
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.renderNewBook(); } }, '回生词本'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); this.leave(); showScreen('home'); renderHome(); } }, '返回空间站')
      )
    ));
    if (this.bookMastered) {
      const c = centerOf($('.finish-stamp'));
      burst(c.x, c.y, { count: 24, emojis: ['\u{1F389}', '\u2B50', '\u2728'], power: 130 });
    }
  },

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
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.renderNewBook(); } }, '\u{1F4D2} 生词本'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); this.leave(); showScreen('home'); renderHome(); } }, '返回空间站')
      )
    ));
    if (allOk) {
      const c = centerOf($('.finish-stamp'));
      burst(c.x, c.y, { count: 30, emojis: ['\u{1F3C6}', '\u2B50', '\u{1F389}'], power: 160 });
    }
  }
};
