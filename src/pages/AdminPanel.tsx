// project/src/pages/AdminPanel.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  ShoppingBag,
  MessageSquare,
  User,
  File,
  Mail,
  Shield,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { AdminCharacters } from "../components/Admin/AdminCharacters";
import { AdminUsers } from "../components/Admin/AdminUsers";
import { AdminShop } from "../components/Admin/AdminShop";
import { AdminFiles } from "../components/Admin/AdminFiles";
import { AdminBroadcast } from "../components/Admin/AdminBroadcast";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import ThemedBackground from "../components/common/ThemedBackground";

// === 🎨 ЕДИНАЯ ДИЗАЙН-СИСТЕМА (СИНХРОНИЗИРОВАНА С CharacterPage.tsx) ===
const DESIGN = {
  colors: {
    text: {
      primary: "#ffffff",
      secondary: "#e0e0e0",
      muted: "#b0b0b0",
      accent: "#d7aefb",
    },
    background: {
      glass: "rgba(40, 40, 50, 0.65)",
      glassHover: "rgba(50, 50, 65, 0.8)",
      floating: "rgba(30, 30, 40, 0.8)",
      dark: "#121218",
      item: "rgba(255,255,255,0.04)",
      reply: "rgba(35, 25, 55, 0.7)",
    },
    border: "rgba(255, 255, 255, 0.08)",
    accent: {
      primary: "#d7aefb",
      secondary: "#ff6bd6",
      tertiary: "#8a75ff",
      glow: "rgba(215, 174, 251, 0.4)",
    },
    star: {
      filled: "#FFD700",
      glow: "rgba(255, 215, 0, 0.6)",
    },
    badges: {
      male: "#87cefa",
      female: "#ffb6c1",
      age: "#dda0dd",
      immortal: "#ffd700",
      tag: "rgba(255, 255, 255, 0.08)",
    },
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  radius: {
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    full: "9999px",
  },
  shadows: {
    glass: "0 8px 32px rgba(0, 0, 0, 0.35)",
    glassHover: "0 12px 40px rgba(0, 0, 0, 0.4)",
    accent: "0 4px 16px rgba(215, 174, 251, 0.4)",
    starGlow: "0 0 12px rgba(255, 215, 0, 0.5)",
    button: "0 6px 20px rgba(255, 107, 214, 0.3)",
    buttonHover: "0 8px 24px rgba(255, 107, 214, 0.4)",
  },
  fonts: {
    heading: `"Geist", "Inter", system-ui, sans-serif`,
    body: `"Geist", "Inter", system-ui, sans-serif`,
  },
  transitions: {
    quick: "0.2s ease",
    smooth: "0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
    spring: { type: "spring", stiffness: 400, damping: 25 } as const,
  },
};

// === 🎭 АНИМАЦИОННЫЕ ПРЕСЕТЫ (СИНХРОНИЗИРОВАНЫ С CharacterPage.tsx) ===
const ANIM = {
  fadeInUp: (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay },
  }),
  fadeInStagger: {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
  },
  buttonTap: {
    whileTap: { scale: 0.97 },
  },
  buttonPulse: {
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 0.4, ease: "easeInOut" },
  },
  float: {
    animate: { y: [0, -8, 0] },
    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" },
  },
};

type TabId =
  | "characters"
  | "users"
  | "shop"
  | "messages"
  | "broadcast"
  | "files";

export function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { users, characters } = useData();

  const initialTab = (new URLSearchParams(location.search).get("tab") ||
    "characters") as TabId;
  const [active, setActive] = useState<TabId>(initialTab);

  // Параллакс для фона
  const { scrollY } = useScroll();
  const bgIntensity = useTransform(scrollY, [0, 500], [0.3, 0.1]);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    sp.set("tab", active);
    navigate({ search: sp.toString() }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [active, location.search, navigate]);

  const tabs = useMemo(
    () => [
      { id: "characters", label: "Персонажи", icon: User },
      { id: "users", label: "Пользователи", icon: Users },
      { id: "shop", label: "Магазин", icon: ShoppingBag },
      { id: "broadcast", label: "Объявления", icon: Mail },
      { id: "files", label: "Файлы", icon: File },
    ] as Array<{ id: TabId; label: string; icon: React.ComponentType<any> }>,
    []
  );

  const stats = useMemo(
    () => [
      { label: "Пользователи", value: users.length, icon: Users },
      { label: "Персонажи", value: characters.length, icon: User },
    ],
    [users.length, characters.length]
  );

  const renderContent = () => {
    switch (active) {
      case "characters":
        return <AdminCharacters />;
      case "users":
        return <AdminUsers />;
      case "shop":
        return <AdminShop />;
      case "messages":
        return <AdminSupport />;
      case "broadcast":
        return <AdminBroadcast />;
      case "files":
        return <AdminFiles />;
      default:
        return null;
    }
  };

  if (user && user.role !== "admin") {
    return (
      <div 
        className="min-h-screen w-full relative p-4" 
        style={{ fontFamily: DESIGN.fonts.body, backgroundColor: DESIGN.colors.background.dark }}
      >
        <ThemedBackground intensity={bgIntensity} />
        <div className="max-w-screen-md mx-auto">
          <motion.div
            {...ANIM.fadeInUp(0.2)}
            className="rounded-3xl p-8 text-center"
            style={{
              background: DESIGN.colors.background.glass,
              border: `1px solid ${DESIGN.colors.border}`,
              boxShadow: DESIGN.shadows.glass,
              color: DESIGN.colors.text.primary,
            }}
          >
            <Shield className="w-16 h-16 mx-auto mb-6" style={{ color: "#f87171" }} />
            <h2 className="text-2xl font-bold mb-3">Доступ запрещён</h2>
            <p className="text-lg" style={{ color: DESIGN.colors.text.muted }}>
              Эта страница доступна только администраторам.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full relative p-2 sm:p-4 pt-4 sm:pt-6" 
      style={{ fontFamily: DESIGN.fonts.body, backgroundColor: DESIGN.colors.background.dark }}
    >
      <ThemedBackground intensity={bgIntensity} />
      <div className="relative z-10 mx-auto w-full max-w-none">
        <header className="mb-8">
          <motion.div {...ANIM.fadeInUp(0.1)} className="flex items-center gap-4">
            <motion.div
              {...ANIM.float}
              className="rounded-2xl w-12 h-12 flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})`,
                boxShadow: DESIGN.shadows.button,
              }}
            >
              <Shield className="w-6 h-6" style={{ color: "#ffffff" }} />
            </motion.div>
            <div>
              <h1
                className="text-3xl sm:text-4xl font-black leading-tight"
                style={{
                  background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                  fontFamily: DESIGN.fonts.heading,
                  textShadow: "0 4px 12px rgba(0,0,0,0.2)",
                }}
              >
                Панель администратора
              </h1>
              <p className="text-base sm:text-lg mt-2" style={{ color: DESIGN.colors.text.muted }}>
                Управляйте контентом, пользователями и сервисом
              </p>
            </div>
          </motion.div>
        </header>

        {/* Статистика */}
        <motion.div {...ANIM.fadeInUp(0.2)} className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              {...ANIM.fadeInUp(0.3 + i * 0.1)}
              className="rounded-2xl p-5"
              style={{
                background: DESIGN.colors.background.glass,
                border: `1px solid ${DESIGN.colors.border}`,
                boxShadow: DESIGN.shadows.glass,
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="rounded-xl p-3 flex items-center justify-center"
                  style={{
                    background: DESIGN.colors.background.glass,
                    border: `1px solid ${DESIGN.colors.border}`,
                    boxShadow: DESIGN.shadows.glass,
                  }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: DESIGN.colors.text.primary }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: DESIGN.colors.text.primary }}>{stat.value}</p>
                  <p className="text-sm" style={{ color: DESIGN.colors.text.muted }}>{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <nav className="mb-8">
          <motion.div {...ANIM.fadeInUp(0.4)} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {tabs.map(({ id, label, icon: Icon }) => {
              const activeNow = active === id;
              return (
                <motion.button
                  key={id}
                  {...ANIM.buttonTap}
                  onClick={() => setActive(id)}
                  className="w-full"
                >
                  <div
                    className="w-full rounded-2xl px-4 py-4 flex items-center gap-3 transition-all duration-300"
                    style={{
                      background: activeNow
                        ? `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})`
                        : DESIGN.colors.background.glass,
                      color: activeNow ? "#ffffff" : DESIGN.colors.text.primary,
                      boxShadow: activeNow ? DESIGN.shadows.button : DESIGN.shadows.glass,
                      border: "none",
                    }}
                  >
                    <div
                      className="rounded-xl p-3 flex items-center justify-center"
                      style={{
                        background: activeNow ? "rgba(255, 255, 255, 0.2)" : DESIGN.colors.background.glass,
                        boxShadow: activeNow ? "none" : DESIGN.shadows.glass,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg truncate">{label}</span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </nav>

        <motion.section
          {...ANIM.fadeInUp(0.5)}
          className="rounded-3xl overflow-hidden"
          style={{
            background: DESIGN.colors.background.glass,
            border: `1px solid ${DESIGN.colors.border}`,
            boxShadow: DESIGN.shadows.glass,
          }}
        >
          {renderContent()}
        </motion.section>
      </div>
    </div>
  );
}