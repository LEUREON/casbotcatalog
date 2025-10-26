// src/contexts/UserCharactersContext.tsx
import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import type { UserCharacter, FilterState } from '../types';
import { pb } from '../lib/pocketbase'; // 1. Импортируем pb
import { useAuth } from './AuthContext'; // 2. Импортируем useAuth
import type { RecordModel } from 'pocketbase';

// 3. Обновляем тип
type CtxType = {
  userCharacters: UserCharacter[];
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  filteredUserCharacters: UserCharacter[];
  loading: boolean;
  loadUserCharacters: () => Promise<void>; // (refetch)
  addUserCharacter: (data: FormData) => Promise<boolean>; // 4. Принимает FormData
  updateUserCharacter: (id: string, updates: Partial<UserCharacter> | FormData) => Promise<boolean>;
  deleteUserCharacter: (id: string) => Promise<boolean>;
  approveUserCharacter: (id: string) => Promise<boolean>;
  rejectUserCharacter: (id: string) => Promise<boolean>;
};

const defaultFilters: FilterState = {
  search: '',
  gender: 'all',
  ageGroup: 'all',
  sortBy: 'newest', // 5. Меняем на 'newest'
};

const Ctx = createContext<CtxType>({
  userCharacters: [],
  filters: defaultFilters,
  setFilters: () => {},
  filteredUserCharacters: [],
  loading: true, // 6. Загрузка по умолчанию
  loadUserCharacters: async () => {},
  addUserCharacter: async () => false, // 7. Меняем на false
  updateUserCharacter: async () => false,
  deleteUserCharacter: async () => false,
  approveUserCharacter: async () => false,
  rejectUserCharacter: async () => false,
});

// 8. Новая функция для форматирования данных из PB
const formatUserCharacter = (record: RecordModel): UserCharacter => {
  return {
    id: record.id,
    user: record.user,
    name: record.name,
    occupation: record.occupation,
    description: record.description,
    fullDescription: record.fullDescription,
    gender: record.gender,
    age: record.age,
    ageGroup: record.ageGroup,
    // @ts-ignore
    photo: record.photo ? pb.getFileUrl(record, record.photo) : undefined,
    links: record.links || [], // Поле JSON
    tags: record.tags || [], // Поле JSON
    category: record.category || [], // Поле JSON
    status: record.status,
    createdAt: new Date(record.created),
    // Авторские поля из user_characters (для отображения автора без expand)
    // @ts-ignore
    authorName: (record as any).authorName || (record as any).ownerName || (record as any).nickname || (record as any).username || (record as any).userName,
    // @ts-ignore
    ownerName: (record as any).ownerName,
    // @ts-ignore
    username: (record as any).username || (record as any).userName,
    // @ts-ignore
    nickname: (record as any).nickname,
    // Явно прокидываем updatedAt
    // @ts-ignore
    updatedAt: new Date((record as any).updated),
  };
};

export const UserCharactersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth(); // 9. Получаем пользователя
  const [userCharacters, setUserCharacters] = useState<UserCharacter[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [loading, setLoading] = useState(true); // 10. Устанавливаем реальный loading

  // 11. РЕАЛЬНАЯ загрузка персонажей
  const loadUserCharacters = useCallback(async () => {
    if (!user) {
      setUserCharacters([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const records = await pb.collection('user_characters').getFullList<RecordModel>({
        filter: `user = "${user.id}"`, // Только персонажи этого юзера
        sort: '-created',
      });
      setUserCharacters(records.map(formatUserCharacter));
    } catch (err) {
      console.error('Failed to load user characters:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 12. Загружаем при монтировании
  useEffect(() => {
    loadUserCharacters();
  }, [loadUserCharacters]);

  // 13. РЕАЛЬНОЕ добавление персонажа
  const addUserCharacter: CtxType['addUserCharacter'] = useCallback(async (data: FormData) => {
    if (!user) return false;
    
    // 'user' и 'status' будут добавлены автоматически через API Rules
    
    try {
      const newRecord = await pb.collection('user_characters').create(data);
      // Добавляем в состояние, чтобы UI обновился мгновенно
      setUserCharacters(prev => [formatUserCharacter(newRecord), ...prev]);
      return true;
    } catch (err) {
      console.error('Failed to add user character:', err);
      return false;
    }
  }, [user]);

  // 14. Функции-заглушки (пока не реализованы)
  const updateUserCharacter: CtxType['updateUserCharacter'] = useCallback(async (id, updates) => {
    console.warn('updateUserCharacter not implemented');
    return false;
  }, []);
  const deleteUserCharacter: CtxType['deleteUserCharacter'] = useCallback(async (id) => {
    console.warn('deleteUserCharacter not implemented');
    return false;
  }, []);
  const approveUserCharacter: CtxType['approveUserCharacter'] = useCallback(async (id) => {
    console.warn('approveUserCharacter not implemented');
    return false;
  }, []);
  const rejectUserCharacter: CtxType['rejectUserCharacter'] = useCallback(async (id) => {
    console.warn('rejectUserCharacter not implemented');
    return false;
  }, []);

  // 15. Логика фильтрации (взята из вашего файла)
  const filteredUserCharacters = useMemo(() => {
    const q = filters.search.toLowerCase();
    let list = [...userCharacters];
    if (filters.gender !== 'all') list = list.filter(c => (c as any).gender === filters.gender);
    if (filters.ageGroup !== 'all') list = list.filter(c => (c as any).ageGroup === filters.ageGroup);
    if (q) list = list.filter(c => (c.name || '').toLowerCase().includes(q));
    if (filters.sortBy === 'name') list.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
    if (filters.sortBy === 'newest') list.sort((a,b)=>+new Date(b.createdAt) - +new Date(a.createdAt));
    return list;
  }, [userCharacters, filters]);

  const value: CtxType = {
    userCharacters,
    filters,
    setFilters,
    filteredUserCharacters,
    loading,
    loadUserCharacters,
    addUserCharacter,
    updateUserCharacter,
    deleteUserCharacter,
    approveUserCharacter,
    rejectUserCharacter,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useUserCharacters = () => useContext(Ctx);