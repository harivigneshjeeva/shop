const CACHE_NAME = 'mr-services-v1';
const urlsToCache = [
  '/dashboard',
  '/dashboard/sales',
  '/dashboard/expenses',
  '/dashboard/payroll',
  '/dashboard/profit',
  '/dashboard/targets',
  '/dashboard/forecasting',
  '/dashboard/analytics',
  '/dashboard/reports',
  '/dashboard/shops',
  '/dashboard/staff',
  '/dashboard/settings'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
