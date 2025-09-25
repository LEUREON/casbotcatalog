// src/components/ui/SearchBar.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ANIM } from '../../lib/animations';
import { IconLoader, IconSearch, IconSliders } from '../ui/icons';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onToggleFilters: () => void;
  filtersOpen: boolean;
  activeCount: number;
  isLoading: boolean;
}

export const SearchBar = React.memo(
  ({ value, onChange, onToggleFilters, filtersOpen, activeCount, isLoading }: SearchBarProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasActiveFilters = activeCount > 0;

    return (
      <div className="relative">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted">
          <IconSearch size={20} />
        </div>
        <input
          type="text"
          placeholder="Поиск"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full h-14 pl-14 pr-36 sm:pr-40 rounded-lg bg-transparent border focus:outline-none transition-all duration-300"
          style={{
            borderColor: isFocused ? 'var(--accent-primary)' : 'var(--border-color)',
            boxShadow: isFocused ? '0 0 0 3px rgba(var(--accent-primary-rgb), 0.2)' : 'none',
          }}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && <IconLoader />}
          <motion.button
            {...ANIM.buttonTap}
            onClick={onToggleFilters}
            aria-pressed={filtersOpen}
            className={`inline-flex items-center gap-2 h-10 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
              filtersOpen
                ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-button'
                : 'bg-badge-tag text-text-secondary border border-default hover:bg-glass-hover'
            }`}
          >
            <IconSliders size={16} />
            <span className="hidden sm:inline">Фильтры</span>
            {hasActiveFilters && (
              <span className="ml-1 min-w-[20px] h-[20px] px-1.5 rounded-full text-xs font-bold text-dark bg-accent-primary flex items-center justify-center">
                {activeCount > 9 ? "9+" : String(activeCount)}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";