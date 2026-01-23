// Service Worker for Paytranche PWA - Minimal and Safe
const CACHE_NAME = 'paytranche-v4';

// Basic resources to cache
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Minimal fetch event - only for basic offline support
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests for basic offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/').then(response => {
          return response || new Response('Offline - Connectez-vous à internet', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
    );
  }
});