/* ============================================================
 * 星际求知号 - 数学思维挑战场（拔高加餐）
 * 找规律 / 巧算 / 周期 / 鸡兔同笼 / 24点 / 年龄 / 和差 / 爬井 / 锯木头 / 星期周期
 * v36：老题型加难（二阶等差、斐波那契、连减凑整、×99…），新增 5 类应用题；
 * 每轮从 10 类里随机抽 5 题。5 题一组不计时，答对每题 +5 🪙 全对再 +8；首刷全额、重刷递减
 * ============================================================ */

const MathThink = {
  items: [], idx: 0, correct: 0, input: '',

  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  r(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },

  /* ---------- 出题器：每题 {kind:'input'|'choice', text, ans, tip, opts?, ansIdx?} ---------- */

  /* 找规律：等差 / 二阶等差 / ×2 / ×3 / 斐波那契 / 递减 */
  genSeq() {
    const kind = this.pick(['add', 'add2', 'geo', 'geo3', 'fib', 'sub']);
    if (kind === 'add') {
      const s = this.r(1, 15), d = this.r(3, 9);
      const seq = [0, 1, 2, 3].map(i => s + i * d);
      const ans = s + 4 * d;
      return { kind: 'input', text: `找规律填数：${seq.join('，')}，＿＿`, ans, tip: `每次多 ${d}：${seq[3]} + ${d} = ${ans}` };
    }
    if (kind === 'add2') {
      const s = this.r(2, 20), d = this.r(2, 6);
      const seq = [s, s + d, s + 2 * d + 2, s + 3 * d + 6, s + 4 * d + 12];
      const ans = s + 5 * d + 20;
      return { kind: 'input', text: `找规律填数：${seq.join('，')}，＿＿`, ans, tip: `相邻两数的差每次多 2：${d}、${d + 2}、${d + 4}、${d + 6}，下一个差是 ${d + 8}，${seq[4]} + ${d + 8} = ${ans}` };
    }
    if (kind === 'geo') {
      const s = this.r(1, 4);
      const seq = [s, s * 2, s * 4, s * 8];
      const ans = s * 16;
      return { kind: 'input', text: `找规律填数：${seq.join('，')}，＿＿`, ans, tip: `每次 ×2：${seq[3]} × 2 = ${ans}` };
    }
    if (kind === 'geo3') {
      const s = this.r(1, 3);
      const seq = [s, s * 3, s * 9, s * 27];
      const ans = s * 81;
      return { kind: 'input', text: `找规律填数：${seq.join('，')}，＿＿`, ans, tip: `每次 ×3：${seq[3]} × 3 = ${ans}` };
    }
    if (kind === 'fib') {
      const a = this.r(1, 4), b = this.r(2, 6);
      const seq = [a, b, a + b, a + 2 * b, 2 * a + 3 * b];
      const ans = 3 * a + 5 * b;
      return { kind: 'input', text: `找规律填数：${seq.join('，')}，＿＿`, ans, tip: `前两个数相加等于后一个：${seq[3]} + ${seq[4]} = ${ans}` };
    }
    const s = this.r(60, 130), d = this.r(3, 9);
    const seq = [s, s - d, s - 2 * d, s - 3 * d];
    const ans = s - 4 * d;
    return { kind: 'input', text: `找规律填数：${seq.join('，')}，＿＿`, ans, tip: `每次少 ${d}：${seq[3]} − ${d} = ${ans}` };
  },

  /* 巧算：凑整 / 加 99 / 减 198 / 25×4 / 连减凑整 / ×99 / 125×8 */
  genClever() {
    const kind = this.pick(['sum100', 'add99', 'sub198', 'mul25', 'sub2', 'mul99', 'mul125']);
    if (kind === 'sum100') {
      const a = this.r(12, 88), c = this.r(15, 85), b = 100 - a;
      return { kind: 'input', text: `巧算：${a} + ${c} + ${b} = ?`, ans: 100 + c, tip: `${a} + ${b} = 100，100 + ${c} = ${100 + c}` };
    }
    if (kind === 'add99') {
      const p = this.pick([99, 98]), sub = 100 - p, n = this.r(23, 287);
      return { kind: 'input', text: `巧算：${p} + ${n} = ?`, ans: p + n, tip: `${p} + ${n} = 100 + ${n} − ${sub} = ${p + n}` };
    }
    if (kind === 'sub198') {
      const a = this.r(320, 900), p = this.pick([198, 199, 197]), sub = 200 - p;
      return { kind: 'input', text: `巧算：${a} − ${p} = ?`, ans: a - p, tip: `${a} − ${p} = ${a} − 200 + ${sub} = ${a - p}` };
    }
    if (kind === 'mul25') {
      const k = this.r(3, 9);
      return { kind: 'input', text: `巧算：25 × 4 × ${k} = ?`, ans: 100 * k, tip: `25 × 4 = 100，100 × ${k} = ${100 * k}` };
    }
    if (kind === 'sub2') {
      const a = this.r(320, 940), b = this.r(25, 75), c = 100 - b;
      return { kind: 'input', text: `巧算：${a} − ${b} − ${c} = ?`, ans: a - 100, tip: `连减可以先把后两个相加：${b} + ${c} = 100，${a} − 100 = ${a - 100}` };
    }
    if (kind === 'mul99') {
      const a = this.r(13, 89);
      return { kind: 'input', text: `巧算：${a} × 99 = ?`, ans: a * 99, tip: `${a} × 99 = ${a} × 100 − ${a} = ${a * 100} − ${a} = ${a * 99}` };
    }
    const k = this.r(3, 9), m = 8 * k;
    return { kind: 'input', text: `巧算：125 × ${m} = ?`, ans: 1000 * k, tip: `125 × 8 = 1000，所以 125 × ${m} = 125 × 8 × ${k} = ${1000 * k}` };
  },

  /* 周期问题：按规律排图形，问第 N 个 */
  genCycle() {
    const sets = [['🌙', '⭐', '☀️'], ['🍎', '🍌', '🍇', '🍉'], ['🚗', '🚌', '🚲'], ['🔴', '🔵', '🟡']];
    const set = this.pick(sets);
    const period = set.length;
    const shown = set.concat(set, set);
    const n = period * this.r(3, 6) + this.r(1, period);
    const ansEmoji = shown[(n - 1) % period];
    const rem = n % period;
    return {
      kind: 'choice', text: `彩灯按规律亮：${shown.join(' ')} ……\n第 ${n} 盏是什么？`,
      opts: set, ansIdx: set.indexOf(ansEmoji),
      tip: `${period} 盏一循环：${n} ÷ ${period} = ${Math.floor(n / period)} 组余 ${rem}，${rem === 0 ? `整除说明是每组的最后一盏（${set[period - 1]}）` : `余 ${rem} 就是组里的第 ${rem} 盏（${ansEmoji}）`}`
    };
  },

  /* 鸡兔同笼（假设法） */
  genJitu() {
    const rabbits = this.r(2, 8), chickens = this.r(1, 9);
    const heads = rabbits + chickens, legs = rabbits * 4 + chickens * 2;
    return {
      kind: 'input',
      text: `鸡兔同笼：上有 ${heads} 个头，下有 ${legs} 条腿，兔有 ＿＿ 只。`,
      ans: rabbits,
      tip: `假设全是鸡：${heads} × 2 = ${heads * 2} 条腿，少了 ${legs - heads * 2} 条；每只兔比鸡多 2 条腿，所以兔有 ${legs - heads * 2} ÷ 2 = ${rabbits} 只。`
    };
  },

  /* ---------- v36 新题型 ---------- */

  /* 年龄问题：年龄差不变 */
  genAge() {
    const name = this.pick(['小明', '小红', '乐乐', '朵朵', '小宇']);
    const a = this.r(7, 12);
    if (Math.random() < 0.5) {
      const d = this.r(24, 32), y = this.r(3, 9);
      return {
        kind: 'input',
        text: `${name}今年 ${a} 岁，爸爸比${name}大 ${d} 岁。${y} 年后爸爸多少岁？`,
        ans: a + d + y,
        tip: `年龄差永远不变：爸爸今年 ${a} + ${d} = ${a + d} 岁，${y} 年后再加 ${y} 岁，是 ${a + d + y} 岁。`
      };
    }
    const k = this.r(5, 8);
    return {
      kind: 'input',
      text: `${name}今年 ${a} 岁，爷爷的年龄正好是${name}的 ${k} 倍。爷爷今年多少岁？`,
      ans: a * k,
      tip: `${a} × ${k} = ${a * k}（岁）。`
    };
  },

  /* 和差问题 */
  genSumDiff() {
    const small = this.r(8, 20), diff = this.r(1, 6) * 2;
    const sum = small * 2 + diff, big = small + diff;
    return {
      kind: 'input',
      text: `哥哥和弟弟一共有 ${sum} 张邮票，哥哥比弟弟多 ${diff} 张。哥哥有多少张？`,
      ans: big,
      tip: `和差问题：（${sum} + ${diff}）÷ 2 = ${big}（张）。也可以想：哥哥拿出 ${diff / 2} 张给弟弟两人就一样多。`
    };
  },

  /* 蜗牛爬井：最后一天爬出井口不再下滑 */
  genSnail() {
    const u = this.r(3, 5), d = this.r(1, u - 1);
    const top = u + this.r(2, 5) * (u - d) + this.r(1, u - 1);
    const rest = top - u;
    const pre = Math.ceil(rest / (u - d));
    const days = pre + 1;
    return {
      kind: 'input',
      text: `一只蜗牛从井底往上爬，白天爬上 ${u} 米，晚上滑下 ${d} 米。井深 ${top} 米，第几天能爬出井口？`,
      ans: days,
      tip: `最后一天白天直接爬出井口，不再下滑。前面的日子每天净爬 ${u} − ${d} = ${u - d} 米：(${top} − ${u}) ÷ ${u - d}，有余数就再加 1 天，得 ${pre} 天，再加最后 1 天：第 ${days} 天。`
    };
  },

  /* 锯木头：段数 − 1 = 锯的次数 */
  genCut() {
    const p = this.r(2, 5), segA = this.r(3, 6), segB = segA + this.r(2, 4);
    return {
      kind: 'input',
      text: `把一根木头锯成 ${segA} 段要 ${p * (segA - 1)} 分钟。照这样的速度，锯成 ${segB} 段要多少分钟？`,
      ans: p * (segB - 1),
      tip: `锯成 ${segA} 段只要锯 ${segA - 1} 次，每次 ${p} 分钟；锯成 ${segB} 段要锯 ${segB - 1} 次：${p} × ${segB - 1} = ${p * (segB - 1)}（分钟）。`
    };
  },

  /* 星期周期：周期问题的日期版 */
  genWeek() {
    const NAMES = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '日' };
    const w0 = this.r(1, 7);
    const n = 7 * this.r(2, 8) + this.r(1, 6);
    const w = ((w0 - 1 + n) % 7) + 1;
    return {
      kind: 'choice',
      text: `今天是星期${NAMES[w0]}，再过 ${n} 天是星期几？`,
      opts: ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
      ansIdx: w - 1,
      tip: `7 天一循环：${n} ÷ 7 = ${Math.floor(n / 7)} 组余 ${n % 7}，从星期${NAMES[w0]}往后数 ${n % 7} 天，就是星期${NAMES[w]}。`
    };
  },

  buildRound() {
    /* 10 类题打乱抽 5，每轮组合都不一样 */
    const gens = [this.genSeq(), this.genClever(), this.genCycle(), this.genJitu(), this.gen24(),
      this.genAge(), this.genSumDiff(), this.genSnail(), this.genCut(), this.genWeek()];
    return shuffle(gens).slice(0, 5);
  },

  /* 24 点（选择式）：3 个数配运算符，选出结果是 24 的算式 */
  gen24() {
    const OPS = [['+', (a, b) => a + b], ['−', (a, b) => a - b], ['×', (a, b) => a * b], ['÷', (a, b) => (b !== 0 && a % b === 0 ? a / b : null)]];
    for (let t = 0; t < 80; t++) {
      const ns = [this.r(1, 9), this.r(1, 9), this.r(1, 9)];
      const exprs = [];
      for (const [o1i, o2i] of [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3], [2, 0], [3, 0], [2, 1], [3, 1]]) {
        const [o1, f1] = OPS[o1i], [o2, f2] = OPS[o2i];
        for (const [x, y, z] of [[0, 1, 2], [1, 2, 0]]) {
          const m = f1(ns[x], ns[y]);
          if (m === null || m < 0) continue;
          const v = f2(m, ns[z]);
          if (v === null || v < 0) continue;
          const needP = !((o1 === '×' || o1 === '÷') && (o2 === '×' || o2 === '÷'));
          const text = needP ? `(${ns[x]} ${o1} ${ns[y]}) ${o2} ${ns[z]}` : `${ns[x]} ${o1} ${ns[y]} ${o2} ${ns[z]}`;
          if (!exprs.some(e => e.text === text)) exprs.push({ text, v });
        }
      }
      const corr = exprs.filter(e => e.v === 24);
      const wrongs = exprs.filter(e => e.v !== 24);
      if (!corr.length || wrongs.length < 3) continue;
      const c = this.pick(corr);
      const ws = shuffle(wrongs).slice(0, 3);
      const opts = shuffle([c.text, ...ws.map(e => e.text)]);
      return {
        kind: 'choice',
        text: '24 点挑战：下面哪个算式的结果是 24？',
        opts, ansIdx: opts.indexOf(c.text),
        tip: `${c.text} = 24；其它三个算式的结果都不是 24（${ws.map(e => `${e.text}=${e.v}`).join('，')}）。`
      };
    }
    /* 保底题 */
    return {
      kind: 'choice',
      text: '24 点挑战：下面哪个算式的结果是 24？',
      opts: ['8 + 3 + 1', '(8 × 3) × 1', '8 × 3 + 1', '8 × 3 − 1'], ansIdx: 1,
      tip: '(8 × 3) × 1 = 24；其余分别等于 12、25、23。'
    };
  },

  /* ---------- 流程 ---------- */
  start() {
    Sound.stopSpeak();
    this.items = this.buildRound();
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
      h('div', { class: 'quest-prog' }, '🧠 思维挑战场')
    ));
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, '🧠'),
      h('div', { class: 'splash-title' }, '思维挑战场！'),
      h('div', { class: 'splash-sub' }, '5 道烧脑题 · 找规律 / 巧算 / 周期 / 鸡兔同笼 / 年龄 / 和差 / 爬井 / 锯木头…每轮随机 5 类 · 答对每题 +5 🪙，全对再 +8'),
      h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); this.next(); } }, '出发 →')
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
    const card = h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, '🧠 思维挑战'),
      h('div', { class: 'drill-text', style: 'text-align:left;white-space:pre-line' }, item.text)
    );
    if (item.kind === 'input') {
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
      card.appendChild(inputEl);
      card.appendChild(h('div', { class: 'drill-pad' },
        '1234567890'.split('').map(d => h('button', { class: 'drill-key', onclick: () => key(d) }, d)),
        h('button', { class: 'drill-key wide', onclick: () => key('del') }, '⌫'),
        h('button', { class: 'drill-key ok', onclick: () => key('ok') }, '✔')
      ));
    } else {
      const optsEl = h('div', { class: 'cn-opts' });
      item.opts.forEach((t, i) => {
        optsEl.appendChild(h('button', {
          class: 'cn-opt', 'data-i': String(i),
          onclick: e => {
            if (this.done) return;
            this.checkChoice(item, i, optsEl, e.currentTarget);
          }
        }, t));
      });
      card.appendChild(optsEl);
      this.done = false;
    }
    root.appendChild(card);
  },

  revealCard(item, ok) {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, `${this.idx + 1} / ${this.items.length}`)
    ));
    root.appendChild(h('div', { class: 'card spell-card center' },
      h('div', { class: 'intro-emoji', style: ok ? '' : 'filter:grayscale(1) opacity(.55)' }, ok ? '🎉' : '💡'),
      h('div', { class: 'mz-word' }, ok ? '答对了！' : '看看思路'),
      h('div', { class: 'intro-zh', style: 'margin-top:8px;line-height:1.8' }, item.tip),
      h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); this.idx++; this.next(); } }, this.idx + 1 >= this.items.length ? '看成绩 →' : '下一题 →')
    ));
  },

  check(item) {
    const ok = this.input !== '' && parseInt(this.input, 10) === item.ans;
    if (ok) { this.correct++; Sound.correct(); } else Sound.wrong();
    this.revealCard(item, ok);
  },

  checkChoice(item, i, optsEl, el) {
    const ok = i === item.ansIdx;
    this.done = true;
    if (ok) {
      this.correct++;
      Sound.correct();
      el.classList.add('right');
      const c = centerOf(el);
      burst(c.x, c.y, { count: 8, colors: ['#58e08a', '#ffd166'], power: 50 });
      setTimeout(() => this.revealCard(item, ok), 650);
    } else {
      Sound.wrong();
      el.classList.add('wrong');
      const right = Array.from(optsEl.children).find(x => x.dataset.i === String(item.ansIdx));
      if (right) right.classList.add('right');
      Array.from(optsEl.children).forEach(b => { b.disabled = true; });
      setTimeout(() => this.revealCard(item, ok), 900);
    }
  },

  finish() {
    updateTop(); // 结算页立刻同步顶栏金币
    const gain = Store.finishThinkRun(this.correct, this.items.length);
    const root = $('#quest-root');
    root.innerHTML = '';
    const card = h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, '🧠'),
      h('div', { class: 'finish-title' }, `思维挑战 ${this.correct}/${this.items.length}`),
      h('div', { class: 'finish-sub' }, `获得 +${gain} 🪙${(Store.state.today.mint.think || 0) > 1 ? ' · 今日重刷，奖励减半' : ''}`),
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.start(); } }, '再来一组'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
      )
    );
    root.appendChild(card);
    const c = centerOf($('.finish-stamp'));
    burst(c.x, c.y, { count: 24, emojis: ['🧠', '⭐', '✨'], power: 130 });
  }
};


/* ============================================================
 * 数独挑战（四宫 2×2 / 六宫 2×3 / 九宫 3×3）：程序生成唯一解数独
 * 宫用粗框明确圈出；点击格子选中 → 点数字填入
 * 九宫格分简单/中等/困难三档（挖洞数不同）：40 / 60 / 100 🪙
 * 四宫 +20、六宫 +30；填错满盘时错误格标红可改
 * 首刷全额、当天重刷递减；记住上次玩的宫格和难度
 * ============================================================ */
const Sudoku = {
  n: 4, boxR: 2, boxC: 2, sol: [], kid: [], given: [], sel: null, diff: 2,

  /* 九宫格三档难度对应的挖洞数：简单留 43 个提示数，困难只留 29 个 */
  DIFF_HOLES: { 1: 38, 2: 45, 3: 52 },
  DIFF_NAME: { 1: '简单', 2: '中等', 3: '困难' },

  ok(grid, r, c, v) {
    for (let i = 0; i < this.n; i++) {
      if (grid[r][i] === v || grid[i][c] === v) return false;
    }
    const r0 = Math.floor(r / this.boxR) * this.boxR, c0 = Math.floor(c / this.boxC) * this.boxC;
    for (let i = r0; i < r0 + this.boxR; i++)
      for (let j = c0; j < c0 + this.boxC; j++)
        if (grid[i][j] === v) return false;
    return true;
  },

  /* 随机回溯生成完整解 */
  fill(grid) {
    for (let r = 0; r < this.n; r++) for (let c = 0; c < this.n; c++) {
      if (grid[r][c]) continue;
      const vals = shuffle(Array.from({ length: this.n }, (_, i) => i + 1));
      for (const v of vals) {
        if (this.ok(grid, r, c, v)) {
          grid[r][c] = v;
          if (this.fill(grid)) return true;
          grid[r][c] = 0;
        }
      }
      return false;
    }
    return true;
  },

  /* 候选最少的空格优先（MRV），九宫唯一解判定也够快 */
  pickCell(grid) {
    let cell = null, best = this.n + 1;
    for (let r = 0; r < this.n; r++) for (let c = 0; c < this.n; c++) {
      if (grid[r][c]) continue;
      let cand = 0;
      for (let v = 1; v <= this.n; v++) if (this.ok(grid, r, c, v)) cand++;
      if (cand === 0) return { cell: [r, c], cand: 0 };
      if (cand < best) { best = cand; cell = [r, c]; if (cand === 1) return { cell, cand: 1 }; }
    }
    return { cell, cand: best };
  },

  /* 解数统计（到 limit 即停），用来保证挖洞后答案唯一 */
  countSolutions(grid, limit) {
    let count = 0;
    const bt = () => {
      const { cell, cand } = this.pickCell(grid);
      if (!cell) { count++; return count < limit; }
      if (cand === 0) return true; /* 死路：回溯 */
      for (let v = 1; v <= this.n; v++) {
        if (this.ok(grid, cell[0], cell[1], v)) {
          grid[cell[0]][cell[1]] = v;
          const go = bt();
          grid[cell[0]][cell[1]] = 0;
          if (!go) return false;
        }
      }
      return true;
    };
    bt();
    return count;
  },

  gen(n, diff) {
    this.n = n;
    this.boxR = n === 9 ? 3 : 2;
    this.boxC = n === 4 ? 2 : 3;
    if (n === 9) this.diff = diff || this.lastDiff();
    const full = Array.from({ length: n }, () => Array(n).fill(0));
    this.fill(full);
    const holes = n === 4 ? 8 : (n === 6 ? 16 : this.DIFF_HOLES[this.diff]);
    const kid = full.map(row => row.slice());
    const order = shuffle(Array.from({ length: n }, (_, r) => r).flatMap(r =>
      Array.from({ length: n }, (_, c) => [r, c])));
    let removed = 0;
    for (const [r, c] of order) {
      if (removed >= holes) break;
      const keep = kid[r][c];
      kid[r][c] = 0;
      if (this.countSolutions(kid.map(row => row.slice()), 2) === 1) removed++;
      else kid[r][c] = keep;
    }
    this.sol = full;
    this.kid = kid;
    this.given = kid.map(row => row.map(v => v > 0));
    this.sel = null;
  },

  lastLevel() {
    try { const v = parseInt(localStorage.getItem('sdk-level'), 10); if (v === 4 || v === 6 || v === 9) return v; } catch (e) { /* 隐私模式忽略 */ }
    return 4;
  },

  lastDiff() {
    try { const v = parseInt(localStorage.getItem('sdk-diff'), 10); if (v === 1 || v === 2 || v === 3) return v; } catch (e) { /* 隐私模式忽略 */ }
    return 2;
  },

  start(n, diff) {
    Sound.stopSpeak();
    this.solved = false; /* 新一局解锁（通关后锁住棋盘防重复刷币） */
    const lvl = n || this.lastLevel();
    try { localStorage.setItem('sdk-level', String(lvl)); } catch (e) { /* 忽略 */ }
    this.gen(lvl, diff);
    if (lvl === 9) { try { localStorage.setItem('sdk-diff', String(this.diff)); } catch (e) { /* 忽略 */ } }
setQuestSub('var(--accent)');
    showScreen('quest');
    this.render();
  },

  render() {
    const root = $('#quest-root');
    root.innerHTML = '';
    const solved = this.kid.every((row, r) => row.every((v, c) => v === this.sol[r][c]));
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, this.n === 9 ? `🔢 数独九宫 · ${this.DIFF_NAME[this.diff]}` : `🔢 数独 ${this.n} 宫`)
    ));
    /* 四宫/六宫用固定格子；九宫格用弹性布局自适应屏宽，整盘不溢出 */
    const is9 = this.n === 9;
    const cell = this.n === 4 ? 52 : 44;
    const font = is9 ? 16 : 24;
    /* 按宫分块：每宫一个粗框盒子，宫的区域一眼可见 */
    const grid = h('div', {
      class: 'sdk-grid' + (is9 ? ' flex' : ''),
      style: is9 ? 'grid-template-columns:repeat(3,minmax(0,1fr))'
        : `grid-template-columns:repeat(${this.n / this.boxC},auto);--sdk-cell:${cell}px;--sdk-font:${font}px`
    });
    for (let br = 0; br < this.n / this.boxR; br++) for (let bc = 0; bc < this.n / this.boxC; bc++) {
      const box = h('div', {
        class: 'sdk-box' + ((br * (this.n / this.boxC) + bc) % 2 ? ' alt' : ''),
        style: is9 ? '' : `grid-template-columns:repeat(${this.boxC},var(--sdk-cell))`
      });
      for (let r = br * this.boxR; r < br * this.boxR + this.boxR; r++)
        for (let c = bc * this.boxC; c < bc * this.boxC + this.boxC; c++) {
          const given = this.given[r][c];
          const bad = !given && this.kid[r][c] !== 0 && this.kid[r][c] !== this.sol[r][c];
          box.appendChild(h('button', {
            class: 'sdk-cell' + (given ? ' given' : '') +
              (this.sel && this.sel[0] === r && this.sel[1] === c ? ' sel' : '') + (bad ? ' bad' : ''),
            onclick: () => {
              if (this.solved) return; /* 已通关锁盘 */
              if (given) { toast('这是题目给出的数字，不能改哦'); return; }
              Sound.tap();
              this.sel = [r, c];
              this.render();
            }
          }, this.kid[r][c] || ''));
        }
      grid.appendChild(box);
    }
    const pad = h('div', {
      class: 'sdk-pad',
      style: this.n === 9 ? 'grid-template-columns:repeat(5,1fr);max-width:330px' : ''
    },
      Array.from({ length: this.n }, (_, i) => i + 1).map(v => h('button', {
        class: 'drill-key', onclick: e => {
          if (this.solved) return; /* 已通关锁盘 */
          if (!this.sel) { toast('先点一个空格子'); return; }
          Sound.tap();
          Sound.speak(String(v), 1.1);
          this.kid[this.sel[0]][this.sel[1]] = v;
          if (this.checkDone()) return; /* 通关：结算卡留在屏上，不再重绘棋盘盖掉它 */
          this.render();
        }
      }, v)),
      h('button', { class: 'drill-key' + (this.n === 9 ? '' : ' wide'), onclick: () => { if (!this.solved && this.sel) { this.kid[this.sel[0]][this.sel[1]] = 0; this.render(); } } }, '⌫')
    );
    root.appendChild(h('div', { class: 'card drill-card center' + (is9 ? ' sdk-wide' : '') },
      h('div', { class: 'drill-tag' }, '每行、每列、每个粗框里数字都不重复'),
      grid,
      h('div', { class: 'tiny', style: 'margin-top:8px' }, solved ? '✅ 全部正确！' : (this.sel ? `已选中第 ${this.sel[0] + 1} 行第 ${this.sel[1] + 1} 列` : '点一个空格子，再点数字')),
      pad,
      /* 九宫格专属：三档难度，挖洞数不同，奖励也不同 */
      this.n === 9 ? h('div', { class: 'row-gap wrap', style: 'justify-content:center;margin-top:10px' },
        [1, 2, 3].map(d => h('button', {
          class: 'btn small' + (this.diff === d ? ' btn-main' : ''),
          onclick: () => { Sound.tap(); this.start(9, d); }
        }, `${this.DIFF_NAME[d]} ${[40, 60, 100][d - 1]}🪙`))
      ) : '',
      h('div', { class: 'row-gap wrap', style: 'justify-content:center;margin-top:10px' },
        [4, 6, 9].map(k => h('button', {
          class: 'btn small' + (this.n === k ? ' btn-main' : ''),
          onclick: () => { Sound.tap(); this.start(k); }
        }, `${k} 宫`)),
        h('button', { class: 'btn small', onclick: () => { Sound.tap(); this.start(this.n); } }, '🔄 换一题')
      )
    ));
  },

  checkDone() {
    /* 返回 true 表示已通关（调用方据此停止重绘棋盘）；solved 锁存防重复结算刷币 */
    if (this.solved) return true;
    if (!this.kid.every(row => row.every(v => v > 0))) return false;
    const wrongN = this.kid.reduce((s, row, r) => s + row.filter((v, c) => v !== this.sol[r][c]).length, 0);
    if (wrongN > 0) { toast(`有 ${wrongN} 个格子不对，红色的可以点开改`); Sound.wrong(); return false; }
    /* 全对结算：九宫按难度给币，难度越高越值钱 */
    this.solved = true;
    const gain = Store.earnScaled('sudoku', this.n === 4 ? 20 : (this.n === 6 ? 30 : [40, 60, 100][this.diff]));
    Sound.gold();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, '🔢'),
      h('div', { class: 'finish-title' }, `${this.n} 宫数独完成！`),
      h('div', { class: 'finish-sub' }, `获得 +${gain} 🪙${(Store.state.today.mint.sudoku || 0) > 1 ? ' · 今日重刷，奖励减半' : ''}`),
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.start(this.n); } }, '再来一局'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
      )
    ));
    const c = centerOf($('.finish-stamp'));
    burst(c.x, c.y, { count: 26, emojis: ['🔢', '⭐', '✨'], power: 130 });
    return true;
  }
};
