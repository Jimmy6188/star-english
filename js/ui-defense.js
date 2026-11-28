/* ============================================================
 * 单词保卫战（v48）—— 教材同步单词塔防
 * 玩法：外星单词怪顶着教材单词向星舰推进，孩子认词后点下方
 * 中文释义卡开火击退；点错怪物加速；每关最后一只头盔 Boss 怪
 * 要连对 3 词才能击落。词库 = 外研版三起 2024/2025 新版三册
 * （data-td.js），错词自动进错题池下一局加练（答对当场清零）。
 * 金币：Store.finishTdLevel 走 earnScaled('td') 防通胀；
 * 锦囊：tap hintBtn 排除 2 张错卡（复用 ui-kit 的 useHintOnce）。
 * ============================================================ */
const DefenseUI = {
  MON_EMOJI: ['👾', '👹', '👺', '🦠', '😈', '🤡'],
  LV_MONSTERS: 10,   // 单元关怪物数
  LV_MIXED: 14,      // 全书混合关怪物数
  sessionWins: 0,    // 本次会话连续关数（≥3 提醒休息）

  /* ---------- 入口：选册 ---------- */
  start() {
    setQuestSub('var(--purple)');
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card td-home' },
      h('div', { class: 'math-head' },
        h('span', { class: 'math-emoji' }, '🛡️'),
        h('div', { class: 'math-info' },
          h('div', { style: 'font-weight:800' }, '单词保卫战'),
          h('div', { class: 'tiny' }, '外研版三起 · 新版教材同步 · 认词击退单词怪')),
        h('button', { class: 'btn small', onclick: () => { Sound.tap(); this.howTo(); } }, '❓玩法')),
      h('div', { class: 'tiny td-eco-tip' }, `💡 锦囊×${(Store.state.items.hints || 0)} · 星舰❤×3 · 连对出 combo`)
    ));
    /* 速度选择（v48a 反馈：默认节奏偏快，三档自选） */
    const gear = Store.state.settings.tdSpeed || 'normal';
    const gears = [['slow', '🐢 慢速', '单词怪走得慢，多想想'], ['normal', '🚶 标准', '原味节奏'], ['fast', '🚀 冲刺', '走得快，奖励同样的币']];
    root.appendChild(h('div', { class: 'card td-gear' },
      h('div', { class: 'tiny', style: 'font-weight:700;margin-bottom:6px' }, '⏱️ 单词怪速度'),
      h('div', { class: 'td-gear-row' }, gears.map(g =>
        h('button', {
          class: 'btn small td-gear-btn' + (gear === g[0] ? ' btn-on' : ''),
          onclick: () => { Sound.tap(); Store.setSetting('tdSpeed', g[0]); this.start(); }
        }, (gear === g[0] ? '✅ ' : '') + g[1]))),
      h('div', { class: 'tiny', style: 'margin-top:6px' }, gears.find(g => g[0] === gear)[2])
    ));
    TD_BOOKS.forEach(b => root.appendChild(this.bookCard(b)));
    root.appendChild(h('button', { class: 'btn', style: 'margin-top:12px', onclick: () => { Sound.tap(); showScreen('home'); } }, '🏠 回首页'));
    if ((Store.state.td.plays || 0) === 0) this.howTo();
  },

  howTo() {
    Sound.tap();
    showModal({
      title: '🛡️ 怎么玩',
      build: c => c.appendChild(h('div', { style: 'text-align:left;line-height:2;font-size:15px' },
        h('div', {}, '1️⃣ 单词怪顶着英文单词往星舰冲'),
        h('div', {}, '2️⃣ 认出它，点下面正确的「中文意思」卡 → 星舰开火！'),
        h('div', {}, '3️⃣ 点错了怪物会「加速」，别让它撞到星舰 ❤'),
        h('div', {}, '4️⃣ 每关最后的「头盔大 Boss」 要连对 3 个词才能击落'),
        h('div', { class: 'tiny', style: 'margin-top:6px' }, '拿不准就点「🔊 听单词」再听一遍；答错的词下一局会再来找你'))),
      actions: [{ label: '明白了！', cls: 'btn-main big', onClick: close => { Sound.tap(); close(); } }],
    });
  },

  bookCard(b) {
    const units = b.units;
    const passed = units.filter(u => (Store.state.td.stars[u.id] || 0) >= 1).length;
    const starsAll = units.reduce((a, u) => a + (Store.state.td.stars[u.id] || 0), 0);
    const mixedId = b.id + '-mix';
    const list = h('div', { class: 'td-levels', style: 'display:none' });
    const renderLevels = () => {
      list.innerHTML = '';
      units.forEach(u => {
        const st = Store.state.td.stars[u.id] || 0;
        list.appendChild(h('button', { class: 'btn small td-lv', onclick: () => { Sound.tap(); this.play(b, u); } },
          h('span', { class: 'td-lv-name' }, u.name.replace(/^Unit\s*\d+\s*/, 'U' + u.name.match(/^Unit\s*(\d+)/) ? u.name.match(/^Unit\s*(\d+)/)[1] + ' ' : '')),
          h('span', { class: 'td-lv-stars' }, st ? '⭐'.repeat(st) : '☆☆☆')));
      });
      const mst = Store.state.td.stars[mixedId] || 0;
      list.appendChild(h('button', { class: 'btn small td-lv td-lv-mix', onclick: () => { Sound.tap(); this.play(b, null); } },
        h('span', { class: 'td-lv-name' }, '📚 全书混合闯关'),
        h('span', { class: 'td-lv-stars' }, mst ? '⭐'.repeat(mst) : '☆☆☆')));
    };
    const card = h('div', { class: 'card td-book' + (b.current ? ' td-book-cur' : '') },
      h('button', {
        class: 'td-book-head', style: 'all:unset;cursor:pointer;display:flex;align-items:center;gap:10px;width:100%',
        onclick: () => { Sound.tap(); renderLevels(); list.style.display = list.style.display === 'none' ? '' : 'none'; }
      },
        h('span', { style: 'font-size:24px' }, b.emoji),
        h('div', { class: 'math-info', style: 'flex:1;text-align:left' },
          h('div', { style: 'font-weight:800' }, b.name, b.current ? h('span', { class: 'chip', style: 'margin-left:6px' }, '本学期') : ''),
          h('div', { class: 'tiny' }, `${b.tag} · 通过 ${passed}/${units.length} · 总 ⭐${starsAll}`)),
        h('span', { class: 'tiny' }, '展开 ▾')),
      list
    );
    return card;
  },

  /* ---------- 组一关的词表 ---------- */
  buildLevelWords(book, unit) {
    const mixed = !unit;
    const total = mixed ? this.LV_MIXED : this.LV_MONSTERS;
    let words;
    if (mixed) {
      const all = [];
      book.units.forEach(u => u.words.forEach(w => all.push(this.tagWord(w, book, u))));
      words = shuffle(all).slice(0, total);
    } else {
      const uw = unit.words.map(w => this.tagWord(w, book, unit));
      words = shuffle(uw).slice(0, Math.min(this.LV_MONSTERS, uw.length));
      while (words.length < total) words.push(words[Math.floor(Math.random() * words.length)]);
    }
    /* 错题池加练：本册错词插队到最前面（答对当场清零，见 killMonster） */
    const pool = (Store.state.td.wrong || []).filter(x => x.bookId === book.id);
    for (let i = pool.length - 1; i >= 0 && i >= pool.length - 2; i--) {
      if (!words.some(w => w.w === pool[i].w)) words.unshift(Object.assign({}, pool[i], { fromPool: true }));
    }
    return words;
  },
  tagWord(w, book, unit) { return { w: w.w, zh: w.zh, bookId: book.id, unitId: unit ? unit.id : '', fromPool: false }; },

  /* 干扰项：同单元优先 → 同册 → 全库；中文释义字符串去重（同义释义永不同屏） */
  distractors(word, n) {
    const seen = new Set([word.zh]);
    const out = [];
    const tiers = [];
    TD_BOOKS.forEach(b => b.units.forEach(u => {
      if (u.id === word.unitId) tiers.unshift(u.words);
      else if (u.id.slice(0, 4) === word.bookId) tiers.push(u.words);
    }));
    tiers.push([].concat(...TD_BOOKS.map(b => b.units.map(u => u.words))));
    for (const tier of tiers) {
      for (const w of shuffle(tier.slice())) {
        if (out.length >= n) return out;
        if (seen.has(w.zh) || w.w === word.w) continue;
        seen.add(w.zh); out.push(w);
      }
    }
    return out;
  },

  /* ---------- 开一关 ---------- */
  play(book, unit) {
    const levelId = unit ? unit.id : book.id + '-mix';
    const words = this.buildLevelWords(book, unit);
    this.G = {
      book, unit, levelId, words,
      total: words.length, killed: 0,
      hearts: 3, combo: 0, maxCombo: 0,
      monsters: [], fx: [], stars: [],
      speed: 0, spawnT: 1.2, spawnGap: 3.4,
      target: null, running: false, over: false,
      cards: null, w: 0, hgt: 0, dpr: 1,
    };
    setQuestSub('var(--purple)');
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    /* HUD */
    this.heartsEl = h('div', { class: 'td-hearts' }, '❤️❤️❤️');
    this.comboEl = h('div', { class: 'td-combo tiny' }, '');
    this.progEl = h('div', { class: 'bar slim td-prog' }, h('i', { style: 'width:0%' }));
    const pauseBtn = h('button', { class: 'btn small', onclick: () => this.pause() }, '⏸️');
    const exitBtn = h('button', { class: 'btn small', onclick: () => { Sound.tap(); this.stop(); this.start(); } }, '✖️');
    /* 卡片区（HTML，含锦囊/重听按钮） */
    this.cardsEl = h('div', { class: 'td-cards' });
    this.hintEl = hintBtn(this.cardsEl);
    this.speakEl = h('button', {
      class: 'btn small',
      onclick: () => { const G = this.G; if (G && G.target) { Sound.stopSpeak(); Sound.speakWord(G.target.words[0].w); } }
    }, '🔊 听单词');
    this.canvas = h('canvas', { class: 'td-canvas' });
    root.appendChild(h('div', { class: 'td-wrap' },
      h('div', { class: 'td-hud' },
        h('div', { style: 'display:flex;align-items:center;gap:8px' }, this.heartsEl, this.comboEl),
        h('div', { style: 'display:flex;align-items:center;gap:6px' }, pauseBtn, exitBtn)),
      h('div', { class: 'td-prog-wrap' }, this.progEl, h('span', { class: 'tiny td-prog-num', 'data-role': 'prognum' }, `0/${this.G.total}`)),
      this.canvas,
      h('div', { class: 'td-cards-zone' }, this.cardsEl, h('div', { class: 'td-tools' }, this.hintEl, this.speakEl))
    ));
    this.resize();
    window.addEventListener('resize', this._onResize = () => this.resize());
    document.addEventListener('visibilitychange', this._onVis = () => { if (document.hidden && this.G && this.G.running) this.pause(); });
    this.countdown(() => { this.G.running = true; this.loopStart(); });
  },

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.G.dpr = dpr;
    this.G.w = rect.width;
    this.G.hgt = rect.height;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
  },

  countdown(cb) {
    const cv = this.canvas, ctx = cv.getContext('2d');
    let n = 3;
    const step = () => {
      this.drawBg(ctx);
      ctx.fillStyle = '#ffd166';
      ctx.font = `800 ${Math.round(this.G.hgt * 0.28)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(n > 0 ? n : 'GO!', this.G.w / 2, this.G.hgt * 0.55);
      Sound.tap();
      if (n-- > 0) setTimeout(step, 700);
      else { this.drawBg(ctx); cb(); }
    };
    step();
  },

  /* ---------- 怪物 ---------- */
  speedMult() {
    const g = Store.state.settings.tdSpeed;
    return g === 'slow' ? 0.55 : g === 'fast' ? 1.45 : 1;
  },
  spawn() {
    const G = this.G;
    const idx = G.killed + G.monsters.length;
    if (idx >= G.total) return;
    const word = G.words[idx];
    const isBoss = idx === G.total - 1;
    const e = this.MON_EMOJI[Math.floor(Math.random() * this.MON_EMOJI.length)];
    G.monsters.push({
      x: G.w + 30,
      y: G.hgt * (0.24 + Math.random() * 0.5),
      hp: isBoss ? 3 : 1, boss: isBoss,
      speed: G.w / 26 * this.speedMult() * (isBoss ? 0.6 : 1) * (0.92 + Math.random() * 0.16),
      emoji: isBoss ? '👹' : e,
      size: isBoss ? 40 : 30, wob: Math.random() * 6.28,
      flash: 0,
      words: isBoss ? [word, this.nextBossWord(G, idx), this.nextBossWord(G, idx)] : [word],
    });
  },
  nextBossWord(G, idx) {
    /* Boss 的第 2/3 词从本关词表尾部取，避免与当前重复 */
    const rest = G.words.slice(idx + 1).concat(G.words);
    return rest.find(w => w !== G.words[idx]) || G.words[idx];
  },

  /* ---------- 当前目标与卡片区 ---------- */
  refreshTarget() {
    const G = this.G;
    /* 目标粘性：当前目标活着就不换——防止怪物前后超越导致卡片/发音反复翻转 */
    if (G.target && G.monsters.includes(G.target)) return;
    const t = G.monsters.reduce((a, b) => !a || b.x > a.x ? b : a, null);
    if (t !== G.target) {
      G.target = t;
      if (t) this.renderCards(t.words[0]);
      else this.cardsEl.innerHTML = '';
    }
  },
  renderCards(word) {
    const G = this.G;
    const ds = this.distractors(word, 3);
    const opts = shuffle([{ w: word, ok: true }].concat(ds.map(w => ({ w, ok: false }))));
    this.cardsEl.innerHTML = '';
    opts.forEach(o => {
      this.cardsEl.appendChild(h('button', {
        class: 'td-card', 'data-ok': o.ok ? '1' : '0',
        onclick: e => this.onCard(o, e.currentTarget),
      },
        h('div', { class: 'td-card-zh' }, o.w.zh)));
    });
    this.hintEl.textContent = '💡 锦囊×' + ((Store.state.items.hints || 0));
    /* 报单词：先掐掉上一段音频再读，杜绝串音 */
    Sound.stopSpeak();
    if (word) Sound.speakWord(word.w);
  },
  onCard(o, btn) {
    const G = this.G;
    /* btn.isConnected：点对后卡区已重渲染，旧按钮的迟到的点击要忽略 */
    if (!G.running || G.over || !G.target || !btn.isConnected) return;
    if (o.ok) this.hitTarget(btn); else this.missCard(btn, G.target.words[0]);
  },
  hitTarget(btn) {
    const G = this.G;
    const t = G.target;
    Sound.correct();
    btn.classList.add('right');
    const word = t.words[0];
    if (word.fromPool) Store.clearTdWrong(word.w);
    t.hp--;
    t.flash = 0.18;
    this.laser(t);
    const r = this.canvas.getBoundingClientRect();
    burst(r.left + t.x, r.top + t.y, { count: 10, colors: ['#58e08a', '#ffd166'], power: 60 });
    if (t.hp <= 0) {
      G.killed++; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
      G.monsters = G.monsters.filter(m => m !== t);
      G.fx.push({ type: 'ring', x2: t.x, y2: t.y, t: 0.4 });
      if (G.combo >= 3) this.comboEl.textContent = `🔥 连对×${G.combo}`;
    } else {
      t.words.shift();
      this.renderCards(t.words[0]); /* Boss 换下一词，卡片必须同步重渲染 */
    }
    this.comboEl.textContent = G.combo >= 3 ? `🔥 连对×${G.combo}` : '';
    this.prog();
    this.refreshTarget();
    if (G.killed >= G.total) this.finish(true);
  },
  missCard(btn, word) {
    const G = this.G;
    Sound.wrong();
    Sound.stopSpeak(); /* 点错掐掉当前词音频，不与后续发音叠在一起 */
    btn.classList.add('wrong');
    setTimeout(() => btn.classList.remove('wrong'), 650);
    G.combo = 0; this.comboEl.textContent = '';
    if (G.target) G.target.speed = Math.min(G.target.speed * 1.5, G.w / 12); /* 点错加速，封顶 */
    Store.addTdWrong({ w: word.w, zh: word.zh, bookId: word.bookId });
  },
  laser(t) {
    this.G.fx.push({ type: 'laser', x2: t.x, y2: t.y, t: 0.22 });
  },
  prog() {
    const G = this.G;
    this.progEl.firstChild.style.width = Math.round(G.killed / G.total * 100) + '%';
    const num = document.querySelector('[data-role="prognum"]');
    if (num) num.textContent = `${G.killed}/${G.total}`;
  },

  /* ---------- 主循环 ---------- */
  loopStart() {
    let last = performance.now();
    const step = now => {
      /* 画布被别的模块摘掉时自停（v48 审计补） */
      if (!this.G || this.G.over || !this.canvas || !this.canvas.isConnected) { this.stop(); return; }
      /* 离开冒险屏自动挂起、回来自动恢复：防止看不见的地方被偷血/白耗电 */
      const questActive = document.getElementById('screen-quest') && document.getElementById('screen-quest').classList.contains('active');
      if (!questActive && this.G.running) { this.G.running = false; this.G.autoPaused = true; }
      if (questActive && this.G.autoPaused && !this.G.over) { this.G.running = true; this.G.autoPaused = false; }
      if (this.G.running) {
        const dt = Math.min(0.05, (now - last) / 1000);
        this.update(dt);
      }
      this.draw();
      last = now;
      this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  },
  update(dt) {
    const G = this.G;
    if (!G || !G.running || G.over) return; /* 倒计时/暂停/结算期间状态冻结 */
    G.spawnT -= dt;
    const aliveCap = 4;
    if (G.spawnT <= 0 && G.monsters.length < aliveCap) {
      this.spawn();
      const idx = G.killed + G.monsters.length;
      G.spawnT = idx >= G.total - 1 ? 2.2 : G.spawnGap;
    }
    G.monsters.forEach(m => {
      m.x -= m.speed * dt;
      m.wob += dt * 6;
    });
    /* 撞舰 */
    const shipX = 46;
    const crashed = G.monsters.filter(m => m.x <= shipX + 30);
    crashed.forEach(m => {
      G.hearts--;
      G.combo = 0; this.comboEl.textContent = '';
      G.monsters = G.monsters.filter(x => x !== m);
      Sound.wrong();
      const r = this.canvas.getBoundingClientRect();
      burst(r.left + m.x, r.top + m.y, { count: 12, colors: ['#ff6b6b', '#ffd166'], power: 70 });
    });
    if (crashed.length) {
      this.heartsEl.textContent = '❤️'.repeat(Math.max(0, G.hearts)) + '💔'.repeat(3 - Math.max(0, G.hearts));
      if (G.hearts <= 0) return this.finish(false);
    }
    G.fx.forEach(f => f.t -= dt);
    G.fx = G.fx.filter(f => f.t > 0);
    G.monsters.forEach(m => { if (m.flash > 0) m.flash -= dt; });
    this.refreshTarget();
  },
  drawBg(ctx) {
    const G = this.G, w = G.w, hgt = G.hgt;
    const g = ctx.createLinearGradient(0, 0, 0, hgt);
    g.addColorStop(0, '#0b1026'); g.addColorStop(1, '#131b3d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, hgt);
    /* 星云微光两团 */
    const nebula = (x, y, r, color) => {
      const n = ctx.createRadialGradient(x, y, 0, x, y, r);
      n.addColorStop(0, color); n.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = n; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    nebula(w * 0.82, hgt * 0.18, w * 0.35, 'rgba(120,80,255,0.10)');
    nebula(w * 0.15, hgt * 0.85, w * 0.4, 'rgba(0,160,255,0.08)');
    /* 两层视差星：亮层闪烁缓漂，暗层稳定铺底 */
    if (!this._starsBg) {
      this._starsBg = Array.from({ length: 64 }, () => ({
        x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.3,
        p: Math.random() * 6.28, layer: Math.random() < 0.35 ? 1 : 0,
      }));
    }
    const t = performance.now() / 1000;
    this._starsBg.forEach(s => {
      const drift = s.layer ? (t * 4) % w : (t * 1.5) % w;
      const sx = (s.x * w - drift + w) % w;
      ctx.globalAlpha = s.layer ? 0.5 + 0.35 * Math.sin(t * 1.8 + s.p) : 0.28;
      ctx.fillStyle = s.layer ? '#ffffff' : '#9fb4e8';
      ctx.beginPath(); ctx.arc(sx, s.y * hgt, s.r, 0, 6.28); ctx.fill();
    });
    ctx.globalAlpha = 1;
  },
  draw() {
    if (!this.canvas || !this.G) return;
    const G = this.G;
    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    this.drawBg(ctx);
    const shipY = G.hgt * 0.52 + Math.sin(performance.now() / 500) * 3;
    /* 护盾环：血量越少越淡 */
    const shieldA = 0.10 + 0.16 * (Math.max(0, G.hearts) / 3);
    ctx.strokeStyle = `rgba(88,180,255,${shieldA})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(46, shipY, 34 + Math.sin(performance.now() / 300) * 2, 0, 6.28); ctx.stroke();
    /* 尾焰：闪动火舌 */
    const fl = 10 + Math.random() * 8;
    const fg = ctx.createLinearGradient(30, shipY, 30 - fl, shipY);
    fg.addColorStop(0, 'rgba(255,209,102,0.9)'); fg.addColorStop(1, 'rgba(255,107,107,0)');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(32, shipY - 6); ctx.lineTo(32 - fl, shipY); ctx.lineTo(32, shipY + 6); ctx.closePath(); ctx.fill();
    ctx.font = '34px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🚀', 46, shipY);
    /* 特效：激光渐变束 + 击落冲击环 */
    G.fx.forEach(f => {
      if (f.type === 'laser') {
        const a = Math.max(0, f.t / 0.22);
        const lg = ctx.createLinearGradient(58, shipY, f.x2, f.y2);
        lg.addColorStop(0, `rgba(88,224,138,${0.9 * a})`);
        lg.addColorStop(1, `rgba(88,224,138,${0.15 * a})`);
        ctx.strokeStyle = lg; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(58, shipY); ctx.lineTo(f.x2, f.y2); ctx.stroke();
      } else if (f.type === 'ring') {
        const k = 1 - Math.max(0, f.t / 0.4);
        ctx.strokeStyle = `rgba(255,209,102,${0.8 * (1 - k)})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(f.x2, f.y2, 8 + 30 * k, 0, 6.28); ctx.stroke();
      }
    });
    /* 怪物：光晕 + 受击白闪 + 描边单词牌 */
    G.monsters.forEach(m => {
      const y = m.y + Math.sin(m.wob) * 4;
      const size = m.boss ? m.size + 10 : m.size;
      const glow = ctx.createRadialGradient(m.x, y, 2, m.x, y, size * 1.15);
      glow.addColorStop(0, m.boss ? 'rgba(255,107,107,0.28)' : 'rgba(120,150,255,0.22)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(m.x, y, size * 1.15, 0, 6.28); ctx.fill();
      ctx.font = `${size}px serif`;
      ctx.fillText(m.emoji, m.x, y);
      if (m.flash > 0) {
        ctx.globalAlpha = Math.min(0.85, m.flash * 6);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(m.x, y, size * 0.62, 0, 6.28); ctx.fill();
        ctx.globalAlpha = 1;
      }
      const word = m.words[0];
      const label = word ? word.w : '';
      ctx.font = `700 ${m.boss ? 15 : 13}px sans-serif`;
      const wpx = Math.max(ctx.measureText(label).width + 22, 52);
      const bx = m.x, by = y - size * 0.92;
      ctx.fillStyle = m === G.target ? 'rgba(255,209,102,0.96)' : 'rgba(255,255,255,0.85)';
      ctx.strokeStyle = m === G.target ? 'rgba(120,72,0,0.35)' : 'rgba(20,30,60,0.25)';
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, bx - wpx / 2, by - 14, wpx, 28, 9); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx - 5, by + 13); ctx.lineTo(bx + 5, by + 13); ctx.lineTo(bx, by + 20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1c2440';
      ctx.fillText(label, bx, by);
      if (m.boss) {
        ctx.font = '13px serif';
        ctx.fillText('🛡️ ' + '❤'.repeat(m.hp), bx, by - 25);
      }
    });
  },
  roundRect(ctx, x, y, w, hgt, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + hgt, r);
    ctx.arcTo(x + w, y + hgt, x, y + hgt, r);
    ctx.arcTo(x, y + hgt, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  pause() {
    const G = this.G;
    if (!G || !G.running || G.over) return;
    G.running = false;
    Sound.tap();
    showModal({
      title: '⏸️ 暂停',
      build: c => c.appendChild(h('div', { style: 'line-height:2' }, '休息一下，单词怪等你回来～')),
      actions: [
        { label: '▶️ 继续', cls: 'btn-main big', onClick: close => { close(); G.running = true; } },
        { label: '📖 选关', cls: 'big', onClick: close => { close(); this.stop(); this.start(); } },
      ],
    });
  },
  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    document.removeEventListener('visibilitychange', this._onVis);
    if (typeof Sound !== 'undefined') Sound.stopSpeak();
    this.G = null;
  },

  /* ---------- 结算 ---------- */
  finish(win) {
    const G = this.G;
    G.over = true; G.running = false;
    const stars = win ? Math.max(1, G.hearts) : 0;
    const coins = win ? Store.finishTdLevel(G.levelId, stars) : 0;
    Store.addMinutes(3);
    if (win) {
      this.sessionWins++;
      if (this.sessionWins === 3) setTimeout(() => toast('连续 3 关啦，让眼睛休息一下吧 💤'), 1200);
      Sound.gold();
    } else {
      Sound.stamp();
    }
    const wrongWords = G.words.filter(w => { /* 本关点错过的词 = 错题池里本册最新的 */
      return (Store.state.td.wrong || []).some(x => x.w === w.w && x.bookId === G.book.id);
    });
    const lvName = G.unit ? G.unit.name : '全书混合';
    const petLine = (typeof PET_LINES !== 'undefined' && PET_LINES.praise) ? `"${rnd(PET_LINES.praise)}" —— ${Store.state.pet.name}` : '';
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card finish-card td-settle' },
      h('div', { class: 'finish-stamp' }, win ? 'Defense Clear!' : 'Try Again'),
      h('div', { style: 'font-size:44px;margin:6px 0' }, win ? '🎉' : '💪'),
      h('div', { style: 'font-weight:800;font-size:18px' }, `${G.book.name} · ${lvName}`),
      h('div', { style: 'font-size:26px;letter-spacing:4px;margin:8px 0' },
        win ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : '⭐'),
      h('div', { class: 'tiny' },
        `击退 ${G.killed}/${G.total} · 最高连对×${G.maxCombo}` + (coins ? ` · 入账 ${coins}🪙` : '')),
      wrongWords.length ? h('div', { class: 'td-wrong', style: 'margin-top:10px;text-align:left' },
        h('div', { class: 'tiny', style: 'font-weight:700' }, '📕 本关点错的词（下一局会再来，点一下听发音）'),
        h('div', { class: 'td-wrong-list' }, wrongWords.map(w =>
          h('button', { class: 'chip td-wrong-chip', onclick: () => Sound.speakWord(w.w) }, `${w.w} ${w.zh}`)))) : '',
      petLine ? h('div', { class: 'finish-pet' }, petLine) : '',
      h('div', { class: 'modal-actions', style: 'margin-top:14px' },
        h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); this.play(G.book, G.unit); } }, win ? '🔁 再来一次' : '🔄 再挑战'),
        h('button', { class: 'btn big', onclick: () => { Sound.tap(); this.start(); } }, '📖 选关')),
    ));
    this.stop();
  },
};
