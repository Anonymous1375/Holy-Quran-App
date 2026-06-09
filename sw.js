const CACHE = 'quran-v3';
const SHELL = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Cache-first for Quran page images (GitHub Pages PNGs)
  if(url.includes('anonymous1375.github.io') || url.endsWith('.png') || url.endsWith('.jpg')) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if(cached) return cached;
        try {
          const fresh = await fetch(e.request);
          if(fresh.ok) cache.put(e.request, fresh.clone());
          return fresh;
        } catch {
          return new Response('', {status: 503});
        }
      })
    );
    return;
  }

  // App shell — cache first
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request)));
});
