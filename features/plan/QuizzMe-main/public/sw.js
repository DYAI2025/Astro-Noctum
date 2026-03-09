const CACHE_NAME = 'quizzme-static-v2';
const ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/assets/icons/star.svg',
  '/assets/icons/moon.svg',
  '/assets/icons/crystal.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))))
    )
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isStaticAsset = isSameOrigin && (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/assets') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/favicon.ico'
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
          fetch(request)
            .then((response) => {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
              return response;
            })
            .catch(() => caches.match(request))
      )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
