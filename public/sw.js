// Terra Incognita — Service Worker
// FIX #19 — Support offline basique : cache les assets statiques et les tuiles de carte

const CACHE_NAME = 'terra-incognita-v1'
const TILE_CACHE_NAME = 'terra-tiles-v1'

// Assets statiques à précacher au premier chargement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
]

// ── Install : précache les assets statiques ──────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// ── Activate : nettoyage des anciens caches ──────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== TILE_CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ── Fetch : stratégie par type de ressource ──────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Tuiles CartoCDN → cache-first (les tuiles ne changent pas)
  if (url.hostname.includes('basemaps.cartocdn.com')) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        try {
          const response = await fetch(event.request)
          if (response.ok) cache.put(event.request, response.clone())
          return response
        } catch {
          return new Response('', { status: 503 })
        }
      })
    )
    return
  }

  // Assets statiques → cache-first avec fallback réseau
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).catch(() =>
          caches.match('/index.html') // SPA fallback
        )
      })
    )
    return
  }

  // Overpass / Nominatim → network-first (données dynamiques, pas de cache)
  // On laisse passer sans interception
})
