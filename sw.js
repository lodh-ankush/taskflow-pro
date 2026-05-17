const CACHE_NAME = 'taskflow-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install: Cache all static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Cache-first strategy with network fallback
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then(networkResponse => {
                        // Don't cache non-success or third-party opaque responses
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Cache successful GET requests for future offline use
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                        return networkResponse;
                    })
                    .catch(() => {
                        // If offline and requesting a page, show cached index.html
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});