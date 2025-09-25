// src/lib/animations.ts
import { Variants } from 'framer-motion';

/**
 * Тип для пружинной анимации в Framer Motion.
 */
export const spring = { type: "spring", stiffness: 400, damping: 25 } as const;

/**
 * Коллекция пресетов анимации для консистентного использования в приложении.
 */
export const ANIM: Record<string, (...args: any[]) => Variants | object> = {
  /**
   * Плавное появление элемента снизу вверх.
   * @param delay - Задержка перед началом анимации в секундах.
   */
  fadeInUp: (delay = 0): Variants => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay },
  }),

  /**
   * Появление элемента с небольшим сдвигом вверх. Идеально для списков с `staggerChildren`.
   * @param delay - Задержка перед началом анимации в секундах.
   */
  fadeInStagger: (delay = 0): Variants => ({
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut", delay },
  }),

  /**
   * Пульсация для звезд рейтинга.
   */
  starPulse: {
    animate: { scale: [1, 1.2, 1], y: [0, -4, 0] },
    // ✅ ИСПРАВЛЕНО: Заменен 'spring' на 'tween' с длительностью.
    transition: { 
      duration: 0.6, 
      ease: "easeInOut" 
    },
  },

  /**
   * Эффект "нажатия" для кнопок.
   */
  buttonTap: {
    whileTap: { scale: 0.97, transition: { duration: 0.1 } },
  },

  /**
   * Легкая пульсация для акцентных кнопок.
   */
  buttonPulse: {
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 0.4, ease: "easeInOut" },
  },

  /**
   * Плавное "парение" элемента вверх-вниз.
   */
  float: {
    animate: { y: [0, -8, 0] },
    transition: { repeat: Infinity, duration: 3, ease: "easeInOut" },
  },
};