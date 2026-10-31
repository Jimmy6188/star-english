/* ============================================================
 * 星际求知号 - 应用入口
 * 初始化 / 屏幕路由 / 星空背景 / 首次欢迎
 * ============================================================ */

/* 应用版本号：顶栏标题旁显示，供家长一眼确认设备跑的是否最新版。
 * 发版时三处一起改：这里 / sw.js 的 CACHE / index.html 里脚本与 css 的 ?v= 参数 */
const APP_VERSION = 'v39';

function showScreen(name) {
  $$('#main .screen').forEach(el => el.classList.remove('active'));
  $('#screen-' + name).classList.add('active');
  $$('#bottomnav button').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
  if (name !== 'quest') document.dispatchEvent(new CustomEvent('talk-release'));
  if (name === 'home') renderHome();
  else if (name === 'album') renderAlbum();
  else if (name === 'calendar') renderCalendar();
  else if (name === 'parent') renderParent();
  window.scrollTo(0, 0);
}

/* 星空背景（canvas 画一次，性能友好；颜色跟随主题） */
function paintStars() {
  const cv = $('#starfield');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  function draw() {
    const dark = document.documentElement.dataset.theme !== 'light';
    const hween = typeof Store !== 'undefined' && Store.isHalloween && Store.isHalloween();
    cv.width = innerWidth;
    cv.height = innerHeight;
    ctx.clearRect(0, 0, cv.width, cv.height);
    /* 🎃 万圣节夜空：右上角一轮南瓜月（避开顶栏高度，留足右边距），星空里偶尔飘过小蝙蝠/落叶 */
    if (hween) {
      ctx.font = '46px serif';
      ctx.fillText('🎃', Math.max(10, cv.width - 150), 150);
    }
    const n = Math.floor(cv.width * cv.height / 9000);
    for (let i = 0; i < n; i++) {
      const x = Math.random() * cv.width;
      const y = Math.random() * cv.height;
      if (hween && Math.random() < 0.045) {
        ctx.font = '15px serif';
        ctx.globalAlpha = 0.75;
        ctx.fillText(Math.random() < 0.55 ? '🦇' : '🍂', x, y);
        ctx.globalAlpha = 1;
        continue;
      }
      const r = Math.random() * 1.4 + 0.3;
      ctx.globalAlpha = dark ? 0.25 + Math.random() * 0.65 : 0.1 + Math.random() * 0.22;
      ctx.fillStyle = dark
        ? (Math.random() < 0.12 ? '#ffd166' : Math.random() < 0.2 ? (hween ? '#c9b2e8' : '#4fd1ff') : '#ffffff')
        : (Math.random() < 0.12 ? '#d9a520' : Math.random() < 0.2 ? '#4d9fd0' : '#7d97bd');
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  draw();
  /* resize 监听只挂一次（applyTheme 每次切主题都调 paintStars，重复挂会累积监听器） */
  if (!paintStars._bound) {
    paintStars._bound = true;
    let t;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 300); });
  }
}

/* ---------- 主题（跟随系统 / 日间 / 夜间） ---------- */
const THEME_META = { dark: '#0b1026', light: '#eef5ff' };
let themeMedia = null;

function effectiveTheme() {
  const mode = Store.state.settings.theme || 'auto';
  if (mode !== 'auto') return mode;
  if (!themeMedia) themeMedia = window.matchMedia('(prefers-color-scheme: light)');
  return themeMedia.matches ? 'light' : 'dark';
}

function applyTheme() {
  const mode = Store.state.settings.theme || 'auto';
  const eff = effectiveTheme();
  document.documentElement.dataset.theme = eff;
  /* 🎃 万圣节活动期给 <html> 挂 hween 标记，CSS 换紫橙夜空、顶栏挂南瓜 */
  document.documentElement.classList.toggle('hween', !!(Store.isHalloween && Store.isHalloween()));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_META[eff]);
  const btn = $('#btn-theme');
  if (btn) btn.textContent = mode === 'auto' ? '🌓' : (eff === 'light' ? '🌞' : '🌙');
  paintStars();
}

function cycleTheme() {
  const order = ['auto', 'light', 'dark'];
  const cur = Store.state.settings.theme || 'auto';
  const next = order[(order.indexOf(cur) + 1) % order.length];
  Store.setSetting('theme', next);
  applyTheme();
  toast({ auto: '外观：跟随系统', light: '外观：日间模式', dark: '外观：夜间模式' }[next]);
}

function initTheme() {
  applyTheme();
  if (themeMedia && themeMedia.addEventListener) {
    themeMedia.addEventListener('change', () => {
      if ((Store.state.settings.theme || 'auto') === 'auto') applyTheme();
    });
  }
}

/* 首次欢迎引导 */
function welcome() {
  let chosen = 'bot';
  showModal({
    title: '🚀 欢迎来到星际求知号！',
    dismissable: false,
    build(el) {
      el.appendChild(h('div', { class: 'welcome-lines' },
        h('p', {}, '👋 你好，小宇航员！'),
        h('p', {}, '📖 每天完成今日任务，就能收集奇妙的星际贴纸，'),
        h('p', {}, '🤖 赚金币喂养你的伙伴，让它慢慢进化！'),
        h('p', { class: 'tiny' }, '（这个小程序是爸爸/妈妈为你准备的，有问题找他们哦）')
      ));
      const row = h('div', { class: 'row-gap' },
        h('span', {}, '给伙伴起名字：'),
        h('input', { id: 'pet-name-input', class: 'input', maxlength: '6', value: '小星' })
      );
      el.appendChild(row);
      /* v36：挑一个喜欢的伙伴出发（以后还能在「换装」里招募别的） */
      el.appendChild(h('div', { class: 'tiny', style: 'margin-top:10px' }, '再挑一个陪你出发的伙伴：'));
      const picks = h('div', { class: 'row-gap wrap', style: 'justify-content:center' },
        PET_KINDS.map(k => h('button', {
          class: 'btn small' + (k.id === 'bot' ? ' btn-on' : ''),
          'data-kind': k.id,
          onclick: e => {
            Sound.tap();
            chosen = k.id;
            picks.querySelectorAll('[data-kind]').forEach(b => b.classList.toggle('btn-on', b.dataset.kind === chosen));
          }
        }, `${k.emoji} ${k.name}`)));
      el.appendChild(picks);
    },
    actions: [{
      label: '启航！', cls: 'btn-main big', onClick: close => {
        const name = ($('#pet-name-input').value || '小星').trim().slice(0, 6);
        Store.state.pet.name = name || '小星';
        if (!Store.state.pet.kinds.includes(chosen)) Store.state.pet.kinds.push(chosen);
        Store.state.pet.kind = chosen;
        Store.save();
        Store.markGreeted();
        close();
        renderHome();
        toast(`${Store.state.pet.name} 已加入队伍！`);
      }
    }]
  });
}

/* ---------- 版本更新提示 ---------- */
/* 刷新后发现版本号变了（且这个版本写了更新日志）就弹一次给孩子/家长看。
 * 新用户走欢迎引导不弹；徽章弹窗等可能占着弹窗层，稍等它关掉再弹，不叠加。 */
/* 🎃 万圣节欢迎卡（v41）：活动期内首次打开 App 弹一次，领南瓜头套；
 * 已领过（hweenGift）不再弹；和版本更新/徽章弹窗错峰，延后出现 */
function maybeShowHalloween() {
  if (!Store.isHalloween || !Store.isHalloween()) return;
  if (Store.state.hweenGift) return;
  setTimeout(() => {
    if ($('#modal-root').classList.contains('show')) return; /* 被占着就下次启动再弹 */
    showModal({
      title: '🎃 万圣节到啦！',
      build(el) {
        el.appendChild(h('div', { class: 'center', style: 'line-height:2' },
          h('div', { style: 'font-size:56px;margin:4px 0' }, '🎃'),
          h('div', {}, 'Trick or Treat！不给糖就捣蛋～'),
          h('div', { class: 'tiny', style: 'margin-top:8px;line-height:1.9' },
            '万圣节期间（10/25 ~ 11/7）：' + String.fromCharCode(10) +
            '· 神秘星盒变身「南瓜星盒」，装扮掉率翻倍' + String.fromCharCode(10) +
            '· 六件万圣节限定装扮只能从南瓜星盒掉落，过期就绝版啦' + String.fromCharCode(10) +
            '· 完成任务当天首次还能收到伙伴的糖果 🍬'),
          h('div', { class: 'tiny', style: 'margin-top:6px;color:var(--gold)' }, '已获得的装扮永久保留哦')
        ));
      },
      actions: [{
        label: '🎁 领取南瓜头套！', cls: 'btn-main big',
        onClick: close => {
          const r = Store.claimHweenGift();
          close();
          if (r.ok) {
            Sound.gold();
            if (typeof candyRain === 'function') candyRain(20);
            toast('🎃 南瓜头套已收入衣橱，快去给伙伴戴上！');
            renderHome();
          }
        }
      }]
    });
  }, 2600); /* 比版本更新弹窗更晚，不抢层 */
}

function maybeShowUpdateNotes() {
  if (Store.isFirstRun()) return;
  if (Store.seenVersion() === APP_VERSION) return;
  const notes = (typeof RELEASE_NOTES !== 'undefined' && RELEASE_NOTES[APP_VERSION]) || null;
  if (!notes) { Store.markVersionSeen(APP_VERSION); return; }
  let tries = 0;
  const show = () => {
    if ($('#modal-root').classList.contains('show')) {
      if (tries++ < 8) { setTimeout(show, 700); return; }
      return; /* 一直被别的弹窗占着就放弃，下次启动再提示 */
    }
    showUpdateNotes(notes);
  };
  setTimeout(show, 900);
}

/* 更新日志弹窗：启动检测和家长面板的「更新日志」入口都走这里 */
function showUpdateNotes(notes) {
  notes = notes || (typeof RELEASE_NOTES !== 'undefined' && RELEASE_NOTES[APP_VERSION]);
  if (!notes) { toast('这个版本没有更新日志'); return; }
  showModal({
    title: `${notes.emoji || '🎉'} 更新到 ${APP_VERSION} 啦！`,
    build(el) {
      el.appendChild(h('div', { class: 'upd-ver' }, APP_VERSION));
      el.appendChild(h('div', { class: 'upd-sub' }, notes.title || '本次更新内容'));
      const list = h('div', { class: 'upd-list' });
      (notes.items || []).forEach(it => {
        list.appendChild(h('div', { class: 'upd-item' },
          h('span', { class: 'upd-emoji' }, it[0]),
          h('div', {},
            h('div', { class: 'upd-name' }, it[1]),
            h('div', { class: 'upd-desc' }, it[2])
          )
        ));
      });
      el.appendChild(list);
      el.appendChild(h('div', { class: 'tiny center', style: 'margin-top:10px' }, '刷新页面就能用上新版本，离线也能打开'));
    },
    actions: [{
      label: '知道了！', cls: 'btn-main',
      onClick: close => { Store.markVersionSeen(APP_VERSION); close(); }
    }]
  });
}

function bindNav() {
  $$('#bottomnav button').forEach(b => {
    b.addEventListener('click', () => { Sound.tap(); Sound.stopSpeak(); showScreen(b.dataset.nav); });
  });
  $('#btn-sound').addEventListener('click', () => {
    Store.setSetting('soundOff', !Store.state.settings.soundOff);
    updateTop();
    if (!Store.state.settings.soundOff) Sound.tap();
  });
  $('#btn-theme').addEventListener('click', () => { Sound.tap(); cycleTheme(); });
}

function init() {
  Store.load();
  Sound.init();
  initTheme();
  bindNav();
  bindHome();
  const verEl = $('#app-ver');
  if (verEl) verEl.textContent = APP_VERSION;
  $('#top-coins').style.cursor = 'pointer';
  $('#top-coins').title = '查看今日结算单';
  $('#top-coins').addEventListener('click', () => { Sound.tap(); openSettlement(); });
  updateTop();
  showScreen('home');

  /* 首次触摸解锁音频（浏览器自动播放策略） */
  const unlock = () => { Sound.unlock(); document.removeEventListener('pointerdown', unlock); };
  document.addEventListener('pointerdown', unlock);

  /* 版本更新提示（同版本只弹一次）+ 🎃 万圣节欢迎卡（活动期首日领南瓜头套） */
  maybeShowUpdateNotes();
  maybeShowHalloween();
  /* 🎃 活动期每次打开来一小阵糖果雨（只在开屏撒一次，动画自动清理不耗续航） */
  if (Store.isHalloween && Store.isHalloween()) {
    setTimeout(() => { if (typeof candyRain === 'function') candyRain(12); }, 3600);
  }

  if (Store.isFirstRun()) welcome();

  /* v38 护眼计时改全局：页面在前台时每满 1 分钟记一次学习时长（护眼提醒、
   * 家长周报都按它算），任何模块学习都计时；切后台/息屏不计时 */
  setInterval(() => {
    if (document.visibilityState === 'visible') Store.addMinutes(1);
  }, 60 * 1000);

  /* PWA 从后台回到前台（含跨天/挂机一夜）：结算漏学护盾，让孩子看到护盾真的用掉了 */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const used = Store.rollDay();
    if (used > 0) {
      Sound.tap();
      toast(`🛡️ 漏学的 ${used} 天已用护盾自动保护，还剩 ${Store.state.streak.shields} 张`);
    }
  });

  /* PWA：仅在 http(s) 下注册（file:// 打开时自动跳过）。
   * v38b 补丁自动生效机制：注册时 updateViaCache:'none' 让 sw.js 的更新检查永远绕过
   * HTTP/CDN 缓存（GitHub Pages 有 10 分钟 CDN 缓存，Pad 上曾因此刷不出新补丁）；
   * 页面若原本由旧 SW 控制，当新 SW 接管（controllerchange）时自动重载一次——
   * 孩子端只需普通刷新一次就能看到新补丁，无需手动强刷或清数据 */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    const hadController = !!navigator.serviceWorker.controller;
    let swRefreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      /* 首次安装（之前无控制器）不重载，避免首次访问多刷一次 */
      if (hadController && !swRefreshing) { swRefreshing = true; location.reload(); }
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
