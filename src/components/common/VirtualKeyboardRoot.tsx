// src/components/common/VirtualKeyboardRoot.tsx
import React from 'react';
import { VirtualKeyboardProvider } from '../../contexts/VirtualKeyboardContext';
import SoftKeyboard from './SoftKeyboard';

export default function VirtualKeyboardRoot({ children }: React.PropsWithChildren) {
  return (
    <VirtualKeyboardProvider>
      {children}
      <SoftKeyboard />
    </VirtualKeyboardProvider>
  );
}
