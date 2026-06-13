/*
 * Roadside Japan service worker — progressive, offline-friendly runtime caching.
 *
 * Strategy (no build manifest needed, so it's base-path agnostic):
 *   - Navigations: network-first, fall back to cache, then to the last cached page.
 *     Lets travelers re-open pages they've already visited with no signal.
 *   - Same-origin assets (JS/CSS/img/fonts) + the JSON data feed: stale-while-revalidate
 *     for instant repeat loads that still update in the background.
 *
 * This intentionally does NOT precache hashed build assets. Deeper precaching (Workbox /
 * @vite-pwa) is on the roadmap — see docs/ROADMAP.md. Bump CACHE_VERSION to invalidate.
 */
const CACHE_VERSION = "rj-v1";
const RUNTIME = `${CACHE_VERSION}-runtime`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // leave tiles/CDNs to the network

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME);
        try {
          const fresh = await fetch(req);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return (await cache.match(req)) || (await cache.match(self.location.href)) || Response.error();
        }
      })(),
    );
    return;
  }

  // stale-while-revalidate for assets + data
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })(),
  );
});
