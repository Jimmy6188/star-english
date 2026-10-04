/* ============================================================
 * 星际求知号 - 英语每日小短文（拔高加餐，全英文问答）
 * 一天推荐一篇：2 道判断（T/F）+ 2 道选词填空
 * 短文可 TTS 朗读；答对每题 +5 🪙 全对再 +5；首刷全额、重刷减半
 * ============================================================ */

const EnRead = {
  passage: null, idx: 0, correct: 0,

  /* 顺序推进：优先没读过的，全读完后再循环 */
  nextPassage() {
    const reads = (Store.state.enRead && Store.state.enRead.reads) || [];
    return ENGLISH_READINGS.find(r => !reads.includes(r.id))
      || ENGLISH_READINGS[reads.length % ENGLISH_READINGS.length];
  },

  start() {
    Sound.stopSpeak();
    this.passage = this.nextPassage();
    this.idx = 0;
    this.correct = 0;
    showScreen('quest');
    this.renderPassage();
  },

  exitBtn() {
    return h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.stopSpeak(); showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, '📚 英语小短文')
    );
  },

  renderPassage() {
    const p = this.passage;
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.exitBtn());
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, `${p.emoji} ${p.title}`, h('span', { class: 'level-badge' }, p.level)),
      h('div', { class: 'en-pass' }, p.text),
      h('div', { class: 'tiny en-gloss', style: 'text-align:left' }, `📖 生词卡：${p.gloss}`),
      h('button', { class: 'speak-btn xl', style: 'margin:10px 0', onclick: () => Sound.speak(p.text, 0.78) }, '🔊 听一遍'),
      h('div', { class: 'tiny' }, '2 道判断 + 2 道选词填空 · 全英文作答'),
      h('button', { class: 'btn btn-main big', style: 'margin-top:10px', onclick: () => { Sound.tap(); this.next(); } }, '开始答题 →')
    ));
    setTimeout(() => Sound.speak(p.text, 0.78), 400);
  },

  next() {
    if (this.idx >= this.passage.qs.length) { this.finish(); return; }
    const q = this.passage.qs[this.idx];
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.stopSpeak(); showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, `Q${this.idx + 1} / ${this.passage.qs.length}`)
    ));
    const card = h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, q.kind === 'judge' ? '⚖️ True or False? 判断对错' : '✏️ Fill in the blank 选词填空')
    );
    let wasOk = null;
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'margin-top:10px;min-height:20px' }, '');
    const nextBtn = h('button', {
      class: 'btn btn-main big cn-next', style: 'display:none',
      onclick: () => { Sound.tap(); this.idx++; this.next(); }
    }, this.idx + 1 >= this.passage.qs.length ? '完成 →' : 'Next →');

    if (q.kind === 'judge') {
      card.appendChild(h('div', { class: 'drill-text en-pass' }, q.q));
      const btns = h('div', { class: 'judge-btns' });
      [['✅ True', true], ['❌ False', false]].forEach(([label, val]) => {
        btns.appendChild(h('button', {
          class: 'judge-btn', 'data-ok': val === q.ans ? '1' : '0',
          onclick: e => {
            if (wasOk !== null) return;
            wasOk = val === q.ans;
            if (wasOk) {
              this.correct++;
              Sound.correct();
              e.currentTarget.classList.add('right');
              const c = centerOf(e.currentTarget);
              burst(c.x, c.y, { count: 8, colors: ['#58e08a'], power: 45 });
            } else {
              Sound.wrong();
              e.currentTarget.classList.add('wrong');
              const right = Array.from(btns.children).find(x => x.dataset.ok === '1');
              if (right) right.classList.add('right');
            }
            Array.from(btns.children).forEach(b => { b.disabled = true; });
            tipEl.innerHTML = wasOk ? '✅ Right! 回答正确！' : `❌ The answer is "${q.ans ? 'True' : 'False'}".`;
            nextBtn.style.display = '';
          }
        }, label));
      });
      card.appendChild(btns);
    } else {
      const parts = q.q.split('____');
      const span = h('span', { class: 'cloze-sentence' });
      span.appendChild(document.createTextNode(parts[0] || ''));
      span.appendChild(h('span', { class: 'cloze-hole', 'data-hole': '1' }, '＿＿'));
      (parts[1] || '').split('\n').forEach((seg, i) => {
        if (i > 0) span.appendChild(h('br'));
        span.appendChild(document.createTextNode(seg));
      });
      card.appendChild(span);
      const optsEl = h('div', { class: 'cn-opts' });
      shuffle(q.opts.map((t, i) => ({ t, ok: i === q.ans }))).forEach(m => {
        optsEl.appendChild(h('button', {
          class: 'cn-opt en-opt', 'data-ok': m.ok ? '1' : '0',
          onclick: e => {
            if (wasOk !== null) return;
            wasOk = m.ok;
            const hole = card.querySelector('[data-hole]');
            if (hole) { hole.textContent = m.t; hole.classList.add(m.ok ? 'filled' : 'wrong'); }
            if (m.ok) {
              this.correct++;
              Sound.correct();
              e.currentTarget.classList.add('right');
              const c = centerOf(e.currentTarget);
              burst(c.x, c.y, { count: 8, colors: ['#58e08a'], power: 45 });
              setTimeout(() => Sound.speak(q.q.replace('____', m.t), 0.82), 250);
            } else {
              Sound.wrong();
              e.currentTarget.classList.add('wrong');
              const right = Array.from(optsEl.children).find(x => x.dataset.ok === '1');
              if (right) right.classList.add('right');
            }
            Array.from(optsEl.children).forEach(b => { b.disabled = true; });
            tipEl.innerHTML = m.ok ? '✅ Right! 回答正确！' : `❌ The answer is "${q.opts[q.ans]}".`;
            nextBtn.style.display = '';
          }
        }, m.t));
      });
      card.appendChild(optsEl);
    }
    card.appendChild(tipEl);
    card.appendChild(nextBtn);
    root.appendChild(card);
  },

  finish() {
    updateTop(); // 结算页立刻同步顶栏金币
    const p = this.passage;
    const total = p.qs.length;
    const allOk = this.correct === total;
    const gain = Store.earnScaled('enread', this.correct * 5 + (allOk ? 5 : 0));
    Store.markEnRead(p.id);
    Sound.gold();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, allOk ? '💯' : '📚'),
      h('div', { class: 'finish-title' }, `Reading ${this.correct} / ${total}`),
      h('div', { class: 'finish-sub' }, `获得 +${gain} 🪙${(Store.state.today.mint.enread || 0) > 1 ? ' · 今日重刷，奖励减半' : ''} · 已读完 ${(Store.state.enRead.reads || []).length} 篇`),
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.start(); } }, '📖 再读一篇'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
      )
    ));
    const c = centerOf($('.finish-stamp'));
    burst(c.x, c.y, { count: 22, emojis: ['📚', '⭐', '✨'], power: 120 });
  }
};
