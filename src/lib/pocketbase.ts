// src/lib/pocketbase.ts
import PocketBase from 'pocketbase';
import { User } from '../types';

// 1. Получаем URL из переменных окружения
const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL;

if (!pocketbaseUrl) {
  throw new Error('VITE_POCKETBASE_URL is not set in your .env file!');
}

// 2. Создаем и экспортируем клиент PocketBase
export const pb = new PocketBase(pocketbaseUrl);

// 3. Автоматически сохраняем сессию пользователя в cookie
// Это позволяет пользователю оставаться в системе после перезагрузки страницы
pb.authStore.loadFromCookie(document.cookie);
pb.authStore.onChange(() => {
    document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
});

// 4. Вспомогательные функции для удобной работы с пользователем
export const isUserLoggedIn = () => pb.authStore.isValid && !!pb.authStore.model;

export const getCurrentUser = (): User | null => {
  if (!isUserLoggedIn() || !pb.authStore.model) {
    return null;
  }
  const model = pb.authStore.model;
  // Преобразуем данные из PocketBase в наш тип User
  return {
    id: model.id,
    username: model.username,
    nickname: model.nickname,
    email: model.email,
    role: model.role as 'admin' | 'user',
    avatar: model.avatar ? pb.getFileUrl(model, model.avatar) : undefined,
    createdAt: new Date(model.created),
    isBlocked: model.is_blocked || false,
    favorites: model.favorites || []
  };
};