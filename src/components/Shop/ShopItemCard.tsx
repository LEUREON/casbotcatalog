// project/src/components/Shop/ShopItemCard.tsx
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { ShopItem } from '../../types';
import { motion } from 'framer-motion';

type ActionButton = {
  label: string;
  url: string;
};

export function ShopItemCard({ item }: { item: ShopItem }) {
  const actionButtons: ActionButton[] = Array.isArray(item.actionButtons) ? item.actionButtons : [];

  return (
    <div 
      className="relative w-full h-full flex flex-col rounded-2xl overflow-hidden shadow-lg border border-white/10"
      style={{
        background: "var(--bg-glass)",
        fontFamily: "var(--font-family-body)"
      }}
    >
      {/* Этот контейнер обеспечивает квадратную пропорцию для изображения */}
      <div className="relative w-full h-0" style={{ paddingTop: '100%' }}>
        <img
          src={item.image}
          alt={item.name}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div
          className="self-start mb-3 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: 'var(--badge-tag)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          {item.category}
        </div>
        
        <h3 className="text-xl font-bold text-text-primary mb-2">
          {item.name}
        </h3>
        
        <p className="text-text-secondary text-sm mb-4 line-clamp-3 flex-grow">
          {item.description}
        </p>

        <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-white">
                    {item.price} ₽
                </p>

                {/* Здесь рендерятся кастомные кнопки */}
                <div className="flex items-center gap-2">
                  {actionButtons.length > 0 && actionButtons.map((button) => (
                    <motion.a 
                      key={button.label}
                      href={button.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 px-4 py-2 rounded-full font-semibold text-sm"
                      style={{ background: 'var(--accent-primary)', color: 'var(--bg-dark)' }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        <span>{button.label}</span>
                    </motion.a>
                  ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}