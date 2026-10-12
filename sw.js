
const CACHE_NAME = 'likenet-cache-v2';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Instalasi Service Worker baru
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Hapus cache versi lama dan aktifkan versi baru
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(name =>
              name.startsWith('likenet-cache-') &&
              name !== CACHE_NAME
            )
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Utamakan file terbaru dari server, gunakan cache jika offline
self.addEventListener('fetch', event => {
  const request = event.request;

  if (
    request.method !== 'GET' ||
    new URL(request.url).origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const response = await fetch(request);

        if (response.ok) {
          await cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        if (request.mode === 'navigate') {
          const offlinePage = await cache.match('./index.html');

          if (offlinePage) {
            return offlinePage;
          }
        }

        throw error;
      }
    })()
  );
});
