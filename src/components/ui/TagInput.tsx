// src/components/ui/TagInput.tsx
import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INPUT_CLS = "w-full rounded-lg px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all";
const BUTTON_SECONDARY_CLS = "flex items-center justify-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-white/10 border border-white/20 text-text-secondary hover:bg-white/20 transition-all";

type TagInputProps = {
  // Все уникальные теги в системе
  allTags: string[];
  // Теги, уже присвоенные этому персонажу
  selectedTags: string[];
  // Функция для обновления тегов у родительского компонента
  onChange: (newTags: string[]) => void;
};

export const TagInput = ({ allTags, selectedTags, onChange }: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const suggestions = useMemo(() => {
    if (!inputValue) return [];
    const lowercasedInput = inputValue.toLowerCase();
    
    // Показываем только те теги, которые еще не выбраны
    return allTags
      .filter(tag => !selectedTags.includes(tag) && tag.toLowerCase().includes(lowercasedInput))
      .slice(0, 5); // Ограничиваем количество подсказок
  }, [inputValue, allTags, selectedTags]);

  const addTag = (tagToAdd: string) => {
    const trimmedTag = tagToAdd.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      onChange([...selectedTags, trimmedTag]);
    }
    setInputValue(''); // Очищаем поле ввода после добавления
  };

  const removeTag = (tagToRemove: string) => {
    onChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map(tag => (
          <motion.div
            key={tag}
            layout
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
            style={{ borderColor: 'var(--border-color)', background: "rgba(255,255,255,0.05)" }}
          >
            {tag}
            <button
              type="button"
              aria-label={`Удалить тег ${tag}`}
              onClick={() => removeTag(tag)}
              className="p-0.5 opacity-80 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Добавить тег..."
                className={INPUT_CLS}
            />
            <AnimatePresence>
                {suggestions.length > 0 && (
                <motion.ul
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full mt-1 bg-dark border border-white/20 rounded-lg shadow-lg overflow-hidden"
                >
                    {suggestions.map(suggestion => (
                    <li
                        key={suggestion}
                        onMouseDown={(e) => { e.preventDefault(); addTag(suggestion); }}
                        className="px-4 py-2 cursor-pointer hover:bg-white/10"
                    >
                        {suggestion}
                    </li>
                    ))}
                </motion.ul>
                )}
            </AnimatePresence>
        </div>
        <button type="button" onClick={() => addTag(inputValue)} className={BUTTON_SECONDARY_CLS}>
          Добавить
        </button>
      </div>
    </div>
  );
};