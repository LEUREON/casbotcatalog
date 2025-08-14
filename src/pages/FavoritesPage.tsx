// src/pages/FavoritesPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { CharacterCard } from '../components/Characters/CharacterCard';
import { motion } from 'framer-motion';
import { Heart, Frown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Character } from '../types';

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
    <div className="min-h-screen p-4 lg:p-8">
      <div className="mb-8 glass rounded-3xl p-6 lg:p-8 border-red-400/20">
        <div className="flex items-center space-x-4">
          <div className="relative p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl border border-white/20 shadow-lg">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">Избранное</h1>
            <p className="text-slate-400">Ваши любимые персонажи</p>
          </div>
        </div>
      </div>
      {charactersLoading ? (
        <div className="text-center py-20">
          <p className="text-xl text-slate-400 animate-pulse">Загрузка избранного...</p>
        </div>
      ) : favoriteCharacters.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8"
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
        <div className="text-center py-16 lg:py-24 glass rounded-3xl">
          <div className="relative inline-block mb-8">
            <Frown className="h-20 w-20 text-slate-500" />
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">В избранном пока пусто</h3>
          <p className="text-slate-400 text-lg mb-6 max-w-md mx-auto">
            Нажмите на сердечко на карточке персонажа, чтобы добавить его сюда.
          </p>
          <Link
            to="/characters"
            className="inline-block px-8 py-3 glass rounded-xl font-semibold bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 text-white hover:opacity-90 transition-opacity"
          >
            Перейти к персонажам
          </Link>
        </div>
      )}
    </div>
  );
}