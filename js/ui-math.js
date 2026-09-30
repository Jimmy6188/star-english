/* ============================================================
 * 星际英语站 - 数学星系：限时口算冲刺
 * 程序生成题目（按难度档），答对进金币、错题进数学错题池
 * 冲刺达标点亮行星；打卡/金币/宠物与英语共享
 * ============================================================ */

const MathSprint = {
  running: false, timer: null, tickTimer: null,
  correct: 0, wrong: 0, streakNow: 0, streakBest: 0,
  level: 2, seconds: 60, t0: 0, total: 0,
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
      h('div', { class: 'splash-sub' }, `${this.seconds} 秒 · 答对越多越好${this.warm.length ? ' · 先收拾几道错题' : ''}`),
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
    const root = $('#quest-root');
    root.innerHTML = '';
    this.q = this.nextQuestion();
    this.t0 = Date.now();
    const remain = h('div', { class: 'math-timebar' }, h('i', { id: 'math-time' }));
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
    const endTime = this.t0 + this.seconds * 1000;
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      const left = Math.max(0, endTime - Date.now());
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
      setTimeout(() => this.run(), 220);
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
