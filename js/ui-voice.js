/* ============================================================
 * 星际求知号 - 口语星系（v47：M1 跟读闯关 + M2 伙伴对话）
 * 定位铁律（来自 M0 调研与童声实测定稿）：
 *   1) 只有跟读打分；对话/自由说永不打分（KET 模考另开模式，本版不做）
 *   2) 孩子只看 ⭐ 星级和进步，不看裸分数（裸分数只在数据里，供家长端）
 *   3) 先鼓励后纠错：每次只点 1 个最弱音，AI 点评先表扬再给一个发音小窍门
 *   4) 对话走半双工（听写→LLM→TTS），不做实时语音；AI 用伙伴身份（宠物开口）
 *   5) 内容源复用现库：KET_WORDS（词+例句）跟读、KET_DIALOGUES 话题卡聊天
 *   6) 金币走 earnScaled 防通胀；额度本地自估 500 次/日（见 voice-engine）
 * 家长职责：⚙️ 设置里填讯飞三件套 + AI 渠道三件套（仅存本机 localStorage）。
 * ============================================================ */

const VoiceUI = {
  sess: null,        /* 当前语音会话（beginRead/beginDictate 句柄） */
  busy: false,
  items: [],         /* 本关跟读条目 */
  idx: 0, passed: 0, results: [],
  chatRounds: 0,

  /* ---------- 存档（惰性初始化，不侵入 store 默认结构） ---------- */
  _st() {
    if (!Store.state.voice) {
      Store.state.voice = { stars: {}, readDays: {}, chatDays: {}, lastWordIds: [] };
      Store.save();
    }
    return Store.state.voice;
  },
  _today() { return Store.state.today.date; },
  coachName() { return VoiceEngine.cfg().coachName || Store.state.pet.name || '伙伴'; },
  coachEmoji() {
    const kind = Store.state.pet.kind;
    const k = (typeof PET_KINDS !== 'undefined') && PET_KINDS.find(x => x.id === kind);
    return k ? k.emoji : '🐾';
  },

  /* ---------- home 入口卡（ui-screens.js 的 renderHome 调用） ---------- */
  renderHomeCard() {
    const slot = $('#voice-slot');
    if (!slot) return;
    const st = this._st();
    const readToday = st.readDays[this._today()] || 0;
    const chatToday = st.chatDays[this._today()] || 0;
    const cfgOk = VoiceEngine.cfgReady();
    slot.innerHTML = '';
    slot.appendChild(h('div', { class: 'card junior-card subj', style: '--sub:var(--gold-strong)' },
      h('div', { class: 'math-head' },
        h('span', { class: 'math-emoji' }, '🎙️'),
        h('div', { class: 'math-info' },
          h('div', { style: 'font-weight:800' }, `口语星系 · 跟${this.coachName()}敢开口`),
          h('div', { class: 'tiny' }, cfgOk
            ? `今日跟读 ${readToday} 题 · 和伙伴聊了 ${chatToday} 轮 · 跟读拿 ⭐ · 聊天不打分`
            : '需要家长先完成一次语音设置（点进去 → 右上角 ⚙️）')
        ),
        h('button', { class: 'btn btn-main small', onclick: () => { Sound.tap(); VoiceUI.openHub(); } }, '出发')
      )
    ));
  },

  /* ---------- 口语星系主页 ---------- */
  openHub() {
    Sound.stopSpeak();
    this.resetSess();
    setQuestSub('var(--gold-strong)');
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this._topBar('🎙️ 口语星系'));
    const u = VoiceEngine.usage();
    const readToday = this._st().readDays[this._today()] || 0;
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, this.coachEmoji()),
      h('div', { class: 'splash-title' }, this.coachName() + ' 的口语课'),
      h('div', { class: 'splash-sub' },
        `今日跟读 ${readToday} 题 · 语音额度 评测${u.ise || 0}/听写${u.iat || 0}（每日各500次）`)
    ));
    const grid = h('div', { class: 'scene-grid' });
    grid.appendChild(h('button', {
      class: 'scene-tile', onclick: () => { Sound.tap(); this.openRead(); }
    },
      h('span', { class: 'scene-tile-emoji' }, '📖'),
      h('span', { class: 'scene-tile-name' }, '跟读闯关'),
      h('span', { class: 'scene-tile-prog' }, '6 题 · 拿 ⭐ · +🪙')
    ));
    grid.appendChild(h('button', {
      class: 'scene-tile', onclick: () => { Sound.tap(); this.openChatTopics(); }
    },
      h('span', { class: 'scene-tile-emoji' }, '🗣️'),
      h('span', { class: 'scene-tile-name' }, '和伙伴聊天'),
      h('span', { class: 'scene-tile-prog' }, '不打分 · 随便聊')
    ));
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, '今天想练哪样？'),
      grid,
      h('div', { class: 'row-gap', style: 'margin-top:10px;align-items:center' },
        h('button', { class: 'btn small ghost', onclick: () => { Sound.tap(); this.openSettings(); } }, '⚙️ 语音设置（家长）'),
        h('div', { class: 'tiny', style: 'flex:1' }, '跟读拿星级和金币；聊天不打分，说错也没关系～')
      )
    ));
  },

  _topBar(title) {
    return h('div', { class: 'quest-top' },
      h('button', {
        class: 'quest-exit',
        onclick: () => { Sound.stopSpeak(); this.resetSess(); showScreen('home'); renderHome(); }
      }, icon('x')),
      h('div', { class: 'quest-prog' }, title)
    );
  },
  resetSess() {
    if (this.sess) { try { this.sess.stop(); } catch (e) { /* 忽略 */ } this.sess = null; }
    VoiceEngine.stopRec();
    this.busy = false;
  },

  /* ---------- M1 跟读闯关 ---------- */
  pickReadItems() {
    /* 每关 6 题：3 个 KET 词 + 3 个例句；优先已学词（记忆固化），不足随机补；避免和上关重复 */
    const st = this._st();
    const learned = (Store.state.ketwords && Store.state.ketwords.learned) || {};
    const learnedWords = Object.keys(learned).filter(w => !st.lastWordIds.includes(w));
    const all = typeof KET_WORDS !== 'undefined' ? KET_WORDS : [];
    const freshAll = all.filter(x => !st.lastWordIds.includes(x.w));
    const pick = n => {
      const pool = learnedWords.length >= n
        ? learnedWords : learnedWords.concat(freshAll.filter(x => !learned[x.w]).map(x => x.w));
      const out = [];
      while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      /* 兜底：库存枯竭时允许重复 */
      while (out.length < n && freshAll.length) out.push(freshAll[Math.floor(Math.random() * freshAll.length)].w);
      return out;
    };
    const words = pick(3).map(w => all.find(x => x.w === w)).filter(Boolean);
    const items = [];
    words.forEach((x, i) => {
      items.push({ type: 'word', text: x.w, zh: x.zh, ref: x });
      if (x.ex && x.ex.en) items.push({ type: 'sent', text: x.ex.en, zh: x.ex.zh, ref: x });
      if (i === words.length - 1 && items.length < 6 && x.tip) {
        /* 词条无例句时补一句音标式短词朗读（第 3 词重复）——保底凑满 6 题 */
        items.push({ type: 'word', text: x.w, zh: x.zh + '（再读一遍）', ref: x });
      }
    });
    return items.slice(0, 6);
  },

  openRead() {
    if (!VoiceEngine.cfgReady()) { this.openSettings('先完成语音设置，跟读闯关才能开始'); return; }
    Sound.stopSpeak();
    this.resetSess();
    this.items = this.pickReadItems();
    if (!this.items.length) { toast('词库还没准备好'); return; }
    this.idx = 0; this.passed = 0; this.results = [];
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this._topBar('📖 跟读闯关'));
    root.appendChild(this._readCard());
    this.showReadItem();
  },

  _readCard() {
    if (!this._readCardEl) this._readCardEl = {};
    const it = this.items[this.idx];
    const mic = h('div', {
      class: 'vmic', onclick: () => { Sound.tap(); VoiceUI.toggleRead(); }
    }, '🎤');
    const card = h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, `第 ${this.idx + 1}/${this.items.length} 题 · ${it.type === 'word' ? '读单词' : '读句子'}`),
      h('div', { class: 'vword' }, it.text),
      h('div', { class: 'tiny', style: 'text-align:center' }, it.zh || ''),
      h('div', { class: 'row-gap', style: 'justify-content:center' },
        h('button', { class: 'btn small', onclick: () => { Sound.tap(); Sound.speak(it.text, VoiceEngine.cfg().rate); } }, '🔊 听示范'),
        h('button', { class: 'btn small ghost', onclick: () => { Sound.tap(); VoiceUI.openHub(); } }, '🏠 回星系')
      ),
      mic,
      h('div', { class: 'tiny center', 'data-role': 'vread-hint' }, '点 🎤 开始读，读完再点一下 ⏹'),
      h('div', { class: 'vwave' }, h('i', { 'data-role': 'vread-wave' })),
      h('div', { class: 'tiny', style: 'color:#ff6b7a;white-space:pre-wrap', 'data-role': 'vread-err' }),
      h('div', { 'data-role': 'vread-result', style: 'display:none' })
    );
    this._readCardEl.cur = card;
    return card;
  },

  showReadItem() {
    /* 换题：整卡重建（避免跨题残留状态）。
     * 注意求值顺序：必须先捕获旧卡引用再调 _readCard()——
     * _readCard() 会把 cur 更新成新卡，顺序颠倒会让 replaceChild(x,x) 变空操作，
     * 新卡永远进不了 DOM（点击/评分全发生在孤儿节点上），这是验收发现的核心 bug */
    const root = $('#quest-root');
    const old = this._readCardEl && this._readCardEl.cur;
    const fresh = this._readCard();
    if (old && old.parentNode) root.replaceChild(fresh, old);
    else root.appendChild(fresh);
  },

  toggleRead() {
    if (this.busy && this.sess) { /* 正在录 → 停止 */
      this.busy = false;
      this._hint('vread-hint', '评分中…');
      this.sess.stop();
      return;
    }
    if (this.busy) return;
    const it = this.items[this.idx];
    const card = this._readCardEl.cur;
    const wave = card.querySelector('[data-role="vread-wave"]');
    const errEl = card.querySelector('[data-role="vread-err"]');
    const resEl = card.querySelector('[data-role="vread-result"]');
    errEl.textContent = ''; resEl.style.display = 'none';
    this.busy = true;
    card.querySelector('.vmic').textContent = '⏹';
    this._hint('vread-hint', '正在准备麦克风…');
    this.sess = VoiceEngine.beginRead(it.text, {
      onReady: () => this._hint('vread-hint', '正在听，开始读吧…读完点 ⏹'),
      onLevel: lv => { wave.style.width = Math.min(100, lv * 400) + '%'; },
      onResult: res => this._readDone(res),
      onError: msg => {
        this.busy = false;
        card.querySelector('.vmic').textContent = '🎤';
        this._hint('vread-hint', '点 🎤 开始读，读完再点一下');
        wave.style.width = '0';
        errEl.textContent = msg;
      }
    });
  },

  _readDone(res) {
    this.busy = false;
    const it = this.items[this.idx];
    const card = this._readCardEl.cur;
    const wave = card.querySelector('[data-role="vread-wave"]');
    const resEl = card.querySelector('[data-role="vread-result"]');
    card.querySelector('.vmic').textContent = '🎤';
    wave.style.width = '0';
    this._hint('vread-hint', '读完啦！结果如下');
    const stars = VoiceEngine.stars(res.total);
    const passed = stars >= 2;
    if (passed) this.passed++;
    this.results.push({ text: it.text, stars, total: res.total, worst: res.worst });
    const st = this._st();
    st.stars[it.text] = Math.max(st.stars[it.text] || 0, stars);
    st.readDays[this._today()] = (st.readDays[this._today()] || 0) + 1;
    Store.save();
    /* 结果区：星级 + 单词着色 + 最弱音（不显示裸分数） */
    const wl = h('div', { class: 'vwords' });
    res.words.forEach(w => {
      const cls = w.score === null ? 'miss' : w.score >= 85 ? 'good' : w.score >= 65 ? 'mid' : 'poor';
      wl.appendChild(h('span', { class: 'vw ' + cls, title: '得分 ' + (w.score === null ? '—' : w.score) }, w.text));
    });
    resEl.innerHTML = '';
    resEl.style.display = '';
    resEl.appendChild(h('div', { class: 'vstars' }, '⭐'.repeat(stars) + '☆'.repeat(4 - stars)));
    resEl.appendChild(wl);
    if (res.worst && res.worst.score !== null && res.worst.score < 80) {
      resEl.appendChild(h('div', { class: 'vfix' },
        '最想改进的词：', h('b', {}, res.worst.word),
        res.worst.syll ? `（音标 ${res.worst.syll}）` : '',
        `——点「让${this.coachName()}点评」学发音窍门`));
    }
    const row = h('div', { class: 'row-gap', style: 'margin-top:10px' });
    row.appendChild(h('button', {
      class: 'btn', style: 'flex:1',
      onclick: () => { Sound.tap(); this.aiReadFeedback(it.text, res, resEl); }
    }, `🐾 让${this.coachName()}点评`));
    row.appendChild(h('button', {
      class: 'btn btn-main', style: 'flex:1',
      onclick: () => { Sound.tap(); this.nextRead(); }
    }, this.idx + 1 >= this.items.length ? '结算 →' : '下一题 →'));
    resEl.appendChild(row);
  },

  async aiReadFeedback(text, res, resEl) {
    const btn = resEl.querySelector('button');
    if (btn) btn.disabled = true;
    const bubble = h('div', { class: 'ai-bubble' }, this.coachEmoji() + ' 思考中…');
    resEl.insertBefore(bubble, resEl.querySelector('.row-gap'));
    try {
      const reply = await VoiceEngine.llm([
        { role: 'system', content:
          `你是${this.coachName()}，一个9岁中国小朋友的宠物伙伴，正在陪TA练英语跟读。规则：全部用中文；称呼孩子"小伙伴"；语气活泼但不超过3句话；第一句表扬一个读得好的词；第二句只针对最弱词"${res.worst && res.worst.word || ''}"给一个温柔具体的发音小窍门（怎么动嘴巴，用音标${res.worst && res.worst.syll || ''}举例）；第三句鼓励TA再读一次。绝不出现分数数字。` },
        { role: 'user', content: `句子：${text}。评测：总分${res.total}（百分制），准确度${res.acc}，流利度${res.flu}。请点评。` }
      ], 500);
      bubble.textContent = this.coachEmoji() + ' ' + reply;
      Sound.speak(text, VoiceEngine.cfg().rate); /* 复述示范：边听边对比 */
    } catch (err) {
      bubble.textContent = '⚠️ 点评失败：' + err.message;
    }
  },

  nextRead() {
    this.idx++;
    if (this.idx >= this.items.length) { this.readFinish(); return; }
    this.showReadItem();
  },

  readFinish() {
    const allPass = this.passed === this.items.length;
    const got = Store.earnScaled('voiceread', this.passed * 2 + (allPass ? 4 : 0));
    const st = this._st();
    st.lastWordIds = this.items.filter(x => x.type === 'word').map(x => x.text).slice(0, 6);
    Store.save();
    Sound.gold();
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this._topBar('📖 跟读结算'));
    root.appendChild(h('div', { class: 'card quest-splash' },
      h('div', { class: 'splash-rocket' }, allPass ? '🏆' : '🎖️'),
      h('div', { class: 'splash-title' }, allPass ? '全对通关！' : `过关 ${this.passed}/${this.items.length} 题`),
      h('div', { class: 'splash-sub' }, `拿到 ${'⭐'.repeat(4)} 里的星级共 ${this.results.reduce((n, r) => n + r.stars, 0)} 颗 · 金币 +${got} 🪙`)
    ));
    const list = h('div', { class: 'card drill-card' });
    this.results.forEach(r => {
      list.appendChild(h('div', { class: 'vrow' },
        h('span', {}, r.text),
        h('span', { style: 'margin-left:auto' }, '⭐'.repeat(r.stars))
      ));
    });
    root.appendChild(list);
    root.appendChild(h('div', { class: 'row-gap', style: 'margin-top:10px' },
      h('button', { class: 'btn', style: 'flex:1', onclick: () => { Sound.tap(); this.openRead(); } }, '再来一关'),
      h('button', { class: 'btn btn-main', style: 'flex:1', onclick: () => { Sound.tap(); this.openHub(); } }, '回星系')
    ));
  },

  /* ---------- M2 和伙伴聊天 ---------- */
  CHAT_LIMIT: 20,  /* 每日对话软限额：到限伙伴"要休息"，不是报错 */

  openChatTopics() {
    if (!VoiceEngine.cfgReady('llm')) { this.openSettings('先完成语音设置（含 AI 渠道），聊天才能开始'); return; }
    if (VoiceEngine.quotaLeft('iat') <= 0) { toast('今日语音额度用完啦，明天再来'); return; }
    Sound.stopSpeak();
    this.resetSess();
    /* 话题卡：取 KET 对话库的话题去重（内容口径与课内一致） */
    const topics = [];
    if (typeof KET_DIALOGUES !== 'undefined') {
      const seen = {};
      KET_DIALOGUES.forEach(d => { if (!seen[d.topic]) { seen[d.topic] = 1; topics.push({ topic: d.topic, emoji: d.emoji }); } });
    }
    if (!topics.length) topics.push({ topic: '日常生活', emoji: '🌞' });
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this._topBar('🗣️ 和' + this.coachName() + '聊天'));
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'drill-tag' }, '挑一个想聊的话题（不打分，说错也没事）'),
      h('div', { class: 'scene-grid' },
        topics.slice(0, 16).map(t => h('button', {
          class: 'scene-tile', onclick: () => { Sound.tap(); VoiceUI.openChat(t); }
        },
          h('span', { class: 'scene-tile-emoji' }, t.emoji),
          h('span', { class: 'scene-tile-name' }, t.topic)
        ))
      )
    ));
  },

  openChat(topic) {
    const st = this._st();
    this.chatRounds = st.chatDays[this._today()] || 0;
    if (this.chatRounds >= this.CHAT_LIMIT) { this._chatGoodnight(); return; }
    showScreen('quest');
    const root = $('#quest-root');
    root.innerHTML = '';
    root.appendChild(this._topBar('🗣️ ' + topic.emoji + ' ' + topic.topic));
    const mic = h('div', {
      class: 'vmic', onclick: () => { Sound.tap(); VoiceUI.toggleChat(topic); }
    }, '🎤');
    this._chatMicEl = mic;
    const hiBubble = h('div', { class: 'ai-bubble' },
      this.coachEmoji() + ` 今天我们聊「${topic.topic}」。点 🎤 用英语跟我说说吧，说错了也没关系！`);
    hiBubble.appendChild(h('div', { class: 'tiny', style: 'color:var(--text-low);margin-top:4px' },
      '💡 伙伴说英语后，点那条英语句子就能看中文意思'));
    root.appendChild(h('div', { class: 'card drill-card' },
      h('div', { class: 'vchat', 'data-role': 'vchat' }, hiBubble),
      mic,
      h('div', { class: 'tiny center', 'data-role': 'vchat-hint' }, `点 🎤 说英语，说完再点一下（第 ${this.chatRounds}/${this.CHAT_LIMIT} 轮）`),
      h('div', { class: 'vwave' }, h('i', { 'data-role': 'vchat-wave' })),
      h('div', { class: 'tiny', style: 'color:#ff6b7a;white-space:pre-wrap', 'data-role': 'vchat-err' }),
      h('div', { class: 'row-gap', style: 'margin-top:8px' },
        h('button', { class: 'btn small ghost', onclick: () => { Sound.tap(); Sound.stopSpeak(); } }, '🔇 打断伙伴'),
        h('button', { class: 'btn small ghost', onclick: () => { Sound.tap(); this.openHub(); } }, '回星系')
      )
    ));
    window.scrollTo(0, 0);
  },

  toggleChat(topic) {
    if (this.busy && this.sess) {
      this.busy = false;
      this._hint('vchat-hint', '识别中…');
      this.sess.stop();
      return;
    }
    if (this.busy) return;
    if (this.chatRounds >= this.CHAT_LIMIT) { this._chatGoodnight(); return; }
    const card = $('#quest-root');
    const wave = card.querySelector('[data-role="vchat-wave"]');
    const errEl = card.querySelector('[data-role="vchat-err"]');
    errEl.textContent = '';
    this.busy = true;
    this._chatMicEl.textContent = '⏹';
    this._hint('vchat-hint', '正在准备麦克风…');
    this.sess = VoiceEngine.beginDictate({
      onReady: () => this._hint('vchat-hint', '正在听，用英语说吧…说完点 ⏹'),
      onLevel: lv => { wave.style.width = Math.min(100, lv * 400) + '%'; },
      onHeard: text => this._chatRound(topic, text),
      onError: msg => {
        this.busy = false;
        this._chatMicEl.textContent = '🎤';
        this._hint('vchat-hint', `点 🎤 说英语，说完再点一下（第 ${this.chatRounds}/${this.CHAT_LIMIT} 轮）`);
        wave.style.width = '0';
        errEl.textContent = msg;
      }
    });
  },

  async _chatRound(topic, heard) {
    const box = $('#quest-root').querySelector('[data-role="vchat"]');
    const wave = $('#quest-root').querySelector('[data-role="vchat-wave"]');
    wave.style.width = '0';
    if (!heard || !heard.trim()) {
      box.appendChild(h('div', { class: 'me-bubble' }, '（好像没听清，再点 🎤 说一次？）'));
      this._chatIdle();
      return;
    }
    box.appendChild(h('div', { class: 'me-bubble' }, '🗣️ ' + heard));
    box.appendChild(h('div', { class: 'ai-bubble' }, this.coachEmoji() + ' 思考中…'));
    box.scrollIntoView({ block: 'end' });
    const history = (this._chatHist = this._chatHist || []);
    try {
      const reply = await VoiceEngine.llm([
        { role: 'system', content:
`你是${this.coachName()}，一个9岁中国小朋友的宠物伙伴，正在陪TA用英语聊天，当前话题：${topic.topic}。规则：
1. 孩子说英语时你全程用英语回应，不夹中文；孩子说中文时才先用一句中文亲切回应，再给对应英文短句让TA照着说；
2. 用超简单的英语（CEFR A1-A2），每次只说1~2个短句（总共不超过15个词）；
3. 每次结尾带一个新追问，必须基于孩子刚说的内容往下聊，绝不重复你问过的问题；
4. 孩子说错不要纠正语法，把正确的说法自然地用在你的回应里；
5. 孩子的语音是童声自动转文字，可能有错词、漏词或粘连，请推测TA真正想表达的意思并自然回应，不要纠正识别错误本身；
6. 平时绝不出现"你可以这样问我/说"这类句型支架；只有孩子明显说不出（只蹦一两个词）时，才给一个可以照着说的英文短句；
7. 永远开心、鼓励、像一起玩，绝不评价打分；
8. 每次回复的最后一行必须是 "CN|" 开头：把你这轮说的英文完整翻译成孩子能懂的中文（这一行是给TA点击查看的翻译，本身不算对话内容，里面不要出现英文）。` },
        ...history.slice(-8),
        { role: 'user', content: heard }
      ], 700);
      /* 有效轮：入档 + 金币 + 限额 */
      const st = this._st();
      this.chatRounds++;
      st.chatDays[this._today()] = this.chatRounds;
      Store.save();
      const got = Store.addCoins(1);
      /* 解析 AI 自带的中文翻译行（CN|...）：默认只显示英语，🈶 按钮点开中文（主动求助式） */
      let en = reply, cn = '';
      const cnM = reply.match(/^CN\s*\|(.+)$/m);
      if (cnM) { cn = cnM[1].trim(); en = reply.slice(0, cnM.index).trim(); }
      const ab = box.lastChild;
      ab.textContent = this.coachEmoji() + ' ' + en + (got ? `　+${got} 🪙` : '');
      if (cn) {
        /* 点整条气泡切换中文（大点击目标，孩子好按）；中文行用卡片式高对比样式 */
        const cnLine = h('div', { class: 'tiny vtrans', style: 'display:none' }, '🈶 ' + cn);
        ab.appendChild(cnLine);
        ab.style.cursor = 'pointer';
        ab.title = '点我查看中文';
        ab.addEventListener('click', () => {
          const vis = cnLine.style.display !== 'none';
          cnLine.style.display = vis ? 'none' : '';
          if (!vis) { /* 求助计数：进家长端看话题难度是否合适 */
            const st2 = this._st();
            st2.helpDays = st2.helpDays || {};
            st2.helpDays[this._today()] = (st2.helpDays[this._today()] || 0) + 1;
            Store.save();
          }
        });
      }
      history.push({ role: 'user', content: heard }, { role: 'assistant', content: reply });
      Sound.speak(en || reply, Math.min(1, VoiceEngine.cfg().rate + 0.05));
      box.scrollIntoView({ block: 'end' });
      this._chatIdle();
      if (this.chatRounds >= this.CHAT_LIMIT) {
        setTimeout(() => this._chatGoodnight(), 1200);
      }
    } catch (err) {
      box.lastChild.textContent = '⚠️ ' + this.coachEmoji() + '刚才走神了：' + err.message;
      this._chatIdle();
    }
  },

  _chatIdle() {
    this.busy = false;
    if (this._chatMicEl) this._chatMicEl.textContent = '🎤';
    this._hint('vchat-hint', `点 🎤 说英语，说完再点一下（第 ${Math.min(this.chatRounds + 1, this.CHAT_LIMIT)}/${this.CHAT_LIMIT} 轮）`);
  },

  _chatGoodnight() {
    Sound.stopSpeak();
    this.resetSess();
    showModal({
      title: this.coachEmoji() + ' ' + this.coachName() + '要休息啦',
      build(el) {
        el.appendChild(h('div', { class: 'center', style: 'line-height:2' },
          h('div', { style: 'font-size:52px' }, '🌙'),
          h('div', {}, '今天聊了好多，我说够啦，明天继续陪我聊呀！'),
          h('div', { class: 'tiny', style: 'margin-top:6px' }, '（每日聊天上限 20 轮，家长可在设置里调整）')
        ));
      },
      actions: [{ label: '好！明天见', cls: 'btn-main', onClick: close => { close(); VoiceUI.openHub(); } }]
    });
    const goodbye = `That was so much fun! See you tomorrow!`;
    Sound.speak(goodbye, VoiceEngine.cfg().rate);
  },

  /* ---------- 家长设置弹窗 ---------- */
  openSettings(tip) {
    const c = VoiceEngine.cfg();
    const u = VoiceEngine.usage();
    showModal({
      title: '⚙️ 语音设置（家长）',
      build(el) {
        if (tip) el.appendChild(h('div', { class: 'tiny', style: 'color:var(--gold);margin-bottom:6px' }, tip));
        el.appendChild(h('div', { class: 'tiny' }, '① 讯飞开放平台（xfyun.cn 创建应用后，默认每日评测/听写各 500 次免费；同一应用密钥通用）'));
        el.appendChild(h('input', { class: 'input', id: 'vcfg-appid', placeholder: 'AppID', value: c.xfAppId }));
        el.appendChild(h('input', { class: 'input', id: 'vcfg-apikey', type: 'password', placeholder: 'APIKey', value: c.xfApiKey }));
        el.appendChild(h('input', { class: 'input', id: 'vcfg-apisecret', type: 'password', placeholder: 'APISecret', value: c.xfApiSecret }));
        el.appendChild(h('div', { class: 'tiny', style: 'margin-top:8px' }, '② AI 渠道（OpenAI 兼容协议，任意厂商；如智谱 BaseURL 填 https://open.bigmodel.cn/api/paas/v4）'));
        el.appendChild(h('input', { class: 'input', id: 'vcfg-llmbase', placeholder: 'BaseURL（以 /v1 /v4 等版本段结尾）', value: c.llmBase }));
        el.appendChild(h('input', { class: 'input', id: 'vcfg-llmkey', type: 'password', placeholder: 'API Key', value: c.llmKey }));
        el.appendChild(h('input', { class: 'input', id: 'vcfg-llmmodel', placeholder: '模型名（如 glm-4-flash-250414）', value: c.llmModel }));
        el.appendChild(h('div', { class: 'tiny', style: 'margin-top:8px' }, '③ 伙伴与语速'));
        el.appendChild(h('input', { class: 'input', id: 'vcfg-coach', placeholder: 'AI 教练名字（默认用伙伴的名字）', value: c.coachName }));
        el.appendChild(h('div', { class: 'tiny', style: 'margin-top:6px' },
          `今日已用：评测 ${u.ise || 0} · 听写 ${u.iat || 0}（本地自估，控制台可查真实用量）。密钥只存本机浏览器，永不进代码仓库。`));
        /* 测试连接：直接测输入框当前值（不必先保存），结果就地显示 */
        const rd = () => ({
          xfAppId: ($('#vcfg-appid').value || '').trim(), xfApiKey: ($('#vcfg-apikey').value || '').trim(), xfApiSecret: ($('#vcfg-apisecret').value || '').trim(),
          llmBase: ($('#vcfg-llmbase').value || '').trim(), llmKey: ($('#vcfg-llmkey').value || '').trim(), llmModel: ($('#vcfg-llmmodel').value || '').trim()
        });
        const show = (ok, msg) => {
          const m = el.querySelector('[data-role="vtest-msg"]');
          if (!m) return;
          m.textContent = msg; m.style.color = ok ? '#58e08a' : '#ff6b7a';
        };
        el.appendChild(h('div', { class: 'row-gap', style: 'margin-top:10px' },
          h('button', {
            class: 'btn small',
            onclick: async e => {
              e.preventDefault();
              show(true, '🧪 正在测试讯飞（先评测后听写）…');
              const r1 = await VoiceEngine.testXF('ise', rd());
              show(r1.ok, '评测：' + r1.msg);
              const r2 = await VoiceEngine.testXF('iat', rd());
              show(r1.ok && r2.ok, '评测：' + r1.msg + '\n听写：' + r2.msg);
            }
          }, '🧪 测试讯飞'),
          h('button', {
            class: 'btn small',
            onclick: async e => {
              e.preventDefault();
              show(true, '🧪 正在测试 AI 渠道…');
              const r = await VoiceEngine.testLLM(rd());
              show(r.ok, r.msg);
            }
          }, '🧪 测试AI渠道')
        ));
        el.appendChild(h('div', { class: 'tiny', style: 'min-height:18px;white-space:pre-wrap;line-height:1.7', 'data-role': 'vtest-msg' }));
      },
      actions: [{
        label: '💾 保存', cls: 'btn-main', onClick: close => {
          const g = id => ($('#' + id).value || '').trim();
          VoiceEngine.setCfg({
            xfAppId: g('vcfg-appid'), xfApiKey: g('vcfg-apikey'), xfApiSecret: g('vcfg-apisecret'),
            llmBase: g('vcfg-llmbase'), llmKey: g('vcfg-llmkey'), llmModel: g('vcfg-llmmodel'),
            coachName: g('vcfg-coach')
          });
          close();
          toast('语音设置已保存（仅本机）');
          if (typeof renderHome === 'function') renderHome();
        }
      }, { label: '取消', onClick: close => close() }]
    });
  },

  /* ---------- 小工具 ---------- */
  _hint(role, text) {
    const el = document.querySelector(`[data-role="${role}"]`);
    if (el) el.textContent = text;
  }
};
