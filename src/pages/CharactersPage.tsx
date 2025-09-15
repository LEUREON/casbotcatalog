// project/src/pages/CharactersPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ThemedBackground from "../components/common/ThemedBackground";
import {
  Search,
  SlidersHorizontal,
  Frown,
  Users,
  Venus,
  Mars,
  CakeSlice,
  Infinity as InfinityIcon,
  Star,
  Clock,
  ArrowDownAZ,
  X,
  RotateCcw,
} from "lucide-react";

import { useData } from "../contexts/DataContext";
import { Character } from "../types";
import { CharacterCard } from "../components/Characters/CharacterCard";
import { CharacterCardSkeleton } from "../components/Characters/CharacterCardSkeleton"; 
import { useDebounce } from "../utils/useDebounce";

/* ===== UI TOKENS ===== */
const TOKENS = {
  border: "rgba(255,255,255,0.12)",
  itemBg: "rgba(255,255,255,0.04)",
  itemBgActive: "rgba(255,255,255,0.10)",
  accent: "#f7cfe1",
};

/* ===== Матовая панель ===== */
function MattePanel(
  props: React.PropsWithChildren<{ className?: string; border?: boolean }>
) {
  const { className = "", border = true, children } = props;
  return (
    <div
      className={[
        "rounded-2xl sm:rounded-3xl p-4 sm:p-6",
        "backdrop-blur-md bg-[rgba(255,255,255,0.04)]",
        border ? "border" : "",
        className,
      ].join(" ")}
      style={{
        borderColor: TOKENS.border,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {children}
    </div>
  );
}

/* ===== Чип фильтра ===== */
function FilterChip({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "group inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm",
        "transition-colors",
        "border",
      ].join(" ")}
      style={
        active
          ? {
              background: TOKENS.itemBgActive,
              borderColor: TOKENS.accent,
              color: "#fff",
              boxShadow: `0 0 0 1px ${TOKENS.accent} inset`,
            }
          : {
              background: TOKENS.itemBg,
              borderColor: TOKENS.border,
              color: "#d1d5db",
            }
      }
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{label}</span>
    </button>
  );
}

/* ===== Поисковая строка с кнопками ===== */
function SearchBar({
  value,
  onChange,
  onClear,
  onToggleFilters,
  filtersOpen,
  onReset,
  activeCount,
}: {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  onToggleFilters: () => void;
  filtersOpen: boolean;
  onReset: () => void;
  activeCount: number;
}) {
  const hasActive = activeCount > 0;
  return (
    <div className="relative">
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
      <input
        type="text"
        placeholder="Поиск..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-14 pl-12 pr-40 sm:pr-56 rounded-2xl text-white placeholder:text-slate-400 focus:outline-none"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${TOKENS.border}`,
        }}
      />

      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-2">
        {hasActive && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl text-sm"
            title="Сбросить все фильтры"
            aria-label="Сбросить все фильтры"
            style={{
              border: `1px solid ${TOKENS.border}`,
              background: TOKENS.itemBg,
              color: "#e5e7eb",
            }}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Сбросить</span>
          </button>
        )}

               <button
          onClick={onToggleFilters}
          aria-pressed={filtersOpen}
          className="relative inline-flex items-center gap-2 h-10 px-3.5 rounded-xl text-sm"
          style={
            filtersOpen
              ? {
                  background: TOKENS.itemBgActive,
                  border: `1px solid ${TOKENS.accent}`,
                  color: "#fff",
                  boxShadow: `0 0 0 1px ${TOKENS.accent} inset`,
                }
              : {
                  background: TOKENS.itemBg,
                  border: `1px solid ${TOKENS.border}`,
                  color: "#e5e7eb",
                }
          }
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Фильтры</span>
          {hasActive && (
            <span
              className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] leading-[18px] font-semibold text-black text-center"
              style={{ background: TOKENS.accent, border: `1px solid ${TOKENS.border}` }}
            >
              {activeCount > 9 ? "9+" : String(activeCount)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}



/* ===== Страница ===== */
export function CharactersPage() {
  const navigate = useNavigate();
  const { characters, filteredCharacters, filters, setFilters, charactersLoading } = useData();

  const [searchLocal, setSearchLocal] = useState(filters.search ?? "");
  const [showFilters, setShowFilters] = useState(false); // по умолчанию закрыты
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const debouncedSearch = useDebounce(searchLocal, 250);

  // дефолтные фильтры один раз
  useEffect(() => {
    const defaults = { search: "", gender: "all", ageGroup: "all", sortBy: "newest" as const };
    setFilters(defaults);
    setSearchLocal("");
    setSelectedTags([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ ...filters, search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    characters.forEach((c) => (c.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [characters]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const view = useMemo(() => {
    let list = filteredCharacters as Character[];
    if (selectedTags.length) {
      list = list.filter((c) => selectedTags.every((t) => (c.tags || []).includes(t)));
    }
    return list;
  }, [filteredCharacters, selectedTags]);

  const resultCount = view.length;

  // активные фильтры (newest не считаем активным)
  let activeCount = 0;
  if (filters.gender !== "all") activeCount++;
  if (filters.ageGroup !== "all") activeCount++;
  if (filters.sortBy !== "newest") activeCount++;
  if (searchLocal.trim()) activeCount++;
  activeCount += selectedTags.length;

  const resetFilters = () => {
    setFilters({ search: "", gender: "all", ageGroup: "all", sortBy: "newest" });
    setSelectedTags([]);
    setSearchLocal("");
  };

  // Уменьшенные отступы: ближе к краям, единая ширина для поиска/фильтров/сеток
  const containerCls = "mx-auto w-full max-w-none px-2 sm:px-3 lg:px-4";

  return (
    <div className="min-h-screen w-full relative">
      <ThemedBackground />

      <div className={`relative z-10 ${containerCls} py-3 lg:py-6`}>
        {/* Поиск — та же ширина, что и сетка карточек */}
        <MattePanel className="mb-3">
          <SearchBar
            value={searchLocal}
            onChange={setSearchLocal}
            onClear={() => setSearchLocal("")}
            onToggleFilters={() => setShowFilters((v) => !v)}
            filtersOpen={showFilters}
            onReset={resetFilters}
            activeCount={activeCount}
          />
        </MattePanel>

        {/* Фильтры — по умолчанию закрыты, при открытии совпадают по ширине с поиском/сеткой */}
        {showFilters ? (
          <MattePanel className="mb-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <div className="text-slate-300 text-xs uppercase tracking-wider mb-2">Пол</div>
                <div className="flex flex-wrap items-center gap-2">
                  <FilterChip icon={Users} label="Все" active={filters.gender === "all"} onClick={() => setFilters({ ...filters, gender: "all" })} />
                  <FilterChip icon={Mars} label="Муж" active={filters.gender === "male"} onClick={() => setFilters({ ...filters, gender: "male" })} />
                  <FilterChip icon={Venus} label="Жен" active={filters.gender === "female"} onClick={() => setFilters({ ...filters, gender: "female" })} />
                </div>
              </div>

              <div>
                <div className="text-slate-300 text-xs uppercase tracking-wider mb-2">Возраст</div>
                <div className="flex flex-wrap items-center gap-2">
                  <FilterChip icon={InfinityIcon} label="Все" active={filters.ageGroup === "all"} onClick={() => setFilters({ ...filters, ageGroup: "all" })} />
                  <FilterChip icon={CakeSlice} label="18+" active={filters.ageGroup === "18+"} onClick={() => setFilters({ ...filters, ageGroup: "18+" })} />
                  <FilterChip icon={Clock} label="45+" active={filters.ageGroup === "45+"} onClick={() => setFilters({ ...filters, ageGroup: "45+" })} />
                  <FilterChip icon={InfinityIcon} label="Бессмертные" active={filters.ageGroup === "immortal"} onClick={() => setFilters({ ...filters, ageGroup: "immortal" })} />
                </div>
              </div>

              <div>
                <div className="text-slate-300 text-xs uppercase tracking-wider mb-2">Сортировка</div>
                <div className="flex flex-wrap items-center gap-2">
                  <FilterChip icon={Star} label="Рейтинг" active={filters.sortBy === "rating"} onClick={() => setFilters({ ...filters, sortBy: "rating" })} />
                  <FilterChip icon={Clock} label="Сначала новые" active={filters.sortBy === "newest"} onClick={() => setFilters({ ...filters, sortBy: "newest" })} />
                  <FilterChip icon={ArrowDownAZ} label="По имени" active={filters.sortBy === "name"} onClick={() => setFilters({ ...filters, sortBy: "name" })} />
                </div>
              </div>
            </div>
          </MattePanel>
        ) : null}

        {/* Карточки — 1 / 2 / 3; маленькие боковые отступы */}
        {charactersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <CharacterCardSkeleton key={i} />
            ))}
          </div>
        ) : resultCount > 0 ? (
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5"
            >
              {view.map((c) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <CharacterCard character={c} onClick={() => navigate(`/characters/${c.id}`)} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <MattePanel className="text-center py-14">
            <div className="flex flex-col items-center justify-center">
              <Frown className="h-10 w-10 text-slate-400 mb-3" />
              <h3 className="text-white text-lg font-medium mb-1">Ничего не найдено</h3>
              <p className="text-slate-400 mb-6">Попробуйте изменить критерии поиска.</p>
              <button
                onClick={resetFilters}
                className="px-5 h-11 rounded-2xl font-medium"
                style={{ color: "#111", background: TOKENS.accent, border: `1px solid ${TOKENS.border}` }}
              >
                Сбросить фильтры
              </button>
            </div>
          </MattePanel>
        )}
      </div>
    </div>
  );
}

export default CharactersPage;