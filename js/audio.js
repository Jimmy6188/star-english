/* ============================================================
 * 星际求知号 - 音频模块
 * 1) TTS 英语发音（浏览器 speechSynthesis，免费离线）
 * 2) UI 音效（WebAudio 合成，无需音频文件）
 * ============================================================ */

const Sound = (() => {
  let ctx = null;
  let voices = [];
  let preferred = null;   // 英文声音
  let zhPreferred = null; // 中文声音（诗词/知识卡朗读用）
  let speakSeq = 0;       // 朗读序号：取消或新朗读后，排队中的旧朗读作废
  let clipSeq = 0;        // 真人音连播序号：别的朗读一开口，未播完的连播整链作废

  /* 家长面板「发音设置」（v36 方案A）：语速档 0.65 慢速 / 0.85 标准 / 1 原速，
   * 作为全局比例作用在调用方传入的语速上；声音可手动指定，找不到（换设备）回落自动推荐 */
  function rateBase() {
    const v = Store.state && Store.state.settings && parseFloat(Store.state.settings.voiceRate);
    return (v === 0.65 || v === 0.85 || v === 1) ? v : 0.85;
  }
  function chosenEnName() {
    return (Store.state && Store.state.settings && Store.state.settings.voiceName) || '';
  }

  function pickVoice() {
    if (!window.speechSynthesis) return;
    voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    const en = voices.filter(v => /^en(-|_)/i.test(v.lang) || /english/i.test(v.name));
    const chosen = chosenEnName() ? en.find(v => v.name === chosenEnName()) : null;
    preferred = chosen ||
      en.find(v => /Samantha/i.test(v.name)) ||
      en.find(v => /Google US English/i.test(v.name)) ||
      en.find(v => /Zira|Aria/i.test(v.name)) ||
      en.find(v => /United States/i.test(v.lang)) ||
      en[0] || null;
    const zh = voices.filter(v => /^zh([-_]|$)/i.test(v.lang) || /普通话|中文|chinese/i.test(v.name));
    zhPreferred =
      zh.find(v => /zh[-_]CN/i.test(v.lang) && /Xiaoxiao|Xiaoyi|Yunxi|Yunyang/i.test(v.name)) ||
      zh.find(v => /zh[-_]CN/i.test(v.lang) && /Yaoyao|Huihui|Kangkang|Tingting|Ting-Ting/i.test(v.name)) ||
      zh.find(v => /zh[-_]CN/i.test(v.lang) && /Google/i.test(v.name)) ||
      zh.find(v => /zh[-_]CN/i.test(v.lang)) ||
      zh[0] || null;
  }

  function init() {
    if (!window.speechSynthesis) return;
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  /* 供家长面板列出设备上的英文声音（每次现查，声音列表可能晚加载） */
  function enVoices() {
    if (!window.speechSynthesis) return [];
    voices = speechSynthesis.getVoices();
    return voices
      .filter(v => /^en(-|_)/i.test(v.lang) || /english/i.test(v.name))
      .map(v => ({ name: v.name, lang: v.lang }));
  }

  /* 朗读：英文用英文声音，含汉字的文本自动换中文声音（英文声音读中文会静音）。
   * Chrome/Android 上 cancel() 后立刻 speak() 会被吞掉（表现为"第一次能响、
   * 之后再点没声音"）：正在读时先取消、多等一拍再开口，并加一次兜底补读。 */
  function speak(text, rate = 0.85, onEnd) {
    if (!window.speechSynthesis) { if (onEnd) setTimeout(onEnd, 200); return; }
    const seq = ++speakSeq;
    clipSeq++; /* 新朗读开口，未播完的真人音连播作废 */
    const busy = speechSynthesis.speaking || speechSynthesis.pending || speechSynthesis.paused;
    try { speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
    if (speechSynthesis.paused) { try { speechSynthesis.resume(); } catch (e) { /* 忽略 */ } }
    const zh = /[\u3400-\u9fff]/.test(text);
    /* 全局语速档按比例缩放：标准档 ×1 保持原行为，慢速/原速整体偏移 */
    const scaled = Math.max(0.5, Math.min(1.5, rate * (rateBase() / 0.85)));
    let tries = 0;
    const fire = () => {
      if (seq !== speakSeq) return; /* 期间又被取消或被新朗读取代 */
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = zh ? 'zh-CN' : 'en-US';
        u.rate = scaled;
        u.pitch = zh ? 1 : 1.05;
        const v = zh ? zhPreferred : preferred;
        if (v) u.voice = v;
        if (onEnd) u.onend = onEnd;
        let started = false;
        u.onstart = () => { started = true; };
        u.onerror = () => { if (onEnd) onEnd(); };
        speechSynthesis.speak(u);
        /* 兜底：被浏览器吞掉时（400ms 后既没在读也没排队）自动补读一次 */
        if (tries++ === 0) {
          setTimeout(() => {
            if (seq !== speakSeq || started) return;
            if (!speechSynthesis.speaking && !speechSynthesis.pending) fire();
          }, 400);
        }
      } catch (e) { if (onEnd) onEnd(); }
    };
    setTimeout(fire, busy ? 300 : 60);
  }

  function stopSpeak() {
    speakSeq++;
    clipSeq++;
    stopWordAudio();
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  /* ---------- 单词真人发音（v36 方案B：有道词典） ----------
   * 单词/词组的朗读优先放词典音频（常见词为真人录音），网络异常或播放失败
   * 在 1.8 秒内静默回退本机 TTS，孩子无感；整句朗读仍走 speak()。
   * 家长设置：settings.wordVoice = 'youdao'(默认) | 'tts'；voiceType = 'us'(默认) | 'uk' */
  let wordAudio = null;
  let nextAudio = null; /* 连播时预加载的下一个词（衔接不断档） */
  function stopWordAudio() {
    if (wordAudio) {
      try { wordAudio.pause(); wordAudio.src = ''; } catch (e) { /* 忽略 */ }
      wordAudio = null;
    if (nextAudio) {
      try { nextAudio.src = ''; } catch (e) { /* 忽略 */ }
      nextAudio = null;
    }
    }
  }
  function speakWord(word, rate = 0.85) {
    const cfg = Store.state && Store.state.settings;
    const useYd = !(cfg && cfg.wordVoice === 'tts');
    const type = cfg && cfg.voiceType === 'uk' ? 1 : 2;
    if (!word || !useYd || !navigator.onLine) { speak(word, rate); return; }
    clipSeq++;
    const seq = ++speakSeq;
    try { speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
    stopWordAudio();
    let played = false;
    const fallback = () => {
      if (seq !== speakSeq) return;
      stopWordAudio();
      speak(word, rate);
    };
    const giveUp = setTimeout(() => { if (!played) fallback(); }, 1800);
    let a;
    try {
      a = new Audio('https://dict.youdao.com/dictvoice?type=' + type + '&audio=' + encodeURIComponent(word));
    } catch (e) { clearTimeout(giveUp); fallback(); return; }
    wordAudio = a;
    a.onplaying = () => { played = true; clearTimeout(giveUp); };
    a.onended = () => { if (wordAudio === a) wordAudio = null; };
    a.onerror = () => { clearTimeout(giveUp); fallback(); };
    a.play().catch(() => { clearTimeout(giveUp); fallback(); });
  }

  /* 多个单词连播（v36：拼读押韵题"听一听这几个词"）：
   * 逐词播放词典音频，播放当前词时预加载下一个，衔接不断档；
   * 任何一词失败/超时 → 整链回退成一次 TTS 朗读（词表 TTS 读得清楚） */
  function ydType() {
    const cfg = Store.state && Store.state.settings;
    return cfg && cfg.voiceType === 'uk' ? 1 : 2;
  }
  function speakWordSeq(words, rate = 0.9) {
    const cfg = Store.state && Store.state.settings;
    if (!Array.isArray(words) || !words.length) return;
    if ((cfg && cfg.wordVoice === 'tts') || !navigator.onLine) { speak(words.join(', '), rate); return; }
    const my = ++clipSeq;
    try { speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
    stopWordAudio();
    const list = words.map(w => String(w)).filter(Boolean);
    const failAll = () => { if (my === clipSeq) speak(list.join(', '), rate); };
    const step = i => {
      if (i >= list.length || my !== clipSeq) return;
      let a;
      try { a = new Audio('https://dict.youdao.com/dictvoice?type=' + ydType() + '&audio=' + encodeURIComponent(list[i])); }
      catch (e) { failAll(); return; }
      wordAudio = a;
      if (i + 1 < list.length) {
        try { nextAudio = new Audio('https://dict.youdao.com/dictvoice?type=' + ydType() + '&audio=' + encodeURIComponent(list[i + 1])); nextAudio.load(); } catch (e) { /* 预加载失败不影响 */ }
      }
      let played = false;
      const t = setTimeout(() => { if (!played) failAll(); }, 1600);
      a.onplaying = () => { played = true; clearTimeout(t); };
      a.onended = () => { if (my === clipSeq) { wordAudio = null; step(i + 1); } };
      a.onerror = () => { clearTimeout(t); failAll(); };
      a.play().catch(() => { clearTimeout(t); failAll(); });
    };
    step(0);
  }

  /* 整句朗读（v36）：有道接口只认词条/常见短句（任意句子多数会 500），
   * 所以短句（≤6 词）先试词典音频、不行自动回退 TTS；长句直接 TTS */
  function speakSentence(text, rate = 0.82) {
    const cfg = Store.state && Store.state.settings;
    const isEn = /^[A-Za-z0-9 ,.'!?-]+$/.test(text || '');
    const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
    if (isEn && words > 0 && words <= 6 && (text || '').length <= 45 && !(cfg && cfg.wordVoice === 'tts')) {
      speakWord(text, rate); /* 复用单词通道：词典音优先 + 自动回退 */
    } else {
      speak(text, rate);
    }
  }

  /* ---- WebAudio 音效 ---- */
  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slide = 0) {
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  const enabled = () => !(Store.state && Store.state.settings && Store.state.settings.soundOff);

  return {
    init,
    speak,
    speakWord,
    speakWordSeq,
    speakSentence,
    stopSpeak,
    enVoices,
    pickVoice,
    unlock() { ensureCtx(); },
    tap()   { if (enabled()) tone(660, 0.06, 'sine', 0.06); },
    correct() { if (enabled()) { tone(659, 0.12, 'sine', 0.14); tone(880, 0.18, 'sine', 0.14, 0.1); } },
    wrong()   { if (enabled()) { tone(180, 0.16, 'square', 0.08); tone(140, 0.2, 'square', 0.08, 0.12); } },
    coin()    { if (enabled()) { tone(1047, 0.07, 'triangle', 0.12); tone(1568, 0.12, 'triangle', 0.12, 0.07); } },
    stamp()   { if (enabled()) { tone(120, 0.18, 'square', 0.14); tone(90, 0.22, 'square', 0.12, 0.1); } },
    teleport(){ if (enabled()) tone(220, 0.5, 'sawtooth', 0.05, 0, 900); },
    evolve()  { if (enabled()) { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.13, i * 0.09)); } },
    gold()    { if (enabled()) { [784, 988, 1175, 1568, 2093].forEach((f, i) => tone(f, 0.14, 'sine', 0.12, i * 0.07)); } }
  };
})();
