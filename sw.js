/* 星际求知号 - 离线缓存（仅在 http(s) 环境生效）
 * 发版时三处版本一起改：这里 / js/app.js 的 APP_VERSION / index.html 的 ?v= 参数
 * v38a：并入拼字擂台键盘布局切换/删除键归位修正（版本号不变，靠本行字节变化触发 SW 重装刷新预缓存） */
const CACHE = 'star-english-v38';
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
  './js/ui-quest.js',
  './js/ui-boss.js',
  './js/ui-math.js',
  './js/ui-think.js',
  './js/ui-phonics.js',
  './js/data-chinese.js',
  './js/ui-subject.js',
  './js/data-science.js',
  './js/data-daofa.js',
  './js/data-junior.js',
  './js/ui-chinese.js',
  './js/ui-reading.js',
  './js/data-sentence.js',
  './js/ui-sentence.js',
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
  /* cache:'reload' 强制绕过 HTTP 缓存，保证预缓存的一定是服务器上的最新文件 */
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (IS_LOCAL) return; /* 本地调试：全部走网络，不读不写缓存 */
  if (e.request.method !== 'GET') return;
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
