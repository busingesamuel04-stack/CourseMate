// ═══════════════════════════════════════════════════════════
// CourseMate Service Worker  – v3 (Offline-First PWA)
// ═══════════════════════════════════════════════════════════

const CACHE_NAME        = 'coursemate-shell-v3';
const PAPERS_CACHE_NAME = 'coursemate-papers-cache-v1';

// Academic portal API paths whose responses are snapshotted for offline use
const PORTAL_API_PATHS = [
  '/api/sync/fetch-user-data',
  '/api/watcher/events',
  '/api/notifications/alerts',
  '/api/campus/past-papers',
];

const STATIC_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
];

// ── Route hints from push payload → hash fragments ─────────────────────────
const ROUTE_HINT_MAP = {
  planner:  '/#planner',
  profile:  '/#profile',
  courses:  '/#courses',
  campus:   '/#campus',
};

// ══ Helpers ════════════════════════════════════════════════════════════════

/** Broadcast online/offline state changes to all active clients */
function broadcastConnectivity(isOnline) {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      client.postMessage({ type: 'CONNECTIVITY_CHANGE', isOnline });
    }
  });
}

/** Determine whether a fetch response is suitable for caching */
function isCacheable(response) {
  return response && response.status === 200 && response.type !== 'opaque';
}

/** Is this request for a past-paper PDF blob? */
function isPaperRequest(url) {
  return (
    url.pathname.startsWith('/api/campus/past-papers/') &&
    (url.searchParams.has('download') || url.pathname.endsWith('.pdf'))
  );
}

/** Is this a portal academic data API path? */
function isPortalApiPath(pathname) {
  return PORTAL_API_PATHS.some((p) => pathname.startsWith(p));
}

// ══ Lifecycle: Install ═════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching non-fatal warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ══ Lifecycle: Activate ════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  const allowedCaches = new Set([CACHE_NAME, PAPERS_CACHE_NAME]);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !allowedCaches.has(key))
          .map((key) => {
            console.log('[SW] Purging old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ══ Connectivity Events (broadcast to app) ═════════════════════════════════
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PING_CONNECTIVITY') {
    // Client is asking for the current online status
    event.source?.postMessage({ type: 'CONNECTIVITY_CHANGE', isOnline: true });
  }
});

// ══ Fetch: Unified caching strategy ════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // ── Dev & Non-HTTP bypass: never intercept Vite HMR, source modules, or WS ─
  const isWebSocket = request.headers.get('upgrade') === 'websocket';
  const isViteDev = (
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@fs') ||
    url.pathname.startsWith('/@id') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('vite-hmr') ||
    url.searchParams.has('t') ||
    url.search.includes('?t=') ||
    url.search.includes('&t=') ||
    url.searchParams.has('import') ||
    url.searchParams.has('html-proxy') ||
    /\.(tsx?|jsx?|vue|svelte|map)(\?|$)/i.test(url.pathname + url.search)
  );
  if (isWebSocket || isViteDev || !url.protocol.startsWith('http')) return;

  // ── Strategy 1: Past-paper PDF blobs → Cache-First ──────────────────────
  // Downloaded PDFs are stored in a separate long-lived cache so students can
  // read saved past papers even when campus Wi-Fi is unavailable.
  if (isPaperRequest(url)) {
    event.respondWith(
      caches.match(request, { cacheName: PAPERS_CACHE_NAME }).then((cached) => {
        if (cached) {
          console.log('[SW] Serving past-paper PDF from cache:', url.pathname);
          return cached;
        }
        return fetch(request).then((net) => {
          if (isCacheable(net)) {
            caches.open(PAPERS_CACHE_NAME).then((c) => c.put(request, net.clone()));
          }
          return net;
        }).catch(() => {
          return new Response('Past paper not available offline.', { status: 503 });
        });
      })
    );
    return;
  }

  // ── Strategy 2: Portal academic data APIs → Network-first + IDB snapshot ─
  // Registered courses, CGPA, tuition ledger, and timetable snapshots are
  // cached in CacheStorage so the dashboard opens instantly on offline starts.
  if (isPortalApiPath(url.pathname)) {
    event.respondWith(
      fetch(request.clone())
        .then((response) => {
          if (isCacheable(response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request, { cacheName: CACHE_NAME });
          if (cached) {
            console.log('[SW] Portal API offline fallback for:', url.pathname);
            // Clone and patch the response to signal it's from cache
            const data = await cached.json().catch(() => ({}));
            return new Response(
              JSON.stringify({ ...data, _offlineCache: true }),
              { headers: { 'Content-Type': 'application/json' }, status: 200 }
            );
          }
          return new Response(
            JSON.stringify({ offline: true, message: 'Portal data cached snapshot unavailable.' }),
            { headers: { 'Content-Type': 'application/json' }, status: 200 }
          );
        })
    );
    return;
  }

  // ── Strategy 3: Other API calls → Network-first with JSON fallback ───────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isCacheable(response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ offline: true, message: 'You are offline. Cached data shown.' }),
            { headers: { 'Content-Type': 'application/json' }, status: 200 }
          );
        })
    );
    return;
  }

  // ── Strategy 4: App Shell (HTML, CSS, JS, fonts) → Stale-While-Revalidate
  // Return cached copy immediately, then update cache silently in background.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Background revalidation
        fetch(request)
          .then((net) => {
            if (isCacheable(net)) {
              caches.open(CACHE_NAME).then((c) => c.put(request, net));
            }
          })
          .catch(() => {});
        return cached;
      }

      // Not cached yet → fetch and cache
      return fetch(request)
        .then((net) => {
          if (isCacheable(net)) {
            const clone = net.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return net;
        })
        .catch(async () => {
          if (request.mode === 'navigate') {
            return (await caches.match('/index.html')) || (await caches.match('/'));
          }
          return new Response('Offline – asset not cached', { status: 503 });
        });
    })
  );
});

// ══ Push: Display native system notification ════════════════════════════════
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      title: 'CourseMate Alert',
      body: event.data ? event.data.text() : 'You have a new update.',
    };
  }

  const title   = payload.title   || 'CourseMate';
  const body    = payload.body    || 'You have a new campus update.';
  const icon    = payload.icon    || '/icon-192.png';
  const badge   = payload.badge   || '/icon-192.png';
  const tag     = payload.tag     || 'coursemate-alert';
  const data    = payload.data    || {};

  const options = {
    body,
    icon,
    badge,
    tag,
    data,
    renotify: true,
    requireInteraction: data.routeHint === 'planner', // Exam alerts stay until dismissed
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open',    title: '📖 Open CourseMate' },
      { action: 'dismiss', title: '✕ Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ══ Notification Click: Focus app and route to correct screen ═══════════════
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const data = event.notification.data || {};
  const routeHint = data.routeHint || 'courses';
  const targetHash = ROUTE_HINT_MAP[routeHint] || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_ROUTE',
            routeHint,
            category: data.category,
            courseCode: data.courseCode,
          });
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin + targetHash);
      }
    })
  );
});

// ══ Background Sync (portal check, triggered by app) ═══════════════════════
self.addEventListener('sync', (event) => {
  if (event.tag === 'portal-check') {
    event.waitUntil(
      fetch('/api/sync/check-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'background-sync' }),
      })
        .then((resp) => resp.json())
        .then((result) => {
          if (result.alertsDispatched > 0) {
            console.log('[SW] Background portal check dispatched', result.alertsDispatched, 'alerts.');
          }
        })
        .catch((err) => {
          console.warn('[SW] Background portal check failed:', err.message);
        })
    );
  }
});
