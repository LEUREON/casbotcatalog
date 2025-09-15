// project/src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { User, LoginStatus } from '../types';
import { RecordModel } from 'pocketbase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identity: string, pass: string) => Promise<LoginStatus>;
  register: (username: string, nickname: string, email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (updates: any) => Promise<{ success: boolean; message: string }>;
  isAdmin: boolean;
  toggleFavorite: (characterId: string) => Promise<void>;
  isUserBlocked: (identity: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const formatUser = (model: RecordModel | null): User | null => {
  if (!model) return null;
  return {
    id: model.id,
    username: model.username,
    nickname: model.nickname,
    email: model.email,
    role: model.role,
    avatar: model.avatar ? pb.getFileUrl(model, model.avatar) : undefined,
    createdAt: new Date(model.created),
    isBlocked: model.is_blocked || false,
    favorites: model.favorites || [],
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => formatUser(pb.authStore.model));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      const formattedUser = formatUser(model);
      if (formattedUser && formattedUser.isBlocked) {
        logout();
      } else {
        setUser(formattedUser);
      }
    }, true);

    setLoading(false);
    return () => unsubscribe();
  }, []);

  // ▼▼▼ ИЗМЕНЕНИЕ: Вход всегда в нижнем регистре ▼▼▼
  const login = async (identity: string, pass: string): Promise<LoginStatus> => {
    try {
      const identityToTry = identity.toLowerCase(); // Приводим к нижнему регистру
      await pb.collection('users').authWithPassword(identityToTry, pass);
      return LoginStatus.SUCCESS;
    } catch (err) {
      return LoginStatus.WRONG_CREDENTIALS;
    }
  };

  // ▼▼▼ ИЗМЕНЕНИЕ: Регистрация всегда в нижнем регистре ▼▼▼
  const register = async (username: string, nickname: string, email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    try {
      await pb.collection('users').create({
        username: username.toLowerCase(), // Сохраняем в нижнем регистре
        email: email.toLowerCase(), // Сохраняем в нижнем регистре
        nickname: nickname,
        password: pass,
        passwordConfirm: pass,
        role: 'user',
      });
      // Авто-вход с данными в нижнем регистре
      await login(username.toLowerCase(), pass); 
      return { success: true, message: 'Регистрация успешна!' };
    } catch (err: any) {
      console.error("Register error:", err.response);
      const data = err.response?.data || {};
      
      if (data?.username?.message?.includes('must be unique')) {
           return { success: false, message: 'Этот логин уже зарегистрирован.' };
      }
      if (data?.email?.message?.includes('must be unique')) {
           return { success: false, message: 'Эта почта уже зарегистрирована.' };
      }
      if (data?.nickname?.message?.includes('must be unique')) {
           return { success: false, message: 'Этот никнейм уже занят.' };
      }
      return { success: false, message: 'Неизвестная ошибка регистрации.' };
    }
  };
  // ▲▲▲ КОНЕЦ ИЗМЕНЕНИЙ ▲▲▲

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
  };

  const updateProfile = async (updates: any): Promise<{ success: boolean; message: string }> => {
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
      if (updates.avatarFile) {
        formData.append('avatar', updates.avatarFile);
      } else if (updates.avatarFile === null) {
        formData.append('avatar', '');
      }
      const updatedUser = await pb.collection('users').update(user.id, formData);
      setUser(formatUser(updatedUser));
      await pb.collection('users').authRefresh();
      return { success: true, message: 'Профиль успешно обновлен.' };
    } catch (err: any) {
      if (err.response?.data?.oldPassword) return { success: false, message: 'Неверный текущий пароль.' };
      return { success: false, message: 'Ошибка обновления.' };
    }
  };

  const toggleFavorite = async (characterId: string) => {
    if (!user) return;
    const currentFavorites = user.favorites || [];
    const newFavorites = currentFavorites.includes(characterId)
      ? currentFavorites.filter((id) => id !== characterId)
      : [...currentFavorites, characterId];
    try {
      const updatedUser = await pb.collection('users').update(user.id, { favorites: newFavorites });
      setUser(formatUser(updatedUser));
    } catch (error) {
      console.error("Failed to update favorites:", error);
    }
  };

  // ▼▼▼ ИЗМЕНЕНИЕ: Проверка блокировки всегда в нижнем регистре ▼▼▼
  const isUserBlocked = async (identity: string): Promise<boolean> => {
    try {
      const identityToTry = identity.toLowerCase();
      const filter = `username = "${identityToTry}" || email = "${identityToTry}"`;
      const result = await pb.collection('users').getFirstListItem(filter, { '$autoCancel': false });
      return result?.is_blocked || false;
    } catch (error) {
      return false; 
    }
  };
  // ▲▲▲ КОНЕЦ ИЗМЕНЕНИЙ ▲▲▲

  const isAdmin = user?.role === 'admin';

  const value = { user, loading, login, register, logout, updateProfile, isAdmin, toggleFavorite, isUserBlocked };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}; 