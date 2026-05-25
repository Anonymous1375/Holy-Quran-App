const CACHE = 'quran-v1';
const STATIC = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://static-cdn.tarteel.ai/qul/fonts/nastaleeq/Hanafi/normal-v4.2.2/with-waqf-lazmi/font.ttf'
];

// Install — cache static assets immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for Quran API pages, cache-then-network for everything else
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Quran page API calls — cache permanently once loaded
  if (url.includes('api.qurancdn.com') || url.includes('qurancdn.com')) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const fresh = await fetch(e.request);
          if (fresh.ok) cache.put(e.request, fresh.clone());
          return fresh;
        } catch {
          return new Response('{"verses":[]}', { headers: { 'Content-Type': 'application/json' } });
        }
      })
    );
    return;
  }

  // Font — cache permanently
  if (url.includes('tarteel.ai') || url.includes('fonts')) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const fresh = await fetch(e.request);
        if (fresh.ok) cache.put(e.request, fresh.clone());
        return fresh;
      })
    );
    return;
  }

  // App shell — cache first, network fallback
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
