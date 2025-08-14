// project/src/contexts/UserCharactersContext.tsx

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { pb } from '../lib/pocketbase';
import { UserCharacter, FilterState } from '../types';
import { useAuth } from './AuthContext';

interface UserCharactersContextType {
  userCharacters: UserCharacter[];
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  filteredUserCharacters: UserCharacter[];
  loading: boolean;
  loadUserCharacters: () => Promise<void>;
  addUserCharacter: (characterData: Omit<UserCharacter, 'id' | 'createdAt' | 'status'> | FormData) => Promise<boolean>;
  updateUserCharacter: (id: string, updates: Partial<UserCharacter> | FormData) => Promise<boolean>;
  deleteUserCharacter: (id: string) => Promise<boolean>;
}

const UserCharactersContext = createContext<UserCharactersContextType | undefined>(undefined);

const formatUserCharacter = (record: any): UserCharacter => ({
  ...record,
  id: record.id,
  createdAt: new Date(record.created),
  updatedAt: new Date(record.updated),
  photo: record.photo ? pb.getFileUrl(record, record.photo) : '',
  tags: record.tags || [],
  links: record.links || [],
  status: record.status,
});

export function UserCharactersProvider({ children }: { children: React.ReactNode }) {
  const [userCharacters, setUserCharacters] = useState<UserCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ search: '', gender: 'all', ageGroup: 'all', sortBy: 'newest' });
  const { user } = useAuth();

  const loadUserCharacters = useCallback(async () => {
    setLoading(true);
    try {
      const recs = await pb.collection('user_characters').getFullList({ 
        sort: '-created',
        '$autoCancel': false
      });
      
      let updatedRecs = recs;

      // ▼▼▼ ИЗМЕНЕНИЕ: Проверяем, является ли пользователь админом ▼▼▼
      if (user?.role === 'admin') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const updates: Promise<any>[] = [];
        updatedRecs = recs.map(rec => {
          const updatedAt = new Date(rec.updated);
          if (rec.status === 'approved' && rec.isNew && updatedAt < sevenDaysAgo) {
            updates.push(pb.collection('user_characters').update(rec.id, { isNew: false }));
            return { ...rec, isNew: false };
          }
          return rec;
        });

        if (updates.length > 0) {
          await Promise.all(updates).catch(e => console.error("Failed to auto-update 'isNew' status for user characters:", e));
        }
      }
      // ▲▲▲ КОНЕЦ ИЗМЕНЕНИЙ ▲▲▲

      setUserCharacters(updatedRecs.map(formatUserCharacter));

    } catch (e) {
      console.error("User char loading failed:", e);
    } finally {
      setLoading(false);
    }
  }, [user]); // <-- Добавляем user в зависимости

  useEffect(() => {
    loadUserCharacters();
  }, [loadUserCharacters]);
  
  const addUserCharacter = useCallback(async (characterData: Omit<UserCharacter, 'id' | 'createdAt' | 'status'> | FormData) => {
    if (!user) return false;
    try {
      const rec = await pb.collection('user_characters').create(characterData);
      setUserCharacters(p => [formatUserCharacter(rec), ...p]);
      return true;
    } catch (e) {
      console.error("Error adding user character:", e);
      return false;
    }
  }, [user]);

  const updateUserCharacter = useCallback(async (id: string, updates: Partial<UserCharacter> | FormData) => {
    try {
      const rec = await pb.collection('user_characters').update(id, updates);
      setUserCharacters(p => p.map(uc => uc.id === id ? formatUserCharacter(rec) : uc));
      return true;
    } catch (e) {
      console.error("Error updating user character:", e);
      return false;
    }
  }, []);

  const deleteUserCharacter = useCallback(async (id: string) => {
    try {
      await pb.collection('user_characters').delete(id);
      setUserCharacters(p => p.filter(uc => uc.id !== id));
      return true;
    } catch (e) {
      console.error("Error deleting user character:", e);
      return false;
    }
  }, []);

  const filteredUserCharacters = useMemo(() => userCharacters.filter(uc => {
    const isApproved = uc.status === 'approved';
    const isOwner = user && uc.createdBy === user.id;
    const isAdmin = user?.role === 'admin';
    return isApproved || isOwner || isAdmin;
  }).filter(uc => {
    const s = filters.search.toLowerCase();
    return (!s || uc.name.toLowerCase().includes(s) || uc.occupation.toLowerCase().includes(s)) &&
           (filters.gender === 'all' || uc.gender === filters.gender) &&
           (filters.ageGroup === 'all' || uc.ageGroup === filters.ageGroup);
  }).sort((a, b) => {
    if (filters.sortBy === 'rating') return b.rating - a.rating;
    if (filters.sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (filters.sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  }), [userCharacters, filters, user]);

  const value = {
    userCharacters,
    filters,
    setFilters,
    filteredUserCharacters,
    loading,
    loadUserCharacters,
    addUserCharacter,
    updateUserCharacter,
    deleteUserCharacter,
  };

  return <UserCharactersContext.Provider value={value}>{children}</UserCharactersContext.Provider>;
}

export const useUserCharacters = () => {
  const context = useContext(UserCharactersContext);
  if (!context) throw new Error('useUserCharacters must be used within a UserCharactersProvider');
  return context;
};