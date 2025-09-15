// project/src/components/Characters/CharacterCard.tsx

import React, { useState, memo, useMemo } from 'react';
import { Heart, Star, Loader2, Flame } from 'lucide-react';
import { Character } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useReviews } from '../../contexts/ReviewsContext';
import { getAgeString } from '../../utils/formatters';

// --- Дизайн-токены ---
const TOKENS = {
  border: "rgba(255,255,255,0.16)",
  itemBg: "rgba(255,255,255,0.08)",
  itemBgActive: "rgba(255,255,255,0.12)",
  accent: "#f7cfe1", // Нежно-розовый
  orange: "#F97316", // Оранжевый (Tailwind Orange 500) для иконки огня
};

// --- Вспомогательный компонент Badge ---
const Badge = ({ text, icon: Icon, variant = 'default' }: {
  text: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  variant?: 'default' | 'accent' | 'warning';
}) => {
  const isAccent = variant === 'accent';
  const isWarning = variant === 'warning';
  
  const iconStyle: React.CSSProperties = {
    // ▼▼▼ ИЗМЕНЕНИЕ 1: Иконка (огонь) для 'accent' теперь оранжевая ▼▼▼
    color: isWarning ? '#fbbf24' : (isAccent ? TOKENS.orange : 'currentColor'),
    fill: isWarning ? '#fbbf24' : (isAccent ? TOKENS.orange : 'none'),
    // ▲▲▲ КОНЕЦ ИЗМЕНЕНИЯ 1 ▲▲▲
  };

  return (
    <div
      className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-[8px]"
      style={{
        background: isAccent ? TOKENS.accent : TOKENS.itemBgActive,
        color: isAccent ? '#111' : '#fff',
        border: `1px solid ${isAccent ? 'transparent' : TOKENS.border}`,
      }}
    >
      {Icon && <Icon className="w-3.5 h-3.5" style={iconStyle} />}
      <span>{text}</span>
    </div>
  );
};

// --- Основной компонент карточки ---
interface CharacterCardProps {
  character: Character;
  onClick: (character: Character) => void;
}

export const CharacterCard = memo(function CharacterCard({ character, onClick }: CharacterCardProps) {
  const { user, toggleFavorite } = useAuth();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  const { id, name, photo, occupation, gender, age, ageGroup, tags, description, createdAt, isNew } = character;

  const { reviews } = useReviews();
  const { avgRating, reviewsCount } = useMemo(() => {
    const list = reviews.filter(r => r.characterId === id && typeof r.rating === 'number' && (r.rating as any) > 0);
    if (list.length === 0) return { avgRating: 0, reviewsCount: 0 };
    const sum = list.reduce((s, r) => s + (r.rating || 0), 0);
    return { avgRating: sum / list.length, reviewsCount: list.length };
  }, [reviews, id]);

  const showNewBadge = isNew && createdAt && (Date.now() - new Date(createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
  const isFavorited = user?.favorites?.includes(id) || false;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user && !isFavoriteLoading) {
      setIsFavoriteLoading(true);
      await toggleFavorite(id);
      setIsFavoriteLoading(false);
    }
  };
  
  const TAG_LIMIT = 3; 
  const visibleTags = tags.slice(0, TAG_LIMIT);
  const hiddenTagsCount = tags.length - visibleTags.length;

  return (
    <div
      onClick={() => onClick(character)}
      className="relative group w-full max-w-sm mx-auto cursor-pointer rounded-[28px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      style={{
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
        WebkitTapHighlightColor: "transparent",
      }}
      tabIndex={0}
    >
      <div
        className="relative overflow-hidden rounded-[28px] border transition-shadow duration-300 group-hover:shadow-2xl aspect-[3/4]"
        style={{
          backgroundColor: TOKENS.itemBg,
          borderColor: TOKENS.border,
        }}
      >
        <img
          src={photo}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover absolute inset-0 z-0"
        />

        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 to-transparent z-10" />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/50 to-transparent z-10" />

        <div className="relative z-20 h-full flex flex-col justify-between p-4">
          {/* Top section */}
          <div className="flex justify-between items-start">
            <div className="flex flex-wrap items-center gap-2">
              {showNewBadge && <Badge text="Новый" icon={Flame} variant="accent" />}
              <Badge
                text={reviewsCount > 0 ? avgRating.toFixed(2) : 'Нет оценок'}
                icon={Star}
                variant="warning"
              />
            </div>

            {user && (
              <button
                onClick={handleFavoriteClick}
                disabled={isFavoriteLoading}
                aria-label={isFavorited ? 'Удалить из избранного' : 'Добавить в избранное'}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out hover:scale-110 active:scale-95 backdrop-blur-[10px] border"
                // ▼▼▼ ИЗМЕНЕНИЕ 2: Стили кнопки "Избранное" ▼▼▼
                style={{
                  background: isFavorited ? 'transparent' : 'rgba(255,255,255,0.1)',
                  borderColor: isFavorited ? TOKENS.accent : TOKENS.border,
                }}
                // ▲▲▲ КОНЕЦ ИЗМЕНЕНИЯ 2 ▲▲▲
              >
                {isFavoriteLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Heart
                    className="w-5 h-5 transition-colors duration-300"
                    // ▼▼▼ ИЗМЕНЕНИЕ 3: Стили самой иконки "Сердце" ▼▼▼
                    style={{
                      color: isFavorited ? TOKENS.accent : '#fff',
                      fill: isFavorited ? TOKENS.accent : 'none',
                    }}
                    // ▲▲▲ КОНЕЦ ИЗМЕНЕНИЯ 3 ▲▲▲
                  />
                )}
              </button>
            )}
          </div>

          {/* Bottom section */}
          <div className="text-white">
            <h3 className="text-2xl font-bold">
              {name}
            </h3>
            <p className="font-medium text-white/90 mb-2">
              {occupation}
            </p>
            
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge text={gender === 'male' ? 'Мужчина' : 'Девушка'} />
              <Badge text={ageGroup === 'immortal' ? 'Бессмертный' : getAgeString(age)} />
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              {visibleTags.map((tag) => <Badge key={tag} text={tag} />)}
              {hiddenTagsCount > 0 && <Badge text={`+${hiddenTagsCount}`} />}
            </div>
            
            <p className="text-sm text-white/80 italic line-clamp-3 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});