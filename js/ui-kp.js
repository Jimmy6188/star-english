/* ============================================================
 * 星际求知号 - 知识点小测 + 期末复习路线（v42 C 期）
 *
 * 小测：3 道选择题（数学按知识点现生成 4 选 1；道法/语文取已有题）
 *   全对 = 会；对 2 = 不稳；≤1 = 不会 —— 结果写回 state.kpCheck，家长面板可见
 * 复习路线：从薄弱知识点沿 hard 先修回溯，按年级/册次排序，可复制成清单
 *
 * 知识点骨架见 js/data-kp.js（来源 cn-math-taxonomy，CC BY-NC 4.0）；
 * 题目全部由本项目自写或由本项目程序生成。
 * ============================================================ */

/* 程序出题会产出这些数学知识点（见 ui-math.js 的 kp 映射） */
const MATH_KP_IDS = new Set([
  'cnm_p031', 'cnm_p032', 'cnm_p039', 'cnm_p042', 'cnm_p046', 'cnm_p044',
  'cnm_p074', 'cnm_p083', 'cnm_p106', 'cnm_p071', 'cnm_p072',
  'cnm_p112', 'cnm_p086', 'cnm_p102',
  'cnm_p069', 'cnm_p068', 'cnm_p056', 'cnm_p090', 'cnm_p078', 'cnm_p089',
  'cnm_p111', 'cnm_p073'
]);

const KPQuiz = {
  kp: '', items: [], idx: 0, ok: 0,

  /* ---------- 题库：按知识点凑题 ---------- */

  /* 数学：反复调程序出题器，筛出同一个知识点的题，转成 4 选 1 */
  mathPool(id, n) {
    const out = [], seen = new Set();
    const savedLevel = MathSprint.level;
    for (let guard = 0; guard < 900 && out.length < n; guard++) {
      MathSprint.level = 1 + (guard % 3);
      const cand = [MathSprint.gen(), MathDrill.gen()];
      for (const it of cand) {
        if (!it || it.kp !== id) continue;
        const text = it.q || it.text;
        const ans = it.a !== undefined ? it.a : it.ans;
        if (!text || ans === undefined || seen.has(text)) continue;
        seen.add(text);
        const opts = MathSprint.options(ans).map(String);
        out.push({ q: text, opts, ans: opts.indexOf(String(ans)), tip: it.tip || '' });
      }
    }
    MathSprint.level = savedLevel;
    return out;
  },

  /* 统一转成选择题（判断题变"对/错"两选项；步骤排序题不进小测） */
  toChoice(q) {
    if (!q || !q.q) return null;
    if (q.kind === 'judge') return { q: q.q, opts: ['对', '错'], ans: q.ans ? 0 : 1, tip: q.tip };
    if (!q.opts || q.ans === undefined) return null;
    const opts = shuffle(q.opts.slice());
    return { q: q.q, opts, ans: opts.indexOf(q.opts[q.ans]), tip: q.tip };
  },

  /* 数学知识点闯关（data-math-kp.js）：静态题，已挂 kp */
  mathQs(id) {
    if (typeof MATH_KP_DATA === 'undefined') return [];
    return MATH_KP_DATA.units.flatMap(u => u.lessons).flatMap(l => l.qs).filter(q => q.kp === id);
  },
  mathStatic(id) { return this.mathQs(id).map(q => this.toChoice(q)).filter(Boolean); },

  /* 道法：取同课的已有题（判断转成"对/错"两选项） */
  daoQs(id) {
    if (typeof DAOFA_DATA === 'undefined') return [];
    return DAOFA_DATA.units.flatMap(u => u.lessons).flatMap(l => l.qs).filter(q => q.kp === id);
  },
  daoPool(id) { return this.daoQs(id).map(q => this.toChoice(q)).filter(Boolean); },

  /* 语文：静态题（小古文/阅读/词语）+ 同一首诗现生成 3 题（下一句/作者/理解） */
  cnStatic(id) {
    const out = [];
    if (typeof CN_GUWEN !== 'undefined') CN_GUWEN.filter(g => g.kp === id).forEach(g => (g.qs || []).forEach(q => out.push(q)));
    if (typeof CN_READINGS !== 'undefined') CN_READINGS.filter(r => r.kp === id).forEach(r => (r.qs || []).forEach(q => out.push(q)));
    if (typeof CN_TRAPS !== 'undefined') CN_TRAPS.filter(q => q.kp === id).forEach(q => out.push(q));
    if (typeof CN_WORDFIT !== 'undefined') CN_WORDFIT.filter(q => q.kp === id).forEach(q => out.push(q));
    return out;
  },
  allPoems() {
    if (typeof CN_POEMS === 'undefined') return [];
    return (typeof CN_POEMS_NEXT !== 'undefined') ? CN_POEMS.concat(CN_POEMS_NEXT) : CN_POEMS;
  },
  poemOf(id) { return this.allPoems().find(p => p.kp === id) || null; },
  cnPool(id) {
    const out = [];
    const p = this.poemOf(id);
    if (p && p.lines && p.lines.length >= 2) {
      const i = Math.floor(Math.random() * (p.lines.length - 1));
      const correct = p.lines[i + 1];
      const others = shuffle(this.allPoems().filter(x => x.id !== p.id)
        .map(x => x.lines[Math.min(i + 1, x.lines.length - 1)]))
        .filter((l, k, a) => l !== correct && a.indexOf(l) === k).slice(0, 3);
      if (others.length === 3) {
        const opts = shuffle([correct, ...others]);
        out.push({ q: `“${p.lines[i]}”的下一句是？`, opts, ans: opts.indexOf(correct), tip: `《${p.title}》全诗：${p.lines.join('，')}。` });
      }
      if (typeof CN_AUTHORS !== 'undefined') {
        const wrongs = shuffle(CN_AUTHORS.filter(a => a !== p.author)).slice(0, 3);
        const aopts = shuffle([p.author, ...wrongs]);
        out.push({ q: `《${p.title}》的作者是？`, opts: aopts, ans: aopts.indexOf(p.author), tip: `${p.dynasty}代诗人${p.author}。` });
      }
      if (p.understand && p.understand.opts) {
        const uopts = shuffle(p.understand.opts.slice());
        out.push({ q: p.understand.q, opts: uopts, ans: uopts.indexOf(p.understand.opts[p.understand.ans]), tip: p.understand.tip || '' });
      }
    }
    this.cnStatic(id).forEach(q => {
      if (!q.opts || q.ans === undefined) return;
      const opts = shuffle(q.opts.slice());
      out.push({ q: q.q, opts, ans: opts.indexOf(q.opts[q.ans]), tip: q.tip || '' });
    });
    return out.filter((x, i) => out.findIndex(y => y.q === x.q) === i);
  },

  pool(id, n) {
    const need = n || 3;
    let list = [];
    if (id.startsWith('cnm_')) list = this.mathPool(id, need).concat(this.mathStatic(id));
    else if (id.startsWith('cnd_')) list = this.daoPool(id);
    else list = this.cnPool(id);
    const seen = new Set(), uniq = [];
    list.forEach(x => { if (x && x.q && !seen.has(x.q)) { seen.add(x.q); uniq.push(x); } });
    return shuffle(uniq).slice(0, need);
  },

  /* 便宜的可用性判断：家长面板按它决定要不要显示「测一测」 */
  has(id) {
    if (typeof KP === 'undefined' || !KP.get(id)) return false;
    if (id.startsWith('cnm_')) return MATH_KP_IDS.has(id) || this.mathStatic(id).length >= 3;
    if (id.startsWith('cnd_')) return this.daoQs(id).length >= 3;
    return this.cnPool(id).length >= 3;
  },

  /* ---------- 答题流程 ---------- */
  start(id) {
    const items = this.pool(id, 3);
    if (items.length < 2) { toast('这个知识点暂时没有可用的自测题'); return; }
    this.kp = id;
    this.items = items;
    this.idx = 0;
    this.ok = 0;
    Sound.stopSpeak();
    setQuestSub('var(--accent)');
    showScreen('quest');
    this.render();
  },

  render() {
    const item = this.items[this.idx];
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', {
        class: 'quest-exit',
        onclick: () => { Sound.stopSpeak(); showScreen('parent'); renderParent(); }
      }, icon('x')),
      h('div', { class: 'quest-prog' }, `🎯 知识点小测 ${this.idx + 1}/${this.items.length}`)
    ));
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'margin-top:10px;min-height:20px' });
    const nextBtn = h('button', {
      class: 'btn btn-main big cn-next', style: 'display:none',
      onclick: () => {
        Sound.tap();
        this.idx++;
        if (this.idx >= this.items.length) this.finish();
        else this.render();
      }
    }, this.idx + 1 >= this.items.length ? '看结果 →' : '下一题 →');
    const card = h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, '🎯 ' + KP.name(this.kp)),
      h('div', { class: 'drill-text' }, item.q)
    );
    const optsEl = h('div', { class: 'cn-opts' });
    let answered = false;
    item.opts.forEach((t, i) => {
      const b = h('button', {
        class: 'cn-opt',
        onclick: () => {
          if (answered) return;
          answered = true;
          const ok = i === item.ans;
          if (ok) {
            this.ok++;
            Sound.correct();
            b.classList.add('right');
            const c = centerOf(b);
            burst(c.x, c.y, { count: 8, colors: ['#58e08a'], power: 45 });
          } else {
            Sound.wrong();
            b.classList.add('wrong');
            if (optsEl.children[item.ans]) optsEl.children[item.ans].classList.add('right');
          }
          Array.from(optsEl.children).forEach(x => { x.disabled = true; });
          tipEl.textContent = (ok ? '✅ ' : '❌ ') + (item.tip || (ok ? '答对了' : '正确答案：' + item.opts[item.ans]));
          nextBtn.style.display = '';
        }
      }, t);
      optsEl.appendChild(b);
    });
    card.appendChild(optsEl);
    card.appendChild(tipEl);
    card.appendChild(nextBtn);
    root.appendChild(card);
  },

  finish() {
    const total = this.items.length;
    const verdict = this.ok === total ? '会' : (this.ok >= total - 1 ? '不稳' : '不会');
    Store.kpCheckSave(this.kp, this.ok, total, verdict);
    const k = KP.get(this.kp);
    const pre = KP.prereqs(this.kp, true).slice(0, 2);
    const stamp = verdict === '会' ? '🎯' : verdict === '不稳' ? '🤔' : '📚';
    const advice = verdict === '会'
      ? '这个知识点可以先放下，按复习路线继续下一条。'
      : verdict === '不稳'
        ? '明天再测一次；也可以先把它相关的错题重做一轮。'
        : (pre.length ? `先复习它的先修点：${pre.map(p => p.name).join('、')}，再回来测。` : '先回到课本把这个知识点看懂，再测一次。');
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, stamp),
      h('div', { class: 'finish-title' }, `自测结果：${verdict}`),
      h('div', { class: 'finish-sub' }, `答对 ${this.ok}/${total} · ${k.name}（${k.grade} 年级${k.semester}）`),
      h('div', { class: 'tiny', style: 'margin:8px 0' }, advice),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.start(this.kp); } }, '再测一次'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { showScreen('parent'); renderParent(); } }, '回家长面板')
      )
    ));
    Sound.gold();
  }
};

const KPReview = {
  /* 从薄弱点沿 hard 先修回溯；只回看一个年级（4 年级的错题回到 3 年级即可，
   * 再往下的 1–2 年级基础默认已经会了，排进来只会让清单变噪音）。
   * 后序保证"先修在前"，再按年级/册次稳定排序 */
  list() {
    if (typeof KP === 'undefined' || typeof kpWeakList !== 'function') return [];
    const weak = kpWeakList(99);
    if (!weak.length) return [];
    const map = new Map(), order = [];
    const visit = (id, cutoff, depth) => {
      const k = KP.get(id);
      if (!k || depth > 8 || k.grade < cutoff || map.has(id)) return;
      map.set(id, { id, weak: 0 });
      KP.prereqs(id, true).forEach(p => visit(p.id, cutoff, depth + 1));
      order.push(id);
    };
    weak.forEach(w => {
      const k = KP.get(w.id);
      if (!k) return;
      visit(w.id, k.grade - 1, 0);
      if (map.get(w.id)) map.get(w.id).weak = w.n;
    });
    const sem = s => (s === '下' ? 1 : 0);
    return order.map(id => map.get(id)).sort((a, b) => {
      const na = KP.get(a.id), nb = KP.get(b.id);
      return na.grade - nb.grade || sem(na.semester) - sem(nb.semester);
    });
  },

  open() {
    const list = this.list();
    if (!list.length) { toast('还没有可排的知识点错题'); return; }
    showModal({
      title: '🗺 期末复习路线',
      build: el => {
        el.appendChild(h('div', { class: 'tiny', style: 'margin-bottom:8px' },
          '按先修顺序排好：从第 1 条开始，每天 3–5 个。🔥 是错题集中的知识点，⛳ 是它的先修。'));
        list.forEach((it, i) => {
          const k = KP.get(it.id);
          const where = k.id.startsWith('cnm_')
            ? (k.domain || '')
            : String(k.chapter || '').replace(/^[一二三四五六]年级[上下]册\s*/, '');
          el.appendChild(h('div', { class: 'kp-route' },
            h('span', { class: 'kp-route-no' }, String(i + 1)),
            h('div', { class: 'kp-route-main' },
              h('div', { class: 'kp-route-name' }, it.weak ? '🔥 ' : '⛳ ', k.name),
              h('div', { class: 'tiny' }, `${k.grade} 年级${k.semester}${where ? ' · ' + where : ''}${it.weak ? ` · 错 ${it.weak} 题` : ' · 先修'}`)
            )
          ));
        });
      },
      actions: [
        { label: '📋 复制清单', onClick: () => this.copy(list) },
        { label: '关掉', cls: 'btn-main' }
      ]
    });
  },

  copy(list) {
    const today = Store.todayStr();
    const text = [`星际求知号 · 期末复习路线（${today}）`]
      .concat(list.map((it, i) => {
        const k = KP.get(it.id);
        return `${i + 1}. ${it.weak ? '【薄弱】' : '【先修】'}${k.name}（${k.grade}年级${k.semester}）${it.weak ? ` · 错 ${it.weak} 题` : ''}`;
      }))
      .join('\n');
    const done = () => toast('已复制，可以粘贴到微信或备忘录');
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败，可以截图保存'); }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else fallback();
  }
};