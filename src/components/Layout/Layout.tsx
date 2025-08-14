// project/src/components/Layout/Layout.tsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNavigation } from './MobileNavigation';

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    // ▼▼▼ ИЗМЕНЕНИЕ: Убран класс bg-background-primary ▼▼▼
    <div className="relative min-h-screen lg:flex text-text-primary font-sans">
      <Sidebar isCollapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      
      <main className={`relative z-10 flex-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <div className="pb-28 lg:pb-8">
            <Outlet />
        </div>
      </main>

      <MobileNavigation />
    </div>
  );
}