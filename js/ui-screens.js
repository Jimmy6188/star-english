/* ============================================================
 * 星际英语站 - 页面渲染
 * 首页(空间站+宠物) / 星际图鉴 / 航行日志(日历) / 家长面板
 * ============================================================ */

let parentUnlocked = false;

function updateTop() {
  $('#top-coins').textContent = '🪙 ' + Store.state.coins;
  $('#btn-sound').textContent = Store.state.settings.soundOff ? '🔇' : '🔊';
}

/* ---------------- 机器宠物 SVG ---------------- */
function robotSVG(stage) {
  return `
  <svg viewBox="0 0 200 190" class="robot stage-${stage}">
    <defs>
      <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#b8c9e8"/><stop offset="1" stop-color="#6b7fa8"/>
      </linearGradient>
      <linearGradient id="visor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1a2647"/><stop offset="1" stop-color="#0b1226"/>
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="176" rx="52" ry="8" fill="rgba(79,209,255,.14)"/>
    <g class="r-wings">
      <polygon points="52,118 8,92 20,140" fill="#2b3f6e" stroke="#4fd1ff" stroke-width="2"/>
      <polygon points="148,118 192,92 180,140" fill="#2b3f6e" stroke="#4fd1ff" stroke-width="2"/>
      <circle cx="22" cy="112" r="3.5" fill="#ff6bd6"/><circle cx="178" cy="112" r="3.5" fill="#ff6bd6"/>
    </g>
    <g class="r-body">
      <rect x="55" y="98" width="90" height="68" rx="20" fill="url(#metal)"/>
      <rect x="72" y="116" width="56" height="32" rx="10" fill="url(#visor)"/>
      <text x="100" y="139" text-anchor="middle" font-size="16">⚡</text>
      <g class="r-arm-l"><rect x="30" y="106" width="20" height="48" rx="10" fill="#8ea3c9"/><circle cx="40" cy="158" r="9" fill="#5b6f94"/></g>
      <g class="r-arm-r"><rect x="150" y="106" width="20" height="48" rx="10" fill="#8ea3c9"/><circle cx="160" cy="158" r="9" fill="#5b6f94"/></g>
      <rect x="88" y="160" width="24" height="7" rx="3.5" fill="#4fd1ff" opacity=".9"/>
    </g>
    <g class="r-head">
      <line x1="100" y1="20" x2="100" y2="7" stroke="#8ea3c9" stroke-width="4"/>
      <circle class="r-ant" cx="100" cy="6" r="6" fill="#ff6bd6"/>
      <circle cx="100" cy="62" r="44" fill="url(#metal)"/>
      <rect x="64" y="44" width="72" height="36" rx="17" fill="url(#visor)"/>
      <ellipse class="eye" cx="85" cy="62" rx="7" ry="8.5" fill="#4fd1ff"/>
      <ellipse class="eye" cx="115" cy="62" rx="7" ry="8.5" fill="#4fd1ff"/>
      <path d="M86 84 Q100 94 114 84" stroke="#31446e" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>
    <g class="r-flame">
      <path d="M92 172 Q100 190 108 172 Q100 180 92 172" fill="#ffd166"/>
    </g>
  </svg>`;
}

/* ---------------- 首页：空间站 ---------------- */
function renderHome() {
  updateTop();
  const s = Store.state;
  const now = new Date();
  const hour = now.getHours();
  const hello = hour < 6 ? '夜深啦' : hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
  $('#greet-title').textContent = `${hello}，小宇航员！`;
  $('#greet-date').textContent = `${now.getMonth() + 1}月${now.getDate()}日 星期${week}`;

  /* 宠物 */
  const stage = Store.petStage();
  const petWrap = $('#pet-wrap');
  petWrap.innerHTML = robotSVG(stage);
  $('#pet-name').textContent = `🐾 ${s.pet.name}`;
  $('#pet-stage').textContent = `${PET_STAGES[stage].name} · ${PET_STAGES[stage].desc}`;
  const nextStage = PET_STAGES[stage + 1];
  const prog = $('#pet-progress');
  if (nextStage) {
    const from = PET_STAGES[stage].need, span = nextStage.need - from;
    const pct = Math.min(100, Math.round(((s.pet.fed - from) / span) * 100));
    prog.innerHTML = `<div class="bar slim"><i style="width:${pct}%"></i></div><div class="tiny">再喂 ${nextStage.need - s.pet.fed} 次进化成「${nextStage.name}」</div>`;
  } else {
    prog.innerHTML = `<div class="tiny">已是最终形态，闪闪发光 ✨</div>`;
  }
  const feedBtn = $('#btn-feed');
  feedBtn.disabled = s.coins < Store.FEED_COST || !!nextStage === false;
  feedBtn.textContent = nextStage ? `🍞 喂能量块 (${Store.FEED_COST}🪙)` : '⭐ 已满级';

  /* 台词 */
  let line;
  if (s.today.questDone) line = rnd(PET_LINES.praise);
  else if (s.coins >= Store.FEED_COST && Math.random() < 0.5) line = rnd(PET_LINES.hungry);
  else line = rnd(PET_LINES.idle);
  $('#pet-bubble').textContent = line;

  /* 连击 */
  $('#streak-num').textContent = s.streak.count;
  $('#streak-shields').innerHTML =
    '🛡️'.repeat(s.streak.shields) + (s.streak.shields === 0 ? '<span class="tiny">护盾已用完，周一补充</span>' : `<span class="tiny">护盾 ×${s.streak.shields}</span>`);

  /* 今日任务 */
  const set = s.settings;
  const newDone = s.today.newDone, revDone = s.today.revDone;
  $('#bar-new').style.width = Math.min(100, (newDone / set.dailyNew) * 100) + '%';
  $('#bar-rev').style.width = Math.min(100, (revDone / set.dailyReview) * 100) + '%';
  $('#txt-new').textContent = `${Math.min(newDone, set.dailyNew)}/${set.dailyNew}`;
  $('#txt-rev').textContent = `${Math.min(revDone, set.dailyReview)}/${set.dailyReview}`;

  const btn = $('#btn-quest');
  if (s.today.questDone) {
    btn.textContent = '✅ 今日已完成 · 自由练习';
    btn.onclick = () => { Sound.tap(); Quest.start(true); };
  } else {
    const started = newDone + revDone > 0;
    btn.textContent = started ? '🚀 继续冒险' : '🚀 开始冒险';
    btn.onclick = () => { Sound.tap(); Quest.start(false); };
  }

  /* 错词雷达 + 周日 BOSS 挑战 + 段位晋升 */
  const weakSlot = $('#weak-slot');
  weakSlot.innerHTML = '';
  $('#rank-line').textContent = `🎖 ${Store.rankInfo().name}`;
  if (Store.state.pendingPromotion) {
    const p = Store.state.pendingPromotion;
    Store.state.pendingPromotion = null;
    Store.save();
    Sound.gold();
    showModal({
      title: '🎖 段位晋升！',
      dismissable: true,
      build(el) {
        el.appendChild(h('div', { class: 'center' },
          h('div', { style: 'font-size:56px;margin:6px 0' }, '🎉'),
          h('div', { style: 'font-size:24px;font-weight:900;color:#ffcf5c' }, p.name),
          h('div', { class: 'tiny', style: 'margin-top:8px' }, `晋升奖励 +${p.reward} 🪙 已发放，新的星域向你敞开！`)
        ));
      },
      actions: [{ label: '太棒了！', cls: 'btn-main' }]
    });
  }
  /* 新成就徽章庆祝（每次首页展示一枚） */
  const nextBadgeId = Store.popPendingBadge();
  if (nextBadgeId) {
    const a = ACHIEVEMENTS.find(x => x.id === nextBadgeId);
    if (a) {
      Store.save();
      Sound.gold();
      showModal({
        title: '🏅 解锁新徽章！',
        dismissable: true,
        build(el) {
          el.appendChild(h('div', { class: 'center' },
            h('div', { style: 'font-size:64px;margin:8px 0' }, a.emoji),
            h('div', { style: 'font-size:22px;font-weight:900;color:#ffcf5c' }, a.name),
            h('div', { class: 'tiny', style: 'margin-top:6px' }, a.desc)
          ));
        },
        actions: [{ label: '收下！', cls: 'btn-main' }]
      });
    }
  }
  if (new Date().getDay() === 0) {
    const boss = Store.bossInfo();
    weakSlot.appendChild(h('button', {
      class: 'card weak-card boss-card' + (boss.done ? ' done' : ''),
      onclick: () => { Sound.tap(); Quest.startBoss(); }
    },
      h('span', { class: 'weak-icon' }, '👑'),
      h('span', { class: 'weak-text' },
        h('b', {}, boss.done ? '本周 BOSS 已被击败！' : 'BOSS 周挑战！'),
        h('span', { class: 'tiny' }, boss.done ? `最佳成绩 ${boss.best}/${boss.total || 10} · 点此再战一次` : `10 道高阶大题，失误 2 次内通关 +${COIN_BOSS} 🪙（仅周日出现）`)
      ),
      h('span', { class: 'weak-go boss-go' }, boss.done ? '再战' : '开战')
    ));
  }
  const weak = Store.weakList(99);
  if (weak.length) {
    weakSlot.appendChild(h('button', {
      class: 'card weak-card', onclick: () => { Sound.tap(); Quest.startDrill(); }
    },
      h('span', { class: 'weak-icon' }, '⚡'),
      h('span', { class: 'weak-text' },
        h('b', {}, `错词来袭！${weak.length} 个老对手在等你`),
        h('span', { class: 'tiny' }, '点击开战，全部答对就能洗清连错')
      ),
      h('span', { class: 'weak-go' }, '开战')
    ));
  }
}

function bindHome() {
  $('#btn-feed').addEventListener('click', () => {
    const r = Store.feedPet();
    if (!r) { toast('金币不够啦，先去做任务吧'); return; }
    const c = centerOf($('#pet-wrap'));
    if (r.evolved) {
      Sound.evolve();
      burst(c.x, c.y, { count: 26, emojis: ['✨', '⭐', '🌟', '💥'], power: 130 });
      toast(`${Store.state.pet.name} 进化成「${PET_STAGES[r.stage].name}」啦！`);
    } else {
      Sound.coin();
      burst(c.x, c.y, { count: 10, emojis: ['💛', '✨'], power: 70 });
      $('#pet-bubble').textContent = rnd(PET_LINES.feed);
    }
    renderHome();
  });
}

/* ---------------- 星际图鉴 ---------------- */
function renderAlbum() {
  updateTop();
  const root = $('#album-root');
  root.innerHTML = '';
  const packs = Store.activePacks();
  let total = 0, got = 0;
  packs.forEach(p => {
    p.words.forEach(w => {
      total++;
      if (Store.state.album[w.word.toLowerCase()]) got++;
    });
  });

  const head = h('div', { class: 'album-head' },
    h('div', { class: 'album-title' }, '🌌 星际图鉴'),
    h('div', { class: 'album-sub' }, `已收集 ${got} / ${total} 张星际贴纸`)
  );
  root.appendChild(head);

  /* 成就徽章墙入口 */
  const earnedBadges = Object.keys(Store.state.badges).length;
  root.appendChild(h('button', {
    class: 'card weak-card boss-card',
    onclick: () => { Sound.tap(); showBadgeWall(); }
  },
    h('span', { class: 'weak-icon' }, '🎖'),
    h('span', { class: 'weak-text' },
      h('b', {}, `成就徽章 ${earnedBadges} / ${ACHIEVEMENTS.length}`),
      h('span', { class: 'tiny' }, '坚持打卡、收集贴纸、击败 BOSS 都能解锁')
    ),
    h('span', { class: 'weak-go boss-go' }, '查看')
  ));

  packs.forEach(p => {
    const pgot = p.words.filter(w => Store.state.album[w.word.toLowerCase()]).length;
    const sec = h('div', { class: 'card galaxy-card' },
      h('div', { class: 'galaxy-head' },
        h('span', { class: 'galaxy-emoji' }, p.emoji),
        h('span', { class: 'galaxy-name' }, p.name),
        h('span', { class: 'galaxy-count' }, `${pgot}/${p.words.length}`)
      ),
      h('div', { class: 'album-grid' },
        p.words.map(w => {
          const id = w.word.toLowerCase();
          const rec = Store.state.album[id];
          const weakMark = Store.isWeak(id) ? ' weak' : '';
          const tile = h('button', {
            class: 'album-tile ' + (rec ? (rec.gold ? 'unlocked gold' : 'unlocked') : 'locked') + weakMark,
            onclick: () => { Sound.tap(); showWordModal(id, !!rec); }
          },
          h('span', { class: 'tile-emoji' }, w.emoji),
          rec ? h('span', { class: 'tile-word' }, w.word) : h('span', { class: 'tile-q' }, '?')
          );
          return tile;
        })
      )
    );
    root.appendChild(sec);
  });
}

function showWordModal(id, unlocked) {
  const w = Store.findWord(id);
  if (!w) return;
  if (!unlocked) {
    showModal({
      title: '🔒 还没解锁',
      build(el) { el.appendChild(h('div', { class: 'center' }, `继续冒险，拼出「${w.zh}」就能点亮这张贴纸！`)); },
      actions: [{ label: '知道啦', cls: 'btn-main' }]
    });
    return;
  }
  const rec = Store.state.album[id];
  showModal({
    title: rec.gold ? '🌟 超新星贴纸 🌟' : '星际贴纸',
    build(el) {
      el.appendChild(h('div', { class: 'center modal-emoji ' + (rec.gold ? 'gold-glow' : '') }, w.emoji));
      el.appendChild(h('div', { class: 'modal-word' }, w.word));
      el.appendChild(h('div', { class: 'modal-zh' }, w.zh));
      el.appendChild(h('div', { class: 'modal-ex' },
        h('button', { class: 'speak-btn', onclick: () => Sound.speak(w.ex) }, '🔊 '), w.ex
      ));
      el.appendChild(h('div', { class: 'modal-exzh' }, w.exZh));
      el.appendChild(h('div', { class: 'tiny center' }, gradeLabel(w) + `${rec.gold ? ' · 稀有贴纸' : ''} · 收集于 ${rec.at}`));
    },
    actions: [{ label: '再听一遍 🔊', cls: '', onClick: (close) => Sound.speak(w.word) }, { label: '好', cls: 'btn-main' }]
  });
  Sound.speak(w.word);
}

/* 徽章墙 */
function showBadgeWall() {
  showModal({
    title: `🎖 成就徽章 ${Object.keys(Store.state.badges).length}/${ACHIEVEMENTS.length}`,
    build(el) {
      el.appendChild(h('div', { class: 'badge-grid' },
        ACHIEVEMENTS.map(a => {
          const at = Store.state.badges[a.id];
          return h('div', { class: 'badge-tile' + (at ? '' : ' locked') },
            h('div', { class: 'be' }, a.emoji),
            h('div', { class: 'bn' }, a.name),
            h('div', { class: 'bd' }, a.desc),
            h('div', { class: 'bt' }, at || '🔒')
          );
        })
      ));
    },
    actions: [{ label: '继续加油！', cls: 'btn-main' }]
  });
}

/* ---------------- 航行日志（日历） ---------------- */
let calView = null;
function renderCalendar() {
  updateTop();
  const root = $('#calendar-root');
  root.innerHTML = '';
  const now = new Date();
  if (!calView) calView = { y: now.getFullYear(), m: now.getMonth() };
  const { y, m } = calView;
  const s = Store.state;

  root.appendChild(h('div', { class: 'cal-top card' },
    h('div', { class: 'cal-streak' }, '🔥 连续航行 ', h('b', {}, s.streak.count + ' 天')),
    h('div', { class: 'tiny' }, `🛡️ 护盾 ×${s.streak.shields} · 完成当日任务即盖章，漏一天自动用护盾保护`)
  ));

  const head = h('div', { class: 'cal-head' },
    h('button', { class: 'cal-nav', onclick: () => { Sound.tap(); calView.m--; if (calView.m < 0) { calView.m = 11; calView.y--; } renderCalendar(); } }, '‹'),
    h('div', { class: 'cal-title' }, `${y}年${m + 1}月`),
    h('button', {
      class: 'cal-nav', onclick: () => {
        Sound.tap(); calView.m++;
        if (calView.m > 11) { calView.m = 0; calView.y++; }
        renderCalendar();
      }
    }, '›')
  );
  root.appendChild(head);

  const grid = h('div', { class: 'cal-grid' });
  ['一', '二', '三', '四', '五', '六', '日'].forEach(d => grid.appendChild(h('div', { class: 'cal-wd' }, d)));
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7; // 周一开头
  for (let i = 0; i < offset; i++) grid.appendChild(h('div', { class: 'cal-cell empty' }));
  const days = new Date(y, m + 1, 0).getDate();
  const today = Store.todayStr();
  for (let d = 1; d <= days; d++) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const rec = s.history[ds] || {};
    const cell = h('div', { class: 'cal-cell' + (ds === today ? ' today' : '') },
      h('span', { class: 'cal-day' }, d),
      rec.done ? h('span', { class: 'cal-stamp' }, '🚀') :
        rec.shieldUsed ? h('span', { class: 'cal-stamp shield' }, '🛡️') : ''
    );
    grid.appendChild(cell);
  }
  root.appendChild(h('div', { class: 'card cal-card' }, grid));
}

/* ---------------- 家长面板 ---------------- */
function renderParent() {
  updateTop();
  const root = $('#parent-root');
  root.innerHTML = '';
  if (!parentUnlocked) { renderPinGate(root); return; }

  const s = Store.state;
  const packs = Store.allPacks();
  const active = Store.activePacks();
  const totalWords = active.reduce((n, p) => n + p.words.length, 0);
  const learnedIds = Object.keys(s.srs).filter(id => Store.findWord(id));
  const dueNow = Store.dueList().length;
  let ok = 0, bad = 0;
  learnedIds.forEach(id => { ok += s.srs[id].ok; bad += s.srs[id].bad; });
  const acc = ok + bad ? Math.round((ok / (ok + bad)) * 100) : 0;

  /* 概览 */
  const bars7 = [];
  for (let i = 6; i >= 0; i--) {
    const ds = Store.addDays(Store.todayStr(), -i);
    const rec = s.history[ds];
    const min = rec ? Math.max(3, Math.min(30, rec.minutes || (rec.done ? 10 : 0))) : 0;
    bars7.push(h('div', { class: 'stat-bar', title: `${ds} ${rec && rec.done ? '已完成' : '未完成'}` },
      h('i', { style: 'height:' + min * 3 + 'px', class: rec && rec.done ? '' : 'dim' }),
      h('span', {}, ds.slice(8))
    ));
  }
  const rk = Store.rankInfo();
  const boss = Store.bossInfo();
  const accHint = (acc >= 92 && learnedIds.length >= 30)
    ? h('div', { class: 'acc-hint' }, `🌟 孩子正确率高达 ${acc}%，学有余力！建议把下方「词汇范围」改为「全部词库」，加入高年级挑战词，或让孩子挑战周日 BOSS。`)
    : '';
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '📊 学习概览'),
    accHint,
    h('div', { class: 'stat-grid' },
      statBox('已学单词', `${learnedIds.length} / ${totalWords}`),
      statBox('今日待复习', dueNow + ' 词'),
      statBox('总正确率', acc + '%'),
      statBox('连续打卡', s.streak.count + ' 天'),
      statBox('当前段位', rk.name),
      statBox('今日用时', s.today.minutes + ' 分钟'),
      statBox('金币余额', s.coins + ' 🪙'),
      statBox('本周BOSS', boss.done ? `${boss.best}/${boss.total || 10} ✓` : '周日开启')
    ),
    h('div', { class: 'stat-bars' }, bars7),
    h('div', { class: 'tiny' }, '近 7 天学习时长（柱高=分钟数，亮色=当天完成打卡）· 段位按已学词数晋升：' + RANKS.map(r => r.name).join('→'))
  ));

  /* 错题本 */
  const weakIds = Store.weakList(10);
  if (weakIds.length) {
    const wCard = h('div', { class: 'card' },
      h('div', { class: 'sec-title' }, '📕 错题本'),
      h('div', { class: 'tiny', style: 'margin-bottom:6px' }, '孩子反复出错的词。复习时会优先出现；首页的「错词来袭」可以专项挑战，连续答对会自动移出本子'));
    weakIds.forEach(id => {
      const w = Store.findWord(id);
      const rec = s.srs[id];
      wCard.appendChild(h('div', { class: 'pack-row' },
        h('span', { class: 'pack-info' }, `${w.emoji} ${w.word}`, h('span', { class: 'tiny' }, `　${w.zh}`)),
        h('span', { class: 'tiny' }, `错 ${rec.bad || 0} 次 · 连错 ${rec.wrongStreak || 0}`)
      ));
    });
    root.appendChild(wCard);
  }

  /* 学习设置 */
  const set = s.settings;
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '⚙️ 学习设置'),
    selectRow('孩子年级', 'grade',
      [1, 2, 3, 4, 5, 6].map(g => [String(g), `${g}年级`]), String(set.grade),
      v => Store.setSetting('grade', parseInt(v, 10))),
    selectRow('词汇范围', 'range',
      [['below', '当前年级 + 低年级温故（推荐）'], ['current', '只学当前年级'], ['all', '全部词库（含高年级挑战）']],
      set.range, v => Store.setSetting('range', v)),
    numInput('每天温故词数', 'warmupPerDay', set.warmupPerDay === undefined ? 1 : set.warmupPerDay, 0, 3),
    h('div', { class: 'tiny', style: 'margin:2px 0 10px' }, '每天的新词 = 当前年级词汇为主 + 至多数个低年级温故词热身（设为 0 则全部当前年级）；学习卡上会标注「温故/挑战」'),
    numInput('每天新词数', 'dailyNew', set.dailyNew, 1, 10),
    numInput('每天复习量', 'dailyReview', set.dailyReview, 3, 30),
    numInput('单次时长提醒（分钟）', 'sessionLimitMin', set.sessionLimitMin, 5, 60),
    h('label', { class: 'check-row' },
      h('input', { type: 'checkbox', checked: !set.soundOff ? '' : null, onchange: e => Store.setSetting('soundOff', !e.target.checked) }),
      ' 音效与发音'
    ),
    h('div', { class: 'row-gap' },
      h('input', { id: 'new-pin', class: 'input', type: 'password', maxlength: '4', placeholder: '设置新 PIN（4位数字）' }),
      h('button', {
        class: 'btn', onclick: () => {
          const v = $('#new-pin').value;
          if (!/^\d{4}$/.test(v)) { toast('PIN 必须是 4 位数字'); return; }
          Store.setSetting('pin', v); $('#new-pin').value = ''; toast('PIN 已更新');
        }
      }, '修改 PIN')
    ),
    h('div', { class: 'tiny' }, '初始 PIN 为 1234，请及时修改（当前 PIN：' + set.pin + '）')
  ));

  /* 词库管理 */
  const packCard = h('div', { class: 'card' }, h('div', { class: 'sec-title' }, '📚 词库管理'));
  packs.forEach(p => {
    const on = Store.isActive(p.id);
    const learned = p.words.filter(w => s.srs[w.word.toLowerCase()]).length;
    packCard.appendChild(h('div', { class: 'pack-row' },
      h('span', { class: 'pack-info' }, `${p.emoji} ${p.name}`, h('span', { class: 'tiny' }, `　${learned}/${p.words.length} 已学`)),
      h('button', {
        class: 'btn small ' + (on ? 'btn-on' : ''),
        onclick: () => {
          Sound.tap();
          let ap = s.settings.activePacks ? s.settings.activePacks.slice() : Store.allPacks().map(x => x.id);
          if (on) ap = ap.filter(x => x !== p.id); else ap.push(p.id);
          if (!ap.length) { toast('至少要保留一个星系'); return; }
          Store.setSetting('activePacks', ap.length === Store.allPacks().length ? null : ap);
          renderParent();
        }
      }, on ? '已开启' : '已关闭')
    ));
  });
  packCard.appendChild(h('div', { class: 'tiny' }, '关闭的星系不出现在学习与图鉴中'));
  root.appendChild(packCard);

  /* 自定义词库 */
  const customCard = h('div', { class: 'card' }, h('div', { class: 'sec-title' }, '✨ 添加自定义词'));
  customCard.appendChild(h('textarea', {
    id: 'custom-input', class: 'input', rows: '4',
    placeholder: '每行一个词，格式：单词|中文|表情|例句|例句中文\n后三项可省略，例如：\ntiger|老虎\ncup|杯子|🍵|This is my cup.'
  }));
  customCard.appendChild(h('button', {
    class: 'btn btn-main', onclick: () => {
      const txt = $('#custom-input').value;
      const { list, bad } = parseCustomLines(txt);
      if (!list.length) { toast(bad.length ? `这行没认出来：${bad[0].slice(0, 24)}` : '没有识别到有效单词'); return; }
      const n = Store.addCustomWords(list);
      toast(`已添加 ${n} 个词` + (bad.length ? `；${bad.length} 行无法识别` : ''));
      renderParent();
    }
  }, '添加到「我的星系」'));
  if (s.custom.length) {
    s.custom.forEach(w => {
      const id = w.word.toLowerCase();
      customCard.appendChild(h('div', { class: 'pack-row' },
        h('span', {}, `${w.emoji} ${w.word} `, h('span', { class: 'tiny' }, w.zh || '')),
        h('button', { class: 'btn small danger', onclick: () => { Store.removeCustomWord(id); renderParent(); } }, '删除')
      ));
    });
  }
  root.appendChild(customCard);

  /* 听写小测验 */
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '📝 听写小测验'),
    h('div', { class: 'tiny', style: 'margin-bottom:8px' }, '随机抽 10 个已学词，播发音+显示中文让孩子拼写；每词只有一次机会，错词自动收进错题本。适合周末或课前检查。'),
    h('button', {
      class: 'btn btn-main', onclick: () => {
        showScreen('quest');
        Quest.startDictation();
      }
    }, '🎯 发起听写测验'),
    s.dictations && s.dictations.length ? h('div', { style: 'margin-top:6px' },
      h('div', { class: 'tiny', style: 'margin:6px 0 2px' }, '最近成绩：'),
      s.dictations.slice(-3).reverse().map(d => h('div', { class: 'pack-row' },
        h('span', { class: 'tiny' }, d.at),
        h('span', { class: 'pack-info' }, `${d.correct}/${d.total} ${d.correct === d.total ? '💯' : ''}`)
      ))
    ) : ''
  ));

  /* 数据管理 */
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '💾 数据备份'),
    h('div', { class: 'row-gap wrap' },
      h('button', {
        class: 'btn', onclick: () => {
          const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `star-english-backup-${Store.todayStr()}.json` });
          document.body.appendChild(a); a.click(); a.remove();
          toast('备份文件已下载');
        }
      }, '导出备份'),
      h('button', { class: 'btn', onclick: () => $('#import-file').click() }, '导入备份'),
      h('input', { id: 'import-file', type: 'file', accept: '.json', style: 'display:none', onchange: e => {
        const f = e.target.files[0];
        if (!f) return;
        const fr = new FileReader();
        fr.onload = () => {
          try { Store.importJSON(fr.result); toast('导入成功'); parentUnlocked = false; showScreen('home'); }
          catch (err) { toast('导入失败：' + err.message); }
        };
        fr.readAsText(f);
      } })
    ),
    h('div', { class: 'row-gap wrap' },
      h('button', {
        class: 'btn danger', onclick: () => confirmModal('仅清空学习进度', '清空所有学习记录、图鉴和连击（保留词库与设置），确定？', () => {
          Store.resetProgress(); showScreen('home'); toast('已清空学习进度');
        })
      }, '清空学习进度'),
      h('button', {
        class: 'btn danger', onclick: () => confirmModal('恢复出厂', '将删除全部数据（包括自定义词库和设置），确定？', () => {
          Store.factoryReset(); parentUnlocked = false; showScreen('home'); toast('已恢复出厂设置');
        })
      }, '恢复出厂')
    ),
    h('div', { class: 'tiny' }, '数据仅保存在本设备浏览器中。清理浏览器数据会丢失进度，建议定期导出备份。')
  ));

  root.appendChild(h('button', { class: 'btn exit-btn', onclick: () => { parentUnlocked = false; showScreen('home'); } }, '退出家长面板'));
}

function statBox(label, value) {
  return h('div', { class: 'stat-box' }, h('div', { class: 'stat-val' }, value), h('div', { class: 'tiny' }, label));
}
/* 年级徽章文案：低于当前年级=温故，高于=挑战，自定义词无年级 */
function gradeLabel(w) {
  if (!w.grade) return '';
  const cur = Store.state.settings.grade;
  const tag = w.grade < cur ? '温故 · ' : (w.grade > cur ? '挑战 · ' : '');
  return `${tag}${w.grade}年级词`;
}
function numInput(label, key, val, min, max) {
  return h('label', { class: 'num-row' },
    h('span', {}, label),
    h('input', {
      class: 'input num', type: 'number', min, max, value: val,
      onchange: e => {
        let v = parseInt(e.target.value, 10);
        if (isNaN(v)) v = min;
        v = Math.max(min, Math.min(max, v));
        e.target.value = v;
        Store.setSetting(key, v);
      }
    })
  );
}
function selectRow(label, key, options, val, onChange) {
  const sel = h('select', {
    class: 'input num',
    onchange: e => onChange(e.target.value)
  }, options.map(([v, text]) => h('option', { value: v, selected: v === val ? '' : null }, text)));
  return h('label', { class: 'num-row' }, h('span', {}, label), sel);
}
function parseCustomLines(text) {
  const out = [], bad = [];
  text.split(/\n+/).map(s => s.trim()).filter(Boolean).forEach(line => {
    /* 分隔符自动识别：| 优先，其次 Tab、中文逗号、英文逗号 */
    let parts;
    if (line.includes('|')) parts = line.split('|');
    else if (line.includes('\t')) parts = line.split('\t');
    else if (line.includes('，')) parts = line.split('，');
    else if (line.includes(',')) parts = line.split(',');
    else parts = [line];
    parts = parts.map(x => x.trim());
    const word = parts[0];
    if (!/^[a-zA-Z][a-zA-Z'\- ]{0,19}$/.test(word)) { bad.push(line); return; }
    out.push({
      word,
      zh: parts[1] || '',
      emoji: parts[2] || '🌟',
      ex: parts[3] || `${word.charAt(0).toUpperCase() + word.slice(1)} is a word.`,
      exZh: parts[4] || ''
    });
  });
  return { list: out, bad };
}
function confirmModal(title, msg, onYes) {
  showModal({
    title,
    build(el) { el.appendChild(h('div', {}, msg)); },
    actions: [
      { label: '取消' },
      { label: '确定执行', cls: 'danger', onClick: close => { close(); onYes(); } }
    ]
  });
}

/* PIN 门 */
function renderPinGate(root) {
  let entered = '';
  const dots = () => h('div', { class: 'pin-dots' }, [0, 1, 2, 3].map(i =>
    h('span', { class: 'pin-dot' + (i < entered.length ? ' on' : '') })
  ));
  const box = h('div', { class: 'card pin-card' });
  const refresh = () => { box.querySelector('.pin-dots').replaceWith(dots()); };
  box.appendChild(h('div', { class: 'sec-title center' }, '🔒 家长入口'));
  box.appendChild(dots());
  const pad = h('div', { class: 'pin-pad' });
  '1234567890'.split('').forEach(n => pad.appendChild(h('button', {
    class: 'btn pin-key', onclick: () => {
      Sound.tap();
      if (entered.length >= 4) return;
      entered += n;
      if (entered.length === 4) {
        setTimeout(() => {
          if (entered === Store.state.settings.pin) { parentUnlocked = true; renderParent(); }
          else { toast('PIN 不对'); entered = ''; refresh(); }
        }, 120);
      }
      refresh();
    }
  }, n)));
  pad.appendChild(h('button', { class: 'btn pin-key', onclick: () => { entered = entered.slice(0, -1); refresh(); } }, '⌫'));
  box.appendChild(pad);
  box.appendChild(h('div', { class: 'tiny center' }, '默认 PIN：1234（可在家长面板修改）'));
  root.appendChild(box);
  root.appendChild(h('button', { class: 'btn exit-btn', onclick: () => showScreen('home') }, '返回'));
}
