/* 하루결 오프라인 앱 셸 */
const CACHE_VERSION = 'haru-gyeol-v1'
const SHELL_CACHE = `${CACHE_VERSION}-shell`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const SCOPE_URL = new URL('./', self.registration.scope)
const INDEX_URL = new URL('index.html', SCOPE_URL)
const ASSETS_PREFIX = new URL('assets/', SCOPE_URL).pathname

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE)
      await cache.addAll([SCOPE_URL.href, INDEX_URL.href])
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith('haru-gyeol-') && !key.startsWith(CACHE_VERSION),
          )
          .map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'CACHE_URLS' || !Array.isArray(data.urls)) return

  const urls = data.urls.filter((url) => {
    try {
      return new URL(url).origin === self.location.origin
    } catch {
      return false
    }
  })

  event.waitUntil(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE)
      await Promise.allSettled(urls.map((url) => cache.add(url)))
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request)
          if (response.ok) {
            const cache = await caches.open(SHELL_CACHE)
            await cache.put(INDEX_URL.href, response.clone())
          }
          return response
        } catch {
          const cache = await caches.open(SHELL_CACHE)
          return (
            (await cache.match(INDEX_URL.href)) ||
            (await cache.match(SCOPE_URL.href)) ||
            new Response('오프라인 상태예요.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          )
        }
      })(),
    )
    return
  }

  if (!url.pathname.startsWith(ASSETS_PREFIX)) return

  event.respondWith(
    (async () => {
      const cached = await caches.match(request)
      if (cached) return cached
      try {
        const response = await fetch(request)
        if (response.ok) {
          const cache = await caches.open(RUNTIME_CACHE)
          await cache.put(request, response.clone())
        }
        return response
      } catch {
        return new Response('', { status: 503 })
      }
    })(),
  )
})
