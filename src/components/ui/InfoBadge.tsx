// src/components/ui/InfoBadge.tsx
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ANIM } from '../../lib/animations';

interface InfoBadgeProps {
  icon: React.ReactNode;
  text: string;
  colorClass: string;
}

export const InfoBadge = React.memo(
  ({ icon, text, colorClass }: InfoBadgeProps) => (
    <motion.div
      variants={ANIM.fadeInStagger() as Variants}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium shadow-lg ${colorClass}`}
    >
      {icon}
      <span>{text}</span>
    </motion.div>
  )
);
InfoBadge.displayName = 'InfoBadge';