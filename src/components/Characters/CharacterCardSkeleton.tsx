// project/src/components/Characters/CharacterCardSkeleton.tsx

import React from 'react';

export const CharacterCardSkeleton = () => {
  return (
    <div className="relative w-full max-w-sm mx-auto aspect-[3/4] rounded-[28px] overflow-hidden bg-white/5 p-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 rounded-full bg-white/10"></div>
          <div className="h-7 w-16 rounded-full bg-white/10"></div>
        </div>
        <div className="w-11 h-11 rounded-full bg-white/10"></div>
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="h-7 w-3/4 rounded-lg bg-white/10 mb-2"></div>
        <div className="h-5 w-1/2 rounded-lg bg-white/10 mb-3"></div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-24 rounded-full bg-white/10"></div>
          <div className="h-6 w-24 rounded-full bg-white/10"></div>
        </div>
        <div className="h-4 w-full rounded-lg bg-white/10 mb-1"></div>
        <div className="h-4 w-3/4 rounded-lg bg-white/10"></div>
      </div>
    </div>
  );
};