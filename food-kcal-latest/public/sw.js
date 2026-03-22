const CACHE_NAME = 'food-tracker-vue-v3'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS)
    }).catch(error => {
      console.log('缓存安装失败:', error)
    })
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  if (url.origin !== location.origin) return
  if (e.request.method !== 'GET') return

  e.respondWith(
    caches.match(e.request).then(response => {
      if (response) return response

      return fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response

        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then(cache => {
          cache.put(e.request, responseToCache)
        })

        return response
      }).catch(() => {
        if (e.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html')
        }
        return new Response('Offline', { status: 503 })
      })
    })
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    })
  )
})