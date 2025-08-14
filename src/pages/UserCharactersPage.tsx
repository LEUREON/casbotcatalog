// project/src/pages/UserCharactersPage.tsx 

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, Frown, PlusCircle,
  Users, Venus, Mars, CakeSlice, Infinity, Star, Clock, ArrowDownAZ
} from 'lucide-react';
import { UserCharacter } from '../types';
import { useAuth } from '../contexts/AuthContext'; // <-- ИСПРАВЛЕННЫЙ ПУТЬ
import { CharacterCardSkeleton } from '../components/Characters/CharacterCardSkeleton';
import { useDebounce } from '../utils/useDebounce';
import { useUserCharacters } from '../contexts/UserCharactersContext';
import { CharacterCard } from '../components/Characters/CharacterCard';

type FilterButtonProps = {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  activeColorClass: string;
};

const FilterButton = ({ label, icon, isActive, onClick, activeColorClass }: FilterButtonProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 border
      ${isActive
        ? `${activeColorClass} text-white border-transparent shadow-lg`
        : 'text-slate-300 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      }`
    }
  >
    {icon}
    <span>{label}</span>
  </button>
);


export function UserCharactersPage() {
  const { filteredUserCharacters, filters, setFilters, loading: userCharactersLoading, loadUserCharacters } = useUserCharacters();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState(filters.search);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    setFilters({ ...filters, search: debouncedSearchTerm });
  }, [debouncedSearchTerm, setFilters]);

  useEffect(() => {
    if (!userCharactersLoading && filteredUserCharacters.length === 0) {
      loadUserCharacters();
    }
  }, [userCharactersLoading, filteredUserCharacters.length, loadUserCharacters]);

  const handleFilterChange = (filterName: string, value: string) => {
    if (filterName !== 'search') {
      setFilters({ ...filters, [filterName]: value });
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({ search: '', gender: 'all', ageGroup: 'all', sortBy: 'newest' });
  };
  
  const [filtersVisible, setFiltersVisible] = useState(false);

  const openCharacterPage = (character: UserCharacter) => {
    navigate(`/characters/${character.id}`);
  };

  const navigateToSubmitCharacter = () => {
    navigate('/submit-character');
  };

  return (
    <div className="min-h-screen relative p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass rounded-3xl p-4 sm:p-6 mb-8 border border-white/10"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
              <input
                type="text"
                placeholder="Найти персонажа..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-4 py-3 bg-slate-800/50 border border-transparent rounded-full text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
            </div>
            <button onClick={() => setFiltersVisible(!filtersVisible)} className="p-3 bg-slate-800/50 rounded-full text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors flex-shrink-0">
              <SlidersHorizontal className="h-5 w-5" />
            </button>
            {user && (
              <button
                onClick={navigateToSubmitCharacter}
                className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold hover:from-green-600 hover:to-emerald-600 transition-all flex-shrink-0"
              >
                <PlusCircle className="h-5 w-5" />
                <span>Предложить своего</span>
              </button>
            )}
          </div>

          <AnimatePresence>
            {filtersVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="border-t border-white/10 pt-4 mt-4 space-y-5">

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Пол</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <FilterButton label="Все" icon={<Users size={16} />} isActive={filters.gender === 'all'} onClick={() => handleFilterChange('gender', 'all')} activeColorClass="bg-slate-600" />
                      <FilterButton label="Мужчины" icon={<Mars size={16} />} isActive={filters.gender === 'male'} onClick={() => handleFilterChange('gender', 'male')} activeColorClass="bg-blue-600" />
                      <FilterButton label="Девушки" icon={<Venus size={16} />} isActive={filters.gender === 'female'} onClick={() => handleFilterChange('gender', 'female')} activeColorClass="bg-pink-600" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Возраст</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <FilterButton label="Все" icon={<Users size={16} />} isActive={filters.ageGroup === 'all'} onClick={() => handleFilterChange('ageGroup', 'all')} activeColorClass="bg-slate-600" />
                      <FilterButton label="18+" icon={<CakeSlice size={16} />} isActive={filters.ageGroup === '18+'} onClick={() => handleFilterChange('ageGroup', '18+')} activeColorClass="bg-green-600" />
                      <FilterButton label="45+" icon={<CakeSlice size={16} />} isActive={filters.ageGroup === '45+'} onClick={() => handleFilterChange('ageGroup', '45+')} activeColorClass="bg-teal-600" />
                      <FilterButton label="Бессмертные" icon={<Infinity size={16} />} isActive={filters.ageGroup === 'immortal'} onClick={() => handleFilterChange('ageGroup', 'immortal')} activeColorClass="bg-indigo-600" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Сортировка</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <FilterButton label="Стандартно" icon={<Clock size={16} />} isActive={filters.sortBy === 'newest'} onClick={() => handleFilterChange('sortBy', 'newest')} activeColorClass="bg-slate-600" />
                      <FilterButton label="По рейтингу" icon={<Star size={16} />} isActive={filters.sortBy === 'rating'} onClick={() => handleFilterChange('sortBy', 'rating')} activeColorClass="bg-yellow-600" />
                      <FilterButton label="По имени" icon={<ArrowDownAZ size={16} />} isActive={filters.sortBy === 'name'} onClick={() => handleFilterChange('sortBy', 'name')} activeColorClass="bg-sky-600" />
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {userCharactersLoading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <CharacterCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredUserCharacters.length > 0 ? (
          <motion.div
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            initial="hidden"
            animate="show"
          >
            {filteredUserCharacters.map((character) => (
              <motion.div
                key={character.id}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              >
                <CharacterCard character={character} onClick={openCharacterPage} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 glass rounded-3xl border border-white/10">
            <Frown className="h-24 w-24 text-slate-500 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-white mb-3">Персонажи не найдены</h3>
            <p className="text-slate-400 mb-8 text-lg">
              Попробуйте изменить критерии поиска.
            </p>
            <button
              onClick={resetFilters}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-2xl font-semibold hover:opacity-90 transition-opacity"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </div>
  );
}