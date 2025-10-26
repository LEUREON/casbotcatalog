// src/components/ui/FilterChip.tsx
import React from 'react';
import { motion } from 'framer-motion';
import cn from 'clsx';

// --- ИСПРАВЛЕНИЯ ЗДЕСЬ ---
interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  // Добавляем опциональный пропс для кастомных стилей
  customClasses?: {
    base?: string;
    active?: string;
  };
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isActive,
  onClick,
  customClasses = {}, // Значение по умолчанию
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      // Применяем кастомные стили, если они есть, или стили по умолчанию
      className={cn(
        'select-none whitespace-nowrap rounded-full border px-3 py-1 text-sm font-medium transition-all duration-200 hover:opacity-80 active:scale-95',
        isActive
          ? customClasses.active || 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300' // Стили по умолчанию
          : customClasses.base || 'border-gray-700 bg-gray-800/60 text-gray-300 hover:border-gray-600' // Стили по умолчанию
      )}
      whileTap={{ scale: 0.95 }}
    >
      {label}
    </motion.button>
  );
};
// --- КОНЕЦ ИСПРАВЛЕНИЙ ---