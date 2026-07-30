/* ══════════════════════════════════════════════════════════════
   Al Mokhtabar Laboratory — Service Worker v1.0
   ══════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const FONT_CACHE = `fonts-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const PAGE_CACHE = `pages-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

const MAX_IMAGE_CACHE = 100;
const MAX_API_CACHE = 50;
const MAX_PAGE_CACHE = 30;

/* ─── Install ─── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting()),
  );
});

/* ─── Activate ─── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !key.includes(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      );
    }).then(() => self.clients.claim()),
  );
});

/* ─── Fetch Strategy ─── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Same-origin only
  if (url.origin !== self.location.origin) return;

  // Skip non-GET
  if (request.method !== 'GET') return;

  // Static assets: Cache-first
  if (url.pathname.startsWith('/_next/static')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Images: Cache-first with size limit
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/)) {
    event.respondWith(cacheFirstWithLimit(request, IMAGE_CACHE, MAX_IMAGE_CACHE));
    return;
  }

  // Fonts: Cache-first
  if (url.pathname.startsWith('/fonts')) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // API calls: Network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithLimit(request, API_CACHE, MAX_API_CACHE));
    return;
  }

  // Navigation pages: Network-first
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithLimit(request, PAGE_CACHE, MAX_PAGE_CACHE));
    return;
  }

  // Everything else: Network-first
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

/* ─── Cache Strategies ─── */

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function cacheFirstWithLimit(request, cacheName, maxItems) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      if (keys.length >= maxItems) {
        await cache.delete(keys[0]);
      }
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithLimit(request, cacheName, maxItems) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      if (keys.length >= maxItems) {
        await cache.delete(keys[0]);
      }
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    return new Response('Offline', { status: 503 });
  }
}

/* ─── Message handler (skip waiting) ─── */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
