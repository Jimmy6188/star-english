/* ============================================================
 * 星际求知号 - 手写板组件（v35）
 * canvas + pointer 事件：触屏 / 手写笔 / 鼠标都能写
 * 中文模式打田字格（一格一字），英文模式打四线三格（一格一字母）
 * 设计要点（v35 重做，家长反馈"格子拉长、范字出格、英文书写错位"）：
 *   1) 格子一律方正：中文田字格必须正方，英文四线三格也按方格排，
 *      格子多了自动换行；画布尺寸由格子推算，不再固定 150px 拉长高度
 *   2) 范字按格子缩放：中文描红占格 72%，英文按字母形态占上/中/下格，
 *      不再溢出格子，"对照"能真正逐格比对
 *   3) 笔画存比例坐标：旋屏、地址栏收放等尺寸变化后整体缩放，不错位
 *   4) 指针按元素实际尺寸换算：挂载时父卡还没插入文档也能量准，
 *      触碰点和笔画严格对齐（修复英文模式书写错位）
 * ============================================================ */

const Handwrite = {
  /* mount(parent, { mode:'zh'|'en', cells:n, onChange })
   * 返回 { el, clear(), undo(), showGuide(text), isEmpty() } */
  mount(parent, opts = {}) {
    const mode = opts.mode === 'en' ? 'en' : 'zh';
    const cells = Math.max(1, opts.cells || 1);
    /* 单格上限：中文字格 168px、英文字母格 76px——手指书写够大又不笨拙 */
    const MAX_CELL = mode === 'zh' ? 168 : 76;
    const PAD = 3; /* 画布内边距：笔画紧贴格子边也不被裁掉 */
    const EN_TALL = 'bdfhkl'; /* 上伸字母：占上两格 */
    const EN_DESC = 'gjpqy';  /* 下伸字母：占下两格 */

    const wrap = h('div', { class: 'hw-wrap' });
    const canvas = h('canvas', { class: 'hw-canvas' });
    wrap.appendChild(canvas);
    parent.appendChild(wrap);
    const ctx = canvas.getContext('2d');

    let strokes = [], cur = null, guide = '';
    let W = 320, H = 150, cell = 100, cols = 1, rows = 1, laidOut = false;

    const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    /* 布局：按手写板容器宽度推算格子大小与行列（格子数固定，只随宽度缩放） */
    const layout = () => {
      const avail = Math.max(60, (wrap.clientWidth || 320) - PAD * 2);
      cols = mode === 'zh'
        ? (cells <= 3 ? cells : (cells === 4 ? 2 : 3))
        : (cells <= 6 ? cells : Math.ceil(cells / 2));
      rows = Math.ceil(cells / cols);
      cell = Math.max(18, Math.min(Math.floor(avail / cols), MAX_CELL));
      W = cell * cols + PAD * 2;
      H = cell * rows + PAD * 2;
    };

    const resize = () => {
      layout();
      const d = window.devicePixelRatio || 1;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      canvas.width = Math.round(W * d);
      canvas.height = Math.round(H * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      redraw();
      laidOut = true;
    };
    /* 挂载瞬间父卡片往往还没插入文档（量不到宽度）：ResizeObserver 会在
     * 真正布局好后补一次；连拍两帧兜底旧浏览器（调用放在 redraw 定义之后） */

    /* 第 i 格的矩形（0 起） */
    const cellRect = i => ({
      x: PAD + (i % cols) * cell,
      y: PAD + Math.floor(i / cols) * cell,
      w: cell, h: cell
    });

    const drawGrid = () => {
      ctx.save();
      ctx.lineWidth = 1;
      if (mode === 'zh') {
        /* 田字格：每格外框 + 虚线十字和对角线 */
        for (let i = 0; i < cells; i++) {
          const { x, y, w, h: ch } = cellRect(i);
          ctx.strokeStyle = cssVar('--line-3') || 'rgba(255,255,255,.2)';
          ctx.strokeRect(x + 0.5, y + 0.5, w - 1, ch - 1);
          ctx.strokeStyle = cssVar('--line-2') || 'rgba(255,255,255,.14)';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(x + w / 2, y + 3); ctx.lineTo(x + w / 2, y + ch - 3);
          ctx.moveTo(x + 3, y + ch / 2); ctx.lineTo(x + w - 3, y + ch / 2);
          ctx.moveTo(x + 3, y + 3); ctx.lineTo(x + w - 3, y + ch - 3);
          ctx.moveTo(x + w - 3, y + 3); ctx.lineTo(x + 3, y + ch - 3);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        /* 四线三格：每行三条实线（三等分），字母间虚线，行间虚分隔 */
        ctx.strokeStyle = cssVar('--line-3') || 'rgba(255,255,255,.2)';
        for (let r = 0; r < rows; r++) {
          const y0 = PAD + r * cell;
          ctx.beginPath();
          [1 / 6, 3 / 6, 5 / 6].forEach(f => {
            const y = y0 + cell * f;
            ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y);
          });
          ctx.stroke();
        }
        ctx.strokeStyle = cssVar('--line-2') || 'rgba(255,255,255,.14)';
        ctx.setLineDash([3, 4]);
        for (let i = 0; i < cells; i++) {
          if (i % cols === 0) continue; /* 每行第一格前不画竖线 */
          const { x, y } = cellRect(i);
          ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x, y + cell - 3); ctx.stroke();
        }
        for (let r = 1; r < rows; r++) {
          const y = PAD + r * cell;
          ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      ctx.restore();
    };

    const drawGuide = () => {
      if (!guide) return;
      const chars = guide.split('');
      ctx.save();
      ctx.fillStyle = cssVar('--hw-guide') || 'rgba(170,170,170,.55)';
      ctx.textAlign = 'center';
      for (let i = 0; i < chars.length && i < cells; i++) {
        const ch = chars[i];
        if (!ch.trim()) continue; /* 词组里的空格占格但不画字 */
        const { x, y, w, h: chh } = cellRect(i);
        if (mode === 'zh') {
          ctx.font = `600 ${Math.floor(cell * 0.72)}px "KaiTi","STKaiti","SimSun",serif`;
          ctx.textBaseline = 'middle';
          ctx.fillText(ch, x + w / 2, y + chh / 2);
        } else {
          /* 按字母形态决定大小和基线：上伸字母够到第一条线，下伸字母探到底线 */
          const low = ch.toLowerCase();
          let f = 0.66, base = 5 / 6;
          if (EN_TALL.includes(low)) { f = 0.92; }
          else if (EN_DESC.includes(low)) { f = 0.52; base = 0.72; }
          ctx.font = `600 ${Math.floor(cell * f)}px "Arial Rounded MT Bold","Segoe UI",sans-serif`;
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(ch, x + w / 2, y + chh * base);
        }
      }
      ctx.restore();
    };

    const drawStrokes = () => {
      ctx.save();
      ctx.lineWidth = Math.max(3, Math.min(7, cell * 0.07));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = cssVar('--text-hi') || '#fff';
      ctx.fillStyle = ctx.strokeStyle;
      const all = cur ? strokes.concat([cur]) : strokes;
      all.forEach(pts => {
        if (pts.length < 2) {
          ctx.beginPath(); ctx.arc(pts[0].x * W, pts[0].y * H, ctx.lineWidth / 2, 0, 7); ctx.fill();
          return;
        }
        ctx.beginPath();
        ctx.moveTo(pts[0].x * W, pts[0].y * H);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2 * W, my = (pts[i].y + pts[i + 1].y) / 2 * H;
          ctx.quadraticCurveTo(pts[i].x * W, pts[i].y * H, mx, my);
        }
        ctx.lineTo(pts[pts.length - 1].x * W, pts[pts.length - 1].y * H);
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

    /* 存比例坐标（0~1）：画布尺寸变化后按新尺寸换算，笔画整体跟着缩放不错位 */
    const pos = e => {
      const r = canvas.getBoundingClientRect();
      return {
        x: r.width ? (e.clientX - r.left) / r.width : 0,
        y: r.height ? (e.clientY - r.top) / r.height : 0
      };
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
      if (Math.abs(p.x - last.x) + Math.abs(p.y - last.y) < 0.004) return;
      cur.push(p);
      redraw();
    });
    const endStroke = () => {
      if (!cur) return;
      if (cur.length === 1) cur.push({ x: cur[0].x + 0.001, y: cur[0].y });
      strokes.push(cur);
      cur = null;
      if (opts.onChange) opts.onChange();
    };
    canvas.addEventListener('pointerup', endStroke);
    canvas.addEventListener('pointercancel', endStroke);

    /* 布局监听与首次量尺放在所有绘制函数定义之后（redraw 已可用） */
    const ro = ('ResizeObserver' in window) ? new ResizeObserver(() => {
      if (!canvas.isConnected) {
        if (laidOut) { ro.disconnect(); window.removeEventListener('resize', resize); }
        return;
      }
      resize();
    }) : null;
    if (ro) ro.observe(wrap);
    resize();
    requestAnimationFrame(() => requestAnimationFrame(resize));
    window.addEventListener('resize', () => { if (canvas.isConnected) resize(); });

    return {
      el: wrap,
      clear() { strokes = []; redraw(); if (opts.onChange) opts.onChange(); },
      undo() { strokes.pop(); redraw(); if (opts.onChange) opts.onChange(); },
      showGuide(text) { guide = text || ''; redraw(); },
      isEmpty() { return strokes.length === 0; }
    };
  }
};
