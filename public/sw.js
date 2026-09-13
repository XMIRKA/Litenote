// LiteNote Service Worker for Background Push Notifications, Calling, and full PWA installation
const CACHE_NAME = 'litenote-pwa-v3';
const STATIC_ASSETS = ['/', '/favicon.svg', '/manifest.webmanifest', '/pwa-192x192.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA cache prefetch non-fatal:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Full Chrome PWA compliance: must have a fetch event listener
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API routes, Firebase requests, or downloads
  if (url.pathname.startsWith('/api/') || url.hostname.includes('firestore') || url.hostname.includes('googleapis')) {
    return;
  }

  // Network first, cache fallback for non-API navigations & static assets
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/') || caches.match('/index.html');
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Rich Notification Click & Action Handlers (Telegram / Discord Style)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  const urlToOpen = notifData.url || '/';
  const action = event.action;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a LiteNote tab is already open, focus it and navigate
      for (const client of windowClients) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            action,
            data: notifData,
          });
          return client.focus();
        }
      }
      // If no tab is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification Close Handler
self.addEventListener('notificationclose', (event) => {
  // Can be used for analytics or dismissing server-side badge
});

