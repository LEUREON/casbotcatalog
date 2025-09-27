import React from 'react';

interface TagBadgeProps {
  text: string;
  isCategory?: boolean;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ text, isCategory }) => {
  const colorClass = isCategory
    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
    : 'bg-teal-500/10 text-teal-300 border border-teal-500/10';

  return (
    // ✅ ИЗМЕНЕНИЕ: Убраны иконки, увеличены отступы (px-3 py-1) и размер шрифта (text-sm)
    <div
      className={`px-3 py-1 rounded-full text-sm font-bold ${colorClass}`}
    >
      {text}
    </div> 
  );
};