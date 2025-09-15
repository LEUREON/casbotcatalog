// project/src/components/Layout/MobileNavigation.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"; 
import {
  Compass, BarChart2, Heart, Users, Menu as MenuIcon, ShoppingBag, Bell,
  LifeBuoy, Bot, Plus, Settings, LogIn, X, ChevronRight, LogOut, Cat,
  Send // <-- 1. ИМПОРТИРОВАЛИ ИКОНКУ SEND (TELEGRAM)
} from "lucide-react";
import IconBase from "../ui/IconBase";
import { useUnreadTotal } from "../../hooks/useUnreadTotal";
import ThemedBackground from "../common/ThemedBackground";
import { useAuth } from "../../contexts/AuthContext";

/* ===== TOKENS ===== */
const TOKENS = {
  border: "rgba(255,255,255,0.16)",
  borderStrong: "rgba(255,255,255,0.34)",
  itemBg: "rgba(255,255,255,0.06)",
  itemBgActive: "rgba(255,255,255,0.12)",
  radius: 20,
  badgeMax: 99,
  // нежный розовый
  accent: "#f7cfe1",
  accentRgb: "247, 207, 225",
};

const ensureAuth = (user: any, to: string) =>
  !user ? `/login?next=${encodeURIComponent(to)}` : to;

const isAdmin = (user: any) =>
  !!user && (user.isAdmin || user?.role === "admin" || user?.is_staff);

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
  // Прямые числовые поля
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

  // Массивы
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

  // LocalStorage (числа/строки/JSON/массивы/объекты)
  if (!Number.isFinite(n) || n <= 0) {
    const best = getUnreadFromLocalStorage();
    if (best > 0) n = best;
  }

  n = Number(n) || 0;
  return n < 0 ? 0 : n;
}

/** Хук: считывает счётчик; можно "пингануть" извне (trigger) — для проверки на открытии меню */

/* useUnreadCount moved to hooks */


/* ========================================================================================= */
export function MobileNavigation() {const [open, setOpen] = useState(false);

  // Lock page scroll only while the menu is open
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

  
  const [ping, setPing] = useState(0); // увеличиваем при каждом открытии
  const unread = useUnreadTotal(ping);

  const handleOpen = () => {
    setPing((p) => p + 1); // << пингуем «проверку уведомлений»
    setOpen(true);
  };

  return (
    <>
      <BottomDock openMenu={handleOpen} ping={ping} unread={unread} />
      <AnimatePresence>{open && <FullScreenMenu onClose={() => setOpen(false)} ping={ping} unread={unread} />}</AnimatePresence>
    </>
  );
}

/* ===== Нижний док: большие круглые кнопки + бейдж на «Меню» ===== */
function BottomDock({ openMenu, ping, unread }: { openMenu: () => void; ping: number; unread: number }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  useReducedMotion();

  // unread is passed via props

  const items = useMemo(
    () => [
      { id: "/characters", icon: Compass, to: "/characters", label: "Каталог" },
      { id: "/rating", icon: BarChart2, to: "/rating", label: "Рейтинг" },
      { id: "/favorites", icon: Heart, to: ensureAuth(user, "/favorites"), label: "Избранное" },
      { id: "/shop", icon: ShoppingBag, to: "/shop", label: "Магазин" },
      
      // бейдж на кнопке «Меню»
      { id: "more", icon: MenuIcon, action: openMenu, label: "Меню", badge: unread },
    ],
    [user, unread, openMenu]
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden" aria-label="Нижняя навигация">
      <div className="mx-auto max-w-[820px] px-3 pb-3 pt-2" style={{ pointerEvents: "auto" }}>
        <div
          className="w-full rounded-2xl border border-white/10 bg-transparent backdrop-blur-xl"
          style={{ borderColor: TOKENS.border }}
        >
          <ul className="grid grid-cols-5">
            {items.map((it) => {
              const isActive =
                it.to && (location.pathname === it.to || location.pathname.startsWith(it.to + "/"));
              const badge = (it as any).badge;
              const showBadge = typeof badge === "number" && badge > 0;

              const Inner = (
                <div className="relative">
                  <div
                    className="rounded-full inline-flex items-center justify-center leading-none border mx-auto"
                    style={{
                      width: 52,
                      height: 52,
                      borderColor: TOKENS.border,
                      background: "rgba(255,255,255,0.06)",
                      boxShadow: isActive
                        ? `inset 0 0 0 0.75px rgba(${TOKENS.accentRgb}, 0.95)`
                        : "none",
                    }}
                  >
                    {showBadge ? (
                      <motion.div
                        initial={{ opacity: 0.9, scale: 1 }}
                        animate={{ opacity: [0.9, 1, 0.9], scale: [1, 1.06, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <IconBase icon={it.icon} size="row" strokeWidth={isActive ? 2.15 : 2} />
                      </motion.div>
                    ) : (
                      <IconBase icon={it.icon} size="row" strokeWidth={isActive ? 2.15 : 2} />
                    )}
                  </div>

                  {showBadge && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] leading-[18px] font-bold inline-flex items-center justify-center leading-none"
                      style={{ background: TOKENS.accent, color: "#111", border: `1px solid ${TOKENS.border}` }}
                    >
                      {badge > TOKENS.badgeMax ? `${TOKENS.badgeMax}+` : badge}
                    </span>
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
    </nav>
  );
}

/* ===== Полноэкранное меню ===== */
function FullScreenMenu({ onClose, ping, unread }: { onClose: () => void; ping: number; unread: number }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pulseEnabled = useMemo(() => location.pathname !== "/notifications" && unread > 0, [location.pathname, unread]);
  const auth = (useAuth() as any) || {};
  const user = auth?.user;
// duplicate unread declaration removed

  const reduce = useReducedMotion();
  const sheetTransition = reduce ? { duration: 0 } : { type: "tween", ease: "easeOut", duration: 0.28 };

  // НЕ закрываем панель по клику "Выйти"
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
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Мобильное меню">
      <ThemedBackground className="z-0" />
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0 }} />

      <motion.div
        initial={{ y: 24, opacity: 0.98 }} animate={{ y: 0, opacity: 1 }}
        
        className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto overscroll-contain"
       transition={sheetTransition} exit={{ opacity: 0, transition: { duration: 0 } }}>
        <div className="mx-auto max-w-[820px] px-4 pt-4 pb-[104px]">
          {/* header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="rounded-xl px-2.5 py-1 text-[11px] uppercase tracking-widest"
                style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${TOKENS.border}` }}
              >
                BETA
              </div>
              <span className="font-display text-xl font-bold tracking-tight">CAS Каталог</span>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border px-2.5 py-1.5"
              style={{ borderColor: TOKENS.border }}
              aria-label="Закрыть меню"
            >
              <IconBase icon={X} size="row" />
            </button>
          </div>

          {/* карточка входа/профиля */}
          {!user ? (
            <div className="mb-4 rounded-2xl border p-3" style={{ borderColor: TOKENS.border }}>
              <div className="flex items-center gap-3">
                <div
                  className="rounded-full inline-flex items-center justify-center leading-none border shrink-0"
                  style={{ width: 48, height: 48, borderColor: TOKENS.border, }}
                >
                  <IconBase icon={LogIn} size="row" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold leading-tight">Войдите в аккаунт</p>
                  <p className="text-[12px] opacity-70">Чтобы сохранять избранное и получать уведомления</p>
                </div>
                <Link
                  to="/login"
                  onClick={onClose}
                  className="rounded-xl font-display font-semibold px-3 py-2"
                  style={{ background: TOKENS.accent, color: "#111", border: `1px solid ${TOKENS.border}` }}
                >
                  Войти
                </Link>
              </div>
            </div>
          ) : (
            <div className="mb-4 rounded-2xl border p-3" style={{ borderColor: TOKENS.border }}>
              <div className="flex items-center gap-3">
{(user.avatarUrl || user.avatar || user.photoURL) ? (
  <img
    src={(user.avatarUrl || user.avatar || user.photoURL) as string}
    alt="Аватар"
    className="w-[48px] h-[48px] rounded-full border shrink-0"
    style={{ borderColor: TOKENS.border, objectFit: "cover" }}
  />
) : (
  <div
    className="w-[48px] h-[48px] rounded-full border shrink-0 inline-flex items-center justify-center leading-none"
    style={{ borderColor: TOKENS.border, background: TOKENS.accent }}
  >
    <IconBase icon={Cat} size="avatar" className="text-black" />
  </div>
)}
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold leading-tight truncate">
                    {user?.nickname || user?.login}
                  </p>
                  {user?.login && <p className="text-[12px] opacity-70 truncate">{user?.login}</p>}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    aria-label="Настройки профиля"
                    className="h-10 w-10 rounded-full border inline-flex items-center justify-center leading-none hover:bg-black/5 transition"
                    style={{ borderColor: TOKENS.border }}
                    onClick={() => { onClose(); navigate(ensureAuth(user, "/profile")); }}
                  >
                    <IconBase icon={Settings} size="row" />
                  </button>
                  <button
                    type="button"
                    aria-label="Уведомления"
                    className="relative h-10 w-10 rounded-full border inline-flex items-center justify-center leading-none hover:bg-black/5 transition"
                    style={{ borderColor: TOKENS.border }}
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
                          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[6px] rounded-full border text-[11px] leading-[18px] font-bold inline-flex items-center justify-center leading-none"
                          style={{ background: TOKENS.accent, color: "#111", border: `1px solid ${TOKENS.border}` }}
                        >
                          {unread > TOKENS.badgeMax ? `${TOKENS.badgeMax}+` : unread}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                  
                </div>
              </div>
            </div>
          )}

          {/* группы ссылок */}
          <div className="flex flex-col gap-4">
            {groups.map((g) => (
              <section key={g.title} className="flex flex-col gap-2">
                <h3 className="px-1 text-[12px] tracking-wider uppercase opacity-70">{g.title}</h3>
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

          {/* ▼▼▼ 2. НОВАЯ СЕКЦИЯ TELEGRAM ▼▼▼ */}
          <section className="flex flex-col gap-2 mt-4">
            <h3 className="px-1 text-[12px] tracking-wider uppercase opacity-70">Сообщество</h3>
            {/* Мы не можем использовать компонент <Row/>, так как нам нужны кастомные синие цвета.
              Поэтому мы создаем <a> тег, который выглядит точно так же, как <Row/>, но с цветами Telegram.
            */}
            <a
              href="https://t.me/cascharacter" // Добавляем https:// для корректной ссылки
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose} // Закрываем меню при нажатии
              className="relative overflow-hidden rounded-2xl border flex items-center gap-3 px-3 py-2"
              style={{
                borderColor: "rgba(0, 136, 204, 0.4)", // (Blue-500 @ 40%)
                background: "rgba(0, 136, 204, 0.1)",  // (Blue-500 @ 10%)
                boxSizing: "border-box",
                boxShadow: "inset 0 0 0 1px rgba(0, 136, 204, 0.6)", // Синий 'active' контур
              }}
            >
              {/* Иконка (в стиле <Row/>) */}
              <div
                className="grid place-items-center border shrink-0 rounded-full relative"
                style={{
                  width: 40, height: 40, 
                  borderColor: "rgba(255, 255, 255, 0.6)", // Синяя рамка
                  background: "rgba(0, 136, 204, 0.9)", // Синий фон
                }}
              >
                {/* Используем иконку Send (самолетик) для Telegram */}
                <IconBase icon={Send} size="dockLg" style={{ color: "#ffffff" }} /> {/* Светло-синий (Blue-400) */}
              </div>
              
              {/* Текст */}
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: "clamp(13px,3.2vw,15px)", lineHeight: 1.2, color: "#93C5FD" }}> {/* Blue-300 */}
                  Telegram Канал
                </p>
              </div>

              {/* Стрелка */}
              <span className="opacity-60" style={{ color: "#60A5FA" }}> {/* Blue-400 */}
                <IconBase icon={ChevronRight} size="row" />
              </span>
            </a>
          </section>
          {/* ▲▲▲ КОНЕЦ СЕКЦИИ TELEGRAM ▲▲▲ */}

        </div>
      </motion.div>
    </div>
  );
}

/* ===== Row — тонкий розовый контур, опциональный бейдж и пульсация ===== */
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

  const IconNode = (
    <div
      className="inline-flex items-center justify-center leading-none border shrink-0 rounded-full relative"
      style={{
        width: 40,
        height: 40,
        borderColor: active ? `rgba(${TOKENS.accentRgb}, .6)` : TOKENS.border,
        background: "rgba(255,255,255,0.06)",
      }}
    >
      {pulse && showBadge ? (
        <motion.div
          initial={{ opacity: 0.9, scale: 1 }}
          animate={{ opacity: [0.9, 1, 0.9], scale: [1, 1.08, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <IconBase icon={Icon} size="row" strokeWidth={active ? 2.05 : 2}  size="dockLg" />
        </motion.div>
      ) : (
        <IconBase icon={Icon} size="row" strokeWidth={active ? 2.05 : 2}  size="dockLg" />
      )}

      <AnimatePresence>
        {showBadge && (
          <motion.span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] leading-[18px] font-bold inline-flex items-center justify-center leading-none"
          style={{ background: "rgba(255,255,255,0.06)", color: "#111", border: `1px solid ${TOKENS.border}` }}
        >
          {badge! > TOKENS.badgeMax ? `${TOKENS.badgeMax}+` : badge}
        </motion.span>
      )}
      </AnimatePresence>
    </div>
  );

  return (
    <Wrap
      {...wrapProps}
      className="relative overflow-hidden rounded-2xl border flex items-center gap-3 px-3 py-2"
      style={{
        borderColor: TOKENS.border,
        background: active ? TOKENS.itemBgActive : TOKENS.itemBg,
        boxSizing: "border-box",
        boxShadow: active ? `inset 0 0 0 1px ${TOKENS.accent}` : "none",
      }}
    >
      {IconNode}

      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold whitespace-nowrap truncate" style={{ fontSize: "clamp(13px,3.2vw,15px)", lineHeight: 1.2 }}>
          {title}
        </p>
      </div>

      {to && (
        <span className="opacity-60">
          <IconBase icon={ChevronRight} size="row" />
        </span>
      )}
    </Wrap>
  );
}

export default MobileNavigation;