// src/hooks/useTrueViewportHeight.ts
import { useEffect } from 'react';

/**
 * Visual viewport tracker for mobile browsers.
 * Exposes:
 *  --vh: 1% of visual viewport height
 *  Теперь НЕ влияет на позиционирование нижнего меню
 */
export function useTrueViewportHeight() {
  useEffect(() => {
    let raf = 0 as number;

    const calc = () => {
      const vv = window.visualViewport;
      
      // Только устанавливаем --vh для корректной высоты контента
      const vh = ((vv?.height ?? window.innerHeight) * 0.01);
      (document.documentElement as HTMLElement).style.setProperty('--vh', `${vh}px`);
      
      // Добавляем флаг для определения состояния клавиатуры
      const keyboardVisible = vv ? (vv.height < window.innerHeight * 0.75) : false;
      (document.documentElement as HTMLElement).style.setProperty('--keyboard-visible', keyboardVisible ? '1' : '0');
    };

    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calc);
    };

    schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', schedule);
      window.visualViewport.addEventListener('scroll', schedule);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule as any);
      window.removeEventListener('orientationchange', schedule);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', schedule);
        window.visualViewport.removeEventListener('scroll', schedule);
      }
    };
  }, []);
}

export default useTrueViewportHeight;
