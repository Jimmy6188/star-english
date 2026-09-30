/* ============================================================
 * 星际求知号 - UI 工具箱
 * DOM 构建 / 弹窗 / 提示 / 粒子爆发 / 飞行动画
 * ============================================================ */

function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
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

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
