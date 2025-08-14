// src/components/Layout/ScrollManager.tsx

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Эта строка будет прокручивать окно в самый верх
    // каждый раз, когда меняется URL
    window.scrollTo(0, 0);
  }, [pathname]);

  // Этот компонент не отображает ничего на странице
  return null;
}