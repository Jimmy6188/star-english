/* ============================================================
 * 星际英语站 - 任务流引擎
 * 新词学习 → 拼写闯关（字母块） → 传送奖励动画
 * 复习按熟练度分级出题：听音选图 / 看图选词 / 句子填空 /
 * 拼写（高阶混入干扰字母）/ 听写挑战（隐藏中文）
 * 错词挑战：针对错题本的专项击破
 * ============================================================ */

const Quest = {
  items: [], idx: 0, startedTs: 0, freeMode: false, drillMode: false, warnedLimit: false,

  qroot() { return $('#quest-root'); },

  start(free) {
    Sound.stopSpeak();
    this.freeMode = !!free;
    this.drillMode = false;
    const s = Store.state;
    if (!free) {
      const newCap = Math.max(0, s.settings.dailyNew - s.today.newDone);
      const revCap = Math.max(0, s.settings.dailyReview - s.today.revDone);
      const nq = Store.newPool(newCap).map(id => ({ id, kind: 'new' }));
      const rq = shuffle(Store.dueList().slice(0, revCap)).map(id => ({ id, kind: 'review' }));
      const items = [];
      while (nq.length || rq.length) {
        if (rq.length) items.push(rq.shift());
        if (rq.length) items.push(rq.shift());
        if (nq.length) items.push(nq.shift());
      }
      if (!items.length) { toast('今天没有新词，也没有待复习的词，明天再来！'); return; }
      this.items = items;
    } else {
      const learned = Object.keys(Store.state.srs).filter(id => Store.findWord(id));
      if (learned.length < 4) { toast('先学几个新词，再来自由练习吧'); return; }
      this.items = shuffle(learned).slice(0, 5).map(id => ({ id, kind: 'review' }));
    }
    this.idx = 0;
    this.startedTs = Date.now();
    this.warnedLimit = false;
    showScreen('quest');
    this.splash();
  },

  /* 错词挑战：专打错题本里的老对手 */
  startDrill() {
    Sound.stopSpeak();
    const weak = Store.weakList(5);
    if (!weak.length) { toast('现在没有老对手，先去学新词吧！'); return; }
    this.freeMode = false;
    this.drillMode = true;
    this.items = weak.map(id => ({ id, kind: 'review' }));
    this.idx = 0;
    this.startedTs = Date.now();
    this.warnedLimit = false;
    showScreen('quest');
    this.splash();
  },

  splash() {
    const n = this.items.length;
    this.qroot().innerHTML = '';
    const icon = this.drillMode ? '⚡' : '🚀';
    const title = this.drillMode ? '错词来袭！' : (this.freeMode ? '自由练习起飞！' : '今日冒险开始！');
    const sub = this.drillMode ? `${n} 个老对手等你击退` : (this.freeMode ? '5 个复习挑战' : `共 ${n} 个挑战关卡`);
    this.qroot().appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, icon),
      h('div', { class: 'splash-title' }, title),
      h('div', { class: 'splash-sub' }, sub),
      h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); this.next(); } }, '出发 →')
    ));
  },

  checkLimit() {
    if (this.freeMode || this.drillMode || this.warnedLimit) return;
    const min = (Date.now() - this.startedTs) / 60000;
    if (min > Store.state.settings.sessionLimitMin) {
      this.warnedLimit = true;
      toast(`${Store.state.pet.name} 快没电了，做完这关就休息一下吧 🔋`);
    }
  },

  /* 复习题型按熟练度（Leitner 盒子）分级，越熟越难 */
  pickReviewMode(item) {
    if (item.mode) return item.mode;
    const rec = Store.state.srs[item.id];
    const box = rec ? rec.box : 1;
    if (this.drillMode) return 'spell';
    if (box >= 4) return 'spellHard';
    if (box === 3) return Math.random() < 0.5 ? 'cloze' : 'spellDecoy';
    if (box === 2) return Math.random() < 0.6 ? 'wordPick' : 'listen';
    return 'listen';
  },

  next() {
    this.checkLimit();
    if (this.idx >= this.items.length) { this.finish(); return; }
    const item = this.items[this.idx];
    const w = Store.findWord(item.id);
    if (!w) { this.idx++; this.next(); return; }
    if (item.kind === 'new') { this.renderIntro(w); return; }
    const mode = this.pickReviewMode(item);
    item.mode = mode;
    if (mode === 'spellHard') this.renderSpelling(w, false, { hardMode: true, decoys: true });
    else if (mode === 'spellDecoy') this.renderSpelling(w, false, { decoys: true });
    else if (mode === 'spell') this.renderSpelling(w, false);
    else if (mode === 'cloze') this.renderCloze(w);
    else if (mode === 'wordPick') this.renderWordPick(w);
    else this.renderListening(w);
  },

  progressHeader() {
    return h('div', { class: 'quest-top' },
      h('button', {
        class: 'quest-exit', onclick: () => confirmModal('退出冒险？', '今天学的进度会保留，随时可以回来继续。', () => {
          this.addMinutes(); showScreen('home'); renderHome();
        })
      }, '✕'),
      h('div', { class: 'quest-prog' }, `${this.idx + 1} / ${this.items.length}`)
    );
  },

  addMinutes() {
    const min = Math.round((Date.now() - this.startedTs) / 60000);
    if (min > 0) Store.addMinutes(Math.min(60, min));
  },

  /* 取同星系的干扰项（不足时从全部词库补） */
  distractors(w, n = 3) {
    const pack = Store.allPacks().find(p => p.id === w.cat) || Store.allPacks()[0];
    const others = pack.words.filter(x => x.word.toLowerCase() !== w.word.toLowerCase());
    const pool = others.length >= n ? others : Store.allPacks().flatMap(p => p.words).filter(x => x.word.toLowerCase() !== w.word.toLowerCase());
    return shuffle(pool).slice(0, n);
  },

  /* ---------- 新词学习卡 ---------- */
  renderIntro(w) {
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    const cur = Store.state.settings.grade;
    const badge = w.grade && w.grade !== cur
      ? h('div', { class: 'grade-badge ' + (w.grade < cur ? 'g-low' : 'g-high') }, gradeLabel(w))
      : '';
    const card = h('div', { class: 'card intro-card' },
      h('div', { class: 'intro-tag' }, '✨ 发现新单词'),
      badge,
      h('div', { class: 'intro-emoji' }, w.emoji),
      h('div', { class: 'intro-word-row' },
        h('span', { class: 'intro-word' }, w.word),
        h('button', { class: 'speak-btn big', onclick: () => Sound.speak(w.word) }, '🔊')
      ),
      h('div', { class: 'intro-zh' }, w.zh),
      h('div', { class: 'intro-ex' },
        h('button', { class: 'speak-btn', onclick: () => Sound.speak(w.ex) }, '🔊 '),
        h('span', {}, w.ex)
      ),
      h('div', { class: 'tiny intro-exzh' }, w.exZh),
      h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); this.renderSpelling(w, true); } }, '进入拼写舱 →')
    );
    root.appendChild(card);
    setTimeout(() => Sound.speak(w.word), 400);
  },

  /* ---------- 拼写挑战 ---------- */
  /* opts: hardMode=听写挑战(隐藏中文) decoys=混入干扰字母 */
  renderSpelling(w, isNew, opts = {}) {
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    const target = w.word.toLowerCase();
    let answer = [];
    let hints = 0, wrongs = 0;

    const slotsEl = h('div', { class: 'slots' });
    const tilesEl = h('div', { class: 'tiles' });
    const ghostEl = h('div', { class: 'ghost-word', style: 'visibility:hidden' }, target);

    const slotEls = [];
    for (let i = 0; i < target.length; i++) {
      const s = h('span', {
        class: 'slot', onclick: () => {
          if (!answer.length) return;
          const last = answer.pop();
          last.tile.classList.remove('used');
          Sound.tap();
          refresh();
        }
      });
      slotEls.push(s);
      slotsEl.appendChild(s);
    }

    function refresh() {
      slotEls.forEach((s, i) => {
        s.textContent = answer[i] ? answer[i].ch : '';
        s.classList.toggle('filled', !!answer[i]);
      });
    }

    let letters = target.split('');
    if (opts.decoys && target.length >= 4) {
      const pool = 'abcdefghilmnoprstuw'.split('').filter(c => !target.includes(c));
      letters = letters.concat(shuffle(pool).slice(0, 2));
    }
    shuffle(letters).forEach(ch => {
      const t = h('button', {
        class: 'tile', onclick: () => {
          if (t.classList.contains('used') || answer.length >= target.length) return;
          t.classList.add('used');
          answer.push({ ch, tile: t });
          Sound.tap();
          refresh();
          if (answer.length === target.length) setTimeout(check, 250);
        }
      }, ch);
      tilesEl.appendChild(t);
    });

    function doHint() {
      if (answer.length >= target.length) return;
      const needCh = target[answer.length];
      let tile = Array.from(tilesEl.children).find(t => !t.classList.contains('used') && t.textContent === needCh);
      while (!tile && answer.length) { // 需要的字母被误放在前面时，先释放最前面的字母
        const first = answer.shift();
        first.tile.classList.remove('used');
        tile = Array.from(tilesEl.children).find(t => !t.classList.contains('used') && t.textContent === needCh);
      }
      if (!tile) return;
      tile.classList.add('used');
      answer.push({ ch: needCh, tile });
      hints++;
      Sound.tap();
      refresh();
      if (answer.length === target.length) setTimeout(check, 250);
    }

    const self = this;
    function check() {
      const guess = answer.map(a => a.ch).join('');
      if (guess === target) {
        self.success(w, isNew, hints, wrongs);
      } else {
        wrongs++;
        Sound.wrong();
        slotsEl.classList.add('shake');
        setTimeout(() => slotsEl.classList.remove('shake'), 450);
        answer = [];
        Array.from(tilesEl.children).forEach(t => t.classList.remove('used'));
        refresh();
        if (wrongs >= 2) ghostEl.style.visibility = 'visible';
      }
    }

    root.appendChild(h('div', { class: 'card spell-card' },
      h('div', { class: 'spell-prompt' },
        isNew ? '把新单词拼出来！' : (opts.hardMode ? '⚡ 听写挑战：听发音拼写' : '复习：拼出这个单词')),
      opts.hardMode ? '' : h('div', { class: 'spell-zh' }, w.zh),
      h('button', { class: 'speak-btn xl', onclick: () => Sound.speak(w.word) }, '🔊'),
      h('div', { class: 'tiny' }, opts.decoys ? '小心！字母块里有捣蛋鬼' : '听发音，从下面选出字母'),
      slotsEl,
      ghostEl,
      tilesEl,
      h('div', { class: 'row-gap center' },
        h('button', { class: 'btn', onclick: doHint }, '💡 提示一下 (-2🪙)')
      )
    ));
    setTimeout(() => Sound.speak(w.word), 350);
  },

  /* ---------- 听音选图 ---------- */
  renderListening(w) {
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    const opts = shuffle([w, ...this.distractors(w)]);
    let recordedWrong = false;
    const self = this;

    const grid = h('div', { class: 'listen-grid' });
    opts.forEach(o => {
      const oid = o.word.toLowerCase();
      grid.appendChild(h('button', {
        class: 'listen-opt', 'data-id': oid,
        onclick: e => {
          if (e.currentTarget.classList.contains('dead')) return;
          if (oid === w.word.toLowerCase()) {
            const reward = Store.reviewWord(w.word.toLowerCase(), true);
            Sound.correct();
            const c = centerOf(e.currentTarget);
            burst(c.x, c.y, { count: 10, emojis: ['✨', '⭐'], power: 60 });
            floatText(c.x, c.y - 20, `+${reward} 🪙`);
            Sound.speak(w.word);
            e.currentTarget.classList.add('right');
            setTimeout(() => { self.idx++; self.next(); }, 1000);
          } else {
            if (!recordedWrong) { recordedWrong = true; Store.reviewWord(w.word.toLowerCase(), false); }
            Sound.wrong();
            e.currentTarget.classList.add('dead');
          }
        }
      }, h('span', { class: 'listen-emoji' }, o.emoji)));
    });

    root.appendChild(h('div', { class: 'card listen-card' },
      h('div', { class: 'spell-prompt' }, '听！是哪个词？'),
      h('button', { class: 'speak-btn xl', onclick: () => Sound.speak(w.word) }, '🔊'),
      grid
    ));
    setTimeout(() => Sound.speak(w.word), 350);
  },

  /* ---------- 看图选词 ---------- */
  renderWordPick(w) {
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    const opts = shuffle([w, ...this.distractors(w)]);
    let recordedWrong = false;
    const self = this;

    const grid = h('div', { class: 'pick-grid' });
    opts.forEach(o => {
      const oid = o.word.toLowerCase();
      grid.appendChild(h('button', {
        class: 'pick-opt', 'data-id': oid,
        onclick: e => {
          if (e.currentTarget.classList.contains('dead')) return;
          if (oid === w.word.toLowerCase()) {
            const reward = Store.reviewWord(w.word.toLowerCase(), true);
            Sound.correct();
            const c = centerOf(e.currentTarget);
            burst(c.x, c.y, { count: 8, emojis: ['✨', '⭐'], power: 50 });
            floatText(c.x, c.y - 20, `+${reward} 🪙`);
            Sound.speak(w.word);
            e.currentTarget.classList.add('right');
            setTimeout(() => { self.idx++; self.next(); }, 1000);
          } else {
            if (!recordedWrong) { recordedWrong = true; Store.reviewWord(w.word.toLowerCase(), false); }
            Sound.wrong();
            e.currentTarget.classList.add('dead');
          }
        }
      }, o.word));
    });

    root.appendChild(h('div', { class: 'card listen-card' },
      h('div', { class: 'spell-prompt' }, '这个词怎么写？'),
      h('div', { class: 'pick-emoji' }, w.emoji),
      grid
    ));
  },

  /* ---------- 句子填空 ---------- */
  renderCloze(w) {
    const id = w.word.toLowerCase();
    const wordRe = new RegExp('\\b' + w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(s|es)?\\b', 'i');
    if (!w.ex || !wordRe.test(w.ex)) { this.renderWordPick(w); return; } // 例句不含原词则降级
    const root = this.qroot();
    root.innerHTML = '';
    root.appendChild(this.progressHeader());
    const opts = shuffle([w, ...this.distractors(w)]);
    let recordedWrong = false;
    const self = this;

    const blankEl = h('span', { class: 'cloze-blank' }, '＿＿＿＿');
    const grid = h('div', { class: 'pick-grid' });
    opts.forEach(o => {
      const oid = o.word.toLowerCase();
      grid.appendChild(h('button', {
        class: 'pick-opt', 'data-id': oid,
        onclick: e => {
          if (e.currentTarget.classList.contains('dead')) return;
          if (oid === id) {
            const reward = Store.reviewWord(id, true);
            Sound.correct();
            blankEl.textContent = w.word;
            blankEl.classList.add('filled');
            const c = centerOf(e.currentTarget);
            burst(c.x, c.y, { count: 8, emojis: ['✨', '⭐'], power: 50 });
            floatText(c.x, c.y - 20, `+${reward} 🪙`);
            setTimeout(() => Sound.speak(w.ex), 250);
            e.currentTarget.classList.add('right');
            setTimeout(() => { self.idx++; self.next(); }, 1400);
          } else {
            if (!recordedWrong) { recordedWrong = true; Store.reviewWord(id, false); }
            Sound.wrong();
            e.currentTarget.classList.add('dead');
          }
        }
      }, o.word));
    });

    root.appendChild(h('div', { class: 'card listen-card' },
      h('div', { class: 'spell-prompt' }, '选词把句子补充完整'),
      (() => {
        const m = w.ex.match(wordRe);
        const before = w.ex.slice(0, m.index);
        const after = w.ex.slice(m.index + m[0].length);
        return h('div', { class: 'cloze-line' }, before, blankEl, after);
      })(),
      h('div', { class: 'cloze-zh' }, `提示：${w.zh}`),
      grid
    ));
  },

  /* ---------- 拼写成功 ---------- */
  success(w, isNew, hints, wrongs) {
    const root = this.qroot();
    root.innerHTML = '';
    let gold = false, reward = 0;

    if (isNew) {
      const r = Store.masterWord(w.word.toLowerCase(), hints, wrongs > 0);
      gold = r.gold; reward = r.reward;
      if (gold) Sound.gold(); else { Sound.teleport(); Sound.correct(); }
    } else {
      reward = Store.reviewWord(w.word.toLowerCase(), true);
      Sound.correct();
    }

    const overlay = h('div', { class: 'mz-overlay' });
    const ring = h('div', { class: 'mz-ring' });
    const emoji = h('div', { class: 'mz-emoji ' + (gold ? 'gold' : '') }, w.emoji);
    overlay.appendChild(ring);
    overlay.appendChild(emoji);
    overlay.appendChild(h('div', { class: 'mz-word ' + (gold ? 'gold-text' : '') }, w.word));
    const msg = isNew ? rnd(PRAISE_WORDS) + ' 新贴纸已收入图鉴！'
      : (this.drillMode ? '击败！连错清零，世界和平了' : '复习通过！');
    overlay.appendChild(h('div', { class: 'mz-msg' }, msg));
    if (gold) overlay.appendChild(h('div', { class: 'mz-gold-banner' }, '🌟 稀有 · 超新星贴纸！'));
    overlay.appendChild(h('div', { class: 'mz-coin' }, `+${reward} 🪙`));
    root.appendChild(overlay);

    setTimeout(() => {
      const c = centerOf(emoji);
      burst(c.x, c.y, {
        count: gold ? 30 : 16,
        emojis: gold ? ['🌟', '✨', '💫', '⭐'] : ['✨', '⭐'],
        power: gold ? 150 : 100
      });
      flyTo(emoji, '#nav-album .ni', w.emoji);
      floatText(c.x, c.y + 60, `+${reward} 🪙`, '#ffd166');
    }, 650);

    setTimeout(() => { this.idx++; this.next(); }, gold ? 2800 : 2100);
  },

  /* ---------- 完成 ---------- */
  finish() {
    this.addMinutes();
    if (!this.freeMode && !this.drillMode) {
      Store.completeQuest();
      Sound.stamp();
    }
    let icon = '🚀', title = '今日任务完成！', sub = `已盖章！🔥 连续航行 ${Store.state.streak.count} 天 · 获得任务奖励 +${COIN_QUEST_BONUS} 🪙`;
    if (this.freeMode) {
      icon = '💪'; title = '练习完成！'; sub = '复习让记忆更牢固，明天见！';
    } else if (this.drillMode) {
      Store.addCoins(10);
      Sound.gold();
      icon = '⚡'; title = '老对手全部击退！'; sub = '错词都答对啦，连错清零 · 挑战奖励 +10 🪙';
    }
    Sound.coin();
    const root = this.qroot();
    root.innerHTML = '';
    const card = h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, icon),
      h('div', { class: 'finish-title' }, title),
      h('div', { class: 'finish-sub' }, sub),
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('button', { class: 'btn btn-main big', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
    );
    root.appendChild(card);
    setTimeout(() => {
      const c = centerOf($('.finish-stamp'));
      burst(c.x, c.y, { count: 30, emojis: ['🎉', '⭐', '✨', '🚀', '💛'], power: 160 });
    }, 300);
  }
};
