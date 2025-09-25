// src/pages/ShopPage.tsx
import React, { useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ShopItemCard } from '../components/Shop/ShopItemCard';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CharacterCardSkeleton } from '../components/Characters/CharacterCardSkeleton';
import ThemedBackground from '../components/common/ThemedBackground';
import { ANIM } from '../lib/animations';
import { GlassPanel } from '../components/ui/GlassPanel';

export function ShopPage() {
  const { shopItems, loadShopItems, shopItemsLoading } = useData();
  
  const { scrollY } = useScroll();
  const bgIntensity = useTransform(scrollY, [0, 500], [0.3, 0.1]);

  useEffect(() => {
    if (shopItems.length === 0) {
      loadShopItems();
    }
  }, [loadShopItems, shopItems.length]);

  const activeItems = shopItems.filter(item => item.isActive);

  return (
    <div 
      className="min-h-screen w-full relative"
      style={{ 
        fontFamily: "var(--font-family-body)", 
        backgroundColor: "var(--bg-dark)", 
        color: "var(--text-primary)" 
      }}
    >
      <ThemedBackground intensity={bgIntensity} />
      <div className="relative z-10 mx-auto w-full max-w-none px-2 sm:px-3 lg:px-4 py-4 lg:py-8">
        
        <motion.div {...ANIM.fadeInUp(0.1)} className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight" style={{ background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", color: "transparent", fontFamily: "var(--font-family-heading)", textShadow: "0 4px 12px rgba(0,0,0,0.2)"}}>
            🛒 Магазин
          </h1>
          <p className="mt-2 text-base sm:text-lg" style={{ color: "var(--text-muted)" }}>
            Товары и услуги
          </p>
        </motion.div>

        {shopItemsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => <CharacterCardSkeleton key={i} />)}
          </div>
        ) : activeItems.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            initial="hidden"
            animate="show"
          >
            {activeItems.map((item) => (
              <motion.div
                key={item.id}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
              >
                <ShopItemCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <GlassPanel className="text-center py-16">
            <motion.div {...ANIM.float} className="w-16 h-16 mx-auto mb-6 text-text-muted">
                <ShoppingBag size={40} />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Магазин временно пуст
            </h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Скоро здесь появятся удивительные товары и услуги.
            </p>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}