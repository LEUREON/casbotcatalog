// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { pb, ensureFreshAuth, subscribeUserBlock } from '../lib/pocketbase';
import { User, LoginStatus } from '../types';

type AuthDialogMode = 'login' | 'register' | null;

interface AuthContextType {
  user: User | null;
  loading: boolean;

  login: (identity: string, pass: string) => Promise<LoginStatus>;
  logout: () => void;

  register: (
    username: string,
    nickname: string,
    email: string,
    pass: string
  ) => Promise<{ success: boolean; message: string }>;

  updateProfile: (
    updates: Partial<User> & {
      avatarFile?: File | null;
      oldPassword?: string;
      newPassword?: string;
    }
  ) => Promise<{ success: boolean; message: string }>;

  toggleFavorite: (id: string) => Promise<void>;

  isUserBlocked: () => boolean;

  authState: { isOpen: boolean; mode: AuthDialogMode };
  openAuthDialog: (mode?: AuthDialogMode) => void;
  closeAuthDialog: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(
    (pb.authStore.model as unknown as User) || null
  );
  const [loading, setLoading] = useState<boolean>(false);

  const [authState, setAuthState] = useState<{ isOpen: boolean; mode: AuthDialogMode }>({
    isOpen: false,
    mode: 'login',
  });

  const unsubBlockRef = useRef<null | (() => Promise<void>)>(null);

  const openAuthDialog = (mode: AuthDialogMode = 'login') =>
    setAuthState({ isOpen: true, mode });
  const closeAuthDialog = () => setAuthState((s) => ({ ...s, isOpen: false }));

  // Подписка на смену authStore (PocketBase)
  useEffect(() => {
    const handleAuthChange = () => {
      setUser((pb.authStore.model as unknown as User) || null);
    };
    const unsubscribe = pb.authStore.onChange(handleAuthChange, true);
    return () => {
      try {
        unsubscribe();
      } catch {}
    };
  }, []);

  // Утилита: отписка от слежения за блокировкой
  const disposeBlockWatcher = useCallback(async () => {
    if (unsubBlockRef.current) {
      try {
        await unsubBlockRef.current();
      } catch {}
      unsubBlockRef.current = null;
    }
  }, []);

  // Логаут
  const logout = useCallback(() => {
    // отписываемся от блокировки
    void disposeBlockWatcher();

    // чистим хранилища
    localStorage.removeItem('cas_auth_v1');
    pb.authStore.clear();
    setUser(null);
  }, [disposeBlockWatcher]);

  // Периодическое поддержание токена в актуальном состоянии
  useEffect(() => {
    const safeEnsureFreshAuth = async (type: 'Первичная' | 'Периодическая') => {
      // ВАЖНО: проверяем наличие токена, а не isValid,
      // чтобы дать шанс на refresh и при формально просроченном токене.
      if (!pb.authStore.token) return;

      try {
        console.log(`[Auth] ${type} проверка актуальности токена...`);
        await ensureFreshAuth();
      } catch (error) {
        console.warn(
          `[Auth] ${type} проверка не удалась. Принудительный выход.`,
          error
        );
        logout();
      }
    };

    // Первичная проверка
    void safeEnsureFreshAuth('Первичная');

    // Проверка при возвращении во вкладку/восстановлении сети
    const onVis = () => {
      if (document.visibilityState === 'visible') void safeEnsureFreshAuth('Периодическая');
    };
    const onOnline = () => void safeEnsureFreshAuth('Периодическая');

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', onOnline);

    // Периодическое обновление (каждые 30 сек)
    const interval = setInterval(
      () => void safeEnsureFreshAuth('Периодическая'),
      30_000
    );

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', onOnline);
      clearInterval(interval);
    };
  }, [logout]);

  // Логин
  const login = async (identity: string, pass: string): Promise<LoginStatus> => {
    try {
      const identityToTry = identity.toLowerCase();
      await pb.collection('users').authWithPassword(identityToTry, pass);

      // Проверяем блокировку
      if ((pb.authStore.model as any)?.is_blocked) {
        pb.authStore.clear();
        return LoginStatus.ERROR;
      }

      // Подписка на блокировку — при успешном входе
      await disposeBlockWatcher();
      unsubBlockRef.current = await subscribeUserBlock(() => {
        console.warn('[Auth] Пользователь заблокирован — выходим.');
        logout();
      });

      return LoginStatus.SUCCESS;
    } catch {
      return LoginStatus.WRONG_CREDENTIALS;
    }
  };

  // Регистрация (минимальная реализация; при необходимости расширьте)
  const register: AuthContextType['register'] = async (
    username,
    nickname,
    email,
    pass
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

      // После регистрации пробуем залогиниться
      const status = await login(username.toLowerCase(), pass);
      if (status !== LoginStatus.SUCCESS) {
        return { success: false, message: 'Не удалось войти после регистрации.' };
      }
      return { success: true, message: 'Регистрация выполнена успешно.' };
    } catch (e: any) {
      const msg =
        e?.response?.data?.email?.message ||
        e?.response?.data?.username?.message ||
        'Не удалось завершить регистрацию.';
      return { success: false, message: String(msg) };
    }
  };

  // Обновление профиля (пример; при необходимости подгоните под свою схему)
  const updateProfile: AuthContextType['updateProfile'] = async (updates) => {
    const current = pb.authStore.model as any;
    if (!current) return { success: false, message: 'Нет активного пользователя.' };

    try {
      const formData = new FormData();

      // Простые поля
      Object.entries(updates).forEach(([k, v]) => {
        if (v == null) return;
        if (['avatarFile', 'oldPassword', 'newPassword'].includes(k)) return;
        formData.append(k, String(v));
      });

      // Аватар
      if ('avatarFile' in updates) {
        if (updates.avatarFile instanceof File) {
          formData.append('avatar', updates.avatarFile);
        } else if (updates.avatarFile === null) {
          formData.append('avatar', '');
        }
      }

      // Смена пароля (если заданы оба)
      if (updates.oldPassword && updates.newPassword) {
        formData.append('oldPassword', updates.oldPassword);
        formData.append('password', updates.newPassword);
        formData.append('passwordConfirm', updates.newPassword);
      }

      await pb.collection('users').update(current.id, formData);

      // Обновляем токен после изменения профиля
      await pb.collection('users').authRefresh();

      return { success: true, message: 'Профиль успешно обновлён.' };
    } catch (err: any) {
      const msg =
        err?.response?.data?.oldPassword ||
        err?.response?.data?.password ||
        'Не удалось обновить профиль.';
      return { success: false, message: String(msg) };
    }
  };

  // Демонстрационная заглушка — под свою бизнес-логику
  const toggleFavorite = async (_id: string) => {
    // no-op; реализуйте при необходимости
  };

  const isUserBlocked = () => Boolean((pb.authStore.model as any)?.is_blocked);

  const value: AuthContextType = {
    user,
    loading,

    login,
    logout,

    register,
    updateProfile,
    toggleFavorite,

    isUserBlocked,

    authState,
    openAuthDialog,
    closeAuthDialog,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
