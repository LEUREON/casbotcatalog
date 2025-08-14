// project/src/components/Shop/ShopItemCard.tsx

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { ShopItem } from '../../types';

interface ShopItemCardProps {
  item: ShopItem;
}

export function ShopItemCard({ item }: ShopItemCardProps) {
  return (
    <div className="glass rounded-3xl overflow-hidden border border-white/10 h-full flex flex-col">
      <div className="relative w-full aspect-square">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <span className="px-3 py-1 bg-white/5 text-pink-300 text-xs font-bold rounded-full border border-white/10 self-start mb-3">
          {item.category}
        </span>
        
        <h3 className="text-xl font-bold text-white mb-2 flex-grow">
          {item.name}
        </h3>
        
        <p className="text-slate-400 text-sm mb-4 line-clamp-3">
          {item.description}
        </p>

        <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-white">
                    {item.price} ₽
                </p>
                <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Купить</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}