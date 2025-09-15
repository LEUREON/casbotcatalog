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

const ACCENT = "#f7cfe1";
const BORDER = "rgba(255,255,255,0.10)";

function surfaceStyle({
  active = false,
}: { elevated?: boolean; active?: boolean } = {}) {
  const baseAlpha = 0.07;
  return {
    background: `
      radial-gradient(600px 260px at 0% 0%, rgba(247, 207, 225,0.10), transparent 60%),
      radial-gradient(600px 260px at 100% 100%, rgba(120,140,255,0.09), transparent 60%),
      rgba(255,255,255,${baseAlpha})
    `,
    border: `1px solid ${active ? ACCENT : BORDER}`,
    boxShadow: active ? `inset 0 0 0 1px ${ACCENT}` : "none",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  } as React.CSSProperties;
}

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
      <div className="max-w-screen-md mx-auto px-4 py-6">
        <div className="rounded-2xl p-5" style={surfaceStyle({ elevated: true })}>
          <p className="text-lg font-semibold">Доступ запрещён</p>
          <p className="opacity-70 mt-2">
            Эта страница доступна только администраторам.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <header className="mb-5">
        <div className="flex items-center gap-3">
          <div
            className="size-10 rounded-2xl flex items-center justify-center"
            style={surfaceStyle()}
          >
            <Shield size={18} />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
              Панель администратора
            </h1>
            <p className="text-sm opacity-70 mt-0.5">
              Управляйте контентом, пользователями и сервисом
            </p>
          </div>
        </div>
      </header>

      <nav className="mb-5">
        {/* Класс 'hidden' удален, 'grid-cols-2' будет применяться на мобильных */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {tabs.map(({ id, label, icon: Icon }) => {
            const activeNow = active === id;
            return (
              <button
                key={id}
                onClick={() => setActive(id)}
                className="group w-full"
              >
                <div
                  className="w-full rounded-2xl px-3 py-3 flex items-center gap-3"
                  style={surfaceStyle({ active: activeNow })}
                >
                  <div className="rounded-xl p-2 shrink-0" style={surfaceStyle()}>
                    <Icon size={18} />
                  </div>
                  <span className="text-sm font-medium truncate">{label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      <section
        className="rounded-3xl overflow-hidden"
        style={surfaceStyle({ elevated: true })}
      >
        {renderContent()}
      </section>
    </div>
  );
}