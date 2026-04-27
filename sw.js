const CACHE_NAME = 'fee-manager-cache-v1';
const API_CACHE_NAME = 'fee-manager-api-cache-v1';

// List of static assets to cache on install
const urlsToCache = [
    '/',
    '/index.html',
    '/index.css', // Assuming your main CSS is here
    // Add your JavaScript bundles here, e.g., '/assets/index-XXXX.js'
    // You might need to dynamically get these from your build output
    // For development, you might not cache JS bundles or only cache /src/main.jsx etc.
    // For production, Vite generates hashed filenames, so you'd need a build step
    // to inject these into this array or use a more dynamic caching strategy.
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching static assets:', urlsToCache);
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('[Service Worker] Failed to cache on install:', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                    return null;
                }).filter(Boolean)
            );
        })
    );
    // Ensure the service worker takes control of the page immediately
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only cache GET requests
    if (request.method !== 'GET') {
        return;
    }

    // API calls: Network-first strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then(async (response) => {
                    const cache = await caches.open(API_CACHE_NAME);
                    cache.put(request, response.clone()); // Cache API responses
                    return response;
                })
                .catch(() => caches.match(request)) // Fallback to cache if network fails
        );
    } else {
        // Static assets: Cache-first strategy
        event.respondWith(caches.match(request).then((response) => response || fetch(request)));
    }
});