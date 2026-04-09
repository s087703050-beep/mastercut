const CACHE_NAME = 'dechang-v4';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './calculator.js',
  './cat.jpg',
  './manifest.json'
];

// Install Event - 立即啟用新版本
self.addEventListener('install', event => {
  self.skipWaiting(); // 強制新 SW 立即接管
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Event - 清除舊快取並接管所有頁面
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim(); // 立即接管所有已開啟的頁面
    })
  );
});

// Fetch Event - 網路優先策略 (確保使用者總是拿到最新版)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(fetchRes => {
      // 網路成功：更新快取並回傳
      if (event.request.method === 'GET' && fetchRes.status === 200) {
        const resClone = fetchRes.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, resClone);
        });
      }
      return fetchRes;
    }).catch(() => {
      // 網路失敗：使用快取 (離線模式)
      return caches.match(event.request).then(cacheRes => {
        if (cacheRes) return cacheRes;
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
