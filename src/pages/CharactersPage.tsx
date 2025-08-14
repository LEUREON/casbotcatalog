// project/src/pages/CharactersPage.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { CharacterCard } from '../components/Characters/CharacterCard';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, Frown, X,
  Users, Venus, Mars, Shield, Star, Clock, ArrowDownAZ, Cake, Infinity
} from 'lucide-react';
import { Character } from '../types';
import { CharacterCardSkeleton } from '../components/Characters/CharacterCardSkeleton';
import { useDebounce } from '../utils/useDebounce';
import NeonBackground from '../components/ui/NeonBackground';

/* ---------- Вспомогательные компоненты (можно не менять) ---------- */
type TileButtonProps = { icon: React.ElementType; label: string; active?: boolean; onClick?: () => void; };
const TileButton: React.FC<TileButtonProps> = ({ icon: Icon, label, active, onClick }) => ( <button onClick={onClick} className={['w-full flex items-center gap-3 px-5 py-4 rounded-2xl', 'border transition-all bg-white/[0.05]', active ? 'border-neon shadow-[0_0_0_2px_rgba(180,255,0,0.25)] text-white' : 'border-white/10 text-slate-300 hover:bg-white/[0.08]'].join(' ')} > <span className={['inline-flex h-9 w-9 items-center justify-center rounded-full border', active ? 'border-neon/70 bg-neon/10 text-neon' : 'border-white/10 bg-white/5 text-slate-300'].join(' ')}> <Icon size={18} strokeWidth={2.5} /> </span> <span className="font-semibold">{label}</span> </button> );
type SearchBarProps = { value: string; onChange: (v: string) => void; onClear: () => void; onToggleFilters: () => void; };
const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onClear, onToggleFilters }) => ( <div className="flex items-center gap-3"> <div className={['relative flex-1 rounded-full', 'bg-[rgba(0,0,0,.25)] border border-white/10', 'focus-within:ring-2 focus-within:ring-neon/60 focus-within:border-transparent', 'transition-all'].join(' ')} > <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-textSecondary" /> <input type="text" placeholder="Найти персонажа..." value={value} onChange={(e) => onChange(e.target.value)} className="w-full pl-14 pr-12 py-3.5 bg-transparent rounded-full text-white placeholder-textSecondary focus:outline-none" /> {value && ( <button aria-label="Очистить поиск" onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/10" > <X className="h-4 w-4 text-slate-300" /> </button> )} </div> <button onClick={onToggleFilters} className="p-3 rounded-full bg-[rgba(0,0,0,.25)] border border-white/10 hover:bg-white/10 transition-colors" aria-label="Открыть фильтры" > <SlidersHorizontal className="h-5 w-5 text-textSecondary" /> </button> </div> );


export function CharactersPage() {
  const { filteredCharacters, filters, setFilters, loading } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [bgAccent, setBgAccent] = useState<string>('rgb(100, 116, 139)');
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setFilters({ ...filters, search: debouncedSearchTerm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]);

  const handleFilterChange = (filterName: string, value: string) => setFilters({ ...filters, [filterName]: value });
  const resetFilters = () => { setSearchTerm(''); setFilters({ search: '', gender: 'all', ageGroup: 'all', sortBy: 'newest' }); };
  const [filtersVisible, setFiltersVisible] = useState(false);
  const openCharacterPage = (character: Character) => navigate(`/characters/${character.id}`);
  const hasActiveFilters = useMemo(() => filters.gender !== 'all' || filters.ageGroup !== 'all' || filters.sortBy !== 'newest' || !!filters.search, [filters]);

  useEffect(() => {
    if (loading || !gridRef.current) return;
    const cards = Array.from(gridRef.current.querySelectorAll<HTMLElement>('[data-character-id]'));
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const topEntry = entries.find(entry => entry.isIntersecting);
        if (topEntry) {
          const card = topEntry.target as HTMLElement;
          const color = card.dataset.dominantColor;
          // Используем цвет, если он есть, иначе ставим запасной
          if (color) {
            setBgAccent(color);
          } else {
            setBgAccent('rgb(100, 116, 139)');
          }
        }
      },
      {
        root: null,
        rootMargin: "-40% 0px -40% 0px", // Срабатывать, когда карточка в центральной части экрана
        threshold: 0,
      }
    );

    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [loading, filteredCharacters]);

  return (
    <div className="min-h-screen relative p-4 sm:p-6 lg:p-8 pb-[calc(24px+env(safe-area-inset-bottom))] overflow-visible">
      <NeonBackground accent={bgAccent} />
      <div className="max-w-screen-xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glass rounded-3xl p-4 sm:p-6 mb-6 border border-[rgba(255,255,255,.08)]" >
          <SearchBar value={searchTerm} onChange={setSearchTerm} onClear={() => setSearchTerm('')} onToggleFilters={() => setFiltersVisible((v) => !v)} />
          <AnimatePresence> {hasActiveFilters && ( <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: '1rem' }} exit={{ height: 0, opacity: 0, marginTop: 0 }} className="overflow-hidden" > <div className="flex flex-wrap items-center gap-2 pt-3"> {filters.search && ( <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-200 text-sm"> Поиск: <b className="text-white">{filters.search}</b> </span> )} {filters.gender !== 'all' && ( <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-200 text-sm"> Пол: <b className="text-white">{filters.gender === 'male' ? 'Мужчины' : 'Девушки'}</b> </span> )} {filters.ageGroup !== 'all' && ( <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-200 text-sm"> Возраст: <b className="text-white">{filters.ageGroup}</b> </span> )} {filters.sortBy !== 'newest' && ( <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-200 text-sm"> Сортировка: <b className="text-white">{filters.sortBy}</b> </span> )} <button onClick={resetFilters} className="ml-auto px-4 py-2 rounded-full bg-neon text-black text-sm font-semibold hover:opacity-90 transition-opacity" > Сбросить всё </button> </div> </motion.div> )} </AnimatePresence>
          <AnimatePresence> {filtersVisible && ( <motion.div initial={{ height: 0, opacity: 0, marginTop: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: '1.25rem' }} exit={{ height: 0, opacity: 0, marginTop: 0 }} transition={{ duration: 0.28, ease: 'easeInOut' }} className="overflow-visible" > <div className="pt-5 space-y-6 border-t border-[rgba(255,255,255,.08)]"> <div> <h4 className="text-xs font-bold text-textSecondary uppercase mb-3 px-1">Пол</h4> <div className="grid grid-cols-1 gap-3"> <TileButton icon={Users} label="Все" active={filters.gender === 'all'} onClick={() => handleFilterChange('gender', 'all')} /> <TileButton icon={Mars} label="Мужчины" active={filters.gender === 'male'} onClick={() => handleFilterChange('gender', 'male')} /> <TileButton icon={Venus} label="Девушки" active={filters.gender === 'female'} onClick={() => handleFilterChange('gender', 'female')} /> </div> </div> <div className="border-t border-white/10 pt-6"> <h4 className="text-xs font-bold text-textSecondary uppercase mb-3 px-1">Возраст</h4> <div className="grid grid-cols-1 gap-3"> <TileButton icon={Users} label="Все" active={filters.ageGroup === 'all'} onClick={() => handleFilterChange('ageGroup', 'all')} /> <TileButton icon={Cake} label="18+" active={filters.ageGroup === '18+'} onClick={() => handleFilterChange('ageGroup', '18+')} /> <TileButton icon={Shield} label="45+" active={filters.ageGroup === '45+'} onClick={() => handleFilterChange('ageGroup', '45+')} /> <TileButton icon={Infinity} label="Бессмертные" active={filters.ageGroup === 'immortal'} onClick={() => handleFilterChange('ageGroup', 'immortal')} /> </div> </div> <div className="border-t border-white/10 pt-6"> <h4 className="text-xs font-bold text-textSecondary uppercase mb-3 px-1">Сортировка</h4> <div className="grid grid-cols-1 gap-3"> <TileButton icon={Clock} label="Новые" active={filters.sortBy === 'newest'} onClick={() => handleFilterChange('sortBy', 'newest')} /> <TileButton icon={Star} label="Рейтинг" active={filters.sortBy === 'rating'} onClick={() => handleFilterChange('sortBy', 'rating')} /> <TileButton icon={ArrowDownAZ} label="Имя" active={filters.sortBy === 'name'} onClick={() => handleFilterChange('sortBy', 'name')} /> </div> </div> </div> </motion.div> )} </AnimatePresence>
        </motion.div>

        {loading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => <CharacterCardSkeleton key={i} />)}
          </div>
        ) : filteredCharacters.length > 0 ? (
          <div ref={gridRef} className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {filteredCharacters.map((character) => (
              <div 
                key={character.id} 
                data-character-id={character.id}
                data-dominant-color={character.dominantColor}
              >
                <CharacterCard character={character} onClick={() => openCharacterPage(character)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 glass rounded-3xl border border-white/10">
            <Frown className="h-24 w-24 text-slate-500 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-white mb-3">Персонажи не найдены</h3>
            <p className="text-slate-400 mb-8 text-lg">Попробуйте изменить критерии поиска.</p>
            <button onClick={resetFilters} className="px-8 py-4 bg-neon text-black rounded-2xl font-semibold hover:opacity-90 transition-opacity" > Сбросить фильтры </button>
          </div>
        )}
      </div>
    </div>
  );
}