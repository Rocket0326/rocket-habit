// Rocket habit PWA service worker
// Bump CACHE_VERSION only when a real content update ships (deploy script handles it).
const CACHE_VERSION = 'rocket-habit-750852c0';
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

  // Navigation requests: stale-while-revalidate -> instant load + background refresh
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(req).then((cached) => {
          const fetched = fetch(req)
            .then((res) => {
              if (res && res.status === 200) cache.put(req, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || fetched;
        })
      )
    );
    return;
  }

  // Static assets: cache-first with background refresh
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
