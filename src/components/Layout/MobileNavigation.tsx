import { createPortal } from "react-dom";
// project/src/components/Layout/MobileNavigation.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; 
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion"; 
import {
  Compass, BarChart2, Heart, Users, Menu as MenuIcon, ShoppingBag, Bell,
  LifeBuoy, Bot, Plus, Settings, LogIn, X, ChevronRight, LogOut, Cat,
  Send
} from "lucide-react";
import IconBase from "../ui/IconBase";
import { useUnreadTotal } from "../../hooks/useUnreadTotal";
import ThemedBackground from "../common/ThemedBackground";
import { useAuth } from "../../contexts/AuthContext";

// ✅ Функции ensureAuth и isAdmin перенесены в начало
const ensureAuth = (user: any, to: string) =>
  !user ? `/login?next=${encodeURIComponent(to)}` : to;

const isAdmin = (user: any) =>
  !!user && (user.isAdmin || user?.role === "admin" || user?.is_staff);

// === 🎨 ЕДИНАЯ ДИЗАЙН-СИСТЕМА (ПОЛНОСТЬЮ СИНХРОНИЗИРОВАНА С CharacterPage.tsx) ===
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

// === 🎭 АНИМАЦИОННЫЕ ПРЕСЕТЫ (ПОЛНОСТЬЮ СИНХРОНИЗИРОВАНЫ) ===
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
  starPulse: {
    animate: { scale: [1, 1.2], y: [0, -6] },
    transition: DESIGN.transitions.spring,
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

/* ===== УНИВЕРСАЛЬНЫЙ СЧЁТЧИК НЕПРОЧИТАННЫХ ===== */
const LS_KEYS = [
  "unreadNotifications",
  "notifications_unread",
  "unread_count",
  "unreadCount",
  "bellCount",
  "notificationsCount",
  "newNotifications",
];

function countFromArray(arr: any[]): number {
  try {
    return arr.reduce((acc, n) => {
      const unread =
        n?.unread === true ||
        n?.read === false ||
        n?.seen === false ||
        n?.is_read === false ||
        n?.isRead === false ||
        n?.viewed === false ||
        n?.status === "unread";
      return acc + (unread ? 1 : 0);
    }, 0);
  } catch {
    return 0;
  }
}

function parseMaybeJSON(raw: string | null): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function getUnreadFromLocalStorage(): number {
  let best = 0;
  try {
    for (const k of LS_KEYS) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const val = parseMaybeJSON(raw);
      if (typeof val === "number") {
        if (val > best) best = val;
      } else if (typeof val === "string") {
        const num = parseInt(val, 10);
        if (Number.isFinite(num) && num > best) best = num;
      } else if (Array.isArray(val)) {
        const c = countFromArray(val);
        if (c > best) best = c;
      } else if (val && typeof val === "object") {
        const candidates = [val.unread, val.unreadCount, val.count, val.notificationsCount];
        for (const c of candidates) {
          const num = parseInt(String(c ?? 0), 10);
          if (Number.isFinite(num) && num > best) best = num;
        }
        if (Array.isArray((val as any).items)) {
          const c = countFromArray((val as any).items);
          if (c > best) best = c;
        }
      }
    }
  } catch {}
  return best;
}

function getUnreadCountFrom(auth: any): number {
  let n =
    auth?.notificationsCount ??
    auth?.unreadCount ??
    auth?.unreadNotifications ??
    auth?.user?.notificationsCount ??
    auth?.user?.unreadCount ??
    auth?.user?.unreadNotifications ??
    auth?.notifications?.unreadCount ??
    auth?.notifications?.unread ??
    0;

  if (!Number.isFinite(n) || n <= 0) {
    const arrays = [
      auth?.notifications,
      auth?.user?.notifications,
      auth?.notificationsList,
      auth?.user?.notificationsList,
      auth?.store?.notifications,
      auth?.state?.notifications,
    ].filter(Boolean);
    for (const a of arrays) {
      if (Array.isArray(a)) {
        const c = countFromArray(a);
        if (c > 0) {
          n = c;
          break;
        }
      }
    }
  }

  if (!Number.isFinite(n) || n <= 0) {
    const best = getUnreadFromLocalStorage();
    if (best > 0) n = best;
  }

  n = Number(n) || 0;
  return n < 0 ? 0 : n;
}

/* ========================================================================================= */
export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  // Measure dock height to anchor via top = (visual viewport height - dock height)
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [dockH, setDockH] = useState<number>(72);
  useEffect(() => {
    const measure = () => {
      const h = dockRef.current?.offsetHeight || 72;
      setDockH(h);
    };
    measure();
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    vv?.addEventListener('resize', measure);
    vv?.addEventListener('scroll', measure);
    const obs = new ResizeObserver(measure);
    if (dockRef.current) obs.observe(dockRef.current);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      vv?.removeEventListener('resize', measure);
      vv?.removeEventListener('scroll', measure);
      obs.disconnect();
    };
  }, []);

  const supportsDVH = typeof window !== 'undefined' && 'CSS' in window && (CSS as any).supports?.('height: 100dvh');
  const bottomOffset = 19; // tweak this gap (px)
  const topValue = supportsDVH
    ? `calc(100dvh - ${dockH}px - ${bottomOffset}px)`
    : `calc((var(--vh, 1vh) * 100) - ${dockH}px - ${bottomOffset}px)`;

  useEffect(() => {
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;
    if (open) {
      html.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "contain";
    }
    return () => {
      html.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
    };
  }, [open]);

  const [ping, setPing] = useState(0);
  const unread = useUnreadTotal(ping);

  const handleOpen = () => {
    setPing((p) => p + 1);
    setOpen(true);
  };

  return (
    <>
      <BottomDock openMenu={handleOpen} ping={ping} unread={unread} />
      <AnimatePresence>{open && <FullScreenMenu onClose={() => setOpen(false)} ping={ping} unread={unread} />}</AnimatePresence>
    </>
  );
}

/* ===== Нижний док: ГЛАСС-МОРФНЫЕ КНОПКИ С ГРАДИЕНТАМИ И АНИМАЦИЯМИ ===== */
function BottomDock({ openMenu, ping, unread }: { openMenu: () => void; ping: number; unread: number }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  useReducedMotion();

  const items = useMemo(
    () => [
      { id: "/characters", icon: Compass, to: "/characters", label: "Каталог" },
      { id: "/rating", icon: BarChart2, to: "/rating", label: "Рейтинг" },
      { id: "/favorites", icon: Heart, to: ensureAuth(user, "/favorites"), label: "Избранное" },
      { id: "/shop", icon: ShoppingBag, to: "/shop", label: "Магазин" },
      { id: "more", icon: MenuIcon, action: openMenu, label: "Меню", badge: unread },
    ],
    [user, unread, openMenu]
  );

  
  // Measure dock height locally to anchor the dock to the bottom of visual viewport
  const dockRef = useRef<HTMLDivElement | null>(null);
  const [dockH, setDockH] = useState<number>(72);
  useEffect(() => {
    const measure = () => setDockH(dockRef.current?.offsetHeight || 72);
    measure();
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    vv?.addEventListener('resize', measure);
    vv?.addEventListener('scroll', measure);
    const ro = new ResizeObserver(measure);
    if (dockRef.current) ro.observe(dockRef.current);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      vv?.removeEventListener('resize', measure);
      vv?.removeEventListener('scroll', measure);
      ro.disconnect();
    };
  }, []);
  const supportsDVH = typeof window !== 'undefined' && 'CSS' in window && (CSS as any).supports?.('height: 100dvh');
  const bottomOffset = 19; // tweak this gap (px)
  const topValue = supportsDVH
    ? `calc(100dvh - ${dockH}px - ${bottomOffset}px)`
    : `calc((var(--vh, 1vh) * 100) - ${dockH}px - ${bottomOffset}px)`;
return typeof window !== "undefined" ? createPortal((<nav className="fixed left-0 right-0 z-40 lg:hidden" aria-label="Нижняя навигация" style={{ top: topValue, WebkitTransform: "translateZ(0)", willChange: "transform" }}>
      <div className="mx-auto max-w-[820px] px-3 pt-2" style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))", pointerEvents: "auto" }} >
        <div
          ref={dockRef} className="w-full rounded-2xl border backdrop-blur-xl"
          style={{
            borderColor: DESIGN.colors.border,
            background: DESIGN.colors.background.glass,
            boxShadow: DESIGN.shadows.glass,
          }}
        >
          <ul className="grid grid-cols-5">
            {items.map((it) => {
              const isActive =
                it.to && (location.pathname === it.to || location.pathname.startsWith(it.to + "/"));
              const badge = (it as any).badge;
              const showBadge = typeof badge === "number" && badge > 0;

              const Inner = (
                <div className="relative">
                  <motion.div
                    className="rounded-full inline-flex items-center justify-center leading-none border mx-auto"
                    style={{
                      width: 52,
                      height: 52,
                      background: isActive
                        ? `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})`
                        : DESIGN.colors.background.glass,
                      boxShadow: isActive ? DESIGN.shadows.button : DESIGN.shadows.glass,
                      border: "none",
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {showBadge ? (
                      <motion.div
                        initial={{ opacity: 0.9, scale: 1 }}
                        animate={{ opacity: [0.9, 1, 0.9], scale: [1, 1.06, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <IconBase icon={it.icon} size="row" color={isActive ? "#ffffff" : undefined} />
                      </motion.div>
                    ) : (
                      <IconBase icon={it.icon} size="row" color={isActive ? "#ffffff" : undefined} />
                    )}
                  </motion.div>

                  {showBadge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] leading-[18px] font-bold inline-flex items-center justify-center leading-none"
                      style={{
                        background: DESIGN.colors.accent.primary,
                        color: "#0a0a12",
                        border: `1px solid ${DESIGN.colors.border}`,
                        boxShadow: DESIGN.shadows.accent,
                      }}
                    >
                      {badge > 99 ? `99+` : badge}
                    </motion.span>
                  )}
                </div>
              );

              return (
                <li key={it.id} className="text-center">
                  {it.to ? (
                    <Link to={it.to} className="block py-2" aria-current={isActive ? "page" : undefined}>
                      {Inner}
                    </Link>
                  ) : (
                    <button type="button" onClick={it.action} className="w-full h-full inline-flex items-center justify-center leading-none py-2">
                      {Inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>), document.body) : null;
}

/* ===== Полноэкранное меню: АНИМИРОВАННОЕ, С ГРАДИЕНТАМИ И ТЕНЯМИ ===== */
function FullScreenMenu({ onClose, ping, unread }: { onClose: () => void; ping: number; unread: number }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pulseEnabled = useMemo(() => location.pathname !== "/notifications" && unread > 0, [location.pathname, unread]);
  const auth = (useAuth() as any) || {};
  const user = auth?.user;

  const reduce = useReducedMotion();
  const sheetTransition = reduce ? { duration: 0 } : { type: "tween", ease: "easeOut", duration: 0.28 };

  // Параллакс для фона
  const { scrollY } = useScroll();
  const bgIntensity = useTransform(scrollY, [0, 500], [0.3, 0.1]);

  const handleLogout = async () => {
    try {
      if (typeof auth.logout === "function") {
        await Promise.resolve(auth.logout());
      } else if (typeof auth.signOut === "function") {
        await Promise.resolve(auth.signOut());
      } else {
        try { localStorage.removeItem("token"); } catch {}
        window.location.reload();
        return;
      }
    } catch {
      window.location.reload();
      return;
    }
  };

  type Item = {
    icon: React.ElementType;
    title: string;
    to?: string;
    onClick?: () => void;
    badge?: number;
    pulse?: boolean;
  };

  const groups: { title: string; items: Item[] }[] = [
    {
      title: "Разделы",
      items: [
        { icon: Compass, title: "Каталог", to: "/characters" },
        { icon: BarChart2, title: "Рейтинг", to: "/rating" },
        { icon: ShoppingBag, title: "Магазин", to: ensureAuth(user, "/shop") },
        { icon: Heart, title: "Избранное", to: ensureAuth(user, "/favorites") },
      ],
    },
    
    ...(isAdmin(user)
      ? [{ title: "Управление", items: [{ icon: Settings, title: "Админ-панель", to: "/admin" }] }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Мобильное меню">
      <ThemedBackground intensity={bgIntensity} className="z-0" />
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0 }} />

      <motion.div
        initial={{ y: 24, opacity: 0.98 }} animate={{ y: 0, opacity: 1 }}
        className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto overscroll-contain"
        transition={sheetTransition} exit={{ opacity: 0, transition: { duration: 0 } }}>
        <div className="mx-auto max-w-[820px] px-4 pt-4" style={{ paddingBottom: "calc(104px + env(safe-area-inset-bottom, 0px))" }}>
          {/* header — АНИМИРОВАННЫЙ ЗАГОЛОВОК */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <motion.div
                {...ANIM.float}
                className="rounded-full w-12 h-12 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})`,
                  boxShadow: DESIGN.shadows.button,
                }}
              >
                <IconBase icon={Heart} size="row" style={{ color: "#ffffff" }} />
              </motion.div>
              <h1
                className="text-2xl font-black"
                style={{
                  background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                  fontFamily: DESIGN.fonts.heading,
                }}
              >
                CAS Каталог
              </h1>
            </div>

            <motion.button
              {...ANIM.buttonTap}
              onClick={onClose}
              className="rounded-full p-3"
              style={{
                background: DESIGN.colors.background.glass,
                border: `1px solid ${DESIGN.colors.border}`,
                color: DESIGN.colors.text.primary,
                boxShadow: DESIGN.shadows.glass,
              }}
              aria-label="Закрыть меню"
            >
              <IconBase icon={X} size="row" />
            </motion.button>
          </div>

          {/* карточка входа/профиля — ГРАДИЕНТНЫЙ ФОН И ТЕНИ */}
          {!user ? (
            <div className="mb-8 rounded-2xl p-5" style={{ background: DESIGN.colors.background.glass, boxShadow: DESIGN.shadows.glass }}>
              <div className="flex items-center gap-4">
                <div
                  className="rounded-full inline-flex items-center justify-center"
                  style={{ 
                    width: 56, 
                    height: 56, 
                    background: DESIGN.colors.background.glass,
                    boxShadow: DESIGN.shadows.glass,
                  }}
                >
                  <IconBase icon={LogIn} size="row" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-lg mb-1" style={{ color: DESIGN.colors.text.primary }}>
                    Войдите
                  </p>
                  <p className="text-sm" style={{ color: DESIGN.colors.text.muted }}>
                    Чтобы сохранять избранное
                  </p>
                </div>
                <Link
                  to="/login"
                  onClick={onClose}
                  className="rounded-full font-bold px-5 py-3"
                  style={{
                    background: `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})`,
                    color: "#ffffff",
                    border: "none",
                    boxShadow: DESIGN.shadows.button,
                  }}
                >
                  Войти
                </Link>
              </div>
            </div>
          ) : (
            <div className="mb-8 rounded-2xl p-5" style={{ background: DESIGN.colors.background.glass, boxShadow: DESIGN.shadows.glass }}>
              <div className="flex items-center gap-4">
                {(user.avatarUrl || user.avatar || user.photoURL) ? (
                  <img
                    src={(user.avatarUrl || user.avatar || user.photoURL) as string}
                    alt="Аватар"
                    className="w-14 h-14 rounded-full object-cover"
                    style={{ border: `2px solid ${DESIGN.colors.border}` }}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full inline-flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})`,
                      boxShadow: DESIGN.shadows.button,
                    }}
                  >
                    <IconBase icon={Cat} size="avatar" style={{ color: "#ffffff" }} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-lg" style={{ color: DESIGN.colors.text.primary }}>
                    {user?.nickname || user?.login}
                  </p>
                  {user?.login && <p className="text-sm" style={{ color: DESIGN.colors.text.muted }}>{user?.login}</p>}
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <motion.button
                    {...ANIM.buttonTap}
                    type="button"
                    aria-label="Настройки профиля"
                    className="h-11 w-11 rounded-full inline-flex items-center justify-center"
                    style={{
                      background: DESIGN.colors.background.glass,
                      color: DESIGN.colors.text.primary,
                      boxShadow: DESIGN.shadows.glass,
                    }}
                    onClick={() => { onClose(); navigate(ensureAuth(user, "/profile")); }}
                  >
                    <IconBase icon={Settings} size="row" />
                  </motion.button>
                  <motion.button
                    {...ANIM.buttonTap}
                    type="button"
                    aria-label="Уведомления"
                    className="relative h-11 w-11 rounded-full inline-flex items-center justify-center"
                    style={{
                      background: DESIGN.colors.background.glass,
                      color: DESIGN.colors.text.primary,
                      boxShadow: DESIGN.shadows.glass,
                    }}
                    onClick={() => { onClose(); navigate(ensureAuth(user, "/notifications")); }}
                  >
                    <IconBase icon={Bell} size="row" />
                    <AnimatePresence>
                      {unread > 0 && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.18 }}
                          className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-[6px] rounded-full text-[11px] leading-[20px] font-bold inline-flex items-center justify-center"
                          style={{
                            background: DESIGN.colors.accent.primary,
                            color: "#0a0a12",
                            border: `1px solid ${DESIGN.colors.border}`,
                            boxShadow: DESIGN.shadows.accent,
                          }}
                        >
                          {unread > 99 ? `99+` : unread}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* группы ссылок — ГРАДИЕНТНЫЕ КНОПКИ */}
          <div className="flex flex-col gap-6">
            {groups.map((g) => (
              <section key={g.title} className="flex flex-col gap-3">
                <h3 className="px-1 text-sm uppercase tracking-wider font-bold" style={{ color: DESIGN.colors.text.muted }}>
                  {g.title}
                </h3>
                <div className="flex flex-col gap-2">
                  {g.items.map(({ icon, title, to, onClick, badge, pulse }) => {
                    const isActive = to && (location.pathname === to || location.pathname.startsWith(to + "/"));
                    return (
                      <Row
                        key={title}
                        Icon={icon}
                        title={title}
                        to={to}
                        onClick={onClick}
                        active={!!isActive}
                        onClose={onClose}
                        badge={badge}
                        pulse={pulse}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Секция Telegram — ГРАДИЕНТНЫЙ ФОН И ТЕНИ */}
          <section className="flex flex-col gap-3 mt-8">
            <h3 className="px-1 text-sm uppercase tracking-wider font-bold" style={{ color: DESIGN.colors.text.muted }}>
              Сообщество
            </h3>
            <motion.a
              {...ANIM.buttonTap}
              href="https://t.me/cascharacter"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="relative overflow-hidden rounded-2xl flex items-center gap-4 px-5 py-4"
              style={{
                background: `linear-gradient(135deg, #4facfe, #00f2fe)`,
                color: "#ffffff",
                boxShadow: "0 6px 20px rgba(79, 172, 254, 0.3)",
              }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 44, 
                  height: 44, 
                  background: "rgba(255, 255, 255, 0.2)",
                }}
              >
                <IconBase icon={Send} size="dockLg" style={{ color: "#ffffff" }} />
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="font-bold text-lg">
                  Telegram Канал
                </p>
              </div>

              <IconBase icon={ChevronRight} size="row" />
            </motion.a>
          </section>

       
          
        </div>
      </motion.div>
    </div>
  );
}

/* ===== Row — ГРАДИЕНТНЫЕ КНОПКИ С ТЕНЯМИ ===== */
function Row({
  Icon, title, to, onClick, active, onClose, badge, pulse, dot,
}: {
  Icon: React.ElementType;
  title: string;
  to?: string;
  onClick?: () => void;
  active: boolean;
  onClose?: () => void;
  badge?: number;
  pulse?: boolean;
  dot?: boolean;
}) {
  const Wrap: any = to ? Link : "button";
  const wrapProps: any = to
    ? { to, onClick: onClose }
    : { type: "button", onClick: () => { onClick?.(); onClose?.(); }, role: "button" };

  const showBadge = typeof badge === "number" && badge > 0;

  return (
    <motion.div
      {...ANIM.buttonTap}
    >
      <Wrap
        {...wrapProps}
        className="relative overflow-hidden rounded-2xl flex items-center gap-4 px-5 py-4 transition-all duration-300"
        style={{
          background: active
            ? `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})`
            : DESIGN.colors.background.glass,
          color: active ? "#ffffff" : DESIGN.colors.text.primary,
          boxShadow: active ? DESIGN.shadows.button : DESIGN.shadows.glass,
        }}
      >
        <div
          className="inline-flex items-center justify-center shrink-0 rounded-full"
          style={{
            width: 44,
            height: 44,
            background: active
              ? "rgba(255, 255, 255, 0.2)"
              : DESIGN.colors.background.glass,
          }}
        >
          {pulse && showBadge ? (
            <motion.div
              initial={{ opacity: 0.9, scale: 1 }}
              animate={{ opacity: [0.9, 1, 0.9], scale: [1, 1.08, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <IconBase icon={Icon} size="row" color={active ? "#ffffff" : undefined} />
            </motion.div>
          ) : (
            <IconBase icon={Icon} size="row" color={active ? "#ffffff" : undefined} />
          )}

          <AnimatePresence>
            {showBadge && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full text-[11px] leading-[20px] font-bold inline-flex items-center justify-center"
                style={{
                  background: "#ffffff",
                  color: "#0a0a12",
                  border: `1px solid ${DESIGN.colors.border}`,
                  boxShadow: DESIGN.shadows.accent,
                }}
              >
                {badge! > 99 ? `99+` : badge}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-lg">
            {title}
          </p>
        </div>

        {to && (
          <IconBase icon={ChevronRight} size="row" />
        )}
      </Wrap>
    </motion.div>
  );
}

export default MobileNavigation;