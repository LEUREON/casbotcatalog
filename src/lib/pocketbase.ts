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
    if (token && model) pb.authStore.save(token, model as any);
  } catch {}
}

// restore immediately (before providers mount)
restoreAuth();
// keep in sync
pb.authStore.onChange(() => persistAuth(), true);

// --- НОВЫЙ КОД ДЛЯ ИСПРАВЛЕНИЯ ОШИБКИ АУТЕНТИФИКАЦИИ ---
// Глобальный обработчик для "протухшей" сессии (ошибки 401/400)
// Он должен быть *в дополнение* к persistAuth
pb.authStore.onChange((token, model) => {
  // Если токен и модель пропали (сессия невалидна)
  // И мы НЕ на главной странице (чтобы избежать цикла перезагрузок)
  // И НЕ на странице /admin (на всякий случай)
  if (
    !token &&
    !model &&
    window.location.pathname !== '/' &&
    !window.location.pathname.startsWith('/admin')
  ) {
    console.warn(
      'Auth token is invalid or expired. Forcing logout via reload.',
    );

    // Принудительно очищаем хранилище
    // (persistAuth() выше уже должен был это сделать, но для надежности)
    pb.authStore.clear();

    // Перезагрузка - самый простой способ сбросить все состояние React
    // (контексты, состояния) и "разлогинить" пользователя в UI.
    window.location.reload();
  }
}, true);
// --- КОНЕЦ НОВОГО КОДА ---

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
    if (left < 60_000) {
      await pb.collection('users').authRefresh();
    }
  } catch {
    // ignore
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
