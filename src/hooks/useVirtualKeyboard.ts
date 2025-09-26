// src/hooks/useVirtualKeyboard.ts
import { useCallback } from 'react';
import { useVirtualKeyboardContext, VKLayout } from '../contexts/VirtualKeyboardContext';

export function useVirtualKeyboard() {
  const vk = useVirtualKeyboardContext();

  const bindToInput = useCallback((opts?: { layout?: VKLayout; locale?: 'ru' | 'en' }) => ({
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      vk.open({ target: e.currentTarget, layout: opts?.layout, locale: opts?.locale });
    },
    onClick: (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      vk.open({ target: e.currentTarget as any, layout: opts?.layout, locale: opts?.locale });
    }
  }), [vk]);

  return { ...vk, bindToInput };
}
