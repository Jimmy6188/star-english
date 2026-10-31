/* ============================================================
 * 星际求知号 - 数学星系：限时口算冲刺
 * 程序生成题目（按难度档），答对进金币、错题进数学错题池
 * 冲刺达标点亮行星；打卡/金币/宠物与英语共享
 * ============================================================ */

const MathSprint = {
  running: false, timer: null, tickTimer: null, cdTimer: null, ansLock: false,
  correct: 0, wrong: 0, streakNow: 0, streakBest: 0,
  level: 2, seconds: 60, t0: 0, total: 0, endAt: 0,
  warm: [], wrongThisRun: [],

  r(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  /* 生成一道口算题 {q, a} */
  /* v36 难度调整：核心档（lv2）加强——去掉"12×10"这类一眼题，加入三位数除以一位数、
   * 两位数乘整十、四位数加减；挑战档（lv3）放缓——两步混合用友好数字，
   * 两位×两位只出 11/12/15/21/25 这类有巧算空间的因数 */
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
      const t = pick(['mul1', 'mulT', 'divT', 'div2', 'add', 'sub', 'add4']);
      if (t === 'mul1') { const x = r(102, 899), y = r(3, 9); q = `${x} × ${y}`; a = x * y; }
      else if (t === 'mulT') { const x = r(21, 89), y = pick([20, 30, 40, 50]); q = `${x} × ${y}`; a = x * y; }
      else if (t === 'divT') { const y = pick([20, 30, 40, 60, 80]), c = r(3, 19); q = `${y * c} ÷ ${y}`; a = c; }
      else if (t === 'div2') { const y = r(3, 9), c = r(15, Math.min(99, Math.floor(999 / y))); q = `${y * c} ÷ ${y}`; a = c; }
      else if (t === 'add') { const x = r(150, 850), y = r(120, 780); q = `${x} + ${y}`; a = x + y; }
      else if (t === 'sub') { const x = r(300, 950), y = r(110, x - 60); q = `${x} − ${y}`; a = x - y; }
      else { const x = r(1200, 8999), y = r(1100, 7800); q = `${x} + ${y}`; a = x + y; }
    } else {
      const t = pick(['mix', 'mix2', 'mul22', 'mix3', 'mul11']);
      if (t === 'mix') { const x = r(12, 25), y = r(3, 6), z = r(10, 90); q = `${x} × ${y} + ${z}`; a = x * y + z; }
      else if (t === 'mix2') { const y = r(2, 9), c = r(12, 40), z = r(5, Math.min(30, c - 2)); q = `${y * c} ÷ ${y} − ${z}`; a = c - z; }
      else if (t === 'mul22') { const x = r(21, 89), y = pick([11, 12, 15, 21, 25]); q = `${x} × ${y}`; a = x * y; }
      else if (t === 'mix3') { const x = r(120, 860), y = r(110, 780), z = r(100, Math.max(110, Math.min(690, x + y - 20))); q = `${x} + ${y} − ${z}`; a = x + y - z; }
      else { const x = r(23, 89); q = `${x} × 11`; a = x * 11; }
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
    setQuestSub('var(--accent)');
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
      }, icon('x')),
      h('div', { class: 'quest-prog' }, '🪐 数学星系')
    );
  },

  abort() {
    this.running = false;
    clearInterval(this.timer); clearInterval(this.tickTimer); clearInterval(this.cdTimer);
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
    clearInterval(this.cdTimer);
    this.cdTimer = setInterval(() => {
      n--;
      if (n < 0) { clearInterval(this.cdTimer); if (this.running) this.run(); return; }
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
    if (!this.running) return; /* 已退出/已结算就不再开跑（防止倒计时残留回调在后台开考） */
    if (this.endAt && Date.now() >= this.endAt) { this.finish(); return; }
    this.ansLock = false;
    const root = $('#quest-root');
    root.innerHTML = '';
    this.q = this.nextQuestion();
    if (!this.endAt) this.endAt = Date.now() + this.seconds * 1000;
    const left = Math.max(0, this.endAt - Date.now());
    const remain = h('div', { class: 'math-timebar' }, h('i', { id: 'math-time', style: 'width:' + (left / (this.seconds * 10)) + '%' }));
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => confirmModal('退出冲刺？', '本轮成绩将不保存。', () => this.abort()) }, icon('x')),
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
    if (!this.running || this.ansLock) return; /* 锁答：判错后的 220ms 里再点不重复计分 */
    this.ansLock = true;
    this.total++;
    if (v === this.q.a) {
      this.correct++; this.streakNow++;
      this.streakBest = Math.max(this.streakBest, this.streakNow);
      Sound.tap();
      const c = centerOf(el);
      burst(c.x, c.y, { count: 5, colors: ['#58e08a', '#ffd166'], power: 40 });
      /* 错题闭环（v40）：冲刺里打掉的老错题当场清零并给个小奖励 */
      if (this.q.fromWrong) {
        Store.clearMathWrong(this.q.q);
        Store.addCoins(1);
        toast('🎉 老错题清零 +1 🪙');
      }
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
    updateTop(); // 结算页立刻同步顶栏金币
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
        ((Store.state.today.mint.sprint || 0) > 1 ? '（今日重刷，奖励减半）' : '') +
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
    const r = this.r.bind(this), type = this.pick(['mul', 'div', 'app-price', 'app-qty', 'app-speed', 'app-times', 'unit', 'peri', 'area', 'app2']);
    if (type === 'mul') {
      const a = r(102, 989), b = r(11, 29);
      return { kind: 'calc', text: `用竖式算：${a} × ${b}`, ans: a * b, tip: `${a} × ${b} = ${a * b}` };
    }
    if (type === 'div') {
      const b = r(12, 49), c = r(11, 89);
      return { kind: 'calc', text: `用竖式算：${b * c} ÷ ${b}`, ans: c, tip: `${b * c} ÷ ${b} = ${c}` };
    }
    /* v40：两步应用题也混进普通练习场（1/10 概率） */
    if (type === 'app2') return this.genApp2();
    /* v36：单位换算（长度/质量/面积，正反两个方向） */
    if (type === 'unit') {
      const pairs = [['千米', '米', 1000], ['米', '分米', 10], ['米', '厘米', 100], ['厘米', '毫米', 10],
        ['千克', '克', 1000], ['吨', '千克', 1000], ['平方米', '平方分米', 100], ['平方分米', '平方厘米', 100]];
      const [big, small, k] = this.pick(pairs);
      const n = k >= 1000 ? r(2, 9) : r(2, 40);
      if (Math.random() < 0.5) {
        return { kind: 'calc', text: `单位换算：${n} ${big} = ＿ ${small}`, ans: n * k, tip: `1 ${big} = ${k} ${small}，${n} × ${k} = ${n * k}（${small}）` };
      }
      return { kind: 'calc', text: `单位换算：${n * k} ${small} = ＿ ${big}`, ans: n, tip: `${k} ${small} = 1 ${big}，${n * k} ÷ ${k} = ${n}（${big}）` };
    }
    /* v36：图形周长（长方形/正方形） */
    if (type === 'peri') {
      if (Math.random() < 0.5) {
        const a = r(4, 25), b = r(3, 20);
        return { kind: 'app', text: `一个长方形长 ${a} 厘米、宽 ${b} 厘米，周长是多少厘米？`, ans: 2 * (a + b), tip: `长方形周长 =（长＋宽）× 2 =（${a}＋${b}）× 2 = ${2 * (a + b)}（厘米）` };
      }
      const s2 = r(3, 15);
      return { kind: 'app', text: `一个正方形的边长是 ${s2} 米，周长是多少米？`, ans: 4 * s2, tip: `正方形周长 = 边长 × 4 = ${s2} × 4 = ${4 * s2}（米）` };
    }
    /* v36：图形面积（长方形/正方形） */
    if (type === 'area') {
      if (Math.random() < 0.5) {
        const a = r(4, 15), b = r(3, 12);
        return { kind: 'app', text: `一块长方形菜地长 ${a} 米、宽 ${b} 米，面积是多少平方米？`, ans: a * b, tip: `长方形面积 = 长 × 宽 = ${a} × ${b} = ${a * b}（平方米）` };
      }
      const s3 = r(3, 12);
      return { kind: 'app', text: `一个正方形手帕边长 ${s3} 分米，面积是多少平方分米？`, ans: s3 * s3, tip: `正方形面积 = 边长 × 边长 = ${s3} × ${s3} = ${s3 * s3}（平方分米）` };
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

  /* v40 两步应用题出题器（应用题专项 + BOSS 拔高共用）：
   * 全部是已学计算的"变式与迁移"——归一 / 进一法 / 连乘 / 返程速度 / 付钱找零 / 倍数比多比一共 */
  genApp2() {
    const r = this.r.bind(this), name = this.pick(this.names), g = this.pick(this.goods);
    const type = this.pick(['guiyi', 'rent', 'liancheng', 'return', 'change', 'beibi']);
    if (type === 'guiyi') { /* 归一问题：先除后乘 */
      const per = r(3, 9), n1 = r(3, 6), n2 = r(4, 9);
      return { kind: 'app', text: `${n1} ${g.unit}${g.g}一共 ${per * n1} 元，照这样算，${g.per} ${per} 元，买 ${n2} ${g.unit}要多少元？`,
        ans: per * n2, tip: `先算${g.per}多少元：${per * n1} ÷ ${n1} = ${per}（元）；再算 ${per} × ${n2} = ${per * n2}（元）` };
    }
    if (type === 'rent') { /* 租船问题：进一法 */
      const per = r(4, 8), boats = r(6, 12), people = per * boats + r(1, per - 1);
      return { kind: 'app', text: `${people} 名同学去春游，每条船最多坐 ${per} 人，至少要租多少条船？`,
        ans: Math.ceil(people / per), tip: `${people} ÷ ${per} = ${Math.floor(people / per)}（条）余 ${people % per}，剩下 ${people % per} 人也要坐一条船，所以要 ${Math.ceil(people / per)} 条（进一法）` };
    }
    if (type === 'liancheng') { /* 连乘应用 */
      const a = r(2, 5), b = r(3, 6), c = r(4, 9);
      return { kind: 'app', text: `每箱橘子有 ${b} 袋，每袋有 ${c} 个，${a} 箱橘子一共有多少个？`,
        ans: a * b * c, tip: `先算一箱多少个：${b} × ${c} = ${b * c}（个）；再算 ${b * c} × ${a} = ${a * b * c}（个）` };
    }
    if (type === 'return') { /* 返程速度：路程不变，t2 整除 t1 保证整数解 */
      const t1 = this.pick([4, 6, 8]), t2 = t1 === 6 ? this.pick([2, 3]) : t1 / 2;
      const v = r(6, 15) * 10;
      const dist = v * t1, v2 = dist / t2;
      return { kind: 'app', text: `一列火车去时每小时行 ${v} 千米，${t1} 小时到达。沿原路返回只用了 ${t2} 小时，返回时平均每小时行多少千米？`,
        ans: v2, tip: `总路程不变：${v} × ${t1} = ${dist}（千米）；返回速度 = ${dist} ÷ ${t2} = ${v2}（千米/时）` };
    }
    if (type === 'change') { /* 付钱找零：先乘后减 */
      const n = r(3, 6), p = r(6, 18), change = r(2, 30), pay = n * p + change;
      return { kind: 'app', text: `${name}买了 ${n} 支钢笔，每支 ${p} 元，付了 ${pay} 元，应找回多少元？`,
        ans: change, tip: `先算一共多少元：${n} × ${p} = ${n * p}（元）；再算找回：${pay} − ${n * p} = ${change}（元）` };
    }
    /* 倍数比多 / 比一共 */
    const a = r(12, 40), k = r(2, 5);
    if (Math.random() < 0.5) {
      return { kind: 'app', text: `果园里有 ${a} 棵苹果树，梨树的棵数是苹果树的 ${k} 倍，梨树比苹果树多多少棵？`,
        ans: a * k - a, tip: `梨树：${a} × ${k} = ${a * k}（棵）；比苹果树多：${a * k} − ${a} = ${a * k - a}（棵）` };
    }
    return { kind: 'app', text: `果园里有 ${a} 棵苹果树，梨树的棵数是苹果树的 ${k} 倍，梨树和苹果树一共有多少棵？`,
      ans: a * k + a, tip: `梨树：${a} × ${k} = ${a * k}（棵）；一共：${a * k} + ${a} = ${a * k + a}（棵）` };
  },

  start(mode) {
    Sound.stopSpeak();
    this.appMode = mode === 'app'; /* 应用题专项：全应用题，两步为主 */
    const wrongP = (Store.state.math.wrongP || []).slice();
    const items = shuffle(wrongP).slice(0, 2).map(x => ({ kind: 'app', text: x.q, ans: x.a, tip: x.tip, fromWrong: true }));
    const target = this.appMode ? 6 : 5;
    while (items.length < target) {
      if (this.appMode) items.push(Object.assign(this.genApp2(), { fromWrong: false }));
      else items.push(Object.assign(this.gen(), { fromWrong: false }));
    }
    this.items = items;
    this.idx = 0;
    this.correct = 0;
    this.input = '';
    setQuestSub('var(--accent)');
    showScreen('quest');
    this.renderIntro();
  },

  renderIntro() {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, this.appMode ? '🧮 应用题专项' : '📐 练习场')
    ));
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, this.appMode ? '🧮' : '📐'),
      h('div', { class: 'splash-title' }, this.appMode ? '应用题专项' : '数学练习场'),
      h('div', { class: 'splash-sub' }, this.appMode
        ? `${this.items.length} 道应用题 · 两步计算 · 生活情境 · 不计时 · 答对的老错题当场清零`
        : `${this.items.length} 道题 · 笔算 · 应用 · 单位换算 · 图形周长面积 · 不计时 · 首刷全额，当天重刷减半${this.items.some(i => i.fromWrong) ? ' · 含之前的错题' : ''}`),
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
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, icon('x')),
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
      Sound.correct();
      /* 错题闭环（v40）：练习场老错题答对即出本 */
      if (item.fromWrong) {
        Store.clearPracticeWrong(item.text);
        Store.addCoins(1);
        toast('🎉 老错题清零 +1 🪙');
      }
    } else {
      Store.addPracticeWrong(item);
      Sound.wrong();
    }
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, `${this.idx + 1} / ${this.items.length}`)
    ));
    root.appendChild(h('div', { class: 'card spell-card center' },
      h('div', { class: 'intro-emoji', style: ok ? '' : 'filter:grayscale(1) opacity(.55)' }, ok ? '🎉' : (item.kind === 'app' ? '📖' : '🧮')),
      h('div', { class: 'mz-word' }, ok ? '答对了！' : '再看一遍'),
      h('div', { class: 'drill-text', style: 'margin-top:8px' }, item.text),
      h('div', { class: 'intro-zh', style: 'margin-top:8px' }, ok ? (item.tip || '') : `正确答案：${item.tip || item.ans}`),
      h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); this.idx++; this.next(); } }, this.idx + 1 >= this.items.length ? '看成绩 →' : '下一题 →')
    ));
  },

  finish() {
    updateTop(); // 结算页立刻同步顶栏金币
    const gain = Store.finishPracticeRun(this.correct);
    const root = $('#quest-root');
    root.innerHTML = '';
    const card = h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, '📐'),
      h('div', { class: 'finish-title' }, `练习完成 ${this.correct}/${this.items.length}`),
      h('div', { class: 'finish-sub' }, `获得 +${gain} 🪙${(Store.state.today.mint.practice || 0) > 1 ? '（今日重刷，奖励减半）' : ''}`),
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
