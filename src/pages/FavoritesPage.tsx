// src/pages/FavoritesPage.tsx
// Фильтры удалены, добавлена сортировка по дате

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Frown,
  Plus,
} from "lucide-react";

import ThemedBackground from "../components/common/ThemedBackground";
import { CharacterCard } from "../components/Characters/CharacterCard"; 
import { CharacterCardSkeleton } from "../components/Characters/CharacterCardSkeleton";
import { GlassPanel } from "../components/ui/GlassPanel";

import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useUserCharacters } from "../contexts/UserCharactersContext";
import { Character, UserCharacter } from "../types";
import { ANIM } from "../lib/animations";
import { pb } from "../lib/pocketbase";

/* =========================== Компоненты фильтров удалены =========================== */

/* ================================ Normalization (без изменений) ================================ */
function toStringArray(input: any): string[] {
    if (input == null) return [];
    if (typeof input === "string") {
        const s = input.trim(); if (!s) return [];
        if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"))) { try { return toStringArray(JSON.parse(s)); } catch {} }
        if (s.includes(",")) return Array.from(new Set(s.split(",").map(p => p.trim()).filter(Boolean)));
        return [s];
    }
    if (Array.isArray(input)) {
        const out: string[] = [];
        input.forEach(it => {
        if (it == null) return;
        if (typeof it === "string" || typeof it === "number") { String(it).split(",").map(p => p.trim()).filter(Boolean).forEach(p => out.push(p)); }
        else if (typeof it === "object") { const v = (it as any).name ?? (it as any).label ?? (it as any).title ?? (it as any).value ?? (it as any).text; if (v != null) out.push(String(v)); else Object.entries(it as any).forEach(([k, v]) => { if (v) out.push(String(k)); }); } });
        return Array.from(new Set(out.filter(Boolean)));
    }
    if (typeof input === "object") {
        const v = (input as any).name ?? (input as any).label ?? (input as any).title ?? (input as any).value ?? (input as any).text;
        if (v != null) return toStringArray(String(v));
        return Array.from(new Set(Object.entries(input as any).filter(([, v]) => v).map(([k]) => String(k))));
    }
    return [String(input)];
}

function normalizeAnyCharacter(obj: any): Character {
    const photoIdentifier = (obj as any)?.photo || (obj as any)?.imageUrl || (obj as any)?.image || (Array.isArray((obj as any)?.images) ? (obj as any)?.images[0] : "") || "";
    let photoUrl = "";
    if (photoIdentifier) {
        if (photoIdentifier.startsWith('http://') || photoIdentifier.startsWith('https://') || photoIdentifier.startsWith('data:')) {
            photoUrl = photoIdentifier;
        } else if (obj?.collectionId && obj?.id) { 
            try { photoUrl = pb.getFileUrl(obj as any, photoIdentifier); }
            catch (e) { photoUrl = ""; }
        } else { photoUrl = ""; }
    }
    const cats = [...toStringArray(obj?.category), ...toStringArray(obj?.categories)];
    const tags = [...toStringArray(obj?.tags), ...toStringArray(obj?.tag), ...toStringArray(obj?.labels), ...toStringArray(obj?.keywords)];
    const occupation = (obj as any)?.occupation || (obj as any)?.role || "";
    const description = (obj as any)?.description || (obj as any)?.shortDescription || "";
    const fullDescription = (obj as any)?.fullDescription || (obj as any)?.contentHTML || "";
    const gender: Character["gender"] = (obj as any)?.gender === "female" ? "female" : "male";
    const age: number = Number((obj as any)?.age ?? 0);
    const ageGroup: Character["ageGroup"] = (obj as any)?.ageGroup || (age === 0 ? "immortal" : age >= 30 ? "30+" : age >= 18 ? "18+" : "all");
    const linksRaw: any[] = Array.isArray((obj as any)?.links) ? (obj as any)?.links : [];
    const links = linksRaw.map((l: any) => (typeof l === "string" ? { url: l, label: undefined } : l)).filter((l: any) => l && l.url);

    return {
        id: (obj as any)?.id || "", name: (obj as any)?.name || (obj as any)?.title || "Без имени",
        occupation, description, fullDescription, photo: photoUrl, gender, age, ageGroup,
        rating: Number((obj as any)?.rating ?? 0), category: Array.from(new Set(cats)), tags: Array.from(new Set(tags)), links,
        collectionId: (obj as any)?.collectionId, collectionName: (obj as any)?.collectionName,
        user: (obj as any)?.user, 
        created: (obj as any)?.created || (obj as any)?.createdAt, updated: (obj as any)?.updated || (obj as any)?.updatedAt,
    } as Character;
}

/* ================================ State & Data ================================ */

export function FavoritesPage() {
  const navigate = useNavigate();
  const { user, userCharacterFavorites, toggleFavorite, toggleUserCharacterFavorite } = useAuth();
  const { characters, loadCharacters, charactersLoading } = useData();
  const { userCharacters = [], loading: userCharsLoading } = useUserCharacters();

  const { scrollY } = useScroll();
  const bgIntensity = useTransform(scrollY, [0, 500], [0.3, 0.1]);

  // Состояния фильтров удалены

  const [fetchedFavoriteUserChars, setFetchedFavoriteUserChars] = useState<Character[]>([]);
  const [fetchingFavoritesLoading, setFetchingFavoritesLoading] = useState(false);
  const [togglingFavoriteId, setTogglingFavoriteId] = useState<string | null>(null);

  // Эффект для загрузки публичных карточек (без изменений)
  useEffect(() => {
    if (user && characters.length === 0 && !charactersLoading) {
      loadCharacters();
    }
  }, [user, characters.length, loadCharacters, charactersLoading]);

  // useEffect для загрузки недостающих избранных (без изменений)
  useEffect(() => {
    if (!user || !userCharacterFavorites || userCharacterFavorites.length === 0) {
        setFetchedFavoriteUserChars([]); setFetchingFavoritesLoading(false); return;
    }
    const ownCharacterIds = new Set(userCharacters.map(uc => uc.id));
    const idsToFetch = userCharacterFavorites.filter(favId =>
        !ownCharacterIds.has(favId) && !fetchedFavoriteUserChars.some(fetched => fetched.id === favId)
    );

    if (idsToFetch.length === 0) {
         setFetchedFavoriteUserChars(currentFetched =>
             currentFetched.filter(char => userCharacterFavorites.includes(char.id))
         );
        setFetchingFavoritesLoading(false); return;
    }

    let cancelled = false;
    const fetchMissingFavorites = async () => {
        setFetchingFavoritesLoading(true);
        try {
            const filterString = idsToFetch.map(id => `id = "${id}"`).join(' || ');
            const records = await pb.collection('user_characters').getFullList({ filter: filterString });
            if (!cancelled) {
                const normalizedNewChars = records.map(normalizeAnyCharacter);
                setFetchedFavoriteUserChars(currentFetched => {
                     const combined = [...currentFetched, ...normalizedNewChars];
                     const uniqueMap = new Map<string, Character>();
                     combined.forEach(char => {
                        if (char.id && userCharacterFavorites.includes(char.id)) { uniqueMap.set(char.id, char); }
                     });
                     return Array.from(uniqueMap.values());
                });
            }
        } catch (error) {
            console.error("Failed to fetch favorite user characters:", error);
            if (!cancelled) {
                 setFetchedFavoriteUserChars(currentFetched =>
                     currentFetched.filter(char => userCharacterFavorites.includes(char.id))
                 );
            }
        } finally {
            if (!cancelled) { setFetchingFavoritesLoading(false); }
        }
    };
    fetchMissingFavorites();
    return () => { cancelled = true; };
  }, [user, userCharacterFavorites, userCharacters]); 

  // Рендер для неавторизованных (без изменений)
  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center px-4" style={{ background: "var(--bg)", color: "var(--text-primary)" }}>
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-black">Только для авторизованных</h2>
          <p className="text-white/60">Войдите, чтобы видеть избранное и своих персонажей.</p>
          <Link to="/login" className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-white">
            Войти
          </Link>
        </div>
      </div>
    );
  }

  // Логика объединения списков (без изменений)
  const allMyDisplayCharacters: Character[] = useMemo(() => {
    const map = new Map<string, Character>();
    const publicFavoriteIds = new Set(user?.favorites || []);
    characters.filter(c => c?.id && publicFavoriteIds.has(c.id)).forEach(c => { if (c?.id) map.set(c.id, normalizeAnyCharacter(c)); });
    (userCharacters as (UserCharacter | Character)[]).forEach(uc => { if (uc?.id) map.set(uc.id, normalizeAnyCharacter(uc)); });
    fetchedFavoriteUserChars.forEach(ffuc => { if (ffuc?.id && !map.has(ffuc.id)) map.set(ffuc.id, ffuc); }); 
    return Array.from(map.values());
  }, [characters, user?.favorites, userCharacters, fetchedFavoriteUserChars]);

  // --- ИЗМЕНЕНИЕ: Добавлена сортировка по дате ---
  const sortedCharacters = useMemo(() => {
    return [...allMyDisplayCharacters].sort((a, b) => {
      const aDate = a.created;
      const bDate = b.created;
      // Если даты нет, отправляем в конец
      const at = aDate ? new Date(aDate).getTime() : 0; 
      const bt = bDate ? new Date(bDate).getTime() : 0;
      return bt - at; // Сначала новые (descending)
    });
  }, [allMyDisplayCharacters]);
  // ---

  // Статус загрузки (без изменений)
  const isLoading = charactersLoading || userCharsLoading || fetchingFavoritesLoading;

  // Логика определения типа карточки (без изменений)
  const USER_CHARS_COLLECTION_NAME = 'user_characters'; 
  const USER_CHARS_COLLECTION_ID = 'z4kfby96570773u';   

  const isUserCard = (c: Character): boolean => {
      if (c.collectionName === USER_CHARS_COLLECTION_NAME || c.collectionId === USER_CHARS_COLLECTION_ID) {
          return true;
      }
      return userCharacterFavorites.includes(c.id) || !!(c as any).user;
  };

  const openCard = (c: Character) => { 
    if (isUserCard(c)) { 
      navigate(`/user-characters/${encodeURIComponent(c.id)}`);
    } else {
      navigate(`/characters/${encodeURIComponent(c.id)}`);
    }
  };

  const headerGrad = "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)";

  /* ================================ Render ================================ */
  return (
    <div className="min-h-screen w-full relative pb-28" style={{ fontFamily: "var(--font-family-body)", backgroundColor: "var(--bg)", color: "var(--text-primary)" }}>
      <ThemedBackground intensity={bgIntensity} />

      <div className="relative z-10 mx-auto w-full max-w-none px-2 sm:px-3 lg:px-4 py-4 lg:py-8">
        {/* Заголовок (без изменений) */}
        <motion.div {...ANIM.fadeInUp(0.1)} className="mb-8 text-center">
             <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight" style={{ background: headerGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent", textShadow: "0 4px 12px rgba(0,0,0,0.2)", fontFamily: "var(--font-family-heading)", }}>
                ❤️Любимые персонажи
             </h1>
             <p className="mt-2 text-base sm:text-lg text-white/60">Избранные и созданные вами</p>
        </motion.div>

        {/* CTA (без изменений) */}
        <motion.div {...ANIM.fadeInUp(0.2)} className="mb-8 max-w-md mx-auto">
             <Link to="/submit-character" className="group relative flex items-center justify-center gap-2 w-full h-[52px] rounded-full font-bold" style={{ background: "linear-gradient(135deg, #ff6bd6 0%, #8a75ff 100%)", color: "#fff", boxShadow: "0 10px 28px rgba(136, 117, 255, 0.4)" }} > <Plus size={18} /> Добавить персонажа </Link>
        </motion.div>

        {/* Панели поиска и фильтров удалены */}
        
        {/* --- Отображение контента (Изменено) --- */}
        {isLoading ? ( 
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CharacterCardSkeleton key={i} />
            ))}
          </div>
        ) : allMyDisplayCharacters.length === 0 ? ( // Проверка на allMy... все еще верна
          <GlassPanel className="text-center py-16 lg:py-24">
            <motion.div {...ANIM.float} className="w-16 h-16 mx-auto mb-6 opacity-60">
              <Frown size={40} />
            </motion.div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">Здесь пока пусто</h3>
            <p className="text-sm sm:text-base mb-6 text-white/70">Создайте своего персонажа или добавьте публичного в избранное.</p>
            <Link
              to="/submit-character"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-white"
              style={{ background: "linear-gradient(135deg,#ff6bd6,#8a75ff)" }}
            >
              <Plus size={16} />
              Добавить персонажа
            </Link>
          </GlassPanel>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              key="favorites-grid-sorted" // Ключ обновлен
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
              initial="hidden" animate="show" exit="hidden"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            >
              {/* --- ИЗМЕНЕНИЕ: map по sortedCharacters --- */}
              {sortedCharacters.map((c, i) => { 
                const isUser = isUserCard(c); 

                const isFav = isUser
                    ? userCharacterFavorites.includes(c.id) 
                    : user?.favorites?.includes(c.id) ?? false; 
                const isToggling = togglingFavoriteId === c.id; 

                const handleToggleFav = async () => {
                    if (isToggling || !user) return;
                    setTogglingFavoriteId(c.id);
                    try {
                        if (isUser) { await toggleUserCharacterFavorite(c.id); } 
                        else { await toggleFavorite(c.id); } 
                    } catch (error) { console.error("Error toggling favorite from FavoritesPage:", error); }
                    finally { setTogglingFavoriteId(null); }
                };

                const categoriesForCard = Array.from(new Set([...toStringArray((c as any).categories), ...toStringArray((c as any).category)]));
                const tagsForCard = Array.from(new Set([...toStringArray((c as any).tags), ...toStringArray((c as any).tag), ...toStringArray((c as any).labels), ...toStringArray((c as any).keywords)]));
                
                const characterForCard: Character = {
                    ...c, 
                    source: isUser ? "user" : (c as any).source,
                    category: categoriesForCard,
                    categories: categoriesForCard, 
                    tags: tagsForCard,
                };

                return (
                  <motion.div
                    key={c.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.04 }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCard(c); } }}
                      className="relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-2xl h-full" 
                    >
                      <CharacterCard
                        character={characterForCard}
                        onClick={openCard} 
                        isUserCreated={userCharacters.some(uc => uc.id === c.id)}
                        className="h-full"
                        showFavoriteButton={true} 
                        isFavorited={isFav}
                        isFavoriteLoading={isToggling}
                        onToggleFavorite={handleToggleFav} 
                      />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default FavoritesPage;