// Service Worker for Paytranche PWA - Simple and Safe
const CACHE_NAME = 'paytranche-v3';

// Resources to cache for offline use
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.svg',
  '/icon-512.svg'
];

// Install event - cache basic resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
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
  self.clients.claim();
});

// Fetch event - simple offline support
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip Firebase requests (let them handle offline naturally)
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('paydunya.com')) {
    return;
  }

  // Only cache navigation requests and static assets
  if (request.mode === 'navigate' ||
      urlsToCache.includes(url.pathname) ||
      request.destination === 'document') {

    event.respondWith(
      caches.match(request)
        .then((response) => {
          // Return cached version or fetch from network
          if (response) {
            return response;
          }

          return fetch(request).then((networkResponse) => {
            // Cache successful responses
            if (networkResponse.ok && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          }).catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/').then(cachedResponse => {
                return cachedResponse || new Response('Offline', { status: 503 });
              });
            }
          });
        })
    );
  }
});