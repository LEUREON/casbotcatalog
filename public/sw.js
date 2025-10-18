// public/sw.js

const CACHE_NAME = 'cas-cache-v5'; // Новое имя, чтобы гарантировать обновление

self.addEventListener('install', (event) => {
  console.log('[SW] Установка v5...');
  // Принудительная активация, чтобы новый SW сразу начал работать
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Активация v5...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем ВСЕ кэши, кроме текущего (v5)
          if (cacheName !== CACHE_NAME) {
            console.log(`[SW] Удаление старого кэша: ${cacheName}`);
            return caches.delete(cacheName);
          }
        }),
      );
    }).then(() => self.clients.claim()), // Захватываем контроль над открытыми страницами
  );
});

self.addEventListener('fetch', (event) => {
  // Стратегия "сначала сеть, потом кэш"
  event.respondWith(
    fetch(event.request).catch(() => {
      // Если сеть недоступна, пытаемся найти ответ в кэше
      return caches.match(event.request);
    }),
  );
});
