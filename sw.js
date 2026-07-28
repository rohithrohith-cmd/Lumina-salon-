const CACHE_NAME = 'luminastyle-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/css/layout.css',
  '/css/pages.css',
  '/js/utils.js',
  '/js/store.js',
  '/js/seed.js',
  '/js/auth.js',
  '/js/notifications.js',
  '/js/router.js',
  '/js/app.js',
  '/js/views/home.js',
  '/js/views/services.js',
  '/js/views/stylists.js',
  '/js/views/booking.js',
  '/js/views/my-bookings.js',
  '/js/views/profile.js',
  '/js/views/dashboard.js',
  '/js/views/appointments.js',
  '/js/views/availability.js',
  '/js/views/admin-services.js',
  '/js/views/admin-stylists.js'
];

// Install event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event (deletes old caches)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-First strategy (always gets latest files when online)
self.addEventListener('fetch', (e) => {
  // Only handle GET requests and local/http assets
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If valid response, clone and update cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If offline/network fails, load from cache
        return caches.match(e.request);
      })
  );
});
