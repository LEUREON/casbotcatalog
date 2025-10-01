import { useRef, useCallback } from 'react';

export function useScrollLock() {
  const scrollYRef = useRef(0);
  const isLocked = useRef(false);

  const lockScroll = useCallback(() => {
    if (isLocked.current) return;
    scrollYRef.current = window.scrollY || window.pageYOffset || 0;
    isLocked.current = true;
    document.documentElement.classList.add('scroll-locked');
    document.body.classList.add('scroll-locked');
  }, []);

  const unlockScroll = useCallback(() => {
    if (!isLocked.current) return;
    isLocked.current = false;
    document.documentElement.classList.remove('scroll-locked');
    document.body.classList.remove('scroll-locked');
    window.scrollTo(0, scrollYRef.current);
  }, []);

  return { lockScroll, unlockScroll };
}

export default useScrollLock;
