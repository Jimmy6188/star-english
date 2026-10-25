/* ============================================================
 * 星际求知号 - 小练笔工坊（v38 写作星系第二期）
 * 三格微写作：开头一句 → 中间两三句 → 结尾一句，每次 2~4 句压力小
 * 三种输入（调研主流写作 App 后的组合）：
 *   1) 孩子自己打字（练键盘，textarea 调系统输入法）
 *   2) 🎙️ 语音"说作文"（设备支持 Web Speech 时显示，识别结果落进对应格）
 *   3) 📷 写在纸上拍照上传（保留练字，家长点评时看照片；canvas 压缩防爆存储）
 * 完成即奖（earnScaled 递减）；家长 1~5 星点评 + 一句表扬，点评另 +2；
 * 系统不假装会批改作文——点评交给爸爸妈妈，这本身是亲子环节
 * ============================================================ */
const WorkShop = {
  photo: null,      // 本次练笔的手写照片（base64）
  rec: null,        // 正在进行的语音识别
  recTa: null,      // 语音识别目标输入框

  SR: (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition) || null,

  open() {
    Sound.stopSpeak();
    this.stopRec();
    this.stopRecord();
    this.photo = null;
    this.audio = null;
    setQuestSub('var(--gold)');
    showScreen('quest');
    this.renderHub();
  },

  topBar(title, onBack) {
    return h('div', { class: 'quest-top' },
      h('button', {
        class: 'quest-exit',
        onclick: () => { Sound.tap(); this.stopRec(); this.stopRecord(); onBack(); }
      }, icon('x')),
      h('div', { class: 'quest-prog' }, title)
    );
  },

  /* ---------- 工坊首页：素材墙 + 作品入口 ---------- */
  renderHub() {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.topBar('✍️ 小练笔工坊', () => { showScreen('home'); renderHome(); }));
    const entries = Store.writingList();
    const reviewed = entries.filter(e => e.stars > 0).length;

    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, '✍️'),
      h('div', { class: 'splash-title' }, '今天写点什么？'),
      h('div', { class: 'splash-sub' }, '挑一个素材小卡，按三个小问题写 2~4 句 · 完成 +12 🪙 · 爸妈点评再 +2'),
      h('div', { class: 'tiny', style: 'margin:6px 0 2px' },
        `已写 ${entries.length} 篇 · 被点评 ${reviewed} 篇${entries.length ? '' : ' · 第一篇就能拿「小小作家」徽章哦'}`)
    ));

    /* 我的作品入口 */
    if (entries.length) {
      root.appendChild(h('button', {
        class: 'btn big', style: 'margin:10px 0 0',
        onclick: () => { Sound.tap(); this.renderWorks(); }
      }, `📖 我的作品（${entries.length} 篇）`));
    }

    /* 素材网格 */
    const grid = h('div', { class: 'wp-grid' });
    WRITING_PROMPTS.forEach(p => {
      grid.appendChild(h('button', {
        class: 'wp-card', onclick: () => { Sound.tap(); this.start(p); }
      },
        h('span', { class: 'wp-emoji' }, p.emoji),
        h('span', { class: 'wp-title' }, p.title)
      ));
    });
    const wrap = h('div', { class: 'card' },
      h('div', { class: 'drill-tag' }, '🗂️ 素材百宝箱（点一张卡开始）'),
      grid
    );
    root.appendChild(wrap);
  },

  /* ---------- 写作页：三个引导问题 + 三格输入 ---------- */
  start(p) {
    const root = $('#quest-root');
    root.innerHTML = '';
    this.photo = null;
    this.audio = null;   /* 本次练笔的整段录音（base64） */
    this.stopRecord();
    root.appendChild(this.topBar(`${p.emoji} ${p.title}`, () => this.renderHub()));

    const card = h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, `${p.emoji} 小练笔 · ${p.title}`),
      h('div', { class: 'ph-hint', style: 'text-align:left;display:block' },
        h('div', { class: 'tiny' }, '👀 ' + p.qs[0]),
        h('div', { class: 'tiny' }, '👂 ' + p.qs[1]),
        h('div', { class: 'tiny' }, '💭 ' + p.qs[2])
      )
    );
    root.appendChild(card);

    /* 三格：开头 / 中间 / 结尾 */
    const slots = [
      { key: 'open', label: '① 开头一句', hint: `点框里打字，或点「🎙️ 说」。\n像这样起头：${p.ex}`, rows: 2 },
      { key: 'mid',  label: '② 中间两三句', hint: '点框里打字（平板会自动弹出键盘）。\n把看到、听到、想到的写下来', rows: 4 },
      { key: 'end',  label: '③ 结尾一句', hint: '点框里打字。写感受、收获，或像电影镜头一样收尾', rows: 2 }
    ];
    /* 输入方式图例 + 键盘帮助（v38.2：安卓 Pad 软键盘/语音识别不可用时的三条出路） */
    card.appendChild(h('div', { class: 'wp-howto' },
      h('div', {}, '✏️ 点白框框直接打字（平板/手机一般会自动弹出键盘）'),
      h('div', {}, '🎤 说不出字没关系：点下面「🎤 说整段」，把想说的录下来，交稿后爸妈回听帮你写进作品'),
      h('div', {}, '📷 也可以写在纸上，点拍照按钮存进作品'),
      h('button', {
        class: 'btn small', style: 'margin-top:6px',
        onclick: () => {
          Sound.tap();
          showModal({
            title: '⌨️ 键盘弹不出来？',
            build(el) {
              el.appendChild(h('div', { style: 'text-align:left;line-height:2' },
                h('div', {}, '1️⃣ 打开浏览器菜单（⋮ 或 …），把「桌面版网站 / 请求电脑版网页」关掉，再回来点框框；'),
                h('div', {}, '2️⃣ 安卓平板：下拉快捷栏里看看有没有连接外接/物理键盘的图标，断开后软键盘就会回来；'),
                h('div', {}, '3️⃣ 实在弹不出来也没关系——用「🎤 说整段」录音，或 📷 把手写的拍照，都能交稿！')));
            },
            actions: [{ label: '知道了', cls: 'btn-main' }]
          });
        }
      }, '❓ 键盘弹不出来？点我看办法')
    ));
    const tas = {};
    const cnt = h('div', { class: 'tiny center', style: 'margin:6px 0' }, '');
    const updCnt = () => {
      const n = slots.reduce((a, s) => a + (tas[s.key].value.replace(/\s/g, '').length), 0);
      const att = [];
      if (this.photo) att.push('📷 已附照片');
      if (this.audio) att.push(`🎤 已录 ${this.audioSec || '?'} 秒`);
      const attTxt = att.length ? ` · ${att.join(' · ')}（也能交稿）` : '';
      cnt.textContent = n >= 15 ? `已写 ${n} 个字 ✓ 可以交啦${attTxt}`
        : `已写 ${n} 个字${attTxt || '（打字、🎤 录音、📷 拍照任选一样就能交）'}`;
    };
    slots.forEach(s => {
      const row = h('div', { class: 'wp-slot' });
      row.appendChild(h('div', { class: 'wp-slot-label' }, s.label));
      const bar = h('div', { class: 'wp-slot-bar' });
      /* 显式打字入口：点一下聚焦对应框（触屏设备随之弹出系统键盘） */
      bar.appendChild(h('button', {
        class: 'btn small', 'data-slot': s.key, title: '点我打这一句',
        onclick: () => { Sound.tap(); const ta = tas[s.key]; ta.focus(); try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) { /* 忽略 */ } }
      }, '✏️ 打这句'));
      /* 语音按钮：设备不支持就不显示 */
      if (this.SR) {
        bar.appendChild(h('button', {
          class: 'btn small wp-mic', 'data-slot': s.key, title: '对着麦克风说这一句',
          onclick: e => { this.toggleMic(tas[s.key], e.currentTarget); }
        }, '🎙️ 说这句'));
      }
      row.appendChild(bar);
      tas[s.key] = h('textarea', {
        class: 'input wp-ta', rows: String(s.rows), placeholder: s.hint,
        oninput: updCnt
      });
      row.appendChild(tas[s.key]);
      card.appendChild(row);
    });
    card.appendChild(cnt);

    /* 手写拍照（保留练字习惯，家长点评看图） */
    const photoBtn = h('button', { class: 'btn small', style: 'margin:4px 0' }, '📷 我写在纸上（拍照存进作品）');
    const fileIn = h('input', {
      type: 'file', accept: 'image/*', capture: 'environment', style: 'display:none',
      onchange: e => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        this.compress(f, data => {
          if (!data) { toast('这张照片处理不了，换一张试试'); return; }
          this.photo = data;
          photoBtn.textContent = '✅ 手写照片已附上（点一下可重拍）';
          Sound.tap();
          updCnt();
        });
        e.target.value = '';
      }
    });
    photoBtn.onclick = () => { Sound.tap(); fileIn.click(); };
    card.appendChild(photoBtn);
    card.appendChild(fileIn);

    /* 🎤 说整段（v38.2）：录音兜底——语音识别（打字进框）只在支持的设备上可用，
     * 很多安卓 Pad 的浏览器不支持在线识别；但录音（麦克风权限）几乎所有设备都行。
     * 录音跟随作品保存，家长点评时回听并帮孩子誊写成文字。 */
    const recBtn = h('button', { class: 'btn big wp-recbtn', style: 'margin:10px 0 0' }, '🎤 说整段（把想说的话录下来）');
    const recState = h('div', { class: 'tiny center', style: 'margin:4px 0' }, '');
    recBtn.onclick = () => this.toggleRecord(recBtn, recState, updCnt);
    card.appendChild(recBtn);
    card.appendChild(recState);
    card.appendChild(h('div', { class: 'tiny center', style: 'margin:2px 0 8px' }, '打字、🎤 录音、📷 拍照，任选一样（也可以组合）都能交稿'));

    card.appendChild(h('button', {
      class: 'btn btn-main big',
      onclick: () => {
        const texts = slots.map(s => tas[s.key].value.trim());
        const n = texts.join('').replace(/\s/g, '').length;
        const hasAtt = this.photo || this.audio;
        if (n < 15 && !hasAtt) { toast('打几个字、录一段话或拍一张手写照片，任意一样就能交'); return; }
        if (this.mr) { toast('先把录音停一下（点红色的录音按钮）再交稿'); return; }
        Sound.tap();
        this.finish(p, texts);
      }
    }, '写好啦，交！ ✨'));
    root.appendChild(card);
    updCnt();
  },

  /* ---------- 语音"说作文"（v38.1 重写：单句模式最稳） ----------
   * 点击开始 → 实时把听到的字写进输入框 → 说完一句自动停（可再点继续说，文字追加）。
   * 之前 continuous=true 在部分浏览器上 onresult 从不回传（表现为说完框里没字），
   * 改成 continuous=false；错误按类型给出人话提示；3 秒没动静自动复位。 */
  toggleMic(ta, btn) {
    if (this.rec) { this.stopRec(); return; }
    Sound.tap();
    let rec;
    try { rec = new this.SR(); }
    catch (e) { toast('这个浏览器用不了语音，点 ✏️ 打字吧'); return; }
    rec.lang = 'zh-CN';
    rec.interimResults = true;
    rec.continuous = false; /* 单句：说完自动结束，兼容性最好 */
    const base = ta.value || '';
    let got = 0;
    const self = this;
    rec.onstart = () => {
      clearTimeout(silent);
      btn.classList.add('rec-on');
      btn.textContent = '⏹ 正在听（说完自动停）';
    };
    rec.onresult = ev => {
      clearTimeout(silent);
      let txt = '';
      for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
      ta.value = base + txt;
      got = txt.replace(/\s/g, '').length;
      btn.textContent = got ? `⏹ 正在听…已 ${got} 字` : '⏹ 正在听（说完自动停）';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    };
    rec.onerror = ev => {
      const code = ev && ev.error;
      if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'not-found')
        toast('麦克风不给用：请在浏览器设置里允许麦克风，或改用 ✏️ 打字');
      else if (code === 'no-speech')
        toast('没听到声音，靠近一点再点一次');
      else if (code === 'network')
        toast('语音识别要联网，检查一下网络，或改用 ✏️ 打字');
      else if (code !== 'aborted')
        toast('这次没识别成功，再试一次或点 ✏️ 打字');
    };
    rec.onend = () => {
      self.rec = null;
      btn.classList.remove('rec-on');
      btn.textContent = '🎙️ 说这句';
      if (got) toast(`已帮你打进 ${got} 个字，可以再点继续说 🎙️`);
    };
    /* 3 秒还没开始（无权限弹窗或环境不支持）自动复位，别让按钮一直"录音中" */
    const silent = setTimeout(() => {
      if (self.rec === rec) { try { rec.abort(); } catch (e) { /* 忽略 */ } self.rec = null; btn.classList.remove('rec-on'); btn.textContent = '🎙️ 说这句'; }
    }, 3000);
    this.rec = rec;
    this.recBtn = btn;
    try { rec.start(); }
    catch (e) {
      clearTimeout(silent);
      this.rec = null;
      btn.classList.remove('rec-on');
      btn.textContent = '🎙️ 说这句';
      toast('这个浏览器用不了语音，点 ✏️ 打字吧');
    }
  },
  stopRec() {
    if (this.recBtn) {
      this.recBtn.classList.remove('rec-on');
      this.recBtn.textContent = '🎙️ 说这句';
      this.recBtn = null;
    }
    if (this.rec) { try { this.rec.stop(); } catch (e) { /* 忽略 */ } this.rec = null; }
  },

  /* ---------- 🎤 说整段：录音兜底（v38.2） ----------
   * 在线语音识别（字自动进框）在这台安卓 Pad 上不可用，但录音几乎所有设备都行：
   * 点一下开始录（最长 60 秒自动停），再点一下结束；音频 base64 存进作品，
   * 家长点评时回听，并可直接把孩子说的话誊写进作品三格。 */
  async toggleRecord(btn, stateEl, refresh) {
    if (this.mr) { this.stopRecord(); return; }
    Sound.tap();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast('这台设备录不了音，用 ✏️ 打字或 📷 拍照吧');
      return;
    }
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) {
      toast('麦克风不给用：在弹出的权限框里点「允许」再试一次');
      return;
    }
    const self = this;
    let mr;
    try { mr = new MediaRecorder(stream); }
    catch (e) { stream.getTracks().forEach(t => t.stop()); toast('这台设备录不了音，用 ✏️ 打字或 📷 拍照吧'); return; }
    const chunks = [];
    const t0 = Date.now();
    let timer = null, tick = null;
    mr.ondataavailable = ev => { if (ev.data && ev.data.size) chunks.push(ev.data); };
    mr.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      clearInterval(tick); clearTimeout(timer);
      const sec = Math.round((Date.now() - t0) / 1000);
      btn.classList.remove('rec-on');
      btn.textContent = '🎤 说整段（把想说的话录下来）';
      self.mr = null;
      if (!chunks.length) { stateEl.textContent = '刚才没录上，再点一次试试'; return; }
      const fr = new FileReader();
      fr.onload = () => {
        self.audio = String(fr.result);
        self.audioSec = sec;
        stateEl.textContent = `✅ 已录 ${sec} 秒，跟作品一起保存（可再点重录，会替换）`;
        Sound.tap();
        if (refresh) refresh();
      };
      fr.onerror = () => { stateEl.textContent = '录音保存失败，再试一次'; };
      fr.readAsDataURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' }));
    };
    this.mr = mr;
    btn.classList.add('rec-on');
    try { mr.start(); } catch (e) { this.stopRecord(); toast('录音没能开始，再试一次'); return; }
    tick = setInterval(() => {
      const s = Math.round((Date.now() - t0) / 1000);
      btn.textContent = `⏹ 正在录 ${s} 秒（说完点我停止）`;
      stateEl.textContent = s >= 60 ? '' : '大声把想写的说出来吧！';
    }, 500);
    timer = setTimeout(() => { if (self.mr === mr) { toast('到 60 秒啦，自动帮你停'); self.stopRecord(); } }, 60000);
  },
  stopRecord() {
    if (this.mr) { try { this.mr.stop(); } catch (e) { /* 忽略 */ } this.mr = null; }
  },

  /* 照片压缩：最长边 900px、jpeg 0.72，控制 localStorage 体积 */
  compress(file, cb) {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.width * scale));
        cv.height = Math.max(1, Math.round(img.height * scale));
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        cb(cv.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => { URL.revokeObjectURL(url); cb(null); };
      img.src = url;
    } catch (e) { cb(null); }
  },

  /* ---------- 完成 ---------- */
  finish(p, texts) {
    const entry = {
      at: Date.now(), id: p.id, title: p.title, emoji: p.emoji,
      open: texts[0], mid: texts[1], end: texts[2],
      photo: this.photo || '', audio: this.audio || '', audioSec: this.audioSec || 0,
      stars: 0, note: '', reviewed: false
    };
    this.photo = null;
    this.audio = null;
    const got = Store.saveWriting(entry);
    Sound.gold();
    const idx = Store.writingList().length - 1;
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.topBar('🎉 完成！', () => this.renderHub()));
    const stamp = h('div', { class: 'finish-stamp' }, '✍️');
    root.appendChild(h('div', { class: 'card finish-card' },
      stamp,
      h('div', { class: 'finish-title' }, `《${p.title}》交稿成功！`),
      h('div', { class: 'finish-sub' }, `获得 +${got} 🪙 · 已收进「我的作品」`),
      entry.photo ? h('img', { class: 'wp-photo', src: entry.photo, alt: '手写照片' }) : '',
      entry.audio ? h('div', { class: 'wp-audio-tag' }, `🎧 已附上 ${entry.audioSec} 秒录音`) : '',
      h('div', { class: 'tiny', style: 'margin:8px 0;line-height:1.9;text-align:left' },
        h('div', {}, '拿给爸爸妈妈看看，'),
        h('div', {}, entry.audio ? '他们可以回听你的录音，帮你把话写进作品，再打个 ⭐' : '请他们打个 ⭐ 再说一句表扬——他们的话比金币值钱！')),
      h('div', { class: 'row-gap' },
        h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.renderHub(); } }, '再写一篇'),
        h('button', {
          class: 'btn btn-main', style: 'flex:1',
          onclick: () => { Sound.tap(); this.detail(idx); }
        }, '去请爸妈点评 ⭐')
      )
    ));
    const c = centerOf(stamp);
    burst(c.x, c.y, { count: 20, emojis: ['✍️', '⭐', '✨'], power: 110 });
  },

  /* ---------- 作品墙 ---------- */
  renderWorks() {
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.topBar('📖 我的作品', () => this.renderHub()));
    const list = Store.writingList().slice().reverse(); /* 新的在前 */
    const card = h('div', { class: 'card' }, h('div', { class: 'drill-tag' }, `📖 作品墙 · 共 ${list.length} 篇`));
    if (!list.length) card.appendChild(h('div', { class: 'tiny center' }, '还空空的，去写第一篇吧！'));
    list.forEach((e, ri) => {
      const idx = list.length - 1 - ri; /* 还原真实下标 */
      const d = new Date(e.at);
      const stars = e.stars ? '⭐'.repeat(e.stars) : '💤 待点评';
      card.appendChild(h('button', {
        class: 'wp-work', onclick: () => { Sound.tap(); this.detail(idx); }
      },
        h('span', { class: 'wp-work-emoji' }, e.emoji),
        h('span', { class: 'wp-work-info' },
          h('span', { class: 'wp-work-title' }, `${e.title}`),
          h('span', { class: 'tiny' }, `${d.getMonth() + 1}月${d.getDate()}日 · ${this.countOf(e)} 字${e.photo ? ' · 📷' : ''}${e.audio ? ' · 🎧' : ''}`)
        ),
        h('span', { class: 'wp-work-stars' }, stars)
      ));
    });
    root.appendChild(card);
  },
  countOf(e) {
    return ((e.open || '') + (e.mid || '') + (e.end || '')).replace(/\s/g, '').length;
  },

  /* ---------- 作品详情 + 家长点评 ---------- */
  detail(idx) {
    const list = Store.writingList();
    const e = list[idx];
    if (!e) { this.renderWorks(); return; }
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this.topBar(`${e.emoji} ${e.title}`, () => this.renderWorks()));
    const d = new Date(e.at);
    const card = h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, `${e.emoji} 《${e.title}》 · ${d.getMonth() + 1}月${d.getDate()}日 · ${this.countOf(e)} 字`)
    );
    if (e.photo) card.appendChild(h('img', { class: 'wp-photo', src: e.photo, alt: '手写照片' }));
    if (e.audio) {
      card.appendChild(h('div', { class: 'tiny center', style: 'margin:4px 0' }, `🎧 孩子说了 ${e.audioSec || '?'} 秒（点 ▶ 回听）`));
      try { card.appendChild(h('audio', { class: 'wp-audio', controls: '', src: e.audio })); }
      catch (err) { /* 音频元素构造失败忽略 */ }
    }
    [['open', '开头'], ['mid', '中间'], ['end', '结尾']].forEach(([k, label]) => {
      if (e[k]) card.appendChild(h('div', { class: 'wp-read' },
        h('span', { class: 'tiny wp-read-label' }, label),
        h('span', {}, e[k])
      ));
    });
    if (e.note) card.appendChild(h('div', { class: 'wp-note' }, '💬 爸妈说：' + e.note));

    /* 家长点评区：打星 + 一句表扬 + 帮孩子誊写（听录音/看照片后把话写进作品） */
    const pick = h('div', { class: 'wp-pick' });
    let stars = e.stars || 0;
    const paint = () => {
      pick.innerHTML = '';
      for (let i = 1; i <= 5; i++) {
        const n = i;
        pick.appendChild(h('button', {
          class: 'wp-star' + (n <= stars ? ' on' : ''),
          onclick: () => { Sound.tap(); stars = n; paint(); }
        }, n <= stars ? '⭐' : '☆'));
      }
    };
    paint();
    const noteIn = h('input', { class: 'input', maxlength: '50', placeholder: '写一句表扬（哪里写得好？）', value: e.note || '' });
    /* 誊写区：家长回听录音/看手写照片后，帮孩子把文字放进作品 */
    const trans = h('div', { class: 'wp-trans' });
    const tTas = {};
    [['open', '开头'], ['mid', '中间'], ['end', '结尾']].forEach(([k, label]) => {
      trans.appendChild(h('div', { class: 'tiny', style: 'margin-top:6px;font-weight:700' }, label));
      tTas[k] = h('input', { class: 'input', value: e[k] || '', placeholder: `听录音后把${label}写进去` });
      trans.appendChild(tTas[k]);
    });
    card.appendChild(h('div', { class: 'wp-review' },
      h('div', { class: 'tiny center', style: 'margin:10px 0 4px' }, '👨‍👩‍👧 请爸爸妈妈来点评（打星 + 一句表扬）'),
      pick,
      noteIn,
      (e.audio || e.photo) ? h('details', { class: 'wp-trans-box' },
        h('summary', { style: 'cursor:pointer;font-weight:700;margin-top:8px' }, '✍️ 帮孩子誊写（听录音/看照片后填字，可展开）'),
        h('div', { class: 'tiny', style: 'margin:4px 0' }, '填进去的文字会出现在孩子的作品墙上'),
        trans
      ) : '',
      h('button', {
        class: 'btn btn-main', style: 'margin-top:8px',
        onclick: () => {
          if (!stars) { toast('先打个星再保存哦'); return; }
          const texts = [tTas.open.value.trim(), tTas.mid.value.trim(), tTas.end.value.trim()];
          const changed = texts.some((t, i) => t && t !== [e.open, e.mid, e.end][i]);
          const bonus = Store.reviewWriting(idx, stars, noteIn.value.trim(), changed ? texts : null);
          Sound.coin();
          toast(bonus > 0 ? `点评收下！奖励 +${bonus} 🪙` : '点评已更新');
          this.detail(idx);
        }
      }, '保存点评'))
    );
    root.appendChild(card);
  }
};

/* 写作星系的单元弹窗顶部挂「今日小练笔」入口（SubjectUI.openHub 的 def.hook） */
if (typeof SubjectUI !== 'undefined') {
  const def = SubjectUI.byId && SubjectUI.byId('writing');
  if (def) def.hook = (el, close) => {
    el.appendChild(h('button', {
      class: 'btn big btn-gold', style: 'margin-top:12px',
      onclick: () => { Sound.tap(); close(); WorkShop.open(); }
    }, '✍️ 今日小练笔（写 2~4 句 · 打字/🎤 录音/📷 手写拍照）'));
  };
}
