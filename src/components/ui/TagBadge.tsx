// src/components/ui/TagBadge.tsx
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ANIM } from '../../lib/animations';

interface TagBadgeProps {
  text: string;
  active?: boolean;
  onClick?: () => void;
  isCategory?: boolean;
}

export const TagBadge = React.memo(({ text, active = false, onClick, isCategory = false }: TagBadgeProps) => (
  <motion.button
    {...ANIM.buttonTap}
    onClick={onClick}
    variants={ANIM.fadeInStagger() as Variants}
    className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300
      ${active
        ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white border-transparent filter drop-shadow-button-glow'
        : isCategory
        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        : 'bg-white/10 text-slate-200 border-white/20 hover:bg-white/20'
      }`
    }
    disabled={!onClick}
  >
    <span>{text}</span>
  </motion.button>
));
TagBadge.displayName = 'TagBadge';