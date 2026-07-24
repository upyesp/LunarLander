/* ============================================================
   Lunar Lander - Service Worker (offline / installable PWA)
   ------------------------------------------------------------
   Strategy:
   * On install: pre-cache the full app shell (HTML, CSS, all JS,
     icons). This makes every scene/asset available offline.
   * On fetch: CACHE-FIRST.
       - If a response is cached, serve it instantly.
       - Otherwise hit the network and, for cacheable GETs, store a
         copy. This is how the Phaser engine (loaded from a CDN in
         index.html) gets cached on the first online load so the game
         runs fully offline afterwards.
       - If the network fails (e.g. fully offline navigation), fall
         back to the cached index.html.
   Bump CACHE to invalidate stale assets on next deploy.
   ============================================================ */

const CACHE = 'lunarlander-v1';

// App shell. Relative URLs resolve against the SW's scope (repo root).
const CORE = [
  './',
  './index.html',
  './favicon.svg',
  './manifest.webmanifest',
  './css/style.css',
  './js/util.js',
  './js/audio.js',
  './js/domui.js',
  './js/main.js',
  './js/scenes/Boot.js',
  './js/scenes/Menu.js',
  './js/scenes/Settings.js',
  './js/scenes/Game.js',
  './js/scenes/GameOver.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // addAll is all-or-nothing; every core asset must succeed.
    await cache.addAll(CORE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // only cache reads

  event.respondWith((async () => {
    // 1. Cache first.
    const cached = await caches.match(req);
    if (cached) return cached;

    // 2. Network, caching cacheable responses on the way back.
    try {
      const res = await fetch(req);
      const url = new URL(req.url);
      const cacheable =
        (res.ok || res.type === 'opaque') &&
        res.status !== 206 &&                 // skip partial/range responses
        url.protocol.startsWith('http') &&
        req.mode !== 'navigate';              // navigations handled below
      if (cacheable) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch (err) {
      // 3. Offline fallback for navigations -> the cached app shell.
      if (req.mode === 'navigate') {
        const fallback =
          await caches.match('./index.html') ||
          await caches.match('./') ||
          await caches.match(req, { ignoreSearch: true });
        if (fallback) return fallback;
      }
      throw err;
    }
  })());
});
