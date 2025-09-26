// src/contexts/VirtualKeyboardContext.tsx
import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

export type VKLayout = 'alpha' | 'numeric';
type TargetEl = HTMLInputElement | HTMLTextAreaElement | null;

export interface VKState {
  visible: boolean;
  layout: VKLayout;
  locale: 'ru' | 'en';
  shift: boolean;
  target: TargetEl;
  open: (opts: { target: TargetEl; layout?: VKLayout; locale?: 'ru' | 'en' }) => void;
  close: () => void;
  insert: (text: string) => void;
  backspace: () => void;
  enter: () => void;
  toggleLocale: () => void;
  toggleShift: () => void;
}

const VirtualKeyboardContext = createContext<VKState | undefined>(undefined);

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const desc = Object.getOwnPropertyDescriptor(el, 'value');
  const prototype = Object.getPrototypeOf(el);
  const descProto = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (desc && desc.set) desc.set.call(el, value);
  else if (descProto && descProto.set) descProto.set.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

export function VirtualKeyboardProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [layout, setLayout] = useState<VKLayout>('alpha');
  const [locale, setLocale] = useState<'ru' | 'en'>('ru');
  const [shift, setShift] = useState(false);
  const [target, setTarget] = useState<TargetEl>(null);

  const close = useCallback(() => {
    if (target) (target as any).readOnly = false;
    setVisible(false);
    setTarget(null);
    setShift(false);
  }, [target]);

  const open = useCallback(({ target, layout = 'alpha', locale = 'ru' }: { target: TargetEl; layout?: VKLayout; locale?: 'ru' | 'en' }) => {
    if (!target) return;
    setTarget(target);
    (target as any).readOnly = true; // блокируем системную клавиатуру
    setLayout(layout);
    setLocale(locale);
    setVisible(true);
    setShift(false);
    try { target.focus(); } catch {}
  }, []);

  const insert = useCallback((text: string) => {
    if (!target) return;
    const el = target;
    const start = (el.selectionStart ?? el.value.length);
    const end = (el.selectionEnd ?? el.value.length);
    const next = el.value.slice(0, start) + text + el.value.slice(end);
    setNativeValue(el, next);
    const caret = start + text.length;
    try { el.setSelectionRange(caret, caret); } catch {}
    try { el.focus(); } catch {}
  }, [target]);

  const backspace = useCallback(() => {
    if (!target) return;
    const el = target;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    if (start === end && start === 0) return;
    const delStart = start === end ? Math.max(0, start - 1) : start;
    const next = el.value.slice(0, delStart) + el.value.slice(end);
    setNativeValue(el, next);
    const caret = delStart;
    try { el.setSelectionRange(caret, caret); } catch {}
    try { el.focus(); } catch {}
  }, [target]);

  const enter = useCallback(() => {
    if (!target) return;
    // триггерим Enter и закрываем
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true } as any));
    close();
  }, [target, close]);

  const toggleLocale = useCallback(() => setLocale(p => (p === 'ru' ? 'en' : 'ru')), []);
  const toggleShift = useCallback(() => setShift(p => !p), []);

  const value = useMemo(() => ({
    visible, layout, locale, shift, target,
    open, close, insert, backspace, enter, toggleLocale, toggleShift
  }), [visible, layout, locale, shift, target, open, close, insert, backspace, enter, toggleLocale, toggleShift]);

  return (
    <VirtualKeyboardContext.Provider value={value}>
      {children}
    </VirtualKeyboardContext.Provider>
  );
}

export function useVirtualKeyboardContext() {
  const ctx = useContext(VirtualKeyboardContext);
  if (!ctx) throw new Error('useVirtualKeyboardContext must be used inside VirtualKeyboardProvider');
  return ctx;
}
