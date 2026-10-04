/* ============================================================
 * 星际求知号 - 拼读星系（自然拼读 · 词族训练）
 * 由 WORD_FAMILIES 程序生成三种题：
 *   1) 听音选词：同族形近词辨音（听 → 选对拼写）
 *   2) 找出不同类：一族三词里混入外来客（练词尾规律）
 *   3) 押韵选择：谁和目标词押韵（词尾发音相同）
 * 5 题一组；答对每题 +5 🪙 全对再 +5；首刷全额、重刷减半
 * ============================================================ */

const Phonics = {
  items: [], idx: 0, correct: 0,

  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  other(fam) { return WORD_FAMILIES.filter(f => f.id !== fam.id); },

  /* ---------- 三类出题器：{kind, tip, opts:[{t, ok}]} ---------- */

  /* 听音选词：同族 4 词，听发音选拼写（形近词只能靠耳朵） */
  genListen(fam) {
    const ws = shuffle(fam.words).slice(0, 4);
    const target = this.pick(ws);
    return {
      kind: 'listen', word: target,
      prompt: '仔细听，是哪个词？',
      opts: ws.map(w => ({ t: w, ok: w === target })),
      tip: `${target} 和 ${ws.filter(w => w !== target).slice(0, 2).join('、')} 都属于 ${fam.name}，结尾发音相同，要听清开头的辅音。`
    };
  },

  /* 找出不同类：本族 3 词 + 他族 1 词，选出"外来客" */
  genOdd(fam, fam2) {
    const inside = shuffle(fam.words).slice(0, 3);
    const outsider = this.pick(fam2.words.filter(w => !fam.words.includes(w)));
    return {
      kind: 'choice', word: outsider,
      prompt: `下面 3 个词是一家人（${fam.name}），哪一个是从别家来的"外来客"？`,
      opts: shuffle([...inside.map(w => ({ t: w, ok: false })), { t: outsider, ok: true }]),
      tip: `${inside.join('、')} 的结尾都是「${fam.id}」，读音押韵；${outsider} 的结尾不一样。`
    };
  },

  /* 押韵选择：目标词 + 本族 1 词（押韵）+ 他族 2 词 */
  genRhyme(fam, fam2) {
    const target = this.pick(fam.words);
    const rhyme = this.pick(fam.words.filter(w => w !== target));
    const others = shuffle(fam2.words).slice(0, 2);
    return {
      kind: 'rhyme', word: target,
      prompt: `哪个词和 "${target}" 押韵？（词尾发音相同）`,
      opts: shuffle([{ t: rhyme, ok: true }, ...others.map(w => ({ t: w, ok: false }))]),
      tip: `${rhyme} 和 ${target} 结尾都是「${fam.id}」，读一读就押上了；可以先点 🔊 听一听。`
    };
  },

  buildRound() {
    const fam = this.pick(WORD_FAMILIES);
    const fam2 = this.pick(this.other(fam));
    return shuffle([
      this.genListen(fam),
      this.genListen(fam),
      this.genRhyme(fam, fam2),
      this.genRhyme(fam2, fam),
      this.genOdd(fam, fam2)
    ]);
  },

  /* ---------- 流程 ---------- */
  start() {
    Sound.stopSpeak();
    this.items = this.buildRound();
    this.idx = 0;
    this.correct = 0;
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, '🔤 拼读星系')
    ));
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, '🔤'),
      h('div', { class: 'splash-title' }, '词族拼读挑战！'),
      h('div', { class: 'splash-sub' }, '听音辨词 · 找词尾规律 · 押韵游戏 · 5 题一组，答对每题 +5 🪙'),
      h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); this.next(); } }, '出发 →')
    ));
  },

  next() {
    if (this.idx >= this.items.length) { this.finish(); return; }
    const q = this.items[this.idx];
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.stopSpeak(); showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, `${this.idx + 1} / ${this.items.length}`)
    ));
    const card = h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, '🔤 拼读星系'));
    let wasOk = null;
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'margin-top:10px;min-height:20px' }, '');
    const nextBtn = h('button', {
      class: 'btn btn-main big cn-next', style: 'display:none',
      onclick: () => { Sound.tap(); this.idx++; this.next(); }
    }, this.idx + 1 >= this.items.length ? '完成 →' : '下一题 →');

    if (q.kind === 'listen') {
      card.appendChild(h('div', { class: 'spell-prompt' }, q.prompt));
      card.appendChild(h('button', { class: 'speak-btn xl', onclick: () => Sound.speak(q.word) }, '🔊'));
      card.appendChild(h('div', { class: 'tiny', style: 'margin:4px 0' }, '发音一样、长得像，只能靠耳朵！'));
    } else {
      card.appendChild(h('div', { class: 'spell-prompt' }, q.prompt));
      if (q.kind === 'rhyme') {
        card.appendChild(h('button', { class: 'speak-btn', style: 'margin:4px 0', onclick: e => {
          Sound.speak(q.word);
          Sound.speak(q.opts.map(o => o.t).join(', '), 0.9);
          e.currentTarget.disabled = true;
        } }, '🔊 听一听这几个词'));
      }
    }

    const optsEl = h('div', { class: 'cn-opts' });
    q.opts.forEach(m => {
      optsEl.appendChild(h('button', {
        class: 'cn-opt en-opt',
        onclick: e => {
          if (wasOk !== null) return;
          wasOk = m.ok;
          if (m.ok) {
            this.correct++;
            Sound.correct();
            e.currentTarget.classList.add('right');
            const c = centerOf(e.currentTarget);
            burst(c.x, c.y, { count: 8, colors: ['#58e08a'], power: 45 });
            if (q.kind === 'listen') setTimeout(() => Sound.speak(q.word), 200);
          } else {
            Sound.wrong();
            e.currentTarget.classList.add('wrong');
            const right = Array.from(optsEl.children).find((b, i) => q.opts[i].ok);
            if (right) right.classList.add('right');
          }
          Array.from(optsEl.children).forEach(b => { b.disabled = true; });
          tipEl.innerHTML = (m.ok ? '✅ ' : '❌ ') + q.tip;
          nextBtn.style.display = '';
        }
      }, m.t));
    });
    card.appendChild(optsEl);
    card.appendChild(tipEl);
    card.appendChild(nextBtn);
    root.appendChild(card);
    if (q.kind === 'listen') setTimeout(() => Sound.speak(q.word), 400);
  },

  finish() {
    const total = this.items.length;
    const allOk = this.correct === total;
    const gain = Store.markPhonicsRound(this.correct, total);
    Sound.gold();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, allOk ? '💯' : '🔤'),
      h('div', { class: 'finish-title' }, `词族拼读 ${this.correct}/${total}`),
      h('div', { class: 'finish-sub' }, `获得 +${gain} 🪙${(Store.state.today.mint.phonics || 0) > 1 ? ' · 今日重刷，奖励减半' : ''} · 累计挑战 ${(Store.state.phonics.rounds || 0)} 组`),
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.start(); } }, '再来一组'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
      )
    ));
    const c = centerOf($('.finish-stamp'));
    burst(c.x, c.y, { count: 22, emojis: ['🔤', '⭐', '✨'], power: 120 });
  }
};
