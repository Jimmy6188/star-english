/* ============================================================
 * 环球求知号（v48）—— 地理新学科 · 自绘正交投影 3D 地球仪
 * 三个模式：🧭大洲大洋 / 🌍世界国家（55 国）/ 🗺️中国省份（34 省）
 * 玩法（借鉴 GuessGlobe 的主动回忆设计）：
 *   A 型"找出它"：给名字，在地球仪上点它的位置；
 *   B 型"这是哪"：高亮一块区域，四选一它的名字。
 * 答错的题本轮稍后再来一次（轮内间隔重复）；首次答对即"点亮"
 * 国家/省份（存 state.geo.lit 点亮收藏，配成就徽章）。
 * 数据：js/data-geo.js（Natural Earth 110m 公有领域 + DataV 省界，
 *       已简化到 0.1°~0.3°）；渲染纯 canvas 正交投影，零依赖。
 * 金币：Store.finishGeoRound 走 earnScaled('geo')；不耗语音额度。
 * ============================================================ */
const GlobeUI = {
  OCEANS: [
    { name: '太平洋', lon: -150, lat: 5 }, { name: '大西洋', lon: -32, lat: 18 },
    { name: '印度洋', lon: 78, lat: -22 }, { name: '北冰洋', lon: 0, lat: 82 },
  ],
  CONTINENTS: ['亚洲', '欧洲', '非洲', '北美洲', '南美洲', '大洋洲', '南极洲'],
  ROUND_N: 8,

  MODES: [
    { id: 'cont', emoji: '🧭', name: '大洲大洋', desc: '认七大洲 · 四大洋', tip: '入门热身，不点亮收藏' },
    { id: 'world', emoji: '🌍', name: '世界国家', desc: '55 个国家和地区 · 逐个点亮', tip: '答对就点亮，点亮 30 国拿徽章' },
    { id: 'china', emoji: '🗺️', name: '中国省份', desc: '34 个省级行政区 · 逐个点亮', tip: '点亮全部 34 省是"祖国全图"徽章' },
  ],

  /* ---------- 入口：模式列表 ---------- */
  start() {
    setQuestSub('var(--accent)');
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    const litWorld = (typeof GEO_WORLD !== 'undefined') ? Object.keys(Store.state.geo.lit || {}).filter(n => GEO_WORLD.quiz.includes(n)).length : 0;
    const litChina = (typeof GEO_CHINA !== 'undefined') ? GEO_CHINA.feats.filter(f => Store.state.geo.lit[f[0]]).length : 0;
    root.appendChild(h('div', { class: 'card td-home' },
      h('div', { class: 'math-head' },
        h('span', { class: 'math-emoji' }, '🌍'),
        h('div', { class: 'math-info' },
          h('div', { style: 'font-weight:800' }, '环球求知号'),
          h('div', { class: 'tiny' }, '转动地球仪找一找 · 答对点亮世界地图')),
        h('button', { class: 'btn small', onclick: () => this.howTo() }, '❓玩法')),
      h('div', { class: 'tiny td-eco-tip' }, `已点亮：🌍 ${litWorld}/${GEO_WORLD.quiz.length} 国家 · 🗺️ ${litChina}/${GEO_CHINA.feats.length} 省份 · 每轮 8 题，答错稍后再来一次`)
    ));
    this.MODES.forEach(m => {
      const best = (Store.state.geo.best || {})[m.id] || 0;
      root.appendChild(h('button', { class: 'card subj td-mode', style: '--sub:var(--accent)', onclick: () => { Sound.tap(); this.round(m.id); } },
        h('div', { class: 'math-head' },
          h('span', { class: 'math-emoji' }, m.emoji),
          h('div', { class: 'math-info' },
            h('div', { style: 'font-weight:800' }, m.name),
            h('div', { class: 'tiny' }, m.desc)),
          h('div', { style: 'text-align:center' },
            h('div', { style: 'font-size:15px' }, best ? '⭐'.repeat(best) : '—'),
            h('div', { class: 'tiny' }, '最佳'))),
        h('div', { class: 'tiny', style: 'text-align:left;margin-top:4px' }, m.tip)));
    });
    /* 认一认（v48b）：零基础学习模式，先认后考 */
    root.appendChild(h('div', { class: 'card td-mode', style: '--sub:var(--gold-strong)' },
      h('div', { class: 'math-head' },
        h('span', { class: 'math-emoji' }, '📖'),
        h('div', { class: 'math-info' },
          h('div', { style: 'font-weight:800' }, '认一认 · 零基础学堂'),
          h('div', { class: 'tiny' }, '名字全标在图上，点哪读哪 · 不计分不计时')),
        h('div', { style: 'display:flex;gap:6px' },
          h('button', { class: 'btn small', onclick: e => { e.stopPropagation(); Sound.tap(); this.startExplore('world'); } }, '🌍 世界'),
          h('button', { class: 'btn small', onclick: e => { e.stopPropagation(); Sound.tap(); this.startExplore('china'); } }, '🗺️ 中国')))));
    root.appendChild(h('button', { class: 'btn', style: 'margin-top:12px', onclick: () => { Sound.tap(); showScreen('home'); } }, '🏠 回首页'));
    if ((Store.state.geo.plays || 0) === 0) this.howTo();
  },

  howTo() {
    Sound.tap();
    showModal({
      title: '🌍 怎么玩',
      build: c => c.appendChild(h('div', { style: 'text-align:left;line-height:2;font-size:15px' },
        h('div', {}, '1️⃣ 「找出它」：屏幕给名字，你在地球仪上点中它的位置'),
        h('div', {}, '2️⃣ 「这是哪」：地球仪高亮一块地方，选出它的名字'),
        h('div', {}, '3️⃣ 手指拖动转动地球仪；＋/－ 按钮或双指捏合可以放大，小国家也能点'),
        h('div', {}, '4️⃣ 答错的题本轮稍后再来一次；首次答对就点亮它'),
        h('div', { class: 'tiny', style: 'margin-top:6px' }, '点错的地方会告诉你它叫什么——点错也能学到东西！'))),
      actions: [{ label: '出发！', cls: 'btn-main big', onClick: close => { Sound.tap(); close(); } }],
    });
  },

  /* ---------- 一轮 ---------- */
  round(modeId) {
    const R = { mode: modeId, queue: this.buildQueue(modeId), i: 0, n: this.ROUND_N, firstTry: 0, asked: 0, litNow: [], wrongRe: [], done: false };
    this.R = R;
    this.explore = null; this.pulse = null;
    setQuestSub('var(--accent)');
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    this.progEl = h('div', { class: 'bar slim td-prog' }, h('i', { style: 'width:0%' }));
    const exitBtn = h('button', { class: 'btn small', onclick: () => this.confirmQuit() }, '✖️');
    this.qText = h('div', { class: 'td-cards-zone', style: 'min-height:64px' });
    this.optsEl = h('div', { class: 'cn-opts' });
    if (modeId === 'china') {
      this.canvas = h('canvas', { class: 'td-canvas td-map' });
    } else {
      this.canvas = h('canvas', { class: 'td-canvas' });
    }
    /* 缩放按钮浮层（v48a 反馈：小国家/小省份点不中，加放大） */
    const cvWrap = h('div', { class: 'td-cv-wrap' }, this.canvas,
      h('div', { class: 'td-zoom' },
        h('button', { class: 'td-zbtn', onclick: () => { Sound.tap(); this.zoomAt(1.4); this.draw(); } }, '＋'),
        h('button', { class: 'td-zbtn', onclick: () => { Sound.tap(); this.zoomAt(1 / 1.4); this.draw(); } }, '－')));
    root.appendChild(h('div', { class: 'td-wrap' },
      h('div', { class: 'td-hud' },
        h('div', { class: 'tiny', style: 'font-weight:700' }, this.MODES.find(m => m.id === modeId).emoji + ' ' + this.MODES.find(m => m.id === modeId).name),
        exitBtn),
      h('div', { class: 'td-prog-wrap' }, this.progEl, h('span', { class: 'tiny td-prog-num', 'data-role': 'prognum' }, `0/${R.n}`)),
      cvWrap,
      this.qText, this.optsEl
    ));
    /* 地球仪初始朝向：世界模式先看中国，大洲模式看东半球 */
    if (modeId === 'china') {
      this.view = { type: 'china', zoom: 1, panx: 0, pany: 0 };
    } else {
      this.view = { type: 'globe', lon0: modeId === 'world' ? 105 : 60, lat0: 25, zoom: 1 };
    }
    this.resize();
    if (this._onResize) window.removeEventListener('resize', this._onResize); /* 防反复开局叠加监听 */
    this._onResize = () => { this.resize(); this.draw(); };
    window.addEventListener('resize', this._onResize);
    this.attachGestures();
    this.askNext();
  },

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr; this.cw = rect.width; this.ch = rect.height;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
  },

  zoomAt(f) {
    const v = this.view;
    v.zoom = Math.max(1, Math.min(3.6, (v.zoom || 1) * f));
    if (v.type !== 'globe') { /* 地图缩小回 1 倍时清掉平移 */
      if (v.zoom <= 1.01) { v.panx = 0; v.pany = 0; }
    }
  },

  globeR() { return Math.min(this.cw, this.ch) * 0.44 * (this.view.zoom || 1); },

  /* 手势（round 与认一认共用）：1 指拖动（地球=旋转 / 中国地图=平移），2 指捏合缩放，轻点=作答/查看 */
  attachGestures() {
    const ptrs = new Map();
    let pinch0 = 0, zoom0 = 1;
    let down = null, moved = 0, pinched = false;
    this.canvas.addEventListener('pointerdown', e => {
      try { this.canvas.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
      ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      if (ptrs.size === 2) {
        const pts = [...ptrs.values()];
        pinch0 = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        zoom0 = this.view.zoom || 1;
        pinched = true; down = null;
      } else {
        down = { x: e.offsetX, y: e.offsetY }; moved = 0;
      }
    });
    this.canvas.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return;
      const prev = ptrs.get(e.pointerId);
      const dx = e.offsetX - prev.x, dy = e.offsetY - prev.y;
      ptrs.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      if (ptrs.size >= 2 && pinch0 > 0) {
        const pts = [...ptrs.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        this.view.zoom = Math.max(1, Math.min(3.6, zoom0 * d / pinch0));
        this.draw();
        return;
      }
      if (!down) return;
      moved += Math.abs(dx) + Math.abs(dy);
      if (this.view.type === 'globe') {
        if (moved > 6) {
          this.view.lon0 -= dx * 0.45;
          this.view.lat0 = Math.max(-85, Math.min(85, this.view.lat0 + dy * 0.45));
          down = { x: e.offsetX, y: e.offsetY };
          this.draw();
        }
      } else {
        this.view.panx = (this.view.panx || 0) + dx;
        this.view.pany = (this.view.pany || 0) + dy;
        down = { x: e.offsetX, y: e.offsetY };
        this.draw();
      }
    });
    const finishPtr = e => {
      ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch0 = 0;
      const wasPinched = pinched;
      if (ptrs.size === 0) {
        const d = down; down = null;
        const isTap = d && moved <= 8 && !wasPinched;
        pinched = false;
        if (isTap && !(this.R && this.R.done)) this.onTap(e.offsetX, e.offsetY);
      }
    };
    this.canvas.addEventListener('pointerup', finishPtr);
    this.canvas.addEventListener('pointercancel', finishPtr);
    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15);
      this.draw();
    }, { passive: false });
  },

  /* ---------- 认一认（v48b）：零基础学习模式，全标注+点哪读哪，不计分 ---------- */
  startExplore(kind) {
    this.explore = { kind };
    this.R = null;
    this.hl = null; this.hlCont = null; this.oceanPt = null; this.revealShown = true; this.pulse = null;
    setQuestSub('var(--gold-strong)');
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    const exitBtn = h('button', { class: 'btn small', onclick: () => { Sound.tap(); this.explore = null; this.start(); } }, '✖️');
    const switchBtn = h('button', { class: 'btn small', onclick: () => { Sound.tap(); this.startExplore(kind === 'china' ? 'world' : 'china'); } }, kind === 'china' ? '🌍 去世界' : '🗺️ 去中国');
    this.qText = h('div', { class: 'td-cards-zone', style: 'min-height:64px' });
    this.qText.appendChild(h('div', { class: 'td-q' },
      h('div', { style: 'font-weight:800;font-size:18px' }, '📖 认一认'),
      h('div', { class: 'tiny' }, '名字都标在图上，点哪里都告诉你 · 不计分不计时')));
    this.optsEl = h('div');
    this.canvas = h('canvas', { class: 'td-canvas' + (kind === 'china' ? ' td-map' : '') });
    const cvWrap = h('div', { class: 'td-cv-wrap' }, this.canvas,
      h('div', { class: 'td-zoom' },
        h('button', { class: 'td-zbtn', onclick: () => { this.zoomAt(1.4); this.draw(); } }, '＋'),
        h('button', { class: 'td-zbtn', onclick: () => { this.zoomAt(1 / 1.4); this.draw(); } }, '－')));
    root.appendChild(h('div', { class: 'td-wrap' },
      h('div', { class: 'td-hud' },
        h('div', { class: 'tiny', style: 'font-weight:700' }, '📖 认一认 · ' + (kind === 'china' ? '中国省份' : '世界国家')),
        h('div', { style: 'display:flex;gap:6px' }, switchBtn, exitBtn)),
      cvWrap, this.qText
    ));
    this.view = kind === 'china'
      ? { type: 'china', zoom: 1, panx: 0, pany: 0 }
      : { type: 'globe', lon0: 105, lat0: 25, zoom: 1 };
    this.resize();
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    this._onResize = () => { this.resize(); this.draw(); };
    window.addEventListener('resize', this._onResize);
    this.attachGestures();
    this.draw();
  },

  exploreTap(x, y) {
    let hit = null;
    if (this.explore.kind === 'china') {
      const ll = this.chinaInverse(x, y);
      if (ll) {
        const f = GEO_CHINA.feats.find(f => this.ptInFeats(ll.lon, ll.lat, f[3]));
        if (f) hit = f[0];
      }
    } else {
      const ll = this.globeInverse(x, y);
      if (ll) {
        const f = GEO_WORLD.feats.find(f => this.ptInFeats(ll.lon, ll.lat, f[4]));
        if (f) hit = f[0];
      }
    }
    if (!hit) return;
    this.hl = this.featOf(this.explore.kind, hit);
    this.revealShown = true;
    this.qText.innerHTML = '';
    const sub = this.explore.kind === 'china'
      ? '中国 · 省级行政区'
      : '大洲：' + ((GEO_WORLD.feats.find(f => f[0] === hit) || ['', ''])[1] || '—');
    this.qText.appendChild(h('div', { class: 'td-q' },
      h('div', { style: 'font-weight:800;font-size:20px' }, hit),
      h('div', { class: 'tiny' }, sub)));
    Sound.stopSpeak();
    Sound.speak(hit, 0.9);
    const r = this.canvas.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, { count: 8, colors: ['#ffd166'], power: 40 });
    this.draw();
  },

  /* ---------- A型答题提示（v48b）：帮你转到/闪指目标，用了不计入首答对 ---------- */
  hintLocate(q) {
    if (q.solved) return;
    q.hinted = true;
    Sound.tap();
    if (this.view.type === 'globe') {
      this.flyTo(q);
      toast('已经帮你转过去啦，点那块亮色的地方！');
    } else {
      const f = this.featOf('china', q.name);
      if (!f || !this.chinaXY) return;
      const xy = this.chinaXY;
      this.pulse = { x: xy.ox + (f[1] - xy.x0) * xy.s, y: xy.oy + (xy.y1 - f[2]) * xy.s, t: 1.6 };
      this.pulseAnim();
      this.draw();
      toast('看那个金色圈圈，点它！');
    }
  },
  pulseAnim() {
    if (this._pulseTimer) return;
    this._pulseTimer = setInterval(() => {
      if (!this.pulse) { clearInterval(this._pulseTimer); this._pulseTimer = null; return; }
      this.pulse.t -= 0.12;
      if (this.pulse.t <= 0) this.pulse = null;
      this.draw();
    }, 100);
  },

  /* ---------- 出题队列 ---------- */
  buildQueue(modeId) {
    if (modeId === 'cont') {
      const items = [];
      this.CONTINENTS.slice().sort(() => Math.random() - 0.5).slice(0, 6).forEach(name => items.push({ kind: 'cont', name }));
      this.OCEANS.slice().sort(() => Math.random() - 0.5).slice(0, 2).forEach(o => items.push({ kind: 'ocean', name: o.name }));
      return items.sort(() => Math.random() - 0.5);
    }
    if (modeId === 'world') {
      const lit = Store.state.geo.lit || {};
      const names = GEO_WORLD.quiz.slice().sort((a, b) => (lit[a] ? 1 : 0) - (lit[b] ? 1 : 0));
      return names.slice(0, this.ROUND_N).map(n => ({ kind: 'world', name: n }));
    }
    const lit = Store.state.geo.lit || {};
    const names = GEO_CHINA.feats.map(f => f[0]).sort((a, b) => (lit[a] ? 1 : 0) - (lit[b] ? 1 : 0));
    return names.slice(0, this.ROUND_N).map(n => ({ kind: 'china', name: n }));
  },

  featOf(kind, name) {
    if (kind === 'world') return GEO_WORLD.feats.find(f => f[0] === name);
    if (kind === 'china') return GEO_CHINA.feats.find(f => f[0] === name);
    return null;
  },

  askNext() {
    const R = this.R;
    /* 轮内重现：错过的题插到 3 题之后 */
    if (R.i >= R.queue.length) {
      if (R.wrongRe.length) {
        R.queue = R.queue.concat(R.wrongRe.splice(0));
      } else {
        return this.finishRound();
      }
    }
    const q = R.queue[R.i];
    R.q = q;
    this.hl = null; this.hlCont = null; this.oceanPt = null;
    this.optsEl.innerHTML = '';
    this.revealShown = false;
    const isA = q.kind === 'ocean' ? false : Math.random() < 0.5; /* A=找出它 / B=这是哪 */
    q.type = isA ? 'A' : 'B';
    const progress = () => {
      this.progEl.firstChild.style.width = Math.round(R.asked / R.n * 100) + '%';
      const num = document.querySelector('[data-role="prognum"]');
      if (num) num.textContent = `${Math.min(R.asked, R.n)}/${R.n}`;
    };
    if (isA) {
      this.qText.innerHTML = '';
      this.qText.appendChild(h('div', { class: 'td-q', 'data-role': 'q' },
        h('span', { class: 'tiny' }, `第 ${R.asked + 1} 题 · 找出它`), h('div', { style: 'font-weight:800;font-size:19px' }, q.name),
        h('button', { class: 'btn small', style: 'margin-top:6px', onclick: () => this.hintLocate(q) }, '💡 提示（帮我找）')));
      /* 不自动对准（等于报答案）；帮助走 💡按钮 或答错两次后的自动拉一把 */
    } else {
      /* B 型：高亮目标 */
      if (q.kind === 'ocean') {
        const o = this.OCEANS.find(x => x.name === q.name);
        this.oceanPt = o;
      } else if (q.kind === 'cont') {
        this.hlCont = q.name;
      } else {
        const f = this.featOf(q.kind, q.name);
        this.hl = f; /* B 型只高亮，不自动飞过去（会剧透） */
      }
      this.qText.innerHTML = '';
      this.qText.appendChild(h('div', { class: 'td-q', 'data-role': 'q' },
        h('span', { class: 'tiny' }, `第 ${R.asked + 1} 题 · 这是哪？`), h('div', { class: 'tiny' }, '地球仪上亮起的地方是 →')));
      /* 四选一 */
      const ds = this.distractorNames(q);
      const opts = shuffle([{ t: q.name, ok: true }].concat(ds.map(t => ({ t, ok: false }))));
      opts.forEach(o => {
        this.optsEl.appendChild(h('button', {
          class: 'cn-opt', 'data-ok': o.ok ? '1' : '0',
          onclick: e => this.onChoice(o, e.currentTarget),
        }, o.t));
      });
      this.optsEl.appendChild(hintBtn(this.optsEl));
    }
    progress();
    this.draw();
  },

  distractorNames(q) {
    const seen = new Set([q.name]);
    const out = [];
    const pool = q.kind === 'cont' ? this.CONTINENTS.concat(['南冰洋'])
      : q.kind === 'ocean' ? this.OCEANS.map(o => o.name)
      : q.kind === 'world' ? GEO_WORLD.quiz
      : GEO_CHINA.feats.map(f => f[0]);
    for (const t of shuffle(pool.slice())) {
      if (out.length >= 3) break;
      if (seen.has(t)) continue;
      seen.add(t); out.push(t);
    }
    return out;
  },

  flyTo(q) {
    /* 答错两次后的"拉一把"由 miss 标记触发；这里是 B 型高亮时的 gentle 对准 */
    const f = this.featOf(q.kind, q.name);
    if (!f) return;
    this._fly = { lon: f[2], lat: f[3], t: 0.6 };
    this.flyStep();
  },
  flyStep() {
    if (!this._fly) return;
    const f = this._fly;
    const k = 1 - f.t / 0.6;
    this.view.lon0 += (f.lon - this.view.lon0) * 0.18;
    this.view.lat0 += (f.lat - this.view.lat0) * 0.18;
    f.t -= 0.05;
    this.draw();
    if (f.t > 0) setTimeout(() => this.flyStep(), 50);
    else this._fly = null;
  },

  /* ---------- 点选命中（A 型 / 认一认） ---------- */
  onTap(x, y) {
    if (this.explore) return this.exploreTap(x, y);
    const R = this.R; if (!R || !R.q) return;
    const q = R.q;
    if (this.view.type === 'china') {
      const ll = this.chinaInverse(x, y);
      if (!ll) return this.missTap(null);
      const hit = GEO_CHINA.feats.find(f => this.ptInFeats(ll.lon, ll.lat, f[3]));
      this.judge(hit ? hit[0] : null);
    } else {
      const ll = this.globeInverse(x, y);
      if (!ll) return;
      const hit = GEO_WORLD.feats.find(f => this.ptInFeats(ll.lon, ll.lat, f[4]));
      this.judge(hit ? hit[0] : null);
    }
  },
  judge(hitName) {
    const R = this.R, q = R.q;
    if (q.type !== 'A' || R.done || q.solved) return;
    if (hitName === q.name) {
      if (!q.solved) {
        q.solved = true;
        R.asked++;
        if (!q.missed && !q.hinted) R.firstTry++; /* 用了提示不算首答对（星级略降但不影响通关） */
      }
      this.celebrate(q.name);
    } else {
      if (!q.missed) { q.missed = true; R.wrongRe.push(q); }
      if (hitName) toast(`那是【${hitName}】。再找找【${q.name}】吧！`);
      else toast('再找找，往地球上点一点它～');
      if (q.missCount === undefined) q.missCount = 0;
      q.missCount++;
      if (q.missCount >= 2 && this.view.type === 'globe') this.flyTo(q); /* 拉一把：轻转过去 */
      Sound.wrong();
    }
  },
  onChoice(o, btn) {
    const R = this.R, q = R.q;
    if (q.type !== 'B' || R.done || q.solved) return;
    if (o.ok) {
      q.solved = true;
      R.asked++;
      if (!q.missed) R.firstTry++;
      btn.classList.add('right');
      this.celebrate(q.name);
    } else {
      Sound.wrong();
      btn.classList.add('wrong');
      if (!q.missed) { q.missed = true; R.wrongRe.push(q); }
    }
  },
  celebrate(name) {
    const R = this.R;
    Sound.correct();
    /* 点亮收藏（大洲大洋模式不点亮） */
    const canLit = R.mode !== 'cont' && !R.litNow.includes(name);
    if (canLit && !((Store.state.geo.lit || {})[name])) R.litNow.push(name);
    this.hl = this.featOf(R.q.kind, name) || this.hl;
    this.revealShown = true;
    this.qText.innerHTML = '';
    this.qText.appendChild(h('div', { class: 'td-q' },
      h('div', { style: 'font-weight:800;font-size:19px' }, `🎉 就是【${name}】！` + (canLit ? ' ✨已点亮' : ''))));
    if (typeof Sound !== 'undefined') Sound.speak(name, 0.9);
    const r = this.canvas.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height * 0.35, { count: 12, colors: ['#58e08a', '#ffd166'], power: 55 });
    this.draw();
    setTimeout(() => { R.i++; this.askNext(); }, 950);
  },

  confirmQuit() {
    const R = this.R;
    if (!R || R.done) return this.start();
    if (R.asked === 0) return this.start();
    showModal({
      title: '退出本轮？',
      build: c => c.appendChild(h('div', { style: 'line-height:2' }, '本轮还没答完，退出就白答啦～')),
      actions: [
        { label: '继续答题', cls: 'btn-main big', onClick: close => close() },
        { label: '退出', cls: 'big', onClick: close => { close(); this.start(); } },
      ],
    });
  },

  finishRound() {
    const R = this.R;
    R.done = true;
    const stars = R.firstTry === R.n ? 3 : R.firstTry >= 6 ? 2 : 1;
    const coins = Store.finishGeoRound(R.mode, stars, R.litNow);
    Store.addMinutes(2);
    Sound.gold();
    const lit = Store.state.geo.lit || {};
    const litWorld = Object.keys(lit).filter(n => GEO_WORLD.quiz.includes(n)).length;
    const litChina = GEO_CHINA.feats.filter(f => lit[f[0]]).length;
    const petLine = (typeof PET_LINES !== 'undefined' && PET_LINES.praise) ? `"${rnd(PET_LINES.praise)}" —— ${Store.state.pet.name}` : '';
    const root = $('#quest-root');
    root.innerHTML = '';
    const modeName = this.MODES.find(m => m.id === R.mode).name;
    root.appendChild(h('div', { class: 'card finish-card td-settle' },
      h('div', { class: 'finish-stamp' }, 'Globe Clear!'),
      h('div', { style: 'font-size:44px;margin:6px 0' }, '🌍'),
      h('div', { style: 'font-weight:800;font-size:18px' }, `${modeName} · ${R.n} 题`),
      h('div', { style: 'font-size:26px;letter-spacing:4px;margin:8px 0' }, '⭐'.repeat(stars) + '☆'.repeat(3 - stars)),
      h('div', { class: 'tiny' }, `一次答对 ${R.firstTry}/${R.n} · 入账 ${coins}🪙`),
      R.litNow.length ? h('div', { class: 'tiny', style: 'margin-top:6px' }, '✨ 本轮点亮：' + R.litNow.join('、')) : '',
      h('div', { class: 'tiny', style: 'margin-top:4px' }, `🌍 已点亮 ${litWorld}/${GEO_WORLD.quiz.length} · 🗺️ 已点亮 ${litChina}/${GEO_CHINA.feats.length}`),
      petLine ? h('div', { class: 'finish-pet', style: 'margin-top:8px' }, petLine) : '',
      h('div', { class: 'modal-actions', style: 'margin-top:14px' },
        h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); this.round(R.mode); } }, '🔁 再来一轮'),
        h('button', { class: 'btn big', onclick: () => { Sound.tap(); this.start(); } }, '🧭 选模式')),
    ));
  },

  /* ============================================================
   * 渲染：正交投影地球仪 / 中国平面图
   * ============================================================ */
  draw() {
    if (!this.canvas || !this.canvas.isConnected) return; /* 切页摘掉后不再空绘（v48 审计补） */
    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.view.type === 'china') this.drawChina(ctx); else this.drawGlobe(ctx);
  },

  drawGlobe(ctx) {
    const w = this.cw, hgt = this.ch;
    const cx = w / 2, cy = hgt / 2;
    const R = this.globeR();
    const lam0 = this.view.lon0 * Math.PI / 180, phi0 = this.view.lat0 * Math.PI / 180;
    /* 先整屏清底：只画球体会让球外像素逐帧残留成"虚影"（v48a 反馈） */
    ctx.fillStyle = '#0b1026';
    ctx.fillRect(0, 0, w, hgt);
    const proj = (lon, lat) => {
      const lam = lon * Math.PI / 180 - lam0, phi = lat * Math.PI / 180;
      const cosc = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lam);
      if (cosc < -0.02) return null;
      return [cx + R * Math.cos(phi) * Math.sin(lam), cy - R * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lam))];
    };
    /* 海洋球 */
    const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.15, cx, cy, R);
    g.addColorStop(0, '#1d3f6e'); g.addColorStop(1, '#0a1730');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.fill();
    /* 经纬网（每 30°，只画可见段） */
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let pen = false;
      for (let lon = -180; lon <= 180; lon += 6) {
        const p = proj(lon, lat);
        if (p) { if (!pen) { ctx.moveTo(p[0], p[1]); pen = true; } else ctx.lineTo(p[0], p[1]); } else pen = false;
      }
      ctx.stroke();
    }
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath();
      let pen = false;
      for (let lat = -90; lat <= 90; lat += 6) {
        const p = proj(lon, lat);
        if (p) { if (!pen) { ctx.moveTo(p[0], p[1]); pen = true; } else ctx.lineTo(p[0], p[1]); } else pen = false;
      }
      ctx.stroke();
    }
    /* 国家两遍画法：先底图（普通/已点亮），高亮/答案要素最后画——
     * 防止简化后相邻边界互相覆盖把高亮盖住 */
    const lit = Store.state.geo.lit || {};
    const quizSet = new Set(GEO_WORLD.quiz);
    const Rq = this.R && this.R.q;
    /* 填色高亮：B 型题或已答对；地名标签：只在答对后出现（B 型带名字=泄底，v48b 反馈） */
    const fillName = (Rq && (this.revealShown || (Rq.type === 'B' && Rq.kind === 'world'))) ? Rq.name : null;
    const labelName = (Rq && this.revealShown) ? Rq.name : (this.explore && this.hl ? this.hl[0] : null);
    const hlContFill = 'rgba(255,209,102,0.95)';
    const pass = (onlyHl) => {
      GEO_WORLD.feats.forEach(f => {
        const name = f[0], cont = f[1], polys = f[4];
        const isAnswer = !!(fillName === name || (this.hl && this.hl[0] === name));
        const isContHl = !!(this.hlCont && cont === this.hlCont);
        if (onlyHl !== (isAnswer || isContHl)) return; /* 两遍各画各的 */
        let fill = 'rgba(126,166,114,0.55)';
        if (isContHl) fill = hlContFill;
        else if (isAnswer) fill = 'rgba(255,107,107,0.95)';
        else if (lit[name] && quizSet.has(name)) fill = 'rgba(255,209,102,0.4)';
        ctx.fillStyle = fill;
        this.traceFeats(ctx, polys, proj, cx, cy, R);
        ctx.fill();
        /* 国界描边（v48b 反馈）：白细线分开相邻国家；答案国加亮加粗 */
        ctx.strokeStyle = isAnswer && !isContHl ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.26)';
        ctx.lineWidth = isAnswer && !isContHl ? 1.6 : 1;
        ctx.stroke();
      });
    };
    pass(false);
    pass(true);
    /* 大洋标记：考大洋名时先藏起来（不然答案就在图上），答完再亮出帮助记忆 */
    const hideOcean = this.R && this.R.q && this.R.q.kind === 'ocean' && !this.revealShown;
    if (!hideOcean) this.OCEANS.forEach(o => {
      const p = proj(o.lon, o.lat);
      if (!p) return;
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(160,200,255,0.75)';
      ctx.fillText(o.name, p[0], p[1]);
    });
    /* 大洋题的📍 */
    if (this.oceanPt) {
      const p = proj(this.oceanPt.lon, this.oceanPt.lat);
      if (p) {
        ctx.font = '22px serif'; ctx.fillText('📍', p[0], p[1]);
      }
    }
    /* 答案标签：只在答对后出现（或认一认模式点了它） */
    const labelTarget = labelName;
    if (labelTarget) {
      const f = this.featOf('world', labelTarget);
      if (f) {
        const p = proj(f[2], f[3]);
        if (p) {
          ctx.font = '700 14px sans-serif'; ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.fillText(f[0], p[0], p[1] - 14);
        }
      }
    }
    /* 认一认模式：出题国家全部标注（零基础认知，v48b） */
    if (this.explore && this.explore.kind === 'world') {
      ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      GEO_WORLD.feats.forEach(f => {
        if (!quizSet.has(f[0])) return;
        const p = proj(f[2], f[3]);
        if (!p) return;
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeText(f[0], p[0], p[1]);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(f[0], p[0], p[1]);
      });
    }
    /* 球缘 */
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.stroke();
  },

  traceFeats(ctx, polys, proj) {
    ctx.beginPath(); /* 每个要素独立路径：不 beginPath 会让 fill 反复重刷累积路径互相覆盖 */
    polys.forEach(poly => poly.forEach(ring => {
      let pen = false;
      ring.forEach(pt => {
        const p = proj(pt[0], pt[1]);
        if (p) { if (!pen) { ctx.moveTo(p[0], p[1]); pen = true; } else ctx.lineTo(p[0], p[1]); }
        else pen = false;
      });
      ctx.closePath();
    }));
  },

  globeInverse(x, y) {
    const w = this.cw, hgt = this.ch;
    const cx = w / 2, cy = hgt / 2;
    const R = this.globeR();
    const lam0 = this.view.lon0 * Math.PI / 180, phi0 = this.view.lat0 * Math.PI / 180;
    const xp = (x - cx) / R, yp = (cy - y) / R;
    const rho = Math.hypot(xp, yp);
    if (rho > 1) return null;
    const z = Math.sqrt(1 - rho * rho);
    const phi = Math.asin(Math.cos(phi0) * yp + Math.sin(phi0) * z);
    const lam = Math.atan2(xp, z * Math.cos(phi0) - yp * Math.sin(phi0)) + lam0;
    return { lon: lam * 180 / Math.PI, lat: phi * 180 / Math.PI };
  },

  /* 中国平面图（等经纬简单投影，bbox 73~135E / 17~54N；v48a 加缩放平移） */
  CB: [73, 17, 135, 54],
  drawChina(ctx) {
    const w = this.cw, hgt = this.ch;
    const [x0, y0, x1, y1] = this.CB;
    const pad = 8;
    const zoom = this.view.zoom || 1;
    const sx = (w - pad * 2) / (x1 - x0), sy = (hgt - pad * 2) / (y1 - y0);
    const s = Math.min(sx, sy) * zoom;
    const mw = (x1 - x0) * s, mh = (y1 - y0) * s;
    /* 平移夹紧：放大后地图边缘不许拖出画布，缩回 1 倍自动居中 */
    let ox = (w - mw) / 2 + (this.view.panx || 0);
    let oy = (hgt - mh) / 2 + (this.view.pany || 0);
    ox = mw <= w - pad * 2 ? (w - mw) / 2 : Math.max(w - mw - pad, Math.min(pad, ox));
    oy = mh <= hgt - pad * 2 ? (hgt - mh) / 2 : Math.max(hgt - mh - pad, Math.min(pad, oy));
    this.view.panx = ox - (w - mw) / 2;
    this.view.pany = oy - (hgt - mh) / 2;
    this.chinaXY = { s, ox, oy, x0, y1 };
    const proj = (lon, lat) => [ox + (lon - x0) * s, oy + (y1 - lat) * s];
    ctx.fillStyle = '#0e1e38';
    this.roundRect2(ctx, 0, 0, w, hgt, 14); ctx.fill();
    /* 经纬参考线 */
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let lon = 80; lon <= 130; lon += 10) { const a = proj(lon, y0), b = proj(lon, y1); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    for (let lat = 20; lat <= 50; lat += 10) { const a = proj(x0, lat), b = proj(x1, lat); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    const lit = Store.state.geo.lit || {};
    const Rq = this.R && this.R.q;
    /* 填色高亮：B 型或已答对；省名标签：只在答对后出现（B 型带名字=泄底，v48b） */
    const fillName = (Rq && (this.revealShown || Rq.type === 'B')) ? Rq.name : null;
    const labelName = (Rq && this.revealShown) ? Rq.name : (this.explore && this.hl ? this.hl[0] : null);
    const shortName = n => n.replace(/(省|市|自治区|特别行政区|维吾尔|回族|壮族)/g, '');
    const tracePath = (polys) => {
      ctx.beginPath();
      polys.forEach(poly => poly.forEach(ring => {
        ring.forEach((pt, i) => {
          const p = proj(pt[0], pt[1]);
          if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
        });
        ctx.closePath();
      }));
    };
    const pass = (onlyHl) => {
      GEO_CHINA.feats.forEach(f => {
        const name = f[0], polys = f[3];
        const isAnswer = fillName === name;
        if (onlyHl !== isAnswer) return;
        let fill = 'rgba(126,166,114,0.6)';
        if (isAnswer) fill = 'rgba(255,107,107,0.95)';
        else if (lit[name]) fill = 'rgba(255,209,102,0.42)';
        ctx.fillStyle = fill;
        tracePath(polys);
        ctx.fill();
        /* 省界描边：白色细线让相邻省分开（v48b 反馈：边界模糊难辨认） */
        ctx.strokeStyle = isAnswer ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.32)';
        ctx.lineWidth = isAnswer ? 1.6 : 1;
        tracePath(polys);
        ctx.stroke();
      });
    };
    pass(false);
    pass(true);
    /* 九段线等装饰 */
    ctx.strokeStyle = 'rgba(160,200,255,0.6)'; ctx.lineWidth = 1.6;
    (GEO_CHINA.extra || []).forEach(ring => {
      ctx.beginPath();
      ring.forEach((pt, i) => {
        const p = proj(pt[0], pt[1]);
        if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
      });
      ctx.stroke();
    });
    /* 省名标注：只在答对后出现（或认一认点了它） */
    if (labelName) {
      const f = GEO_CHINA.feats.find(x => x[0] === labelName);
      if (f) {
        const p = proj(f[1], f[2]);
        ctx.font = '700 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillText(shortName(f[0]), p[0], p[1]);
      }
    }
    /* 认一认模式：全部省份短名标注（零基础认知，v48b） */
    if (this.explore && this.explore.kind === 'china') {
      ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      GEO_CHINA.feats.forEach(f => {
        const p = proj(f[1], f[2]);
        if (!p || p[0] < 6 || p[0] > w - 6 || p[1] < 6 || p[1] > hgt - 24) return;
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeText(shortName(f[0]), p[0], p[1]);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(shortName(f[0]), p[0], p[1]);
      });
    }
    /* 💡提示脉冲圈（平面地图用） */
    if (this.pulse) {
      const k = 1 - Math.max(0, this.pulse.t) / 1.6;
      ctx.strokeStyle = `rgba(255,209,102,${0.9 * (1 - k)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(this.pulse.x, this.pulse.y, 6 + 26 * k, 0, 6.28); ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px sans-serif';
    ctx.fillText('放大镜 ＋/－ 可放大，两指捏合也行；直接点省份 🗺️', w / 2, hgt - 10);
  },
  chinaInverse(x, y) {
    if (!this.chinaXY) return null;
    const { s, ox, oy, x0, y1 } = this.chinaXY;
    return { lon: (x - ox) / s + x0, lat: y1 - (y - oy) / s };
  },
  ptInFeats(lon, lat, polys) {
    for (const poly of polys) {
      for (let ri = 0; ri < poly.length; ri++) {
        const ring = poly[ri];
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
          if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
        }
        if (ri === 0 && inside) return true;   /* 外环内 */
        if (ri > 0 && inside) return false;    /* 在洞里 */
      }
    }
    return false;
  },
  roundRect2(ctx, x, y, w, hgt, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + hgt, r);
    ctx.arcTo(x + w, y + hgt, x, y + hgt, r);
    ctx.arcTo(x, y + hgt, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },
};
