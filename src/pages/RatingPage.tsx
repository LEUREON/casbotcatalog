// project/src/pages/RatingPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../contexts/DataContext";
import { useReviews } from "../contexts/ReviewsContext";
import { useNavigate } from "react-router-dom";

/* ===== TOKENS ===== */
const TOKENS = {
  border: "rgba(255,255,255,0.12)",
  itemBg: "rgba(255,255,255,0.04)",
  itemBgActive: "rgba(255,255,255,0.10)",
  accent: "#f7cfe1",
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

/* ===== Чип-кнопка ===== */
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
    <button
      onClick={onClick}
      className={[
        "group inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm",
        "transition-colors border whitespace-nowrap",
      ].join(" ")}
      style={
        active
          ? {
              background: TOKENS.itemBgActive,
              borderColor: TOKENS.accent,
              color: "#fff",
              boxShadow: `0 0 0 1px ${TOKENS.accent} inset`,
            }
          : {
              background: TOKENS.itemBg,
              border: `1px solid ${TOKENS.border}`,
              color: "#e5e7eb",
            }
      }
    >
      <span>{label}</span>
    </button>
  );
}

/* ===== Ряд рейтинга (TOP-3) ===== */
function rowStyle(index: number): React.CSSProperties {
  const podium = [
    { border: "rgba(255,215,0,0.55)", tint: "rgba(255,215,0,0.10)" }, // gold
    { border: "rgba(192,192,192,0.55)", tint: "rgba(192,192,192,0.10)" }, // silver
    { border: "rgba(205,127,50,0.55)", tint: "rgba(205,127,50,0.10)" }, // bronze
  ];
  if (index < 3) {
    const p = podium[index];
    return {
      background: `linear-gradient(0deg, ${p.tint}, transparent 60%), ${TOKENS.itemBg}`,
      border: `1px solid ${p.border}`,
    };
  }
  return { background: TOKENS.itemBg, border: `1px solid ${TOKENS.border}` };
}

export function RatingPage() {
  const navigate = useNavigate();
  const { characters, loadCharacters } = useData();
  const { reviews } = useReviews();

  const [period, setPeriod] = useState<Period>("30d"); // По умолчанию - месяц

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
      
      // ▼▼▼ ИЗМЕНЕНИЕ ЗДЕСЬ ▼▼▼
      // Если голосов (v) нет, рейтинг должен быть 0, а не "C".
      const weightedRating = v === 0 ? 0 : (v / (v + m)) * R + (m / (v + m)) * C;
      // ▲▲▲ КОНЕЦ ИЗМЕНЕНИЯ ▲▲▲
      
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
    <div className="mx-auto max-w-[820px] px-2 sm:px-4 pb-24 pt-4">
      <div className="mb-4">
        <div
          className="relative rounded-2xl border backdrop-blur-xl p-3"
          style={{ borderColor: TOKENS.border, background: "rgba(255,255,255,0.03)" }}
        >
            <div className="flex items-center justify-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" as any }}>
              <ChipButton label="За неделю" active={period === "7d"} onClick={() => setPeriod("7d")} />
              <ChipButton label="За месяц" active={period === "30d"} onClick={() => setPeriod("30d")} />
              <ChipButton label="Всё время" active={period === "all"} onClick={() => setPeriod("all")} />
            </div>
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((r, idx) => (
          <li key={r.id}>
            <button
              onClick={() => navigate(`/characters/${r.id}`)}
              className="w-full flex items-center justify-between rounded-2xl px-3 py-3 border text-left transition-colors"
              style={rowStyle(idx)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full overflow-hidden border" style={{ borderColor: TOKENS.border }}>
                  {r.avatar ? (
                    <img src={r.avatar} alt={r.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-full w-full bg-black/30" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-white text-sm font-medium leading-tight truncate">
                    {idx + 1}. {r.name}
                  </div>
                  <div className="text-slate-400 text-xs truncate">{r.occupation}</div>
                </div>
              </div>

              <div className="text-white font-semibold text-sm tabular-nums">
                {r.rating > 0 ? r.rating.toFixed(2) : "—"}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}