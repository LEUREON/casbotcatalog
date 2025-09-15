// project/src/components/Shop/ShopItemCard.tsx

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { ShopItem } from '../../types';

const TOKENS = {
  border: "rgba(255,255,255,0.16)",
  itemBg: "rgba(255,255,255,0.08)",
  itemBgActive: "rgba(255,255,255,0.12)",
  accent: "#f7cfe1",
};

// Тип для наших кнопок из JSON
type ActionButton = {
  label: string;
  url: string;
};

export function ShopItemCard({ item }: { item: ShopItem }) {
  
  // Проверяем, являются ли actionButtons массивом
  const actionButtons: ActionButton[] = Array.isArray(item.actionButtons) ? item.actionButtons : [];

  return (
    <div 
      className="rounded-3xl overflow-hidden border h-full flex flex-col transition-shadow duration-300 hover:shadow-2xl"
      style={{
        backgroundColor: TOKENS.itemBg,
        borderColor: TOKENS.border,
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div className="relative w-full aspect-square bg-black/20">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div
          className="self-start mb-3 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: TOKENS.itemBgActive,
            color: '#fff',
            border: `1px solid ${TOKENS.border}`,
          }}
        >
          {item.category}
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2 flex-grow">
          {item.name}
        </h3>
        
        <p className="text-slate-400 text-sm mb-4 line-clamp-3">
          {item.description}
        </p>

        <div className="mt-auto pt-4 border-t" style={{ borderColor: TOKENS.border }}>
            <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-white">
                    {item.price} ₽
                </p>

                {/* Оборачиваем в div (для flex-gap) и рендерим кнопки из массива JSON */}
                <div className="flex items-center gap-2">
                  {actionButtons.length > 0 && actionButtons.map((button) => (
                    <a 
                      key={button.label}
                      href={button.url}
                      target="_blank" // Открываем в новой вкладке
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-transform hover:scale-105 active:scale-95"
                      style={{ background: TOKENS.accent, color: '#111' }}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        <span>{button.label}</span>
                    </a>
                  ))}
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}