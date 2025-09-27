// project/src/contexts/DataContext.tsx

import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { pb } from '../lib/pocketbase';
import { Character, User, FilterState, ShopItem, Message, Notification, Newsletter } from '../types';
import { useAuth } from './AuthContext';

type ShopItems = ShopItem[];
type Messages = Message[];

interface DataContextType {
  characters: Character[];
  users: User[];
  shopItems: ShopItem[];
  messages: Message[];
  notifications: Notification[];
  newsletters: Newsletter[];
  filters: FilterState;
  setFilters: (filters: FilterState | ((prev: FilterState) => FilterState)) => void;
  filteredCharacters: Character[];
  loading: boolean;
  charactersLoading: boolean;
  usersLoading: boolean;
  shopItemsLoading: boolean;
  updateCharacter: (id: string, updates: Partial<Character> | FormData) => Promise<boolean>;
  addCharacter: (characterData: Omit<Character, 'id' | 'createdAt'> | FormData) => Promise<any>;
  deleteCharacter: (id: string) => Promise<boolean>;
  loadCharacters: () => Promise<void>;
  loadUsers: () => Promise<void>;
  updateUser: (id: string, updates: Partial<User> | FormData) => Promise<boolean>;
  loadShopItems: () => Promise<void>;
  addShopItem: (itemData: any) => Promise<void>;
  updateShopItem: (id: string, updates: any) => Promise<void>;
  deleteShopItem: (id: string) => Promise<void>;
  loadMessages: () => Promise<void>;
  addMessage: (data: FormData) => Promise<boolean>;
  updateMessage: (id: string, updates: Partial<Message>) => Promise<void>;
  toggleFavorite: (characterId: string) => Promise<void>;
  addNotification: (notificationData: Omit<Notification, 'id' | 'createdAt'> | FormData) => Promise<boolean>;
  markNotificationAsRead: (id: string) => Promise<boolean>;
  loadNotifications: () => Promise<void>;
  loadNewsletters: () => Promise<void>;
  addNewsletter: (data: FormData) => Promise<boolean>;
  updateNewsletter: (id: string, data: FormData) => Promise<boolean>;
  deleteNewsletter: (id: string) => Promise<boolean>;
  allCategories: string[];
  allTags: string[];
}


const DataContext = createContext<DataContextType | undefined>(undefined);

const formatRecord = (record: any) => ({ ...record, id: record.id, createdAt: new Date(record.created), updatedAt: new Date(record.updated) });
const formatCharacter = (record: any): Character => ({
    ...formatRecord(record),
    photo: record.photo ? pb.getFileUrl(record, record.photo) : '',
    tags: record.tags || [],
    category: record.category || [],
    dominantColor: record.dominantColor || '',
    links: Array.isArray(record.links) ? record.links : [],
    isNew: record.isNew || false, // Убедимся, что isNew всегда boolean
});
const formatUser = (model: any): User => ({ id: model.id, username: model.username, nickname: model.nickname, email: model.email, role: model.role, avatar: model.avatar ? pb.getFileUrl(model, model.avatar) : undefined, createdAt: new Date(model.created), isBlocked: model.is_blocked || false, favorites: model.favorites || [] });
const formatShopItem = (record: any): ShopItem => ({
    ...formatRecord(record),
    image: record.image ? pb.getFileUrl(record, record.image) : '',
    actionButtons: Array.isArray(record.actionButtons) ? record.actionButtons : [],
});
const formatMessage = (record: any): Message => {
    const files = record.files || [];
    const fileArray = Array.isArray(files) ? files : [files];
    return {
        ...formatRecord(record),
        userId: record.expand?.user_id?.id || record.user_id,
        userName: record.expand?.user_id?.nickname || record.userName,
        files: fileArray.length > 0 ? fileArray.map((f: string) => pb.getFileUrl(record, f)) : []
    };
};
const formatNotification = (record: any): Notification => ({ ...formatRecord(record), image: record.image ? pb.getFileUrl(record, record.image) : undefined });
const formatNewsletter = (record: any): Newsletter => ({ ...formatRecord(record), image: record.image ? pb.getFileUrl(record, record.image) : undefined });

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shopItems, setShopItems] = useState<ShopItems>([]);
  const [messages, setMessages] = useState<Messages>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [shopItemsLoading, setShopItemsLoading] = useState(false);
  
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  const [filters, setFilters] = useState<FilterState>({ 
    search: '', 
    gender: 'all', 
    ageGroup: 'all', 
    sortBy: 'newest', 
    includeTags: [], 
    excludeTags: [],
    includeCategories: [],
    excludeCategories: [],
  });

  const { user, isAdmin, toggleFavorite } = useAuth();
  const initialLoadDone = useRef(false);

  // ✅ НАЧАЛО: Добавлена логика "хука" для сайта
  const checkAndResetNewBadges = useCallback(async (characterRecords: any[]) => {
      if (!isAdmin) return; // Эту проверку делает только админ

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const charactersToUpdate: Promise<any>[] = [];

      characterRecords.forEach((char) => {
          if (char.isNew) {
              const lastUpdated = new Date(char.updated);
              if (lastUpdated < sevenDaysAgo) {
                  console.log(`Снимаем флаг 'Новый' с персонажа: ${char.name}`);
                  charactersToUpdate.push(
                      pb.collection('characters').update(char.id, { 'isNew': false })
                  );
              }
          }
      });

      if (charactersToUpdate.length > 0) {
          await Promise.allSettled(charactersToUpdate);
          // После обновления данных на сервере, перезагружаем список, чтобы видеть актуальное состояние
          await loadCharacters(); 
      }
  }, [isAdmin]);
  // ✅ КОНЕЦ

  const loadCharacters = useCallback(async () => {
    setCharactersLoading(true);
    try {
      const recs = await pb.collection('characters').getFullList({ sort: '-created', '$autoCancel': false });
      
      // ✅ Запускаем проверку бейджей перед отображением данных
      await checkAndResetNewBadges(recs);

      setCharacters(recs.map(formatCharacter));
      
      const categoriesSet = new Set<string>();
      const tagsSet = new Set<string>();
      recs.forEach(char => {
        (char.category || []).forEach((cat: string) => categoriesSet.add(cat));
        (char.tags || []).forEach((tag: string) => tagsSet.add(tag));
      });
      setAllCategories(Array.from(categoriesSet).sort());
      setAllTags(Array.from(tagsSet).sort());

    } catch (e) {
      console.error("Char loading failed:", e);
    } finally {
      setCharactersLoading(false);
    }
  }, [checkAndResetNewBadges]); // Добавляем зависимость

  const loadUsers = useCallback(async () => { setUsersLoading(true); try { const recs = await pb.collection('users').getFullList({sort: '-created', '$autoCancel': false}); setUsers(recs.map(formatUser)); } catch (e) { console.error("Failed to load users", e); } finally { setUsersLoading(false); } }, []);
  const loadShopItems = useCallback(async () => { setShopItemsLoading(true); try { const recs = await pb.collection('shop_items').getFullList({ sort: '-created', '$autoCancel': false }); setShopItems(recs.map(formatShopItem)); } catch (e) { console.error("Failed to load shop items", e); } finally { setShopItemsLoading(false); } }, []);
  const loadMessages = useCallback(async () => {
    try {
      const recs = await pb.collection('messages').getFullList({sort: '-created', '$autoCancel': false, expand: 'user_id'});
      setMessages(recs.map(formatMessage));
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const recs = await pb.collection('notifications').getFullList({
        filter: `recipientId = "${user.id}"`,
        sort: '-created',
        '$autoCancel': false
      });
      setNotifications(recs.map(formatNotification));
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  }, [user]);
  const loadNewsletters = useCallback(async () => {
    try {
      const recs = await pb.collection('newsletters').getFullList({ sort: '-created', '$autoCancel': false });
      setNewsletters(recs.map(formatNewsletter));
    } catch (e) {
      console.error("Failed to load newsletters", e);
    }
  }, []);


  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const loadAllData = async () => {
        const promises = [
            loadCharacters(),
            loadUsers(),
            loadNotifications(),
            loadNewsletters(),
            loadMessages(),
        ];
        await Promise.allSettled(promises);
        setLoading(false);
    };

    loadAllData();

    pb.collection('messages').subscribe('*', () => {
        loadMessages();
    });

    return () => {
        pb.collection('messages').unsubscribe('*');
    };

  }, [loadCharacters, loadUsers, loadNotifications, loadNewsletters, loadMessages]);

  const addNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'createdAt'> | FormData) => {
    try {
      await pb.collection('notifications').create(notificationData, { '$autoCancel': false });
      return true;
    } catch (e) {
      console.error("Error adding notification:", e);
      return false;
    }
  }, []);

  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      const updated = await pb.collection('notifications').update(id, { isRead: true });
      setNotifications(prev => prev.map(n => n.id === id ? formatNotification(updated) : n));
      return true;
    } catch (e) {
      console.error("Error marking notification as read:", e);
      return false;
    }
  }, []);

  const updateUser = useCallback(async (id: string, updates: Partial<User> | FormData) => {
    try {
      await pb.collection('users').update(id, updates);
      await loadUsers();
      return true;
    } catch (e) {
      console.error("Failed to update user", e);
      return false;
    }
  }, [loadUsers]);

  const updateCharacter = useCallback(async (id: string, updates: Partial<Character> | FormData) => { try { const rec = await pb.collection('characters').update(id, updates); setCharacters(p => p.map(c => c.id === id ? formatCharacter(rec) : c)); return true; } catch(e) { console.error("Error updating character:", e); return false; } }, []);
  const addCharacter = useCallback(async (characterData: Omit<Character, 'id' | 'createdAt'> | FormData) => { try { const rec = await pb.collection('characters').create(characterData); setCharacters(p => [formatCharacter(rec), ...p]); return rec; } catch (e) { console.error("Error adding character:", e); return false; } }, []);
  const deleteCharacter = useCallback(async (id: string) => { try { await pb.collection('characters').delete(id); setCharacters(p => p.filter(c => c.id !== id)); return true; } catch (e) { console.error("Error deleting character:", e); return false; } }, []);
  
  const addShopItem = useCallback(async (itemData: any) => { try { const rec = await pb.collection('shop_items').create(itemData); setShopItems(p => [formatShopItem(rec), ...p]); } catch (e) { console.error("Failed to add shop item", e); } }, []);
  const updateShopItem = useCallback(async (id: string, updates: any) => { try { const rec = await pb.collection('shop_items').update(id, updates); setShopItems(p => p.map(i => i.id === id ? formatShopItem(rec) : i)); } catch (e) { console.error("Failed to update shop item", e); } }, []);
  const deleteShopItem = useCallback(async (id: string) => { try { await pb.collection('shop_items').delete(id); setShopItems(p => p.filter(i => i.id !== id)); } catch (e) { console.error("Failed to delete shop item", e); } }, []);
  
  const addMessage = useCallback(async (data: FormData) => {
    if (!user) return false;
    try {
      const isNewTicket = data.get('isTicket') === 'true';
      
      data.append('user_id', user.id);
      data.append('userName', user.nickname);
      
      if (isAdmin) {
        data.append('isReadByAdmin', 'true');
        data.append('isReadByUser', 'false');
      } else {
        data.append('isReadByAdmin', 'false');
        data.append('isReadByUser', 'true');
      }

      const newRecord = await pb.collection('messages').create(data, { '$autoCancel': false, expand: 'user_id' });
      
      setMessages(prev => [formatMessage(newRecord), ...prev]);

      const parentId = data.get('parent') as string | null;
      const allMessages = [...messages, formatMessage(newRecord)];
      const parentMessage = parentId ? allMessages.find(m => m.id === parentId) : null;
      
      if (isNewTicket && !isAdmin) {
        const admins = users.filter(u => u.role === 'admin');
        for (const admin of admins) {
          await addNotification({
            recipientId: admin.id,
            senderId: user.id,
            senderName: user.nickname,
            type: 'new_message',
            entityId: newRecord.id,
            message: `создал новый тикет: "${newRecord.subject}"`,
            isRead: false
          });
        }
      } else if (parentMessage) {
          if (isAdmin) {
              if (parentMessage.userId !== user.id) {
                  await addNotification({
                      recipientId: parentMessage.userId,
                      senderId: user.id,
                      senderName: 'Поддержка',
                      type: 'support_reply',
                      entityId: parentMessage.id,
                      message: `ответил на ваш тикет: "${parentMessage.subject}"`,
                      isRead: false
                  });
              }
          } else {
               const admins = users.filter(u => u.role === 'admin');
               for (const admin of admins) {
                  await addNotification({
                      recipientId: admin.id,
                      senderId: user.id,
                      senderName: user.nickname,
                      type: 'support_reply',
                      entityId: parentMessage.id,
                      message: `ответил на тикет: "${parentMessage.subject}"`,
                      isRead: false
                  });
               }
          }
      }
      return true;
    } catch (e) {
      console.error("Failed to add message:", e);
      return false;
    }
  }, [user, isAdmin, users, messages, addNotification]);

  const updateMessage = useCallback(async (id: string, updates: Partial<Message>) => { try { const rec = await pb.collection('messages').update(id, updates, { '$autoCancel': false }); setMessages(p => p.map(m => m.id === id ? formatMessage(rec) : m)); } catch (e) { console.error("Failed to update message", e); } }, []);

  const addNewsletter = useCallback(async (data: FormData) => {
    try {
      const newRecord = await pb.collection('newsletters').create(data);
      setNewsletters(prev => [formatNewsletter(newRecord), ...prev].sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime()));
      return true;
    } catch(e) {
      console.error("Failed to add newsletter:", e);
      return false;
    }
  }, []);

  const updateNewsletter = useCallback(async (id: string, data: FormData) => {
    try {
      const updatedRecord = await pb.collection('newsletters').update(id, data);
      setNewsletters(prev => prev.map(n => n.id === id ? formatNewsletter(updatedRecord) : n));
      return true;
    } catch(e) {
      console.error("Failed to update newsletter:", e);
      return false;
    }
  }, []);

  const deleteNewsletter = useCallback(async (id: string) => {
    try {
      await pb.collection('newsletters').delete(id);
      setNewsletters(prev => prev.filter(n => n.id !== id));
      return true;
    } catch(e) {
      console.error("Failed to delete newsletter:", e);
      return false;
    }
  }, []);

  const filteredCharacters = useMemo(() => {
    return characters
      .filter(char => {
        const searchTerm = (filters.search || "").toLowerCase();
        const searchMatch = !searchTerm || 
          char.name.toLowerCase().includes(searchTerm) ||
          (char.occupation || "").toLowerCase().includes(searchTerm) ||
          (char.description || "").toLowerCase().includes(searchTerm);

        const genderMatch = filters.gender === 'all' || char.gender === filters.gender;
        const ageGroupMatch = filters.ageGroup === 'all' || char.ageGroup === filters.ageGroup;
        
        const includeTagsMatch = filters.includeTags.length === 0 || 
          filters.includeTags.every(tag => (char.tags || []).includes(tag));
          
        const excludeTagsMatch = filters.excludeTags.length === 0 || 
          !filters.excludeTags.some(tag => (char.tags || []).includes(tag));

        const includeCategoriesMatch = filters.includeCategories.length === 0 ||
          filters.includeCategories.some(cat => (char.category || []).includes(cat));

        const excludeCategoriesMatch = filters.excludeCategories.length === 0 ||
          !filters.excludeCategories.some(cat => (char.category || []).includes(cat));

        return searchMatch && genderMatch && ageGroupMatch && includeTagsMatch && excludeTagsMatch && includeCategoriesMatch && excludeCategoriesMatch;
      })
      .sort((a, b) => {
        if (filters.sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        if (filters.sortBy === "name") return a.name.localeCompare(b.name);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [characters, filters]);
  
  //@ts-ignore
  const value: DataContextType = { 
      loading, characters, users, shopItems, messages, notifications, newsletters, 
      filters, setFilters, filteredCharacters, charactersLoading, usersLoading, 
      shopItemsLoading, updateCharacter, addCharacter, deleteCharacter, loadCharacters, 
      loadUsers, updateUser, loadShopItems, addShopItem, updateShopItem, deleteShopItem, 
      loadMessages, addMessage, updateMessage, toggleFavorite, addNotification, 
      markNotificationAsRead, loadNotifications, loadNewsletters, addNewsletter, 
      updateNewsletter, deleteNewsletter,
      allCategories, 
      allTags 
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => { const context = useContext(DataContext); if (!context) throw new Error('useData must be used within a DataProvider'); return context; };