// project/src/components/Layout/Layout.tsx
import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation"; 
import ThemedBackground from "../common/ThemedBackground";

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { pathname } = useLocation();

  // На /characters отключаем общий фон Layout (и его затемнение)
  const isCharacters = pathname.startsWith("/characters");

  return (
    <div
      className={[
        "relative min-h-screen",
        isCharacters ? "bg-transparent" : "bg-[#0e1116]",
      ].join(" ")}
    >
      {/* Общий фон приложения (кроме страницы персонажей) */}
      {!isCharacters && <ThemedBackground intensity={0.9} animated />}

      {/* Левый сайдбар (десктоп) */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Контент */}
      <main
        className={[
          "relative z-10 max-w-[2000px] mx-auto",
          "pt-4 lg:pt-6 px-4 sm:px-6",
          sidebarCollapsed ? "lg:pl-24" : "lg:pl-72",
        ].join(" ")}
      >
        {/* Отступ снизу под мобильную док-панель */}
        <div className="pb-8">
          <Outlet />
        </div>
      </main>

      {/* Мобильная навигация */}
      <MobileNavigation />
    </div>
  );
}
