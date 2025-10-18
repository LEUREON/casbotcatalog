// src/contexts/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  pb,
  formatUser,
  restoreAuth,
  ensureFreshAuth,
  subscribeUserBlock,
} from '../lib/pocketbase';
import { User, LoginStatus } from '../types';
import type { RecordModel } from 'pocketbase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identity: string, pass: string) => Promise<LoginStatus>;
  register: (
    username: string,
    nickname: string,
    email: string,
    pass: string,
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (updates: any) => Promise<{ success: boolean; message: string }>;
  isAdmin: boolean;
  toggleFavorite: (characterId: string) => Promise<void>;
  isUserBlocked: (identity: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubBlockRef = useRef<null | (() => Promise<void> | void)>(null);

  // --- ИЗМЕНЕНО --- (Финальное исправление "гонки состояний")
  const logout = useCallback(() => {
    console.log('[Auth] Выполнение принудительного выхода...');
    try {
      if (unsubBlockRef.current) {
        try { unsubBlockRef.current(); } catch {}
      }
      // 1. Сначала вручную и напрямую очищаем localStorage
      localStorage.removeItem('cas_auth_v1'); 
    } finally {
      // 2. Очищаем состояние в PocketBase
      pb.authStore.clear();
      // 3. Гарантированно перезагружаем страницу, чтобы разорвать цикл
      // Используем setTimeout, чтобы дать localStorage время на очистку
      setTimeout(() => {
        window.location.reload();
      }, 0);
    }
  }, []);
  // --- КОНЕЦ ИЗМЕНЕНИЯ ---

  useEffect(() => {
    // 1) restore cached auth
    try {
      restoreAuth();
    } catch {}
    // 2) subscribe to auth changes
    const handleAuthChange = (_token: string, model: RecordModel | null) => {
      const formatted = formatUser(model);
      if (formatted?.isBlocked) {
        pb.authStore.clear();
        setUser(null);
      } else {
        setUser(formatted);
        if (unsubBlockRef.current) {
          try { unsubBlockRef.current(); } catch {}
        }
        if (formatted) {
          subscribeUserBlock(() => {
            pb.authStore.clear();
            setUser(null);
          })
            .then((unsub) => { unsubBlockRef.current = unsub; })
            .catch(() => { unsubBlockRef.current = null; });
        }
      }
      setLoading(false);
    };
    const unsubscribe = pb.authStore.onChange(handleAuthChange, true);
    return () => {
      try { unsubscribe(); } catch {}
    };
  }, [logout]);

  // Keep token fresh
  useEffect(() => {
    const safeEnsureFreshAuth = async (type: 'Первичная' | 'Периодическая') => {
      if (!pb.authStore.isValid) return; 
      try {
        console.log(`[Auth] ${type} проверка актуальности токена...`);
        await ensureFreshAuth();
      } catch (error) {
        console.warn(`[Auth] ${type} проверка не удалась. Принудительный выход.`);
        logout();
      }
    };

    safeEnsureFreshAuth('Первичная');

    const onVis = () => {
      if (document.visibilityState === 'visible') safeEnsureFreshAuth('Периодическая');
    };
    const onOnline = () => safeEnsureFreshAuth('Периодическая');
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onOnline);

    const interval = setInterval(() => safeEnsureFreshAuth('Периодическая'), 30000);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onOnline);
      clearInterval(interval);
    };
  }, [logout]);

  const login = async (identity: string, pass: string): Promise<LoginStatus> => {
    try {
      const identityToTry = identity.toLowerCase();
      await pb.collection('users').authWithPassword(identityToTry, pass);
      if ((pb.authStore.model as any)?.is_blocked) {
        pb.authStore.clear();
        return LoginStatus.ERROR;
      }
      return LoginStatus.SUCCESS;
    } catch {
      return LoginStatus.WRONG_CREDENTIALS;
    }
  };

  const register = async (
    username: string,
    nickname: string,
    email: string,
    pass: string,
  ) => {
    try {
      await pb.collection('users').create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        nickname,
        password: pass,
        passwordConfirm: pass,
        role: 'user',
      });
      const status = await login(username.toLowerCase(), pass);
      if (status !== LoginStatus.SUCCESS) {
        return { success: false, message: 'Не удалось войти после регистрации.' };
      }
      return { success: true, message: 'Регистрация успешна!' };
    } catch (err: any) {
      const data = err?.response?.data || {};
      if (data?.username?.message?.includes('must be unique'))
        return { success: false, message: 'Этот логин уже зарегистрирован.' };
      if (data?.email?.message?.includes('must be unique'))
        return { success: false, message: 'Этот email уже зарегистрирован.' };
      return { success: false, message: 'Ошибка регистрации.' };
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user) return { success: false, message: 'Пользователь не авторизован.' };
    try {
      const formData = new FormData();
      if (updates.nickname && updates.nickname !== user.nickname)
        formData.append('nickname', updates.nickname);
      if (updates.email && updates.email !== user.email)
        formData.append('email', updates.email.toLowerCase());
      if (updates.password && updates.oldPassword) {
        formData.append('password', updates.password);
        formData.append('passwordConfirm', updates.password);
        formData.append('oldPassword', updates.oldPassword);
      }
      if (updates.avatarFile instanceof File) {
        formData.append('avatar', updates.avatarFile);
      } else if (updates.avatarFile === null) {
        formData.append('avatar', '');
      }
      await pb.collection('users').update(user.id, formData);
      await pb.collection('users').authRefresh();
      return { success: true, message: 'Профиль успешно обновлен.' };
    } catch (err: any) {
      if (err.response?.data?.oldPassword)
        return { success: false, message: 'Неверный текущий пароль.' };
      return { success: false, message: 'Ошибка обновления.' };
    }
  };

  const toggleFavorite = async (characterId: string) => {
    if (!user) return;
    const current = user.favorites || [];
    const next = current.includes(characterId)
      ? current.filter((id) => id !== characterId)
      : [...current, characterId];
    try {
      await pb.collection('users').update(user.id, { favorites: next });
      setUser((prev) => (prev ? { ...prev, favorites: next } : prev));
    } catch (error) {
      console.error('Failed to update favorites:', error);
    }
  };

  const isUserBlocked = async (identity: string): Promise<boolean> => {
    try {
      const identityToTry = identity.toLowerCase();
      const filter = `username = "${identityToTry}" || email = "${identityToTry}"`;
      const result = await pb
        .collection('users')
        .getFirstListItem(filter, { $autoCancel: false });
      return Boolean((result as any)?.is_blocked);
    } catch {
      return false;
    }
  };

  const isAdmin = user?.role === 'admin';

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAdmin,
    toggleFavorite,
    isUserBlocked,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

