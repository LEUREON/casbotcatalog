import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Compass, BarChart2, Heart, Users, ShoppingBag, Bell, LifeBuoy, Bot, Plus,
  Settings, LogOut, LogIn, ChevronRight, Cat
} from "lucide-react";
import IconBase from "../ui/IconBase";
import ThemedBackground from "../common/ThemedBackground";
import { useAuth } from "../../contexts/AuthContext";
import { useUnreadTotal } from "../../hooks/useUnreadTotal";

type SidebarProps = {
  isCollapsed?: boolean;
  setCollapsed?: (v: boolean) => void;
}; 

const TOKENS = {
  border: "rgba(255,255,255,0.16)",
  itemBg: "rgba(255,255,255,0.03)",
  itemBgActive: "rgba(255,255,255,0.07)",
  accent: "#f7cfe1",
  accentRgb: "247, 207, 225",
  badgeMax: 99,
};

const ensureAuth = (user: any, to: string) =>
  !user ? `/login?next=${encodeURIComponent(to)}` : to;

const isAdmin = (user: any) =>
  !!user && (user.isAdmin || user?.role === "admin" || user?.is_staff);

const BADGE_LIMIT = TOKENS.badgeMax;

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = (useAuth() as any) || {};
  const user = auth?.user;
  const unread = useUnreadTotal?.() ?? 0;

  const groups = React.useMemo(() => {
    type Item = { icon: React.ElementType; title: string; to?: string; onClick?: () => void; badge?: number };
    const g: { title: string; items: Item[] }[] = [
      {
        title: "Разделы",
        items: [
          { icon: Compass,   title: "Каталог",     to: "/characters" }, 
          { icon: BarChart2, title: "Рейтинг",     to: "/rating" },
          { icon: ShoppingBag, title: "Магазин", to: "/shop" },
          { icon: Heart,     title: "Избранное",   to: ensureAuth(user, "/favorites") },
        ],
      },
      
    ];

    if (isAdmin(user)) {
      g.push({
        title: "Управление",
        items: [{ icon: Settings, title: "Админ-панель", to: "/admin" }],
      });
    }

    return g;
  }, [user]);

  const isActive = (to?: string) =>
    !!to && (location.pathname === to || location.pathname.startsWith(to + "/"));

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
    } catch {}
  };

  return (
    <aside
      className={[
        "hidden lg:flex lg:fixed lg:inset-y-0 lg:z-40",
        isCollapsed ? "lg:w-24" : "lg:w-72",
      ].join(" ")}
      aria-label="Sidebar"
    >
      <div className="relative h-full w-full border-r border-white/10 bg-black/40 backdrop-blur-xl">
        <ThemedBackground intensity={0.95} animated />

        {/* каркас: сверху контент со скроллом, снизу фиксированный профиль */}
        <div className="relative h-full flex flex-col">
          {/* SCROLL AREA */}
          <div className="flex-1 overflow-y-auto p-4" style={{ background: "linear-gradient(180deg, rgba(20,20,24,0.40), rgba(20,20,24,0.40))" }}> 
            {/* Header */}
            <div className="mb-4 flex items-center gap-2">
              <span
                className="rounded-xl px-2.5 py-1 text-[11px] uppercase tracking-widest leading-none inline-flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${TOKENS.border}` }}
              >
              BETA
              </span>
              <h1 className="font-display text-xl font-semibold text-white">CAS Каталог</h1>
            </div>

            {/* Секции */}
            {groups.map((g) => (
              <section key={g.title} className="mb-5">
                <h3 className="px-1 mb-2 text-[12px] tracking-wider uppercase opacity-70">
                  {g.title}
                </h3>
                <div className="flex flex-col gap-2">
                  {g.items.map(({icon, title, to, onClick, badge}) => (
                    <Row
                      key={title}
                      Icon={icon}
                      title={title}
                      to={to}
                      onClick={onClick}
                      active={isActive(to)}
                      badge={typeof badge === "number" && badge > 0 ? (badge > BADGE_LIMIT ? `${BADGE_LIMIT}+` : String(badge)) : undefined}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* FIXED FOOTER: USER BLOCK */}
          <div className="sticky bottom-0 z-[1] p-4 border-t border-white/10 bg-black/40 backdrop-blur-xl">
            {user ? (
              <ProfileFooter
                user={user}
                unread={unread}
                onOpenSettings={() => navigate(ensureAuth(user, "/profile"))}
                onOpenNotifications={() => navigate(ensureAuth(user, "/notifications"))}
                onLogout={handleLogout}
              />
            ) : (
              <LoginFooter onLogin={() => navigate("/login")} />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ───────────────── components ───────────────── */

function Row({ Icon, title, to, onClick, active, badge }: {
  Icon: React.ElementType;
  title: string;
  to?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: string;
}) {
  const Wrap: any = to ? Link : "button";
  const wrapProps: any = to ? { to } : { type: "button", onClick };

  return (
    <Wrap
      {...wrapProps}
      className="relative overflow-hidden rounded-2xl border flex items-center gap-3 px-3 py-2"
      style={{
        borderColor: TOKENS.border,
        background: active ? TOKENS.itemBgActive : TOKENS.itemBg,
        boxSizing: "border-box" as const,
        boxShadow: active ? `inset 0 0 0 1px ${TOKENS.accent}` : "none",
      }}
    >
      <div
        className="grid place-items-center border shrink-0 rounded-full relative"
        style={{
          width: 40, height: 40, borderColor: active ? `rgba(${TOKENS.accentRgb}, .6)` : TOKENS.border,
          background: "rgba(255,255,255,0.06)",
        }}
      >
        <IconBase icon={Icon} />
        <AnimatePresence>
          {badge && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[11px] leading-none font-bold inline-flex items-center justify-center leading-none"
              style={{ background: TOKENS.accent, color: "#111", border: `1px solid ${TOKENS.border}` }}
            >
              {badge}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold whitespace-nowrap overflow-hidden text-ellipsis" style={{ fontSize: "clamp(13px,3.2vw,15px)", lineHeight: 1.2 }}>
          {title}
        </p>
      </div>

      {to && (
        <span className="opacity-60 leading-none inline-flex items-center justify-center">
          <IconBase icon={ChevronRight} />
        </span>
      )}
    </Wrap>
  );
}

/* ——— нижний фиксированный блок — ПОЛЬЗОВАТЕЛЬ ——— */

function ProfileFooter({
  user,
  unread,
  onOpenSettings,
  onOpenNotifications,
  onLogout,
}: {
  user: any;
  unread: number;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
}) {
  const avatar = user?.avatarUrl || user?.avatar_url || user?.avatar || "";
  const displayName = user?.nickname || user?.login || "Профиль";

  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[.03] p-4">
      {/* верхняя панель действий — две компактные кнопки с подписью справа от иконки */}
      <div className="flex items-center gap-2 mb-3">
        {/* Настройки */}
        <button
          type="button"
          aria-label="Настройки"
          className="inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-sm"
          style={{ borderColor: TOKENS.border, background: "transparent" }}
          onClick={onOpenSettings}
        >
          <span
            className="inline-flex items-center justify-center rounded-full border leading-none"
            style={{ width: 28, height: 28, borderColor: TOKENS.border, background: "rgba(255,255,255,0.06)" }}
          >
            <IconBase icon={Settings} />
          </span>
         </button>

        {/* Уведомления */}
        <button
          type="button"
          aria-label="Уведомления"
          className="relative inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-sm"
          style={{ borderColor: TOKENS.border, background: "transparent" }}
          onClick={onOpenNotifications}
        >
          <span
            className="inline-flex items-center justify-center rounded-full border relative leading-none"
            style={{ width: 28, height: 28, borderColor: TOKENS.border, background: "rgba(255,255,255,0.06)" }}
          >
            <IconBase icon={Bell} />
            {unread > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 rounded-full text-[10px] font-bold px-1.5 h-4 leading-none inline-flex items-center justify-center"
                style={{ background: TOKENS.accent, color: "black" }}
              >
                {unread > BADGE_LIMIT ? `${BADGE_LIMIT}+` : unread}
              </span>
            )}
          </span>
          <span className="text-white/90 leading-none inline-flex items-center justify-center">Уведомления</span>
        </button>

        {/* (опционально) выход можно оставить/скрыть при необходимости
        <button
          onClick={onLogout}
          className="h-10 w-10 rounded-full bg-pink-300 text-black grid place-items-center hover:brightness-95 active:brightness-90"
          title="Выйти"
          type="button"
        >
          <IconBase icon={LogOut} />
        </button>
        */}
      </div>

      {/* данные пользователя — только ник/логин, без email */}
      <div className="flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={displayName}
            className="w-12 h-12 rounded-full border border-white/15 object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-accent border-white/15 grid place-items-center text-black" style={{ background: TOKENS.accent }}>
            <Cat className="text-black w-[22px] h-[22px]" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="font-semibold text-white truncate">{displayName}</div>
          {/* email удалён по требованию */}
        </div>
      </div>
    </div>
  );
}

function LoginFooter({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/[.03] p-4 flex items-center justify-center">
      <button
        onClick={onLogin}
        className="shrink-0 rounded-2xl font-semibold hover:brightness-95 active:brightness-90 w-full px-6 h-12"
        style={{ 
          backgroundColor: '#f7cfe1',
          color: 'var(--accent-contrast, #000000) !important',
          border: 'none',
          textShadow: 'none',
          fontSize: '1rem',
          lineHeight: '1.5rem',
          fontWeight: 'bold'
        }}
      >
        Войти
      </button>
    </div>
  );
}
