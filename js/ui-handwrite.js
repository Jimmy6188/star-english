/* ============================================================
 * 星际求知号 - 手写板组件（v35）
 * canvas + pointer 事件：触屏 / 手写笔 / 鼠标都能写
 * 中文模式打田字格（一格一字），英文模式打四线三格（一格一字母）
 * 「对照」显示范字/范词，孩子自评写没写对（离线不做识别，零误判）
 * ============================================================ */

const Handwrite = {
  /* mount(parent, { mode:'zh'|'en', cells:n, onChange })
   * 返回 { el, clear(), undo(), showGuide(text), isEmpty() } */
  mount(parent, opts = {}) {
    const mode = opts.mode === 'en' ? 'en' : 'zh';
    const cells = Math.max(1, opts.cells || 1);
    const wrap = h('div', { class: 'hw-wrap' });
    const canvas = h('canvas', { class: 'hw-canvas' });
    wrap.appendChild(canvas);
    parent.appendChild(wrap);
    const ctx = canvas.getContext('2d');
    let strokes = [], cur = null, guide = '';
    let W = 320;
    const H = 150;

    const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const resize = () => {
      if (!canvas.isConnected) { window.removeEventListener('resize', resize); return; }
      const dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth || wrap.clientWidth || 320;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    };

    const cellW = () => W / cells;

    const drawGrid = () => {
      const cw = cellW();
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = cssVar('--line-4') || 'rgba(255,255,255,.25)';
      if (mode === 'zh') {
        /* 田字格：外框 + 虚线十字和对角线 */
        for (let i = 0; i < cells; i++) {
          const x = i * cw;
          ctx.strokeRect(x + 1.5, 1.5, cw - 3, H - 3);
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(x + cw / 2, 3); ctx.lineTo(x + cw / 2, H - 3);
          ctx.moveTo(x + 3, H / 2); ctx.lineTo(x + cw - 3, H / 2);
          ctx.moveTo(x + 3, 3); ctx.lineTo(x + cw - 3, H - 3);
          ctx.moveTo(x + cw - 3, 3); ctx.lineTo(x + 3, H - 3);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        /* 四线三格：上/中/下三条实线，词内分格虚线 */
        ctx.beginPath();
        [0.14, 0.5, 0.86].forEach(f => { const y = H * f; ctx.moveTo(0, y); ctx.lineTo(W, y); });
        ctx.stroke();
        ctx.setLineDash([3, 5]);
        for (let i = 1; i < cells; i++) {
          ctx.beginPath(); ctx.moveTo(i * cw, H * 0.1); ctx.lineTo(i * cw, H * 0.9); ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      ctx.restore();
    };

    const drawGuide = () => {
      if (!guide) return;
      const cw = cellW();
      ctx.save();
      ctx.fillStyle = 'rgba(140,140,140,.5)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const chars = guide.split('');
      for (let i = 0; i < chars.length && i < cells; i++) {
        if (mode === 'zh') {
          ctx.font = `600 ${Math.floor(cw * 0.58)}px "KaiTi","STKaiti","SimSun",serif`;
          ctx.fillText(chars[i], i * cw + cw / 2, H / 2);
        } else {
          ctx.font = `600 ${Math.floor(H * 0.42)}px sans-serif`;
          ctx.fillText(chars[i], i * cw + cw / 2, H * 0.62);
        }
      }
      ctx.restore();
    };

    const drawStrokes = () => {
      ctx.save();
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = cssVar('--text-hi') || '#fff';
      ctx.fillStyle = ctx.strokeStyle;
      const all = cur ? strokes.concat([cur]) : strokes;
      all.forEach(pts => {
        if (pts.length < 2) {
          ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, 2, 0, 7); ctx.fill();
          return;
        }
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      });
      ctx.restore();
    };

    const redraw = () => {
      ctx.clearRect(0, 0, W, H);
      drawGrid();
      drawGuide();
      drawStrokes();
    };

    const pos = e => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (_) {} }
      cur = [pos(e)];
      redraw();
    });
    canvas.addEventListener('pointermove', e => {
      if (!cur) return;
      e.preventDefault();
      const p = pos(e);
      const last = cur[cur.length - 1];
      if (Math.abs(p.x - last.x) + Math.abs(p.y - last.y) < 1.2) return;
      cur.push(p);
      redraw();
    });
    const endStroke = () => {
      if (!cur) return;
      if (cur.length === 1) cur.push({ x: cur[0].x + 0.1, y: cur[0].y });
      strokes.push(cur);
      cur = null;
      if (opts.onChange) opts.onChange();
    };
    canvas.addEventListener('pointerup', endStroke);
    canvas.addEventListener('pointercancel', endStroke);

    resize();
    window.addEventListener('resize', resize);

    return {
      el: wrap,
      clear() { strokes = []; redraw(); if (opts.onChange) opts.onChange(); },
      undo() { strokes.pop(); redraw(); if (opts.onChange) opts.onChange(); },
      showGuide(text) { guide = text || ''; redraw(); },
      isEmpty() { return strokes.length === 0; }
    };
  }
};
