import { useRef, useCallback } from 'react';

export function useScrollLock() {
  const scrollPosition = useRef(0);
  const isLocked = useRef(false);

  const lockScroll = useCallback(() => {
    if (isLocked.current) return;
    
    scrollPosition.current = window.scrollY;
    isLocked.current = true;
    
    // Сохраняем текущую позицию прокрутки
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition.current}px`;
    document.body.style.width = '100%';
  }, []);

  const unlockScroll = useCallback(() => {
    if (!isLocked.current) return;
    
    isLocked.current = false;
    
    // Восстанавливаем позицию прокрутки
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  }, []);

  return { lockScroll, unlockScroll };
}