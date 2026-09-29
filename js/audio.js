/* ============================================================
 * 星际英语站 - 音频模块
 * 1) TTS 英语发音（浏览器 speechSynthesis，免费离线）
 * 2) UI 音效（WebAudio 合成，无需音频文件）
 * ============================================================ */

const Sound = (() => {
  let ctx = null;
  let voices = [];
  let preferred = null;

  function pickVoice() {
    voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (!voices.length) return;
    const en = voices.filter(v => /^en(-|_)/i.test(v.lang) || /english/i.test(v.name));
    preferred =
      en.find(v => /Samantha/i.test(v.name)) ||
      en.find(v => /Google US English/i.test(v.name)) ||
      en.find(v => /Zira|Aria/i.test(v.name)) ||
      en.find(v => /United States/i.test(v.lang)) ||
      en[0] || null;
  }

  function init() {
    if (!window.speechSynthesis) return;
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  /* 朗读英文（可传单词或句子） */
  function speak(text, rate = 0.85, onEnd) {
    if (!window.speechSynthesis) { if (onEnd) setTimeout(onEnd, 200); return; }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = rate;
      u.pitch = 1.05;
      if (preferred) u.voice = preferred;
      if (onEnd) u.onend = onEnd;
      speechSynthesis.speak(u);
    } catch (e) { if (onEnd) onEnd(); }
  }

  function stopSpeak() {
    if (window.speechSynthesis) speechSynthesis.cancel();
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
    stopSpeak,
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
