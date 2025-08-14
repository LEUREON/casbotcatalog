// project/src/pages/RatingPage.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { Trophy, Star } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useReviews } from '../contexts/ReviewsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Character } from '../types';
import { useNavigate } from 'react-router-dom';

const ListItem = ({ character, rank, onClick }: { character: Character & { tempRating?: number }, rank: number, onClick: (char: Character) => void }) => {
  const rating = character.tempRating !== undefined ? character.tempRating : character.rating;

  const rankStyles = [
    { border: "border-amber-400/80", shadow: "shadow-lg shadow-amber-500/20", glow: "from-amber-400/50" }, // 1st
    { border: "border-slate-300/80", shadow: "shadow-lg shadow-slate-500/20", glow: "from-slate-300/50" }, // 2nd
    { border: "border-orange-500/80", shadow: "shadow-lg shadow-orange-600/20", glow: "from-orange-500/50" } // 3rd
  ];

  const isTopThree = rank <= 3;
  const style = isTopThree ? rankStyles[rank - 1] : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={() => onClick(character)}
      className="cursor-pointer"
    >
      <motion.div
        className={`relative glass p-3 rounded-2xl flex items-center space-x-4 border-2 transition-all duration-300 ${style ? `${style.border} ${style.shadow}` : 'border-transparent hover:border-white/20'}`}
        animate={rank === 1 ? { scale: [1, 1.02, 1] } : {}}
        transition={rank === 1 ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
      >
        {style && <div className={`absolute -inset-px rounded-2xl bg-gradient-to-r ${style.glow} to-transparent opacity-50 blur-lg pointer-events-none`}></div>}

        <span className="relative text-xl font-bold w-8 text-center text-slate-400">{rank}</span>
        <img src={character.photo} alt={character.name} className="relative w-16 h-16 rounded-lg object-cover flex-shrink-0" />
        <div className="relative flex-1">
          <h3 className="font-bold text-white">{character.name}</h3>
          <p className="text-cyan-400 text-sm">{character.occupation}</p>
        </div>
        <div className="relative flex items-center space-x-2">
          <Star className="h-5 w-5 text-amber-400" fill="currentColor" />
          <span className="text-lg font-bold">{rating.toFixed(1)}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export function RatingPage() {
  const [period, setPeriod] = useState<'monthly' | 'alltime'>('monthly');
  const [visibleCount, setVisibleCount] = useState(5);
  const { characters } = useData();
  const { reviews } = useReviews();
  const navigate = useNavigate();

  const openCharacterPage = (character: Character) => {
    navigate(`/characters/${character.id}`);
  };

  const getTopCharacters = useCallback((period: 'monthly' | 'alltime'): (Character & { tempRating?: number })[] => {
    if (period === 'monthly') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthly = reviews.filter(r => new Date(r.createdAt) >= monthAgo && r.rating);
      const ratings: { [k: string]: { t: number, c: number } } = {};
      monthly.forEach(r => {
        if (!ratings[r.characterId]) ratings[r.characterId] = { t: 0, c: 0 };
        ratings[r.characterId].t += r.rating!;
        ratings[r.characterId].c++;
      });
      return characters
        .map(c => ({ ...c, tempRating: ratings[c.id] ? ratings[c.id].t / ratings[c.id].c : 0 }))
        .filter(c => c.tempRating > 0)
        .sort((a, b) => b.tempRating - a.tempRating);
    }
    return [...characters].sort((a, b) => b.rating - a.rating);
  }, [characters, reviews]);

  const topCharacters = getTopCharacters(period);
  const visibleCharacters = topCharacters.slice(0, visibleCount);

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="mb-8">
        <div className="relative glass rounded-3xl p-6 lg:p-8 border border-amber-500/20 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="relative p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl border border-white/20 shadow-2xl">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-amber-200 to-yellow-200 bg-clip-text text-transparent mb-2">
                Рейтинг персонажей
              </h1>
              <p className="text-slate-400">Лучшие по мнению сообщества</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-2 mb-8">
        <button
          onClick={() => { setPeriod('monthly'); setVisibleCount(5); }}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${period === 'monthly' ? 'bg-white text-slate-900' : 'text-slate-300 hover:bg-white/10'}`}
        >
          За месяц
        </button>
        <button
          onClick={() => { setPeriod('alltime'); setVisibleCount(5); }}
          className={`px-6 py-2 rounded-full font-semibold transition-all ${period === 'alltime' ? 'bg-white text-slate-900' : 'text-slate-300 hover:bg-white/10'}`}
        >
          За все время
        </button>
      </div>

      {topCharacters.length > 0 ? (
        <>
          <div className="max-w-2xl mx-auto space-y-3">
            <AnimatePresence>
              {visibleCharacters.map((character, index) => (
                <ListItem key={`${period}-${character.id}`} character={character} rank={index + 1} onClick={openCharacterPage} />
              ))}
            </AnimatePresence>
          </div>

          {topCharacters.length > visibleCount && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="px-8 py-3 glass rounded-xl font-semibold bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 text-white hover:opacity-90 transition-opacity"
              >
                Показать еще
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 lg:py-24 glass rounded-2xl">
          <Trophy className="h-20 w-20 text-slate-500 mx-auto mb-6" />
          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Рейтинг пока пуст
          </h3>
          <p className="text-slate-400 text-lg">
            Оцените персонажей, чтобы сформировать рейтинг!
          </p>
        </div>
      )}
    </div>
  );
}