// src/pages/CharactersPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import ThemedBackground from "../components/common/ThemedBackground";
import { useData } from "../contexts/DataContext";
import { CharacterCard } from "../components/Characters/CharacterCard";
import { CharacterCardSkeleton } from "../components/Characters/CharacterCardSkeleton";
import { GlassPanel } from "../components/ui/GlassPanel";
import { SearchBar } from "../components/ui/SearchBar";
import { ANIM } from "../lib/animations";
import { FilterState } from "../types"; 

import {
  Users,
  Mars,
  Venus,
  Cake,
  Clock,
  Star,
  Frown,
  RotateCcw,
  ArrowUpDown, 
  Infinity as InfinityIcon,
  Search as SearchIcon, 
  Loader2,
  SlidersHorizontal,
  Layers, 
  // Tag, // <-- Удалено
} from "lucide-react";


// --- Компонент AccentChip (без изменений) ---
type Accent = "pink" | "sky" | "violet";
function AccentChip({
  label,
  isActive,
  onClick,
  accent = "pink",
  icon: Icon 
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  accent?: Accent;
  icon?: React.ElementType; 
}) {
  const base =
    "inline-flex items-center gap-2 px-4 py-3 rounded-full text-[15px] md:text-[15px] border transition-all duration-200 cursor-pointer select-none leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30";

  const activeMap: Record<Accent, string> = {
    pink: "bg-pink-300/95 text-pink-950 border-pink-200 shadow-[0_8px_22px_rgba(236,72,153,0.18)]",
    sky: "bg-sky-300/95 text-sky-950 border-sky-200 shadow-[0_8px_22px_rgba(56,189,248,0.18)]",
    violet: "bg-violet-300/95 text-violet-950 border-violet-200 shadow-[0_8px_22px_rgba(139,92,246,0.18)]",
  };
  const inactive = "bg-white/6 text-white/85 border-white/10 hover:bg-white/10 hover:border-white/20";
  return (
    <motion.button
      {...ANIM.buttonTap}
      className={`${base} ${isActive ? activeMap[accent] : inactive}`}
      onClick={onClick}
      type="button"
      aria-pressed={isActive}
    >
      {Icon && <Icon size={16} className={`opacity-80 ${isActive ? '' : 'opacity-60'}`} />}
      {label}
    </motion.button>
  );
}

// --- Компонент SectionCard (без изменений) ---
function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)] ${className}`}
      style={{ backdropFilter: "blur(6px)" }}
    >
      {children}
    </div>
  );
}

// --- Компонент TagFilterChip (без изменений, используется для Категорий) ---
type ToggleStatus = "off" | "include" | "exclude";
const TagFilterChip = ({ tag, status, onClick, size = 'small' }: { 
  tag: string, 
  status: 'include' | 'exclude' | 'off', 
  onClick: () => void,
  size?: 'small' | 'large' 
}) => {
  
  const sizeClasses = {
    small: "px-3 py-1.5 text-xs font-medium",
    large: "px-4 py-3 text-[15px] md:text-[15px] leading-none" 
  };

  const baseClasses = `inline-flex items-center justify-center gap-2 rounded-full border transition-all duration-200 cursor-pointer ${sizeClasses[size]}`;

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
// --- КОНЕЦ TagFilterChip ---

const defaultFilters: FilterState = {
  search: "", gender: "all", ageGroup: "all", sortBy: "newest",
  includeTags: [], excludeTags: [], includeCategories: [], excludeCategories: [],
};


export function CharactersPage() {
  const navigate = useNavigate();
  const {
    filters,
    setFilters,
    charactersLoading,
    filteredCharacters,
    allCategories,
    // allTags // <-- Удалено
  } = useData();

  const [searchLocal, setSearchLocal] = useState(filters.search ?? "");
  const [showFilters, setShowFilters] = useState(false);
  // const [tagsExpanded, setTagsExpanded] = useState(false); // <-- Удалено
  // const TAGS_COLLAPSED_COUNT = 10; // <-- Удалено

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchLocal }));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchLocal, setFilters]);


  const { scrollY } = useScroll();
  const bgIntensity = useTransform(scrollY, [0, 500], [0.3, 0.1]);

  // Сортировка для категорий
  const sortedCategories = useMemo(() => 
    [...allCategories].sort((a, b) => a.localeCompare(b))
  , [allCategories]);
  
  // const sortedTags = useMemo(() => ... // <-- Удалено
  // const tagsToShow = useMemo(() => ... // <-- Удалено

  // --- Логика для категорий и тегов (без изменений) ---
  const cycleStatus = (group: "tags" | "categories", value: string) => {
    setFilters((prev) => {
      const incKey = group === "tags" ? "includeTags" : "includeCategories";
      const excKey = group === "tags" ? "excludeTags" : "excludeCategories";
      const isIncluded = prev[incKey].includes(value);
      const isExcluded = prev[excKey].includes(value);
      let nextInc = [...prev[incKey]];
      let nextExc = [...prev[excKey]];

      if (!isIncluded && !isExcluded) { // off -> include
        nextInc.push(value);
      } else if (isIncluded) { // include -> exclude
        nextInc = nextInc.filter(v => v !== value);
        nextExc.push(value);
      } else { // exclude -> off
        nextExc = nextExc.filter(v => v !== value);
      }
      return { ...prev, [incKey]: nextInc, [excKey]: nextExc };
    });
  };

  const getStatus = (group: "tags" | "categories", value: string): ToggleStatus => {
    const incKey = group === "tags" ? "includeTags" : "includeCategories";
    const excKey = group === "tags" ? "excludeTags" : "excludeCategories";
    if (filters[incKey].includes(value)) return "include";
    if (filters[excKey].includes(value)) return "exclude";
    return "off";
  };
  // --- КОНЕЦ Логики категорий и тегов ---

  // activeCount по-прежнему включает теги, т.к. состояние фильтров глобальное
  const activeCount = useMemo(() => 
    (filters.gender !== "all" ? 1 : 0) +
    (filters.ageGroup !== "all" ? 1 : 0) +
    (filters.sortBy !== "newest" ? 1 : 0) +
    (filters.includeTags?.length || 0) +
    (filters.excludeTags?.length || 0) +
    (filters.includeCategories?.length || 0) +
    (filters.excludeCategories?.length || 0),
  [filters]); 

  const resetFilters = () => { 
    setFilters(defaultFilters);
    setSearchLocal("");
    // setTagsExpanded(false); // <-- Удалено
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

        {/* --- Заголовок (без изменений) --- */}
        <motion.div {...ANIM.fadeInUp(0.1)} className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight" style={{ background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent", fontFamily: "var(--font-family-heading)", textShadow: "0 4px 12px rgba(0,0,0,0.2)"}}>
            👤 Каталог персонажей
          </h1>
          <p className="mt-2 text-base sm:text-lg" style={{ color: "var(--text-muted)" }}>
            Найдите своего идеального собеседника
          </p>
        </motion.div>

        {/* --- SearchBar (без изменений) --- */}
         <motion.div {...ANIM.fadeInUp(0.25)} className="mb-7">
             <GlassPanel className="p-4 sm:p-5 md:p-6 rounded-[28px] backdrop-blur-2xl" style={{ borderColor: "rgba(255,255,255,0.12)", background: "radial-gradient(140% 180% at 0% 0%, rgba(255,107,214,0.12) 0%, rgba(255,107,214,0.00) 45%), linear-gradient(180deg, rgba(24,24,36,0.78) 0%, rgba(20,20,30,0.56) 100%)", boxShadow: "0 16px 48px rgba(0,0,0,0.35), inset 0 1px rgba(255,255,255,0.06)", }}>
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* input */}
                    <div className="flex-1"> <div className="group/input flex items-center gap-2.5 px-4 h-[48px] rounded-full border bg-white/5 border-white/10" style={{ outline: "none" }}> <SearchIcon size={18} className="opacity-70" /> <input value={searchLocal} onChange={(e) => setSearchLocal(e.target.value)} placeholder="Поиск" className="w-full bg-transparent placeholder-white/45 text-white/90 text-[15px] outline-none focus:outline-none focus-visible:outline-none [box-shadow:none]" aria-label="Поиск" /> {charactersLoading && <Loader2 size={18} className="animate-spin opacity-70" />} </div> </div>
                    {/* Кнопка Фильтры */}
                     <motion.button {...ANIM.buttonTap} onClick={() => setShowFilters((s) => !s)} className="relative inline-flex items-center justify-center w-[48px] h-[48px] rounded-full" style={{ background: showFilters ? `radial-gradient(90% 90% at 30% 15%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 35%, rgba(255,255,255,0) 60%), linear-gradient(135deg, #E9CCFF 0%, #FF6BD6 100%)` : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: showFilters ? "0 10px 26px rgba(255, 107, 214, 0.45)" : "inset 0 1px rgba(255,255,255,0.08)", color: "#fff", }} aria-pressed={showFilters} title="Фильтры" > <SlidersHorizontal size={18} /> {activeCount > 0 && !showFilters && ( <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white/20" style={{ background: "linear-gradient(135deg, #E9CCFF 0%, #FF6BD6 100%)" }} aria-label={`${activeCount} фильтров активно`} /> )} </motion.button>
                    {/* Кнопка Сброс */}
                    {activeCount > 0 && ( <> <motion.button {...ANIM.buttonTap} onClick={resetFilters} className="hidden sm:inline-flex items-center gap-2 px-5 h-[48px] rounded-full text-sm font-semibold" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.06))", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "inset 0 1px rgba(255,255,255,0.08)", }} title="Сбросить все фильтры" > <RotateCcw size={16} /> Сбросить ({activeCount}) </motion.button> <motion.button {...ANIM.buttonTap} onClick={resetFilters} className="sm:hidden inline-flex items-center justify-center w-[48px] h-[48px] rounded-full" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.06))", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "inset 0 1px rgba(255,255,255,0.08)", }} aria-label={`Сбросить ${activeCount} фильтров`} title={`Сбросить (${activeCount})`} > <RotateCcw size={18} /> </motion.button> </> )}
                </div>
            </GlassPanel>
        </motion.div>

        {/* --- Панель фильтров --- */}
        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div key="filters-panel" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }} className="mb-9" >
              <GlassPanel className="p-5 sm:p-6 lg:p-7 rounded-[26px] space-y-6" style={{ borderColor: "rgba(255,255,255,0.12)", boxShadow: "0 16px 40px rgba(0,0,0,0.25), inset 0 1px rgba(255,255,255,0.06)" }} >
                
                {/* --- Пол / Возраст / Сортировка (без изменений) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SectionCard> <div className="flex items-center justify-between gap-2 mb-3 text-white/80"> <div className="flex items-center gap-2"><Users size={16} className="opacity-80" /> <h4 className="text-sm uppercase tracking-wide font-bold">Пол</h4> </div> </div> <div className="flex flex-wrap gap-2.5"> <AccentChip accent="pink" label="Все" isActive={filters.gender === "all"} onClick={() => setFilters({ ...filters, gender: "all" })} /> <AccentChip accent="pink" label="Мужчины" isActive={filters.gender === "male"} onClick={() => setFilters({ ...filters, gender: "male" })} icon={Mars}/> <AccentChip accent="pink" label="Женщины" isActive={filters.gender === "female"} onClick={() => setFilters({ ...filters, gender: "female" })} icon={Venus}/> </div> </SectionCard>
                  <SectionCard> <div className="flex items-center justify-between gap-2 mb-3 text-white/80"> <div className="flex items-center gap-2"><Clock size={16} className="opacity-80" /> <h4 className="text-sm uppercase tracking-wide font-bold">Возраст</h4> </div> </div> <div className="flex flex-wrap gap-2.5"> <AccentChip accent="sky" label="Все" isActive={filters.ageGroup === "all"} onClick={() => setFilters({ ...filters, ageGroup: "all" })} /> <AccentChip accent="sky" label="18+" isActive={filters.ageGroup === "18+"} onClick={() => setFilters({ ...filters, ageGroup: "18+" })} icon={Cake}/> <AccentChip accent="sky" label="30+" isActive={filters.ageGroup === "30+"} onClick={() => setFilters({ ...filters, ageGroup: "30+" })} icon={Clock}/> <AccentChip accent="sky" label="Бессмертные" isActive={filters.ageGroup === "immortal"} onClick={() => setFilters({ ...filters, ageGroup: "immortal" })} icon={InfinityIcon}/> </div> </SectionCard>
                </div>
                <SectionCard> <div className="flex items-center justify-between gap-2 mb-3 text-white/80"> <div className="flex items-center gap-2"><ArrowUpDown size={16} className="opacity-80" /> <h4 className="text-sm uppercase tracking-wide font-bold">Сортировка</h4> </div> </div> <div className="flex flex-wrap gap-2.5"> <AccentChip accent="violet" label="Сначала новые" isActive={filters.sortBy === "newest"} onClick={() => setFilters({ ...filters, sortBy: "newest" })} icon={Clock}/> <AccentChip accent="violet" label="По рейтингу" isActive={filters.sortBy === "rating"} onClick={() => setFilters({ ...filters, sortBy: "rating" })} icon={Star}/> <AccentChip accent="violet" label="По имени (А-Я)" isActive={filters.sortBy === "name"} onClick={() => setFilters({ ...filters, sortBy: "name" })} icon={ArrowUpDown}/> </div> </SectionCard>

                {/* --- Категории (без изменений) --- */}
                {allCategories.length > 0 && (
                  <SectionCard>
                    <div className="flex items-center justify-between gap-2 mb-3 text-white/80">
                        <div className="flex items-center gap-2"><Layers size={16} className="opacity-80"/> <h4 className="text-sm uppercase tracking-wide font-bold">Категории</h4></div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2.5">
                        {sortedCategories.map((cat) => (
                            <TagFilterChip 
                              key={cat} 
                              tag={cat} 
                              status={getStatus("categories", cat)} 
                              onClick={() => cycleStatus("categories", cat)} 
                              size="large" 
                            />
                        ))}
                    </div>
                  </SectionCard>
                )}
                
                {/* --- БЛОК ТЕГОВ УДАЛЕН --- */}
                
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* --- Список карточек (без изменений) --- */}
        {charactersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 12 }).map((_, i) => <CharacterCardSkeleton key={i} />)}
          </div>
        ) : filteredCharacters.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <AnimatePresence>
              {filteredCharacters.map((c) => (
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