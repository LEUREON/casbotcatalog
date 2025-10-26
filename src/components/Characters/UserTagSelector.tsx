// src/components/Characters/UserTagSelector.tsx
import React from 'react';
import { useData } from '../../contexts/DataContext';
import { FilterChip } from '../ui/FilterChip';
// 1. Tag и TagGroup больше не нужны
// import type { Tag, TagGroup } from '../../types';

interface UserTagSelectorProps {
  selectedTags: string[]; // Массив ИМЕН тегов (string[])
  onChange: (newTags: string[]) => void;
}

// 2. Стили для чипов, чтобы они соответствовали вашему glass-дизайну
const chipStyles = {
  base: "border border-white/10 bg-white/5 text-slate-300",
  active: "border-green-500/50 bg-green-500/20 text-green-200"
};

export const UserTagSelector: React.FC<UserTagSelectorProps> = ({ selectedTags, onChange }) => {
  // 3. Получаем `uniqueTags` (string[]) из контекста
  const { uniqueTags, loading } = useData();

  // 4. УДАЛЯЕМ useMemo(tagsByGroup)
  
  const handleTagClick = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-slate-400 text-sm">Загрузка тегов...</div>;
  }

  // 5. УДАЛЯЕМ sortedGroups

  return (
    <div className="space-y-4">
      {/* 6. Упрощаем рендеринг до одного блока */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-slate-400">
          Все доступные теги
        </h4>
        <div className="flex flex-wrap gap-2">
          {/* 7. Просто перебираем массив строк `uniqueTags` */}
          {uniqueTags.map((tag) => (
            <FilterChip
              key={tag}
              label={tag}
              isActive={selectedTags.includes(tag)}
              onClick={() => handleTagClick(tag)}
              // @ts-ignore (Передаем кастомные стили в FilterChip)
              customClasses={chipStyles} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};