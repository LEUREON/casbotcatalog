// src/components/Characters/CharacterCard.tsx
import React, { useState, memo, useMemo } from 'react';
import { Heart, Star, Loader2, Flame, User, Cake, Infinity as InfinityIcon } from 'lucide-react';
import { Character } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useReviews } from '../../contexts/ReviewsContext';
import { getAgeString } from '../../utils/formatters';
import { motion } from 'framer-motion';
import { TagBadge } from '../ui/TagBadge';
import { InfoBadge } from '../ui/InfoBadge';

// === 🎨 ЕДИНАЯ ДИЗАЙН-СИСТЕМА (локально для карточки) ===
const DESIGN = {
  colors: {
    background: {
      glass: 'rgba(16, 16, 22, 0.6)',
      dark: 'var(--bg-dark)',
    },
    border: 'rgba(255, 255, 255, 0.1)',
    accent: {
      primary: 'var(--accent-primary)',
      secondary: '#ff6bd6',
    },
    star: { filled: 'var(--star-filled)' },
  },
  fonts: {
    heading: 'var(--font-family-heading)',
    body: 'var(--font-family-body)',
  },
};

// === 🎭 АНИМАЦИОННЫЕ ПРЕСЕТЫ ===
const ANIM = {
  buttonTap: {
    whileTap: { scale: 0.95 },
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },
};

interface CharacterCardProps {
  character: Character;
  onClick: (character: Character) => void;
}

export const CharacterCard = memo(function CharacterCard({
  character,
  onClick,
}: CharacterCardProps) {
  const { user, toggleFavorite } = useAuth();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const {
    id,
    name,
    photo,
    occupation,
    gender,
    age,
    ageGroup,
    tags,
    description,
    createdAt,
    isNew,
    category,
  } = character;

  const { reviews } = useReviews();
  const { avgRating, reviewsCount } = useMemo(() => {
    const list = reviews.filter(
      (r) => r.characterId === id && typeof r.rating === 'number' && r.rating > 0
    );
    if (list.length === 0) return { avgRating: 0, reviewsCount: 0 };
    const sum = list.reduce((s, r) => s + (r.rating || 0), 0);
    return { avgRating: sum / list.length, reviewsCount: list.length };
  }, [reviews, id]);

  const showNewBadge = !!isNew;

  const isFavorited = user?.favorites?.includes(id) || false;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user && !isFavoriteLoading) {
      setIsFavoriteLoading(true);
      await toggleFavorite(id);
      setIsFavoriteLoading(false);
    }
  };

  return (
    <motion.div
      onClick={() => onClick(character)}
      className="relative w-full cursor-pointer flex flex-col rounded-2xl overflow-hidden shadow-lg"
      style={{ fontFamily: DESIGN.fonts.body, background: DESIGN.colors.background.dark }}
      tabIndex={0}
    >
      <div className="relative w-full h-0" style={{ paddingTop: '100%' }}>
        <img src={photo} alt={name} loading="lazy" className="absolute top-0 left-0 w-full h-full object-cover" />
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${DESIGN.colors.background.dark}, transparent)` }}
        />
        <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start">
          {showNewBadge ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-black/50 text-white border border-white/20 backdrop-blur-md">
              <Flame size={14} fill="currentColor" stroke="none" className="text-orange-500" />
              <span>Новый</span>
            </div>
          ) : <div />}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-black/50 text-white border border-white/20 backdrop-blur-md">
            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
            <span className="mt-px">{reviewsCount > 0 ? avgRating.toFixed(1) : '—'}</span>
          </div>
        </div>
        {user && (
          <motion.button
            {...ANIM.buttonTap}
            onClick={handleFavoriteClick}
            disabled={isFavoriteLoading}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center z-10"
            style={{
              background: isFavorited ? `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})` : DESIGN.colors.background.glass,
              border: `1px solid ${isFavorited ? 'transparent' : DESIGN.colors.border}`,
            }}
            aria-label={isFavorited ? 'Убрать из избранного' : 'Добавить в избранное'}
          >
            {isFavoriteLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Heart className="w-5 h-5" fill="currentColor" stroke="none" style={{ color: isFavorited ? '#ffffff' : DESIGN.colors.accent.primary }} />
            )}
          </motion.button>
        )}
      </div>
      <div className="relative p-4 z-10">
        <div className="text-center mb-3">
          <h3 className="text-2xl font-black truncate text-[var(--text-primary)]" style={{ fontFamily: DESIGN.fonts.heading }}>{name}</h3>
          <p className="font-medium text-base truncate mt-1 text-[var(--text-secondary)]">{occupation}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <InfoBadge
            icon={<User size={14} />}
            text={gender === 'male' ? 'Мужчина' : 'Женщина'}
            colorClass="bg-white/5 text-text-secondary border border-white/10"
          />
          <InfoBadge
            icon={ageGroup === 'immortal' ? <InfinityIcon size={14} /> : <Cake size={14} />}
            text={ageGroup === 'immortal' ? 'Бессмертный' : getAgeString(age)}
            colorClass="bg-white/5 text-text-secondary border border-white/10"
          />
        </div>
        {category?.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
            {category.map((cat) => (
              <TagBadge key={cat} text={cat} isCategory />
            ))}
          </div>
        )}
        {tags?.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
            {/* ✅ ИЗМЕНЕНИЕ: убрано .slice(0, 3) */}
            {tags.map((tag) => (
              <TagBadge key={tag} text={tag} />
            ))}
          </div>
        )}
       <p className="text-[13px] font-bold text-center leading-relaxed text-[var(--text-muted)]">{description}</p>
      </div>
    </motion.div>
  );
}); 