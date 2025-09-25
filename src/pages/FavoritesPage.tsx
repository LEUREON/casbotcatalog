// src/pages/FavoritesPage.tsx
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { CharacterCard } from '../components/Characters/CharacterCard';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Heart, Frown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Character } from '../types';
import { CharacterCardSkeleton } from '../components/Characters/CharacterCardSkeleton';
import ThemedBackground from '../components/common/ThemedBackground';

// === 🎨 ЕДИНАЯ ДИЗАЙН-СИСТЕМА (ПОЛНОСТЬЮ СИНХРОНИЗИРОВАНА С CharacterPage.tsx) ===
const DESIGN = {
  colors: {
    text: {
      primary: "#ffffff",
      secondary: "#e0e0e0",
      muted: "#b0b0b0",
      accent: "#d7aefb",
    },
    background: {
      glass: "rgba(40, 40, 50, 0.65)",
      glassHover: "rgba(50, 50, 65, 0.8)",
      floating: "rgba(30, 30, 40, 0.8)",
      dark: "#121218",
      item: "rgba(255,255,255,0.04)",
      reply: "rgba(35, 25, 55, 0.7)",
    },
    border: "rgba(255, 255, 255, 0.08)",
    accent: {
      primary: "#d7aefb",
      secondary: "#ff6bd6",
      tertiary: "#8a75ff",
      glow: "rgba(215, 174, 251, 0.4)",
    },
    star: {
      filled: "#FFD700",
      glow: "rgba(255, 215, 0, 0.6)",
    },
    badges: {
      male: "#87cefa",
      female: "#ffb6c1",
      age: "#dda0dd",
      immortal: "#ffd700",
      tag: "rgba(255, 255, 255, 0.08)",
    },
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  radius: {
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    full: "9999px",
  },
  shadows: {
    glass: "0 8px 32px rgba(0, 0, 0, 0.35)",
    glassHover: "0 12px 40px rgba(0, 0, 0, 0.4)",
    accent: "0 4px 16px rgba(215, 174, 251, 0.4)",
    starGlow: "0 0 12px rgba(255, 215, 0, 0.5)",
    button: "0 6px 20px rgba(255, 107, 214, 0.3)",
    buttonHover: "0 8px 24px rgba(255, 107, 214, 0.4)",
  },
  fonts: {
    heading: `"Geist", "Inter", system-ui, sans-serif`,
    body: `"Geist", "Inter", system-ui, sans-serif`,
  },
  transitions: {
    quick: "0.2s ease",
    smooth: "0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
    spring: { type: "spring", stiffness: 400, damping: 25 } as const,
  },
};

// === 🎭 АНИМАЦИОННЫЕ ПРЕСЕТЫ (ПОЛНОСТЬЮ СИНХРОНИЗИРОВАНЫ) ===
const ANIM = {
  fadeInUp: (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay },
  }),
  fadeInStagger: {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
  },
  buttonTap: {
    whileTap: { scale: 0.97 },
  },
  buttonPulse: {
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 0.4, ease: "easeInOut" },
  },
  float: {
    animate: { y: [0, -8, 0] },
    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" },
  },
};

export function FavoritesPage() {
  const { user } = useAuth();
  const { characters, loadCharacters, charactersLoading } = useData();
  const navigate = useNavigate();

  // Параллакс для фона
  const { scrollY } = useScroll();
  const bgIntensity = useTransform(scrollY, [0, 500], [0.3, 0.1]);

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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ fontFamily: DESIGN.fonts.body, backgroundColor: DESIGN.colors.background.dark }}>
        <ThemedBackground intensity={bgIntensity} />
        <div 
          className="rounded-3xl p-8 border text-center max-w-md"
          style={{
            background: DESIGN.colors.background.glass,
            borderColor: DESIGN.colors.border,
            boxShadow: DESIGN.shadows.glass,
            color: DESIGN.colors.text.primary,
          }}
        >
          <Heart className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Доступ запрещен</h2>
          <p className="text-sm" style={{ color: DESIGN.colors.text.muted }}>Войдите в систему для просмотра избранного</p>
        </div>
      </div>
    );
  }

  const favoriteCharacters = characters.filter(character => user.favorites?.includes(character.id));

  return (
    <div className="min-h-screen w-full relative" style={{ fontFamily: DESIGN.fonts.body, backgroundColor: DESIGN.colors.background.dark }}>
      <ThemedBackground intensity={bgIntensity} />

      <div className="relative z-10 mx-auto w-full max-w-none px-2 sm:px-3 lg:px-4 py-4 lg:py-8">
        {/* Заголовок страницы */}
        <motion.div {...ANIM.fadeInUp(0.1)} className="mb-8 text-center">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight"
            style={{
              background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              fontFamily: DESIGN.fonts.heading,
              textShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            ❤️ Мои избранные
          </h1>
          <p className="mt-2 text-base sm:text-lg" style={{ color: DESIGN.colors.text.muted }}>
            Персонажи, которые покорили ваше сердце
          </p>
        </motion.div>

        {charactersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CharacterCardSkeleton key={i} />
            ))}
          </div>
        ) : favoriteCharacters.length > 0 ? (
          <AnimatePresence>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
              variants={{ show: { transition: { staggerChildren: 0.07 } } }}
              initial="hidden"
              animate="show"
            >
              {favoriteCharacters.map((character, i) => (
                <motion.div
                  key={character.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.07 }}
                >
                  <CharacterCard character={character} onClick={openCharacterPage} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            {...ANIM.fadeInUp(0.2)}
            className="text-center py-16 lg:py-24 rounded-3xl"
            style={{
              background: DESIGN.colors.background.glass,
              borderColor: DESIGN.colors.border,
              boxShadow: DESIGN.shadows.glass,
              color: DESIGN.colors.text.primary,
            }}
          >
            <motion.div
              {...ANIM.float}
              className="w-16 h-16 mx-auto mb-6 opacity-50"
              style={{ color: DESIGN.colors.text.muted }}
            >
              <Frown />
            </motion.div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">В избранном пока пусто</h3>
            <p className="text-sm sm:text-base mb-6 max-w-md mx-auto" style={{ color: DESIGN.colors.text.muted }}>
              Нажмите на сердечко на карточке персонажа, чтобы добавить его сюда.
            </p>
            <motion.button
              {...ANIM.buttonTap}
              onClick={() => navigate('/characters')}
              className="inline-block px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-base transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})`,
                color: "#ffffff",
                border: "none",
                boxShadow: DESIGN.shadows.button,
              }}
            >
              Перейти к персонажам
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
} 