// src/components/ui/StarRating.tsx
import React, { useState, useCallback } from "react";
import { motion, AnimationProps } from "framer-motion";
import { ANIM } from "../../lib/animations";
import { IconStar } from "./icons";

interface StarRatingProps {
  value?: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}

export const StarRating = React.memo(
  ({ value = 0, onChange, size = 24, readOnly = false }: StarRatingProps) => {
    const [isAnimating, setIsAnimating] = useState(false);
    
    const handleStarClick = useCallback((rating: number) => {
      if (readOnly || value === rating) return;
      onChange?.(rating);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }, [onChange, readOnly, value]);

    return (
      <div className="flex items-center gap-1" aria-label={readOnly ? `Оценка: ${value} из 5` : "Выставить рейтинг"}>
        <motion.div
          className="flex items-center gap-1"
          animate={isAnimating ? (ANIM.starPulse as any).animate : {}}
          transition={ANIM.starPulse.transition as any}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const idx = i + 1;
            const isFilled = value >= idx;
            return (
              <button
                key={idx}
                type="button"
                aria-label={`${idx} ${idx === 1 ? "звезда" : "звезды"}`}
                onClick={() => handleStarClick(idx)}
                disabled={readOnly}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-full p-1 transition-transform active:scale-90"
              >
                <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconStar
                    filled={isFilled}
                    color={isFilled ? 'var(--star-filled)' : 'var(--text-muted)'}
                    size={size}
                    style={{
                      filter: isFilled ? `drop-shadow(0 0 12px rgba(var(--star-glow-rgb), 0.6))` : "none",
                      transition: "all 0.2s ease",
                    }}
                  />
                </div>
              </button>
            );
          })}
        </motion.div>
      </div>
    );
  }
);
StarRating.displayName = "StarRating";