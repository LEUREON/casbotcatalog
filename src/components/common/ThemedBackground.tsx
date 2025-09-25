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
 * Переработанный фон под новый дизайн:
 * - Глубокий темный градиент с акцентами лавандового и розового
 * - Статичный, легкий, без анимаций
 * - Идеально сочетается с DESIGN.colors.accent (#d7aefb) и бейджами
 */
function ThemedBackground({
  intensity = 1,
  className,
}: ThemedBackgroundProps) {
  // Клэмпим интенсивность в [0,1]
  const I = Math.max(0, Math.min(1, Number.isFinite(intensity) ? intensity : 1));
  const alpha = 0.3 * I; // Максимальная прозрачность — 0.3, чтобы не перегружать

  return (
    <div
      aria-hidden
      className={["fixed inset-0 pointer-events-none z-0", className].filter(Boolean).join(" ")}
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(215, 174, 251, ${alpha * 0.8}) 0%, transparent 40%),
          radial-gradient(circle at 80% 70%, rgba(251, 182, 217, ${alpha * 0.6}) 0%, transparent 50%),
          radial-gradient(circle at 50% 10%, rgba(135, 206, 250, ${alpha * 0.4}) 0%, transparent 60%),
          #0a0a12
        `,
      }}
    />
  );
}

export default ThemedBackground;
export { ThemedBackground };