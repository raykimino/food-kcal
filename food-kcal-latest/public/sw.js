const CACHE_NAME = 'food-tracker-vue-v2'
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
]

// 需要缓存的路径模式
const CACHE_PATTERNS = [
  /\.js$/,
  /\.css$/,
  /\.(png|jpg|jpeg|gif|svg|ico)$/,
  /\/assets\//
]

// 排除的路径模式（如开发工具、API 等）
const EXCLUDE_PATTERNS = [
  /\/@vite\//,
  /\/@react-refresh/,
  /\/@id\//,
  /socket\.io/,
  /hot-update/,
  /\.hot\./
]

// 检查 URL 是否应该被缓存
function shouldCache(url) {
  // 首先检查是否应该排除
  if (EXCLUDE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return false
  }
  
  return CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 缓存静态文件
      return cache.addAll(STATIC_ASSETS).catch(error => {
        console.log('缓存安装失败:', error)
      })
    })
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  
  // 只处理同源请求
  if (url.origin !== location.origin) return
  
  // 只缓存 GET 请求
  if (e.request.method !== 'GET') return
  
  e.respondWith(
    caches.match(e.request).then(response => {
      // 如果有缓存，返回缓存
      if (response) {
        return response
      }
      
      // 没有缓存，尝试网络请求
      return fetch(e.request).then(response => {
        // 检查是否是有效的响应
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }
        
        // 检查是否需要缓存这个资源
        if (shouldCache(url)) {
          // 克隆响应以便缓存
          const responseToCache = response.clone()
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache).catch(error => {
              console.log('缓存失败:', error)
            })
          })
        }
        
        return response
      }).catch(error => {
        console.log('网络请求失败:', error)
        
        // 网络请求失败，对于 HTML 请求返回缓存的 index.html
        if (e.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html')
        }
        
        // 对于其他静态资源，尝试从缓存获取
        if (shouldCache(url)) {
          return caches.match(e.request)
        }
        
        // 返回一个简单的错误响应
        return new Response('网络连接失败', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        })
      })
    })
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})