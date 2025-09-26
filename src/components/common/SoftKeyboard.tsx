// src/components/common/SoftKeyboard.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useVirtualKeyboardContext } from '../../contexts/VirtualKeyboardContext';

export default function SoftKeyboard() {
  const vk = useVirtualKeyboardContext();
  if (typeof window === 'undefined') return null;

  const isAlpha = vk.layout === 'alpha';
  const isRu = vk.locale === 'ru';

  const rowsEN = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['⇧','z','x','c','v','b','n','m','⌫'],
    ['123','🌐','space','enter']
  ];
  const rowsRU = [
    ['й','ц','у','к','е','н','г','ш','щ','з'],
    ['ф','ы','в','а','п','р','о','л','д'],
    ['⇧','я','ч','с','м','и','т','ь','⌫'],
    ['123','🌐','space','enter']
  ];
  const rowsNUM = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['⌫','0','enter']
  ];

  const rows = isAlpha ? (isRu ? rowsRU : rowsEN) : rowsNUM;

  const onKey = (key: string) => {
    if (key === '⌫') return vk.backspace();
    if (key === 'enter') return vk.enter();
    if (key === '⇧') return vk.toggleShift();
    if (key === '🌐') return vk.toggleLocale();
    if (key === '123') return (vk as any).layout === 'alpha' ? (vk as any).layout = 'numeric' : (vk as any).layout = 'alpha';
    if (key === 'space') return vk.insert(' ');
    const chr = vk.shift ? key.toUpperCase() : key;
    vk.insert(chr);
  };

  const panel = (
    <AnimatePresence>
      {vk.visible && (
        <motion.div
          initial={{ y: 36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 36, opacity: 0 }}
          transition={{ duration: 0.28 }}
          className="fixed left-0 right-0 z-[1005]"
          style={{ top: 'calc(100dvh - var(--softkbd-h, 280px))' }}
        >
          <div className="mx-auto max-w-[820px] px-3 pb-3">
            <div
              className="w-full rounded-2xl border backdrop-blur-xl"
              style={{
                background: 'rgba(8, 10, 18, 0.6)',
                borderColor: 'rgba(255,255,255,0.08)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
              }}
            >
              <div className="p-2 select-none">
                {rows.map((row, i) => (
                  <div key={i} className="flex gap-2 mb-2 last:mb-0 justify-center">
                    {row.map((k) => (
                      <button
                        key={k}
                        onClick={() => onKey(k)}
                        className="px-3 py-3 rounded-xl border text-base font-medium active:scale-[0.98] transition-transform"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          borderColor: 'rgba(255,255,255,0.12)',
                        }}
                      >
                        {k === 'space' ? 'Пробел' : k}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(panel, document.body);
}
