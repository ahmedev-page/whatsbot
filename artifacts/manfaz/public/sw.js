// Minimal, dependency-free service worker.
//
// Deliberately does NOT cache or intercept navigation (HTML page) requests
// or any API call — every page load and every data fetch always goes to
// the network untouched. Caching a per-route copy of the SPA shell added
// no real value (the HTML is identical for every route — the actual site
// content is fetched separately by client-side JS) while being a plausible
// source of confusing "why isn't my update showing" reports during active
// iteration, so it's not worth the risk here.
//
// The one thing this still safely caches is same-origin static assets
// (JS/CSS/images/fonts) — Vite content-hashes these filenames, so a cached
// copy is never stale: it's simply a different URL after the next deploy.

const CACHE_NAME = "orxai-assets-v4";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.mode === "navigate") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache Vite source modules or CSS bundles to prevent stale styling on mobile
  if (url.pathname.startsWith("/src/") || url.pathname.startsWith("/@") || /\.(?:js|css|ts|tsx)$/.test(url.pathname)) {
    return;
  }

  const isStaticMedia = /\.(?:woff2?|ttf|png|jpg|jpeg|webp|svg|ico)$/.test(url.pathname);
  if (!isStaticMedia) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
