// src/pages/CharactersPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import ThemedBackground from "../components/common/ThemedBackground";
import { useData } from "../contexts/DataContext";
import { CharacterCard } from "../components/Characters/CharacterCard";
import { CharacterCardSkeleton } from "../components/Characters/CharacterCardSkeleton";

import { GlassPanel } from "../components/ui/GlassPanel";
import { SearchBar } from "../components/ui/SearchBar";
import { FilterChip } from "../components/ui/FilterChip";
import { ANIM } from "../lib/animations";

import {
  Users, Mars, Venus, Cake, Clock, Star, Frown, RotateCcw,
  ArrowDownAZ, Infinity as InfinityIcon
} from "lucide-react";


const TagFilterChip = ({ tag, status, onClick }: { tag: string, status: 'include' | 'exclude' | 'off', onClick: () => void }) => {
  const baseClasses = "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer";
  
  const styles = {
    off: 'bg-badge-tag text-text-secondary border-default hover:bg-glass-hover',
    include: 'bg-green-500/20 text-green-300 border-green-500/30 filter drop-shadow-[0_0_4px_rgba(74,222,128,0.5)]',
    exclude: 'bg-red-500/20 text-red-300 border-red-500/30 filter drop-shadow-[0_0_4px_rgba(248,113,113,0.5)]',
  };

  return (
    <motion.button {...ANIM.buttonTap} onClick={onClick} className={`${baseClasses} ${styles[status]}`}>
      <span>{tag}</span>
    </motion.button>
  );
};


export function CharactersPage() {
  const navigate = useNavigate();
  // ▼▼▼ ИЗМЕНЕНИЕ №1: Получаем отфильтрованных персонажей напрямую из контекста ▼▼▼
  const { 
    filters, 
    setFilters, 
    charactersLoading, 
    filteredCharacters, // Используем этот массив!
    allCategories 
  } = useData();

  const [searchLocal, setSearchLocal] = useState(filters.search ?? "");
  const [showFilters, setShowFilters] = useState(false);
  
  // Обновляем поиск в контексте при изменении локального значения
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchLocal }));
    }, 300); // Debounce
    return () => clearTimeout(handler);
  }, [searchLocal, setFilters]);


  const { scrollY } = useScroll();
  const bgIntensity = useTransform(scrollY, [0, 500], [0.3, 0.1]);

  const handleCategoryClick = (cat: string) => {
    setFilters(prev => {
      const isIncluded = prev.includeCategories.includes(cat);
      const isExcluded = prev.excludeCategories.includes(cat);

      if (!isIncluded && !isExcluded) {
        // off -> include
        return { ...prev, includeCategories: [...prev.includeCategories, cat] };
      } else if (isIncluded) {
        // include -> exclude
        return {
          ...prev,
          includeCategories: prev.includeCategories.filter(c => c !== cat),
          excludeCategories: [...prev.excludeCategories, cat]
        };
      } else {
        // exclude -> off
        return { ...prev, excludeCategories: prev.excludeCategories.filter(c => c !== cat) };
      }
    });
  };

  const activeCount =
    (filters.gender !== "all" ? 1 : 0) +
    (filters.ageGroup !== "all" ? 1 : 0) +
    (filters.sortBy !== "newest" ? 1 : 0) +
    (filters.includeTags?.length || 0) +
    (filters.excludeTags?.length || 0) +
    (filters.includeCategories?.length || 0) +
    (filters.excludeCategories?.length || 0);

  const resetFilters = () => {
    setFilters({ search: "", gender: "all", ageGroup: "all", sortBy: "newest", includeTags: [], excludeTags: [], includeCategories: [], excludeCategories: [] });
    setSearchLocal("");
  };

  return (
    <div 
      className="min-h-screen w-full relative"
      style={{ 
        fontFamily: "var(--font-family-body)", 
        backgroundColor: "var(--bg)", 
        color: "var(--text-primary)" 
      }}
    >
      <ThemedBackground intensity={bgIntensity} />
      <div className="relative z-10 mx-auto w-full max-w-none px-2 sm:px-3 lg:px-4 py-4 lg:py-8">
        
        <motion.div {...ANIM.fadeInUp(0.1)} className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight" style={{ background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent", fontFamily: "var(--font-family-heading)", textShadow: "0 4px 12px rgba(0,0,0,0.2)"}}>
            👤 Каталог персонажей
          </h1>
          <p className="mt-2 text-base sm:text-lg" style={{ color: "var(--text-muted)" }}>
            Найдите своего идеального собеседника
          </p>
        </motion.div>

        <GlassPanel 
          delay={0.2} 
          className="mb-6"
          style={{ background: "var(--glass)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)", backdropFilter: "blur(16px)"}}
        >
          <SearchBar value={searchLocal} onChange={setSearchLocal} onToggleFilters={() => setShowFilters((v) => !v)} filtersOpen={showFilters} activeCount={activeCount} isLoading={charactersLoading}/>
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden"
              >
                <div className="border-t border-border mt-4 pt-4">
                  <div className="flex justify-between items-center mb-4 px-1">
                      <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Фильтры</h3>
                      <motion.button {...ANIM.buttonTap} onClick={resetFilters} className="inline-flex items-center gap-2 h-9 px-3 rounded-full text-sm font-medium" style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))", color: "#ffffff", border: "none", boxShadow: "0 4px 16px rgba(215, 174, 251, 0.0)"}}>
                          <RotateCcw size={14} /> <span>Сбросить</span>
                      </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 p-1">
                      <div>
                        <h4 className="text-sm uppercase tracking-wider mb-3 font-bold" style={{ color: "var(--text-muted)" }}>Пол</h4>
                        <div className="flex flex-wrap gap-2">
                          <FilterChip icon={Users} label="Все" active={filters.gender === "all"} onClick={() => setFilters({ ...filters, gender: "all" })} />
                          <FilterChip icon={Mars} label="Мужчины" active={filters.gender === "male"} onClick={() => setFilters({ ...filters, gender: "male" })} />
                          <FilterChip icon={Venus} label="Женщины" active={filters.gender === "female"} onClick={() => setFilters({ ...filters, gender: "female" })} />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm uppercase tracking-wider mb-3 font-bold" style={{ color: "var(--text-muted)" }}>Возраст</h4>
                        <div className="flex flex-wrap gap-2">
                          <FilterChip icon={Users} label="Все" active={filters.ageGroup === "all"} onClick={() => setFilters({ ...filters, ageGroup: "all" })} />
                          <FilterChip icon={Cake} label="18+" active={filters.ageGroup === "18+"} onClick={() => setFilters({ ...filters, ageGroup: "18+" })} />
                          <FilterChip icon={Clock} label="30+" active={filters.ageGroup === "30+"} onClick={() => setFilters({ ...filters, ageGroup: "30+" })} />
                          <FilterChip icon={InfinityIcon} label="Бессмертные" active={filters.ageGroup === "immortal"} onClick={() => setFilters({ ...filters, ageGroup: "immortal" })} />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="text-sm uppercase tracking-wider mb-3 font-bold" style={{ color: "var(--text-muted)" }}>Сортировка</h4>
                        <div className="flex flex-wrap gap-2">
                          <FilterChip icon={Clock} label="Сначала новые" active={filters.sortBy === "newest"} onClick={() => setFilters({ ...filters, sortBy: "newest" })} />
                          <FilterChip icon={Star} label="По рейтингу" active={filters.sortBy === "rating"} onClick={() => setFilters({ ...filters, sortBy: "rating" })} />
                          <FilterChip icon={ArrowDownAZ} label="По имени (А-Я)" active={filters.sortBy === "name"} onClick={() => setFilters({ ...filters, sortBy: "name" })} />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="text-sm uppercase tracking-wider mb-3 font-bold" style={{ color: "var(--text-muted)" }}>Категории</h4>
                        <div className="flex flex-wrap gap-2">
                          {allCategories.map(cat => {
                            const isIncluded = filters.includeCategories.includes(cat);
                            const isExcluded = filters.excludeCategories.includes(cat);
                            const status = isIncluded ? 'include' : isExcluded ? 'exclude' : 'off';
                            return <TagFilterChip key={cat} tag={cat} status={status} onClick={() => handleCategoryClick(cat)} />;
                          })}
                        </div>
                      </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassPanel>

        {charactersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 12 }).map((_, i) => <CharacterCardSkeleton key={i} />)}
          </div>
        ) : filteredCharacters.length > 0 ? ( // ▼▼▼ ИЗМЕНЕНИЕ №2: Используем `filteredCharacters` здесь ▼▼▼
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <AnimatePresence>
              {filteredCharacters.map((c) => ( // ▼▼▼ ИЗМЕНЕНИЕ №3: И здесь ▼▼▼
                <motion.div key={c.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}>
                  <CharacterCard character={c} onClick={() => navigate(`/characters/${c.id}`)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <GlassPanel className="text-center py-16" style={{ background: "var(--glass)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)", backdropFilter: "blur(16px)"}}>
            <motion.div {...ANIM.float} className="w-16 h-16 mx-auto mb-6" style={{ color: "var(--text-muted)" }}>
              <Frown size={40} />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent", fontFamily: "var(--font-family-heading)"}}>
              Ничего не найдено
            </h3>
            <p className="mb-6 text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
              Попробуйте изменить критерии поиска или сбросить фильтры.
            </p>
            <motion.button {...ANIM.buttonTap} onClick={resetFilters} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm" style={{ background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))", color: "#ffffff", border: "none", boxShadow: "0 6px 20px rgba(255, 107, 214, 0.3)"}}>
              <RotateCcw size={16} /> Сбросить все фильтры
            </motion.button>
          </GlassPanel>
        )}
      </div>
    </div>
  ); 
}

export default CharactersPage;