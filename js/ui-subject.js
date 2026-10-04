/* ============================================================
 * 星际求知号 - 次科答题引擎（科学 / 道法 共用）
 * 题型：choice 选择 | judge 判断 | cloze 选词填空 | steps 实验步骤排序
 * 数据格式见 js/data-science.js；每轮 8 题，完成参与打卡
 * ============================================================ */
const SubjectUI = {
  defs: [],

  register(def) {
    def.units.forEach(u => u.lessons.forEach(l => l.qs.forEach(q => {
      q.lesson = l.id;
      q.unit = u.id;
    })));
    this.defs.push(def);
  },

  byId(id) { return this.defs.find(d => d.id === id); },

  /* 首页学科宫格的磁贴（由 ui-screens.js 的 renderSubjects 调用） */
  tiles() {
    return this.defs.map(def => subjectTile(def.emoji, def.name, this.tileSub(def), () => this.openHub(def)));
  },

  tileSub(def) {
    const rounds = Store.subjectWeek(def.id);
    return `${rounds >= def.weeklyGoal ? '✅ ' : ''}本周探索 ${Math.min(rounds, def.weeklyGoal)}/${def.weeklyGoal} 轮`;
  },

  /* ---------- 单元选择（弹窗） ---------- */
  openHub(def) {
    const rounds = Store.subjectWeek(def.id);
    const wrong = Store.subjectWrong(def.id);
    const done = (Store.state.subjects[def.id] || { done: {} }).done;
    showModal({
      title: def.emoji + ' ' + def.name,
      build(el, close) {
        el.appendChild(h('div', { class: 'tiny center', style: 'margin-bottom:12px' },
          `本周探索 ${Math.min(rounds, def.weeklyGoal)}/${def.weeklyGoal} 轮 · 每轮 8 题${wrong.length ? ` · 待消灭错题 ${wrong.length}` : ''}`));
        if (wrong.length >= 2) {
          el.appendChild(h('button', {
            class: 'btn big danger', style: 'margin-top:0',
            onclick: () => { close(); SubjectUI.startRound(def, null, true); }
          }, '⚡ 错题挑战'));
        }
        def.units.forEach(u => {
          const doneL = u.lessons.filter(l => done[l.id]).length;
          el.appendChild(h('button', {
            class: 'btn big', style: 'margin-top:10px',
            onclick: () => { close(); SubjectUI.startRound(def, u); }
          }, `${u.emoji} ${u.name}（已练 ${doneL}/${u.lessons.length} 课）`));
        });
        el.appendChild(h('div', { class: 'tiny center', style: 'margin-top:12px' },
          `完成任意一轮都算盖章 · 每周建议 ${def.weeklyGoal} 轮（首刷金币全额，重刷减半）`));
      }
    });
  },

  /* ---------- 组一轮 8 题：本单元错题优先，再按题型配额抽取 ---------- */
  buildRound(def, unit, wrongOnly) {
    const wrong = Store.subjectWrong(def.id);
    let qs = [];
    if (wrongOnly) {
      qs = shuffle(wrong).slice(0, 8);
    } else if (unit) {
      const has = q => qs.some(x => x.q === q.q);
      shuffle(wrong.filter(w => w.unit === unit.id)).slice(0, 2)
        .forEach(w => { if (!has(w)) qs.push(w); });
      const rest = shuffle(unit.lessons.flatMap(l => l.qs)).filter(q => !has(q));
      const take = (kinds, n) => rest.filter(q => kinds.includes(q.kind)).slice(0, n)
        .forEach(q => { if (qs.length < 8 && !has(q)) qs.push(q); });
      take(['choice'], 5);
      take(['judge'], 2);
      take(['cloze', 'steps'], 1);
      rest.forEach(q => { if (qs.length < 8 && !has(q)) qs.push(q); });
      qs = shuffle(qs);
    }
    return qs.slice(0, 8);
  },

  startRound(def, unit, wrongOnly) {
    Sound.stopSpeak();
    const qs = this.buildRound(def, unit, wrongOnly);
    if (!qs.length) { toast('题目准备好了，稍后再来！'); return; }
    showScreen('quest');
    let idx = 0, correct = 0;
    const step = () => {
      if (idx >= qs.length) {
        const allOk = correct === qs.length;
        const gained = Store.finishSubjectRound(def.id, correct, qs.length);
        qs.forEach(q => Store.subjectMarkDone(def.id, q.lesson));
        Store.completeQuest();
        Sound.gold();
        this.summary(def, allOk ? '💯' : def.emoji,
          allOk ? '全对！太厉害了！' : `答对 ${correct}/${qs.length}`,
          `获得 +${gained} 🪙 · ${wrongOnly ? '错题挑战' : unit.name} · 本周探索 ${Store.subjectWeek(def.id)}/${def.weeklyGoal} 轮${!allOk ? ' · 错题已收进错题本' : ''}${(Store.state.today.mint[def.id] || 0) > 1 ? ' · 今日重刷，奖励减半' : ''}`);
        renderHome();
        return;
      }
      this.ask(def, qs[idx], idx, qs.length, ok => { idx++; if (ok) correct++; step(); });
    };
    step();
  },

  /* ---------- 通用答题界面 ---------- */
  ask(def, q, idx, total, onDone) {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'quest-top' },
      h('button', { class: 'quest-exit', onclick: () => confirmModal('退出练习？', '进度将不保存，确定退出吗？', () => { showScreen('home'); renderHome(); }) }, '✕'),
      h('div', { class: 'quest-prog' }, `${idx + 1} / ${total}`)
    ));

    let wasOk = null;
    const grade = ok => {
      if (wasOk !== null) return;
      wasOk = ok;
      if (ok) Sound.correct();
      else { Sound.wrong(); Store.subjectAddWrong(def.id, q); }
    };
    const tipEl = h('div', { class: 'tiny cn-tip', style: 'margin-top:10px;min-height:20px' }, '');
    const nextBtn = h('button', {
      class: 'btn btn-main big cn-next', style: 'display:none',
      onclick: () => { Sound.tap(); onDone(wasOk); }
    }, idx + 1 >= total ? '完成 →' : '下一题 →');
    const reveal = ok => {
      tipEl.innerHTML = ok ? '✅ ' + (q.tip || '回答正确！') : '❌ ' + (q.tip || `正确答案：${q.opts ? q.opts[q.ans] : (q.ans ? '对' : '错')}`);
      nextBtn.style.display = '';
    };

    const card = h('div', { class: 'card drill-card' });
    card.appendChild(h('div', { class: 'drill-tag' },
      q.kind === 'judge' ? '⚖️ 判断对错' : q.kind === 'cloze' ? '✏️ 选词填空' : q.kind === 'steps' ? '🧪 实验探究' : '📋 选一选'));

    if (q.kind === 'choice' || q.kind === 'cloze') {
      card.appendChild(h('div', { class: 'drill-text' },
        q.kind === 'cloze' ? this.clozeText(q) : q.q));
      const optsEl = h('div', { class: 'cn-opts' });
      const map = shuffle(q.opts.map((t, i) => ({ t, ok: i === q.ans })));
      map.forEach(m => {
        optsEl.appendChild(h('button', {
          class: 'cn-opt', 'data-ok': m.ok ? '1' : '0',
          onclick: e => {
            if (wasOk !== null) return;
            grade(m.ok);
            if (m.ok) {
              e.currentTarget.classList.add('right');
              const c = centerOf(e.currentTarget);
              burst(c.x, c.y, { count: 6, colors: ['#58e08a'], power: 40 });
            } else {
              e.currentTarget.classList.add('wrong');
              const right = Array.from(optsEl.children).find(x => x.dataset.ok === '1');
              if (right) right.classList.add('right');
            }
            Array.from(optsEl.children).forEach(b => { b.disabled = true; });
            if (q.kind === 'cloze') this.fillHole(card, m.t, m.ok);
            reveal(m.ok);
          }
        }, m.t));
      });
      card.appendChild(optsEl);
    } else if (q.kind === 'judge') {
      card.appendChild(h('div', { class: 'drill-text' }, q.q));
      const btns = h('div', { class: 'judge-btns' });
      [['✅ 对', true], ['❌ 错', false]].forEach(([label, val]) => {
        btns.appendChild(h('button', {
          class: 'judge-btn', 'data-ok': val === q.ans ? '1' : '0',
          onclick: e => {
            if (wasOk !== null) return;
            const ok = val === q.ans;
            grade(ok);
            e.currentTarget.classList.add(ok ? 'right' : 'wrong');
            if (!ok) {
              const right = Array.from(btns.children).find(x => x.dataset.ok === '1');
              if (right) right.classList.add('right');
            }
            Array.from(btns.children).forEach(b => { b.disabled = true; });
            reveal(ok);
          }
        }, label));
      });
      card.appendChild(btns);
    } else if (q.kind === 'steps') {
      card.appendChild(h('div', { class: 'drill-text', style: 'text-align:left' }, q.q));
      card.appendChild(h('div', { class: 'tiny', style: 'margin-bottom:2px' }, '点击卡片，按正确顺序排出实验步骤：'));
      const area = h('div', { class: 'steps-area' });
      let nextIdx = 0, bad = false;
      shuffle(q.steps.map((t, i) => ({ t, i }))).forEach(b => {
        const no = h('span', { class: 'step-no' }, '?');
        const blk = h('button', {
          class: 'step-block', onclick: () => {
            if (wasOk !== null || blk.classList.contains('locked')) return;
            if (b.i === nextIdx) {
              no.textContent = nextIdx + 1;
              blk.classList.add('locked');
              Sound.tap();
              nextIdx++;
              if (nextIdx >= q.steps.length) {
                grade(!bad);
                reveal(!bad);
                if (bad) tipEl.innerHTML = '❌ 顺序有出错哦。正确顺序：' + q.steps.map((s, i) => `(${i + 1})${s}`).join(' ');
              }
            } else {
              bad = true;
              Sound.wrong();
              blk.classList.add('shake');
              setTimeout(() => blk.classList.remove('shake'), 500);
            }
          }
        }, no, b.t);
        area.appendChild(blk);
      });
      card.appendChild(area);
    }

    card.appendChild(tipEl);
    card.appendChild(nextBtn);
    root.appendChild(card);
  },

  /* 填空题：句子里的 ____ 渲染成挖空，选择后填入 */
  clozeText(q) {
    const parts = q.q.split('____');
    const span = h('span', { class: 'cloze-sentence' });
    span.appendChild(document.createTextNode(parts[0] || ''));
    span.appendChild(h('span', { class: 'cloze-hole', 'data-hole': '1' }, '＿＿'));
    (parts[1] || '').split('\n').forEach((seg, i) => {
      if (i > 0) span.appendChild(h('br'));
      span.appendChild(document.createTextNode(seg));
    });
    return span;
  },
  fillHole(card, word, ok) {
    const hole = card.querySelector('[data-hole]');
    if (hole) {
      hole.textContent = word;
      hole.classList.add(ok ? 'filled' : 'wrong');
      if (!ok) hole.style.color = 'var(--red)';
    }
  },

  /* ---------- 结算 ---------- */
  summary(def, icon, title, sub) {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(h('div', { class: 'card finish-card' },
      h('div', { class: 'finish-stamp' }, icon),
      h('div', { class: 'finish-title' }, title),
      h('div', { class: 'finish-sub' }, sub),
      h('div', { class: 'finish-pet' }, `“${rnd(PET_LINES.praise)}” —— ${Store.state.pet.name}`),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); SubjectUI.openHub(def); } }, '再探索一轮'),
        h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { showScreen('home'); renderHome(); } }, '返回空间站')
      )
    ));
    const c = centerOf($('.finish-stamp'));
    burst(c.x, c.y, { count: 20, emojis: [icon, '⭐', '✨'], power: 120 });
  }
};
