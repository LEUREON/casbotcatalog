// src/utils/lockLVH.ts
// Locks a "large viewport height" CSS variable once, so UI ignores keyboard-driven viewport shrink.
export function lockLargeViewportHeight() {
  try {
    const set = () => {
      const h = Math.max(
        window.innerHeight || 0,
        document.documentElement?.clientHeight || 0,
        // On iOS this approximates the full device height in CSS px
        (window.screen && window.screen.height) || 0
      );
      document.documentElement.style.setProperty('--lvh', `${h}px`);
    };
    set();
    // Update on orientation changes only (NOT on resize), so we keep ignoring keyboard.
    window.addEventListener('orientationchange', () => setTimeout(set, 300), { passive: true });
  } catch {}
}