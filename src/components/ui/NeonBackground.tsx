// project/src/components/ui/NeonBackground.tsx

import React, { useEffect } from 'react';
import { m, useReducedMotion, useMotionValue, animate } from 'framer-motion';

type Props = { accent?: string };

export default function NeonBackground({ accent = 'rgb(120,160,200)' }: Props) {
  const reduce = useReducedMotion();
  const base = '#0b0b0f';

  // Увеличиваем непрозрачность для более сочного цвета (было 0.15 -> стало 0.35)
  const accentWithAlpha = accent.replace('rgb(', 'rgba(').replace(')', ', 0.35)');
  
  // Создаем анимируемое значение для фона.
  // Это ключевое изменение, которое позволяет анимировать цвет отдельно от движения.
  const background = useMotionValue(`radial-gradient(circle, ${accentWithAlpha}, transparent 70%)`);

  // Этот эффект следит за изменением цвета (prop 'accent') и плавно анимирует его.
  useEffect(() => {
    const newGradient = `radial-gradient(circle, ${accentWithAlpha}, transparent 70%)`;
    animate(background, newGradient, { 
      duration: 1.5, // Плавный переход цвета за 1.5 секунды
      ease: 'easeInOut' 
    });
  }, [accent, background, accentWithAlpha]);

  if (reduce) {
    return (
      <div className="fixed inset-0 -z-10"
           style={{ background: `radial-gradient(50% 40% at 50% 50%, ${accentWithAlpha}, transparent 60%), ${base}` }} />
    );
  }

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      <div className="absolute inset-0" style={{ background: base }} />
      
      {/* Теперь этот элемент отвечает и за цвет (через style), и за движение (через animate) */}
      <m.div
        className="absolute -left-60 -top-60 h-[80rem] w-[80rem] rounded-full blur-[160px]"
        style={{ background }} // Применяем анимируемое значение цвета
        animate={{ x: [0, 280, -220, 0], y: [0, 180, -260, 0], scale: [1, 1.1, 0.9, 1] }} // Анимация движения
        transition={{ 
          // Задаем параметры только для анимации движения
          duration: 75, 
          repeat: Infinity, 
          ease: 'easeInOut' 
        }}
      />
    </div>
  );
}