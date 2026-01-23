// Service Worker for Paytranche PWA - Minimal and Safe
const CACHE_NAME = 'paytranche-v4';
const RUNTIME_CACHE = 'paytranche-runtime-v4';

// Basic resources to cache
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('❌ Erreur cache installation:', err))
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('🗑️  Suppression ancien cache:', cacheName);
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
  const { request } = event;
  
  // Pour les requêtes de navigation (page reload)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache la page en cas de succès
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // En offline, servir depuis le cache ou la page d'accueil
          return caches.match(request).then(response => {
            return response || caches.match('/').then(homeResponse => {
              return homeResponse || new Response(
                'Offline - Connectez-vous à internet pour continuer',
                { status: 503, statusText: 'Service Unavailable' }
              );
            });
          });
        })
    );
  }
  // Pour les autres requêtes, laisser faire normalement
  // (les données de l'app restent accessibles via localStorage même en offline)
});

// Message event pour nettoyer les vieux caches si nécessaire
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker chargé - PWA prête');