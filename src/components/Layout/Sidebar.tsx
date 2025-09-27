// project/src/components/Layout/Sidebar.tsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Compass, BarChart2, Heart, ShoppingBag, Settings, Bell, Bot, Cat, LogIn, ChevronRight, Send
} from "lucide-react";
import IconBase from "../ui/IconBase";
import { useAuth } from "../../contexts/AuthContext";
import { useUnreadTotal } from "../../hooks/useUnreadTotal";

type SidebarProps = {
  isCollapsed?: boolean;
  setCollapsed?: (v: boolean) => void;
};

// === DESIGN (синхронизировано со стилем MobileNavigation) ===
const DESIGN = {
  colors: {
    text: { primary: "#ffffff", secondary: "#e0e0e0", muted: "#b0b0b0" },
    background: {
      glass: "rgba(40, 40, 50, 0.65)",
      glassHover: "rgba(50, 50, 65, 0.8)",
      floating: "rgba(30, 30, 40, 0.8)",
      dark: "#121218",
      item: "rgba(255,255,255,0.04)",
      reply: "rgba(35, 25, 55, 0.7)",
    },
    border: "rgba(255, 255, 255, 0.08)",
    accent: { primary: "#d7aefb", secondary: "#ff6bd6" },
  },
  fonts: { heading: 'var(--font-heading, inherit)' },
  shadows: {
    glass: "0 8px 32px rgba(0, 0, 0, 0.35)",
    button: "0 6px 20px rgba(255, 107, 214, 0.3)",
  },
} as const;

const ANIM = {
  buttonTap: { whileTap: { scale: 0.97 } },
  float: {
    initial: { y: 0 },
    animate: { y: [0, -3, 0] },
    transition: { repeat: Infinity, duration: 2.4, ease: "easeInOut" }
  }
} as const;

const ensureAuth = (user: any, to: string) =>
  !user ? `/login?next=${encodeURIComponent(to)}` : to;

const isAdmin = (user: any) =>
  !!user && (user.isAdmin || user?.role === "admin" || user?.is_staff);

type Item = { to: string; title: string; Icon: React.ElementType; badge?: number };

function useItems(user: any, unread: number): Item[] {
  return [
    { Icon: Compass,     title: "Каталог",     to: "/characters" },
    { Icon: BarChart2,   title: "Рейтинг",     to: "/rating" },
    { Icon: ShoppingBag, title: "Магазин",     to: ensureAuth(user, "/shop") },
    { Icon: Heart,       title: "Избранное",   to: ensureAuth(user, "/favorites") },
  ];
}

function Row({
  Icon, title, to, active, collapsed, badge,
}: { Icon: React.ElementType; title: string; to: string; active: boolean; collapsed: boolean; badge?: number }) {
  const showBadge = typeof badge === "number" && badge > 0;

  return (
    <Link
      to={to}
      className={[
        "group relative overflow-hidden rounded-2xl border flex items-center",
        collapsed ? "justify-center gap-0 px-2 py-2" : "gap-3 px-3 py-2",
        "transition-all duration-300",
      ].join(" ")}
      style={{
        borderColor: DESIGN.colors.border,
        background: active
          ? `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})`
          : DESIGN.colors.background.glass,
        color: active ? "#ffffff" : DESIGN.colors.text.primary,
        boxShadow: active ? DESIGN.shadows.button : DESIGN.shadows.glass,
      }}
      aria-current={active ? "page" : undefined}
      title={collapsed ? title : undefined}
    >
      <div
        className="inline-flex items-center justify-center shrink-0 rounded-full"
        style={{
          width: 44, height: 44,
          background: active ? "rgba(255, 255, 255, 0.2)" : DESIGN.colors.background.glass,
        }}
      >
        <IconBase icon={Icon as any} size="row" style={{ color: "#ffffff" }} />
      </div>

      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
        </div>
      )}

      {showBadge && (
        <span
          className="absolute -top-1 -right-1 rounded-full px-2 py-0.5 text-[11px] font-bold leading-none"
          style={{
            background: DESIGN.colors.accent.primary,
            color: "#0a0a12",
            border: `1px solid ${DESIGN.colors.border}`,
          }}
        >
          {badge! > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function UserCard({
  user, unread, collapsed, onSettings, onNotifications,
}: {
  user: any; unread: number; collapsed: boolean;
  onSettings: () => void; onNotifications: () => void;
}) {
  if (!user) {
    return (
      <div
        className="rounded-2xl border p-5 mb-4"
        style={{
          borderColor: DESIGN.colors.border,
          background: DESIGN.colors.background.glass,
          boxShadow: DESIGN.shadows.glass,
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className="rounded-full inline-flex items-center justify-center"
            style={{
              width: 56, height: 56,
              background: DESIGN.colors.background.glass,
              border: `1px solid ${DESIGN.colors.border}`,
              boxShadow: DESIGN.shadows.glass,
            }}
          >
            <IconBase icon={LogIn} size="row" />
          </div>

        {!collapsed && (
          <>
            <p className="mt-3 font-bold text-lg" style={{ color: DESIGN.colors.text.primary }}>
              Войдите
            </p>
            <p className="mt-1 text-sm" style={{ color: DESIGN.colors.text.muted }}>
              Чтобы сохранять избранное
            </p>
            <Link
              to="/login"
              className="mt-4 rounded-full px-5 py-2 inline-flex items-center gap-2 font-bold justify-center"
              style={{
                background: `linear-gradient(135deg, ${DESIGN.colors.accent.primary}, ${DESIGN.colors.accent.secondary})`,
                color: "#0a0a12",
                border: "none",
                boxShadow: DESIGN.shadows.button,
              }}
            >
              Войти
            </Link>
          </>
        )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-5 mb-4"
      style={{
        borderColor: DESIGN.colors.border,
        background: DESIGN.colors.background.glass,
        boxShadow: DESIGN.shadows.glass,
      }}
    >
      {/* Верхняя строка: аватар + имя/логин */}
      <div className="flex items-center gap-4">
        {(user.avatarUrl || user.avatar || user.photoURL) ? (
          <img
            src={(user.avatarUrl || user.avatar || user.photoURL) as string}
            alt="Аватар"
            className="w-14 h-14 rounded-full object-cover"
            style={{ border: `1px solid ${DESIGN.colors.border}` }}
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

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="font-bold text-lg truncate" style={{ color: DESIGN.colors.text.primary }}>
              {user?.nickname || user?.login}
            </p>
            {user?.login && (
              <p className="text-sm truncate" style={{ color: DESIGN.colors.text.muted }}>
                {user?.login}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Нижняя строка: кнопки на той же подложке */}
      {!collapsed && (
        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            aria-label="Настройки профиля"
            className="h-12 w-12 rounded-full inline-flex items-center justify-center"
            style={{
              background: DESIGN.colors.background.glass,
              color: DESIGN.colors.text.primary,
              border: `1px solid ${DESIGN.colors.border}`,
              boxShadow: DESIGN.shadows.glass,
            }}
            onClick={onSettings}
          >
            <IconBase icon={Settings} size="row" />
          </button>

          
          <button
            type="button"
            aria-label="Уведомления"
            className="relative h-12 w-12 rounded-full inline-flex items-center justify-center"
            style={{
              background: DESIGN.colors.background.glass,
              color: DESIGN.colors.text.primary,
              border: `1px solid ${DESIGN.colors.border}`,
              boxShadow: DESIGN.shadows.glass,
            }}
            onClick={onNotifications}
          >
            <IconBase icon={Bell} size="row" />
            {unread > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full text-[11px] leading-[20px] font-bold inline-flex items-center justify-center"
                style={{
                  background: DESIGN.colors.accent.primary,
                  color: "#0a0a12",
                  border: `1px solid ${DESIGN.colors.border}`,
                }}
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>

        </div>
      )}
    </div>
  );
}

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = (useAuth() as any) || {};
  const unreadTotal = useUnreadTotal();

  const items = useItems(user, unreadTotal);

  return (
    <aside
      className={[
        "hidden lg:flex fixed left-0 top-0 z-20 h-full",
        isCollapsed ? "w-24" : "w-72",
      ].join(" ")}
      aria-label="Sidebar"
      style={{ pointerEvents: "none" }}
    >
      <div className="flex h-full w-full p-3" style={{ pointerEvents: "auto" }}>
        <div
          className="flex flex-col w-full rounded-2xl border backdrop-blur-xl"
          style={{
            borderColor: DESIGN.colors.border,
            background: DESIGN.colors.background.glass,
            boxShadow: DESIGN.shadows.glass,
          }}
        >
          {/* header — АНИМИРОВАННЫЙ ЗАГОЛОВОК */}
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center justify-between mb-2">
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
            </div>
          </div>

          {/* Блок пользователя */}
          <div className="px-3">
            <UserCard
              user={user}
              unread={unreadTotal}
              collapsed={!!isCollapsed}
              onSettings={() => navigate(ensureAuth(user, "/profile"))}
              onNotifications={() => navigate(ensureAuth(user, "/notifications"))}
            />
          </div>

          {/* Навигация */}
          <nav className="flex-1 px-3 py-2 space-y-2">
            {items.map(({ to, title, Icon, badge }) => {
              const active = location.pathname === to || location.pathname.startsWith(to);
              return (
                <Row
                  key={title}
                  Icon={Icon}
                  title={title}
                  to={to}
                  active={!!active}
                  collapsed={!!isCollapsed}
                  badge={badge}
                />
              );
            })}

            {/* Админ-панель */}
            {isAdmin(user) && (
              <div className="pt-2">
                {!isCollapsed && (
                  <p className="px-2 pb-2 text-xs uppercase tracking-wide" style={{ color: DESIGN.colors.text.muted }}>
                    Управление
                  </p>
                )}
                <Row
                  Icon={Settings}
                  title="Админ-панель"
                  to="/admin"
                  active={location.pathname.startsWith("/admin")}
                  collapsed={!!isCollapsed}
                />
              </div>
            )}
          </nav>

          {/* Telegram — строка такого же размера, как пункты меню */}
          {!isCollapsed && (
            <div className="px-3 pb-3">
              <a
                href="https://t.me/cascharacter"
                target="_blank"
                rel="noopener noreferrer"
                className="relative overflow-hidden rounded-2xl border flex items-center gap-3 px-3 py-2"
                style={{
                  borderColor: DESIGN.colors.border,
                  background: `linear-gradient(135deg, #4facfe, #00f2fe)`,
                  color: "#ffffff",
                  boxShadow: "0 6px 20px rgba(79, 172, 254, 0.3)",
                }}
              >
                <div
                  className="inline-flex items-center justify-center shrink-0 rounded-full"
                  style={{ width: 44, height: 44, background: "rgba(255, 255, 255, 0.2)" }}
                >
                  <IconBase icon={Send} size="row" style={{ color: "#ffffff" }} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-bold">Telegram Канал</p>
                </div>

                <IconBase icon={ChevronRight} size="row" />
              </a>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
