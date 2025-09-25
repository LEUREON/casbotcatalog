// project/src/pages/NotificationsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Bell, MessageSquare, UserCheck, Mail, Bot, UserPlus, XCircle, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Notification, Newsletter } from '../types';
import ThemedBackground from '../components/common/ThemedBackground';

// === 🎨 ЕДИНАЯ ДИЗАЙН-СИСТЕМА (СИНХРОНИЗИРОВАНА С CharacterPage.tsx) ===
const DESIGN = {
  colors: {
    text: {
      primary: "#ffffff",
      secondary: "#e0e0e0",
      muted: "#b0b0b0",
      accent: "#d7aefb",
    },
    background: {
      glass: "rgba(40, 40, 50, 0.65)",
      glassHover: "rgba(50, 50, 65, 0.8)",
      floating: "rgba(30, 30, 40, 0.8)",
      dark: "#121218",
      item: "rgba(255,255,255,0.04)",
      reply: "rgba(35, 25, 55, 0.7)",
    },
    border: "rgba(255, 255, 255, 0.08)",
    accent: {
      primary: "#d7aefb",
      secondary: "#ff6bd6",
      tertiary: "#8a75ff",
      glow: "rgba(215, 174, 251, 0.4)",
    },
    star: {
      filled: "#FFD700",
      glow: "rgba(255, 215, 0, 0.6)",
    },
    badges: {
      male: "#87cefa",
      female: "#ffb6c1",
      age: "#dda0dd",
      immortal: "#ffd700",
      tag: "rgba(255, 255, 255, 0.08)",
    },
    notification: {
      reply: "#4ade80",      // Зеленый для ответов
      status: "#a78bfa",     // Фиолетовый для смены статуса
      admin: "#fbbf24",      // Желтый для ответов админа
      order: "#4ade80",      // Зеленый для новых заказов
      message: "#fbbf24",    // Желтый для новых сообщений
      userChar: "#2dd4bf",   // Бирюзовый для новых персонажей
      like: "#4ade80",       // Зеленый для лайков
      dislike: "#f87171",    // Красный для дизлайков
      support: "#a78bfa",    // Фиолетовый для поддержки
      default: "#6b7280",    // Серый для всего остального
    },
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  radius: {
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    full: "9999px",
  },
  shadows: {
    glass: "0 8px 32px rgba(0, 0, 0, 0.35)",
    glassHover: "0 12px 40px rgba(0, 0, 0, 0.4)",
    accent: "0 4px 16px rgba(215, 174, 251, 0.4)",
    starGlow: "0 0 12px rgba(255, 215, 0, 0.5)",
    button: "0 6px 20px rgba(255, 107, 214, 0.3)",
    buttonHover: "0 8px 24px rgba(255, 107, 214, 0.4)",
  },
  fonts: {
    heading: `"Geist", "Inter", system-ui, sans-serif`,
    body: `"Geist", "Inter", system-ui, sans-serif`,
  },
  transitions: {
    quick: "0.2s ease",
    smooth: "0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
    spring: { type: "spring", stiffness: 400, damping: 25 } as const,
  },
};

// === 🎭 АНИМАЦИОННЫЕ ПРЕСЕТЫ (СИНХРОНИЗИРОВАНЫ С CharacterPage.tsx) ===
const ANIM = {
  fadeInUp: (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay },
  }),
  fadeInStagger: {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
  },
  buttonTap: {
    whileTap: { scale: 0.97 },
  },
  buttonPulse: {
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 0.4, ease: "easeInOut" },
  },
  float: {
    animate: { y: [0, -8, 0] },
    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" },
  },
};

type CombinedItem = (Notification | Newsletter) & { itemType: 'notification' | 'newsletter' };

// ✅ ДОБАВЛЕНО: Компонент для иконки уведомления с цветной подложкой
const NotificationIcon = ({ type, isUnread }: { type: Notification['type']; isUnread: boolean }) => {
  const getIconComponent = () => {
    switch (type) {
      case 'reply': return <MessageSquare className="w-5 h-5" />;
      case 'status_change': return <UserCheck className="w-5 h-5" />;
      case 'admin_reply': return <Mail className="w-5 h-5" />;
      case 'new_order': return <Bot className="w-5 h-5" />;
      case 'new_message': return <MessageSquare className="w-5 h-5" />;
      case 'new_user_character': return <UserPlus className="w-5 h-5" />;
      case 'like': return <ThumbsUp className="w-5 h-5" />;
      case 'dislike': return <ThumbsDown className="w-5 h-5" />;
      case 'support_reply': return <Mail className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'reply': return DESIGN.colors.notification.reply;
      case 'status_change': return DESIGN.colors.notification.status;
      case 'admin_reply': return DESIGN.colors.notification.admin;
      case 'new_order': return DESIGN.colors.notification.order;
      case 'new_message': return DESIGN.colors.notification.message;
      case 'new_user_character': return DESIGN.colors.notification.userChar;
      case 'like': return DESIGN.colors.notification.like;
      case 'dislike': return DESIGN.colors.notification.dislike;
      case 'support_reply': return DESIGN.colors.notification.support;
      default: return DESIGN.colors.notification.default;
    }
  };

  return (
    <div 
      className="p-3 rounded-full flex items-center justify-center transition-all duration-300"
      style={{
        background: isUnread ? getColor() : DESIGN.colors.background.glass,
        color: isUnread ? "#0a0a12" : DESIGN.colors.text.primary,
        boxShadow: isUnread ? `0 4px 16px ${getColor()}40` : DESIGN.shadows.glass,
        border: `1px solid ${isUnread ? getColor() : DESIGN.colors.border}`,
      }}
    >
      {getIconComponent()}
    </div>
  );
};

export function NotificationsPage() {
    const { user, isAdmin } = useAuth();
    const { notifications, newsletters, markNotificationAsRead, loadNotifications, loadNewsletters } = useData();
    const navigate = useNavigate();
    const [selectedItem, setSelectedItem] = useState<Newsletter | null>(null);

    // Параллакс для фона
    const { scrollY } = useScroll();
    const bgIntensity = useTransform(scrollY, [0, 500], [0.3, 0.1]);

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
            
            if (item.type === 'reply' || item.type === 'status_change' || item.type === 'like' || item.type === 'dislike') {
                navigate(`/characters/${item.entityId}`);
            }
            
            if (item.type === 'support_reply') {
                 navigate('/support', { state: { ticketId: item.entityId } });
            }
        } else {
            setSelectedItem(item as Newsletter);
        }
    };
    
    const combinedList: CombinedItem[] = useMemo(() => [
        ...notifications.map(n => ({ ...n, itemType: 'notification' as const })),
        ...newsletters.map(n => ({ ...n, itemType: 'newsletter' as const })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [notifications, newsletters]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

    return (
        <>
            <div 
                className="min-h-screen w-full relative p-2 sm:p-4 pt-4 sm:pt-6" 
                style={{ fontFamily: DESIGN.fonts.body, backgroundColor: DESIGN.colors.background.dark }}
            >
                <ThemedBackground intensity={bgIntensity} />
                <div className="relative z-10 mx-auto w-full max-w-none">
                    {/* Заголовок страницы */}
                    <motion.div {...ANIM.fadeInUp(0.1)} className="mb-8 text-center">
                        <h1
                            className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight"
                            style={{
                                background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                                color: "transparent",
                                fontFamily: DESIGN.fonts.heading,
                                textShadow: "0 4px 12px rgba(0,0,0,0.2)",
                            }}
                        >
                            🔔 Уведомления
                        </h1>
                        <p className="mt-2 text-base sm:text-lg" style={{ color: DESIGN.colors.text.muted }}>
                            {unreadCount > 0 ? `У вас ${unreadCount} новых уведомлений` : 'Нет новых уведомлений'}
                        </p>
                    </motion.div>

                    {/* Список уведомлений */}
                    <div className="max-w-2xl mx-auto space-y-4">
                        {combinedList.length > 0 ? (
                            <AnimatePresence>
                                {combinedList.map((item, index) => {
                                    const isUnread = item.itemType === 'notification' && !item.isRead;
                                    return (
                                        <motion.div
                                            key={`${item.itemType}-${item.id}`}
                                            {...ANIM.fadeInUp(0.2 + index * 0.05)}
                                            onClick={() => handleItemClick(item)}
                                            className="relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 cursor-pointer"
                                            style={{
                                                background: isUnread ? DESIGN.colors.background.glassHover : DESIGN.colors.background.glass,
                                                borderColor: isUnread ? DESIGN.colors.accent.primary : DESIGN.colors.border,
                                                boxShadow: isUnread ? DESIGN.shadows.accent : DESIGN.shadows.glass,
                                            }}
                                        >
                                            <div className="flex items-start gap-4">
                                                {item.itemType === 'notification' ? (
                                                    <NotificationIcon type={item.type} isUnread={isUnread} />
                                                ) : (
                                                    <div 
                                                        className="p-3 rounded-full flex items-center justify-center transition-all duration-300"
                                                        style={{
                                                            background: DESIGN.colors.background.glass,
                                                            color: DESIGN.colors.text.primary,
                                                            boxShadow: DESIGN.shadows.glass,
                                                            border: `1px solid ${DESIGN.colors.border}`,
                                                        }}
                                                    >
                                                        <Send className="w-5 h-5" style={{ color: "#fbbf24" }} />
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-display font-semibold leading-tight" style={{ color: isUnread ? DESIGN.colors.text.primary : DESIGN.colors.text.secondary }}>
                                                        {item.itemType === 'notification' ? (
                                                            <>
                                                                <span className="font-bold" style={{ color: isUnread ? DESIGN.colors.text.primary : DESIGN.colors.text.primary }}>{item.senderName}</span> {item.message}
                                                            </>
                                                        ) : (
                                                            <span className="font-bold" style={{ color: isUnread ? DESIGN.colors.text.primary : DESIGN.colors.text.primary }}>{item.title}</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs mt-2" style={{ color: DESIGN.colors.text.muted }}>
                                                        {new Date(item.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                {isUnread && (
                                                    <motion.div
                                                        {...ANIM.float}
                                                        className="absolute top-2 right-2 w-3 h-3 rounded-full"
                                                        style={{ background: DESIGN.colors.accent.primary, boxShadow: DESIGN.shadows.accent }}
                                                    />
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        ) : (
                            <motion.div
                                {...ANIM.fadeInUp(0.2)}
                                className="text-center py-16 lg:py-24 rounded-3xl"
                                style={{
                                    background: DESIGN.colors.background.glass,
                                    borderColor: DESIGN.colors.border,
                                    boxShadow: DESIGN.shadows.glass,
                                    color: DESIGN.colors.text.primary,
                                }}
                            >
                                <motion.div
                                    {...ANIM.float}
                                    className="w-16 h-16 mx-auto mb-6 opacity-50"
                                    style={{ color: DESIGN.colors.text.muted }}
                                >
                                    <Bell />
                                </motion.div>
                                <h3 className="text-2xl sm:text-3xl font-bold mb-3">Здесь пока пусто</h3>
                                <p className="mb-6 max-w-md mx-auto" style={{ color: DESIGN.colors.text.muted }}>
                                    Новые уведомления будут появляться тут.
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Модальное окно для новостейletter */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
                        onClick={() => setSelectedItem(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border"
                            style={{
                                background: DESIGN.colors.background.glass,
                                borderColor: DESIGN.colors.border,
                                boxShadow: DESIGN.shadows.glass,
                            }}
                        >
                            {selectedItem.image && (
                                <img 
                                    src={selectedItem.image} 
                                    alt={selectedItem.title} 
                                    className="w-full h-64 object-cover border-b" 
                                    style={{ borderColor: DESIGN.colors.border }}
                                />
                            )}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 
                                            className="text-2xl font-black mb-2"
                                            style={{
                                                background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)",
                                                WebkitBackgroundClip: "text",
                                                WebkitTextFillColor: "transparent",
                                                backgroundClip: "text",
                                                color: "transparent",
                                                fontFamily: DESIGN.fonts.heading,
                                            }}
                                        >
                                            {selectedItem.title}
                                        </h2>
                                        <p className="text-xs" style={{ color: DESIGN.colors.text.muted }}>
                                            От Администрации • {new Date(selectedItem.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <motion.button
                                        {...ANIM.buttonTap}
                                        onClick={() => setSelectedItem(null)}
                                        className="p-2 rounded-full"
                                        style={{
                                            background: DESIGN.colors.background.glass,
                                            color: DESIGN.colors.text.muted,
                                            border: `1px solid ${DESIGN.colors.border}`,
                                        }}
                                        aria-label="Закрыть"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </motion.button>
                                </div>
                                <div
                                    className="prose prose-invert max-w-none"
                                    style={{ color: DESIGN.colors.text.secondary, fontFamily: DESIGN.fonts.body }}
                                    dangerouslySetInnerHTML={{ __html: selectedItem.content || '' }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}