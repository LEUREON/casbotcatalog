// project/src/utils/useDebounce.ts

import { useState, useEffect } from 'react';

/**
 * Хук для задержки выполнения.
 * @param value - Значение, которое нужно отложить.
 * @param delay - Задержка в миллисекундах.
 * @returns Отложенное значение.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // Состояние для хранения отложенного значения
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Устанавливаем таймер, который обновит состояние после задержки
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Очищаем таймер при каждом изменении значения или при размонтировании компонента
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Эффект перезапускается только если value или delay изменились

  return debouncedValue;
}