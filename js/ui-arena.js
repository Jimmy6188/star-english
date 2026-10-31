/* ============================================================
 * 星际求知号 - 竞技场（v38，借鉴竞赛玩法的能力拔高专项）
 * 六个项目（独立入口、不计入每日打卡，纯加餐）：
 *   🥊 拼字擂台  借鉴 Spelling Bee：听发音拼单词，3 条命，逐轮变难
 *   🕵️ 线索猜诗  借鉴诗词大会"线索猜诗"：线索一条条给，越早猜中分越高
 *   🧧 猜成语    借鉴成语大会"描述猜词"：两条线索猜成语
 *   🦘 袋鼠思维  借鉴袋鼠数学：3/4/5 分阶梯，含数独与迷宫画图题
 *   🌸 飞花令    令字找句，只从已学/点亮的诗里出（v40）
 *   🔊 听写大会  听词选形，形近/同音字大作战（v40）
 * 奖励统一走 earnScaled('arena')，破纪录另 +5；纪录存 state.arena
 * ============================================================ */
const Arena = {

  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  /* ==================== 主页 ==================== */
  open() {
    Sound.stopSpeak();
    setQuestSub('var(--orange, #ff9f43)');
    showScreen('quest');
    this.renderHub();
  },

  renderHub() {
    clearTimeout(this.spTimer); /* 回大厅先清掉擂台的翻页定时器 */
    Sound.stopSpeak();
    const root = $('#quest-root');
    root.innerHTML = '';
    const a = Store.state.arena;
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.tap(); showScreen('home'); renderHome(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, '🏆 竞技场')
    ));
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, '🏆'),
      h('div', { class: 'splash-title' }, '竞技场'),
      h('div', { class: 'splash-sub' }, '挑战自己的纪录 · 破纪录有加奖 · 不计入每日打卡')
    ));
    const grid = h('div', { class: 'ar-grid' });
    /* v40 新增：飞花令（只出已学诗）+ 听写大会（形近字听辨） */
    [{
      emoji: '🌸', name: '飞花令', sub: `令字找句 · 只考你学过的诗 · 纪录 ${a.flower ? a.flower.best : 0} 连`, go: () => this.flowerStart()
    }, {
      emoji: '🔊', name: '听写大会', sub: `听词选形 · 形近字大作战 · 纪录 ${a.hanzi ? a.hanzi.best : 0} 连`, go: () => this.hzStart()
    }].forEach(it => {
      grid.appendChild(h('button', { class: 'ar-card', onclick: () => { Sound.tap(); it.go(); } },
        h('div', { class: 'ar-emoji' }, it.emoji),
        h('div', { class: 'ar-name' }, it.name),
        h('div', { class: 'tiny' }, it.sub)
      ));
    });
    [
      { emoji: '🥊', name: '拼字擂台', sub: `听发音拼单词 · 3条命 · 纪录 ${a.spell.best} 连胜`, go: () => this.spellStart() },
      { emoji: '🕵️', name: '线索猜诗', sub: `线索越早分越高 · 纪录 ${a.clue.best} 分`, go: () => this.clueStart('poem') },
      { emoji: '🧧', name: '猜成语', sub: `看描述猜成语 · 纪录 ${a.idiom.best} 分`, go: () => this.clueStart('idiom') },
      { emoji: '🦘', name: '袋鼠思维', sub: `3/4/5 分阶梯 · 数独迷宫 · 纪录 ${a.roo.best} 分`, go: () => this.rooStart() }
    ].forEach(it => {
      grid.appendChild(h('button', { class: 'ar-card', onclick: () => { Sound.tap(); it.go(); } },
        h('div', { class: 'ar-emoji' }, it.emoji),
        h('div', { class: 'ar-name' }, it.name),
        h('div', { class: 'tiny' }, it.sub)
      ));
    });
    root.appendChild(grid);
  },

  topBar(title, back) {
    return h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.tap(); Sound.stopSpeak(); back(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, title)
    );
  },

  /* ==================== 🥊 拼字擂台（Spelling Bee） ==================== */
  spellStart() {
    clearTimeout(this.spTimer); /* 重开一局先清掉上局的翻页定时器 */
    /* 词队列：已学词优先（srs 有记录），再补未学的；同组内按难度排（越往后越难） */
    const learned = [], fresh = [];
    Store.allPacks().forEach(p => p.words.forEach(w => {
      if (w.phrase || /\s/.test(w.word)) return;
      (Store.state.srs[w.word.toLowerCase()] ? learned : fresh).push(w);
    }));
    const byHard = (x, y) => ((x.level || 1) - (y.level || 1)) || (x.word.length - y.word.length);
    this.spQueue = shuffle(learned).sort(byHard).concat(shuffle(fresh).sort(byHard));
    this.spLives = 3; this.spStreak = 0; this.spIdx = 0; this.spHints = 2; this.spZhShown = false;
    this.spNext();
  },

  spNext() {
    clearTimeout(this.spTimer); /* 上一步的翻页定时器作废（退出/重开时不再回来抢屏） */
    if (this.spLives <= 0 || this.spIdx >= this.spQueue.length) { this.spFinish(); return; }
    const w = this.spQueue[this.spIdx];
    const root = $('#quest-root');
    root.innerHTML = '';
    this.spZhShown = false;
    const self = this;
    root.appendChild(this.topBar(`🥊 拼字擂台 · 第 ${this.spStreak + 1} 词`, () => this.renderHub()));

    const word = w.word.toLowerCase();
    const slots = []; /* 字母槽 DOM */
    let typed = '';

    const status = h('div', { class: 'ar-lives' },
      '❤️'.repeat(this.spLives) + '🖤'.repeat(3 - this.spLives),
      h('span', { style: 'margin-left:10px' }, `🔥 连胜 ${this.spStreak}`));

    const zhLine = h('div', { class: 'ar-zh' }, '');

    const board = h('div', { class: 'ar-slots' });
    for (let i = 0; i < word.length; i++) {
      const s = h('span', { class: 'ar-slot' }, '');
      slots.push(s); board.appendChild(s);
    }
    const paint = () => {
      slots.forEach((s, i) => {
        s.textContent = typed[i] || '';
        s.className = 'ar-slot' + (typed[i] ? ' filled' : '') + (i === typed.length ? ' cur' : '');
      });
    };
    paint();

    const judge = () => {
      if (typed.length < word.length) return;
      if (typed === word) {
        Sound.correct();
        this.spStreak++; this.spIdx++;
        slots.forEach(s => s.classList.add('right'));
        this.spTimer = setTimeout(() => self.spNext(), 700);
      } else {
        Sound.wrong();
        this.spLives--;
        slots.forEach((s, i) => { s.textContent = word[i]; s.className = 'ar-slot wrong'; });
        zhLine.textContent = `正确：${w.word}（${w.zh}）`;
        zhLine.classList.add('show');
        this.spTimer = setTimeout(() => { if (self.spLives <= 0) self.spFinish(); else { self.spIdx++; self.spNext(); } }, 1600);
      }
      locked = true;
    };
    let locked = false;

    const tools = h('div', { class: 'row-gap', style: 'justify-content:center;flex-wrap:wrap' },
      h('button', { class: 'btn small', onclick: () => Sound.speakWord(w.word) }, '🔊 再听一遍'),
      h('button', {
        class: 'btn small', onclick: e => {
          if (this.spZhShown) return;
          this.spZhShown = true;
          zhLine.textContent = '💡 ' + w.zh;
          zhLine.classList.add('show');
          e.currentTarget.classList.add('btn-on');
        }
      }, '👀 看中文'),
      h('button', {
        class: 'btn small', onclick: e => {
          if (locked) return; /* 已判定不再接受提示，防止重复触发 judge 刷分 */
          if (this.spHints <= 0) { toast('本局的首字母提示用完啦'); return; }
          this.spHints--;
          typed = word.slice(0, typed.length + 1);
          paint();
          e.currentTarget.textContent = `💡 首字母提示 ×${this.spHints}`;
          if (typed.length >= word.length) judge();
        }
      }, `💡 首字母提示 ×${this.spHints}`)
    );

    /* 字母键盘（v38.5：布局跟随「英语句子默写」的设置，ABC/电脑排列可切；
     * ⌫ 移到第三行末尾的标准位置，另补连字符和撇号——ping-pong / don't 这类词拼得了） */
    const keys = h('div', { class: 'ar-keys' });
    const press = k => {
      if (locked) return;
      if (k === 'del') { typed = typed.slice(0, -1); paint(); return; }
      if (k === 'ok' || typed.length >= word.length) { judge(); return; }
      if (/^[a-z'-]$/.test(k)) { typed += k; paint(); if (typed.length === word.length) judge(); }
    };
    const keyBtn = k => h('button', {
      class: 'ar-key' + (k === '✓' ? ' ok' : ''),
      onclick: () => { Sound.tap(); press(k === '⌫' ? 'del' : k === '✓' ? 'ok' : k); }
    }, k);
    const layoutName = () => (Store.state.sentence.layout === 'qwerty' ? '电脑排列' : 'ABC 排列');
    const paintKeys = () => {
      keys.innerHTML = '';
      const rows = Store.state.sentence.layout === 'qwerty'
        ? [['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], ['z', 'x', 'c', 'v', 'b', 'n', 'm', "'", '-']]
        : [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], ['k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't'], ['u', 'v', 'w', 'x', 'y', 'z', "'", '-']];
      rows.forEach(row => {
        const line = h('div', { class: 'ar-krow' });
        row.forEach(k => line.appendChild(keyBtn(k)));
        keys.appendChild(line);
      });
      /* ⌫ 和 ✓ 放在最后一行末尾（标准位置） */
      const last = keys.lastElementChild;
      last.appendChild(keyBtn('⌫'));
      last.appendChild(keyBtn('✓'));
    };
    paintKeys();
    /* 布局切换按钮：与句子默写共用同一个设置（Store.setSentenceLayout），改一处两处生效 */
    const layBtn = h('button', {
      class: 'btn small', style: 'margin-top:8px',
      onclick: e => {
        Sound.tap();
        const next = Store.state.sentence.layout === 'qwerty' ? 'abc' : 'qwerty';
        Store.setSentenceLayout(next);
        paintKeys();
        e.currentTarget.textContent = `⌨️ 当前：${layoutName()}（点切换）`;
        toast(next === 'abc' ? '键盘换成 ABC 排列了（句子默写也一起换）' : '键盘换成电脑排列了（句子默写也一起换）');
      }
    }, `⌨️ 当前：${layoutName()}（点切换）`);

    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, '🥊 拼字擂台'),
      status, zhLine,
      h('button', { class: 'speak-btn xl', onclick: () => Sound.speakWord(w.word) }, '🔊'),
      h('div', { class: 'tiny', style: 'margin:4px 0 8px' }, '仔细听，把它拼出来（🔊 可反复听）'),
      board, tools, keys, layBtn
    ));
    setTimeout(() => Sound.speakWord(w.word), 500);
  },

  spFinish() {
    const res = Store.arenaFinish('spell', this.spStreak);
    Sound.gold();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.topBar('🥊 擂台结算', () => this.renderHub()));
    const stamp = h('div', { class: 'finish-stamp' }, this.spStreak >= 10 ? '🏆' : '🥊');
    root.appendChild(h('div', { class: 'card finish-card' },
      stamp,
      h('div', { class: 'finish-title' }, `连胜 ${this.spStreak} 个词！`),
      h('div', { class: 'finish-sub' }, `获得 +${res.got} 🪙${res.isBest ? ' · 🎉 新纪录！' : ` · 纪录 ${Store.state.arena.spell.best}`}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.spellStart(); } }, '再来一局'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); this.renderHub(); } }, '回竞技场')
      )
    ));
    const c = centerOf(stamp);
    burst(c.x, c.y, { count: 20, emojis: ['🥊', '⭐', '🔥'], power: 120 });
  },

  /* ==================== 🕵️ 线索猜谜（诗 / 成语共用骨架） ==================== */
  clueStart(mode) {
    this.clueMode = mode;
    this.clueTotal = 0;
    this.clueQs = mode === 'poem' ? this.buildPoemQs(5) : this.buildIdiomQs(6);
    this.clueIdx = 0;
    this.clueNext();
  },

  /* 诗题：优先已学；线索=朝代→作者→名句；猜诗题 */
  buildPoemQs(n) {
    const learned = CN_POEMS.filter(p => (Store.state.chinese.learned || {})[p.id] || Store.state.chinese.stars[p.id]);
    const pool = shuffle(learned.length >= n ? learned : CN_POEMS).slice(0, n);
    return pool.map(p => {
      const wrongs = shuffle(CN_POEMS.filter(x => x.id !== p.id)).slice(0, 3).map(x => x.title);
      return {
        key: p.title,
        clues: [`这是一首${p.dynasty}代的诗`, `作者是${p.author}`, `诗里写着"${p.lines[0]}，${p.lines[1] || ''}"`],
        opts: shuffle([p.title, ...wrongs]),
        tip: `《${p.title}》——${p.author}（${p.dynasty}）`
      };
    });
  },

  /* 成语题：线索1=意思，线索2=情境；干扰项从其它成语抽 */
  buildIdiomQs(n) {
    const pool = shuffle(ARENA_IDIOMS).slice(0, n);
    return pool.map(it => {
      const wrongs = shuffle(ARENA_IDIOMS.filter(x => x.w !== it.w)).slice(0, 3).map(x => x.w);
      return {
        key: it.w,
        clues: [`猜一个成语：${it.c1}`, `再给你一条线索：${it.c2}`],
        opts: shuffle([it.w, ...wrongs]),
        tip: `${it.w}——${it.c1}`
      };
    });
  },

  clueNext() {
    if (this.clueIdx >= this.clueQs.length) { this.clueFinish(); return; }
    const q = this.clueQs[this.clueIdx];
    const scores = this.clueMode === 'poem' ? [5, 3, 1] : [4, 2];
    const root = $('#quest-root');
    root.innerHTML = '';
    const name = this.clueMode === 'poem' ? '🕵️ 线索猜诗' : '🧧 猜成语';
    root.appendChild(this.topBar(`${name} · ${this.clueIdx + 1}/${this.clueQs.length} · ${this.clueTotal} 分`, () => this.renderHub()));
    const self = this;
    let ci = 0; /* 当前线索序号 */
    let answered = false;

    const clueList = h('div', { class: 'ar-clues' });
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'min-height:20px' });
    const nextBtn = h('button', {
      class: 'btn btn-main big', style: 'display:none',
      onclick: () => { Sound.tap(); self.clueIdx++; self.clueNext(); }
    }, '下一题 →');

    const showClue = () => {
      /* 线索全给完还没答对：公布答案（先判越界再渲染，避免出现"🔍 undefined"） */
      if (ci >= q.clues.length) {
        answered = true;
        tipEl.textContent = `答案是：${q.key}。${q.tip}`;
        renderOpts(true);
        nextBtn.style.display = '';
        return;
      }
      clueList.appendChild(h('div', { class: 'ar-clue' }, `🔍 ${q.clues[ci]}`));
      renderOpts(false);
    };

    const optsEl = h('div', { class: 'cn-opts' });
    const renderOpts = reveal => {
      optsEl.innerHTML = '';
      q.opts.forEach(t => {
        const isKey = t === q.key;
        optsEl.appendChild(h('button', {
          class: 'cn-opt' + (reveal && isKey ? ' right' : ''),
          onclick: e => {
            if (answered) return;
            if (isKey) {
              answered = true;
              const got = scores[Math.min(ci, scores.length - 1)];
              self.clueTotal += got;
              Sound.correct();
              e.currentTarget.classList.add('right');
              const c = centerOf(e.currentTarget);
              burst(c.x, c.y, { count: 8, colors: ['#58e08a'], power: 45 });
              tipEl.textContent = `✅ +${got} 分（第 ${ci + 1} 条线索猜中）`;
              nextBtn.style.display = '';
            } else {
              Sound.wrong();
              e.currentTarget.classList.add('dead');
              ci++;
              showClue();
            }
          }
        }, t));
      });
    };

    showClue();
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, `${name} · 得分越高越要早猜`),
      clueList, optsEl, tipEl, nextBtn
    ));
  },

  clueFinish() {
    const kind = this.clueMode === 'poem' ? 'clue' : 'idiom';
    const name = this.clueMode === 'poem' ? '线索猜诗' : '猜成语';
    const res = Store.arenaFinish(kind, this.clueTotal);
    Sound.gold();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.topBar(`🎉 ${name}结算`, () => this.renderHub()));
    const stamp = h('div', { class: 'finish-stamp' }, '🕵️');
    root.appendChild(h('div', { class: 'card finish-card' },
      stamp,
      h('div', { class: 'finish-title' }, `${name} ${this.clueTotal} 分！`),
      h('div', { class: 'finish-sub' }, `获得 +${res.got} 🪙${res.isBest ? ' · 🎉 新纪录！' : ` · 纪录 ${Store.state.arena[kind].best}`}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.clueStart(this.clueMode); } }, '再来一局'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); this.renderHub(); } }, '回竞技场')
      )
    ));
    const c = centerOf(stamp);
    burst(c.x, c.y, { count: 18, emojis: ['🕵️', '⭐', '✨'], power: 110 });
  },

  /* ==================== 🦘 袋鼠思维（3/4/5 分阶梯 + 数独 + 迷宫） ==================== */
  rooStart() {
    /* 一组 6 题：3分×2 → 4分choice×1 → 5分choice×1 → 迷宫(4分) → 数独(5分)，满分 24 */
    const pickPts = pts => shuffle(KANGAROO_QS.filter(q => q.pts === pts));
    this.rooPlan = []
      .concat(pickPts(3).slice(0, 2).map(q => ({ type: 'choice', q })))
      .concat(pickPts(4).filter(q => !String(q.fig).includes('🕒')).slice(0, 1).map(q => ({ type: 'choice', q })))
      .concat(pickPts(5).slice(0, 1).map(q => ({ type: 'choice', q })))
      .concat([{ type: 'maze', pts: 4 }, { type: 'sudoku', pts: 5 }]);
    this.rooIdx = 0; this.rooTotal = 0;
    this.rooNext();
  },

  rooNext() {
    if (this.rooIdx >= this.rooPlan.length) { this.rooFinish(); return; }
    const item = this.rooPlan[this.rooIdx];
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.topBar(`🦘 袋鼠思维 · ${this.rooIdx + 1}/${this.rooPlan.length} · ${this.rooTotal} 分`, () => this.renderHub()));
    if (item.type === 'choice') this.rooChoice(item.q, root);
    else if (item.type === 'maze') this.rooMaze(root);
    else this.rooSudoku(root);
  },

  rooDone(got, tipTxt) {
    this.rooTotal += got;
    Sound.tap();
    const root = $('#quest-root');
    const tipEl = h('div', { class: 'tiny cn-tip' }, (got > 0 ? `✅ +${got} 分！` : '❌ 这题没得分。') + (tipTxt || ''));
    const nextBtn = h('button', {
      class: 'btn btn-main big', style: 'display:none',
      onclick: () => { Sound.tap(); this.rooIdx++; this.rooNext(); }
    }, this.rooIdx + 1 >= this.rooPlan.length ? '看结算 →' : '下一题 →');
    const bar = h('div', { class: 'ar-donebar' }, tipEl, nextBtn);
    root.appendChild(bar);
    setTimeout(() => { nextBtn.style.display = ''; }, got > 0 ? 500 : 1400);
  },

  /* 选择题（含 emoji 图示行） */
  rooChoice(q, root) {
    const self = this;
    let answered = false;
    const map = shuffle(q.opts.map((t, i) => ({ t, ok: i === q.ans })));
    const grid = h('div', { class: 'cn-opts' });
    map.forEach(m => {
      grid.appendChild(h('button', {
        class: 'cn-opt',
        onclick: e => {
          if (answered) return;
          answered = true;
          if (m.ok) {
            Sound.correct();
            e.currentTarget.classList.add('right');
            self.rooDone(q.pts, q.tip);
          } else {
            Sound.wrong();
            e.currentTarget.classList.add('wrong');
            Array.from(grid.children).forEach((b, i) => { if (map[i].ok) b.classList.add('right'); });
            self.rooDone(0, q.tip);
          }
          Array.from(grid.children).forEach(b => { b.disabled = true; });
        }
      }, m.t));
    });
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, `🦘 ${q.pts} 分题`),
      q.fig ? h('div', { class: 'ar-fig' }, q.fig) : '',
      h('div', { class: 'spell-prompt' }, q.q),
      grid
    ));
  },

  /* 数独 4×4：行、列、每个 2×2 宫都是 1-4 不重复 */
  rooSudoku(root) {
    const self = this;
    const { puzzle, answer } = kangarooSudoku(8);
    const grid = { v: puzzle.map(r => r.slice()) };
    let sel = null, checks = 3, done = false;
    const msg = h('div', { class: 'tiny', style: 'min-height:20px' }, '每行、每列、每个 2×2 小宫都要是 1~4 不重复');

    const board = h('div', { class: 'ar-sudoku' });
    const cells = [];
    const paint = () => {
      cells.forEach((btn, idx) => {
        const r = Math.floor(idx / 4), c = idx % 4;
        btn.textContent = grid.v[r][c] || '';
        btn.className = 'ar-cell' +
          (puzzle[r][c] ? ' given' : '') +
          (sel && sel[0] === r && sel[1] === c ? ' sel' : '') +
          (btn.dataset.bad === '1' ? ' bad' : '');
      });
    };
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const btn = h('button', {
        class: 'ar-cell',
        onclick: () => {
          if (done || puzzle[r][c]) return;
          Sound.tap();
          sel = [r, c];
          btn.dataset.bad = '0';
          paint();
        }
      });
      cells.push(btn); board.appendChild(btn);
    }
    paint();

    const nums = h('div', { class: 'ar-keys' });
    [1, 2, 3, 4].forEach(n => {
      nums.appendChild(h('button', {
        class: 'ar-key',
        onclick: () => {
          if (done || !sel || puzzle[sel[0]][sel[1]]) return;
          Sound.tap();
          grid.v[sel[0]][sel[1]] = n;
          cells[sel[0] * 4 + sel[1]].dataset.bad = '0';
          sel = null;
          paint();
        }
      }, String(n)));
    });
    nums.appendChild(h('button', {
      class: 'ar-key',
      onclick: () => { if (!done && sel) { grid.v[sel[0]][sel[1]] = 0; paint(); } }
    }, '⌫'));

    const checkBtn = h('button', {
      class: 'btn btn-main big',
      onclick: () => {
        if (done) return;
        const full = grid.v.every(r => r.every(v => v));
        if (!full) { msg.textContent = '还有空格没填完哦'; return; }
        checks--;
        let bad = 0;
        cells.forEach((btn, idx) => {
          const r = Math.floor(idx / 4), c = idx % 4;
          if (grid.v[r][c] !== answer[r][c]) { btn.dataset.bad = '1'; bad++; }
        });
        paint();
        if (!bad) {
          done = true;
          Sound.correct();
          self.rooDone(5, '全部正确，数独通关！');
        } else if (checks > 0) {
          Sound.wrong();
          msg.textContent = `有 ${bad} 格不对（红色），还剩 ${checks} 次检查机会`;
        } else {
          done = true;
          msg.textContent = '三次检查用完啦，这题没有得分';
          cells.forEach((btn, idx) => {
            const r = Math.floor(idx / 4), c = idx % 4;
            if (grid.v[r][c] !== answer[r][c]) { btn.textContent = answer[r][c]; btn.classList.add('right'); }
          });
          self.rooDone(0, '');
        }
      }
    }, '检查一下 ✓（还有 3 次机会）');

    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, '🦘 5 分题 · 小小数独'),
      msg, board, nums, checkBtn
    ));
  },

  /* 迷宫：方向键走到 E */
  rooMaze(root) {
    const self = this;
    const mz = KANGAROO_MAZES[Math.floor(Math.random() * KANGAROO_MAZES.length)];
    let pos = null, steps = 0, done = false;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) if (mz[r][c] === 'S') pos = [r, c];
    const msg = h('div', { class: 'tiny', style: 'min-height:20px' }, '用方向键把小袋鼠 🦘 送到旗帜 🏁 吧');

    const board = h('div', { class: 'ar-maze' });
    const cells = [];
    const paint = () => {
      cells.forEach((cell, idx) => {
        const r = Math.floor(idx / 6), c = idx % 6;
        const ch = mz[r][c];
        cell.className = 'ar-mcell' + (ch === '#' ? ' wall' : '') +
          (pos && pos[0] === r && pos[1] === c ? ' me' : '');
        cell.textContent = pos && pos[0] === r && pos[1] === c ? '🦘'
          : ch === 'E' ? '🏁' : '';
      });
    };
    for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
      const cell = h('div', { class: 'ar-mcell' });
      cells.push(cell); board.appendChild(cell);
    }
    paint();

    const stepsEl = h('div', { class: 'tiny' }, '已走 0 步');
    const move = dir => {
      if (done) return;
      const [dr, dc] = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[dir];
      const nr = pos[0] + dr, nc = pos[1] + dc;
      if (nr < 0 || nc < 0 || nr >= 6 || nc >= 6 || mz[nr][nc] === '#') { Sound.wrong(); return; }
      pos = [nr, nc];
      steps++;
      stepsEl.textContent = `已走 ${steps} 步`; /* 步数实时刷新（原来在创建时取值恒为 0） */
      Sound.tap();
      paint();
      if (mz[nr][nc] === 'E') {
        done = true;
        Sound.gold();
        self.rooDone(4, `走了 ${steps} 步，走出迷宫啦！`);
      }
    };
    const pad = h('div', { class: 'ar-dpad' });
    [['up', '⬆️'], ['left', '⬅️'], ['down', '⬇️'], ['right', '➡️']].forEach(([d, e]) => {
      pad.appendChild(h('button', { class: 'ar-key big', onclick: () => move(d) }, e));
    });
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, '🦘 4 分题 · 星际迷宫'),
      msg, board, pad,
      stepsEl
    ));
  },

  rooFinish() {
    const res = Store.arenaFinish('roo', this.rooTotal);
    Sound.gold();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.topBar('🦘 袋鼠结算', () => this.renderHub()));
    const stamp = h('div', { class: 'finish-stamp' }, this.rooTotal >= 20 ? '🏆' : '🦘');
    root.appendChild(h('div', { class: 'card finish-card' },
      stamp,
      h('div', { class: 'finish-title' }, `袋鼠思维 ${this.rooTotal}/24 分！`),
      h('div', { class: 'finish-sub' }, `获得 +${res.got} 🪙${res.isBest ? ' · 🎉 新纪录！' : ` · 纪录 ${Store.state.arena.roo.best}`}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.rooStart(); } }, '再来一组'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); this.renderHub(); } }, '回竞技场')
      )
    ));
    const c = centerOf(stamp);
    burst(c.x, c.y, { count: 20, emojis: ['🦘', '⭐', '🔢'], power: 120 });
  },

  /* ==================== 🌸 飞花令（v40：只从已学的诗里取句） ====================
   * 每轮给一个"令字"，四句诗里只有一句藏着它；3 条命，连对越多分越高 */
  flowerPool() {
    const all = (typeof CN_POEMS_NEXT !== 'undefined') ? CN_POEMS.concat(CN_POEMS_NEXT) : CN_POEMS;
    const learned = all.filter(p => (Store.state.chinese.learned || {})[p.id] || Store.state.chinese.stars[p.id]);
    return learned.flatMap(p => p.lines);
  },

  flowerStart() {
    const lines = this.flowerPool();
    if (lines.length < 4) { toast('先去「诗词星图」多学几首诗，再来接飞花令！'); return; }
    this.flStreak = 0; this.flLives = 3;
    this.flNext();
  },

  /* 组一轮：随机选一句做答案句，从它里面挑一个令字（另外三句都不能含这个字） */
  flNext() {
    const lines = this.flowerPool();
    if (this.flLives <= 0 || this.flStreak >= 12) { this.flFinish(); return; }
    let ch = '', correct = '', wrongs = [];
    for (let t = 0; t < 40 && !ch; t++) {
      const cand = this.pick(lines);
      const chars = shuffle(cand.split('').filter(c => /[\u3400-\u9fff]/.test(c)));
      for (const c of chars) {
        const others = lines.filter(l => l !== cand && !l.includes(c));
        if (others.length >= 3) { ch = c; correct = cand; wrongs = shuffle(others).slice(0, 3); break; }
      }
    }
    if (!ch) { this.flFinish(); return; } /* 令字凑不出就收局 */
    const root = $('#quest-root');
    root.innerHTML = '';
    const self = this;
    const status = h('div', { class: 'ar-lives' },
      '❤️'.repeat(this.flLives) + '🖤'.repeat(3 - this.flLives),
      h('span', { style: 'margin-left:10px' }, `🔥 连对 ${this.flStreak}`));
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'min-height:20px' });
    const next = ok => {
      if (ok) {
        self.flStreak++;
        setTimeout(() => self.flNext(), 900);
      } else {
        self.flLives--;
        if (self.flLives <= 0) setTimeout(() => self.flFinish(), 1800);
        else setTimeout(() => self.flNext(), 1800);
      }
    };
    root.appendChild(this.topBar(`🌸 飞花令 · 连对 ${this.flStreak}`, () => this.renderHub()));
    const optsEl = h('div', { class: 'cn-opts' });
    const answered = { v: false };
    shuffle([{ t: correct, ok: true }, ...wrongs.map(t => ({ t, ok: false }))]).forEach(m => {
      optsEl.appendChild(h('button', {
        class: 'cn-opt', style: 'text-align:left',
        onclick: e => {
          if (answered.v) return;
          answered.v = true;
          if (m.ok) {
            Sound.correct();
            e.currentTarget.classList.add('right');
            const c = centerOf(e.currentTarget);
            burst(c.x, c.y, { count: 8, colors: ['#ff8fab'], power: 50 });
            tipEl.textContent = `✅ “${correct}”里果然藏着“${ch}”！`;
            Array.from(optsEl.children).forEach(b => { b.disabled = true; });
            next(true);
          } else {
            Sound.wrong();
            e.currentTarget.classList.add('wrong');
            Array.from(optsEl.children).forEach(b => {
              b.disabled = true;
              if (b.textContent === correct) b.classList.add('right');
            });
            tipEl.textContent = `❌ 含“${ch}”的是：${correct}`;
            next(false);
          }
        }
      }, m.t));
    });
    root.appendChild(h('div', { class: 'card drill-card center' },
      h('div', { class: 'drill-tag' }, '🌸 飞花令 · 令字找句'),
      status,
      h('div', { style: 'font-size:64px;font-weight:800;margin:6px 0;color:var(--gold)' }, ch),
      h('div', { class: 'tiny', style: 'margin-bottom:8px' }, '哪一句诗里藏着这个字？'),
      optsEl, tipEl
    ));
    Sound.tap();
  },

  flFinish() {
    const res = Store.arenaFinish('flower', this.flStreak);
    Sound.gold();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.topBar('🌸 飞花令结算', () => this.renderHub()));
    const stamp = h('div', { class: 'finish-stamp' }, this.flStreak >= 8 ? '🏆' : '🌸');
    root.appendChild(h('div', { class: 'card finish-card' },
      stamp,
      h('div', { class: 'finish-title' }, `飞花令连对 ${this.flStreak} 句！`),
      h('div', { class: 'finish-sub' }, `获得 +${res.got} 🪙${res.isBest ? ' · 🎉 新纪录！' : ` · 纪录 ${Store.state.arena.flower.best}`}`),
      h('div', { class: 'tiny', style: 'margin-bottom:8px' }, '诗句全部来自你学过的诗——多学一首，令池就大一分'),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.flowerStart(); } }, '再战一局'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); this.renderHub(); } }, '回竞技场')
      )
    ));
    const c = centerOf(stamp);
    burst(c.x, c.y, { count: 20, emojis: ['🌸', '⭐', '✨'], power: 120 });
  },

  /* ==================== 🔊 听写大会（v40：听词选形，形近字大作战） ==================== */
  hzStart() {
    this.hzStreak = 0; this.hzLives = 3; this.hzLast = '';
    this.hzNext();
  },

  hzNext() {
    clearTimeout(this.hzTimer);
    if (this.hzLives <= 0 || this.hzStreak >= 15) { this.hzFinish(); return; }
    let q = this.pick(HANZI_DICT);
    let guard = 0;
    while (q.w === this.hzLast && guard++ < 10) q = this.pick(HANZI_DICT);
    this.hzLast = q.w;
    const root = $('#quest-root');
    root.innerHTML = '';
    const self = this;
    const status = h('div', { class: 'ar-lives' },
      '❤️'.repeat(this.hzLives) + '🖤'.repeat(3 - this.hzLives),
      h('span', { style: 'margin-left:10px' }, `🔥 连对 ${this.hzStreak}`));
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'min-height:20px' });
    const next = ok => {
      if (ok) {
        self.hzStreak++;
        self.hzTimer = setTimeout(() => self.hzNext(), 900);
      } else {
        self.hzLives--;
        self.hzTimer = setTimeout(() => { if (self.hzLives <= 0) self.hzFinish(); else self.hzNext(); }, 2000);
      }
    };
    root.appendChild(this.topBar(`🔊 听写大会 · 连对 ${this.hzStreak}`, () => this.renderHub()));
    const optsEl = h('div', { class: 'cn-opts' });
    const answered = { v: false };
    shuffle(q.opts.map(t => ({ t, ok: t === q.w }))).forEach(m => {
      optsEl.appendChild(h('button', {
        class: 'cn-opt', style: 'font-size:22px;font-weight:800;letter-spacing:2px',
        onclick: e => {
          if (answered.v) return;
          answered.v = true;
          if (m.ok) {
            Sound.correct();
            e.currentTarget.classList.add('right');
            const c = centerOf(e.currentTarget);
            burst(c.x, c.y, { count: 8, colors: ['#58e08a'], power: 50 });
            tipEl.textContent = `✅ ${q.w} · 写对了！`;
            next(true);
          } else {
            Sound.wrong();
            e.currentTarget.classList.add('wrong');
            Array.from(optsEl.children).forEach(b => {
              b.disabled = true;
              if (b.textContent === q.w) b.classList.add('right');
            });
            tipEl.textContent = `❌ 正确写法：${q.w} · 别被形近字骗到`;
            next(false);
          }
        }
      }, m.t));
    });
    const speakBtn = h('button', { class: 'speak-btn xl', onclick: () => Sound.speak(q.w, 0.8) }, icon('sound'));
    root.appendChild(h('div', { class: 'card drill-card center' },
      h('div', { class: 'drill-tag' }, '🔊 听写大会 · 听词选形'),
      status,
      speakBtn,
      h('div', { class: 'tiny', style: 'margin:4px 0' }, `听发音选写法 · 语境提示：${q.hint}`),
      optsEl, tipEl
    ));
    /* 进题自动读词（读两遍，间隔 1.2s），点喇叭可重听 */
    this.hzTimer = setTimeout(() => Sound.speak(q.w, 0.8, () => {
      this.hzTimer = setTimeout(() => Sound.speak(q.w, 0.8), 1200);
    }), 400);
  },

  hzFinish() {
    clearTimeout(this.hzTimer);
    const res = Store.arenaFinish('hanzi', this.hzStreak);
    Sound.gold();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.topBar('🔊 听写大会结算', () => this.renderHub()));
    const stamp = h('div', { class: 'finish-stamp' }, this.hzStreak >= 10 ? '🏆' : '🔊');
    root.appendChild(h('div', { class: 'card finish-card' },
      stamp,
      h('div', { class: 'finish-title' }, `听写大会连对 ${this.hzStreak} 词！`),
      h('div', { class: 'finish-sub' }, `获得 +${res.got} 🪙${res.isBest ? ' · 🎉 新纪录！' : ` · 纪录 ${Store.state.arena.hanzi.best}`}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.hzStart(); } }, '再战一局'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); this.renderHub(); } }, '回竞技场')
      )
    ));
    const c = centerOf(stamp);
    burst(c.x, c.y, { count: 20, emojis: ['🔊', '✍️', '⭐'], power: 120 });
  }
};
