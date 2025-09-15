// project/src/hooks/useUnreadCount.ts
import { useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';

/**
 * Возвращает количество непрочитанных уведомлений так же,
 * как это считает NotificationsPage.tsx: notifications.filter(n => !n.isRead).length
 *
 * trigger — любое значение, при изменении которого хук запрашивает свежие уведомления.
 */
export function useUnreadCount(trigger?: unknown): number {
  const { notifications, loadNotifications } = useData();

  useEffect(() => {
    // Подгружаем уведомления при открытии/изменении триггера
    // Если уведомления уже загружены, DataContext сам ничего лишнего не сделает
    if (typeof loadNotifications === 'function') {
      loadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const unread = useMemo(
    () => (Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0),
    [notifications]
  );

  return unread;
}
