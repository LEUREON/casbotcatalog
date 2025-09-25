// src/components/ui/FilterChip.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ANIM } from '../../lib/animations';

interface FilterChipProps {
  icon?: React.ComponentType<{ size?: number }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const FilterChip = React.memo(
  ({ icon: Icon, label, active, onClick }: FilterChipProps) => {
    return (
      <motion.button
        {...ANIM.buttonTap}
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border
          ${active
            ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white border-transparent shadow-button'
            : 'bg-badge-tag text-text-secondary border-default hover:bg-glass-hover'
          }`
        }
      >
        {Icon && <Icon size={16} />}
        <span>{label}</span>
      </motion.button>
    );
  }
);
FilterChip.displayName = "FilterChip";