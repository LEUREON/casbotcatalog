// src/lib/pocketbase.ts
import PocketBase, { RecordModel } from 'pocketbase';
import type { User } from '../types';

// 1) Init client
const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL;
if (!pocketbaseUrl) {
  throw new Error('VITE_POCKETBASE_URL is not set in your .env file!');
}
export const pb = new PocketBase(pocketbaseUrl);

// 2) Robust persistence (localStorage) so auth survives reloads
const STORAGE_KEY = 'cas_auth_v1';

function persistAuth() {
  try {
    const token = pb.authStore.token;
    const model = pb.authStore.model;
    if (token && model) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, model }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

export function restoreAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const { token, model } = JSON.parse(raw);
    if (!token || !model) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    // Ручная проверка токена на истечение СРОКА ДЕЙСТВИЯ
    // Это "лечит" пользователей, которые "застряли" с мертвым токеном.
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expMs = payload.exp * 1000;
      if (expMs < Date.now()) {
        console.warn(
          '[Auth] Восстановленный токен истек. Очистка хранилища.',
        );
        localStorage.removeItem(STORAGE_KEY);
        return; // Не загружаем "мертвый" токен
      }
    } catch (e) {
      console.error('[Auth] Не удалось проанализировать токен.', e);
      localStorage.removeItem(STORAGE_KEY);
      return; // Токен поврежден
    }

    // Если мы дошли сюда, токен существует И он еще не истек.
    pb.authStore.save(token, model as any);
  } catch (e) {
    console.error('[Auth] Не удалось восстановить сессию:', e);
    localStorage.removeItem(STORAGE_KEY);
  }
}

// restore immediately (before providers mount)
restoreAuth();
// keep in sync
pb.authStore.onChange(() => persistAuth(), true);

// Этот код ловит другие сбои (токен отозван сервером, а не просто истек)
// и принудительно перезагружает страницу, чтобы "разлогинить" пользователя в UI.
pb.authStore.onChange((token, model) => {
  if (
    !token &&
    !model &&
    window.location.pathname !== '/' &&
    !window.location.pathname.startsWith('/admin')
  ) {
    console.warn(
      'Auth token is invalid or expired. Forcing logout via reload.',
    );
    pb.authStore.clear();
    window.location.reload();
  }
}, true);

// 3) Helpers
export const formatUser = (model: RecordModel | null): User | null => {
  if (!model) return null;
  return {
    id: model.id,
    username: (model as any).username,
    nickname: (model as any).nickname,
    email: (model as any).email,
    role: (model as any).role as 'admin' | 'user',
    avatar: (model as any).avatar
      ? pb.getFileUrl(model as any, (model as any).avatar)
      : undefined,
    createdAt: new Date((model as any).created),
    isBlocked: Boolean((model as any).is_blocked),
    favorites: (model as any).favorites || [],
  };
};

// Refresh JWT a bit before expiry (so it doesn't "слетать")
export async function ensureFreshAuth(): Promise<void> {
  try {
    if (!pb.authStore.model || !pb.authStore.token) return;
    const token = pb.authStore.token;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expMs = payload.exp * 1000;
    const now = Date.now();
    const left = expMs - now;

    // Обновляем, если осталось меньше 1 минуты
    if (left < 60000) { // 1 минута
      console.log('[Auth] Token is old, refreshing...');
      await pb.collection('users').authRefresh();
      console.log('[Auth] Token refresh successful.');
    }
  } catch (error) {
    console.warn('[Auth] Token refresh failed. Token is invalid.', error);
    throw error; // Бросаем ошибку, чтобы AuthContext мог ее поймать
  }
}

// Live watch for block status; returns unsubscribe
export async function subscribeUserBlock(onBlocked: () => void) {
  const model = pb.authStore.model;
  if (!model) return () => {};
  const id = model.id;
  let unsubbed = false;
  try {
    await pb.collection('users').subscribe(id, (e: any) => {
      const rec = e.record as any;
      if (rec?.is_blocked) onBlocked();
    });
  } catch {
    // ignore
  }
  return async () => {
    if (unsubbed) return;
    unsubbed = true;
    try {
      await pb.collection('users').unsubscribe(id);
    } catch {}
  };
}
