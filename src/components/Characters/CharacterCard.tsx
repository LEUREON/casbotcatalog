// project/src/components/Characters/CharacterCard.tsx

import React, { useState, memo } from 'react';
import { Heart, Star, Loader2, Flame } from 'lucide-react';
import { Character } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getAgeString } from '../../utils/formatters';

// --- Вспомогательные компоненты для чистоты кода ---

const LoadingSpinner = () => <Loader2 className="w-5 h-5 animate-spin text-white" />;

type BadgeProps = {
  text: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'warning' | 'default';
  className?: string;
};

const Badge = ({ text, icon, variant = 'default', className = '' }: BadgeProps) => {
  const baseClasses =
    'flex items-center gap-2 px-3 py-1 rounded-full shadow-sm whitespace-nowrap transition-all duration-300 ease-out';
  const glassClasses = 'backdrop-blur-[8px] bg-white/[0.12]';

  const variantClasses = {
    primary: 'text-white font-semibold',
    warning: 'text-yellow-100 font-semibold',
    default: 'text-gray-200 font-medium',
  };

  return (
    <div className={`${baseClasses} ${glassClasses} ${variantClasses[variant]} ${className}`}>
      {icon}
      <span className="font-semibold">{text}</span>
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

  const { id, name, photo, rating, isNew, occupation, gender, age, ageGroup, tags, description } = character;
  const isFavorited = user?.favorites?.includes(id) || false;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user && !isFavoriteLoading) {
      setIsFavoriteLoading(true);
      await toggleFavorite(id);
      setIsFavoriteLoading(false);
    }
  };

  const handleCardClick = () => {
    onClick(character);
  };

  return (
    <div
      data-card
      onClick={handleCardClick}
      className="relative group w-full max-w-sm mx-auto cursor-pointer font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-[28px]"
      tabIndex={0}
      style={{ fontFamily: "'Roboto', sans-serif" }}
    >
      <div
        className="relative overflow-hidden rounded-[28px] shadow-lg"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <img
          src={photo}
          alt={name}
          data-cover
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover absolute inset-0 z-0 rounded-[28px]"
        />

        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent z-10 rounded-b-[28px]" />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/50 to-transparent z-10 rounded-t-[28px]" />

        <div className="relative z-20 aspect-[3/4] flex flex-col justify-end p-4">
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
            <div className="flex items-center gap-2 flex-wrap">
              {isNew && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full font-bold text-white shadow-lg backdrop-blur-[8px] bg-white/[0.12]">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span>НОВЫЙ</span>
                </div>
              )}
              <Badge
                text={character.reviewCount > 0 ? rating.toFixed(1) : 'Нет оценок'}
                icon={<Star className="w-4 h-4 text-yellow-300 fill-current" />}
              />
            </div>

            {user && (
              <button
                onClick={handleFavoriteClick}
                disabled={isFavoriteLoading}
                aria-label={isFavorited ? 'Удалить из избранного' : 'Добавить в избранное'}
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 ease-in-out
                           hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black
                           backdrop-blur-[10px]
                           ${isFavorited
                             ? 'bg-gradient-to-r from-red-500/[0.9] to-pink-500/[0.9] shadow-red-500/30'
                             : 'bg-white/[0.15]'}
                           ${isFavoriteLoading ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                {isFavoriteLoading ? (
                  <LoadingSpinner />
                ) : (
                  <Heart
                    className={`w-5 h-5 transition-all duration-300 ${isFavorited ? 'text-white' : 'text-gray-200'}`}
                    fill={isFavorited ? 'currentColor' : 'none'}
                    strokeWidth={isFavorited ? 0 : 1.5}
                  />
                )}
              </button>
            )}
          </div>

          <div className="relative text-white pt-10">
            <div className="mb-2">
              <h3 className="text-2xl font-bold text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.7)]" style={{ lineHeight: '1.2em' }}>
                {name}
              </h3>
              <p className="text-base font-bold text-white mt-1 [text-shadow:0_2px_4px_rgba(0,0,0,0.7)]" style={{ lineHeight: '1.5em' }}>
                {occupation}
              </p>
            </div>

            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge
                text={gender === 'male' ? 'Мужчина' : 'Девушка'}
                icon={<div className={`w-3 h-3 rounded-full ${gender === 'male' ? 'bg-blue-400' : 'bg-pink-400'}`} />}
              />
              <Badge text={ageGroup === 'immortal' ? 'Бессмертный' : getAgeString(age)} />
            </div>

            <div className="flex items-center gap-2 mb-3 overflow-hidden flex-wrap">
              {tags.slice(0, 2).map((tag) => (
                <Badge key={tag} text={tag} variant="primary" />
              ))}
              {tags.length > 2 && <Badge text={`+${tags.length - 2}`} className="text-gray-300" />}
            </div>

            <p
              className="text-sm text-gray-200 line-clamp-2 leading-relaxed font-medium [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]"
              style={{ lineHeight: '1.4em' }}
            >
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});