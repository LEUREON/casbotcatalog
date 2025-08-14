// project/src/pages/NotificationsPage.tsx

import React, { useEffect, useState } from 'react';
import { Bell, MessageSquare, UserCheck, Mail, Bot, UserPlus, XCircle, ThumbsUp } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Notification, Newsletter } from '../types';

type CombinedItem = (Notification | Newsletter) & { itemType: 'notification' | 'newsletter' };

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'reply': return <MessageSquare className="h-5 w-5 text-cyan-400" />;
        case 'status_change': return <UserCheck className="h-5 w-5 text-green-400" />;
        case 'admin_reply': return <Mail className="h-5 w-5 text-purple-400" />;
        case 'new_order': return <Bot className="h-5 w-5 text-green-400" />;
        case 'new_message': return <MessageSquare className="h-5 w-5 text-yellow-400" />;
        case 'new_user_character': return <UserPlus className="h-5 w-5 text-teal-400" />;
        case 'like': return <ThumbsUp className="h-5 w-5 text-green-400" />;
        case 'support_reply': return <Mail className="h-5 w-5 text-purple-400" />;
        default: return <Bell className="h-5 w-5 text-slate-400" />;
    }
}

export function NotificationsPage() {
    const { user, isAdmin } = useAuth();
    const { notifications, newsletters, markNotificationAsRead, loadNotifications, loadNewsletters } = useData();
    const navigate = useNavigate();
    const [selectedItem, setSelectedItem] = useState<Newsletter | null>(null);

    useEffect(() => {
        if (user) {
            loadNotifications();
            loadNewsletters();
        }
    }, [user, loadNotifications, loadNewsletters]);

    const handleItemClick = (item: CombinedItem) => {
        if (item.itemType === 'notification') {
            if (!item.isRead) {
                markNotificationAsRead(item.id);
            }

            if (isAdmin) {
                switch(item.type) {
                    case 'new_order': navigate('/admin', { state: { initialTab: 'orders' } }); return;
                    case 'new_message': navigate('/admin', { state: { initialTab: 'messages' } }); return;
                    case 'new_user_character': navigate('/admin', { state: { initialTab: 'user-characters' } }); return;
                }
            }
            
            if (item.type === 'reply' || item.type === 'status_change' || item.type === 'like') {
                navigate(`/characters/${item.entityId}`);
            }
            
            if (item.type === 'support_reply') {
                 navigate('/support', { state: { ticketId: item.entityId } });
            }
        } else {
            setSelectedItem(item as Newsletter);
        }
    };
    
    const combinedList: CombinedItem[] = [
        ...notifications.map(n => ({ ...n, itemType: 'notification' as const })),
        ...newsletters.map(n => ({ ...n, itemType: 'newsletter' as const })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <>
            <div className="min-h-screen p-4 lg:p-8">
              <div className="mb-8">
                  <div className="relative glass rounded-3xl p-6 lg:p-8 border border-yellow-500/20 shadow-2xl">
                      <div className="flex items-center space-x-4">
                          <div className="relative p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl border border-white/20 shadow-2xl">
                              <Bell className="h-8 w-8 text-white" />
                          </div>
                          <div>
                              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">
                                  Уведомления
                              </h1>
                              <p className="text-slate-400">
                                  {unreadCount > 0 ? `У вас ${unreadCount} новых уведомлений` : 'Нет новых уведомлений'}
                              </p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="max-w-2xl mx-auto space-y-3">
                  {combinedList.length > 0 ? (
                      combinedList.map(item => (
                          <motion.div
                              key={`${item.itemType}-${item.id}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              onClick={() => handleItemClick(item)}
                              className={`relative glass-light rounded-xl p-4 border transition-all cursor-pointer hover:bg-white/5 ${
                                  item.itemType === 'notification' && !item.isRead ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/10'
                              }`}
                          >
                              {item.itemType === 'notification' && !item.isRead && (
                                  <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-cyan-400 rounded-full"></div>
                              )}
                              <div className="flex items-start space-x-4">
                                  <div className="p-2 bg-slate-800/50 rounded-full mt-1">
                                      {item.itemType === 'notification' ? getNotificationIcon(item.type) : <Mail className="h-5 w-5 text-amber-400" />}
                                  </div>
                                  <div>
                                      <p className="text-white">
                                          {item.itemType === 'notification' ? (
                                            <>
                                              <span className="font-bold">{item.senderName}</span> {item.message}
                                            </>
                                          ) : (
                                            <span className="font-bold">{item.title}</span>
                                          )}
                                      </p>
                                      <p className="text-xs text-slate-400 mt-1">
                                          {new Date(item.createdAt).toLocaleString()}
                                      </p>
                                  </div>
                              </div>
                          </motion.div>
                      ))
                  ) : (
                      <div className="text-center py-16 glass rounded-2xl">
                          <Bell className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-white">Здесь пока пусто</h3>
                          <p className="text-slate-400">Новые уведомления будут появляться тут.</p>
                      </div>
                  )}
              </div>
            </div>

            {selectedItem && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedItem(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl border border-white/20"
                    >
                        {selectedItem.image && <img src={selectedItem.image} alt={selectedItem.title} className="w-full h-64 object-cover" />}
                        <div className="p-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">{selectedItem.title}</h2>
                                    <p className="text-xs text-slate-400 mb-4">
                                        От Администрации • {new Date(selectedItem.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedItem(null)} className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-white"><XCircle /></button>
                            </div>
                            <div
                                className="prose prose-invert prose-sm text-slate-300 max-w-none"
                                dangerouslySetInnerHTML={{ __html: selectedItem.content || '' }}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}