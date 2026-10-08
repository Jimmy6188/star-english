/* ============================================================
 * 星际求知号 - 语文星系（人教版四上）
 * 诗词星图（每首 4 关：接下句 · 填名句 · 认作者 · 懂诗意）/ 阅读训练营 / 词语实战
 * 选择题统一走 ask()；名句填空是字块点选（kind:'tiles'，点字块按顺序填字）
 * 错题进语文错题池（填空题复习时也是字块界面）；完成一轮即参与打卡
 * ============================================================ */

const Chinese = {
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  /* ---------- 通用：选择式题目 / 字块填空（onDone(ok)） ---------- */
  ask(q, idx, total, onDone) {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => confirmModal('退出练习？', '进度将不保存，确定退出吗？', () => { showScreen('home'); renderHome(); }) }, '✕'),
      h('div', { class: 'quest-prog' }, `${idx + 1} / ${total}`)
    ));
    const optsEl = h('div', { class: 'cn-opts' });
    let wasOk = null;
    if (q.kind === 'tiles') {
      /* ---- 名句填空：点字块按顺序把字填进空格，点已填的字可退回 ---- */
      const slots = q.ans.length;
      const filled = [];
      const sentEl = h('span', { class: 'cloze-sentence tile-sentence' });
      const parts = q.q.split('＿'.repeat(slots));
      sentEl.appendChild(document.createTextNode(parts[0] || ''));
      const slotEls = [];
      for (let s = 0; s < slots; s++) {
        const sl = h('span', { class: 'tile-slot' }, '');
        slotEls.push(sl);
        sentEl.appendChild(sl);
      }
      (parts[1] || '').split('\n').forEach((seg, i) => {
        if (i > 0) sentEl.appendChild(h('br'));
        sentEl.appendChild(document.createTextNode(seg));
      });
      optsEl.appendChild(sentEl);
      const tilesEl = h('div', { class: 'tile-row' });
      const tileEls = [];
      const repaint = () => {
        slotEls.forEach((sl, i) => {
          sl.textContent = filled[i] ? filled[i].c : '';
          sl.classList.toggle('filled', !!filled[i]);
        });
        tileEls.forEach(t => t.classList.toggle('used', filled.some(f => f.id === t.dataset.id)));
      };
      const judge = () => {
        const guess = filled.map(f => f.c).join('');
        wasOk = guess === q.ans;
        slotEls.forEach((sl, i) => {
          sl.classList.add(guess[i] === q.ans[i] ? 'right' : 'wrong');
          sl.onclick = null;
        });
        tileEls.forEach(t => { t.disabled = true; });
        if (wasOk) {
          Sound.correct();
          const c = centerOf(sentEl);
          burst(c.x, c.y, { count: 8, colors: ['#58e08a'], power: 45 });
          setTimeout(() => Sound.speak(q.line || q.q, 0.82), 250);
        } else {
          Store.addCnWrong(q);
          Sound.wrong();
        }
        root.querySelector('.cn-tip').innerHTML = wasOk ? '✅ 填对了！' : '❌ ' + (q.tip || `正确答案：${q.line || q.q}`);
        root.querySelector('.cn-next').style.display = '';
      };
      shuffle(q.opts.map((c, i) => ({ c, id: 't' + i }))).forEach(t => {
        const b = h('button', {
          class: 'tile-btn', 'data-id': t.id,
          onclick: () => {
            if (wasOk !== null || filled.length >= slots) return;
            Sound.tap();
            filled.push(t);
            repaint();
            if (filled.length === slots) judge();
          }
        }, t.c);
        tileEls.push(b);
        tilesEl.appendChild(b);
      });
      slotEls.forEach((sl, i) => {
        sl.onclick = () => {
          if (wasOk !== null || !filled[i]) return;
          Sound.tap();
          filled.splice(i, 1);
          repaint();
        };
      });
      optsEl.appendChild(tilesEl);
    } else {
      const map = shuffle(q.opts.map((t, i) => ({ t, ok: i === q.ans })));
      map.forEach(m => {
        optsEl.appendChild(h('button', {
          class: 'cn-opt', 'data-ok': m.ok ? '1' : '0',
          onclick: e => {
            if (wasOk !== null) return;
            wasOk = m.ok;
            if (m.ok) {
              Sound.correct();
              e.currentTarget.classList.add('right');
              const c = centerOf(e.currentTarget);
              burst(c.x, c.y, { count: 6, colors: ['#58e08a'], power: 40 });
            } else {
              Store.addCnWrong(q);
              Sound.wrong();
              e.currentTarget.classList.add('wrong');
              const right = Array.from(optsEl.children).find(x => x.dataset.ok === '1');
              if (right) right.classList.add('right');
            }
            Array.from(optsEl.children).forEach(b => { b.disabled = true; });
            root.querySelector('.cn-tip').innerHTML = m.ok ? '✅ ' + (q.tip || '回答正确！') : '❌ ' + (q.tip || `正确答案：${q.opts[q.ans]}`);
            root.querySelector('.cn-next').style.display = '';
          }
        }, m.t));
      });
    }
    const qText = h('div', { class: 'drill-text' }, q.q);
    if (q.kind === 'tiles') qText.style.display = 'none'; /* 填空题自带句子展示 */
    root.appendChild(h('div', { class: 'card drill-card' },
      qText,
      optsEl,
      h('div', { class: 'cn-tip tiny', style: 'margin-top:10px;min-height:20px' }, ''),
      h('button', {
        class: 'btn btn-main big cn-next', style: 'display:none',
        onclick: () => { Sound.tap(); onDone(wasOk); }
      }, idx + 1 >= total ? '完成 →' : '下一题 →')
    ));
  },

  summary(icon, title, sub) {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, icon),
      h('div', { class: 'finish-title' }, title),
      h('div', { class: 'finish-sub' }, sub),
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('button', { class: 'btn btn-main big', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
    ));
    const c = centerOf($('.finish-stamp'));
    burst(c.x, c.y, { count: 20, emojis: [icon, '⭐', '✨'], power: 120 });
  },

  /* ---------- 诗词星图 ---------- */
  /* 没学过的诗先走学习页（读全诗 + 白话译文 + 重点字词），学过才直接挑战；
   * 已点亮的星随时可以重刷巩固（重刷奖励递减）。 */
  poemList() {
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, '📜 诗词星图')
    ));
    const stars = Store.state.chinese.stars;
    const learned = Store.state.chinese.learned || {};
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, '每首诗挑战 4 关：接下句 · 填名句 · 认作者 · 懂诗意'),
      h('div', { class: 'tiny', style: 'margin:6px 0 2px' }, '没学过的诗要先读一读：全诗 · 译文 · 重点字词，学完再挑战。全部答对点亮一颗 ⭐'),
      h('div', { class: 'cn-poem-list' },
        CN_POEMS.map(p => {
          const got = stars[p.id];
          const isLearned = !!learned[p.id];
          const stateIcon = got ? '⭐' : (isLearned ? '📖' : '🌑');
          const stateText = got ? '已点亮 · 再挑战' : (isLearned ? '学过 · 挑战' : '未学 · 先学习');
          return h('button', {
            class: 'pack-row cn-poem-row', onclick: () => { Sound.tap(); isLearned ? this.poemChallenge(p) : this.poemLearn(p); }
          },
            h('span', { class: 'pack-info' }, stateIcon, ` 《${p.title}》`, h('span', { class: 'tiny' }, `　${p.dynasty}·${p.author}`)),
            h('span', { class: 'tiny' }, stateText)
          );
        })
      )
    ));
  },

  /* ---------- 诗词学习页（未学诗先学后考） ---------- */
  poemLearn(p) {
    Sound.stopSpeak();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, `📜 学古诗 · 《${p.title}》`)
    ));
    const poemText = h('div', { class: 'gw-text poem-learn-text' },
      p.lines.map(l => h('div', { class: 'poem-line', onclick: () => Sound.speak(l, 0.85) }, l))
    );
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, `${p.title}`, h('span', { class: 'level-badge' }, `${p.dynasty} · ${p.author}`)),
      poemText,
      h('button', { class: 'btn big', style: 'margin:10px 0 2px', onclick: () => Sound.speak(p.lines.join('，') + '。', 0.8) }, '🔊 听一遍全诗'),
      h('div', { class: 'read-analysis', style: 'margin-top:6px' },
        h('div', { class: 'analysis-tag' }, '📖 白话译文'),
        h('div', { class: 'analysis-zh' }, p.trans),
        h('div', { class: 'analysis-tag', style: 'margin-top:12px' }, '🔑 重点字词'),
        p.notes.map(n => h('div', { class: 'note-row' },
          h('span', { class: 'note-w' }, n.split('：')[0]),
          h('span', { class: 'note-zh' }, n.split('：').slice(1).join('：'))
        )),
        h('div', { class: 'analysis-tag', style: 'margin-top:12px;display:flex;align-items:center;gap:8px' },
          h('span', {}, '🌟 背后的小故事'),
          h('button', { class: 'speak-btn', style: 'width:30px;height:30px;font-size:14px;flex:none', onclick: () => Sound.speak(p.story, 0.9) }, '🔊')
        ),
        h('div', { class: 'analysis-zh' }, p.story || '')
      ),
      h('div', { class: 'tiny', style: 'margin-top:10px' }, '点诗里的每一句可以单独听 · 学完了就挑战点亮 ⭐'),
      h('button', {
        class: 'btn btn-main big', style: 'margin-top:10px',
        onclick: () => {
          Sound.tap();
          if (!Store.state.chinese.learned) Store.state.chinese.learned = {};
          Store.state.chinese.learned[p.id] = Store.todayStr();
          Store.save();
          this.poemChallenge(p);
        }
      }, '我学会了，去挑战 →')
    ));
    setTimeout(() => Sound.speak(p.lines.join('，') + '。', 0.8), 400);
  },

  /* ---------- 名句填空出题（v32） ----------
   * 随机选一句，抠掉 1~2 个连续的字（避开句首字）；
   * 字块 = 抠掉的正确字数 + 3 个从本诗其他句抽的干扰字，打乱后点选。
   * skipLines：避开刚出过上下句的那两行，不让刚看完的答案原样再考一次。 */
  poemFillQ(p, skipLines) {
    /* 候选行：排除刚出过上下句的那两行，从剩下的行里等概率抽 */
    const cands = p.lines.map((_, k) => k).filter(k => !(skipLines || []).includes(k));
    const li = cands.length ? cands[Math.floor(Math.random() * cands.length)]
      : Math.floor(Math.random() * p.lines.length);
    const line = p.lines[li];
    const len = line.length;
    const blankLen = (len >= 7 && Math.random() < 0.6) ? 2 : 1;
    const start = 1 + Math.floor(Math.random() * (len - blankLen));
    const ans = line.slice(start, start + blankLen);
    const pool = [...new Set(p.lines.join('').split(''))].filter(c => !ans.includes(c));
    const distract = shuffle(pool).slice(0, 3);
    const opts = shuffle(ans.split('').concat(distract));
    const q = line.slice(0, start) + '＿'.repeat(blankLen) + line.slice(start + blankLen);
    return { kind: 'tiles', q, opts, ans, line, tip: `《${p.title}》：${line}` };
  },

  poemChallenge(p) {
    const qs = [];
    const i = Math.floor(Math.random() * (p.lines.length - 1));
    const correctLine = p.lines[i + 1];
    const others = shuffle(CN_POEMS.filter(x => x.id !== p.id).map(x => x.lines[Math.min(i + 1, x.lines.length - 1)])).slice(0, 3);
    const lineQ = {
      q: `“${p.lines[i]}”的下一句是？`,
      opts: [correctLine, ...others],
      tip: `《${p.title}》全诗：${p.lines.join('，')}。`,
      correctText: correctLine
    };
    lineQ.opts = shuffle(lineQ.opts);
    lineQ.ans = lineQ.opts.indexOf(correctLine);
    qs.push(lineQ);

    qs.push(this.poemFillQ(p, [i, i + 1]));

    const wrongAuthors = shuffle(CN_AUTHORS.filter(a => a !== p.author)).slice(0, 3);
    const authorQ = { q: `《${p.title}》的作者是？`, opts: [p.author, ...wrongAuthors], tip: `《${p.title}》是${p.dynasty}代诗人${p.author}的作品。`, correctText: p.author };
    authorQ.opts = shuffle(authorQ.opts);
    authorQ.ans = authorQ.opts.indexOf(p.author);
    qs.push(authorQ);

    qs.push(Object.assign({}, p.understand));

    let idx = 0, correct = 0;
    const step = () => {
      if (idx >= qs.length) {
        const allOk = correct === qs.length;
        const gained = Store.markCnStar(p.id, allOk);
        Store.state.today.cnRounds = (Store.state.today.cnRounds || 0) + 1;
        Store.save();
        Store.completeQuest();
        Sound.gold();
        this.summary(allOk ? '⭐' : '📜',
          allOk ? `点亮 ⭐《${p.title}》` : `《${p.title}》挑战完成`,
          `获得 +${gained} 🪙 · 星河诗卷 ${Object.keys(Store.state.chinese.stars).length}/${CN_POEMS.length}${!allOk ? ' · 错题已收进语文错题本，明天来消灭它们！' : (allOk && (Store.state.today.mint.poem || 0) > 1 ? ' · 今日重刷，奖励减半' : '')}`);
        renderHome();
        return;
      }
      this.ask(qs[idx], idx, qs.length, ok => { idx++; if (ok) correct++; step(); });
    };
    step();
  },

  /* ---------- 阅读训练营 ---------- */
  readList() {
    showScreen('quest');
    const done = Store.state.chinese.reads;
    const next = CN_READINGS.find(r => !done.includes(r.id)) || this.pick(CN_READINGS);
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, `📖 阅读训练营 ${done.length}/${CN_READINGS.length}`)
    ));
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, next.title),
      h('div', { class: 'drill-text', style: 'text-align:left' }, next.text),
      h('div', { class: 'tiny', style: 'margin-bottom:8px' }, '读完点下方开始答题（3 题，答对得金币）'),
      h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); this.readQuiz(next); } }, '开始答题 →')
    ));
  },

  readQuiz(passage) {
    let idx = 0, correct = 0;
    const step = () => {
      if (idx >= passage.qs.length) {
        const gained = Store.finishCnRead(passage.id, correct, passage.qs.length);
        Store.state.today.cnRounds = (Store.state.today.cnRounds || 0) + 1;
        Store.save();
        Store.completeQuest();
        Sound.gold();
        const allOk = correct === passage.qs.length;
        this.summary(allOk ? '💯' : '📖', allOk ? '全对！阅读小能手！' : '阅读完成！',
          `答对 ${correct}/${passage.qs.length} · 获得 +${gained} 🪙 · 完成篇数 ${Store.state.chinese.reads.length}/${CN_READINGS.length}${(Store.state.today.mint.cnread || 0) > 1 ? ' · 今日重刷，奖励减半' : ''}`);
        renderHome();
        return;
      }
      this.ask(passage.qs[idx], idx, passage.qs.length, ok => { idx++; if (ok) correct++; step(); });
    };
    step();
  },

  /* ---------- 小古文启蒙（拔高） ---------- */
  guwenList() {
    Sound.stopSpeak();
    const done = (Store.state.chinese.guwen || []);
    const next = CN_GUWEN.find(g => !done.includes(g.id)) || this.pick(CN_GUWEN);
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => { showScreen('home'); renderHome(); } }, '✕'),
      h('div', { class: 'quest-prog' }, `🧧 小古文 ${done.length}/${CN_GUWEN.length}`)
    ));
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, `${next.emoji} ${next.title}`, h('span', { class: 'level-badge' }, next.source)),
      h('div', { class: 'gw-text' }, next.text),
      h('div', { class: 'tiny en-gloss', style: 'text-align:left' }, `📖 字词卡：${next.gloss}`),
      h('div', { class: 'tiny', style: 'margin-top:8px' }, '先自己读一读、猜猜意思，再答 3 道题（白话翻译在最后揭晓）'),
      h('button', { class: 'btn btn-main big', style: 'margin-top:10px', onclick: () => { Sound.tap(); this.guwenQuiz(next); } }, '开始答题 →')
    ));
  },

  guwenQuiz(p) {
    let idx = 0, correct = 0;
    const step = () => {
      if (idx >= p.qs.length) {
        const gained = Store.finishCnGuwen(p.id, correct, p.qs.length);
        Store.state.today.cnRounds = (Store.state.today.cnRounds || 0) + 1;
        Store.save();
        Store.completeQuest();
        Sound.gold();
        const allOk = correct === p.qs.length;
        const root = $('#quest-root');
        root.innerHTML = '';
        root.appendChild(h('div', { class: 'card finish-card' },
          h('div', { class: 'finish-stamp' }, allOk ? '💯' : p.emoji),
          h('div', { class: 'finish-title' }, `《${p.title}》 ${correct}/${p.qs.length}`),
          h('div', { class: 'finish-sub' }, `获得 +${gained} 🪙${(Store.state.today.mint.guwen || 0) > 1 ? ' · 今日重刷，奖励减半' : ''} · 已读 ${Store.state.chinese.guwen.length}/${CN_GUWEN.length} 篇`),
          h('div', { class: 'card', style: 'padding:12px;margin:10px 0;text-align:left' },
            h('div', { class: 'tiny', style: 'margin-bottom:4px;font-weight:800' }, '📖 白话翻译'),
            h('div', { style: 'font-size:15px;line-height:1.9' }, p.trans)),
          h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
          h('div', { class: 'row-gap' },
            h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); Chinese.guwenList(); } }, '🧧 再读一篇'),
            h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
          )
        ));
        const c = centerOf($('.finish-stamp'));
        burst(c.x, c.y, { count: 22, emojis: [p.emoji, '⭐', '✨'], power: 120 });
        renderHome();
        return;
      }
      this.ask(p.qs[idx], idx, p.qs.length, ok => { idx++; if (ok) correct++; step(); });
    };
    step();
  },

  /* ---------- 词语实战 ---------- */
  words() {
    showScreen('quest');
    const wrong = (Store.state.chinese.wrong || []).slice();
    const qs = shuffle(wrong).slice(0, 2);
    while (qs.length < 5) {
      const isIdiom = Math.random() < 0.4;
      const pool = isIdiom ? CN_IDIOMS : CN_TRAPS;
      const q = this.pick(pool);
      if (!qs.some(x => x.q === q.q)) qs.push(q);
    }
    let idx = 0, correct = 0;
    const step = () => {
      if (idx >= qs.length) {
        const gained = Store.finishCnWords(correct);
        Store.state.today.cnRounds = (Store.state.today.cnRounds || 0) + 1;
        Store.save();
        Store.completeQuest();
        Sound.gold();
        this.summary('🈶', `词语实战 ${correct}/${qs.length}`, `获得 +${gained} 🪙${correct === qs.length ? ' · 全对！' : ' · 错题已记录，明天再战'}${(Store.state.today.mint.cnwords || 0) > 1 ? ' · 今日重刷，奖励减半' : ''}`);
        renderHome();
        return;
      }
      this.ask(qs[idx], idx, qs.length, ok => { idx++; if (ok) correct++; step(); });
    };
    step();
  }
};
