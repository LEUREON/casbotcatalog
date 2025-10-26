// public/sw.js

// Версия кэша. Меняйте ее (v6, v7...), когда хотите, 
// чтобы Service Worker принудительно обновил кэш у всех пользователей.
const CACHE_NAME = 'cas-cache-v5';

// Файлы, которые нужно кэшировать сразу при установке.
// Обычно это "оболочка" приложения: главный JS, CSS и HTML.
// Примечание: '/index.html' может быть просто '/', если ваш сервер так настроен.
const PRECACHE_ASSETS = [
  '/', // Главная страница
  '/index.html', // HTML-файл
  // Сюда Vite/сборщик обычно сам добавляет пути к assets (main.js, main.css)
  // Но для простой PWA можно оставить так.
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Установка v5...');
  // Кэшируем основные ресурсы
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()) // Принудительная активация
      .catch(err => console.error('[SW] Ошибка при pre-кэшировании:', err))
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Активация v5...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Удаляем ВСЕ старые кэши, кроме текущего
          if (cacheName !== CACHE_NAME) {
            console.log(`[SW] Удаление старого кэша: ${cacheName}`);
            return caches.delete(cacheName);
          }
        }),
      );
    }).then(() => self.clients.claim()), // Захватываем контроль
  );
});

self.addEventListener('fetch', (event) => {
  // Мы не кэшируем запросы к API (pocketbase)
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Стратегия "Сначала сеть, потом кэш" (Network First)
  // Хорошо для ресурсов, которые могут обновляться, но должны работать оффлайн.
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Если запрос успешен, кэшируем его и возвращаем
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Если сеть недоступна (оффлайн), пытаемся найти ответ в кэше
        return caches.match(event.request);
      })
  );
});