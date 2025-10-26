// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { lockLargeViewportHeight } from './utils/lockLVH';
lockLargeViewportHeight();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js') // Регистрируем sw.js из папки public
    .then((registration) => {
      console.log('[SW] Service Worker УСПЕШНО зарегистрирован:', registration);
    })
    .catch((error) => {
      console.error('[SW] ОШИБКА регистрации Service Worker:', error);
    });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);