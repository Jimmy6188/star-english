/* ============================================================
 * 星际求知号 - KET 补全对话（v40，A2 题型启蒙）
 * 一段小对话挖空一句，四选一补全；🔊 朗读上下文（跳过挖空句防泄题）
 * 每轮 4 段：优先没练过的；答完统一入账；练过的可重复重温
 * ============================================================ */

const KETUI = {
  items: [], idx: 0, correct: 0,

  start() {
    Sound.stopSpeak();
    const done = (Store.state.ket && Store.state.ket.done) || [];
    const fresh = shuffle(KET_DIALOGUES.filter(d => !done.includes(d.id)));
    const seen = shuffle(KET_DIALOGUES.filter(d => done.includes(d.id)));
    this.items = fresh.concat(seen).slice(0, 4); /* 没练过的优先，练过的排后 */
    this.idx = 0;
    this.correct = 0;
    setQuestSub('var(--accent)');
    showScreen('quest');
    this.renderIntro();
  },

  renderIntro() {
    const done = (Store.state.ket && Store.state.ket.done) || [];
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.stopSpeak(); showScreen('home'); renderHome(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, '💬 KET补全对话')
    ));
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, '💬'),
      h('div', { class: 'splash-title' }, 'KET 补全对话'),
      h('div', { class: 'splash-sub' }, `${this.items.length} 段小对话 · 每段缺一句，四选一补全`),
      h('div', { class: 'intro-zh', style: 'margin-top:6px;line-height:1.8' },
        '这是剑桥 KET 考试里的经典题型。诀窍：先看挖空的前后两句在说什么，再选最接得上话的那句。选完听听完整对话哦。'),
      h('div', { class: 'tiny', style: 'margin-top:6px' }, `已练过 ${done.length}/${KET_DIALOGUES.length} 段 · 每段答对 +4 🪙 全对再 +6`),
      h('button', { class: 'btn btn-main big', style: 'margin-top:12px', onclick: () => { Sound.tap(); this.next(); } }, '开始 →')
    ));
  },

  next() {
    Sound.stopSpeak(); /* 上一段的朗读别延续到这一段 */
    if (this.idx >= this.items.length) { this.finish(); return; }
    const d = this.items[this.idx];
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.stopSpeak(); showScreen('home'); renderHome(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, `${this.idx + 1} / ${this.items.length}`)
    ));

    let answered = false;
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'margin-top:10px;min-height:20px;line-height:1.9;text-align:left' });
    const nextBtn = h('button', {
      class: 'btn btn-main big cn-next', style: 'display:none;margin-top:10px',
      onclick: () => { Sound.tap(); this.idx++; this.next(); }
    }, this.idx + 1 >= this.items.length ? '看成绩 →' : '下一段 →');

    /* 对话行：挖空行显示 "who: ＿＿＿＿＿" */
    const lineEls = d.lines.map((ln, i) => {
      if (i === d.miss) {
        return h('div', { class: 'ket-line miss' }, `${ln.who}: ＿＿＿＿＿`);
      }
      return h('div', { class: 'ket-line' }, h('b', {}, `${ln.who}: `), ln.t);
    });

    /* 🔊 朗读上下文：跳过挖空句，防止直接读出答案 */
    const contextText = d.lines.filter((_, i) => i !== d.miss).map(ln => ln.t).join(' ... ');

    const optsEl = h('div', { class: 'cn-opts' });
    const map = shuffle([{ t: d.answer, ok: true }, ...d.opts.map(t => ({ t, ok: false }))]);
    map.forEach(m => {
      optsEl.appendChild(h('button', {
        class: 'cn-opt en-opt', style: 'text-align:left',
        onclick: e => {
          if (answered) return;
          answered = true;
          if (m.ok) {
            this.correct++;
            Sound.correct();
            e.currentTarget.classList.add('right');
            const c = centerOf(e.currentTarget);
            burst(c.x, c.y, { count: 8, colors: ['#58e08a'], power: 45 });
          } else {
            Sound.wrong();
            e.currentTarget.classList.add('wrong');
            const right = Array.from(optsEl.children).find((b, i) => map[i].ok);
            if (right) right.classList.add('right');
            /* 把正确句填回挖空处 */
            lineEls[d.miss].innerHTML = `<b>${d.lines[d.miss].who}: </b>${d.answer}`;
            lineEls[d.miss].classList.remove('miss');
            lineEls[d.miss].classList.add('filled');
          }
          Array.from(optsEl.children).forEach(b => { b.disabled = true; });
          tipEl.innerHTML = (m.ok ? '✅ ' : '❌ ') + d.tip;
          nextBtn.style.display = '';
        }
      }, m.t));
    });

    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, `${d.emoji} ${d.topic} · 把话接上`),
      h('div', { class: 'ket-box' }, lineEls),
      h('button', { class: 'speak-btn', style: 'margin:8px auto 2px;display:block', title: '朗读上下文',
        onclick: () => { Sound.tap(); Sound.speakSentence(contextText, 0.8); } }, icon('sound')),
      h('div', { class: 'tiny', style: 'margin:2px 0 8px' }, '🔊 听上下文（挖空那句不会被读出来）· 选出最合适的一句'),
      optsEl, tipEl, nextBtn
    ));
  },

  finish() {
    updateTop();
    const gained = Store.finishKet(this.correct, this.items.length);
    this.items.forEach(d => Store.markKetDone(d.id));
    Sound.gold();
    const root = $('#quest-root');
    root.innerHTML = '';
    const doneN = (Store.state.ket.done || []).length;
    root.appendChild(h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, this.correct === this.items.length ? '💯' : '💬'),
      h('div', { class: 'finish-title' }, `补全对话 ${this.correct}/${this.items.length}`),
      h('div', { class: 'finish-sub' }, `获得 +${gained} 🪙 · 已练过 ${doneN}/${KET_DIALOGUES.length} 段${(Store.state.today.mint.ket || 0) > 1 ? ' · 今日重刷，奖励减半' : ''}`),
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); KETUI.start(); } }, '再来一组'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
      )
    ));
    const c = centerOf($('.finish-stamp'));
    burst(c.x, c.y, { count: 22, emojis: ['💬', '⭐', '✨'], power: 120 });
  }
};
