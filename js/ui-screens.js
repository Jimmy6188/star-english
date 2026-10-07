/* ============================================================
 * 星际求知号 - 页面渲染
 * 首页(空间站+宠物) / 星际图鉴 / 航行日志(日历) / 家长面板
 * ============================================================ */

let parentUnlocked = false;

function updateTop() {
  $('#top-coins').textContent = '🪙 ' + Store.state.coins;
  $('#btn-sound').textContent = Store.state.settings.soundOff ? '🔇' : '🔊';
}

/* ---------------- 机器宠物 SVG ---------------- */
/* 装扮图层：cape 画在身体后面，其余画在头上/脸上/脖子上（PET_OUTFITS 数据见 data.js） */
function robotSVG(stage) {
  const worn = (Store.state.pet.outfits && Store.state.pet.outfits.worn) || {};
  const ACC = {
    hat: '<g><ellipse cx="100" cy="26" rx="32" ry="6" fill="#2b3f6e" stroke="#4fd1ff" stroke-width="1.5"/><rect x="82" y="4" width="36" height="22" rx="4" fill="#2b3f6e"/><rect x="82" y="19" width="36" height="7" fill="#ff6bd6"/></g>',
    crown: '<g><polygon points="76,28 81,8 92,20 100,4 108,20 119,8 124,28" fill="#ffd166" stroke="#e0a63c" stroke-width="2"/><circle cx="100" cy="18" r="3.2" fill="#ff6bd6"/></g>',
    bow: '<g><polygon points="128,22 146,13 146,31" fill="#ff8fab" stroke="#ff6bd6" stroke-width="1.5"/><polygon points="164,22 146,13 146,31" fill="#ff8fab" stroke="#ff6bd6" stroke-width="1.5"/><circle cx="146" cy="22" r="4.5" fill="#ff6bd6"/></g>',
    shades: '<g><rect x="68" y="54" width="27" height="17" rx="8" fill="#141d38"/><rect x="105" y="54" width="27" height="17" rx="8" fill="#141d38"/><line x1="95" y1="62" x2="105" y2="62" stroke="#141d38" stroke-width="3"/><line x1="74" y1="58" x2="84" y2="58" stroke="#4fd1ff" stroke-width="2" opacity=".7"/><line x1="111" y1="58" x2="121" y2="58" stroke="#4fd1ff" stroke-width="2" opacity=".7"/></g>',
    starg: '<g><circle cx="83" cy="62" r="11" fill="rgba(255,209,102,.15)" stroke="#ffd166" stroke-width="3"/><circle cx="117" cy="62" r="11" fill="rgba(255,209,102,.15)" stroke="#ffd166" stroke-width="3"/><line x1="94" y1="62" x2="106" y2="62" stroke="#ffd166" stroke-width="3"/><text x="83" y="67" text-anchor="middle" font-size="12">⭐</text><text x="117" y="67" text-anchor="middle" font-size="12">⭐</text></g>',
    scarf: '<g><rect x="60" y="95" width="80" height="13" rx="6.5" fill="#ff5d73"/><rect x="120" y="104" width="15" height="28" rx="6" fill="#ff5d73"/><line x1="66" y1="101" x2="134" y2="101" stroke="#ffd9de" stroke-width="2" opacity=".6"/></g>',
    cape: '<g><polygon points="56,100 144,100 172,180 28,180" fill="#4a2f8f"/><polygon points="56,100 100,100 100,180 28,180" fill="#5b3fa8"/><circle cx="100" cy="106" r="4" fill="#ffd166"/></g>'
  };
  const back = worn.neck === 'cape' ? ACC.cape : '';
  const front =
    ['hat', 'crown', 'bow'].filter(k => worn.head === k).map(k => ACC[k]).join('') +
    ['shades', 'starg'].filter(k => worn.face === k).map(k => ACC[k]).join('') +
    (worn.neck === 'scarf' ? ACC.scarf : '');
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
    ${back}
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
    ${front}
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

  /* 连击 + 护盾（护盾可用金币兑换，给金币一个大额出口） */
  $('#streak-num').textContent = s.streak.count;
  const shieldFull = s.streak.shields >= SHIELD_MAX;
  $('#streak-shields').innerHTML =
    '🛡️'.repeat(s.streak.shields) + (s.streak.shields === 0 ? '<span class="tiny">护盾已用完，周一补充</span>' : `<span class="tiny">护盾 ×${s.streak.shields}</span>`) +
    `<button id="btn-buy-shield" class="btn small${shieldFull || s.coins < SHIELD_COST ? '' : ' btn-gold'}" style="margin-top:6px" ${shieldFull ? 'disabled' : ''}>🛡️ 兑换护盾 ${SHIELD_COST}🪙</button>`;
  const buyShieldBtn = $('#btn-buy-shield');
  if (buyShieldBtn) buyShieldBtn.onclick = () => {
    Sound.tap();
    const res = Store.buyShield();
    if (res.ok) {
      Sound.gold();
      toast(`🛡️ 兑换成功！现在有 ${res.shields} 张护盾护航`);
      renderHome();
    } else toast(res.msg);
  };

  /* 今日任务（主科：英语 / 数学 / 语文） */
  const set = s.settings;
  const newDone = s.today.newDone, revDone = s.today.revDone;
  const enDone = !!s.today.enDone;
  const mathDone = !!s.today.mathDone;
  const cnDone = (s.today.cnRounds || 0) >= 1;

  const taskRows = $('#task-rows');
  taskRows.innerHTML = '';
  const mkRow = (icon, name, sub, done, go) => h('div', { class: 'task-row' + (done ? ' done' : '') },
    h('span', { class: 'tr-icon' }, icon),
    h('div', { class: 'tr-info' },
      h('div', { class: 'tr-name' }, name),
      h('div', { class: 'tr-sub' }, sub)
    ),
    h('button', { class: 'btn small' + (done ? ' btn-on' : ''), onclick: () => { Sound.tap(); go(); } }, done ? '再来' : '去完成')
  );
  taskRows.appendChild(mkRow('🚀', '英语',
    enDone ? '今日任务完成' : `新词 ${Math.min(newDone, set.dailyNew)}/${set.dailyNew} · 复习 ${Math.min(revDone, set.dailyReview)}/${set.dailyReview}`,
    enDone, () => Quest.start(enDone)));
  taskRows.appendChild(mkRow('🪐', '数学',
    mathDone ? '今日已冲刺' : '60 秒口算冲刺',
    mathDone, () => MathSprint.start()));
  taskRows.appendChild(mkRow('📖', '语文',
    cnDone ? '今日已练一轮' : '诗词 / 阅读 / 词语任选一轮',
    cnDone, () => openCnHub()));

  /* 大按钮：按 英语 → 数学 → 语文 顺序指向下一个任务 */
  const btn = $('#btn-quest');
  const startedEn = newDone + revDone > 0;
  if (!enDone) {
    btn.textContent = startedEn ? '🚀 继续冒险' : '🚀 开始冒险';
    btn.onclick = () => { Sound.tap(); Quest.start(false); };
  } else if (!mathDone) {
    btn.textContent = '🪐 去口算冲刺';
    btn.onclick = () => { Sound.tap(); MathSprint.start(); };
  } else if (!cnDone) {
    btn.textContent = '📖 语文练一轮';
    btn.onclick = () => { Sound.tap(); Chinese.words(); };
  } else {
    btn.textContent = '🎉 主科全达 · 自由玩';
    btn.onclick = () => { Sound.tap(); Quest.start(true); };
  }
  $('#task-foot').textContent = (enDone && mathDone && cnDone)
    ? '三科全达奖励已到账，去学科星系继续探索吧！'
    : '完成任意一科即盖章 · 三科全达额外 +10 🪙';

  /* 三科全达奖励（每天一次） */
  if (enDone && mathDone && cnDone && !s.today.tripleDone) {
    s.today.tripleDone = true;
    Store.addCoins(10);
    Store.save();
    Sound.coin();
    toast('🎉 三科全达！额外 +10 🪙');
  }

  /* 学科星系宫格 */
  renderSubjects();

  /* 今日英语小短文（拔高加餐） */
  const enSlot = $('#enread-slot');
  if (enSlot && typeof ENGLISH_READINGS !== 'undefined') {
    const reads = (s.enRead && s.enRead.reads) || [];
    const nextP = ENGLISH_READINGS.find(r => !reads.includes(r.id))
      || ENGLISH_READINGS[reads.length % ENGLISH_READINGS.length];
    const enDoneToday = !!s.today.enReadDone;
    enSlot.innerHTML = '';
    enSlot.appendChild(h('div', { class: 'card math-card' },
      h('div', { class: 'math-head' },
        h('span', { class: 'math-emoji' }, '📚'),
        h('div', { class: 'math-info' },
          h('div', { style: 'font-weight:800' }, enDoneToday ? '今日短文已读完 ✅' : '今日英语小短文'),
          h('div', { class: 'tiny' }, `《${nextP.title}》 · ${nextP.level} · 2 判断 + 2 填空`)
        ),
        h('button', { class: 'btn btn-main small', onclick: () => { Sound.tap(); EnRead.start(); } }, enDoneToday ? '再读一篇' : '去读')
      )
    ));
  }

  /* 英语句子默写（看中文，逐词拼英文句子） */
  const swSlot = $('#sentence-slot');
  if (swSlot && typeof SENTENCE_BANK !== 'undefined') {
    const swDone = ((s.sentence && s.sentence.done) || []).length;
    swSlot.innerHTML = '';
    swSlot.appendChild(h('div', { class: 'card math-card' },
      h('div', { class: 'math-head' },
        h('span', { class: 'math-emoji' }, '⌨️'),
        h('div', { class: 'math-info' },
          h('div', { style: 'font-weight:800' }, '英语句子默写'),
          h('div', { class: 'tiny' }, `看中文拼英文 · 已默写 ${swDone}/${SENTENCE_BANK.length} 句 · 拼错不能跳过`)
        ),
        h('button', { class: 'btn btn-main small', onclick: () => { Sound.tap(); SentWrite.start(); } }, '去默写')
      )
    ));
  }

  /* 每日一星：初中知识浸润卡（纯阅读不考试，看完 +1 🪙，重在潜移默化） */
  const jrSlot = $('#junior-slot');
  if (jrSlot && typeof JUNIOR_CARDS !== 'undefined') {
    jrSlot.innerHTML = '';
    const card = Store.nextJuniorCard();
    if (card) {
      const isSeen = !!(s.junior.seen && s.junior.seen[card.id]);
      const seenN = Object.keys(s.junior.seen || {}).length;
      if (isSeen) {
        jrSlot.appendChild(h('div', { class: 'card junior-card' },
          h('div', { class: 'math-head' },
            h('span', { class: 'math-emoji' }, '🌟'),
            h('div', { class: 'math-info' },
              h('div', { style: 'font-weight:800' }, `今日一星已收下 ${card.emoji}`),
              h('div', { class: 'tiny' }, `${card.subject} · ${card.title}`)
            ),
            h('button', { class: 'btn small', onclick: () => { Sound.tap(); juniorQuiz(card, false); } }, '🔁'),
            h('button', { class: 'btn small', onclick: () => { Sound.tap(); Sound.speak(card.title + '。' + card.body + card.example + card.fun, 0.95); } }, '🔊')
          )
        ));
      } else {
        jrSlot.appendChild(h('div', { class: 'card junior-card' },
          h('div', { style: 'text-align:left' },
            h('span', { class: 'junior-badge' }, `${card.emoji} ${card.subject} · 初中星知识`),
            h('div', { class: 'junior-title' }, card.title),
            h('div', { class: 'junior-body' }, card.body),
            h('div', { class: 'junior-row' }, h('b', { class: 'jr-k' }, '🧭'), h('span', {}, card.example)),
            h('div', { class: 'junior-row' }, h('b', { class: 'jr-k' }, '🎩'), h('span', {}, card.fun))
          ),
          h('button', {
            class: 'btn btn-main big', style: 'margin-top:12px',
            onclick: () => { Sound.tap(); juniorQuiz(card, true); }
          }, '看懂了，考考我 →'),
          h('div', { class: 'tiny center', style: 'margin-top:6px' }, `答 2 道小题加深理解 · 全对 +2 🪙 · 已收 ${seenN}/${JUNIOR_CARDS.length} 张`)
        ));
      }
    }
  }

  /* 成长足迹卡 */
  const growSlot = $('#growth-slot');
  if (growSlot) renderGrowthCard(growSlot);

  /* 待兑现提醒横幅：插在学科星系上方，孩子回首页一眼就能看到 */
  const oldBanner = $('#pending-redeem-banner');
  if (oldBanner) oldBanner.remove();
  if (s.shop.pending.length) {
    const subjSlot = $('#subjects-slot');
    const banner = h('button', { class: 'card pending-banner', id: 'pending-redeem-banner', onclick: () => { Sound.tap(); openShop(); } },
      h('span', { class: 'pb-emoji' }, '🎁'),
      h('span', { class: 'pb-text' },
        h('b', {}, `有 ${s.shop.pending.length} 份礼物待领取！`),
        h('span', { class: 'tiny' }, `${s.shop.pending.map(p => `${p.emoji}${p.name}`).join('、')} · 快去找爸爸妈妈兑现吧`)
      )
    );
    subjSlot.parentNode.insertBefore(banner, subjSlot);
  }

  /* 兑换商店卡（家长定义了奖励才显示） */
  const shopSlot = $('#shop-slot');
  if (shopSlot) {
    const shop = Store.state.shop;
    shopSlot.innerHTML = '';
    if (shop.rewards.length) {
      shopSlot.appendChild(h('div', { class: 'card math-card' },
        h('div', { class: 'math-head' },
          h('span', { class: 'math-emoji' }, '🎁'),
          h('div', { class: 'math-info' },
            h('div', { style: 'font-weight:800' }, '兑换商店'),
            h('div', { class: 'tiny' }, `${shop.rewards.length} 个奖励${shop.pending.length ? ` · ${shop.pending.length} 个待爸妈兑现` : ' · 攒金币来换'}`)
          ),
          h('button', { class: 'btn btn-main small', onclick: () => { Sound.tap(); openShop(); } }, '去逛逛')
        )
      ));
    }
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
          h('div', { style: 'font-size:24px;font-weight:900;color:var(--gold)' }, p.name),
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
            h('div', { style: 'font-size:22px;font-weight:900;color:var(--gold)' }, a.name),
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
        h('span', { class: 'tiny' }, boss.done ? `最佳成绩 ${boss.best}/${boss.total || 10} · 友谊赛再战（+3 🪙）` : `10 道纯拼写高阶题 · 失误 ≤1 击败 +${COIN_BOSS} 🪙 / ≤3 击伤 +10（仅周日）`)
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

/* ---------- 学科星系宫格与学科入口 ---------- */
function subjectTile(emoji, name, sub, go) {
  return h('button', { class: 'subject-tile', onclick: () => { Sound.tap(); go(); } },
    h('div', { class: 'st-emoji' }, emoji),
    h('div', { class: 'st-name' }, name),
    h('div', { class: 'st-sub' }, sub)
  );
}

function renderSubjects() {
  const slot = $('#subjects-slot');
  if (!slot) return;
  const s = Store.state;
  const m = s.math;
  const tiles = [
    subjectTile('🪐', '数学星系', `${s.today.mathDone ? '✅ ' : ''}口算 · 练习场 · ${m.best || 0} 题/轮`, openMathHub),
    subjectTile('📖', '语文星系', `${(s.today.cnRounds || 0) ? '✅ ' : ''}诗词 ⭐${Object.keys(s.chinese.stars).length}/${CN_POEMS.length} · 阅读 · 词语`, openCnHub),
    subjectTile('🔤', '拼读星系', `${(Store.state.phonics && Store.state.phonics.rounds) ? '✅ ' : ''}词族 · 自然拼读`, () => Phonics.start())
  ];
  /* 次科模块加载后自动出现在宫格里 */
  if (typeof SubjectUI !== 'undefined') SubjectUI.tiles().forEach(t => tiles.push(t));
  slot.innerHTML = '';
  slot.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '🌌 学科星系'),
    h('div', { class: 'subject-grid' }, tiles)
  ));
}

function openMathHub() {
  const m = Store.state.math;
  const planets = '🪐'.repeat(Math.min(10, m.planets || 0));
  showModal({
    title: '🪐 数学星系',
    build(el, close) {
      el.appendChild(h('div', { class: 'tiny center', style: 'margin-bottom:12px' },
        `${planets || '尚未点亮行星'} · 最佳 ${m.best || 0} 题/轮 · 答对 ≥10 题的冲刺累计点亮行星`));
      el.appendChild(h('button', {
        class: 'btn btn-main big', style: 'margin-top:0',
        onclick: () => { close(); MathSprint.start(); }
      }, '🪐 限时口算冲刺'));
      el.appendChild(h('button', {
        class: 'btn big', style: 'margin-top:10px',
        onclick: () => { close(); MathThink.start(); }
      }, '🧠 思维挑战场（拔高）'));
      el.appendChild(h('button', {
        class: 'btn big', style: 'margin-top:10px',
        onclick: () => { close(); MathDrill.start(); }
      }, '📐 练习场（笔算 + 应用题）'));
      el.appendChild(h('button', {
        class: 'btn big', style: 'margin-top:10px',
        onclick: () => { close(); Sudoku.start(); }
      }, '🔢 数独挑战（四宫 +20 / 六宫 +30 / 九宫 40~100 🪙）'));
      el.appendChild(h('div', { class: 'tiny center', style: 'margin-top:10px' },
        `思维场答对每题 +5 🪙 · 数独唯一解程序生成 · 首刷全额，当天重刷递减${Store.state.settings.dailyCoinCap ? ` · 每日上限 ${Store.state.settings.dailyCoinCap} 🪙` : ''}`));
    }
  });
}

function openCnHub() {
  const c = Store.state.chinese;
  const guwenN = (c.guwen || []).length;
  showModal({
    title: '📖 语文星系',
    build(el, close) {
      el.appendChild(h('div', { class: 'tiny center', style: 'margin-bottom:12px' },
        `诗词 ⭐${Object.keys(c.stars).length}/${CN_POEMS.length} · 阅读 ${c.reads.length}/${CN_READINGS.length} 篇 · 小古文 ${guwenN}/${CN_GUWEN.length} 篇${c.wrong.length ? ` · 错题 ${c.wrong.length}` : ''}`));
      el.appendChild(h('button', {
        class: 'btn btn-main big', style: 'margin-top:0',
        onclick: () => { close(); Chinese.poemList(); }
      }, '📜 诗词星图'));
      el.appendChild(h('button', {
        class: 'btn big', style: 'margin-top:10px',
        onclick: () => { close(); Chinese.readList(); }
      }, '📖 阅读训练营'));
      el.appendChild(h('button', {
        class: 'btn big', style: 'margin-top:10px',
        onclick: () => { close(); Chinese.guwenList(); }
      }, '🧧 小古文启蒙（拔高）'));
      el.appendChild(h('button', {
        class: 'btn big', style: 'margin-top:10px',
        onclick: () => { close(); Chinese.words(); }
      }, '🈶 词语实战'));
    }
  });
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
  const wBtn = $('#btn-wardrobe'), bBtn = $('#btn-box');
  if (wBtn) wBtn.addEventListener('click', () => { Sound.tap(); Extras.openWardrobe(); });
  if (bBtn) bBtn.addEventListener('click', () => { Sound.tap(); Extras.openBox(); });
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
      el.appendChild(ipaEl(w));
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

/* 每日一星 · 知识星小测验：读完卡片答 2 道选择题加深理解（答案都在卡片里）。
 * claim=true 时答完收下当天的知识星（全对多奖 1 🪙）；false 为温习模式不奖励。 */
function juniorQuiz(card, claim = true) {
  const quiz = (typeof JUNIOR_QUIZ !== 'undefined' && JUNIOR_QUIZ[card.id]) || [];
  if (!quiz.length) { /* 兜底：没有配题的卡保持旧行为，直接领 */
    if (claim) {
      const res = Store.markJuniorSeen(card.id);
      if (res.ok) { Sound.coin(); toast('🌟 知识星已收进口袋 +1 🪙'); }
      renderHome();
    }
    return;
  }
  let qi = 0, okN = 0;
  const finish = close => {
    close();
    if (!claim) { Sound.correct(); toast('温习完成，理解更牢啦！'); renderHome(); return; }
    const res = Store.markJuniorSeen(card.id);
    if (res.ok) {
      Sound.coin();
      const allOk = okN === quiz.length;
      if (allOk) Store.addCoins(1);
      toast(allOk ? `🌟 知识星收进口袋 +2 🪙 · 小测验全对！` : '🌟 知识星收进口袋 +1 🪙');
    } else {
      toast('今天已经领过知识星啦');
    }
    renderHome();
  };
  const askQ = (box, close) => {
    if (qi >= quiz.length) {
      box.innerHTML = '';
      box.appendChild(h('div', { class: 'center' },
        h('div', { style: 'font-size:44px' }, okN === quiz.length ? '💯' : '🌟'),
        h('div', { style: 'font-weight:900;font-size:18px;margin:8px 0' }, `小测验 ${okN}/${quiz.length}`),
        h('div', { class: 'tiny', style: 'margin-bottom:12px;line-height:1.8' },
          okN === quiz.length ? '全对！这个知识点真的装进脑袋啦' : '答错的再看一眼卡片，理解会更牢'),
        h('button', { class: 'btn btn-main big', onclick: () => { Sound.tap(); finish(close); } }, claim ? '收下知识星 →' : '完成')
      ));
      return;
    }
    const q = quiz[qi];
    const opts = shuffle(q.opts.map((t, i) => ({ t, ok: i === 0 })));
    let answered = false;
    box.innerHTML = '';
    const tipEl = h('div', { class: 'tiny', style: 'margin-top:10px;min-height:18px;line-height:1.8;text-align:left' }, '');
    const nextBtn = h('button', {
      class: 'btn btn-main big', style: 'display:none;margin-top:12px',
      onclick: () => { Sound.tap(); qi++; askQ(box, close); }
    }, qi + 1 >= quiz.length ? '看结果 →' : '下一题 →');
    const optsEl = h('div', { class: 'cn-opts', style: 'margin-top:12px' });
    opts.forEach(m => optsEl.appendChild(h('button', {
      class: 'cn-opt', 'data-ok': m.ok ? '1' : '0',
      onclick: e => {
        if (answered) return;
        answered = true;
        if (m.ok) {
          okN++;
          Sound.correct();
          e.currentTarget.classList.add('right');
          const c = centerOf(e.currentTarget);
          burst(c.x, c.y, { count: 6, colors: ['#58e08a'], power: 40 });
        } else {
          Sound.wrong();
          e.currentTarget.classList.add('wrong');
          const right = Array.from(optsEl.children).find(x => x.dataset.ok === '1');
          if (right) right.classList.add('right');
        }
        Array.from(optsEl.children).forEach(b => { b.disabled = true; });
        tipEl.textContent = m.ok ? '✅ ' + q.tip : '❌ ' + q.tip;
        nextBtn.style.display = '';
      }
    }, m.t)));
    box.appendChild(h('div', { style: 'text-align:left' },
      h('div', { class: 'tiny' }, `${card.emoji} ${card.subject}小测验 · 第 ${qi + 1} / ${quiz.length} 题 · 答案就藏在刚才的卡片里`),
      h('div', { style: 'font-weight:800;font-size:15.5px;line-height:1.8;margin-top:8px' }, q.q),
      optsEl,
      tipEl,
      nextBtn
    ));
  };
  showModal({
    title: `🌟 知识星小测验 · ${card.title}`,
    dismissable: true,
    build: (el, close) => askQ(el, close)
  });
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
    ? h('div', { class: 'acc-hint' },
      `🌟 孩子正确率高达 ${acc}%，学有余力！建议：① 把下方「数学星系」的口算难度切到「挑战」；② 把「每天挑战词数」调到 2~3，混入五六年级词；③ 首页的「英语小短文」每天读一篇；④ 周日 BOSS 挑战。`)
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
    numInput('每天挑战词数（五六年级拔高）', 'challengePerDay', set.challengePerDay === undefined ? 1 : set.challengePerDay, 0, 3),
    h('div', { class: 'tiny', style: 'margin:2px 0 10px' }, '无视词汇范围，每天从「挑战星系」限量混入高年级词，答对金币更多（+5）；学习卡上标注「挑战 · N年级词」'),
    numInput('每天新词数', 'dailyNew', set.dailyNew, 1, 10),
    numInput('每天复习量', 'dailyReview', set.dailyReview, 3, 30),
    numInput('单次时长提醒（分钟）', 'sessionLimitMin', set.sessionLimitMin, 5, 60),
    numInput('每日金币上限', 'dailyCoinCap', set.dailyCoinCap === undefined ? 150 : set.dailyCoinCap, 60, 500),
    h('div', { class: 'tiny', style: 'margin:2px 0 10px' }, '每天最多能赚的金币数（段位晋升和周日 BOSS 不受限）；可重复的活动当天首刷全额、第二次四折、之后只给 1 枚'),
    h('label', { class: 'check-row' },
      h('input', { type: 'checkbox', checked: !set.soundOff ? '' : null, onchange: e => Store.setSetting('soundOff', !e.target.checked) }),
      ' 音效与发音'
    ),
    selectRow('外观主题', 'theme',
      [['auto', '跟随系统（推荐）'], ['light', '日间 · 明亮护眼'], ['dark', '夜间 · 深空']],
      set.theme || 'auto',
      v => { Store.setSetting('theme', v); applyTheme(); }),
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

  /* 兑换商店管理 */
  const shop = s.shop;
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '🎁 兑换商店'),
    h('div', { class: 'tiny', style: 'margin-bottom:8px' }, '定义孩子可以用金币兑换的现实奖励；孩子发起兑换后在这里确认。'),
    h('div', { class: 'row-gap' },
      h('input', { id: 'shop-emoji', class: 'input', style: 'width:52px;flex:none;text-align:center', maxlength: '2', value: '🎁' }),
      h('input', { id: 'shop-name', class: 'input', style: 'flex:1', placeholder: '奖励名称，如：周末冰淇淋' }),
      h('input', { id: 'shop-cost', class: 'input num', type: 'number', min: '1', placeholder: '金币' })
    ),
    h('button', {
      class: 'btn btn-main', style: 'margin-top:8px', onclick: () => {
        const emoji = document.getElementById('shop-emoji').value.trim() || '🎁';
        const name = document.getElementById('shop-name').value.trim();
        const cost = parseInt(document.getElementById('shop-cost').value, 10);
        if (!name || !cost || cost < 1) { toast('填好奖励名称和金币数'); return; }
        Store.addShopReward(emoji, name, cost);
        renderParent();
      }
    }, '添加奖励'),
    h('button', {
      class: 'btn', style: 'margin-top:8px', onclick: () => {
        let n = 0;
        PRIVILEGE_PACK.forEach(p => {
          if (!shop.rewards.some(r => r.name === p.name)) {
            Store.addShopReward(p.emoji, p.name, p.cost);
            n++;
          }
        });
        toast(n ? `已添加 ${n} 张特权券，价格可在下方自行调整` : '特权券都已经添加过啦');
        if (n) renderParent();
      }
    }, '🎫 一键添加特权券包'),
    h('div', { class: 'tiny', style: 'margin-top:6px' }, '特权券 = 孩子用金币换家庭特权（选晚餐、晚睡 15 分钟、决定周末活动…），比实物礼物更好用；兑换后同样在这里确认'),
    shop.rewards.length ? shop.rewards.map(r => h('div', { class: 'pack-row' },
      h('span', { class: 'pack-info' }, `${r.emoji} ${r.name}`, h('span', { class: 'tiny' }, `　${r.cost} 🪙`)),
      h('button', { class: 'btn small danger', onclick: () => { Store.removeShopReward(r.id); renderParent(); } }, '删除')
    )) : h('div', { class: 'tiny', style: 'margin-top:6px' }, '还没有奖励，先添加一个吧'),
    shop.pending.length ? h('div', { style: 'margin-top:12px' },
      h('div', { class: 'sec-title', style: 'font-size:15px' }, '⏳ 待兑现'),
      shop.pending.map(p2 => h('div', { class: 'pack-row' },
        h('span', { class: 'pack-info' }, `${p2.emoji} ${p2.name}`, h('span', { class: 'tiny' }, `　${p2.cost} 🪙 · ${p2.at}`)),
        h('span', { class: 'row-gap', style: 'margin-top:0' },
          h('button', { class: 'btn small btn-on', onclick: () => { Store.approveRedeem(p2.id); Sound.gold(); renderParent(); } }, '已兑现 ✓'),
          h('button', { class: 'btn small danger', onclick: () => { Store.rejectRedeem(p2.id); renderParent(); toast('已拒绝并退还金币'); } }, '退还')
        )
      ))
    ) : '',
    shop.history.length ? h('div', { class: 'tiny', style: 'margin-top:8px' }, '最近兑现：' + shop.history.slice(0, 5).map(x => `${x.emoji}${x.name}`).join('、')) : ''
  ));

  /* 成长曲线 */
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '📈 成长曲线'),
    curveBlock('词汇量增长（近 14 天）', vocabCurve(14)),
    curveBlock('口算冲刺成绩（每次答对题数）', (s.math.runs || []).slice(-14).map(r => r.correct), '#58e08a')
  ));

  /* 数学星系设置 */
  const m = s.math;
  const mathRuns = (m.runs || []).slice(-7);
  root.appendChild(h('div', { class: 'card' },
    h('div', { class: 'sec-title' }, '🪐 数学星系'),
    selectRow('口算难度', 'mlevel',
      [['1', '基础'], ['2', '四上核心（推荐）'], ['3', '挑战（两步混合）']],
      String(m.level || 2), v => Store.setMath('level', parseInt(v, 10))),
    selectRow('冲刺时长', 'mseconds',
      [['30', '30 秒'], ['60', '60 秒（推荐）'], ['90', '90 秒']],
      String(m.seconds || 60), v => Store.setMath('seconds', parseInt(v, 10))),
    mathRuns.length ? h('div', { class: 'stat-bars' },
      mathRuns.map(r => h('div', { class: 'stat-bar' },
        h('i', { style: 'height:' + Math.min(30, r.correct) * 3 + 'px' }),
        h('span', {}, r.at.slice(5) + ' ' + r.correct + '题')
      ))
    ) : h('div', { class: 'tiny' }, '还没有冲刺记录'),
    h('div', { class: 'tiny' }, `错题池 ${m.wrong.length} 题，下次冲刺优先重练；口算答错同样计入当日失误`)
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


/* ============================================================
 * 兑换商店（孩子端）与今日结算单
 * ============================================================ */
function openShop() {
  const shop = Store.state.shop;
  showModal({
    title: '🎁 兑换商店',
    build(el, close) {
      el.appendChild(h('div', { class: 'tiny', style: 'margin-bottom:8px' }, `当前金币：${Store.state.coins} 🪙 · 兑换后找爸妈领取`));
      shop.rewards.forEach(r => {
        const pending = shop.pending.some(p => p.rewardId === r.id);
        const afford = Store.state.coins >= r.cost;
        el.appendChild(h('div', { class: 'pack-row' },
          h('span', { class: 'pack-info' }, `${r.emoji} ${r.name}`, h('span', { class: 'tiny' }, `　${r.cost} 🪙`)),
          h('button', {
            class: 'btn small ' + (afford && !pending ? 'btn-main' : ''),
            disabled: pending || !afford ? '' : null,
          onclick: e => {
            const res = Store.redeemReward(r.id);
            if (res.ok) {
              Sound.gold();
              const c = centerOf(e.currentTarget);
              burst(c.x, c.y, { count: 14, emojis: ['🎁', '⭐'], power: 90 });
              /* 兑换成功用大弹窗明示，回首页时同步待兑现提醒 */
              showModal({
                title: '🎉 兑换成功！',
                dismissable: true,
                build(el) {
                  el.appendChild(h('div', { class: 'center' },
                    h('div', { style: 'font-size:64px;margin:8px 0' }, r.emoji),
                    h('div', { style: 'font-size:22px;font-weight:900;color:var(--gold)' }, r.name),
                    h('div', { class: 'tiny', style: 'margin-top:8px' }, `花了 ${r.cost} 🪙 · 礼券已收进"待爸妈兑现"`),
                    h('div', { class: 'tiny', style: 'margin-top:4px' }, '快去找爸爸妈妈领取吧！')
                  ));
                },
                actions: [{ label: '好嘞！', cls: 'btn-main', onClick: () => { close(); renderHome(); } }]
              });
            } else toast(res.msg);
          }
          }, pending ? '待兑现' : '兑换')
        ));
      });
      if (shop.pending.length) {
        el.appendChild(h('div', { class: 'tiny', style: 'margin-top:10px' }, `待爸妈兑现：${shop.pending.map(p => `${p.emoji}${p.name}`).join('、')}`));
      }
    },
    actions: [{ label: '先逛到这', cls: 'btn-main' }]
  });
}

function openSettlement() {
  const s = Store.state.today;
  const c = Store.state;
  const now = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
  const spoken = Object.values(c.spoken).filter(d => d === Store.todayStr()).length;
  const lastRun = (c.math.runs || []).filter(r => r.at === Store.todayStr()).pop();
  const due = Store.tomorrowDueCount();
  showModal({
    title: '🧾 今日结算单',
    build(el) {
      el.appendChild(h('div', { class: 'receipt' },
        h('div', { class: 'receipt-date' }, `${now.getMonth() + 1}月${now.getDate()}日 星期${week}`),
        h('div', { class: 'receipt-row' }, h('b', {}, '🚀 英语'), h('span', {}, `新词 ${s.newDone}/${Store.state.settings.dailyNew} · 复习 ${s.revDone}/${Store.state.settings.dailyReview}${spoken ? ` · 跟读 ${spoken} 词` : ''}`)),
        h('div', { class: 'receipt-row' }, h('b', {}, '🪐 数学'), h('span', {}, s.mathDone ? `冲刺完成${lastRun ? ` · 最近答对 ${lastRun.correct} 题` : ''}` : '今天还没冲刺')),
        h('div', { class: 'receipt-row' }, h('b', {}, '📖 语文'), h('span', {}, (s.cnRounds || 0) ? `完成 ${s.cnRounds} 轮练习` : '今天还没开始')),
        h('div', { class: 'receipt-row' }, h('b', {}, '📚 短文'), h('span', {}, s.enReadDone ? '今日英语短文已读完 ✅' : '今天的小短文还在等你')),
        h('div', { class: 'receipt-div' }),
        h('div', { class: 'receipt-row' }, h('b', {}, '💰 今日收入'), h('span', {}, `+${s.coinsEarned || 0} 🪙${c.settings.dailyCoinCap && s.capHit ? `（已达上限 ${c.settings.dailyCoinCap}）` : ''}`)),
        h('div', { class: 'receipt-row' }, h('b', {}, '⏱ 今日用时'), h('span', {}, `${s.minutes} 分钟`)),
        h('div', { class: 'receipt-row' }, h('b', {}, '🔥 连续航行'), h('span', {}, `${c.streak.count} 天`)),
        h('div', { class: 'receipt-row' }, h('b', {}, '📅 明天待复习'), h('span', {}, `${due} 个词`)),
        h('div', { class: 'receipt-div' }),
        h('div', { class: 'receipt-foot' }, `“${rnd(PET_LINES.praise)}” —— ${c.pet.name}`)
      ));
    },
    actions: [{ label: '今天辛苦啦！', cls: 'btn-main' }]
  });
}

/* ---------- 成长曲线 ---------- */
function curveBlock(label, values, color = '#4fd1ff') {
  const clean = values.filter(v => v !== null && v !== undefined);
  if (clean.length < 2) return h('div', { class: 'tiny', style: 'margin:4px 0 10px' }, label + '：数据积累中…');
  const w = 300, hgt = 76, pad = 6;
  const max = Math.max(...clean, 1);
  const pts = clean.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (clean.length - 1);
    const y = hgt - pad - (v / max) * (hgt - pad * 2);
    return [x, y];
  });
  const poly = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  return h('div', { style: 'margin:4px 0 14px' },
    h('div', { class: 'tiny', style: 'margin-bottom:4px' }, `${label}（最新 ${clean[clean.length - 1]}）`),
    h('svg', { viewBox: `0 0 ${w} ${hgt}`, style: 'width:100%;height:76px' },
      h('polyline', { points: poly, fill: 'none', stroke: color, 'stroke-width': '2.5', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
      pts.map(p => h('circle', { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 3, fill: '#ffd166' }))
    )
  );
}

function vocabCurve(days = 14) {
  const s = Store.state;
  const total = Object.keys(s.srs).filter(id => Store.findWord(id)).length;
  const arr = [];
  for (let i = days - 1; i >= 0; i--) {
    const ds = Store.addDays(Store.todayStr(), -i);
    arr.push({ news: (s.history[ds] && s.history[ds].news) || 0 });
  }
  let back = 0;
  for (let i = arr.length - 1; i >= 0; i--) { arr[i].cum = total - back; back += arr[i].news; }
  return arr.map(x => Math.max(0, x.cum));
}


/* ============================================================
 * 🏅 成长足迹：把数据翻译成孩子的语言
 * 头条播报（夸努力与进步）+ 本周航行格 + 下一个够得着的目标
 * ============================================================ */
function mondayOf(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function dsOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function weekWordDelta() {
  const s = Store.state;
  const now = new Date();
  const thisMon = dsOf(mondayOf(now));
  const lastMon = dsOf(new Date(mondayOf(now).getTime() - 7 * 86400000));
  let thisW = 0, lastW = 0;
  Object.values(s.srs).forEach(rec => {
    if (!rec.learnedAt) return;
    if (rec.learnedAt >= thisMon) thisW++;
    else if (rec.learnedAt >= lastMon) lastW++;
  });
  return { thisW, lastW };
}

function growthHeadline() {
  const s = Store.state;
  const runs = s.math.runs || [];
  if (runs.length >= 2 && runs[runs.length - 1].correct > runs[runs.length - 2].correct) {
    return `📣 口算新纪录！最近一次答对 ${runs[runs.length - 1].correct} 题`;
  }
  const { thisW, lastW } = weekWordDelta();
  if (thisW > 0 && thisW > lastW) return `📣 你这周学会了 ${thisW} 个新词，比上周多了 ${thisW - lastW} 个！`;
  if (thisW > 0) return `📣 你这周已经学会了 ${thisW} 个新词！`;
  if (s.streak.count >= 2) return `📣 已经连续航行 ${s.streak.count} 天，坚持就是超能力！`;
  return `📣 今天也出发吧，去点亮第一颗星！`;
}

function nextGoal() {
  const s = Store.state;
  const cands = [];
  const g = s.math.goodRuns || 0;
  const need = g % 2 === 0 ? 1 : 2;
  cands.push({
    name: `再完成 ${need} 次达标冲刺（答对 ≥10 题），点亮新行星！`,
    prog: (g % 2) / 2
  });
  const stars = Object.keys(s.chinese.stars).length;
  if (stars < CN_POEMS.length) cands.push({ name: `诗词星图再点亮 ${CN_POEMS.length - stars} 首就集齐啦！`, prog: stars / CN_POEMS.length });
  const reads = s.chinese.reads.length;
  if (reads < CN_READINGS.length) cands.push({ name: `阅读训练营还剩 ${CN_READINGS.length - reads} 篇等你探索！`, prog: reads / CN_READINGS.length });
  const learned = Object.keys(s.srs).filter(id => Store.findWord(id)).length;
  const nextWords = [10, 50, 100].find(t => learned < t);
  if (nextWords) cands.push({ name: `再学会 ${nextWords - learned} 个词，赢得新徽章！`, prog: learned / nextWords });
  cands.push({
    name: '完成今日冒险，盖章领金币！',
    prog: Math.min(1, (s.today.newDone + s.today.revDone) / Math.max(1, s.settings.dailyNew + s.settings.dailyReview))
  });
  return cands.sort((a, b) => b.prog - a.prog)[0];
}

function renderGrowthCard(slot) {
  const s = Store.state;
  const mon = mondayOf(new Date());
  const todayIdx = (new Date().getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < 7; i++) {
    const ds = dsOf(new Date(mon.getTime() + i * 86400000));
    const done = s.history[ds] && s.history[ds].done;
    cells.push(h('div', { class: 'wk-cell' + (done ? ' on' : '') + (i > todayIdx ? ' future' : '') },
      done ? '●' : (i > todayIdx ? '' : '○')));
  }
  const learned = Object.keys(s.srs).filter(id => Store.findWord(id)).length;
  const weakN = Store.weakList(99).length;
  const goal = nextGoal();
  slot.innerHTML = '';
  slot.appendChild(h('div', { class: 'card growth-card', onclick: () => { Sound.tap(); openFootprint(); } },
    h('div', { class: 'growth-head' },
      h('span', { style: 'font-weight:800' }, '🏅 成长足迹'),
      h('span', { class: 'tiny', style: 'cursor:pointer' }, '详情 ›')
    ),
    h('div', { class: 'growth-headline' }, growthHeadline()),
    h('div', { class: 'wk-row' },
      h('span', { class: 'tiny' }, '本周航行'),
      h('div', { class: 'wk-cells' }, cells)
    ),
    h('div', { class: 'growth-stats' },
      h('span', {}, `📈 词汇量 ${learned}`),
      weakN ? h('span', {}, `⚡ 待消灭 ${weakN}`) : h('span', { style: 'color:var(--green)' }, '✅ 错词清零'),
    ),
    h('div', { class: 'growth-goal' },
      h('div', { class: 'tiny' }, `🎯 ${goal.name}`),
      h('div', { class: 'bar slim', style: 'margin-top:4px' }, h('i', { style: 'width:' + Math.round(goal.prog * 100) + '%' }))
    )
  ));
}

function openFootprint() {
  const s = Store.state;
  const weeks = [];
  const thisMon = mondayOf(new Date());
  for (let w = 3; w >= 0; w--) {
    const mon = new Date(thisMon.getTime() - w * 7 * 86400000);
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const ds = dsOf(new Date(mon.getTime() + i * 86400000));
      const done = s.history[ds] && s.history[ds].done;
      cells.push(h('div', { class: 'wk-cell' + (done ? ' on' : '') + (w === 0 && i > (new Date().getDay() + 6) % 7 ? ' future' : '') },
        done ? '●' : '·'));
    }
    weeks.push(h('div', { class: 'wk-row' },
      h('span', { class: 'tiny' }, w === 0 ? '本周' : `${mon.getMonth() + 1}/${mon.getDate()} 起`),
      h('div', { class: 'wk-cells' }, cells)
    ));
  }
  const c = Store.state.chinese;
  showModal({
    title: '🏅 我的成长足迹',
    build(el) {
      el.appendChild(h('div', { class: 'card', style: 'padding:12px;margin-bottom:10px' }, weeks));
      el.appendChild(h('div', { class: 'stat-grid' },
        statBox('词汇量', Object.keys(s.srs).filter(id => Store.findWord(id)).length + ' 个'),
        statBox('诗词星图', `${Object.keys(c.stars).length}/${CN_POEMS.length}`),
        statBox('阅读探索', `${c.reads.length}/${CN_READINGS.length}`),
        statBox('口算最佳', (s.math.best || 0) + ' 题/轮'),
        statBox('点亮行星', (s.math.planets || 0) + '/10'),
        statBox('最长连航', (s.streak.best || 0) + ' 天')
      ));
      el.appendChild(h('div', { class: 'tiny', style: 'margin-top:10px' }, '每完成一次打卡，就多一格航行灯；集齐星图和行星，还会有神秘徽章等你！'));
    },
    actions: [{ label: '继续加油！', cls: 'btn-main' }]
  });
}
