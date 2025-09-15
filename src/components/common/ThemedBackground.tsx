import React from "react";

type ThemedBackgroundProps = {
  /** 0..1 — регулирует «силу» цвета (используется только для прозрачности градиента) */
  intensity?: number;
  /** Сохранён для совместимости; не используется */
  animated?: boolean;
  /** Доп. классы контейнера */
  className?: string;
};

/**
 * Максимально лёгкий фон: статичный розово‑голубой градиент.
 * Без анимаций, без тяжёлых эффектов, адаптивный, дружелюбный к мобильным.
 */
function ThemedBackground({
  intensity = 1,
  /* animated, */ // игнорируем намеренно
  className,
}: ThemedBackgroundProps) {
  // Клэмпим интенсивность в [0,1]
  const I = Math.max(0, Math.min(1, Number.isFinite(intensity) ? intensity : 1));
  const vAlpha = 0.45 * I;
  const blueAlpha = 0.45 * I;

  return (
    <div 
      aria-hidden
      className={["fixed inset-0 pointer-events-none z-0", className].filter(Boolean).join(" ")}
      style={{
        background: `linear-gradient(120deg,
          rgba(var(--accent-rgb, 70, 70, 144), ${vAlpha}) 0%,
          rgba(70, 70, 144, ${blueAlpha}) 100%)`,
      }} 
    />
  );
}

export default ThemedBackground;
export { ThemedBackground };   