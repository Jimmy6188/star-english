/* ============================================================
 * 星际求知号 - KET 词汇站（v44）
 * 词库：Word Atlas 开源数据集 A1+A2 精选 1735 词（js/data-ketwords.js，CC BY 4.0）
 * 玩法：每日 5 词打卡——A1 优先、自动混入近期错词；每词一张学习卡（听音+例句+辨析），
 *       再做一道小测（看义选词/看词选义/听音辨词/字母拼词 轮换）；答错的词进错词本，
 *       之后自动混进每日打卡复习
 * 记账：新词收进图鉴 +2（答对）/ +1（看过）；每题答对 +1；全对再 +5；重刷递减走 mint
 * 图鉴：19 个话题分组，点亮看进度；点词看卡+发音
 * ============================================================ */

const KetWords = {
  DAILY: 5,
  queue: [], idx: 0, correct: 0, newN: 0,

  word(id) { return KET_WORDS.find(w => w.w === id); },

  start() {
    Sound.stopSpeak();
    setQuestSub('var(--accent)');
    showScreen('quest');
    this.renderHub();
  },

  exit() {
    Sound.stopSpeak();
    showScreen('home');
    renderHome();
  },

  renderHub() {
    const root = $('#quest-root');
    root.innerHTML = '';
    const s = Store.state;
    const learnedN = Object.keys(s.ketwords.learned).length;
    const wrongN = (s.ketwords.wrong || []).length;
    const todayN = Object.values(s.ketwords.learned).filter(d => d === s.today.date).length;
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.tap(); this.exit(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, '🔤 KET 词汇站')
    ));
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, '🔤'),
      h('div', { class: 'splash-title' }, 'KET 词汇站'),
      h('div', { class: 'splash-sub' }, `图鉴 ${learnedN}/${KET_WORDS.length} 词 · 今日新学 ${Math.min(todayN, this.DAILY)}/${this.DAILY}${wrongN ? ` · 错词 ${wrongN} 个待复习` : ''}`),
      h('div', { class: 'intro-zh', style: 'margin-top:6px;line-height:1.7' }, '每天 5 个 KET 常用词：先听一听、读一读例句，再做一道小题。A1 词汇先来，学会的词会点亮词汇图鉴。'),
      h('div', { class: 'row-gap', style: 'margin-top:10px' },
        h('button', { class: 'btn btn-main big', style: 'flex:2', onclick: () => { Sound.tap(); this.beginSession(); } }, todayN >= this.DAILY ? '🔁 再练一组' : '🚀 开始今日打卡'),
        h('button', { class: 'btn big', style: 'flex:1', onclick: () => { Sound.tap(); this.browse(); } }, '📖 图鉴')
      ),
      h('div', { class: 'tiny', style: 'margin-top:10px' }, '词库来源：Word Atlas 开源数据集（CC BY 4.0）· 已为小学生筛掉不适合的词条')
    ));
  },

  /* 每日选词：新词（A1 优先），末位最多混入 2 个近期错词复习 */
  pickToday() {
    const s = Store.state;
    const a1 = KET_WORDS.filter(w => w.cefr === 'A1' && !s.ketwords.learned[w.w]);
    const a2 = KET_WORDS.filter(w => w.cefr === 'A2' && !s.ketwords.learned[w.w]);
    const pool = a1.length >= this.DAILY ? a1 : a1.concat(a2);
    const picks = shuffle(pool).slice(0, this.DAILY);
    const wrongIds = shuffle((s.ketwords.wrong || []).slice(-6)).slice(0, 2);
    wrongIds.forEach((id, i) => {
      const w = this.word(id);
      if (w && !picks.some(p => p.w === id) && picks.length) picks[Math.max(0, picks.length - 1 - i)] = w;
    });
    return shuffle(picks);
  },

  beginSession() {
    if (typeof KET_WORDS === 'undefined' || !KET_WORDS.length) { toast('词库还没加载出来，刷新一下页面试试'); return; }
    this.queue = this.pickToday();
    if (!this.queue.length) { toast('🎉 词库全部点亮啦！去图鉴里复习吧'); return; }
    this.idx = 0;
    this.correct = 0;
    this.newN = 0;
    this.renderCard();
  },

  top(prog) {
    return h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.tap(); this.exit(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, prog)
    );
  },

  /* ---------- 学习卡：听音 → 例句 → 辨析 → 去小测 ---------- */
  renderCard() {
    const w = this.queue[this.idx];
    const isNew = !Store.state.ketwords.learned[w.w];
    if (isNew) this.newN++;
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.top(`🔤 第 ${this.idx + 1} / ${this.queue.length} 词`));
    root.appendChild(h('div', { class: 'card spell-card center' },
      h('div', { class: 'drill-tag' }, `${isNew ? '✨ 新词' : '🔁 复习'} · ${KETW_TOPICS[w.topic] || w.topic} · ${w.cefr}`),
      h('div', { class: 'intro-word-row' },
        h('span', { class: 'intro-word' }, w.w),
        h('button', { class: 'speak-btn big', onclick: () => Sound.speakWord(w.w) }, icon('sound'))
      ),
      w.uk ? h('button', { class: 'word-ipa', onclick: () => Sound.speakWord(w.w) }, w.uk) : '',
      h('div', { class: 'intro-zh' }, `${w.p ? w.p + ' ' : ''}${w.zh}`),
      w.ex ? h('div', { class: 'intro-ex' },
        h('button', { class: 'speak-btn', onclick: () => Sound.speak(w.ex.en, 0.9) }, icon('sound')),
        h('span', {}, w.ex.en)
      ) : '',
      w.ex ? h('div', { class: 'tiny intro-exzh' }, w.ex.zh) : '',
      w.tip ? h('div', { class: 'tiny', style: 'margin-top:6px;line-height:1.7;color:var(--gold-strong)' }, `💡 ${w.tip}`) : '',
      h('div', { class: 'tiny', style: 'margin-top:6px' }, '🔊 点喇叭多听几遍，读熟了就开始小测'),
      h('button', { class: 'btn btn-main big', style: 'margin-top:10px', onclick: () => { Sound.tap(); this.renderQuiz(); } }, '开始小测 →')
    ));
    setTimeout(() => Sound.speakWord(w.w), 350);
  },

  /* 干扰项：优先同话题，释义/词形都不同 */
  distract(w, key) {
    const same = KET_WORDS.filter(x => x.topic === w.topic && x.w !== w.w && x[key] !== w[key]);
    const rest = KET_WORDS.filter(x => x.topic !== w.topic && x.w !== w.w && x[key] !== w[key]);
    return shuffle(shuffle(same).concat(shuffle(rest))).slice(0, 3);
  },

  /* ---------- 小测：4 种题型按序轮换 ---------- */
  renderQuiz() {
    const w = this.queue[this.idx];
    const type = this.idx % 4;
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.top(`🔤 第 ${this.idx + 1} / ${this.queue.length} 词 · 小测`));
    const tag = type === 0 ? '🔎 看中文，选单词' : type === 1 ? '📖 看单词，选中文' : type === 2 ? '👂 听发音，认单词' : '✏️ 字母拼词';
    const card = h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, tag));
    if (type === 0) this.quizMeaning2Word(card, w);
    else if (type === 1) this.quizWord2Meaning(card, w);
    else if (type === 2) this.quizListen(card, w);
    else if (type === 3 && w.w.length <= 12 && /^[a-z-]+$/.test(w.w)) this.quizSpell(card, w); /* 长词/连字符退回看词选义 */
    else this.quizMeaning2Word(card, w);
    root.appendChild(card);
  },

  finishOne(ok, w) {
    if (ok) {
      this.correct++;
      const got = Store.markKetWord(w.w, true);
      if (got) toast(`✨ 新词收进图鉴 +${got} 🪙`);
    } else {
      Store.markKetWord(w.w, false);
      Store.addKetWrong(w.w);
    }
    this.idx++;
    if (this.idx >= this.queue.length) this.renderFinish();
    else this.renderCard();
  },

  /* 选择题通用面板（返回是否答对交给 finishOne） */
  quizChoices(card, promptEl, opts, ansIdx, w, listenFirst) {
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'margin-top:10px;min-height:20px;text-align:left' });
    let answered = false;
    card.appendChild(promptEl);
    const optsEl = h('div', { class: 'cn-opts' });
    opts.forEach((t, i) => {
      optsEl.appendChild(h('button', {
        class: 'cn-opt', onclick: e => {
          if (answered) return;
          answered = true;
          const ok = i === ansIdx;
          if (ok) {
            e.currentTarget.classList.add('right');
            const c = centerOf(e.currentTarget);
            burst(c.x, c.y, { count: 8, colors: ['#58e08a', '#ffd166'], power: 50 });
          } else {
            e.currentTarget.classList.add('wrong');
            const right = Array.from(optsEl.children)[ansIdx];
            if (right) right.classList.add('right');
          }
          Array.from(optsEl.children).forEach(b => { b.disabled = true; });
          tipEl.innerHTML = (ok ? '✅ ' : '❌ ') + `${w.w} · ${w.p ? w.p + ' ' : ''}${w.zh}${w.ex ? '<br>例句：' + w.ex.en : ''}`;
          this.finishOne(ok, w);
        }
      }, t));
    });
    card.appendChild(optsEl);
    card.appendChild(tipEl);
    if (listenFirst) setTimeout(() => Sound.speakWord(w.w), 350);
  },

  /* 看中文选单词 */
  quizMeaning2Word(card, w) {
    const opts = shuffle([w.w, ...this.distract(w, 'w').map(x => x.w)]);
    this.quizChoices(card,
      h('div', { class: 'drill-text' }, `哪个是「${w.zh}」的英文？`),
      opts, opts.indexOf(w.w), w, false);
  },
  /* 看单词选中文 */
  quizWord2Meaning(card, w) {
    const opts = shuffle([w.zh, ...this.distract(w, 'zh').map(x => x.zh)]);
    this.quizChoices(card,
      h('div', { class: 'drill-text' }, `${w.w}${w.uk ? '　' + w.uk : ''}　的意思是？`),
      opts, opts.indexOf(w.zh), w, false);
  },
  /* 听音辨词 */
  quizListen(card, w) {
    const opts = shuffle([w.w, ...this.distract(w, 'w').map(x => x.w)]);
    this.quizChoices(card,
      h('button', { class: 'speak-btn xl', style: 'display:block;margin:10px auto', onclick: () => Sound.speakWord(w.w) }, icon('sound')),
      opts, opts.indexOf(w.w), w, true);
  },
  /* 字母拼词：点字母块按顺序拼出单词（点已填的槽可退回） */
  quizSpell(card, w) {
    const seq = w.w;
    const filled = []; /* 已放入的字母块引用 */
    const slotRow = h('div', { class: 'tile-row', style: 'flex-wrap:wrap' });
    const slotEls = seq.split('').map(() => {
      const sl = h('span', { class: 'tile-slot', onclick: () => {
        const i = slotEls.indexOf(sl);
        if (i < 0 || !filled[i]) return;
        Sound.tap();
        const t = filled.splice(i, 1)[0];
        t.classList.remove('used');
        repaint();
      } }, '');
      slotRow.appendChild(sl);
      return sl;
    });
    const tileRow = h('div', { class: 'tile-row', style: 'flex-wrap:wrap' });
    const repaint = () => {
      slotEls.forEach((sl, i) => {
        sl.textContent = filled[i] ? filled[i].textContent : '';
        sl.classList.toggle('filled', !!filled[i]);
      });
    };
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'margin-top:10px;min-height:20px;text-align:center' });
    let done = false;
    const judge = () => {
      if (done) return;
      done = true;
      const ok = filled.map(t => t.textContent).join('') === seq;
      slotEls.forEach((sl, i) => sl.classList.add(filled[i] && filled[i].textContent === seq[i] ? 'right' : 'wrong'));
      tileEls.forEach(t => { t.disabled = true; });
      if (ok) {
        Sound.correct();
        const c = centerOf(slotRow);
        burst(c.x, c.y, { count: 10, colors: ['#58e08a'], power: 50 });
        setTimeout(() => Sound.speakWord(w.w), 250);
      } else {
        Sound.wrong();
      }
      tipEl.innerHTML = (ok ? '✅ 拼对了！' : `❌ 正确拼写：${w.w}`) + ` · ${w.zh}`;
      this.finishOne(ok, w);
    };
    const tileEls = [];
    shuffle(seq.split('')).forEach(ch => {
      const t = h('button', {
        class: 'tile-btn', onclick: () => {
          if (done || filled.length >= seq.length) return;
          Sound.tap();
          Sound.speak(ch, 1.1);
          filled.push(t);
          t.classList.add('used');
          repaint();
          if (filled.length === seq.length) setTimeout(judge, 250);
        }
      }, ch);
      tileEls.push(t);
      tileRow.appendChild(t);
    });
    card.appendChild(h('div', { class: 'drill-text' }, `听发音 + 看中文「${w.zh}」，把 ${w.w.length} 个字母拼出来`));
    card.appendChild(h('button', { class: 'speak-btn xl', style: 'display:block;margin:10px auto', onclick: () => Sound.speakWord(w.w) }, icon('sound')));
    card.appendChild(slotRow);
    card.appendChild(tileRow);
    card.appendChild(tipEl);
    setTimeout(() => Sound.speakWord(w.w), 350);
  },

  /* ---------- 结算 ---------- */
  renderFinish() {
    const gain = Store.finishKetWords(this.correct, this.queue.length);
    updateTop();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, this.correct === this.queue.length ? '💯' : '🔤'),
      h('div', { class: 'finish-title' }, `词汇打卡 ${this.correct}/${this.queue.length}`),
      h('div', { class: 'finish-sub' }, `新学 ${this.newN} 个词已收进图鉴 · 全对奖励 +${gain} 🪙${(Store.state.today.mint.ketword || 0) > 1 ? ' · 今日重刷，奖励减半' : ''} · 答错的词明天自动回来复习`),
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.beginSession(); } }, '🔁 再练一组'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); this.exit(); } }, '返回空间站')
      )
    ));
    const c = centerOf($('.finish-stamp'));
    burst(c.x, c.y, { count: 22, emojis: ['🔤', '⭐', '✨'], power: 120 });
  },

  /* ---------- 词汇图鉴：话题分组 → 词表 ---------- */
  browse() {
    const s = Store.state;
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.tap(); this.exit(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, '📖 词汇图鉴')
    ));
    const learnedN = Object.keys(s.ketwords.learned).length;
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, `已点亮 ${learnedN} / ${KET_WORDS.length} 词`),
      h('div', { class: 'tiny', style: 'margin:4px 0 8px' }, '19 个话题，点亮一颗看一颗；点话题进去看词表'),
      h('div', { class: 'expr24-row', style: 'gap:8px' },
        Object.keys(KETW_TOPICS).map(tp => {
          const list = KET_WORDS.filter(w => w.topic === tp);
          const got = list.filter(w => s.ketwords.learned[w.w]).length;
          return h('button', {
            class: 'btn small', style: got ? 'border-color:var(--gold)' : '',
            onclick: () => { Sound.tap(); this.renderTopic(tp); }
          }, `${KETW_TOPICS[tp]} ${got}/${list.length}`);
        })
      )
    ));
  },

  renderTopic(topic) {
    const s = Store.state;
    const root = $('#quest-root');
    root.innerHTML = '';
    const list = KET_WORDS.filter(w => w.topic === topic);
    const got = list.filter(w => s.ketwords.learned[w.w]).length;
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { Sound.tap(); this.browse(); } }, icon('x')),
      h('div', { class: 'quest-prog' }, `${KETW_TOPICS[topic] || topic} ${got}/${list.length}`)
    ));
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'tiny', style: 'margin-bottom:6px' }, '⭐ 已点亮 · ○ 待学习 · 点词看卡片'),
      h('div', { style: 'max-height:60vh;overflow-y:auto' },
        list.map(w => {
          const on = !!s.ketwords.learned[w.w];
          return h('button', {
            class: 'pack-row', onclick: () => { Sound.tap(); this.renderDetail(w); }
          },
            h('span', { class: 'pack-info' }, on ? '⭐' : '○', ` ${w.w}`, h('span', { class: 'tiny' }, `　${w.zh}`)),
            h('span', { class: 'tiny' }, w.cefr)
          );
        })
      )
    ));
  },

  renderDetail(w) {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.top(`📖 ${w.w}`));
    root.appendChild(h('div', { class: 'card spell-card center' },
      h('div', { class: 'drill-tag' }, `${KETW_TOPICS[w.topic] || w.topic} · ${w.cefr}`),
      h('div', { class: 'intro-word-row' },
        h('span', { class: 'intro-word' }, w.w),
        h('button', { class: 'speak-btn big', onclick: () => Sound.speakWord(w.w) }, icon('sound'))
      ),
      w.uk ? h('button', { class: 'word-ipa', onclick: () => Sound.speakWord(w.w) }, w.uk) : '',
      h('div', { class: 'intro-zh' }, `${w.p ? w.p + ' ' : ''}${w.zh}`),
      w.ex ? h('div', { class: 'intro-ex' },
        h('button', { class: 'speak-btn', onclick: () => Sound.speak(w.ex.en, 0.9) }, icon('sound')),
        h('span', {}, w.ex.en)
      ) : '',
      w.ex ? h('div', { class: 'tiny intro-exzh' }, w.ex.zh) : '',
      w.tip ? h('div', { class: 'tiny', style: 'margin-top:6px;line-height:1.7;color:var(--gold-strong)' }, `💡 ${w.tip}`) : '',
      h('button', { class: 'btn btn-main big', style: 'margin-top:10px', onclick: () => { Sound.tap(); this.renderTopic(w.topic); } }, '← 回词表')
    ));
  }
};
