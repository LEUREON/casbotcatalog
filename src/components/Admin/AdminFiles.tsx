import React, { useEffect, useMemo, useState } from "react";
import { Clipboard, ExternalLink, Users, User, File } from "lucide-react";
import { useData } from "../../contexts/DataContext";

const ACCENT = "#f7cfe1";
const BORDER = "rgba(255,255,255,0.10)";

function surfaceStyle({
  elevated = false,
  active = false,
}: { elevated?: boolean; active?: boolean } = {}) {
  const baseAlpha = elevated ? 0.09 : 0.07;
  const shadow = elevated
    ? "0 14px 36px rgba(0,0,0,0.40)"
    : "0 8px 22px rgba(0,0,0,0.30)";
  return {
    background: `
      radial-gradient(600px 260px at 0% 0%, rgba(247, 207, 225,0.10), transparent 60%),
      radial-gradient(600px 260px at 100% 100%, rgba(120,140,255,0.09), transparent 60%),
      rgba(255,255,255,${baseAlpha})
    `,
    border: `1px solid ${active ? ACCENT : BORDER}`,
    boxShadow: active ? `${shadow}, inset 0 0 0 1px ${ACCENT}` : shadow,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  } as React.CSSProperties;
}

type FileItem = {
  id: string;
  collectionName: "users" | "characters";
  recordId: string;
  fileName: string;
  fileUrl: string;
  contextName: string;
};

export function AdminFiles() {
  const { users, characters, loadUsers, loadCharacters } = useData();
  const [active, setActive] = useState<"users" | "characters">("users");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!users?.length) loadUsers?.();
    if (!characters?.length) loadCharacters?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items: FileItem[] = useMemo(() => {
    const out: FileItem[] = [];

    (users || []).forEach((u: any) => {
      const url = u?.avatar;
      if (url && typeof url === "string" && url.includes("/api/files/")) {
        out.push({
          id: `${u.id}-avatar`,
          collectionName: "users",
          recordId: u.id,
          fileName: url.split("/").pop()?.split("?")[0] || "avatar",
          fileUrl: url,
          contextName: u.nickname || u.username || "Пользователь",
        });
      }
    });

    (characters || []).forEach((c: any) => {
      const url = c?.photo;
      if (url && typeof url === "string" && url.includes("/api/files/")) {
        out.push({
          id: `${c.id}-photo`,
          collectionName: "characters",
          recordId: c.id,
          fileName: url.split("/").pop()?.split("?")[0] || "photo",
          fileUrl: url,
          contextName: c.name || "Персонаж",
        });
      }
    });

    return out;
  }, [users, characters]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items
      .filter((i) => i.collectionName === active)
      .filter(
        (i) =>
          i.fileName.toLowerCase().includes(q) ||
          i.contextName.toLowerCase().includes(q)
      );
  }, [items, active, query]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Табы */}
        <div className="rounded-2xl p-1 flex" style={surfaceStyle()}>
          <button
            onClick={() => setActive("users")}
            className="w-1/2 px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            style={surfaceStyle({ active: active === "users" })}
          >
            <User size={16} /> Пользователи
          </button>
          <button
            onClick={() => setActive("characters")}
            className="w-1/2 px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            style={surfaceStyle({ active: active === "characters" })}
          >
            <Users size={16} /> Персонажи
          </button>
        </div>

        {/* Поиск */}
        <div className="sm:col-span-2 rounded-2xl p-2 flex items-center gap-2" style={surfaceStyle()}>
          <File size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени файла или объекту…"
            className="w-full bg-transparent outline-none text-sm placeholder-white/70"
          />
        </div>
      </div>

      {/* Грид файлов */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filtered.map((f) => (
          <div key={f.id} className="rounded-2xl p-3 sm:p-4" style={surfaceStyle()}>
            <div className="flex items-center gap-3">
              <img
                src={f.fileUrl}
                alt={f.fileName}
                className="w-16 h-16 rounded-xl object-cover border"
                style={{ borderColor: BORDER }}
              />
              <div className="min-w-0">
                <div className="font-medium truncate">{f.fileName}</div>
                <div className="text-xs opacity-80 truncate">
                  {f.collectionName} • {f.contextName}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => navigator.clipboard?.writeText(f.fileUrl)}
                className="rounded-xl px-3 py-2 border text-sm font-medium flex items-center justify-center gap-2"
                style={{ borderColor: BORDER, background: "rgba(255,255,255,0.03)" }}
              >
                <Clipboard size={16} /> Копировать URL
              </button>
              <a
                href={f.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-black flex items-center justify-center gap-2"
                style={{ background: ACCENT }}
              >
                <ExternalLink size={16} /> Открыть
              </a>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-4 rounded-2xl p-5 text-center opacity-70" style={surfaceStyle()}>
          Ничего не найдено.
        </div>
      )}
    </div>
  );
}