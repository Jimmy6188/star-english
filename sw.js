/* 星际求知号 - 离线缓存（仅在 http(s) 环境生效）
 * 发版时三处版本一起改：这里 / js/app.js 的 APP_VERSION / index.html 的 ?v= 参数
 * v38a：并入拼字擂台键盘布局切换/删除键归位修正（版本号不变，靠本行字节变化触发 SW 重装刷新预缓存）
 * v38b：app.js 注册加 updateViaCache:'none'（绕过 Pages CDN 缓存，修 Pad 上补丁刷不出）+ 新 SW 接管时页面自动重载一次（版本号仍不变）
 * v39：只出已学出题策略 + Boss⚡拔高 + KET对话/应用题专项/飞花令/听写大会 + 错题闭环 + 衣橱27件 + 万圣节活动（全量重预缓存，新增 data-ket/ui-ket）
 * v40：数独候选数 + 4/6/9 宫三档难度 + 知识点骨架/错题挂点 + 家长端知识地图/小测/复习路线 + 数学知识点闯关 + 5处内容纠错（全量重预缓存，新增 data-kp/ui-kp/data-math-kp）
 * v44：24点自由拼 + 英语拼写求助（仅自由练）+ 主科全达白屏修复 + 手写判分修复 + 小古文40篇 + KET对话40段 + KET词汇站（1735词）+ 江山时序外链（全量重预缓存，新增 data-ketwords/ui-ketwords）
 * v44b：江山时序改新窗口打开（对方域名无 HTTPS，https 页面 iframe 嵌 http 被混合内容拦截黑屏；版本号不变，靠本行字节变化触发 SW 重装刷新预缓存）
 * v45：修 Pad 上补丁刷不出来——①页面导航改网络优先（3 秒超时回缓存），HTML 不再永远吃旧缓存；②预缓存改逐文件容错，个别下载失败不卡死整轮更新；③HTML 用 cache:'reload' 每次导航强制回源（全量重预缓存） */
const CACHE = 'star-english-v46';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/data-ipa.js',
  './js/audio.js',
  './js/store.js',
  './js/ui-kit.js',
  './js/ui-handwrite.js',
  './js/ui-screens.js',
  './js/ui-kp.js',
  './js/ui-quest.js',
  './js/ui-boss.js',
  './js/ui-math.js',
  './js/ui-think.js',
  './js/ui-phonics.js',
  './js/data-chinese.js',
  './js/data-poems-extra.js',
  './js/data-kp.js',
  './js/ui-subject.js',
  './js/data-science.js',
  './js/data-daofa.js',
  './js/data-math-kp.js',
  './js/data-junior.js',
  './js/ui-chinese.js',
  './js/ui-reading.js',
  './js/data-sentence.js',
  './js/ui-sentence.js',
  './js/data-ket.js',
  './js/ui-ket.js',
  './js/data-ketwords.js',
  './js/data-scene.js',
  './js/ui-ketwords.js',
  './js/ui-scene.js',
  './js/data-junior-prep.js',
  './js/data-writing.js',
  './js/ui-writing.js',
  './js/data-arena.js',
  './js/ui-arena.js',
  './js/ui-extras.js',
  './js/app.js',
  './fonts/baloo2-latin.woff2',
  './fonts/baloo2-latin-800.woff2',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* 本地调试（localhost / 127.0.0.1）不启用任何缓存：
 * 改完文件刷新页面立即生效，避免调试时被旧缓存挡住；线上（GitHub Pages）不受影响 */
const IS_LOCAL = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

self.addEventListener('install', e => {
  if (IS_LOCAL) { self.skipWaiting(); return; }
  /* v45：预缓存改逐文件容错——cache:'reload' 强制绕过 HTTP 缓存拿最新，
   * 但个别文件下载失败（家里网络访问 Pages 不稳）不再卡死整轮更新：
   * 失败的文件留给运行时 fetch miss 回填。原来全有全无的 addAll 一旦
   * 失败新 SW 永远装不上，设备就一直停在旧版本 */
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(ASSETS.map(async u => {
      try {
        const res = await fetch(new Request(u, { cache: 'reload' }));
        if (res.ok) await c.put(u, res);
      } catch (err) { /* 单文件失败留给运行时回填 */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (IS_LOCAL) return; /* 本地调试：全部走网络，不读不写缓存 */
  if (e.request.method !== 'GET') return;
  /* v45：页面导航（index.html）改网络优先——原来全 cache-first 连 HTML
   * 都吃旧缓存，旧 SW 在位时刷新永远拿旧页面，补丁刷不出来。
   * 3 秒内网络响应就用新版；超时/断网先回缓存（离线打开不卡住）。
   * 即使本次超时放弃，后台回填仍会完成 → 下次刷新缓存已是新页 */
  if (e.request.mode === 'navigate') {
    e.respondWith((async () => {
      const cached = await caches.match(e.request);
      const net = fetch(e.request, { cache: 'reload' }).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
      try {
        return await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('nav-slow')), 3000))]);
      } catch (err) {
        return cached || net;
      }
    })());
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => hit))
  );
});
