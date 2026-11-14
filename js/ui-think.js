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

  /* ---------- 24 点（v44 自由拼式）：给 4 个数，孩子自己拼算式算出 24，鼓励多种算法 ----------
   * 出题内置求解器保证有解，优先挑「整数步可解且至少两种算法」的题；提示给一种参考解法
   * 判定：4 个数每个恰好用一次、括号配对、语法合法、结果 = 24（分数路径也算对，如 8÷(3−8÷3)） */
  gcd(a, b) { while (b) { const t = a % b; a = b; b = t; } return a || 1; },
  rn(n, d) {
    if (d < 0) { n = -n; d = -d; }
    const g = this.gcd(Math.abs(n), d);
    return { n: n / g, d: d / g };
  },
  rOp(op, a, b) {
    if (op === '+') return this.rn(a.n * b.d + b.n * a.d, a.d * b.d);
    if (op === '−') return this.rn(a.n * b.d - b.n * a.d, a.d * b.d);
    if (op === '×') return this.rn(a.n * b.n, a.d * b.d);
    return b.n === 0 ? null : this.rn(a.n * b.d, a.d * b.n);
  },
  /* 子算式打印：子级优先级低于父级，或同级且在右侧时加括号（右侧同级括号冗余但绝不歧义） */
  fmtSide(node, myPrec, isRight) {
    const needP = node.prec < myPrec || (node.prec === myPrec && isRight && myPrec < 3);
    return needP ? `( ${node.expr} )` : node.expr;
  },
  /* 求解器：穷举「任取两数合并」的全部路径，返回去重解 [{expr, canon, allInt}] */
  solve24(nums) {
    const found = new Map();
    const step = list => {
      if (list.length === 1) {
        const it = list[0];
        if (it.v.n === 24 && it.v.d === 1 && !found.has(it.canon)) found.set(it.canon, it);
        return;
      }
      for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < list.length; j++) {
          if (i === j) continue;
          const a = list[i], b = list[j];
          const rest = list.filter((_, k) => k !== i && k !== j);
          for (const op of ['+', '−', '×', '÷']) {
            if ((op === '+' || op === '×') && i > j) continue; /* + × 交换律只算一个方向 */
            const v = this.rOp(op, a.v, b.v);
            if (!v) continue;
            const prec = (op === '+' || op === '−') ? 1 : 2;
            const expr = `${this.fmtSide(a, prec, false)} ${op} ${this.fmtSide(b, prec, true)}`;
            const canon = (op === '+' || op === '×')
              ? `(${[a.canon, b.canon].sort().join(op)})`
              : `(${a.canon}${op}${b.canon})`;
            step([...rest, { v, expr, canon, prec, isCom: op === '+' || op === '×',
              allInt: a.allInt && b.allInt && v.d === 1 }]);
          }
        }
      }
    };
    step(nums.map(n => ({ v: { n, d: 1 }, expr: String(n), canon: String(n), prec: 3, isCom: true, allInt: true })));
    return [...found.values()];
  },
  /* 孩子拼的算式 → 语法树（返回 null = 语法不完整） */
  parse24(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const expr = () => {
      let node = term();
      while (peek() === '+' || peek() === '−') { const op = tokens[pos++]; node = { op, l: node, r: term() }; }
      return node;
    };
    const term = () => {
      let node = factor();
      while (peek() === '×' || peek() === '÷') { const op = tokens[pos++]; node = { op, l: node, r: factor() }; }
      return node;
    };
    const factor = () => {
      const t = peek();
      if (t === '(') {
        pos++;
        const node = expr();
        if (peek() !== ')') throw 'paren';
        pos++;
        return node;
      }
      if (typeof t === 'number') { pos++; return { leaf: t }; }
      throw 'token';
    };
    try {
      const node = expr();
      if (pos !== tokens.length) return null;
      return node;
    } catch (e) { return null; }
  },
  evalTree(node) {
    if (node.leaf != null) return { n: node.leaf, d: 1 };
    const a = this.evalTree(node.l), b = this.evalTree(node.r);
    if (!a || !b) return null;
    return this.rOp(node.op, a, b);
  },
  canonTree(node) {
    if (node.leaf != null) return String(node.leaf);
    if (node.op === '+' || node.op === '×') return `(${[this.canonTree(node.l), this.canonTree(node.r)].sort().join(node.op)})`;
    return `(${this.canonTree(node.l)}${node.op}${this.canonTree(node.r)})`;
  },
  /* 提交判定：draft = 还没拼完整不扣机会；wrong = 算式合法但结果不是 24；right = 答对 */
  checkExpr24(item, toks) {
    const used = toks.filter(x => x.t === 'n').map(x => x.slot);
    if (used.length < 4) return { status: 'draft', msg: `还有 ${4 - used.length} 个数没用上哦，4 个数每个都要用一次` };
    const tree = this.parse24(toks.map(x => x.t === 'n' ? x.v : x.v));
    if (!tree) return { status: 'draft', msg: '算式还没写完整：括号要配对，运算符两边都要有数' };
    const val = this.evalTree(tree);
    if (!val) return { status: 'draft', msg: '除数不能是 0，换个思路～' };
    if (val.n !== 24 || val.d !== 1) {
      const vs = val.d === 1 ? String(val.n) : `${val.n}/${val.d}`;
      return { status: 'wrong', valText: vs, canon: this.canonTree(tree), msg: `算出来是 ${vs}，不是 24，再想想！` };
    }
    return { status: 'right', canon: this.canonTree(tree) };
  },
  gen24() {
    let best = null;
    for (let t = 0; t < 40; t++) {
      const ns = [this.r(1, 9), this.r(1, 9), this.r(1, 9), this.r(1, 9)];
      const sols = this.solve24(ns);
      if (!sols.length) continue;
      const intSols = sols.filter(s => s.allInt);
      const pool = (intSols.length ? intSols : sols).slice().sort((a, b) => a.expr.length - b.expr.length);
      const cand = { nums: ns, sols, tipSol: pool[0], intN: intSols.length };
      if (!best || cand.sols.length > best.sols.length) best = cand;
      if (cand.sols.length >= 2 && cand.intN >= 2) { best = cand; break; }
    }
    if (!best) best = { nums: [2, 3, 4, 6], sols: this.solve24([2, 3, 4, 6]), tipSol: this.solve24([2, 3, 4, 6])[0] };
    return {
      kind: 'expr24',
      nums: best.nums,
      text: `24 点挑战：用 ${best.nums.join('、')} 这 4 个数算出 24（加减乘除、括号都行，每个数用一次）`,
      tip: `参考解法：${best.tipSol.expr} = 24${best.sols.length > 1 ? ` · 这题至少有 ${best.sols.length} 种算法，能再找到别的吗？` : ''}`
    };
  },
  /* 拼算式板（思维挑战场 / BOSS 综合卷共用）：数字块点一次用一次，✔ 提交判定
   * cb('solved', {first, count}) 答对一种新算法 · cb('fail') 三次都错 · cb('finish') 孩子点完成 */
  mount24pad(card, item, cb) {
    const toks = [];
    const usedSlots = new Set();
    const found = new Set();
    let attempts = 0, solvedN = 0, finished = false;
    const exprEl = h('div', { class: 'drill-input expr24-line' }, '_');
    const msgEl = h('div', { class: 'tiny cn-tip', style: 'min-height:18px;text-align:center' });
    const shake = () => { exprEl.classList.add('shake'); setTimeout(() => exprEl.classList.remove('shake'), 450); };
    const refresh = () => {
      exprEl.textContent = toks.length ? toks.map(x => x.t === 'n' ? x.v : x.v).join(' ') : '_';
      exprEl.classList.toggle('filled', toks.length > 0);
    };
    const numBtns = item.nums.map((n, i) => {
      const b = h('button', {
        class: 'drill-key num24', onclick: () => {
          if (finished || usedSlots.has(i)) return;
          Sound.tap();
          usedSlots.add(i);
          toks.push({ t: 'n', v: n, slot: i });
          b.classList.add('used');
          refresh();
        }
      }, String(n));
      return b;
    });
    const op = sym => h('button', {
      class: 'drill-key', onclick: () => {
        if (finished) return;
        Sound.tap();
        toks.push({ t: 'o', v: sym });
        refresh();
      }
    }, sym);
    const popTok = () => {
      if (finished || !toks.length) return;
      Sound.tap();
      const last = toks.pop();
      if (last.t === 'n') { usedSlots.delete(last.slot); numBtns[last.slot].classList.remove('used'); }
      refresh();
    };
    const clearToks = () => {
      if (finished || !toks.length) return;
      Sound.tap();
      toks.length = 0;
      usedSlots.clear();
      numBtns.forEach(b => b.classList.remove('used'));
      refresh();
    };
    const finishBtn = h('button', {
      class: 'btn btn-main big', style: 'display:none;margin-top:10px', onclick: () => {
        if (finished) return;
        finished = true;
        Sound.tap();
        cb('finish');
      }
    }, '✅ 完成 →');
    const submit = () => {
      if (finished) return;
      const r = this.checkExpr24(item, toks);
      if (r.status === 'draft') { Sound.tap(); msgEl.textContent = r.msg; shake(); return; }
      if (r.status === 'wrong') {
        attempts++;
        Sound.wrong();
        msgEl.textContent = attempts >= 3 ? `${r.msg} 没关系，看看参考解法吧` : r.msg;
        shake();
        if (attempts >= 3) { finished = true; cb('fail'); cb('finish'); }
        return;
      }
      if (found.has(r.canon)) { msgEl.textContent = '这种算法刚才已经算过啦，换一种新的试试！'; shake(); return; }
      found.add(r.canon);
      solvedN++;
      const first = solvedN === 1;
      msgEl.textContent = first ? '✅ 算出 24 了！还有别的算法吗？每找到一种新的 +2 🪙'
        : (solvedN >= 3 ? `🎉 第 ${solvedN} 种算法也对了！你太会思考了` : `🎉 又一种新算法 +2 🪙！再找找看`);
      finishBtn.style.display = '';
      finishBtn.textContent = solvedN > 1 ? `✅ 完成（已找到 ${solvedN} 种算法）→` : '✅ 完成 →';
      if (solvedN >= 3) { finished = true; setTimeout(() => cb('finish'), 600); }
      else { toks.length = 0; usedSlots.clear(); numBtns.forEach(b => b.classList.remove('used')); refresh(); }
      cb('solved', { first, count: solvedN });
    };
    card.appendChild(exprEl);
    card.appendChild(h('div', { class: 'expr24-row' }, numBtns));
    card.appendChild(h('div', { class: 'expr24-row' }, ['+', '−', '×', '÷'].map(op)));
    card.appendChild(h('div', { class: 'expr24-row' },
      op('('), op(')'),
      h('button', { class: 'drill-key', onclick: popTok }, '⌫'),
      h('button', { class: 'drill-key', onclick: clearToks }, '🗑️'),
      h('button', { class: 'drill-key ok', onclick: submit }, '✔')
    ));
    card.appendChild(msgEl);
    card.appendChild(finishBtn);
    refresh();
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
    } else if (item.kind === 'expr24') {
      /* 自由拼 24：拼算板，答对后可继续探索新算法（每种 +2 🪙），点完成结算 */
      let ok24 = false;
      this.mount24pad(card, item, (type, p) => {
        if (type === 'solved') {
          if (p.first) {
            ok24 = true;
            Sound.correct();
            const c = centerOf(card);
            burst(c.x, c.y, { count: 14, colors: ['#58e08a', '#ffd166'], power: 70 });
          } else {
            Store.addCoins(2);
            updateTop();
            Sound.coin();
            toast('🎉 又一种算法 +2 🪙');
          }
        }
        if (type === 'fail') Sound.wrong();
        if (type === 'finish') { if (ok24) this.correct++; this.revealCard(item, ok24); }
      });
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
 * 三种宫格都有简单/中等/困难三档（挖洞数不同）
 * 奖励：四宫 15/20/30、六宫 25/30/40、九宫 40/60/100 🪙；填错满盘时错误格标红可改
 * 首刷全额、当天重刷递减；每个宫格分别记住上次选的难度
 * v43：4 宫、6 宫也加了三档难度（原来只有九宫有）
 * v42 候选数（小草稿）：✏️候选模式手动标小数字 / ✨一键候选铺满 / 🧽清空；
 *   正式落数后本格候选清空，同行列宫同数字候选自动擦掉；只剩 1 个候选的格子虚线提示（唯一候选法）
 * ============================================================ */
const Sudoku = {
  n: 4, boxR: 2, boxC: 2, sol: [], kid: [], given: [], sel: null, diff: 2,
  marks: [], candMode: false,

  /* v43：三档挖洞数，按宫格分开（4 宫 16 格、6 宫 36 格、9 宫 81 格）
   * 4 宫 6/8/10 → 留 10/8/6 个提示数；6 宫 12/17/23 → 留 24/19/13 个；
   * 9 宫沿用 38/45/52 → 留 43/36/29 个 */
  DIFF_HOLES: {
    4: { 1: 6, 2: 8, 3: 10 },
    6: { 1: 12, 2: 17, 3: 23 },
    9: { 1: 38, 2: 45, 3: 52 }
  },
  DIFF_NAME: { 1: '简单', 2: '中等', 3: '困难' },
  /* 三档奖励：中间档等于原来的固定奖励（4 宫 20 / 6 宫 30 / 9 宫 60） */
  DIFF_COINS: {
    4: [15, 20, 30],
    6: [25, 30, 40],
    9: [40, 60, 100]
  },

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

  /* ---------- v42 候选数（小草稿） ---------- */
  /* 候选只存在 this.marks[r][c] 里（数字数组），不进 kid；重绘 DOM 不丢 */
  toggleMark(r, c, v) {
    if (!this.marks[r]) this.marks[r] = [];
    const list = this.marks[r][c] || (this.marks[r][c] = []);
    const i = list.indexOf(v);
    if (i >= 0) list.splice(i, 1);
    else { list.push(v); list.sort((a, b) => a - b); }
  },

  /* 落正式数字后：本格候选清空 + 同行/同列/同宫里的同一个数字候选自动擦掉 */
  cleanPeerMarks(r, c, v) {
    if (!this.marks[r]) return;
    this.marks[r][c] = [];
    const r0 = Math.floor(r / this.boxR) * this.boxR, c0 = Math.floor(c / this.boxC) * this.boxC;
    for (let i = 0; i < this.n; i++) {
      const peers = [[r, i], [i, c], [r0 + Math.floor(i / this.boxC), c0 + (i % this.boxC)]];
      for (const [rr, cc] of peers) {
        const list = this.marks[rr] && this.marks[rr][cc];
        if (!list || !list.length) continue;
        const j = list.indexOf(v);
        if (j >= 0) list.splice(j, 1);
      }
    }
  },

  /* 一键候选：每个空格标上当前还可能填的数字；返回标好的格数和"一个候选都没有"的格数 */
  autoMarks() {
    let marked = 0, dead = 0;
    for (let r = 0; r < this.n; r++) for (let c = 0; c < this.n; c++) {
      if (this.kid[r][c]) { this.marks[r][c] = []; continue; }
      const list = [];
      for (let v = 1; v <= this.n; v++) if (this.ok(this.kid, r, c, v)) list.push(v);
      this.marks[r][c] = list;
      if (list.length) marked++; else dead++;
    }
    return { marked, dead };
  },

  clearMarks() {
    for (let r = 0; r < this.n; r++) for (let c = 0; c < this.n; c++) this.marks[r][c] = [];
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
    /* v43：4/6/9 宫都有三档；没传就取这一宫格上次选过的档 */
    this.diff = diff || this.lastDiff(n);
    if (!(this.diff >= 1 && this.diff <= 3)) this.diff = 2;
    const full = Array.from({ length: n }, () => Array(n).fill(0));
    this.fill(full);
    const holes = this.DIFF_HOLES[n][this.diff];
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
    this.marks = Array.from({ length: n }, () => Array.from({ length: n }, () => []));
    this.sel = null;
  },

  lastLevel() {
    try { const v = parseInt(localStorage.getItem('sdk-level'), 10); if (v === 4 || v === 6 || v === 9) return v; } catch (e) { /* 隐私模式忽略 */ }
    return 4;
  },

  /* 每宫格各记各的难度：sdk-diff-4 / sdk-diff-6 / sdk-diff-9
   * 旧存档只有 9 宫的 sdk-diff，读不到新键时回退到它 */
  lastDiff(n) {
    const size = n || 9;
    try {
      let v = parseInt(localStorage.getItem('sdk-diff-' + size), 10);
      if (!(v === 1 || v === 2 || v === 3) && size === 9) v = parseInt(localStorage.getItem('sdk-diff'), 10);
      if (v === 1 || v === 2 || v === 3) return v;
    } catch (e) { /* 隐私模式忽略 */ }
    return 2;
  },

  start(n, diff) {
    Sound.stopSpeak();
    this.solved = false; /* 新一局解锁（通关后锁住棋盘防重复刷币） */
    const lvl = n || this.lastLevel();
    try { localStorage.setItem('sdk-level', String(lvl)); } catch (e) { /* 忽略 */ }
    this.gen(lvl, diff);
    /* v43：每个宫格分别记住自己上次的难度 */
    try { localStorage.setItem('sdk-diff-' + lvl, String(this.diff)); } catch (e) { /* 忽略 */ }
    if (lvl === 9) { try { localStorage.setItem('sdk-diff', String(this.diff)); } catch (e) { /* 兼容旧档 */ } }
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
      h('div', { class: 'quest-prog' }, `🔢 数独${this.n === 9 ? '九宫' : ' ' + this.n + ' 宫'} · ${this.DIFF_NAME[this.diff]}`)
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
          const val = this.kid[r][c];
          const bad = !given && val !== 0 && val !== this.sol[r][c];
          /* 空格子显示候选小数字（有正式数字时不显示草稿） */
          const mk = val ? null : (this.marks[r] && this.marks[r][c]) || [];
          const cellKids = [];
          if (val) cellKids.push(String(val));
          else if (mk.length) {
            const cols = this.n === 4 ? 2 : 3;
            const fs = this.n === 4 ? '15px' : (this.n === 6 ? '11px' : '');
            cellKids.push(h('span', {
              class: 'sdk-marks',
              style: `grid-template-columns:repeat(${cols},1fr)` + (fs ? `;font-size:${fs}` : '')
            }, Array.from({ length: this.n }, (_, i) => h('span', {}, mk.includes(i + 1) ? String(i + 1) : ''))));
          }
          box.appendChild(h('button', {
            class: 'sdk-cell' + (given ? ' given' : '') +
              (this.sel && this.sel[0] === r && this.sel[1] === c ? ' sel' : '') + (bad ? ' bad' : '') +
              (!val && mk.length === 1 ? ' one' : ''),
            onclick: () => {
              if (this.solved) return; /* 已通关锁盘 */
              if (given) { toast('这是题目给出的数字，不能改哦'); return; }
              Sound.tap();
              this.sel = [r, c];
              this.render();
            }
          }, cellKids));
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
          const [sr, sc] = this.sel;
          Sound.tap();
          /* 候选模式：数字键只在选中的空格里打小草稿，不落正式数字 */
          if (this.candMode) {
            if (this.kid[sr][sc]) { toast('这格已经有数字了，先擦掉再标候选'); return; }
            this.toggleMark(sr, sc, v);
            this.render();
            return;
          }
          Sound.speak(String(v), 1.1);
          this.kid[sr][sc] = v;
          this.cleanPeerMarks(sr, sc, v); /* 落数后自动擦掉相关候选，免得过时候选误导 */
          if (this.checkDone()) return; /* 通关：结算卡留在屏上，不再重绘棋盘盖掉它 */
          this.render();
        }
      }, v)),
      h('button', {
        class: 'drill-key' + (this.n === 9 ? '' : ' wide'),
        onclick: () => {
          if (this.solved || !this.sel) return;
          const [sr, sc] = this.sel;
          Sound.tap();
          /* 候选模式下只擦小草稿；普通模式连正式数字一起擦 */
          if (this.candMode && !this.kid[sr][sc]) this.marks[sr][sc] = [];
          else { this.kid[sr][sc] = 0; this.marks[sr][sc] = []; }
          this.render();
        }
      }, '⌫')
    );
    root.appendChild(h('div', { class: 'card drill-card center' + (is9 ? ' sdk-wide' : '') },
      h('div', { class: 'drill-tag' }, '每行、每列、每个粗框里数字都不重复'),
      grid,
      h('div', { class: 'tiny', style: 'margin-top:8px' },
        solved ? '✅ 全部正确！'
          : this.candMode
            ? (this.sel ? '候选模式：点数字给这格标小草稿，再点一次取消' : '候选模式：先点一个空格子')
            : (this.sel ? `已选中第 ${this.sel[0] + 1} 行第 ${this.sel[1] + 1} 列` : '点一个空格子，再点数字')),
      pad,
      /* v42 候选数工具栏：手动手稿 / 一键铺满 / 清空 */
      h('div', { class: 'row-gap wrap', style: 'justify-content:center;margin-top:10px' },
        h('button', {
          class: 'btn small' + (this.candMode ? ' btn-main' : ''),
          onclick: () => { Sound.tap(); this.candMode = !this.candMode; this.render(); }
        }, '✏️ 候选' + (this.candMode ? ' 开' : '')),
        h('button', {
          class: 'btn small',
          onclick: () => {
            if (this.solved) return;
            Sound.tap();
            const { marked, dead } = this.autoMarks();
            this.render();
            if (dead) toast(`有 ${dead} 个格子一个候选都没有，前面可能填错了`);
            else toast(`已标好 ${marked} 个空格；虚线框的只剩 1 个候选`);
          }
        }, '✨ 一键候选'),
        h('button', {
          class: 'btn small',
          onclick: () => { if (this.solved) return; Sound.tap(); this.clearMarks(); this.render(); }
        }, '🧽 清候选')
      ),
      /* v43：三档难度，4/6/9 宫都有；奖励按宫格和档位取 */
      h('div', { class: 'row-gap wrap', style: 'justify-content:center;margin-top:10px' },
        [1, 2, 3].map(d => h('button', {
          class: 'btn small' + (this.diff === d ? ' btn-main' : ''),
          onclick: () => { Sound.tap(); this.start(this.n, d); }
        }, `${this.DIFF_NAME[d]} ${this.DIFF_COINS[this.n][d - 1]}🪙`))
      ),
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
    const gain = Store.earnScaled('sudoku', this.DIFF_COINS[this.n][this.diff - 1]);
    Sound.gold();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, '🔢'),
      h('div', { class: 'finish-title' }, `${this.n} 宫数独完成！（${this.DIFF_NAME[this.diff]}）`),
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
