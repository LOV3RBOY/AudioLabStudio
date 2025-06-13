/// <reference lib="webworker" />

export {};

declare global {
  interface SyncEvent extends ExtendableEvent {
    readonly lastChance: boolean;
    readonly tag: string;
  }

  interface ServiceWorkerGlobalScopeEventMap {
    sync: SyncEvent;
  }
}

const sw = self as unknown as ServiceWorkerGlobalScope;

/**
 * Service Worker for PWA functionality
 * 
 * Provides offline capabilities, caching strategies, and background sync
 * for the AI audio production tool.
 */

const CACHE_NAME = 'ai-audio-tool-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/mask-icon.svg',
];

// Install event - cache static files
sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => sw.skipWaiting())
  );
});

// Activate event - clean up old caches
sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => sw.clients.claim())
  );
});

// Fetch event - handle requests with caching strategies
sw.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle audio files
  if (request.destination === 'audio' || url.pathname.includes('.wav') || url.pathname.includes('.mp3')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html') as Promise<Response>)
    );
    return;
  }

  // Default strategy
  event.respondWith(networkFirst(request));
});

// Caching strategies

async function networkFirst(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Network error', { status: 408 });
  }
}

async function cacheFirst(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('Resource not available', { status: 404 });
  }
}

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => new Response('Network error', { status: 408 }));
  
  return cachedResponse || networkResponsePromise;
}

// Background sync for offline actions
sw.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'background-mix') {
    event.waitUntil(processPendingMixes());
  }
});

async function processPendingMixes() {
  // Process any pending mix jobs when connection is restored
  try {
    const pendingMixes = await getStoredPendingMixes();
    
    for (const mix of pendingMixes) {
      try {
        await fetch('/api/mixJobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mix)
        });
        
        // Remove from pending list
        await removePendingMix(mix.id);
      } catch (error) {
        console.log('Failed to sync mix:', error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Push notifications
sw.addEventListener('push', (event: PushEvent) => {
  const options = {
    body: event.data ? event.data.text() : 'Your mix is ready!',
    icon: '/apple-touch-icon.png',
    badge: '/mask-icon.svg',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    sw.registration.showNotification('AI Audio Tool', options)
  );
});

// Notification click handler
sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  event.waitUntil(
    sw.clients.matchAll({ type: 'window' })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (sw.clients.openWindow) {
          return sw.clients.openWindow(event.notification.data.url);
        }
      })
  );
});

// Message handling
sw.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    sw.skipWaiting();
  }
});

// Helper functions for IndexedDB operations
async function getStoredPendingMixes(): Promise<any[]> {
  // Simplified - would use IndexedDB in real implementation
  return [];
}

async function removePendingMix(id: any) {
  // Simplified - would use IndexedDB in real implementation
  return true;
}
