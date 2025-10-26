// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { pb, formatUser, restoreAuth, ensureFreshAuth, subscribeUserBlock } from '../lib/pocketbase';
import { User, LoginStatus } from '../types';
import type { RecordModel } from 'pocketbase';

// Интерфейс контекста, включающий новые поля
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identity: string, pass: string) => Promise<LoginStatus>;
  register: (username: string, nickname: string, email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (updates: any) => Promise<{ success: boolean; message: string }>;
  isAdmin: boolean;
  toggleFavorite: (characterId: string) => Promise<void>; // Для публичных
  isUserBlocked: (identity: string) => Promise<boolean>; // Ваша функция
  userCharacterFavorites: string[]; // ID избранных пользовательских
  toggleUserCharacterFavorite: (characterId: string) => Promise<void>; // Функция для пользовательских
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubBlockRef = useRef<null | (() => Promise<void> | void)>(null);
  // Состояние для ID избранных пользовательских карточек
  const [userCharacterFavorites, setUserCharacterFavorites] = useState<string[]>([]);

  // Функция выхода
  const logout = useCallback(() => {
    try {
      // Отписываемся от отслеживания блокировки пользователя
      if (unsubBlockRef.current) { try { unsubBlockRef.current(); } catch {} }
    } finally {
      pb.authStore.clear(); // Очищаем токен авторизации
      // Состояние пользователя и userCharacterFavorites сбросится через onChange ниже
    }
  }, []);

  // Эффект для инициализации и подписки на изменения авторизации
  useEffect(() => {
    try { restoreAuth(); } catch {} // Восстанавливаем сессию из кеша

    // Обработчик изменений в authStore PocketBase
    const handleAuthChange = async (_token: string, model: RecordModel | null) => {
      const formatted = formatUser(model); // Форматируем пользователя (из вашего pocketbase.ts)
      if (formatted?.isBlocked) { // Проверка блокировки
        pb.authStore.clear(); // Выходим, если заблокирован
        setUser(null);
        setUserCharacterFavorites([]); // Сбрасываем избранное
      } else {
        setUser(formatted); // Устанавливаем пользователя (может быть null при выходе)

        // Загружаем избранные пользовательские карточки, если пользователь вошел
        if (formatted) {
          try {
            const favUserCharRecords = await pb.collection('user_character_favorites').getFullList({
              filter: `user = "${formatted.id}"`, // Загружаем только свои
              fields: 'user_character', // Только ID карточек
            });
            const favUserCharIds = favUserCharRecords.map(record => record.user_character);
            setUserCharacterFavorites(favUserCharIds); // Сохраняем ID в состоянии
          } catch (favError: any) {
            // Обработка ошибок (404 больше не должно быть, но 403 возможна при неверных правилах)
            if (favError?.status === 403) {
                 console.warn("Ошибка 403 (Forbidden) при загрузке 'user_character_favorites'. Проверьте API Rules коллекции.");
            } else {
                 console.error("Не удалось загрузить избранные пользовательские карточки:", favError);
            }
            setUserCharacterFavorites([]); // Сбрасываем при ошибке
          }

          // Подписываемся на изменения поля is_blocked у пользователя (ваш оригинальный код)
          if (unsubBlockRef.current) { try { unsubBlockRef.current(); } catch {} }
          subscribeUserBlock(() => { // subscribeUserBlock из вашего pocketbase.ts
            pb.authStore.clear(); // Выходим, если пользователя заблокировали
            setUser(null);
            setUserCharacterFavorites([]);
          })
            .then(unsub => { unsubBlockRef.current = unsub; })
            .catch(() => { unsubBlockRef.current = null; });

        } else {
          // Если пользователь вышел (formatted === null)
          setUserCharacterFavorites([]); // Сбрасываем избранное
        }
      }
      setLoading(false); // Завершаем индикатор загрузки
    };

    // Подписываемся на изменения authStore, вызываем обработчик сразу
    const unsubscribe = pb.authStore.onChange(handleAuthChange, true);
    // Отписываемся при размонтировании компонента
    return () => { try { unsubscribe(); } catch {} };
  }, []); // Пустой массив зависимостей = выполнить один раз

  // Функция входа (ваша оригинальная логика с isUserBlocked)
  const login = async (identity: string, pass: string): Promise<LoginStatus> => {
    try {
      const identityToTry = identity.toLowerCase();
      const blocked = await isUserBlocked(identityToTry); // Проверка до входа
      if (blocked) {
        return LoginStatus.ERROR;
      }
      await pb.collection('users').authWithPassword(identityToTry, pass);
      if ((pb.authStore.model as any)?.is_blocked) { // Проверка после входа
        pb.authStore.clear();
        return LoginStatus.ERROR;
      }
      // Успех. Данные перезагрузятся через onChange.
      return LoginStatus.SUCCESS;
    } catch (e: any) {
       if (e?.status === 400) {
           return LoginStatus.WRONG_CREDENTIALS;
       }
       console.error("Login error:", e);
       return LoginStatus.ERROR;
    }
  };

  // Функция регистрации (ваша оригинальная)
  const register = async (username: string, nickname: string, email: string, pass: string) => {
    try {
      await pb.collection('users').create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        nickname,
        password: pass,
        passwordConfirm: pass,
        role: 'user',
      });
      const status = await login(username.toLowerCase(), pass); // Вход после регистрации
      if (status !== LoginStatus.SUCCESS) {
        return { success: false, message: 'Не удалось войти после регистрации.' };
      }
      return { success: true, message: 'Регистрация успешна!' };
    } catch (err: any) {
      const data = err?.response?.data || {};
      if (data?.username?.message?.includes('must be unique')) return { success: false, message: 'Этот логин уже зарегистрирован.' };
      if (data?.email?.message?.includes('must be unique')) return { success: false, message: 'Этот email уже зарегистрирован.' };
      console.error("Register error:", err);
      return { success: false, message: 'Ошибка регистрации. Проверьте консоль.' };
    }
  };

  // Функция обновления профиля (ваша оригинальная)
  const updateProfile = async (updates: any) => {
    if (!user) return { success: false, message: 'Пользователь не авторизован.' };
    try {
      const formData = new FormData();
      if (updates.nickname && updates.nickname !== user.nickname) formData.append('nickname', updates.nickname);
      if (updates.email && updates.email !== user.email) formData.append('email', updates.email.toLowerCase());
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
      let hasUpdates = false;
      formData.forEach(() => { hasUpdates = true; });
      if (!hasUpdates) {
          return { success: true, message: 'Нет данных для обновления.' };
      }
      await pb.collection('users').update(user.id, formData);
      await pb.collection('users').authRefresh(); // Обновляем данные в authStore
      return { success: true, message: 'Профиль успешно обновлен.' };
    } catch (err: any) {
      if (err.response?.data?.oldPassword?.message) return { success: false, message: 'Неверный текущий пароль.' };
      console.error("Update profile error:", err);
      return { success: false, message: 'Ошибка обновления. Проверьте консоль.' };
    }
  };

  // Функция для избранного ПУБЛИЧНЫХ карточек (ваша оригинальная)
  // Работает с полем 'favorites' в коллекции 'users'
  const toggleFavorite = async (characterId: string) => {
    if (!user) return;
    const current = user.favorites || [];
    const next = current.includes(characterId) ? current.filter(id => id !== characterId) : [...current, characterId];
    try {
      await pb.collection('users').update(user.id, { favorites: next });
      setUser(prev => prev ? { ...prev, favorites: next } : prev); // Оптимистичное обновление
    } catch (error) {
      console.error('Failed to update public favorites:', error);
    }
  };

  // Функция для избранного ПОЛЬЗОВАТЕЛЬСКИХ карточек
  // Работает с коллекцией 'user_character_favorites'
  const toggleUserCharacterFavorite = async (characterId: string) => {
    if (!user) throw new Error("User not logged in");
    try {
      // Ищем существующую запись в 'user_character_favorites'
      const existingRecords = await pb.collection('user_character_favorites').getFullList({
        filter: `user = "${user.id}" && user_character = "${characterId}"`,
        requestKey: null // Без кеша
      });

      if (existingRecords.length > 0) {
        // Нашли -> Удаляем
        await pb.collection('user_character_favorites').delete(existingRecords[0].id);
        setUserCharacterFavorites(prev => prev.filter(id => id !== characterId)); // Обновляем состояние
      } else {
        // Не нашли -> Создаем
        await pb.collection('user_character_favorites').create({
          user: user.id,
          user_character: characterId,
        });
        setUserCharacterFavorites(prev => [...prev, characterId]); // Обновляем состояние
      }
    } catch (error: any) {
       // Обработка ошибок (на всякий случай)
       if (error?.status === 403) {
           console.error("Ошибка 403 (Forbidden) при доступе к 'user_character_favorites'. Проверьте API Rules.");
           alert("Не удалось обновить избранное: недостаточно прав. Проверьте API Rules.");
        } else {
          console.error("Failed to toggle user character favorite:", error);
          alert("Произошла ошибка при обновлении избранного. Проверьте консоль.");
        }
      throw error; // Пробрасываем ошибку для UI
    }
  };

  // Функция проверки блокировки (ваша оригинальная)
  const isUserBlocked = async (identity: string): Promise<boolean> => {
    try {
      const identityToTry = identity.toLowerCase();
      const escapedIdentity = identityToTry.replace(/'/g, "''"); // Экранирование
      const filter = `(username = '${escapedIdentity}' || email = '${escapedIdentity}')`;
      const result = await pb.collection('users').getFirstListItem(filter, { '$autoCancel': false });
      return Boolean((result as any)?.is_blocked);
    } catch (e: any) {
        if (e?.status === 404) { // Не найден - не заблокирован
            return false;
        }
        console.error("Error checking user block status:", e);
        return false; // При других ошибках считаем, что не заблокирован
    }
  };

  const isAdmin = user?.role === 'admin';

  // Значения, передаваемые через контекст
  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAdmin,
    toggleFavorite, // Для публичных
    isUserBlocked, // Ваша
    userCharacterFavorites, // Новое состояние
    toggleUserCharacterFavorite // Новая функция
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Хук для использования контекста
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};