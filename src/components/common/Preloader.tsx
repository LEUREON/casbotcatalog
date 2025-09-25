// src/components/common/Preloader.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemedBackground from './ThemedBackground';

const Preloader: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-center"
        >
          <ThemedBackground intensity={1} animated />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center"
          >
            <img 
              src="/icons/icon-192x192.png" 
              alt="CAS Каталог"
              className="w-24 h-24 mx-auto mb-4"
            />
            <h1 
              className="text-3xl font-black"
              style={{
                background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: `"Geist", "Inter", system-ui, sans-serif`,
              }}
            >
              CAS Каталог
            </h1>
            <p className="text-slate-400 mt-2">Загрузка данных...</p>
          </motion.div>

          <motion.div 
            className="w-full max-w-xs h-1 bg-white/10 rounded-full mt-8 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.div 
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #d7aefb, #ff6bd6)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ 
                duration: 1.5, 
                ease: "easeInOut", 
                repeat: Infinity, 
                repeatType: "loop"
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;