// project/src/pages/ShopPage.tsx

import React, { useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ShopItemCard } from '../components/Shop/ShopItemCard';
import { motion } from 'framer-motion';
import { CharacterCardSkeleton } from '../components/Characters/CharacterCardSkeleton';

export function ShopPage() {
  const { shopItems, loadShopItems, shopItemsLoading } = useData();

  useEffect(() => {
    if (shopItems.length === 0) {
      loadShopItems();
    }
  }, [loadShopItems, shopItems.length]);

  const activeItems = shopItems.filter(item => item.isActive);

  return (
    <div className="min-h-screen p-2 sm:p-4">
      <div className="mb-6">
        <div className="relative glass rounded-3xl p-6 border border-pink-400/20">
            <div className="flex items-center space-x-4">
                <div className="relative p-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl border border-white/20 shadow-lg">
                    <ShoppingBag className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                        Магазин
                    </h1>
                    <p className="text-slate-400">Премиум товары и услуги</p>
                </div>
            </div>
        </div>
      </div>

        {shopItemsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <CharacterCardSkeleton key={i} />)}
            </div>
        ) : activeItems.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            initial="hidden"
            animate="show"
          >
            {activeItems.map((item) => (
              <motion.div
                key={item.id}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className="h-full"
              >
                <ShopItemCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div 
            className="text-center py-16 lg:py-24 rounded-3xl border"
            style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)"}}
          >
              <ShoppingBag className="h-16 w-16 text-slate-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-3">
                Магазин временно пуст
              </h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Скоро здесь появятся удивительные товары и услуги.
              </p>
          </div>
        )}
    </div>
  );
}