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
 * Фон, который корректно покрывает зону вырезов (notch/Home Indicator) на iOS:
 * - Используем viewport-fit=cover (см. index.html)
 * - «Выезжаем» фоном за safe-area с помощью env(safe-area-inset-*)
 * - Подстилаем базовый цвет на html/body
 */
function ThemedBackground({
  intensity = 1,
  className,
}: ThemedBackgroundProps) {
  // Клэмпим интенсивность в [0,1]
  const I = Math.max(0, Math.min(1, Number.isFinite(intensity) ? intensity : 1));
  const alpha = 0.3 * I; // Максимальная прозрачность — 0.3, чтобы не перегружать

  // Значения безопасных зон iOS; на остальных платформах вернут 0px
  const sat = "env(safe-area-inset-top, 0px)";
  const sar = "env(safe-area-inset-right, 0px)";
  const sab = "env(safe-area-inset-bottom, 0px)";
  const sal = "env(safe-area-inset-left, 0px)";

  return (
    <div
      aria-hidden={true}
      role="presentation"
      className={["fixed pointer-events-none z-0", className].filter(Boolean).join(" ")}
      style={{
        // Важно: не используем inset-0 — сами задаём стороны с учётом safe-area
        top: `calc(-1 * ${sat})`,
        right: `calc(-1 * ${sar})`,
        bottom: `calc(-1 * ${sab})`,
        left: `calc(-1 * ${sal})`,

        // Дополнительно расширяем размер — это страхует от редких артефактов при скрытии/появлении системных панелей
        width: `calc(100% + ${sal} + ${sar})`,
        height: `calc(100% + ${sat} + ${sab})`,

        // Небольшой хак для стабильного рендера на iOS
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        willChange: "transform",
        transform: "translateZ(0)",

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
