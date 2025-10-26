// src/pages/SubmitCharacterPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import ThemedBackground from "../components/common/ThemedBackground";
import { GlassPanel } from "../components/ui/GlassPanel";
import { useAuth } from "../contexts/AuthContext";
import { pb } from "../lib/pocketbase";
import { ANIM } from "../lib/animations";
import { IconArrowLeft, IconLoader } from "../components/ui/icons";
import {
  AlertTriangle,
  Save,
  Trash2,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  List,
  Link as LinkIcon,
  Type,
  CheckCircle,
} from "lucide-react";

/* ============================ Types ============================ */
type Status = "draft" | "pending" | "approved" | "rejected";
type LinkItem = { label?: string; url: string };

type FormShape = {
  id?: string;
  user?: string;
  name: string;
  occupation: string;
  description: string;
  fullDescription: string; // HTML
  gender?: "male" | "female";
  age?: number | null;
  ageGroup?: "18+" | "30+" | "immortal" | "";
  tags: string[];
  category: string[];
  links: LinkItem[];
  status: Status;
  photo?: string | File | null;
  created?: string;
  updated?: string;
};

const emptyForm: FormShape = {
  name: "",
  occupation: "",
  description: "",
  fullDescription: "",
  gender: undefined,
  age: undefined,
  ageGroup: "",
  tags: [],
  category: [],
  links: [],
  status: "approved", 
  photo: null,
};

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

/* ====== Лёгкий HTML-редактор (без изменений) ====== */
function HtmlEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== (value || "")) el.innerHTML = value || "";
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    if (disabled) return;
    document.execCommand(cmd, false, val);
    ref.current?.focus();
  };

  const askLink = () => {
    const url = prompt("Вставьте ссылку (https://…)");
    if (url) exec("createLink", url);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => exec("bold")} disabled={disabled} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-sm inline-flex items-center gap-2">
          <Bold size={16}/> Жирн.
        </button>
        <button type="button" onClick={() => exec("italic")} disabled={disabled} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-sm inline-flex items-center gap-2">
          <Italic size={16}/> Курс.
        </button>
        <button type="button" onClick={() => exec("underline")} disabled={disabled} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-sm inline-flex items-center gap-2">
          <Underline size={16}/> Подч.
        </button>
        <button type="button" onClick={() => exec("insertUnorderedList")} disabled={disabled} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-sm inline-flex items-center gap-2">
          <List size={16}/> Список
        </button>
        <button type="button" onClick={() => exec("formatBlock", "h2")} disabled={disabled} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-sm inline-flex items-center gap-2">
          <Type size={16}/> H2
        </button>
        <button type="button" onClick={() => exec("formatBlock", "h3")} disabled={disabled} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-sm inline-flex items-center gap-2">
          <Type size={16}/> H3
        </button>
        <button type="button" onClick={askLink} disabled={disabled} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-sm inline-flex items-center gap-2">
          <LinkIcon size={16}/> Ссылка
        </button>
        <button type="button" onClick={() => exec("removeFormat")} disabled={disabled} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-sm">
          Очистить
        </button>
      </div>

      <div
        ref={ref}
        contentEditable={!disabled}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="min-h-[220px] w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none prose prose-invert max-w-none"
        style={{ lineHeight: 1.6 }}
        suppressContentEditableWarning
      />
    </div>
  );
}

/* ============================ Page (без изменений) ============================ */
export function SubmitCharacterPage() {
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id: string }>();
  const query = useQuery();
  const queryEdit = query.get("edit") || undefined;
  const editId = routeId || queryEdit;

  const { user } = useAuth();

  const [form, setForm] = useState<FormShape>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(!!editId);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // chip inputs
  const [catInput, setCatInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const sanitizeError = (msg?: string | null): string | null => {
    if (!msg) return null;
    const low = msg.toLowerCase();
    if (low.includes("autocancel")) return null;
    return msg;
  };

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const rec = await pb.collection("user_characters").getOne(editId);
        if (cancelled) return;

        const links = Array.isArray(rec.links)
          ? rec.links.map((l: any) => (typeof l === "string" ? { url: l } : l)).filter((l: any) => l && l.url)
          : [];
        const tags = Array.isArray(rec.tags) ? rec.tags : [];
        const cats = Array.isArray(rec.category) ? rec.category : rec.category ? [rec.category] : [];

        setForm({
          id: rec.id,
          user: rec.user,
          name: rec.name ?? "",
          occupation: rec.occupation ?? "",
          description: rec.description ?? "",
          fullDescription: rec.fullDescription ?? "",
          gender: rec.gender ?? undefined,
          age: typeof rec.age === "number" ? rec.age : undefined,
          ageGroup: (rec.ageGroup as any) || "",
          tags,
          category: cats,
          links,
          status: rec.status || "approved", 
          photo: rec.photo ?? null,
          created: rec.created,
          updated: rec.updated,
        });
      } catch (e: any) {
        const s = sanitizeError(e?.message);
        if (s) setError(s);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [editId]);

  const isOwner = !!(user && form.user && (user.id === form.user));
  const isAdmin = !!(user?.role === "admin");
  const canEdit = !!user && (isAdmin || isOwner || !editId);

  const previewUrl = useMemo(() => {
    if (photoFile) return URL.createObjectURL(photoFile);
    if (form.photo && typeof form.photo === "string" && form.id) {
      return `${pb.baseUrl}/api/files/user_characters/${form.id}/${form.photo}`;
    }
    return "";
  }, [photoFile, form.photo, form.id]);

  /* ============================ Helpers (без изменений) ============================ */
  const setField = <K extends keyof FormShape>(key: K, value: FormShape[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const applyAutoAgeGroup = (ageVal?: number | null) => {
    if (ageVal === null || ageVal === undefined || Number.isNaN(ageVal)) {
      setField("ageGroup", "");
      return;
    }
    if (ageVal === 0) return setField("ageGroup", "immortal"); // 0 = бессмертный
    if (ageVal >= 30) return setField("ageGroup", "30+");
    if (ageVal >= 18) return setField("ageGroup", "18+");
    setField("ageGroup", "");
  };

  const addCategory = (raw?: string) => {
    const val = (raw ?? catInput).trim();
    if (!val) return;
    setForm((p) => (p.category.includes(val) ? p : { ...p, category: [...p.category, val] }));
    setCatInput("");
  };
  const removeCategory = (value: string) =>
    setForm((p) => ({ ...p, category: p.category.filter((c) => c !== value) }));

  const addTag = (raw?: string) => {
    const val = (raw ?? tagInput).trim();
    if (!val) return;
    setForm((p) => (p.tags.includes(val) ? p : { ...p, tags: [...p.tags, val] }));
    setTagInput("");
  };
  const removeTag = (value: string) =>
    setForm((p) => ({ ...p, tags: p.tags.filter((t) => t !== value) }));

  const addLink = () =>
    setForm((p) => ({ ...p, links: [...p.links, { url: "", label: "" }] }));
  const updateLink = (idx: number, field: "url" | "label", value: string) =>
    setForm((p) => {
      const links = [...p.links];
      links[idx] = { ...links[idx], [field]: value };
      return { ...p, links };
    });
  const removeLink = (idx: number) =>
    setForm((p) => ({ ...p, links: p.links.filter((_, i) => i !== idx) }));

  /* ============================ Save / Delete ============================ */
  const onSave = async () => {
    if (!canEdit || !user) {
      setError("Вы должны быть авторизованы для сохранения.");
      return;
    }
      
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      applyAutoAgeGroup(form.age);

      const fd = new FormData();
      fd.set("name", form.name);
      fd.set("occupation", form.occupation);
      fd.set("description", form.description);
      fd.set("fullDescription", form.fullDescription);
      if (form.gender) fd.set("gender", form.gender);
      if (form.age !== undefined && form.age !== null) fd.set("age", String(form.age));
      if (form.ageGroup) fd.set("ageGroup", form.ageGroup);
      
      fd.set("tags", JSON.stringify(form.tags || []));
      fd.set("category", JSON.stringify(form.category || []));
      fd.set(
        "links",
        JSON.stringify(
          (form.links || [])
            .map((l) => ({ url: (l.url || "").trim(), label: (l.label || "").trim() || undefined }))
            .filter((l) => l.url)
        )
      );
      
      if (photoFile) fd.set("photo", photoFile);

      if (editId) {
        // При ОБНОВЛЕНИИ - не отправляем 'user' или 'status'
        await pb.collection("user_characters").update(editId, fd);
      } else {
        // При СОЗДАНИИ
        fd.set("status", "approved"); // Устанавливаем статус
        
        // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
        // Мы ДОЛЖНЫ отправлять ID пользователя при создании
        fd.set("user", user.id); 
        // -------------------------
        
        const created = await pb.collection("user_characters").create(fd);
        navigate(`/submit-character/${created.id}`, { replace: true });
      }

      if (editId) {
        const rec = await pb.collection("user_characters").getOne(editId);
        setField("updated", rec.updated);
        setField("status", rec.status || "approved"); 
        if (rec.photo) setField("photo", rec.photo);
        setPhotoFile(null);
      }

      setSuccess("Персонаж сохранён");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      const s = sanitizeError(e?.message) || null;
      if (s) setError(s);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!editId || !canEdit) return; 
    try {
      setDeleting(true);
      setError(null);
      await pb.collection("user_characters").delete(editId);
      navigate("/favorites", { replace: true });
    } catch (e: any) {
      const s = sanitizeError(e?.message) || null;
      if (s) setError(s);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const disableActions = saving || deleting || !canEdit;

  /* ============================ UI (без изменений) ============================ */
  
  if (loading) {
     return (
        <div className="relative min-h-screen p-3 sm:p-5 font-body text-text-primary bg-dark">
            <ThemedBackground intensity={0.2} />
             <GlassPanel className="py-16 text-center max-w-4xl mx-auto mt-20">
                <div className="inline-flex items-center gap-3 text-white/80">
                  <IconLoader />
                  Загрузка…
                </div>
            </GlassPanel>
        </div>
     );
  }
  
  if (!canEdit && !loading) {
     return (
        <div className="relative min-h-screen p-3 sm:p-5 font-body text-text-primary bg-dark">
            <ThemedBackground intensity={0.2} />
             <motion.button
                {...ANIM.buttonTap}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                onClick={() => navigate(-1)}
                className="fixed top-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center bg-floating backdrop-blur-lg shadow-glass"
                aria-label="Назад"
            >
                <IconArrowLeft />
            </motion.button>
             <GlassPanel className="py-16 text-center max-w-4xl mx-auto mt-20">
                <div className="inline-flex items-center gap-3 text-rose-300">
                  <AlertTriangle />
                  { user ? "У вас нет прав на редактирование этого персонажа." : "Вы должны войти в систему для доступа к этой странице." }
                </div>
            </GlassPanel>
        </div>
     );
  }

  return (
    <div
      className="relative min-h-screen p-3 sm:p-5 font-body text-text-primary bg-dark"
      style={{ paddingBottom: 120 }}
    >
      <ThemedBackground intensity={0.2} />

      <motion.button
        {...ANIM.buttonTap}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center bg-floating backdrop-blur-lg shadow-glass"
        aria-label="Назад"
      >
        <IconArrowLeft />
      </motion.button>

      <div className="relative z-10 w-full max-w-4xl mx-auto space-y-6">
        <motion.div {...ANIM.fadeInUp(0.05)} className="text-center">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight"
            style={{
              background: "linear-gradient(120deg, #ffffff 0%, #d7aefb 50%, #ff6bd6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "0 4px 12px rgba(0,0,0,0.2)",
              fontFamily: "var(--font-family-heading)",
            }}
          >
            {editId ? "Редактировать персонажа" : "Добавить персонажа"}
          </h1>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-xl border border-rose-400/30 bg-rose-400/10 text-rose-50 p-3 text-sm"
              role="alert"
            >
              <div className="inline-flex items-center gap-2"><AlertTriangle size={16} /> {error}</div>
            </motion.div>
          )}
        </AnimatePresence>
        
          <>
            <GlassPanel className="p-4 sm:p-5 lg:p-6">
              <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
                {/* Фото */}
                <div>
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                    {previewUrl ? (
                      <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-white/50 flex flex-col items-center">
                        <ImageIcon className="mb-2" />
                        <span className="text-sm">Нет фото</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex justify-center">
                    <label className={`inline-flex items-center gap-2 px-4 h-11 rounded-full text-white font-medium select-none ${!canEdit ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                      style={{ background: "linear-gradient(135deg,#ff6bd6,#8a75ff)" }}>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={!canEdit}
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      Загрузить фото
                    </label>
                  </div>
                  {photoFile && (
                    <div className="text-xs text-white/70 mt-2 text-center">
                      Выбрано: {photoFile.name}
                    </div>
                  )}

                  <div className="text-xs text-white/50 mt-2 text-center">
                    На странице будет бейдж «Создано пользователем».
                  </div>
                </div>

                {/* Поля */}
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-white/70">Имя</label>
                    <input
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      disabled={!canEdit}
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none disabled:opacity-50"
                      placeholder="Имя персонажа"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-white/70">Род деятельности</label>
                    <input
                      value={form.occupation}
                      onChange={(e) => setField("occupation", e.target.value)}
                      disabled={!canEdit}
                      className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none disabled:opacity-50"
                      placeholder="Род деятельности"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-white/70">Короткое описание</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      disabled={!canEdit}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none disabled:opacity-50"
                      placeholder="1–3 предложения"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-white/70">Полное описание</label>
                    <HtmlEditor
                      value={form.fullDescription}
                      onChange={(html) => setField("fullDescription", html)}
                      disabled={!canEdit}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1 text-white/70">Пол</label>
                      <select
                        value={form.gender || ""}
                        onChange={(e) => setField("gender", (e.target.value || undefined) as any)}
                        disabled={!canEdit}
                        className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 outline-none disabled:opacity-50"
                      >
                        <option value="">—</option>
                        <option value="male">Мужской</option>
                        <option value="female">Женский</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm mb-1 text-white/70">
                        Возраст <span className="opacity-60">(0 = Бессмертный)</span>
                      </label>
                      <input
                        type="number"
                        value={form.age ?? ""}
                        onChange={(e) => {
                          const n = e.target.value ? Number(e.target.value) : undefined;
                          setField("age", n);
                          applyAutoAgeGroup(n);
                        }}
                        disabled={!canEdit}
                        className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none disabled:opacity-50"
                        placeholder="например, 25"
                      />
                    </div>
                  </div>

                  {/* Категории */}
                  <div>
                    <label className="block text-sm mb-1 text-white/70">Категории</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.category.map((c) => (
                        <span key={c} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm">
                          {c}
                          <button type="button" disabled={!canEdit} className="opacity-70 hover:opacity-100 disabled:opacity-30" onClick={() => removeCategory(c)} aria-label="Удалить категорию">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <input
                        value={catInput}
                        onChange={(e) => setCatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            addCategory();
                          }
                        }}
                        disabled={!canEdit}
                        className="flex-1 min-w-[220px] h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none disabled:opacity-50"
                        placeholder="Введите категорию"
                      />
                      <button
                        type="button"
                        onClick={() => addCategory()}
                        disabled={!canEdit}
                        className="px-4 h-11 rounded-xl text-white font-medium disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#9ca3af,#6b7280)" }}
                      >
                        Добавить
                      </button>
                    </div>
                  </div>

                  {/* Теги */}
                  <div>
                    <label className="block text-sm mb-1 text-white/70">Теги</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.tags.map((t) => (
                        <span key={t} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm">
                          {t}
                          <button type="button" disabled={!canEdit} className="opacity-70 hover:opacity-100 disabled:opacity-30" onClick={() => removeTag(t)} aria-label="Удалить тег">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        disabled={!canEdit}
                        className="flex-1 min-w-[220px] h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none disabled:opacity-50"
                        placeholder="Введите тег"
                      />
                      <button
                        type="button"
                        onClick={() => addTag()}
                        disabled={!canEdit}
                        className="px-4 h-11 rounded-xl text-white font-medium disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#9ca3af,#6b7280)" }}
                      >
                        Добавить
                      </button>
                    </div>
                  </div>

                  {/* Ссылки */}
                  <div>
                    <label className="block text-sm mb-1 text-white/70">Ссылки</label>
                    {form.links.length === 0 && (
                      <button
                        type="button"
                        onClick={addLink}
                        disabled={!canEdit}
                        className="text-sm underline text-white/70 disabled:opacity-50"
                      >
                        Добавить ссылку
                      </button>
                    )}
                    <div className="mt-2 space-y-2">
                      {form.links.map((l, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_240px_40px] gap-2">
                          <input
                            value={l.url}
                            onChange={(e) => updateLink(idx, "url", e.target.value)}
                            disabled={!canEdit}
                            className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none disabled:opacity-50"
                            placeholder="https://..."
                          />
                          <input
                            value={l.label || ""}
                            onChange={(e) => updateLink(idx, "label", e.target.value)}
                            disabled={!canEdit}
                            className="h-11 px-4 rounded-xl bg-white/5 border border-white/10 outline-none disabled:opacity-50"
                            placeholder="Подпись (необязательно)"
                          />
                          <button
                            type="button"
                            onClick={() => removeLink(idx)}
                            disabled={!canEdit}
                            className="h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center disabled:opacity-50"
                            title="Удалить ссылку"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    {form.links.length > 0 && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={addLink}
                          disabled={!canEdit}
                          className="px-4 h-10 rounded-xl text-white font-medium disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg,#9ca3af,#6b7280)" }}
                        >
                          Добавить ещё
                        </button>
                      </div>
                    )}
                  </div>

                  {(form.created || form.updated) && (
                    <div className="text-xs text-white/50">
                      {form.created && <>Создано: {new Date(form.created).toLocaleString()} • </>}
                      {form.updated && <>Обновлено: {new Date(form.updated).toLocaleString()}</>}
                    </div>
                  )}
                </div>
              </div>
            </GlassPanel>

            <div className="flex flex-wrap gap-3 justify-center mb-4">
              <motion.button
                {...ANIM.buttonTap}
                onClick={onSave}
                disabled={disableActions}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#ff6bd6,#8a75ff)" }}
                title="Сохранить"
              >
                {saving ? <IconLoader /> : <Save size={16} />} Сохранить
              </motion.button>

              {editId && (
                <motion.button
                  {...ANIM.buttonTap}
                  onClick={() => setConfirmOpen(true)}
                  disabled={deleting || !canEdit}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}
                  title="Удалить персонажа"
                >
                  {deleting ? <IconLoader /> : <Trash2 size={16} />} Удалить
                </motion.button>
              )}
            </div>

            <AnimatePresence>
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-50 p-3 text-sm text-center"
                  role="status"
                  aria-live="polite"
                >
                  <div className="inline-flex items-center gap-2"><CheckCircle size={16} /> {success}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-20 sm:h-6" />
          </>
        
      </div>

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmOpen(false)} />
            <motion.div
              {...ANIM.fadeInUp(0.05)}
              className="relative z-10 w-[92%] max-w-md"
            >
              <GlassPanel className="p-5">
                <h3 className="text-xl font-bold mb-2">Удалить персонажа?</h3>
                <p className="text-white/70 mb-4">Действие необратимо. Точно хотите удалить?</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setConfirmOpen(false)}
                    className="px-4 h-11 rounded-xl bg-white/10 border border-white/15 text-white"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={doDelete}
                    className="px-4 h-11 rounded-xl text-white"
                    style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}
                  >
                    Удалить
                  </button>
                </div>
              </GlassPanel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SubmitCharacterPage;