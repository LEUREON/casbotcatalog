// project/src/contexts/UserCharactersContext.tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { UserCharacter, FilterState } from '../types';

type CtxType = {
  userCharacters: UserCharacter[];
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  filteredUserCharacters: UserCharacter[];
  loading: boolean;
  loadUserCharacters: () => Promise<void>;
  addUserCharacter: (data: Omit<UserCharacter, 'id' | 'createdAt' | 'status'> | FormData) => Promise<boolean>;
  updateUserCharacter: (id: string, updates: Partial<UserCharacter> | FormData) => Promise<boolean>;
  deleteUserCharacter: (id: string) => Promise<boolean>;
  approveUserCharacter: (id: string) => Promise<boolean>;
  rejectUserCharacter: (id: string) => Promise<boolean>;
};

const defaultFilters: FilterState = {
  search: '',
  gender: 'all',
  ageGroup: 'all',
  sortBy: 'rating',
};

const Ctx = createContext<CtxType>({
  userCharacters: [],
  filters: defaultFilters,
  setFilters: () => {},
  filteredUserCharacters: [],
  loading: false,
  loadUserCharacters: async () => {},
  addUserCharacter: async () => true,
  updateUserCharacter: async () => true,
  deleteUserCharacter: async () => true,
  approveUserCharacter: async () => true,
  rejectUserCharacter: async () => true,
});

export const UserCharactersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userCharacters, setUserCharacters] = useState<UserCharacter[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [loading] = useState(false);

  // Больше не стучимся в PocketBase
  const loadUserCharacters = useCallback(async () => { return; }, []);

  const addUserCharacter: CtxType['addUserCharacter'] = useCallback(async (data) => {
    try {
      if (!(data instanceof FormData)) {
        const fake: UserCharacter = {
          ...(data as any),
          id: Math.random().toString(36).slice(2),
          createdAt: new Date(),
          status: 'pending',
        };
        setUserCharacters(prev => [fake, ...prev]);
      }
      return true;
    } catch { return false; }
  }, []);

  const updateUserCharacter: CtxType['updateUserCharacter'] = useCallback(async (id, updates) => {
    try {
      if (!(updates instanceof FormData)) {
        setUserCharacters(prev => prev.map(u => u.id === id ? { ...u, ...(updates as any) } : u));
      }
      return true;
    } catch { return false; }
  }, []);

  const deleteUserCharacter: CtxType['deleteUserCharacter'] = useCallback(async (id) => {
    try { setUserCharacters(prev => prev.filter(u => u.id != id)); return true; }
    catch { return false; }
  }, []);

  const approveUserCharacter: CtxType['approveUserCharacter'] = useCallback(async (id) => {
    try { setUserCharacters(prev => prev.map(u => u.id === id ? { ...u, status: 'approved' } : u)); return true; }
    catch { return false; }
  }, []);

  const rejectUserCharacter: CtxType['rejectUserCharacter'] = useCallback(async (id) => {
    try { setUserCharacters(prev => prev.map(u => u.id === id ? { ...u, status: 'rejected' } : u)); return true; }
    catch { return false; }
  }, []);

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
