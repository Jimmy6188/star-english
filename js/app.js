/* ============================================================
 * 星际英语站 - 应用入口
 * 初始化 / 屏幕路由 / 星空背景 / 首次欢迎
 * ============================================================ */

function showScreen(name) {
  $$('#main .screen').forEach(el => el.classList.remove('active'));
  $('#screen-' + name).classList.add('active');
  $$('#bottomnav button').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
  if (name === 'home') renderHome();
  else if (name === 'album') renderAlbum();
  else if (name === 'calendar') renderCalendar();
  else if (name === 'parent') renderParent();
  window.scrollTo(0, 0);
}

/* 星空背景（canvas 画一次，性能友好） */
function paintStars() {
  const cv = $('#starfield');
  const ctx = cv.getContext('2d');
  function draw() {
    cv.width = innerWidth;
    cv.height = innerHeight;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const n = Math.floor(cv.width * cv.height / 9000);
    for (let i = 0; i < n; i++) {
      const x = Math.random() * cv.width;
      const y = Math.random() * cv.height;
      const r = Math.random() * 1.4 + 0.3;
      ctx.globalAlpha = 0.25 + Math.random() * 0.65;
      ctx.fillStyle = Math.random() < 0.12 ? '#ffd166' : Math.random() < 0.2 ? '#4fd1ff' : '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  draw();
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 300); });
}

/* 首次欢迎引导 */
function welcome() {
  showModal({
    title: '🚀 欢迎来到星际英语站！',
    dismissable: false,
    build(el) {
      el.appendChild(h('div', { class: 'welcome-lines' },
        h('p', {}, '👋 你好，小宇航员！'),
        h('p', {}, '📖 每天完成今日任务，就能收集奇妙的星际贴纸，'),
        h('p', {}, '🤖 赚金币喂养你的机器伙伴，让它慢慢进化！'),
        h('p', { class: 'tiny' }, '（这个小程序是爸爸/妈妈为你准备的，有问题找他们哦）')
      ));
      const row = h('div', { class: 'row-gap' },
        h('span', {}, '给机器伙伴起名字：'),
        h('input', { id: 'pet-name-input', class: 'input', maxlength: '6', value: '小星' })
      );
      el.appendChild(row);
    },
    actions: [{
      label: '启航！', cls: 'btn-main big', onClick: close => {
        const name = ($('#pet-name-input').value || '小星').trim().slice(0, 6);
        Store.state.pet.name = name || '小星';
        Store.save();
        Store.markGreeted();
        close();
        renderHome();
        toast(`${Store.state.pet.name} 已加入队伍！`);
      }
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
}

function init() {
  Store.load();
  Sound.init();
  paintStars();
  bindNav();
  bindHome();
  updateTop();
  showScreen('home');

  /* 首次触摸解锁音频（浏览器自动播放策略） */
  const unlock = () => { Sound.unlock(); document.removeEventListener('pointerdown', unlock); };
  document.addEventListener('pointerdown', unlock);

  if (Store.isFirstRun()) welcome();

  /* PWA：仅在 http(s) 下注册（file:// 打开时自动跳过） */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
