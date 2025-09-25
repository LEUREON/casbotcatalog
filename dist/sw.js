// public/sw.js
const CACHE_NAME = 'character-ai-space-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  // Добавьте сюда пути к основным файлам вашего приложения, если необходимо
  // Например: '/assets/index.css', '/assets/index.js'
  // Vite обычно генерирует их с хешами, так что это продвинутая настройка
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});