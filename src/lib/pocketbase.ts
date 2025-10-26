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
  } catch {
    // ignore
  }
}

export function restoreAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const { token, model } = JSON.parse(raw);
    if (token && model) pb.authStore.save(token, model as any);
  } catch {
    // ignore
  }
}

// restore immediately (before providers mount)
restoreAuth();
// keep in sync
pb.authStore.onChange(() => persistAuth(), true);

// 3) Helpers
export const formatUser = (model: RecordModel | null): User | null => {
  if (!model) return null;
  return {
    id: model.id,
    username: (model as any).username,
    nickname: (model as any).nickname,
    email: (model as any).email,
    role: (model as any).role as 'admin' | 'user',
    avatar: (model as any).avatar ? pb.getFileUrl(model as any, (model as any).avatar) : undefined,
    createdAt: new Date((model as any).created),
    isBlocked: Boolean((model as any).is_blocked),
    favorites: (model as any).favorites || [],
  };
};

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export async function ensureFreshAuth(): Promise<boolean> {
  if (!pb.authStore.model || !pb.authStore.token) {
    return false;
  }

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  try {
    const token = pb.authStore.token;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expMs = payload.exp * 1000;
    const now = Date.now();
    const left = expMs - now;

    if (left < 120_000) {
      isRefreshing = true;
      refreshPromise = (async () => {
        try {
          await pb.collection('users').authRefresh();
          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);
          pb.authStore.clear();
          return false;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();
      return refreshPromise;
    }
    return true;
  } catch (error) {
    console.error('Token validation failed:', error);
    pb.authStore.clear();
    return false;
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
    try { await pb.collection('users').unsubscribe(id); } catch {}
  };
}


pb.beforeSend = async (url, options) => {
  if (!pb.authStore.isValid) {
    return { url, options };
  }

  const isAuthEndpoint = url.includes('/api/collections/users/auth-refresh') ||
                         url.includes('/api/collections/users/auth-with-password');

  if (isAuthEndpoint) {
    return { url, options };
  }

  await ensureFreshAuth();

  return { url, options };
};

setInterval(() => {
  if (pb.authStore.isValid) {
    ensureFreshAuth();
  }
}, 60_000);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && pb.authStore.isValid) {
    ensureFreshAuth();
  }
});

window.addEventListener('online', () => {
  if (pb.authStore.isValid) {
    ensureFreshAuth();
  }
});

if (pb.authStore.isValid) {
  ensureFreshAuth();
}