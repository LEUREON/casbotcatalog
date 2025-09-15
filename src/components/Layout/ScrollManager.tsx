import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollManager() {
  const { pathname } = useLocation();
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    // Предотвращаем автоматическую прокрутку при навигации
    if (pathname !== prevPathnameRef.current) {
      // Прокручиваем только при смене пути, но не при обновлении состояния
      window.scrollTo(0, 0);
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  // Добавляем обработчик для предотвращения автоматической прокрутки
  useEffect(() => {
    const handleScroll = () => {
      // Сохраняем позицию прокрутки при любом изменении
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Восстанавливаем позицию прокрутки при загрузке
    const savedPosition = sessionStorage.getItem('scrollPosition');
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return null;
}