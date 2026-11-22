/* ============================================================
 * 星际求知号 - 语音引擎（口语星系 v47 基础设施）
 * 从 M0 验证页（tools/voice-lab.html，已实测定稿）正式化的引擎层：
 *   1) 讯飞语音评测（流式版）：跟读打分，百分制（ise_unite=1），词级+音节定位
 *   2) 讯飞语音听写（流式版）：自由对话的语音转文字
 *   3) OpenAI 兼容 LLM：AI 点评与角色对话（BaseURL/Key/Model 家长端可配，不锁品牌）
 * 约定：
 *   - 麦克风先行：先拿麦克风再连 WS（权限弹窗期间不空转，服务端不会 read timeout）
 *   - 结束即关麦：每次会话收尾统一 stopRec（防麦克风常开耗电/隐私风险）
 *   - 密钥只存本机 localStorage（star-english-voice-cfg，独立于游戏存档），永不进代码仓库
 *   - 额度本地计数：评测/听写各按讯飞免费额度 500 次/日自估，80% 提醒、500 硬顶
 *   - 浏览器原生 SpeechRecognition 弃用（三星浏览器识别后端走境外，国内不稳）
 * ============================================================ */

const VoiceEngine = {
  CFG_KEY: 'star-english-voice-cfg',
  USAGE_KEY: 'star-english-voice-usage',
  LIMIT: 500,  /* 讯飞免费额度：评测/听写各每日 500 次 */
  SOFT: 400,   /* 80% 提醒线 */
  _cfgCache: null,
  _rec: null,

  /* ---------- 配置（家长填，本机存储） ---------- */
  cfg() {
    if (!this._cfgCache) {
      let c = {};
      try { c = JSON.parse(localStorage.getItem(this.CFG_KEY) || '{}') || {}; } catch (e) { c = {}; }
      this._cfgCache = {
        xfAppId: '', xfApiKey: '', xfApiSecret: '',
        llmBase: '', llmKey: '', llmModel: '',
        coachName: '', rate: 0.85,
        ...c
      };
    }
    return this._cfgCache;
  },
  setCfg(p) {
    const c = Object.assign(this.cfg(), p);
    this._cfgCache = c;
    try { localStorage.setItem(this.CFG_KEY, JSON.stringify(c)); } catch (e) { /* 存储异常忽略 */ }
  },
  cfgReady(kind) {
    const c = this.cfg();
    const missXF = !c.xfAppId || !c.xfApiKey || !c.xfApiSecret;
    if (kind === 'llm') return !missXF && c.llmBase && c.llmKey && c.llmModel;
    return !missXF;
  },

  /* ---------- 每日额度（本地自估，按自然日清零；讯飞控制台可查真实用量） ---------- */
  usage() {
    let u = {};
    try { u = JSON.parse(localStorage.getItem(this.USAGE_KEY) || '{}') || {}; } catch (e) { u = {}; }
    const today = new Date().toISOString().slice(0, 10);
    if (u.date !== today) u = { date: today, ise: 0, iat: 0 };
    return u;
  },
  addUsage(kind) {
    const u = this.usage();
    u[kind] = (u[kind] || 0) + 1;
    try { localStorage.setItem(this.USAGE_KEY, JSON.stringify(u)); } catch (e) { /* 忽略 */ }
    return u[kind];
  },
  quotaLeft(kind) { return Math.max(0, this.LIMIT - (this.usage()[kind] || 0)); },

  /* ---------- 录音：16k PCM（AudioContext 强制 16k，回退手动重采样） ---------- */
  async startRec(onChunk, onLevel) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
    });
    let ctx;
    try { ctx = new AudioContext({ sampleRate: 16000 }); } catch (e) { ctx = new AudioContext(); }
    if (ctx.state === 'suspended') await ctx.resume();
    const src = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(2048, 1, 1);
    src.connect(proc); proc.connect(ctx.destination);
    const needResample = Math.abs(ctx.sampleRate - 16000) > 1;
    proc.onaudioprocess = e => {
      let f32 = e.inputBuffer.getChannelData(0);
      if (needResample) f32 = this._resample(f32, ctx.sampleRate, 16000);
      const pcm = this._f32i16(f32);
      if (onLevel) onLevel(Math.sqrt(f32.reduce((s, v) => s + v * v, 0) / f32.length));
      if (onChunk) onChunk(pcm);
    };
    this._rec = { ctx, stream, proc, src };
  },
  stopRec() {
    if (!this._rec) return;
    const r = this._rec;
    try { r.proc.disconnect(); r.src.disconnect(); } catch (e) { /* 忽略 */ }
    r.stream.getTracks().forEach(t => t.stop());
    try { r.ctx.close(); } catch (e) { /* 忽略 */ }
    this._rec = null;
  },
  _resample(buf, from, to) {
    const ratio = from / to, len = Math.floor(buf.length / ratio), out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const p = i * ratio, j = Math.floor(p), fr = p - j;
      out[i] = buf[j] * (1 - fr) + buf[Math.min(j + 1, buf.length - 1)] * fr;
    }
    return out;
  },
  _f32i16(f) {
    const out = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) {
      const s = Math.max(-1, Math.min(1, f[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return out;
  },

  /* ---------- 讯飞 WS 鉴权（HMAC-SHA256，crypto.subtle） ---------- */
  async _xfyunUrl(host, path, override) {
    const c = override ? Object.assign({}, this.cfg(), override) : this.cfg();
    const date = new Date().toUTCString();
    const origin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(c.xfApiSecret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(origin));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
    const authOrigin = `api_key="${c.xfApiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${sigB64}"`;
    return `wss://${host}${path}?authorization=${encodeURIComponent(btoa(authOrigin))}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}`;
  },
  _b64(u8) { return btoa(String.fromCharCode(...u8)); },

  /* ---------- 连接测试（设置弹窗用；不用麦克风，纯握手+首帧验证鉴权与服务开通） ---------- */
  async testXF(kind, override) {   /* kind: 'ise' | 'iat' */
    const cfg = Object.assign({}, this.cfg(), override || {});
    if (!cfg.xfAppId || !cfg.xfApiKey || !cfg.xfApiSecret) return { ok: false, msg: '讯飞三件套没填全' };
    try {
      const url = await this._xfyunUrl(
        kind === 'ise' ? 'ise-api.xfyun.cn' : 'iat-api.xfyun.cn',
        kind === 'ise' ? '/v2/open-ise' : '/v2/iat', cfg);
      return await new Promise(resolve => {
        let done = false;
        const finish = (ok, msg) => { if (done) return; done = true; clearTimeout(timer); try { ws.close(); } catch (e) { /* 忽略 */ } resolve({ ok, msg }); };
        const ws = new WebSocket(url);
        let timer = setTimeout(() => finish(false, '连接超时（6 秒无响应：查网络）'), 6000);
        ws.onopen = () => {
          /* 握手成功 = 签名鉴权通过。发首帧但不发音频——服务端随后只有三种走向：
           * a) 立即回 code=0 消息（评测常见）→ 成功；
           * b) 回错误 code（服务未开通）→ 失败；
           * c) 一直等音频直到服务端 read timeout 断开 → 正是"服务完全正常"的证明，判成功。 */
          clearTimeout(timer);
          if (kind === 'ise') {
            ws.send(JSON.stringify({ common: { app_id: cfg.xfAppId },
              business: { sub: 'ise', ent: 'en_vip', category: 'read_sentence',
                aue: 'raw', auf: 'audio/L16;rate=16000', tte: 'utf-8', ttp_skip: true,
                ise_unite: '1', cmd: 'ssb', text: '[content]test' },
              data: { status: 0 } }));
          } else {
            ws.send(JSON.stringify({ common: { app_id: cfg.xfAppId },
              business: { language: 'en_us', domain: 'iat', accent: 'en_us' },
              data: { status: 0, format: 'audio/L16;rate=16000', encoding: 'raw', audio: '' } }));
          }
          timer = setTimeout(() => finish(true, '✓ 连接成功（鉴权通过，服务无错误响应）'), 5000);
        };
        ws.onmessage = ev => {
          let m = {}; try { m = JSON.parse(ev.data); } catch (e) { return; }
          const code = m.code;
          if (code !== undefined && code !== 0 && code !== '0') {
            finish(false, '服务返回错误 code=' + code + '：' + (m.message || '') + '（对应服务可能未开通）');
          } else {
            finish(true, '✓ ' + (kind === 'ise' ? '评测' : '听写') + '服务正常（鉴权通过、服务已开通）');
          }
        };
        ws.onerror = () => finish(false, '连接失败（握手被拒）：密钥错误或网络不通');
        ws.onclose = ev => {
          if (done) return;
          const r = ev.reason || '';
          if (r.includes('timeout')) finish(true, '✓ 服务正常（鉴权通过、服务已开通）');
          else finish(false, r ? ('' + r).slice(0, 120) : ('连接关闭 code=' + ev.code + '（常见：密钥错误）'));
        };
      });
    } catch (e) { return { ok: false, msg: '异常：' + e.message }; }
  },
  async testLLM(override) {
    const cfg = Object.assign({}, this.cfg(), override || {});
    if (!cfg.llmBase || !cfg.llmKey || !cfg.llmModel) return { ok: false, msg: 'AI 渠道三项没填全' };
    try {
      let base = (cfg.llmBase || '').trim().replace(/\/+$/, '');
      const url = base.endsWith('/chat/completions') ? base : base + '/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.llmKey },
        body: JSON.stringify({ model: cfg.llmModel, messages: [{ role: 'user', content: 'ping' }], max_tokens: 20, temperature: 0 })
      });
      if (!res.ok) {
        const t = await res.text();
        return { ok: false, msg: 'HTTP ' + res.status + '：' + t.slice(0, 180) + (res.status === 404 ? '（BaseURL 版本段或模型名不对）' : '') };
      }
      const j = await res.json();
      if (j.choices && j.choices[0]) {
        const slow = j.choices[0].finish_reason === 'length' ? '（思考型模型，回复较慢，可换非思考模型提速）' : '';
        return { ok: true, msg: '✓ AI 渠道正常（模型 ' + cfg.llmModel + '）' + slow };
      }
      return { ok: false, msg: '返回结构异常：' + JSON.stringify(j).slice(0, 180) };
    } catch (e) {
      return { ok: false, msg: '网络/直连失败：' + e.message + '（多为该渠道不支持浏览器 CORS 直连，换渠道）' };
    }
  },

  /* ---------- 跟读评测会话 ----------
   * beginRead(text, {onReady, onLevel, onResult, onError}) → { stop() }
   * onResult(res): { total, acc, flu, itg, words:[{text,score}], worst:{word,syll,score} }（百分制） */
  beginRead(text, cb) {
    return this._session('ise', text, cb);
  },
  /* ---------- 听写会话（自由对话） ----------
   * beginDictate({onReady, onLevel, onHeard, onError}) → { stop() }
   * onHeard(text)：识别完成（status=2）回调 */
  beginDictate(cb) { return this._session('iat', null, cb); },

  _session(kind, evalText, cb) {
    const self = this;
    const st = { stopFlag: false, got: false, ws: null, queue: [], timer: null, firstAudio: true, text: '' };
    const MAXMS = kind === 'ise' ? 20000 : 30000;
    if (this.quotaLeft(kind) <= 0) {
      setTimeout(() => cb.onError && cb.onError('今日语音额度已用完（本地计数），明日自动恢复；可到讯飞控制台核对用量'), 0);
      return { stop() {} };
    }
    (async () => {
      try {
        /* 麦克风先行（权限弹窗期间不连服务，避免服务端空等超时） */
        await self.startRec(pcm => st.queue.push(pcm), lv => cb.onLevel && cb.onLevel(lv));
      } catch (err) {
        self.stopRec();
        setTimeout(() => cb.onError && cb.onError('麦克风启动失败：' + err.message + '（检查浏览器是否允许本页使用麦克风）'), 0);
        return;
      }
      let ws;
      try {
        const url = await self._xfyunUrl(
          kind === 'ise' ? 'ise-api.xfyun.cn' : 'iat-api.xfyun.cn',
          kind === 'ise' ? '/v2/open-ise' : '/v2/iat');
        ws = new WebSocket(url);
      } catch (err) {
        self.stopRec();
        setTimeout(() => cb.onError && cb.onError('连接创建失败：' + err.message), 0);
        return;
      }
      st.ws = ws;
      ws.onopen = () => {
        self.addUsage(kind);
        if (cb.onReady) cb.onReady();
        if (kind === 'ise') {
          /* 首帧 ssb：试题文本放 business.text（英文带 [content] 前缀），百分制 ise_unite=1 */
          ws.send(JSON.stringify({
            common: { app_id: self.cfg().xfAppId },
            business: {
              sub: 'ise', ent: 'en_vip', category: 'read_sentence',
              aue: 'raw', auf: 'audio/L16;rate=16000', tte: 'utf-8', ttp_skip: true,
              ise_unite: '1', cmd: 'ssb', text: '[content]' + evalText
            },
            data: { status: 0 }
          }));
        } else {
          ws.send(JSON.stringify({
            common: { app_id: self.cfg().xfAppId },
            business: { language: 'en_us', domain: 'iat', accent: 'en_us', vad_eos: 10000 },
            data: { status: 0, format: 'audio/L16;rate=16000', encoding: 'raw', audio: '' }
          }));
        }
        self._drain(st, kind);
        st.timer = setTimeout(() => { st.stopFlag = true; }, MAXMS); /* 最长录音时长自动收尾 */
      };
      ws.onmessage = ev => {
        let msg = null;
        try { msg = JSON.parse(ev.data); } catch (e) { return; }
        const code = msg.code;
        if (code !== undefined && code !== 0 && code !== '0') {
          st.got = true;
          self._closeSession(st);
          setTimeout(() => cb.onError && cb.onError(
            (kind === 'ise' ? '评测' : '听写') + '返回错误 code=' + code + '：' + (msg.message || '')), 0);
          return;
        }
        if (kind === 'ise') {
          if (msg.data && msg.data.status === 2) {
            st.got = true;
            self._closeSession(st);
            try {
              const res = self._parseEval(msg.data && msg.data.data || '');
              if (res) { if (cb.onResult) cb.onResult(res); }
              else setTimeout(() => cb.onError && cb.onError('评测返回结构无法解析（原始报文已入控制台日志）'), 0);
            } catch (err) {
              setTimeout(() => cb.onError && cb.onError('结果解析异常：' + err.message), 0);
            }
          }
        } else {
          if (msg.data && msg.data.result) {
            try {
              const r = typeof msg.data.result === 'string' ? JSON.parse(msg.data.result) : msg.data.result;
              (r.ws || []).forEach(s => (s.cw || []).forEach(c2 => { st.text += c2.w || ''; }));
            } catch (e) { /* 增量解析失败忽略下一帧重试 */ }
          }
          if (msg.data && msg.data.status === 2) {
            st.got = true;
            self._closeSession(st);
            if (cb.onHeard) cb.onHeard(st.text);
          }
        }
      };
      ws.onerror = () => {
        if (!st.got && cb.onError) cb.onError('语音服务连接失败：检查讯飞密钥、对应服务是否开通、网络');
      };
      ws.onclose = ev => {
        if (!st.got) {
          const r = ev.reason || '';
          const nice = r.includes('timeout')
            ? '网络抖动导致超时，再试一次就好（保持屏幕常亮、勿切后台）'
            : (r ? r.slice(0, 120) : '连接被关闭(code=' + ev.code + ')：检查密钥/服务/额度');
          self._closeSession(st);
          setTimeout(() => cb.onError && cb.onError(nice), 0);
        }
      };
    })();
    return {
      stop() {
        st.stopFlag = true;
        /* 立即尽力发结束帧（drain 也会在队列清空后补发，双保险） */
        if (st.ws && st.ws.readyState === 1) {
          if (kind === 'ise') {
            st.ws.send(JSON.stringify({ business: { cmd: 'auw', aus: 4 }, data: { status: 2, data_type: 1, encoding: 'raw', data: '' } }));
          } else {
            st.ws.send(JSON.stringify({ data: { status: 2, format: 'audio/L16;rate=16000', encoding: 'raw', audio: '' } }));
          }
        }
      }
    };
  },

  _drain(st, kind) {
    const step = () => {
      if (!st.ws || st.ws.readyState !== 1) return;
      if (st.queue.length) {
        const pcm = st.queue.shift();
        if (kind === 'ise') {
          /* 音频帧 auw：aus 1=首帧 2=中间 */
          st.ws.send(JSON.stringify({
            business: { cmd: 'auw', aus: st.firstAudio ? 1 : 2 },
            data: { status: 1, data_type: 1, encoding: 'raw', data: this._b64(new Uint8Array(pcm.buffer)) }
          }));
          st.firstAudio = false;
        } else {
          st.ws.send(JSON.stringify({
            data: { status: 1, format: 'audio/L16;rate=16000', encoding: 'raw', audio: this._b64(new Uint8Array(pcm.buffer)) }
          }));
        }
        setTimeout(step, 40);
      } else if (st.stopFlag) {
        if (kind === 'ise' && !st.sentLast) {
          st.sentLast = true;
          st.ws.send(JSON.stringify({ business: { cmd: 'auw', aus: 4 }, data: { status: 2, data_type: 1, encoding: 'raw', data: '' } }));
        }
        /* 听写的结束帧在 stop() 里已发 */
      } else setTimeout(step, 60);
    };
    setTimeout(step, 50);
  },

  _closeSession(st) {
    clearTimeout(st.timer);
    this.stopRec();
    if (st.ws) { try { st.ws.close(); } catch (e) { /* 忽略 */ } st.ws = null; }
  },

  /* ---------- 评测结果解析（base64 XML，分制自适应 5→百分制） ---------- */
  _parseEval(payload) {
    let raw = (payload || '').trim();
    if (!raw.startsWith('<')) { try { raw = atob(raw); } catch (e) { /* 非base64按原文 */ } }
    const doc = new DOMParser().parseFromString(raw, 'text/xml');
    const chap = doc.querySelector('read_chapter') || doc.querySelector('sentence');
    if (!chap || !chap.getAttribute) return null;
    const get = (el, n) => (el && el.getAttribute) ? el.getAttribute(n) : null;
    const conv = v => {
      if (v === null || v === undefined || v === '') return null;
      const n = +v; if (isNaN(n)) return null;
      return n <= 5 ? Math.round(n * 20) : Math.round(n); /* 5分制→百分制 / 已百分制 */
    };
    const words = [...doc.querySelectorAll('word')]
      .filter(w => get(w, 'global_index') !== null) /* 过滤杂音碎片 */
      .map(w => ({ text: get(w, 'content') || '', score: conv(get(w, 'total_score')) }));
    let worst = null;
    words.forEach(w => { if (w.score !== null && (!worst || w.score < worst.score)) worst = w; });
    let worstSyll = null;
    if (worst) {
      const wEl = [...doc.querySelectorAll('word')].find(w => get(w, 'content') === worst.text);
      if (wEl) [...wEl.querySelectorAll('syll')].forEach(s => {
        const sc = conv(get(s, 'syll_score')), c2 = (get(s, 'content') || '').trim();
        if (sc !== null && (!worstSyll || sc < worstSyll.s)) worstSyll = { s: sc, c: c2 };
      });
    }
    return {
      total: conv(get(chap, 'total_score')) ?? 0,
      acc: conv(get(chap, 'accuracy_score')),
      flu: conv(get(chap, 'fluency_score')),
      itg: conv(get(chap, 'integrity_score')),
      words, worst: worst ? { word: worst.text, syll: worstSyll ? worstSyll.c : '', score: worstSyll ? worstSyll.s : null } : null
    };
  },
  stars(total) { return total >= 80 ? 4 : total >= 65 ? 3 : total >= 50 ? 2 : 1; },

  /* ---------- LLM（OpenAI 兼容端点；思考型模型 token 被思维链耗尽时自动加倍重试） ---------- */
  async llm(messages, maxTokens) {
    const c = this.cfg();
    let base = (c.llmBase || '').trim().replace(/\/+$/, '');
    if (!base) throw new Error('未配置 AI 渠道（家长端设置里填写）');
    const url = base.endsWith('/chat/completions') ? base : base + '/chat/completions';
    const call = async mt => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + c.llmKey },
      body: JSON.stringify({ model: c.llmModel, messages, temperature: 0.8, max_tokens: mt })
    });
    let res = await call(maxTokens || 700);
    if (!res.ok) {
      const t = await res.text();
      throw new Error('HTTP ' + res.status + '：' + t.slice(0, 160) + (res.status === 404 ? '（检查 BaseURL 版本段 /v1 /v4 等）' : ''));
    }
    let j = await res.json();
    let m = j.choices && j.choices[0] && j.choices[0].message;
    if ((!m || !m.content) && j.choices && j.choices[0].finish_reason === 'length') {
      /* 思考型模型：思维链耗尽 token，自动 3 倍加配重试一次 */
      res = await call(Math.min(3000, (maxTokens || 700) * 3));
      j = await res.json();
      m = j.choices && j.choices[0] && j.choices[0].message;
    }
    const txt = m && m.content && m.content.trim();
    if (!txt) throw new Error('模型未返回正文（可能是思考型模型耗尽配额，建议换非思考模型如 deepseek-chat）');
    return txt;
  }
};
