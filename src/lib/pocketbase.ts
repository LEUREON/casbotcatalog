// src/lib/pocketbase.ts
import PocketBase from 'pocketbase';
import type { User } from '../types';

// 1) Init client
const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL;
if (!pocketbaseUrl) {
  throw new Error('VITE_POCKETBASE_URL is not set in your .env file!');
}
export const pb = new PocketBase(pocketbaseUrl);

// 2) Persistence (localStorage), чтобы сессия переживала перезагрузки
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

/**
 * ВАЖНО: не выкидываем восстановленный токен сразу по локальной проверке exp.
 * Сначала кладём его в authStore, затем пробуем обновить.
 * Если сервер отказал — тогда чистим.
 */
function restoreAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const { token, model } = JSON.parse(raw) as {
      token?: string;
      model?: unknown;
    };

    if (!token || !model) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    // 1) Сохраняем, чтобы иметь шанс на refresh даже при рассинхроне часов
    pb.authStore.save(token, model as any);

    // 2) Пробуем сразу обновить
    ensureFreshAuth(true).catch((e) => {
      console.warn('[Auth] Не удалось обновить восстановленный токен, очищаем.', e);
      pb.authStore.clear();
      localStorage.removeItem(STORAGE_KEY);
    });
  } catch (e) {
    console.error('[Auth] Не удалось восстановить сессию:', e);
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Восстанавливаем до монтирования провайдеров
restoreAuth();

// Держим localStorage в актуальном состоянии
pb.authStore.onChange(() => persistAuth(), true);

/**
 * Обновление токена, когда остаётся мало времени, либо принудительно.
 * @param force — принудительно (используется сразу после восстановления)
 */
export async function ensureFreshAuth(force = false): Promise<void> {
  try {
    if (!pb.authStore.model || !pb.authStore.token) return;

    const token = pb.authStore.token!;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expMs = payload.exp * 1000;
    const now = Date.now();
    const left = expMs - now;

    // Обновляем заранее (за 5 минут) или сразу при force
    if (force || left < 5 * 60_000) {
      console.log('[Auth] Token is old, refreshing...');
      await pb.collection('users').authRefresh();
      console.log('[Auth] Token refresh successful.');
    }
  } catch (error) {
    console.warn('[Auth] Token refresh failed. Token is invalid.', error);
    throw error;
  }
}

/**
 * Подписка на блокировку пользователя (пример — поле is_blocked в коллекции users).
 * Возвращает функцию отписки.
 */
export async function subscribeUserBlock(onBlocked: () => void): Promise<() => Promise<void>> {
  const model = pb.authStore.model as unknown as User | null;
  if (!model) return async () => {};

  const id = (model as any).id as string;
  let unsubbed = false;

  try {
    await pb.collection('users').subscribe(id, (e: any) => {
      const rec = e.record as any;
      if (rec?.is_blocked) onBlocked();
    });
  } catch {
    // игнорируем
  }

  return async () => {
    if (unsubbed) return;
    unsubbed = true;
    try {
      await pb.collection('users').unsubscribe(id);
    } catch {}
  };
}
