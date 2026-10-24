/* ============================================================
 * 星际求知号 - UI 工具箱
 * DOM 构建 / 弹窗 / 提示 / 粒子爆发 / 飞行动画
 * ============================================================ */

const SVG_TAGS = ['svg', 'polyline', 'circle', 'line', 'path', 'rect', 'g', 'text'];
function h(tag, attrs, ...children) {
  const el = SVG_TAGS.includes(tag)
    ? document.createElementNS('http://www.w3.org/2000/svg', tag)
    : document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined) el.setAttribute(k, v);
    }
  }
  for (const c of children.flat(9)) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return el;
}

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ---------- 功能图标（v36 第二档）----------
 * 操作类图标（退出/喇叭/翻页）用统一线条 SVG，颜色跟随文字；
 * 奖励与装饰场景（贴纸、行星、伙伴）仍用 emoji。 */
const ICON_PATHS = {
  x: 'M6 6 L18 18 M18 6 L6 18',
  left: 'M14 6 L8 12 L14 18',
  right: 'M10 6 L16 12 L10 18',
  sound: 'M11 5 6.5 9H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.5L11 19V5z M15.5 9.5a3.6 3.6 0 0 1 0 5 M18.2 7a7.2 7.2 0 0 1 0 10'
};
function icon(name, size = 18) {
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', ICON_PATHS[name] || ICON_PATHS.x);
  return h('svg', {
    viewBox: '0 0 24 24', width: size, height: size, fill: 'none',
    stroke: 'currentColor', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    style: 'flex:none;vertical-align:-3px'
  }, p);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const rnd = arr => arr[Math.floor(Math.random() * arr.length)];

let toastTimer = null;
function toast(msg, ms = 1800) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/* 弹窗: showModal({title, build(contentEl), actions:[{label, cls, onClick(close)}]}) */
function showModal({ title, build, actions = [], dismissable = true }) {
  const root = $('#modal-root');
  root.innerHTML = '';
  const box = h('div', { class: 'modal-box' });
  const close = () => { root.classList.remove('show'); root.innerHTML = ''; };
  if (title) box.appendChild(h('div', { class: 'modal-title' }, title));
  const content = h('div', { class: 'modal-content' });
  if (build) build(content, close);
  box.appendChild(content);
  if (actions.length) {
    const bar = h('div', { class: 'modal-actions' });
    for (const a of actions) {
      bar.appendChild(h('button', {
        class: 'btn ' + (a.cls || ''),
        onclick: () => a.onClick ? a.onClick(close) : close()
      }, a.label));
    }
    box.appendChild(bar);
  }
  const wrap = h('div', { class: 'modal-wrap', onclick: e => { if (dismissable && e.target === wrap) close(); } }, box);
  root.appendChild(wrap);
  root.classList.add('show');
  return close;
}

/* 粒子爆发 (页面坐标) */
function burst(x, y, { count = 14, colors = ['#4fd1ff', '#ffd166', '#ff6bd6', '#58e08a'], emojis = null, power = 90 } = {}) {
  const layer = $('#fx-layer');
  for (let i = 0; i < count; i++) {
    const isEmoji = emojis && Math.random() < 0.5;
    const p = h('span', { class: 'particle' },
      isEmoji ? rnd(emojis) : '');
    if (!isEmoji) {
      p.style.width = p.style.height = (5 + Math.random() * 6) + 'px';
      p.style.background = rnd(colors);
      p.style.borderRadius = Math.random() < 0.5 ? '50%' : '2px';
    } else {
      p.style.fontSize = (14 + Math.random() * 12) + 'px';
    }
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    layer.appendChild(p);
    const ang = Math.random() * Math.PI * 2;
    const dist = power * (0.4 + Math.random() * 0.8);
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 30;
    p.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.3) rotate(${(Math.random() * 300 - 150)}deg)`, opacity: 0 }
    ], { duration: 700 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => p.remove();
  }
}

/* 漂浮文字 */
function floatText(x, y, text, color = '#ffd166') {
  const layer = $('#fx-layer');
  const el = h('span', { class: 'float-text' }, text);
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.color = color;
  layer.appendChild(el);
  el.animate([
    { transform: 'translate(-50%,-50%)', opacity: 0 },
    { transform: 'translate(-50%,-140%)', opacity: 1, offset: 0.25 },
    { transform: 'translate(-50%,-260%)', opacity: 0 }
  ], { duration: 1200, easing: 'ease-out' }).onfinish = () => el.remove();
}

/* 元素飞向目标（如贴纸飞入图鉴） */
function flyTo(fromEl, toSel, text, { dur = 800 } = {}) {
  const to = $(toSel);
  if (!fromEl || !to) return;
  const a = fromEl.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const clone = h('div', { class: 'fly-clone' }, text);
  clone.style.left = (a.left + a.width / 2) + 'px';
  clone.style.top = (a.top + a.height / 2) + 'px';
  $('#fx-layer').appendChild(clone);
  const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
  const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
  clone.animate([
    { transform: 'translate(-50%,-50%) scale(2.2)', opacity: 1 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.5)`, opacity: 0.9, offset: 0.85 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 }
  ], { duration: dur, easing: 'cubic-bezier(.4,.1,.6,1)' }).onfinish = () => {
    clone.remove();
    to.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 300 });
  };
}

/* 学科色顶条（v36 第三档）：进入模块时把学科色挂到题目屏，卡顶色条/印章随之变色 */
function setQuestSub(color) {
  const root = $('#quest-root');
  if (root) root.style.setProperty('--sub', color || 'var(--accent)');
}

/* 空状态小插画：几笔线条画 + 一句话（生词本/记录/商店等空场景） */
const EMPTY_ART = {
  book: '<path d="M12 6c-2-1.6-5-2-8-2v14c3 0 6 .4 8 2 2-1.6 5-2 8-2V4c-3 0-6 .4-8 2z"/><path d="M12 6v14"/><path d="M19 2.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  rocket: '<path d="M13.5 4.5c3 2 4.5 5 4.5 8.5l-3 2h-6l-3-2c0-3.5 1.5-6.5 4.5-8.5L12 3z"/><circle cx="12" cy="10.5" r="2"/><path d="M9.5 17.5 8 21l2.8-.9M14.5 17.5 16 21l-2.8-.9M12 18.5V21"/><path d="M4 6.5l.6 1.5 1.5.6-1.5.6L4 10.7l-.6-1.5L1.9 8.6l1.5-.6z"/>',
  gift: '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M4 14h16M12 10v10"/><path d="M12 10c-1.5-3-6-3-6 0 0 1 .9 1.6 2 1.6M12 10c1.5-3 6-3 6 0 0 1-.9 1.6-2 1.6"/><path d="M19.5 3.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>'
};
function emptyArt(kind, tip) {
  const wrap = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wrap.setAttribute('viewBox', '0 0 24 24');
  wrap.setAttribute('width', 72); wrap.setAttribute('height', 72);
  wrap.setAttribute('fill', 'none');
  wrap.setAttribute('stroke', 'currentColor');
  wrap.setAttribute('stroke-width', '1.6');
  wrap.setAttribute('stroke-linecap', 'round');
  wrap.setAttribute('stroke-linejoin', 'round');
  wrap.setAttribute('style', 'color:var(--accent-text);opacity:.8');
  wrap.innerHTML = EMPTY_ART[kind] || EMPTY_ART.book;
  return h('div', { class: 'empty-art' }, wrap, h('div', { class: 'ea-tip' }, tip));
}

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
