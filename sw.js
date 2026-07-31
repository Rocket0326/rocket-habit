// Rocket habit PWA service worker
// 导航请求使用 network-first：每次打开都拉取最新 index.html，部署后无需手动硬刷新即可更新；
// 静态资源（图标/清单）仍 cache-first，离线可用。离线时导航回退到缓存。
// CACHE_VERSION 在每次内容更新时变更（deploy 脚本会自动 bump 成时间戳），旧缓存会在 activate 时清理。
const CACHE_VERSION = 'rocket-habit-20260731204000';
const APP_SHELL = [
  '/rocket-habit/',
  '/rocket-habit/index.html',
  '/rocket-habit/icon-192.png',
  '/rocket-habit/icon-512.png',
  '/rocket-habit/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 导航请求：network-first -> 始终拿到最新页面；离线时回退缓存
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            caches.open(CACHE_VERSION).then((c) => c.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('/rocket-habit/index.html')))
    );
    return;
  }

  // 静态资源：cache-first + 后台刷新
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          if (res && res.status === 200) caches.open(CACHE_VERSION).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});
