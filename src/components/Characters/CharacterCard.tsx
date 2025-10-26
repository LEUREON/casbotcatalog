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

/* ======================= Универсальная нормализация JSON/строк → string[] ======================= */
function toStringArray(input: any): string[] {
  if (input === undefined || input === null) return [];

  if (typeof input === 'string') {
    const s = input.trim();
    if (!s) return [];
    const looksLikeJson = (s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'));
    if (looksLikeJson) {
      try { return toStringArray(JSON.parse(s)); } catch {}
    }
    if (s.includes(',')) return Array.from(new Set(s.split(',').map((p) => p.trim()).filter(Boolean)));
    return [s];
  }

  if (Array.isArray(input)) {
    const out: string[] = [];
    for (const item of input) {
      if (item == null) continue;
      if (typeof item === 'string' || typeof item === 'number') {
        String(item).split(',').map((p) => p.trim()).filter(Boolean).forEach((p) => out.push(p));
      } else if (typeof item === 'object') {
        const textLike = (item as any).label ?? (item as any).name ?? (item as any).text ?? (item as any).title ?? (item as any).value;
        if (textLike != null) {
          const s = String(textLike).trim();
          if (s) out.push(s);
        } else {
          Object.entries(item as any).forEach(([k, v]) => { if (v && String(k).trim()) out.push(String(k).trim()); });
        }
      }
    }
    return Array.from(new Set(out.filter(Boolean)));
  }

  if (typeof input === 'object') {
    const textLike = (input as any).label ?? (input as any).name ?? (input as any).text ?? (input as any).title ?? (input as any).value;
    if (textLike != null) return toStringArray(String(textLike));
    return Array.from(new Set(Object.entries(input as any).filter(([, v]) => v).map(([k]) => String(k))));
  }

  const s = String(input).trim();
  return s ? [s] : [];
}

// === 🎨 локальные токены ===
const DESIGN = {
  colors: {
    background: { glass: 'rgba(16, 16, 22, 0.6)', dark: 'var(--bg-dark)' },
    border: 'rgba(255, 255, 255, 0.1)',
    accent: { primary: 'var(--accent-primary)', secondary: '#ff6bd6' },
  },
  fonts: { heading: 'var(--font-family-heading)', body: 'var(--font-family-body)' },
};

const ANIM = { buttonTap: { whileTap: { scale: 0.95 }, transition: { type: 'spring', stiffness: 400, damping: 15 } } };

interface CharacterCardProps {
  character: Character & Record<string, any>;
  onClick: (character: Character & Record<string, any>) => void;
  /** флаг из FavoritesPage — карточка пользователя */
  isUserCreated?: boolean;
}

export const CharacterCard = memo(function CharacterCard({
  character,
  onClick,
  isUserCreated = false,
}: CharacterCardProps) {
  const { user, toggleFavorite } = useAuth();
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  // ключевые поля
  const {
    id,
    name,
    photo,
    imageUrl,
    occupation,
    gender,
    age,
    ageGroup,
    description,
    isNew,
  } = character as any;

  // категории → объединяем оба поля, чтобы пустой `category: []` не глушил `categories`
  const categoryList = useMemo(
    () => Array.from(new Set([
      ...toStringArray((character as any)?.category),
      ...toStringArray((character as any)?.categories),
    ])),
    [character]
  );

  // теги
  const tagList = useMemo(() => toStringArray((character as any)?.tags), [character]);

  // определение "своя" карточка
  const isOwn = Boolean(
    isUserCreated ||
    (character as any)?.source === 'user' ||
    (character as any)?.authorId ||
    (character as any)?.userId ||
    (character as any)?.collection === 'user_characters'
  );

  // рейтинг
  const { reviews } = useReviews();
  const { avgRating, reviewsCount } = useMemo(() => {
    const list = reviews.filter((r) => r.characterId === id && typeof r.rating === 'number' && r.rating > 0);
    if (list.length === 0) return { avgRating: 0, reviewsCount: 0 };
    const sum = list.reduce((s, r) => s + (r.rating || 0), 0);
    return { avgRating: sum / list.length, reviewsCount: list.length };
  }, [reviews, id]);

  const showNewBadge = !!isNew;

  // ❤️ избранное: свои карточки — всегда активны и заблокированы
  const isFavorited = isOwn ? true : (user?.favorites?.includes(id) || false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwn) return; // нельзя отменить у своих
    if (user && !isFavoriteLoading) {
      setIsFavoriteLoading(true);
      await toggleFavorite(id);
      setIsFavoriteLoading(false);
    }
  };

  const imgSrc = photo || imageUrl || '';

  return (
    <motion.div
      onClick={() => onClick(character)}
      className="relative w-full cursor-pointer flex flex-col rounded-2xl overflow-hidden shadow-lg"
      style={{ fontFamily: DESIGN.fonts.body, background: DESIGN.colors.background.dark }}
      tabIndex={0}
    >
      <div className="relative w-full h-0" style={{ paddingTop: '100%' }}>
        {imgSrc ? (
          <img src={imgSrc} alt={name} loading="lazy" className="absolute top-0 left-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute top-0 left-0 w-full h-full bg-white/5" />
        )}

        {/* нижний градиент */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${DESIGN.colors.background.dark}, transparent)` }}
        />

        {/* верхние бейджи */}
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

        {/* бейдж «Пользовательский» — слева снизу на фото */}
        {isOwn && (
          <div className="absolute bottom-3 left-3 z-10">
            <span
              className="inline-flex items-center rounded-full px-3 py-1
                         text-[11.5px] font-semibold uppercase tracking-wide
                         bg-pink-300/95 text-pink-950 border border-pink-200
                         shadow-[0_8px_22px_rgba(236,72,153,0.18)]"
            >
              Пользовательский
            </span>
          </div>
        )}

        {/* ❤️ избранное — справа снизу; свои — активны и заблокированы */}
        {user && (
          <motion.button
            {...ANIM.buttonTap}
            onClick={handleFavoriteClick}
            disabled={isFavoriteLoading || isOwn}
            className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center z-10 ${isOwn ? 'cursor-not-allowed opacity-100' : ''}`}
            style={{
              background: isFavorited ? `linear-gradient(135deg, var(--accent-primary), #ff6bd6)` : DESIGN.colors.background.glass,
              border: `1px solid ${isFavorited ? 'transparent' : DESIGN.colors.border}`,
            }}
            aria-label={isOwn ? 'Ваш персонаж — всегда в избранном' : (isFavorited ? 'Убрать из избранного' : 'Добавить в избранное')}
            title={isOwn ? 'Ваш персонаж всегда в избранном' : undefined}
            aria-disabled={isOwn}
          >
            {isFavoriteLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Heart className="w-5 h-5" fill="currentColor" stroke="none" style={{ color: isFavorited ? '#ffffff' : 'var(--accent-primary)' }} />
            )}
          </motion.button>
        )}
      </div>

      <div className="relative p-4 z-10">
        <div className="text-center mb-3">
          <h3 className="text-2xl font-black truncate text-[var(--text-primary)]" style={{ fontFamily: DESIGN.fonts.heading }}>
            {name}
          </h3>
          {occupation && <p className="font-medium text-base truncate mt-1 text-[var(--text-secondary)]">{occupation}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          {gender && (
            <InfoBadge
              icon={<User size={14} />}
              text={gender === 'male' ? 'Мужчина' : gender === 'female' ? 'Женщина' : String(gender)}
              colorClass="bg-white/5 text-text-secondary border border-white/10"
            />
          )}
          {ageGroup && (
            <InfoBadge
              icon={ageGroup === 'immortal' ? <InfinityIcon size={14} /> : <Cake size={14} />}
              text={ageGroup === 'immortal' ? 'Бессмертный' : getAgeString(age)}
              colorClass="bg-white/5 text-text-secondary border border-white/10"
            />
          )}
        </div>
 
        {/* Категории (фиолетовые) */}
        {categoryList.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
            {categoryList.map((cat) => (
              <TagBadge key={cat} text={cat} isCategory />
            ))}
          </div>
        )}
 
        {/* Теги — отдельно */}
        {tagList.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
            {tagList.map((tag) => (
              <TagBadge key={tag} text={tag} />
            ))}
          </div>
        )}

        {description && (
          <p className="text-[13px] font-bold text-center leading-relaxed text-[var(--text-muted)]">{description}</p>
        )}
      </div>
    </motion.div>
  );
});
