/*
 * Cardex service worker — offline support for a fully static site.
 * Strategy:
 *   - hashed build assets (/_astro/*) → cache-first (immutable)
 *   - navigations & everything else same-origin → network-first, falling
 *     back to cache when offline (and to the cached home page as a last
 *     resort for navigations).
 * No precache manifest: the cache fills as the user visits pages, so it
 * survives content updates without a build-time asset list.
 */
const CACHE = 'cardex-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        const hit = await cache.match(req);
        if (hit) return hit;
        if (req.mode === 'navigate') {
          const home = await cache.match('/');
          if (home) return home;
        }
        throw err;
      }
    })(),
  );
});
