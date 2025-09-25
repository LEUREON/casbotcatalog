// src/components/ui/GlassPanel.tsx
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ANIM } from '../../lib/animations';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const GlassPanel = React.memo(
  ({ children, className = '', delay = 0 }: GlassPanelProps) => (
    <motion.div
      variants={ANIM.fadeInUp(delay) as Variants}
      initial="initial"
      animate="animate"
      className={`rounded-lg border bg-glass backdrop-blur-xl p-5 sm:p-6 shadow-glass ${className}`}
    >
      {children}
    </motion.div>
  )
);
GlassPanel.displayName = 'GlassPanel';