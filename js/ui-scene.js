/* ============================================================
 * 星际求知号 - 场景词卡（v45 P1-C）
 * 把一类词放进一幅"能动手"的画里：点词牌/序号点听音看义（学习），
 * 小测为四选一（🎧 听音选词 / 👀 看词选义），每题答对 +2 🪙 全对再 +3。
 * 分层思路借鉴 words-flashcard：插画只画物体，词与释义由本页确定性渲染；
 * 标签坐标百分比，正式插画放入 assets/scenes/<id>.jpg 后自动替换 emoji 占位。
 * 词牌防重叠：横向贪心疏散；仍相交的自动收缩成"序号圆点"（点开即学），
 * 小测舞台只做背景不放可点词牌——密集场景（机器人脸/文具桌）不再互相遮挡。
 * 错题挂场景的 PEP 类别词汇点，进家长端英语知识地图。
 * ============================================================ */

const SceneUI = {
  s: null, items: [], idx: 0, correct: 0,

  learnedN() {
    const w = (Store.state.scene && Store.state.scene.words) || {};
    return Object.keys(w).length;
  },

  /* ---------- 场景列表 ---------- */
  openHub() {
    Sound.stopSpeak();
    setQuestSub('var(--accent)');
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.stopSpeak(); showScreen('home'); renderHome(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, '🖼️ 场景词卡')
    ));
    const learned = (Store.state.scene && Store.state.scene.words) || {};
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, '🖼️'),
      h('div', { class: 'splash-title' }, '场景词卡'),
      h('div', { class: 'splash-sub' }, '一类词住进一幅画 · 点词牌听音认词 · 已学 ' + this.learnedN() + '/' + SCENE_CARDS.reduce((n, s) => n + s.words.length, 0) + ' 词')
    ));
    const grid = h('div', { class: 'scene-grid' });
    SCENE_CARDS.forEach(s => {
      const got = s.words.filter(w => learned[w.w]).length;
      grid.appendChild(h('button', {
        class: 'scene-tile', onclick: () => { Sound.tap(); this.openScene(s); }
      },
        h('span', { class: 'scene-tile-emoji' }, s.emoji),
        h('span', { class: 'scene-tile-name' }, s.name),
        h('span', { class: 'scene-tile-prog' + (got === s.words.length ? ' done' : '') }, `📖 ${got}/${s.words.length}`)
      ));
    });
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, '挑一幅画，进去点点看'),
      grid,
      h('div', { class: 'tiny', style: 'margin-top:8px' }, '小提示：点词牌听发音、看意思和例句；全点过一遍再来「考考我」！')
    ));
  },

  /* ---------- 学习页 ---------- */
  openScene(s) {
    Sound.stopSpeak();
    this.s = s;
    window.scrollTo(0, 0); /* 从列表页切入先回顶，避免视口底部留上一页残影 */
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.stopSpeak(); showScreen('home'); renderHome(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, `🖼️ ${s.name}`)
    ));
    const wordCard = h('div', { class: 'scene-wordcard', style: 'display:none' });
    const stage = this.stage(s, 'learn', wordCard);
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, `${s.emoji} ${s.name} · 点词牌听一听`),
      stage,
      wordCard,
      h('div', { class: 'row-gap', style: 'margin-top:10px' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.openHub(); } }, '换一幅'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); this.start(s); } }, '考考我 →')
      )
    ));
    /* 词牌消解必须在插入 DOM 之后（要量真实尺寸）；
     * 首次渲染会触发中文字体懒加载、词牌变宽，fonts.ready 后幂等重跑一次 */
    this.settle(stage, stage._items);
    if (document.fonts) {
      document.fonts.ready.then(() => this.settle(stage, stage._items)).catch(() => {});
    }
  },

  /* ---------- 场景舞台 ----------
   * mode 'learn'：词牌/序号点可点（点开听音看义）
   * mode 'bg'：小测纯背景，不放可点元素
   * 正式插画下不叠 emoji 占位；无图场景用 emoji。
   * 词牌防重叠：横向贪心疏散（按估宽排序右推），仍相交的收缩成序号圆点。 */
  stage(s, mode, wordCard) {
    const learned = (Store.state.scene && Store.state.scene.words) || {};
    const stage = h('div', { class: 'scene-stage', style: `--sky:${s.sky};--ground:${s.ground}` });
    if (s.img) {
      const im = h('img', { class: 'scene-img', src: s.img, alt: s.name });
      im.onerror = () => { im.remove(); stage.classList.add('noimg'); };
      stage.appendChild(im);
    } else stage.classList.add('noimg');
    if (mode === 'bg') return stage;
    if (!s.img) {
      s.words.forEach(word => {
        stage.appendChild(h('div', { class: 'scene-emoji', style: `left:${word.x}%;top:${word.y}%` }, word.emoji));
      });
    }

    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
    const items = s.words.map(word => {
      /* lx/ly：手工标签锚点（极端密集场景精调用），直接作为词牌中心，不走 ±9 偏移 */
      if (word.lx != null) {
        return { word, tx: clamp(word.lx, 8, 92), ty: clamp(word.ly, 10, 88), el: null };
      }
      let ty = word.y - 9;
      if (ty < 8) ty = word.y + 9;
      ty = clamp(ty, 10, 88);
      const tx = clamp(word.x, 8, 92);
      return { word, tx, ty, el: null };
    });
    items.forEach(it => {
      it.el = h('button', {
        class: 'scene-tag' + (learned[it.word.w] ? ' seen' : ''),
        style: `left:${it.tx}%;top:${it.ty}%`,
        onclick: () => this.learnWord(it.word, wordCard)
      },
        h('span', { class: 'scene-tag-w' }, it.word.w),
        h('span', { class: 'scene-tag-zh' }, it.word.zh)
      );
      stage.appendChild(it.el);
    });
    stage._items = items;
    stage._wordCard = wordCard;
    return stage;
  },

  /* 渲染后实测消解（stage 必须已在 DOM 里），三段式：
   * 1) 碰撞先试上移错行（至多两层）；2) 仍碰横推到前一元素右缘+6px；
   * 3) 横推出右缘的收缩成序号圆点，圆点间轻疏散。
   * 用真实 getBoundingClientRect，自适应字体/词长/视口。 */
  settle(stage, items) {
    if (!items || !items.length) return;
    /* 幂等：先把圆点还原成词牌、位置恢复初始，再消解（fonts.ready 后可重复调用） */
    items.forEach(it => {
      if (it.isDot) {
        const tag = h('button', {
          class: 'scene-tag' + ((Store.state.scene && Store.state.scene.words || {})[it.word.w] ? ' seen' : ''),
          style: `left:${it.tx}%;top:${it.ty}%`,
          onclick: () => this.learnWord(it.word, wordCard)
        },
          h('span', { class: 'scene-tag-w' }, it.word.w),
          h('span', { class: 'scene-tag-zh' }, it.word.zh)
        );
        stage.replaceChild(tag, it.el);
        it.el = tag; it.isDot = false;
      } else {
        it.el.style.left = it.tx + '%';
        it.el.style.top = it.ty + '%';
      }
      it.dense = false;
    });
    const wordCard = stage._wordCard;
    const stR = stage.getBoundingClientRect();
    /* 碰撞判定与终检统一：1.5px 容差的矩形相交（角碰也算，避免消解与终检口径不一） */
    const hitR = (a, b) =>
      a.left < b.right - 1.5 && a.right > b.left + 1.5 &&
      a.top < b.bottom - 1.5 && a.bottom > b.top + 1.5;
    /* 同带：垂直方向重叠过半（横推时只对同带者让位） */
    const yBandLike = (a, b) =>
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) >
      Math.min(a.height, b.height) * 0.35;
    const placed = [];   /* 已安置 {it, r}，按 x 排序插入 */
    for (const it of items) {
      let r = it.el.getBoundingClientRect();
      const collides = rr => placed.some(p => hitR(p.r, rr));
      if (collides(r)) {
        /* 上移错行（至多两层，步距 16% > 词牌高，下限 12% 防出顶） */
        for (let k = 1; k <= 2 && collides(r); k++) {
          it.el.style.top = Math.max(parseFloat(it.el.style.top) - 16, 12) + '%';
          r = it.el.getBoundingClientRect();
        }
        /* 仍碰 → 横推到同带已安置者最右缘 + 6px */
        if (collides(r)) {
          const bandRight = Math.max(stR.left,
            ...placed.filter(p => yBandLike(p.r, r)).map(p => p.r.right));
          it.el.style.left = ((bandRight - stR.left + 6 + r.width / 2) / stR.width * 100).toFixed(2) + '%';
          r = it.el.getBoundingClientRect();
          if (r.right > stR.right - 2) it.dense = true;
        }
      }
      /* 按 x 插入 placed 保持有序 */
      const idx = placed.findIndex(p => p.r.left > r.left);
      if (idx < 0) placed.push({ it, r }); else placed.splice(idx, 0, { it, r });
    }
    /* 终检：仍相交的对 → 双方收缩为序号圆点（按 x 编号） */
    for (let i = 1; i < placed.length; i++) {
      if (hitR(placed[i - 1].r, placed[i].r)) {
        placed[i - 1].it.dense = true; placed[i].it.dense = true;
      }
    }
    const dense = items.filter(it => it.dense);
    if (dense.length) {
      dense.sort((a, b) => a.tx - b.tx).forEach((it, i) => {
        const dot = h('button', {
          class: 'scene-dot' + ((Store.state.scene && Store.state.scene.words || {})[it.word.w] ? ' seen' : ''),
          'data-w': it.word.w,
          style: it.el.style.cssText,
          onclick: () => this.learnWord(it.word, wordCard)
        }, String(i + 1));
        stage.replaceChild(dot, it.el);
        it.el = dot; it.isDot = true;
      });
      /* 圆点小（26px），轻疏散 2 轮 */
      for (let round = 0; round < 2; round++) {
        let moved = false;
        const ms2 = items.filter(it => it.isDot).map(it => ({ it, r: it.el.getBoundingClientRect() }))
          .sort((a, b) => a.r.left - b.r.left);
        for (let i = 1; i < ms2.length; i++) {
          const a = ms2[i - 1], b = ms2[i];
          if (yBand(a.r, b.r) && b.r.left - a.r.right < 3) {
            const cur = parseFloat(b.it.el.style.left);
            if (cur < 95) { b.it.el.style.left = (cur + 2.5) + '%'; moved = true; }
          }
        }
        if (!moved) break;
      }
    }
  },

  /* ---------- 学习：点词牌/序号点 → 发音 + 词卡（不发币） ---------- */
  learnWord(word, wordCard) {
    Sound.speakWord(word.w);
    if (!Store.state.scene) Store.state.scene = { words: {} };
    Store.state.scene.words[word.w] = Store.todayStr();
    Store.save();
    wordCard.style.display = '';
    wordCard.innerHTML = '';
    wordCard.appendChild(h('div', { class: 'scene-w-head' },
      h('b', { class: 'scene-w-word' }, word.w),
      h('span', { class: 'scene-w-uk' }, word.uk),
      h('button', { class: 'speak-btn', style: 'margin-left:auto', onclick: () => Sound.speakWord(word.w) }, '🔊')
    ));
    wordCard.appendChild(h('div', { class: 'scene-w-zh' }, word.zh));
    wordCard.appendChild(h('div', { class: 'scene-w-ex' },
      h('div', { class: 'analysis-tag' }, '💬 例句'),
      h('div', { class: 'scene-w-exen', onclick: () => Sound.speakSentence(word.ex.en, 0.85) }, word.ex.en + ' 🔊'),
      h('div', { class: 'scene-w-exzh' }, word.ex.zh)
    ));
    /* 词牌/序号点按词点亮 */
    const stage = wordCard.parentElement.querySelector('.scene-stage');
    Array.from(stage.querySelectorAll('.scene-tag')).forEach(t => {
      if (t.querySelector('.scene-tag-w') && t.querySelector('.scene-tag-w').textContent === word.w) t.classList.add('seen');
    });
    Array.from(stage.querySelectorAll('.scene-dot')).forEach(d => {
      if (d.getAttribute('data-w') === word.w) d.classList.add('seen');
    });
    /* 词卡可能超出视口，展开后滚进视野（平滑、不打断发音） */
    setTimeout(() => wordCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
  },

  /* ---------- 小测：5 题交替 听音选词 / 看词选义（四选一） ---------- */
  start(s) {
    this.s = s;
    const words = shuffle(s.words.slice()).slice(0, 5);
    this.items = words.map((w, i) => ({ w, kind: i % 2 === 0 ? 'listen' : 'read' }));
    this.idx = 0;
    this.correct = 0;
    window.scrollTo(0, 0);
    this.next();
  },

  next() {
    window.scrollTo(0, 0); /* 每题重渲染后回顶，防上一题高度不同留下残影 */
    if (this.idx >= this.items.length) { this.finish(); return; }
    const it = this.items[this.idx];
    const opts = shuffle([{ w: it.w, ok: true },
      ...shuffle(this.s.words.filter(x => x.w !== it.w.w)).slice(0, 3).map(w => ({ w, ok: false }))]);
    this._opts = opts;
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.stopSpeak(); showScreen('home'); renderHome(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, `${this.idx + 1} / ${this.items.length} · ${this.s.name}`)
    ));
    const optsEl = h('div', { class: 'cn-opts' });
    opts.forEach(o => {
      optsEl.appendChild(h('button', {
        class: 'cn-opt' + (it.kind === 'read' ? '' : ' en-opt'),
        style: 'text-align:center;font-weight:800',
        onclick: e => this.pick(it, o, e.currentTarget)
      }, it.kind === 'listen' ? o.w.w : o.w.zh));
    });
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'min-height:20px' });
    root.appendChild(h('div', { class: 'card drill-card center' },
      h('div', { class: 'drill-tag' }, `${this.s.emoji} ${it.kind === 'listen' ? '🎧 听音选词' : '👀 看词选义'}`),
      it.kind === 'listen'
        ? h('div', { class: 'scene-prompt' },
            h('button', { class: 'speak-btn xl', onclick: () => Sound.speakWord(it.w.w) }, '🔊'),
            h('div', { class: 'tiny' }, '听发音，选出这个词'))
        : h('div', { class: 'scene-prompt' },
            h('div', { class: 'scene-quizword', style: 'position:static;transform:none;display:inline-block' }, it.w.w),
            h('div', { class: 'tiny', style: 'margin-top:4px' }, '选出它的意思')),
      this.stage(this.s, 'bg'),
      optsEl, tipEl
    ));
    if (it.kind === 'listen') setTimeout(() => Sound.speakWord(it.w.w), 450);
    Sound.tap();
  },

  pick(it, o, btnEl) {
    if (this.answered) return;
    this.answered = true;
    const optsEl = btnEl.parentElement;
    const ok = o.ok;
    if (ok) {
      this.correct++;
      Sound.correct();
      btnEl.classList.add('right');
      const c = centerOf(btnEl);
      burst(c.x, c.y, { count: 8, colors: ['#58e08a'], power: 45 });
      Store.clearEnWrong('scenes', it.w.w);
    } else {
      Sound.wrong();
      btnEl.classList.add('wrong');
      Array.from(optsEl.children).forEach((b, i) => { if (this._opts[i].ok) b.classList.add('right'); });
      Store.addEnWrong('scenes', it.w.w, this.s.kp);
    }
    Array.from(optsEl.children).forEach(b => { b.disabled = true; });
    const tipEl = optsEl.parentElement.querySelector('.cn-tip');
    if (tipEl) tipEl.textContent = (ok ? '✅ ' : '❌ ') + `${it.w.w} = ${it.w.zh}`;
    setTimeout(() => { this.answered = false; this.idx++; this.next(); }, ok ? 850 : 1600);
  },

  finish() {
    window.scrollTo(0, 0);
    const total = this.items.length;
    const allOk = this.correct === total;
    const gain = Store.finishSceneQuiz(this.correct, total);
    Sound.gold();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, allOk ? '💯' : '🖼️'),
      h('div', { class: 'finish-title' }, `${this.s.name} 小测 ${this.correct}/${total}`),
      h('div', { class: 'finish-sub' }, `获得 +${gain} 🪙${(Store.state.today.mint.scene || 0) > 1 ? ' · 今日重刷，奖励减半' : ''} · 错词已收进英语知识地图`),
      h('div', { class: 'finish-pet' }, `"${rnd(PET_LINES.praise)}" —— ${Store.state.pet.name}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.start(this.s); } }, '再考一次'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); this.openScene(this.s); } }, '回去学词')
      )
    ));
    const c = centerOf($('.finish-stamp'));
    burst(c.x, c.y, { count: 22, emojis: ['🖼️', '⭐', '✨'], power: 120 });
  }
};
