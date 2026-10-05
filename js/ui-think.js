/* ============================================================
 * 星际求知号 - 数学思维挑战场（拔高加餐）
 * 找规律 / 巧算 / 周期问题 / 鸡兔同笼，程序自动出题
 * 5 题一组不计时，答对每题 +5 🪙 全对再 +8；首刷全额、重刷递减
 * ============================================================ */

const MathThink = {
  items: [], idx: 0, correct: 0, input: '',

  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  r(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },

  /* ---------- 出题器：每题 {kind:'input'|'choice', text, ans, tip, opts?, ansIdx?} ---------- */

  /* 找规律：等差 / ×2 / ×10 */
  genSeq() {
    const kind = this.pick(['add', 'geo', 'geo10']);
    if (kind === 'add') {
      const s = this.r(1, 15), d = this.r(2, 9);
      const seq = [0, 1, 2, 3].map(i => s + i * d);
      const ans = s + 4 * d;
      return { kind: 'input', text: `找规律填数：${seq.join('，')}，＿＿`, ans, tip: `每次多 ${d}：${seq[3]} + ${d} = ${ans}` };
    }
    if (kind === 'geo') {
      const s = this.r(1, 4);
      const seq = [s, s * 2, s * 4, s * 8];
      const ans = s * 16;
      return { kind: 'input', text: `找规律填数：${seq.join('，')}，＿＿`, ans, tip: `每次 ×2：${seq[3]} × 2 = ${ans}` };
    }
    const s = this.r(1, 9);
    const seq = [s, s * 10, s * 100, s * 1000];
    const ans = s * 10000;
    return { kind: 'input', text: `找规律填数：${seq.join('，')}，＿＿`, ans, tip: `每次 ×10：${seq[3]} × 10 = ${ans}` };
  },

  /* 巧算：凑整 / 加 99 / 减 198 / 25×4 */
  genClever() {
    const kind = this.pick(['sum100', 'add99', 'sub198', 'mul25']);
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
    const k = this.r(3, 9);
    return { kind: 'input', text: `巧算：25 × 4 × ${k} = ?`, ans: 100 * k, tip: `25 × 4 = 100，100 × ${k} = ${100 * k}` };
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

  buildRound() {
    const qs = [this.genSeq(), this.genClever(), this.genCycle(), this.genJitu(), this.gen24()];
    return shuffle(qs);
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
    showScreen('quest');
    this.renderIntro();
  },

  renderIntro() {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, '🧠 思维挑战场')
    ));
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, '🧠'),
      h('div', { class: 'splash-title' }, '思维挑战场！'),
      h('div', { class: 'splash-sub' }, '5 道烧脑题 · 找规律 / 巧算 / 周期 / 鸡兔同笼 · 答对每题 +5 🪙，全对再 +8'),
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
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, '✕'),
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
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, '✕'),
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
    const lvl = n || this.lastLevel();
    try { localStorage.setItem('sdk-level', String(lvl)); } catch (e) { /* 忽略 */ }
    this.gen(lvl, diff);
    if (lvl === 9) { try { localStorage.setItem('sdk-diff', String(this.diff)); } catch (e) { /* 忽略 */ } }
    showScreen('quest');
    this.render();
  },

  render() {
    const root = $('#quest-root');
    root.innerHTML = '';
    const solved = this.kid.every((row, r) => row.every((v, c) => v === this.sol[r][c]));
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, this.n === 9 ? `🔢 数独九宫 · ${this.DIFF_NAME[this.diff]}` : `🔢 数独 ${this.n} 宫`)
    ));
    /* 四宫/六宫用固定格子；九宫格用弹性布局自适应屏宽，整盘不溢出 */
    const is9 = this.n === 9;
    const cell = this.n === 4 ? 52 : 44;
    const font = is9 ? 16 : 23;
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
          if (!this.sel) { toast('先点一个空格子'); return; }
          Sound.tap();
          Sound.speak(String(v), 1.1);
          this.kid[this.sel[0]][this.sel[1]] = v;
          this.checkDone();
          this.render();
        }
      }, v)),
      h('button', { class: 'drill-key' + (this.n === 9 ? '' : ' wide'), onclick: () => { if (this.sel) { this.kid[this.sel[0]][this.sel[1]] = 0; this.render(); } } }, '⌫')
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
    if (!this.kid.every(row => row.every(v => v > 0))) return;
    const wrongN = this.kid.reduce((s, row, r) => s + row.filter((v, c) => v !== this.sol[r][c]).length, 0);
    if (wrongN > 0) { toast(`有 ${wrongN} 个格子不对，红色的可以点开改`); Sound.wrong(); return; }
    /* 全对结算：九宫按难度给币，难度越高越值钱 */
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
  }
};
