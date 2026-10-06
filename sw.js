/* 星际求知号 - 离线缓存（仅在 http(s) 环境生效） */
const CACHE = 'star-english-v29';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/data-ipa.js',
  './js/audio.js',
  './js/store.js',
  './js/ui-kit.js',
  './js/ui-screens.js',
  './js/ui-quest.js',
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
  './js/ui-extras.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
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
