// project/src/hooks/useUnreadTotal.ts
import { useEffect, useMemo, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Возвращает ИТОГОВОЕ количество непрочитанных:
 *   1) notifications: !isRead (для текущего пользователя — DataContext фильтрует по recipientId)
 *   2) messages: !isReadByUser && user_id !== currentUser.id (сообщения не от самого пользователя)
 *
 * Дополнительно:
 *   - автообновление при возврате на вкладку (visibilitychange/focus)
 *   - легкий debounce (200 мс) для частых триггеров
 */
export function useUnreadTotal(trigger?: unknown): number {
  const { notifications, messages, loadNotifications, loadMessages } = useData();
  const { user } = useAuth();
  const timer = useRef<number | null>(null);

  const scheduleReload = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    timer.current = window.setTimeout(() => {
      if (typeof loadNotifications === 'function') loadNotifications();
      if (typeof loadMessages === 'function') loadMessages();
    }, 200);
  };

  useEffect(() => {
    scheduleReload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') scheduleReload();
    };
    const onFocus = () => scheduleReload();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notifUnread = useMemo(
    () => (Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0),
    [notifications]
  );

  const msgUnread = useMemo(() => {
    if (!Array.isArray(messages) || !user) return 0;
    return messages.filter(m => m.isReadByUser !== true && m.user_id !== user.id).length;
  }, [messages, user]);

  return notifUnread + msgUnread;
}