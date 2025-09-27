// src/hooks/useTrueViewportHeight.ts
import { useEffect } from 'react';

/**
 * Sets CSS vars for reliable viewport height and bottom inset that reacts to
 * mobile browser UI (address bar) and keyboard.
 *
 * Exposes:
 *  --vh   : 1% of *visual* viewport height (fallback to window.innerHeight)
 *  --app-vvb : extra bottom offset (px) caused by shrinking visual viewport,
 *              so you can anchor fixed bars with: bottom: calc(env(safe-area-inset-bottom,0px) + var(--app-vvb, 0px));
 */
const setViewportVars = () => { 
  const vv = window.visualViewport;
  const vh = (vv?.height ?? window.innerHeight) * 0.01;
  (document.documentElement as HTMLElement).style.setProperty('--vh', `${vh}px`);

  // Compute bottom inset between layout viewport and visual viewport
  let vb = 0;
  if (vv) {
    const ih = window.innerHeight;
    vb = Math.max(0, ih - vv.height - vv.offsetTop);
  }
  (document.documentElement as HTMLElement).style.setProperty('--app-vvb', `${vb}px`);
};

export const useTrueViewportHeight = () => {
  useEffect(() => {
    setViewportVars();

    window.addEventListener('resize', setViewportVars);
    window.addEventListener('orientationchange', setViewportVars);

    // visualViewport listeners (iOS Safari/Chrome)
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', setViewportVars);
      vv.addEventListener('scroll', setViewportVars);
    }

    return () => {
      window.removeEventListener('resize', setViewportVars);
      window.removeEventListener('orientationchange', setViewportVars);
      if (vv) {
        vv.removeEventListener('resize', setViewportVars);
        vv.removeEventListener('scroll', setViewportVars);
      }
    };
  }, []);
};
