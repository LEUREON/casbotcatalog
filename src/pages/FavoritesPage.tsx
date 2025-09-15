// src/pages/FavoritesPage.tsx
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { CharacterCard } from '../components/Characters/CharacterCard';
import { motion } from 'framer-motion';
import { Heart, Frown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Character } from '../types';
import { CharacterCardSkeleton } from '../components/Characters/CharacterCardSkeleton';

const TOKENS = {
  border: "rgba(255,255,255,0.12)",
  accent: "#f7cfe1",
};

export function FavoritesPage() {
  const { user } = useAuth();
  const { characters, loadCharacters, charactersLoading } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && characters.length === 0) {
      loadCharacters();
    }
  }, [loadCharacters, user, characters.length]);

  const openCharacterPage = (character: Character) => {
    navigate(`/characters/${character.id}`);
  };

  if (!user) {
    // Этот блок не будет виден из-за ProtectedRoute, но оставим на всякий случай
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-8 border border-red-500/20 text-center max-w-md">
          <Heart className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Доступ запрещен</h2>
          <p className="text-slate-400">Войдите в систему для просмотра избранного</p>
        </div>
      </div>
    );
  }

  const favoriteCharacters = characters.filter(character => user.favorites?.includes(character.id));

  return (
    <div className="min-h-screen p-2 sm:p-4 pt-4 sm:pt-6">
      {charactersLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CharacterCardSkeleton key={i} />)}
        </div>
      ) : favoriteCharacters.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          animate="show"
        >
          {favoriteCharacters.map((character) => (
            <motion.div
              key={character.id}
              variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            >
              <CharacterCard character={character} onClick={openCharacterPage} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div 
          className="text-center py-16 lg:py-24 rounded-3xl border"
          style={{ borderColor: TOKENS.border, background: "rgba(255,255,255,0.03)"}}
        >
          <Frown className="h-16 w-16 text-slate-500 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-3">В избранном пока пусто</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Нажмите на сердечко на карточке персонажа, чтобы добавить его сюда.
          </p>
          <Link
            to="/characters"
            className="inline-block px-8 py-3 rounded-xl font-semibold text-black"
            style={{ background: TOKENS.accent }}
          >
            Перейти к персонажам
          </Link>
        </div>
      )}
    </div>
  );
}