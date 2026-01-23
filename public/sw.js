// Service Worker for Paytranche PWA - Enhanced Offline Support
const CACHE_NAME = 'paytranche-v2';
const STATIC_CACHE = 'paytranche-static-v2';
const DYNAMIC_CACHE = 'paytranche-dynamic-v2';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.svg',
  '/icon-512.svg',
  '/market-background.jpg',
  '/browserconfig.xml'
];

// API endpoints to cache for offline use
const API_CACHE_PATTERNS = [
  /\/api\/clients/,
  /\/api\/transactions/,
  /\/api\/subscription-plans/
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip Firebase/Firestore requests (let them handle offline)
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firestore.googleapis.com')) {
    return;
  }

  // Skip PayDunya payment requests
  if (url.hostname.includes('paydunya.com')) {
    return;
  }

  // Handle API requests with offline support
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets - Cache First strategy
  if (STATIC_ASSETS.includes(url.pathname) || request.destination === 'style' || request.destination === 'script') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Handle pages - Network First with cache fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default - Network First strategy
  event.respondWith(networkFirst(request));
});

// Cache First strategy for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('❌ Cache first failed:', error);
    // Return offline fallback for critical resources
    if (request.url.includes('/manifest.json')) {
      return new Response(JSON.stringify({
        name: "PayTranche",
        short_name: "PayTranche",
        description: "Application hors ligne",
        start_url: "/",
        display: "standalone"
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

// Network First strategy with cache fallback
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed, trying cache:', error.message);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/');
      if (offlineResponse) {
        return offlineResponse;
      }

      // Fallback offline page
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PayTranche - Hors ligne</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline { max-width: 400px; margin: 0 auto; }
            .icon { font-size: 48px; color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="offline">
            <div class="icon">📱</div>
            <h1>Application hors ligne</h1>
            <p>Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées.</p>
            <p>Vérifiez votre connexion internet et réessayez.</p>
            <button onclick="window.location.reload()">Réessayer</button>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    throw error;
  }
}

// Handle API requests with offline support
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('🔌 API offline, trying cache:', error.message);

    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator to response
      const offlineResponse = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: {
          ...cachedResponse.headers,
          'X-Offline': 'true'
        }
      });
      return offlineResponse;
    }

    // Return offline API response
    return new Response(JSON.stringify({
      success: false,
      offline: true,
      message: 'Application hors ligne - Données depuis cache',
      data: []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);

  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '2.0.0' });
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-sync') {
    event.waitUntil(doPeriodicSync());
  }
});

// Sync pending offline actions
async function syncPendingActions() {
  console.log('🔄 Synchronisation des actions en attente...');

  try {
    // Get pending actions from IndexedDB (if implemented)
    // For now, just log
    console.log('✅ Synchronisation terminée');
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
  }
}

// Periodic sync for maintenance
async function doPeriodicSync() {
  console.log('📅 Synchronisation périodique...');

  try {
    // Clean old cache entries
    const cache = await caches.open(DYNAMIC_CACHE);
    const keys = await cache.keys();

    // Remove entries older than 1 day
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const date = response.headers.get('date');
        if (date && new Date(date).getTime() < oneDayAgo) {
          await cache.delete(request);
        }
      }
    }

    console.log('🧹 Nettoyage du cache terminé');
  } catch (error) {
    console.error('❌ Erreur nettoyage périodique:', error);
  }
}

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      vibrate: [100, 50, 100],
      data: data.data
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});