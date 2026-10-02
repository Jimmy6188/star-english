/* ============================================================
 * 星际求知号 - 数学星系：限时口算冲刺
 * 程序生成题目（按难度档），答对进金币、错题进数学错题池
 * 冲刺达标点亮行星；打卡/金币/宠物与英语共享
 * ============================================================ */

const MathSprint = {
  running: false, timer: null, tickTimer: null,
  correct: 0, wrong: 0, streakNow: 0, streakBest: 0,
  level: 2, seconds: 60, t0: 0, total: 0, endAt: 0,
  warm: [], wrongThisRun: [],

  r(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  /* 生成一道口算题 {q, a} */
  gen() {
    const lv = this.level, r = this.r, pick = this.pick;
    let q, a;
    if (lv === 1) {
      const t = pick(['add', 'sub', 'mul', 'div']);
      if (t === 'add') { const x = r(12, 89), y = r(12, 89); q = `${x} + ${y}`; a = x + y; }
      else if (t === 'sub') { const x = r(30, 99), y = r(11, x - 5); q = `${x} − ${y}`; a = x - y; }
      else if (t === 'mul') { const x = r(3, 9), y = r(3, 9); q = `${x} × ${y}`; a = x * y; }
      else { const b = r(3, 9), c = r(3, 9); q = `${b * c} ÷ ${b}`; a = c; }
    } else if (lv === 2) {
      const t = pick(['mul1', 'mul10', 'div10', 'div1', 'add', 'sub']);
      if (t === 'mul1') { const x = r(102, 899), y = r(2, 9); q = `${x} × ${y}`; a = x * y; }
      else if (t === 'mul10') { const x = r(12, 89), y = pick([10, 20, 30, 40, 50]); q = `${x} × ${y}`; a = x * y; }
      else if (t === 'div10') { const y = pick([20, 30, 40, 50]), c = r(3, 19); q = `${y * c} ÷ ${y}`; a = c; }
      else if (t === 'div1') { const y = r(4, 9), c = r(21, 89); q = `${y * c} ÷ ${y}`; a = c; }
      else if (t === 'add') { const x = r(150, 850), y = r(120, 780); q = `${x} + ${y}`; a = x + y; }
      else { const x = r(300, 950), y = r(110, x - 60); q = `${x} − ${y}`; a = x - y; }
    } else {
      const t = pick(['mix', 'mix2', 'mul22']);
      if (t === 'mix') { const x = r(12, 25), y = r(3, 6), z = r(10, 90); q = `${x} × ${y} + ${z}`; a = x * y + z; }
      else if (t === 'mix2') { const x = r(100, 400), y = r(2, 9), z = r(5, 40); q = `${x} ÷ ${y} − ${z}`; a = Math.round(x / y) - z; q = `${y * Math.round(x / y)} ÷ ${y} − ${z}`; }
      else { const x = r(21, 89), y = r(11, 29); q = `${x} × ${y}`; a = x * y; }
    }
    return { q, a };
  },

  /* 生成四个选项（含正确答案） */
  options(ans) {
    const set = new Set([ans]);
    let guard = 0;
    while (set.size < 4 && guard++ < 60) {
      let d;
      const mode = Math.random();
      if (mode < 0.4) d = ans + this.r(1, 12) * (Math.random() < 0.5 ? -1 : 1);
      else if (mode < 0.7 && ans >= 100) { // 数字换位干扰
        const s = String(ans);
        const i = Math.floor(Math.random() * (s.length - 1));
        const arr = s.split('');
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        d = parseInt(arr.join(''), 10);
      } else d = ans + this.r(1, 3) * (Math.random() < 0.5 ? -1 : 1) * Math.max(1, Math.round(ans * 0.1));
      if (d !== ans && d >= 0) set.add(d);
    }
    return shuffle([...set]);
  },

  start() {
    Sound.stopSpeak();
    this.level = (Store.state.math && Store.state.math.level) || 2;
    this.seconds = (Store.state.math && Store.state.math.seconds) || 60;
    this.correct = 0; this.wrong = 0; this.streakNow = 0; this.streakBest = 0; this.total = 0;
    this.endAt = 0;
    this.wrongThisRun = [];
    this.warm = shuffle((Store.state.math && Store.state.math.wrong) || []).slice(0, 5).map(x => ({ q: x.q, a: x.a, fromWrong: true }));
    this.running = true;
    showScreen('quest');
    this.intro();
  },

  intro() {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.progressExit());
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, '🪐'),
      h('div', { class: 'splash-title' }, '口算冲刺！'),
      h('div', { class: 'splash-sub' }, `${this.seconds} 秒 · 时间到自动结算 · 答对越多越好${this.warm.length ? ' · 先收拾几道错题' : ''}`),
      h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); this.countdown(); } }, '出发 →')
    ));
  },

  progressExit() {
    return h('div', { class: 'quest-top' },
      h('button', {
        class: 'quest-exit', onclick: () => confirmModal('退出冲刺？', '本轮成绩将不保存。', () => this.abort())
      }, '✕'),
      h('div', { class: 'quest-prog' }, '🪐 数学星系')
    );
  },

  abort() {
    this.running = false;
    clearInterval(this.timer); clearInterval(this.tickTimer);
    showScreen('home'); renderHome();
  },

  countdown() {
    const root = $('#quest-root');
    let n = 3;
    const show = () => {
      root.innerHTML = '';
      root.appendChild(this.progressExit());
      root.appendChild(h('div', { class: 'card quest-splash' },
        h('div', { class: 'splash-rocket countdown-num' }, n > 0 ? n : 'GO!'),
        n > 0 ? h('div', { class: 'splash-sub' }, '准备……') : ''
      ));
    };
    show();
    const iv = setInterval(() => {
      n--;
      if (n < 0) { clearInterval(iv); this.run(); return; }
      show();
      Sound.tap();
    }, 900);
  },

  nextQuestion() {
    if (this.warm.length) {
      const w = this.warm.shift();
      return { q: w.q, a: w.a, fromWrong: true };
    }
    const g = this.gen();
    return { q: g.q, a: g.a, fromWrong: false };
  },

  run() {
    if (this.endAt && Date.now() >= this.endAt) { this.finish(); return; }
    const root = $('#quest-root');
    root.innerHTML = '';
    this.q = this.nextQuestion();
    if (!this.endAt) this.endAt = Date.now() + this.seconds * 1000;
    const left = Math.max(0, this.endAt - Date.now());
    const remain = h('div', { class: 'math-timebar' }, h('i', { id: 'math-time', style: 'width:' + (left / (this.seconds * 10)) + '%' }));
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => confirmModal('退出冲刺？', '本轮成绩将不保存。', () => this.abort()) }, '✕'),
      remain,
      h('div', { class: 'quest-prog' }, `✅ ${this.correct}`)
    ));
    const opts = this.options(this.q.a);
    const card = h('div', { class: 'card math-card-run' },
      h('div', { class: 'math-q' }, this.q.q, h('span', { class: 'math-eq' }, ' = ?')),
      h('div', { class: 'math-opts' },
        opts.map(o => h('button', {
          class: 'math-opt', 'data-v': o,
          onclick: e => this.answer(o, e.currentTarget)
        }, o))
      ),
      this.q.fromWrong ? h('div', { class: 'tiny center', style: 'margin-top:6px' }, '⚡ 之前的错题，消灭它！') : ''
    );
    root.appendChild(card);
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      const left = Math.max(0, this.endAt - Date.now());
      const bar = document.getElementById('math-time');
      if (bar) bar.style.width = (left / (this.seconds * 10)) + '%';
      if (left <= 0) { clearInterval(this.timer); this.finish(); }
    }, 100);
  },

  answer(v, el) {
    if (!this.running) return;
    this.total++;
    if (v === this.q.a) {
      this.correct++; this.streakNow++;
      this.streakBest = Math.max(this.streakBest, this.streakNow);
      Sound.tap();
      const c = centerOf(el);
      burst(c.x, c.y, { count: 5, colors: ['#58e08a', '#ffd166'], power: 40 });
      if (this.q.fromWrong) Store.clearMathWrong(this.q.q);
    } else {
      this.wrong++; this.streakNow = 0;
      Store.addMistake();
      this.wrongThisRun.push({ q: this.q.q, a: this.q.a });
      Store.addMathWrong(this.q.q, this.q.a);
      Sound.wrong();
      el.classList.add('wrong');
      setTimeout(() => { if (this.running) this.run(); }, 220);
      return;
    }
    this.run();
  },

  finish() {
    this.running = false;
    clearInterval(this.timer); clearInterval(this.tickTimer);
    const r = Store.finishMathRun(this.correct, this.seconds, this.wrongThisRun);
    Sound.coin(); if (r.planetLit) Sound.gold();
    const root = $('#quest-root');
    root.innerHTML = '';
    const card = h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, '🪐'),
      h('div', { class: 'finish-title' }, `答对 ${this.correct} 题！`),
      h('div', { class: 'finish-sub' },
        `最高连对 ${this.streakBest} · 获得 +${r.coinsGain} 🪙` +
        (r.isNewBest ? ' · 🏅新纪录！' : '') +
        (r.planetLit ? ' · 🌟 点亮了一颗新行星！' : '')),
      h('div', { class: 'tiny', style: 'margin-top:4px' },
        `行星进度 ${'🪐'.repeat(r.planets)}${'⚪'.repeat(Math.max(0, 10 - r.planets))}（答对 ≥10 题的冲刺每两次点亮一颗）`),
      this.wrongThisRun.length ? h('div', { class: 'dict-report' },
        h('div', { class: 'tiny', style: 'margin-bottom:4px' }, '本轮错题（下次冲刺优先重练）：'),
        this.wrongThisRun.map(x => h('div', { class: 'pack-row' },
          h('span', {}, x.q + ' = ' + x.a)))
      ) : '',
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.start(); } }, '🚀 再来一轮'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
      )
    );
    root.appendChild(card);
    setTimeout(() => {
      const c = centerOf($('.finish-stamp'));
      burst(c.x, c.y, { count: 24, emojis: ['🪐', '⭐', '✨'], power: 140 });
    }, 300);
  }
};


/* ============================================================
 * 数学练习场：笔算 + 应用题（数字键盘作答，不限时，重准确率）
 * 错题进练习错题池，下次练习优先重练；不计打卡，答对赚金币
 * ============================================================ */
const MathDrill = {
  items: [], idx: 0, correct: 0, input: '',
  names: ['小宇', '小明', '小红', '乐乐', '朵朵', '爸爸', '王老师'],
  goods: [
    { g: '彩笔', unit: '盒', per: '每盒' },
    { g: '笔记本', unit: '本', per: '每本' },
    { g: '气球', unit: '个', per: '每个' },
    { g: '贴纸', unit: '张', per: '每张' },
    { g: '饼干', unit: '包', per: '每包' },
    { g: '魔方', unit: '个', per: '每个' },
    { g: '跳绳', unit: '根', per: '每根' },
    { g: '橡皮', unit: '块', per: '每块' }
  ],

  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  r(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },

  gen() {
    const r = this.r.bind(this), type = this.pick(['mul', 'div', 'app-price', 'app-qty', 'app-speed', 'app-times']);
    if (type === 'mul') {
      const a = r(102, 989), b = r(11, 29);
      return { kind: 'calc', text: `用竖式算：${a} × ${b}`, ans: a * b, tip: `${a} × ${b} = ${a * b}` };
    }
    if (type === 'div') {
      const b = r(12, 49), c = r(11, 89);
      return { kind: 'calc', text: `用竖式算：${b * c} ÷ ${b}`, ans: c, tip: `${b * c} ÷ ${b} = ${c}` };
    }
    const name = this.pick(this.names);
    if (type === 'app-price') {
      const n = r(3, 12), p = r(3, 15), g = this.pick(this.goods);
      return { kind: 'app', text: `${name}买了 ${n} ${g.unit}${g.g}，${g.per} ${p} 元，一共要付多少元？`, ans: n * p, tip: `${n} × ${p} = ${n * p}（元）` };
    }
    if (type === 'app-qty') {
      const p = r(4, 15), c = r(3, 12), g = this.pick(this.goods);
      return { kind: 'app', text: `${name}有 ${p * c} 元，${g.g}${g.per} ${p} 元，最多能买多少 ${g.unit}？`, ans: c, tip: `${p * c} ÷ ${p} = ${c}（${g.unit}）` };
    }
    if (type === 'app-speed') {
      const v = r(6, 40) * 5, t = r(4, 12);
      return { kind: 'app', text: `${name}骑自行车每分钟行 ${v} 米，照这样的速度，${t} 分钟能行多少米？`, ans: v * t, tip: `${v} × ${t} = ${v * t}（米）` };
    }
    const a = r(12, 60), k = r(2, 5);
    return { kind: 'app', text: `果园里有 ${a} 棵苹果树，梨树的棵数是苹果树的 ${k} 倍，梨树有多少棵？`, ans: a * k, tip: `${a} × ${k} = ${a * k}（棵）` };
  },

  start() {
    Sound.stopSpeak();
    const wrongP = (Store.state.math.wrongP || []).slice();
    const items = shuffle(wrongP).slice(0, 2).map(x => ({ kind: 'app', text: x.q, ans: x.a, tip: x.tip, fromWrong: true }));
    while (items.length < 5) items.push(Object.assign(this.gen(), { fromWrong: false }));
    this.items = items;
    this.idx = 0;
    this.correct = 0;
    this.input = '';
    showScreen('quest');
    this.renderIntro();
  },

  renderIntro() {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, '📐 练习场')
    ));
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, '📐'),
      h('div', { class: 'splash-title' }, '数学练习场'),
      h('div', { class: 'splash-sub' }, `5 道题 · 笔算和应用题 · 不计时，答对每题 +5 🪙${this.items.some(i => i.fromWrong) ? ' · 含之前的错题' : ''}`),
      h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); this.next(); } }, '开始 →')
    ));
  },

  next() {
    if (this.idx >= this.items.length) { this.finish(); return; }
    const item = this.items[this.idx];
    this.current = item;
    this.input = '';
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, `${this.idx + 1} / ${this.items.length}`)
    ));
    const inputEl = h('div', { class: 'drill-input' }, '_');
    const refresh = () => {
      inputEl.textContent = this.input === '' ? '_' : this.input;
      inputEl.classList.toggle('filled', this.input !== '');
    };
    const key = d => {
      Sound.tap();
      if (d === 'del') this.input = this.input.slice(0, -1);
      else if (d === 'ok') { this.check(item); return; }
      else if (this.input.length < 7) this.input += d;
      refresh();
    };
    const pad = h('div', { class: 'drill-pad' },
      '1234567890'.split('').map(d => h('button', { class: 'drill-key', onclick: () => key(d) }, d)),
      h('button', { class: 'drill-key wide', onclick: () => key('del') }, '⌫'),
      h('button', { class: 'drill-key ok', onclick: () => key('ok') }, '✔')
    );
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, item.kind === 'app' ? '应用题' : '笔算题'),
      h('div', { class: 'drill-text' }, item.text),
      item.fromWrong ? h('div', { class: 'tiny center', style: 'margin-top:4px' }, '⚡ 之前的错题，消灭它！') : '',
      inputEl,
      pad
    ));
  },

  check(item) {
    const root = $('#quest-root');
    const ok = this.input !== '' && parseInt(this.input, 10) === item.ans;
    if (ok) {
      this.correct++;
      Store.addCoins(5);
      Sound.correct();
    } else {
      Store.addPracticeWrong(item);
      Sound.wrong();
    }
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, `${this.idx + 1} / ${this.items.length}`)
    ));
    root.appendChild(h('div', { class: 'card spell-card center' },
      h('div', { class: 'intro-emoji', style: ok ? '' : 'filter:grayscale(1) opacity(.55)' }, item.kind === 'app' ? '📖' : '✖️'),
      h('div', { class: 'mz-word' }, ok ? '答对了！+5 🪙' : '再看一遍'),
      h('div', { class: 'drill-text', style: 'margin-top:8px' }, item.text),
      h('div', { class: 'intro-zh', style: 'margin-top:8px' }, ok ? (item.tip || '') : `正确答案：${item.tip || item.ans}`),
      h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); this.idx++; this.next(); } }, this.idx + 1 >= this.items.length ? '看成绩 →' : '下一题 →')
    ));
  },

  finish() {
    const root = $('#quest-root');
    root.innerHTML = '';
    const card = h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, '📐'),
      h('div', { class: 'finish-title' }, `练习完成 ${this.correct}/${this.items.length}`),
      h('div', { class: 'finish-sub' }, `获得 +${this.correct * 5} 🪙`),
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.start(); } }, '再来一组'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
      )
    );
    root.appendChild(card);
    const c = centerOf($('.finish-stamp'));
    burst(c.x, c.y, { count: 20, emojis: ['📐', '⭐', '✨'], power: 120 });
  }
};
