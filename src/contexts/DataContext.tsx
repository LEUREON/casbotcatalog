// project/src/contexts/DataContext.tsx

import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { pb } from '../lib/pocketbase';
import { Character, User, FilterState, CharacterOrder, ShopItem, Message, Notification, Newsletter } from '../types';
import { useAuth } from './AuthContext';

type Orders = CharacterOrder[];
type ShopItems = ShopItem[];
type Messages = Message[];

interface DataContextType {
  characters: Character[];
  users: User[];
  orders: Orders;
  shopItems: ShopItem[];
  messages: Message[];
  notifications: Notification[];
  newsletters: Newsletter[];
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  filteredCharacters: Character[];
  loading: boolean;
  charactersLoading: boolean;
  usersLoading: boolean;
  shopItemsLoading: boolean;
  updateCharacter: (id: string, updates: Partial<Character> | FormData) => Promise<boolean>;
  addCharacter: (characterData: Omit<Character, 'id' | 'createdAt'> | FormData) => Promise<boolean>;
  deleteCharacter: (id: string) => Promise<boolean>;
  loadCharacters: () => Promise<void>;
  loadUsers: () => Promise<void>;
  updateUser: (id: string, updates: Partial<User> | FormData) => Promise<boolean>;
  loadOrders: () => Promise<void>;
  addOrder: (orderData: Partial<CharacterOrder>) => Promise<boolean>;
  updateOrder: (id: string, updates: Partial<CharacterOrder>) => Promise<void>;
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
}


const DataContext = createContext<DataContextType | undefined>(undefined);

const formatRecord = (record: any) => ({ ...record, id: record.id, createdAt: new Date(record.created), updatedAt: new Date(record.updated) });
const formatCharacter = (record: any): Character => ({ 
    ...formatRecord(record), 
    photo: record.photo ? pb.getFileUrl(record, record.photo) : '',
    tags: record.tags || [], 
    links: record.links || [],
    dominantColor: record.dominantColor || '',
});
const formatUser = (model: any): User => ({ id: model.id, username: model.username, nickname: model.nickname, email: model.email, role: model.role, avatar: model.avatar ? pb.getFileUrl(model, model.avatar) : undefined, createdAt: new Date(model.created), isBlocked: model.is_blocked || false, favorites: model.favorites || [] });
const formatOrder = (record: any): CharacterOrder => formatRecord(record);
const formatShopItem = (record: any): ShopItem => formatRecord(record);
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
  const [orders, setOrders] = useState<Orders>([]);
  const [shopItems, setShopItems] = useState<ShopItems>([]);
  const [messages, setMessages] = useState<Messages>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [shopItemsLoading, setShopItemsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ search: '', gender: 'all', ageGroup: 'all', sortBy: 'newest' });
  const { user, isAdmin, toggleFavorite } = useAuth();
  const initialLoadDone = useRef(false);

  const loadCharacters = useCallback(async () => {
    setCharactersLoading(true);
    try {
      const recs = await pb.collection('characters').getFullList({ sort: '-created', '$autoCancel': false });
      
      let updatedRecs = recs;
      if (user?.role === 'admin') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const updates: Promise<any>[] = [];
        updatedRecs = recs.map(rec => {
          const updatedAt = new Date(rec.updated);
          if (rec.isNew && updatedAt < sevenDaysAgo) {
            updates.push(pb.collection('characters').update(rec.id, { isNew: false }));
            return { ...rec, isNew: false };
          }
          return rec;
        });

        if (updates.length > 0) {
          await Promise.all(updates).catch(e => console.error("Failed to auto-update 'isNew' status:", e));
        }
      }

      setCharacters(updatedRecs.map(formatCharacter));

    } catch (e) { 
      console.error("Char loading failed:", e); 
    } finally { 
      setCharactersLoading(false); 
    }
  }, [user]);
  
  const loadUsers = useCallback(async () => { setUsersLoading(true); try { const recs = await pb.collection('users').getFullList({sort: '-created', '$autoCancel': false}); setUsers(recs.map(formatUser)); } catch (e) { console.error("Failed to load users", e); } finally { setUsersLoading(false); } }, []);
  const loadOrders = useCallback(async () => { try { const recs = await pb.collection('character_orders').getFullList({ sort: '-created' }); setOrders(recs.map(formatOrder)); } catch(e) { console.error("Failed to load orders", e); } }, []);
  const loadShopItems = useCallback(async () => { setShopItemsLoading(true); try { const recs = await pb.collection('shop_items').getFullList({ sort: '-created' }); setShopItems(recs.map(formatShopItem)); } catch (e) { console.error("Failed to load shop items", e); } finally { setShopItemsLoading(false); } }, []);
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
            loadMessages()
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
  const addCharacter = useCallback(async (characterData: Omit<Character, 'id' | 'createdAt'> | FormData) => { try { const rec = await pb.collection('characters').create(characterData); setCharacters(p => [formatCharacter(rec), ...p]); return true; } catch (e) { console.error("Error adding character:", e); return false; } }, []);
  const deleteCharacter = useCallback(async (id: string) => { try { await pb.collection('characters').delete(id); setCharacters(p => p.filter(c => c.id !== id)); return true; } catch (e) { console.error("Error deleting character:", e); return false; } }, []);
  
  const addOrder = useCallback(async (orderData: Partial<CharacterOrder>) => {
    if (!user) return false;
    try {
      const rec = await pb.collection('character_orders').create({ ...orderData, user_id: user.id, userName: user.nickname, status: 'pending' });
      setOrders(p => [formatOrder(rec), ...p]);
      return true;
    } catch (e) {
      console.error("Failed to add order", e);
      return false;
    }
  }, [user]);
  
  const updateOrder = useCallback(async (id: string, updates: Partial<CharacterOrder>) => { try { const rec = await pb.collection('character_orders').update(id, updates); setOrders(p => p.map(o => o.id === id ? formatOrder(rec) : o)); } catch (e) { console.error("Failed to update order", e); } }, []);
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

  const filteredCharacters = useMemo(() => characters.filter(c => { const s=filters.search.toLowerCase(); return(!s||c.name.toLowerCase().includes(s)||c.occupation.toLowerCase().includes(s))&& (filters.gender==='all'||c.gender===filters.gender)&&(filters.ageGroup==='all'||c.ageGroup===filters.ageGroup);}).sort((a,b) => { if(filters.sortBy==='rating')return b.rating-a.rating; if(filters.sortBy==='newest')return new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime(); if(filters.sortBy==='name')return a.name.localeCompare(b.name); return 0; }), [characters, filters]);
  
  // @ts-ignore
  const value: DataContextType = { loading, characters, users, orders, shopItems, messages, notifications, newsletters, filters, setFilters, filteredCharacters, charactersLoading, usersLoading, shopItemsLoading, updateCharacter, addCharacter, deleteCharacter, loadCharacters, loadUsers, updateUser, loadOrders, addOrder, updateOrder, loadShopItems, addShopItem, updateShopItem, deleteShopItem, loadMessages, addMessage, updateMessage, toggleFavorite, addNotification, markNotificationAsRead, loadNotifications, loadNewsletters, addNewsletter, updateNewsletter, deleteNewsletter };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => { const context = useContext(DataContext); if (!context) throw new Error('useData must be used within a DataProvider'); return context; };