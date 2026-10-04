/* ============================================================
 * 星际求知号 - 数学思维挑战场（拔高加餐）
 * 找规律 / 巧算 / 周期问题 / 鸡兔同笼，程序自动出题
 * 5 题一组不计时，答对每题 +8 🪙 全对再 +10；首刷全额、重刷减半
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
      h('div', { class: 'splash-sub' }, '5 道烧脑题 · 找规律 / 巧算 / 周期 / 鸡兔同笼 · 答对每题 +8 🪙，全对再 +10'),
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
 * 数独挑战（四宫 2×2 / 六宫 2×3）：程序生成唯一解数独
 * 点击格子选中 → 点数字填入；全部填对得金币（四宫 +20 / 六宫 +30）
 * 填错满盘时错误格标红可改；首刷全额、当天重刷减半
 * ============================================================ */
const Sudoku = {
  n: 4, boxR: 2, boxC: 2, sol: [], kid: [], given: [], sel: null,

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

  /* 解数统计（到 limit 即停），用来保证挖洞后答案唯一 */
  countSolutions(grid, limit) {
    let count = 0;
    const bt = () => {
      let cell = null;
      outer: for (let r = 0; r < this.n; r++) for (let c = 0; c < this.n; c++)
        if (!grid[r][c]) { cell = [r, c]; break outer; }
      if (!cell) { count++; return count < limit; }
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

  gen(n) {
    this.n = n;
    this.boxR = 2;
    this.boxC = n === 4 ? 2 : 3;
    const full = Array.from({ length: n }, () => Array(n).fill(0));
    this.fill(full);
    const holes = n === 4 ? 8 : 16;
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

  start(n) {
    Sound.stopSpeak();
    this.gen(n || 4);
    showScreen('quest');
    this.render();
  },

  render() {
    const root = $('#quest-root');
    root.innerHTML = '';
    const solved = this.kid.every((row, r) => row.every((v, c) => v === this.sol[r][c]));
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, `🔢 数独 ${this.n} 宫`)
    ));
    const grid = h('div', { class: 'sdk-grid', style: `grid-template-columns:repeat(${this.n},52px)` });
    for (let r = 0; r < this.n; r++) for (let c = 0; c < this.n; c++) {
      const boxIdx = Math.floor(r / this.boxR) * (this.n / this.boxC) + Math.floor(c / this.boxC);
      const given = this.given[r][c];
      const bad = !given && this.kid[r][c] !== 0 && this.kid[r][c] !== this.sol[r][c];
      grid.appendChild(h('button', {
        class: 'sdk-cell' + (given ? ' given' : '') + (boxIdx % 2 ? ' alt' : '') +
          (this.sel && this.sel[0] === r && this.sel[1] === c ? ' sel' : '') + (bad ? ' bad' : ''),
        onclick: () => {
          if (given) { toast('这是题目给出的数字，不能改哦'); return; }
          Sound.tap();
          this.sel = [r, c];
          this.render();
        }
      }, this.kid[r][c] || ''));
    }
    const pad = h('div', { class: 'sdk-pad' },
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
      h('button', { class: 'drill-key wide', onclick: () => { if (this.sel) { this.kid[this.sel[0]][this.sel[1]] = 0; this.render(); } } }, '⌫')
    );
    root.appendChild(h('div', { class: 'card drill-card center' },
      h('div', { class: 'drill-tag' }, '每行、每列、每个粗框里数字都不重复'),
      grid,
      h('div', { class: 'tiny', style: 'margin-top:8px' }, solved ? '✅ 全部正确！' : (this.sel ? `已选中第 ${this.sel[0] + 1} 行第 ${this.sel[1] + 1} 列` : '点一个空格子，再点数字')),
      pad,
      h('div', { class: 'row-gap', style: 'justify-content:center;margin-top:10px' },
        h('button', { class: 'btn small', onclick: () => { Sound.tap(); this.start(this.n); } }, '🔄 换一题'),
        h('button', { class: 'btn small', onclick: () => { Sound.tap(); this.start(this.n === 4 ? 6 : 4); } }, this.n === 4 ? '⬆️ 挑战六宫' : '⬇️ 回到四宫')
      )
    ));
  },

  checkDone() {
    if (!this.kid.every(row => row.every(v => v > 0))) return;
    const wrongN = this.kid.reduce((s, row, r) => s + row.filter((v, c) => v !== this.sol[r][c]).length, 0);
    if (wrongN > 0) { toast(`有 ${wrongN} 个格子不对，红色的可以点开改`); Sound.wrong(); return; }
    /* 全对结算 */
    const gain = Store.earnScaled('sudoku', this.n === 4 ? 20 : 30);
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
