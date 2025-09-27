import React, { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

const BADGE_CLS = "flex items-center bg-[var(--badge-tag)] text-white px-3 py-1 rounded-full text-sm font-medium";
const SUGGESTION_BTN_CLS = "px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs hover:bg-[var(--accent-primary)] hover:text-black transition-colors";

export const TagInput: React.FC<TagInputProps> = ({ value, onChange, placeholder, suggestions = [] }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    const newTag = inputValue.trim();
    if (newTag && !value.includes(newTag)) {
      onChange([...value, newTag]);
      setInputValue('');
    }
  };

  const addSuggestedTag = (tag: string) => {
    if (!value.includes(tag)) {
      onChange([...value, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Фильтруем подсказки: если есть ввод - по совпадению, если нет - показываем все
  const availableSuggestions = useMemo(() => {
    const lowercasedInput = inputValue.toLowerCase();
    return suggestions.filter(s => 
      !value.includes(s) && (lowercasedInput ? s.toLowerCase().startsWith(lowercasedInput) : true)
    );
  }, [suggestions, value, inputValue]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3 min-h-[30px]">
        <AnimatePresence>
          {value.map(tag => (
            <motion.div
              key={tag}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={BADGE_CLS}
            >
              <span>{tag}</span>
              <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 text-white/70 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Добавьте тег..."}
          className="flex-grow bg-transparent border-b-2 border-white/20 focus:border-[var(--accent-primary)] outline-none py-2 transition-colors"
        />
        <button type="button" onClick={handleAddTag} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <Plus size={20} />
        </button>
      </div>
      
      {/* ✅ ИСПРАВЛЕНО УСЛОВИЕ: Показываем блок, если есть доступные подсказки */}
      {availableSuggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
            <AnimatePresence>
              {availableSuggestions.slice(0, 25).map(suggestion => ( // Ограничиваем до 25 подсказок
                <motion.button
                  key={suggestion}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  type="button"
                  onClick={() => addSuggestedTag(suggestion)}
                  className={SUGGESTION_BTN_CLS}
                >
                  {suggestion}
                </motion.button>
              ))}
            </AnimatePresence>
        </div>
      )}
    </div>
  );
};