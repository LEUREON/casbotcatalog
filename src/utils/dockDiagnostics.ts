// src/utils/dockDiagnostics.ts
export function logDockMetrics() {
  if (typeof window === "undefined") return;
  const r = (n:number)=>Math.round(n);
  const info = {
    innerHeight: r(window.innerHeight),
    screenHeight: r((window.screen && window.screen.height) || 0),
    vh_100: r(window.innerHeight),
    // css typed units approximations
    env_sab: getComputedStyle(document.documentElement).getPropertyValue('--sab') || 'env(safe-area-inset-bottom)',
    has_lvh: CSS && (CSS.supports?.('height: 100lvh') || false),
  };
  const dock = document.querySelector('[data-mobile-dock]') as HTMLElement | null;
  const rect = dock?.getBoundingClientRect();
  console.log('[dock]', info, rect);
}