// project/src/pages/RatingPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../contexts/DataContext";
import { useReviews } from "../contexts/ReviewsContext";
import { useNavigate } from "react-router-dom";
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

/* ===== Вспомогательные ===== */
type Period = "7d" | "30d" | "all";
const parseDate = (d?: string | number | Date) => (d ? new Date(d) : new Date(0));
const periodToDate = (p: Period): Date => {
  const now = new Date();
  if (p === "all") return new Date(0);
  const dt = new Date(now);
  if (p === "30d") dt.setDate(now.getDate() - 30);
  if (p === "7d") dt.setDate(now.getDate() - 7);
  return dt;
};

/* ===== Чип-кнопка — ПЕРЕРАБОТАНА В СТИЛЕ CharacterPage.tsx ===== */
function ChipButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      {...ANIM.buttonTap}
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300"
      style={
        active
          ? {
              background: `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})`,
              color: "#ffffff",
              border: "none",
              boxShadow: DESIGN.shadows.button,
            }
          : {
              background: DESIGN.colors.background.glass,
              color: DESIGN.colors.text.primary,
              border: `1px solid ${DESIGN.colors.border}`,
              boxShadow: DESIGN.shadows.glass,
            }
      }
    >
      <span>{label}</span>
    </motion.button>
  );
}

/* ===== Ряд рейтинга (TOP-3) — ПЕРЕРАБОТАН В СТИЛЕ CharacterPage.tsx ===== */
function rowStyle(index: number): React.CSSProperties {
  const podium = [
    { 
      gradient: "linear-gradient(135deg, #ffd700, #ffcc00)", // gold
      shadow: "0 4px 16px rgba(255, 215, 0, 0.4)",
    },
    { 
      gradient: "linear-gradient(135deg, #c0c0c0, #a9a9a9)", // silver
      shadow: "0 4px 16px rgba(192, 192, 192, 0.4)",
    },
    { 
      gradient: "linear-gradient(135deg, #cd7f32, #b87333)", // bronze
      shadow: "0 4px 16px rgba(205, 127, 50, 0.4)",
    },
  ];
  if (index < 3) {
    const p = podium[index];
    return {
      background: p.gradient,
      boxShadow: p.shadow,
      border: "none",
      color: "#0a0a12",
    };
  }
  return { 
    background: DESIGN.colors.background.glass,
    border: `1px solid ${DESIGN.colors.border}`,
    boxShadow: DESIGN.shadows.glass,
    color: DESIGN.colors.text.primary,
  };
}

export function RatingPage() {
  const navigate = useNavigate();
  const { characters, loadCharacters } = useData();
  const { reviews } = useReviews();

  const [period, setPeriod] = useState<Period>("30d"); // По умолчанию - месяц

  // Параллакс для фона
  const { scrollY } = useScroll();
  const bgIntensity = useTransform(scrollY, [0, 500], [0.3, 0.1]);

  useEffect(() => {
    if (!characters?.length) loadCharacters?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const after = periodToDate(period);

  const rows = useMemo(() => {
    // --- Логика Байесовского среднего ---
    const relevantReviews = (reviews || []).filter(
      (r: any) =>
        typeof r.rating === "number" &&
        r.rating > 0 &&
        parseDate(r.createdAt) >= after
    );
    
    const C =
      relevantReviews.length > 0
        ? relevantReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / relevantReviews.length
        : 0;

    const m = 3; 

    const list = (characters || []).map((c: any) => {
      const charReviews = relevantReviews.filter((r) => r.characterId === c.id);
      const v = charReviews.length;
      const R = v ? charReviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / v : 0;
      
      const weightedRating = v === 0 ? 0 : (v / (v + m)) * R + (m / (v + m)) * C;
      
      return {
        id: c.id,
        name: c.name || "Без названия",
        occupation: c.occupation || "",
        rating: weightedRating,
        avatar: c.photo || "",
      };
    });

    list.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
    return list;
  }, [characters, reviews, after]);

  return (
    <div className="min-h-screen w-full relative" style={{ fontFamily: DESIGN.fonts.body, backgroundColor: DESIGN.colors.background.dark }}>
      <ThemedBackground intensity={bgIntensity} />

      <div className="relative z-10 mx-auto w-full max-w-none px-2 sm:px-3 lg:px-4 py-4 lg:py-8">
        {/* Заголовок страницы */}
        <motion.div {...ANIM.fadeInUp(0.1)} className="mb-8 text-center">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight"
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
            🏆 Рейтинг персонажей
          </h1>
          <p className="mt-2 text-base sm:text-lg" style={{ color: DESIGN.colors.text.muted }}>
            Самые популярные персонажи по версии пользователей
          </p>
        </motion.div>

        {/* Фильтры периода */}
        <motion.div {...ANIM.fadeInUp(0.2)} className="mb-8">
          <div
            className="rounded-2xl border backdrop-blur-xl p-4"
            style={{
              background: DESIGN.colors.background.glass,
              borderColor: DESIGN.colors.border,
              boxShadow: DESIGN.shadows.glass,
            }}
          >
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <ChipButton label="За неделю" active={period === "7d"} onClick={() => setPeriod("7d")} />
              <ChipButton label="За месяц" active={period === "30d"} onClick={() => setPeriod("30d")} />
              <ChipButton label="Всё время" active={period === "all"} onClick={() => setPeriod("all")} />
            </div>
          </div>
        </motion.div>

        {/* Список рейтинга */}
        <AnimatePresence>
          <motion.ul className="flex flex-col gap-4">
            {rows.map((r, idx) => (
              <motion.li
                key={r.id}
                {...ANIM.fadeInUp(0.3 + idx * 0.05)}
              >
                <motion.button
                  {...ANIM.buttonTap}
                  onClick={() => navigate(`/characters/${r.id}`)}
                  className="w-full flex items-center justify-between rounded-2xl px-4 py-4 text-left transition-all duration-300"
                  style={rowStyle(idx)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-full overflow-hidden border" style={{ borderColor: DESIGN.colors.border }}>
                      {r.avatar ? (
                        <img src={r.avatar} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full bg-black/30 flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold leading-tight truncate" style={{ color: idx < 3 ? "#0a0a12" : DESIGN.colors.text.primary }}>
                        {idx + 1}. {r.name}
                      </div>
                      <div className="text-xs truncate" style={{ color: idx < 3 ? "rgba(10, 10, 18, 0.8)" : DESIGN.colors.text.muted }}>
                        {r.occupation}
                      </div>
                    </div>
                  </div>

                  <div className="font-bold text-sm tabular-nums" style={{ color: idx < 3 ? "#0a0a12" : DESIGN.colors.text.primary }}>
                    {r.rating > 0 ? r.rating.toFixed(2) : "—"}
                  </div>
                </motion.button>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>
    </div>
  );
}