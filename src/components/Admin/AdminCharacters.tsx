import React, { useRef, useState } from "react";
import {
  Plus, Edit, Trash2, X,
  Bold, Italic, Code as CodeIcon,
  Heading2, Heading3, List, ListOrdered, Quote,
  Eye, EyeOff
} from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { Character, CharacterLink } from "../../types";
import { getAgeGroup } from "../../utils/getAgeGroup";

const ACCENT = "#f7cfe1";
const BORDER = "rgba(255,255,255,0.10)";

function surfaceStyle({ elevated = false }: { elevated?: boolean } = {}) {
  const baseAlpha = elevated ? 0.09 : 0.07;
  return {
    background: `rgba(255,255,255,${baseAlpha})`,
    border: `1px solid ${BORDER}`,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  } as React.CSSProperties;
}

const INPUT_CLS =
  "w-full rounded-xl px-4 py-2.5 bg-black/[.15] border border-white/15 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50";
const SELECT_CLS = INPUT_CLS + " pr-10 appearance-none";
const TEXTAREA_CLS = INPUT_CLS + " min-h-[140px] resize-y";
const FILE_INPUT_CLS =
  "block w-full text-sm text-white/90 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white hover:file:bg-white/20";

const TOOLBTN_CLS =
  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm hover:bg-white/10";

type MdMode = "bold" | "italic" | "code" | "h2" | "h3" | "ul" | "ol" | "quote";

/* ============
   Безопасный Markdown-рендер (экранируем HTML; поддержка: **жирный**, *курсив*, `код`,
   заголовки ##/###, списки -, 1., цитаты >, переносы строк, ВЕДУЩИЕ ПРОБЕЛЫ)
   ============ */
function escapeHTML(str: string) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function mdInline(text: string) {
  let t = escapeHTML(text);
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");
  t = t.replace(/`(.+?)`/g, "<code>$1</code>");
  return t;
}
// конвертируем ведущие пробелы/табы в &nbsp;
function preserveLeadingSpacesHtml(s: string) {
  const m = s.match(/^([ \t]+)/);
  if (!m) return s;
  const raw = m[0];
  let prefix = "";
  for (const ch of raw) {
    if (ch === "\t") prefix += "&nbsp;&nbsp;"; // 1 таб = 2 пробела
    else prefix += "&nbsp;";
  }
  return prefix + s.slice(raw.length);
}
function renderMarkdownSafe(src: string) {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inUL = false, inOL = false, inBQ = false;

  const closeLists = () => {
    if (inUL) { out.push("</ul>"); inUL = false; }
    if (inOL) { out.push("</ol>"); inOL = false; }
  };
  const closeBQ = () => { if (inBQ) { out.push("</blockquote>"); inBQ = false; } };

  for (const rawLine of lines) {
    const line = rawLine;

    // Заголовки
    if (/^##\s+/.test(line)) {
      closeLists(); closeBQ();
      const content = preserveLeadingSpacesHtml(mdInline(line.replace(/^##\s+/, "")));
      out.push(`<h2 class="mt-3 mb-2 font-semibold text-lg">${content}</h2>`);
      continue;
    }
    if (/^###\s+/.test(line)) {
      closeLists(); closeBQ();
      const content = preserveLeadingSpacesHtml(mdInline(line.replace(/^###\s+/, "")));
      out.push(`<h3 class="mt-2 mb-1 font-semibold">${content}</h3>`);
      continue;
    }

    // Цитаты
    if (/^>\s?/.test(line)) {
      closeLists();
      if (!inBQ) { inBQ = true; out.push('<blockquote class="border-l-2 border-white/20 pl-3 my-2 opacity-90">'); }
      const content = preserveLeadingSpacesHtml(mdInline(line.replace(/^>\s?/, "")));
      out.push(content + "<br/>");
      continue;
    } else {
      closeBQ();
    }

    // Списки
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inUL) { closeLists(); inUL = true; out.push('<ul class="list-disc ml-6 my-2 space-y-1">'); }
      const content = preserveLeadingSpacesHtml(mdInline(line.replace(/^\s*[-*]\s+/, "")));
      out.push(`<li>${content}</li>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (!inOL) { closeLists(); inOL = true; out.push('<ol class="list-decimal ml-6 my-2 space-y-1">'); }
      const content = preserveLeadingSpacesHtml(mdInline(line.replace(/^\s*\d+\.\s+/, "")));
      out.push(`<li>${content}</li>`);
      continue;
    }

    // Пустая строка
    if (/^\s*$/.test(line)) {
      closeLists(); closeBQ();
      out.push("<br/>");
      continue;
    }

    // Обычный абзац
    closeLists(); closeBQ();
    const content = preserveLeadingSpacesHtml(mdInline(line));
    out.push(`<p class="my-1">${content}</p>`);
  }
  closeLists(); closeBQ();

  // без whitespace-pre-wrap, чтобы не раздувать расстояния
  return `<div class="break-words leading-relaxed">${out.join("\n")}</div>`;
}

export function AdminCharacters() {
  const {
    characters,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    linkPresets,
    characterLinks,
    updateCharacterLinks,
  } = useData();
  const { user } = useAuth();

  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const [formData, setFormData] = useState<
    Partial<Omit<Character, "id" | "createdAt" | "links">>
  >({
    name: "",
    occupation: "",
    description: "",
    fullDescription: "",
    gender: "female",
    age: 18,
    ageGroup: "18+",
    tags: [],
  });

  const fullDescRef = useRef<HTMLTextAreaElement | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [characterLinksState, setCharacterLinksState] = useState<Partial<CharacterLink>[]>([]);

  const resetForm = () => {
    setFormData({
      name: "",
      occupation: "",
      description: "",
      fullDescription: "",
      gender: "female",
      age: 18,
      ageGroup: "18+",
      tags: [],
    });
    setTagInput("");
    setPhotoFile(null);
    setEditingCharacter(null);
    setCharacterLinksState([]);
    setShowPreview(true);
  };

  const startEdit = (c: Character) => {
    setEditingCharacter(c);
    setShowAddForm(true);
    const { links, ...charData } = c;
    setFormData(charData);
    setTagInput("");
    setCharacterLinksState(characterLinks.filter((l) => l.character_id === c.id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // TAGS
  const addTags = (raw: string) => {
    const parts = raw.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setFormData((prev) => {
      const prevTags = (prev.tags as string[]) || [];
      const set = new Set(prevTags.map((t) => t.toLowerCase()));
      const merged = [...prevTags];
      parts.forEach((p) => {
        if (!set.has(p.toLowerCase())) {
          set.add(p.toLowerCase());
          merged.push(p);
        }
      });
      return { ...prev, tags: merged };
    });
  };
  const addTagFromInput = () => {
    if (!tagInput.trim()) return;
    addTags(tagInput);
    setTagInput("");
  };
  const removeTag = (idx: number) => {
    setFormData((prev) => {
      const arr = ([...(prev.tags as string[])] || []);
      arr.splice(idx, 1);
      return { ...prev, tags: arr };
    });
  };

  // FORMAT helpers
  const setFD = (val: string) => setFormData((p) => ({ ...p, fullDescription: val }));

  const wrapSelection = (prefix: string, suffix?: string, placeholder = "") => {
    const el = fullDescRef.current;
    if (!el) return;
    el.focus();
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = (formData.fullDescription || "") as string;
    const hasSel = start !== end;
    const sel = hasSel ? value.slice(start, end) : placeholder;
    const post = (suffix === undefined ? prefix : suffix);
    const next = value.slice(0, start) + prefix + sel + post + value.slice(end);
    setFD(next);
    const caret = start + prefix.length + sel.length + post.length;
    requestAnimationFrame(() => el.setSelectionRange(caret, caret));
  };

  const toggleLinePrefix = (prefix: string) => {
    const el = fullDescRef.current;
    const value = (formData.fullDescription || "") as string;
    if (!el) return;
    el.focus();
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;

    const before = value.slice(0, start);
    const sel = value.slice(start, end);
    const after = value.slice(end);

    const block = (sel || "").split("\n");
    const allPrefixed = block.every((l) => l.startsWith(prefix) || l.trim() === "");
    const changed = block.map((l) =>
      l.trim() === "" ? l : (allPrefixed ? l.replace(new RegExp("^" + prefix), "") : prefix + l)
    ).join("\n");

    const next = before + (changed || (prefix + "Текст")) + after;
    setFD(next);
  };

  const applyFormat = (mode: MdMode) => {
    switch (mode) {
      case "bold": return wrapSelection("**", "**", "жирный");
      case "italic": return wrapSelection("*", "*", "курсив");
      case "code": return wrapSelection("`", "`", "code");
      case "h2": return toggleLinePrefix("## ");
      case "h3": return toggleLinePrefix("### ");
      case "ul": return toggleLinePrefix("- ");
      case "ol": return toggleLinePrefix("1. ");
      case "quote": return toggleLinePrefix("> ");
    }
  };

  const handleFDKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      if (e.key.toLowerCase() === "b") { e.preventDefault(); applyFormat("bold"); }
      if (e.key.toLowerCase() === "i") { e.preventDefault(); applyFormat("italic"); }
      if (e.key === "`") { e.preventDefault(); applyFormat("code"); }
    }
    if (e.key === "Enter") {
      const el = e.currentTarget;
      const val = el.value;
      const caret = el.selectionStart ?? 0;
      const lineStart = val.lastIndexOf("\n", caret - 1) + 1;
      const currentLine = val.slice(lineStart, caret);
      const ulMatch = currentLine.match(/^\s*[-*]\s+/);
      const olMatch = currentLine.match(/^\s*(\d+)\.\s+/);

      if (ulMatch) {
        requestAnimationFrame(() => {
          const before = val.slice(0, caret);
          const after = val.slice(caret);
          const next = before + "\n- " + after;
          setFD(next);
          const nextPos = caret + 3;
          requestAnimationFrame(() => el.setSelectionRange(nextPos, nextPos));
        });
      } else if (olMatch) {
        const n = parseInt(olMatch[1], 10);
        requestAnimationFrame(() => {
          const before = val.slice(0, caret);
          const after = val.slice(caret);
          const next = before + `\n${n + 1}. ` + after;
          setFD(next);
          const nextPos = caret + (`\n${n + 1}. `.length);
          requestAnimationFrame(() => el.setSelectionRange(nextPos, nextPos));
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setMessage({ type: "error", text: "Имя персонажа обязательно." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    try {
      const { links, ...charFormData } = formData as any;
      const dataToSend = new FormData();

      Object.entries(charFormData).forEach(([key, value]) => {
        if (key === "photo") return;
        if (key === "tags") {
          dataToSend.append(key, JSON.stringify(value || []));
          return;
        }
        if (value !== null && value !== undefined) {
          dataToSend.append(key, String(value));
        }
      });

      dataToSend.set("ageGroup", String(getAgeGroup(Number(formData.age ?? 18))));
      if (photoFile) dataToSend.append("photo", photoFile);

      let savedCharacterId = editingCharacter?.id;
      if (editingCharacter) {
        await updateCharacter(editingCharacter.id, dataToSend);
        setMessage({ type: "success", text: "Персонаж обновлён" });
      } else {
        dataToSend.append("createdBy", (user as any).id);
        dataToSend.append("rating", "0");
        dataToSend.append("reviewCount", "0");
        const newRecord = await addCharacter(dataToSend);
        if (newRecord && newRecord.id) {
          savedCharacterId = newRecord.id;
          setMessage({ type: "success", text: "Персонаж добавлен" });
        } else {
          throw new Error("Не удалось создать персонажа");
        }
      }

      if (savedCharacterId) {
        await updateCharacterLinks(savedCharacterId, characterLinksState);
      }

      resetForm();
      setShowAddForm(false);
      setPhotoFile(null);
    } catch (err: any) {
      console.error("Ошибка сохранения:", err);
      const errorResponse =
        err.response?.data?.photo?.message ||
        err?.response?.message ||
        err?.message ||
        "Ошибка сохранения";
      setMessage({ type: "error", text: errorResponse });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const addCharacterLink = () => {
    if (linkPresets.length > 0) {
      setCharacterLinksState((prev) => [...prev, { preset_id: linkPresets[0].id, url: "" }]);
    }
  };

  const updateCharacterLink = (
    index: number,
    field: keyof Omit<CharacterLink, "expand" | "id">,
    value: string
  ) => {
    setCharacterLinksState((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  };

  const removeCharacterLink = (index: number) => {
    setCharacterLinksState((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить персонажа? Это действие необратимо.")) return;
    await updateCharacterLinks(id, []);
    await deleteCharacter(id);
  };

  const fd = (formData.fullDescription || "") as string;
  const fdCount = fd.length;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold">Управление персонажами</h2>
        <button
          onClick={() => { resetForm(); setShowAddForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-black"
          style={{ background: ACCENT }}
        >
          <Plus className="h-4 w-4" />
          <span>Добавить</span>
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-5 rounded-2xl p-4 sm:p-5"
          style={surfaceStyle({ elevated: true })}
        >
          <h3 className="text-lg font-bold mb-4">
            {editingCharacter ? `Редактирование: ${editingCharacter.name}` : "Новый персонаж"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Имя</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Профессия</label>
              <input
                type="text"
                value={formData.occupation || ""}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className={INPUT_CLS}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm mb-2">Короткое описание</label>
              <input
                type="text"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={INPUT_CLS}
              />
            </div>

            {/* === РЕДАКТОР fullDescription === */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm">Полное описание</label>
                <div className="flex items-center gap-2 text-xs opacity-75">
                  <span>{fdCount} символов</span>
                  <button
                    type="button"
                    onClick={() => setShowPreview((v) => !v)}
                    className={TOOLBTN_CLS}
                    title={showPreview ? "Скрыть предпросмотр" : "Показать предпросмотр"}
                  >
                    {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showPreview ? "Превью выкл." : "Превью вкл."}
                  </button>
                </div>
              </div>

              {/* Панель инструментов */}
              <div className="flex flex-wrap gap-2 mb-2">
                <button type="button" onClick={() => applyFormat("bold")} className={TOOLBTN_CLS} title="Жирный (Ctrl/Cmd+B)">
                  <Bold size={16} /> B
                </button>
                <button type="button" onClick={() => applyFormat("italic")} className={TOOLBTN_CLS} title="Курсив (Ctrl/Cmd+I)">
                  <Italic size={16} /> I
                </button>
                <button type="button" onClick={() => applyFormat("code")} className={TOOLBTN_CLS} title="Код (Ctrl/Cmd+`)">
                  <CodeIcon size={16} /> code
                </button>
                <span className="mx-1 opacity-30">|</span>
                <button type="button" onClick={() => applyFormat("h2")} className={TOOLBTN_CLS} title="Заголовок 2 (## )">
                  <Heading2 size={16} /> H2
                </button>
                <button type="button" onClick={() => applyFormat("h3")} className={TOOLBTN_CLS} title="Заголовок 3 (### )">
                  <Heading3 size={16} /> H3
                </button>
                <span className="mx-1 opacity-30">|</span>
                <button type="button" onClick={() => applyFormat("ul")} className={TOOLBTN_CLS} title="Маркированный список (- )">
                  <List size={16} /> Список
                </button>
                <button type="button" onClick={() => applyFormat("ol")} className={TOOLBTN_CLS} title="Нумерованный список (1. )">
                  <ListOrdered size={16} /> 1.
                </button>
                <button type="button" onClick={() => applyFormat("quote")} className={TOOLBTN_CLS} title="Цитата (> )">
                  <Quote size={16} /> Цитата
                </button>
              </div>

              <textarea
                ref={fullDescRef}
                value={fd}
                onChange={(e) => setFD(e.target.value)}
                onKeyDown={handleFDKeyDown}
                placeholder="Поддерживаются: **жирный**, *курсив*, `код`, заголовки (##, ###), списки (-, 1.), цитаты (>). Можно ставить ведущие пробелы для отступа."
                className={TEXTAREA_CLS}
              />

              {showPreview && (
                <div className="mt-3 rounded-xl border p-3 text-sm"
                  style={{ borderColor: BORDER, background: "rgba(255,255,255,0.04)" }}>
                  <div className="opacity-70 mb-1 text-xs">Предпросмотр (безопасный):</div>
                  <div
                    className="max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownSafe(fd) }}
                  />
                </div>
              )}
            </div>
            {/* === / РЕДАКТОР fullDescription === */}

            <div>
              <label className="block text-sm mb-2">Пол</label>
              <select
                value={(formData.gender as any) || "female"}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className={SELECT_CLS}
              >
                <option value="female">Женский</option>
                <option value="male">Мужской</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">Возраст</label>
              <input
                type="number"
                value={Number(formData.age ?? 18)}
                onChange={(e) => {
                  const v = e.target.value;
                  const next = v === "" ? ("" as unknown as number) : Math.max(0, Number(v));
                  setFormData({ ...formData, age: next as any });
                }}
                className={INPUT_CLS}
                min={0}
              />
            </div>

            {/* Теги */}
            <div className="sm:col-span-2">
              <label className="block text-sm mb-2">Теги</label>

              <div className="flex flex-wrap gap-2 mb-2">
                {((formData.tags as string[]) || []).map((t, i) => (
                  <span
                    key={`${t}-${i}`}
                    className="inline-flex items-center gap-1 rounded-xl border px-2 py-1 text-sm"
                    style={{ borderColor: BORDER, background: "rgba(255,255,255,0.05)" }}
                  >
                    {t}
                    <button
                      type="button"
                      aria-label="Удалить тег"
                      onClick={() => removeTag(i)}
                      className="p-0.5 opacity-80 hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {(!formData.tags || (formData.tags as string[]).length === 0) && (
                  <span className="text-sm opacity-60">Пока пусто</span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTagFromInput();
                    }
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    if (text && /,|\n/.test(text)) {
                      e.preventDefault();
                      addTags(text);
                    }
                  }}
                  placeholder="Введите тег и нажмите Enter"
                  className={INPUT_CLS}
                />
                <button
                  type="button"
                  onClick={addTagFromInput}
                  className="rounded-xl px-3 py-2 font-medium text-black"
                  style={{ background: ACCENT }}
                >
                  Добавить
                </button>
              </div>

              <p className="mt-1 text-xs opacity-70">
                Можно вводить несколько сразу — через запятую или перенос строки.
              </p>
            </div>

            {/* Ссылки */}
            <div className="sm:col-span-2">
              <label className="block text-sm mb-2">Ссылки</label>
              <div className="space-y-3">
                {characterLinksState.map((link, i) => (
                  <div key={i} className="p-3 rounded-lg border" style={{ borderColor: BORDER }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={link.preset_id}
                        onChange={(e) => updateCharacterLink(i, "preset_id", e.target.value)}
                        className={SELECT_CLS}
                      >
                        {linkPresets.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="URL (включая https://)"
                        value={link.url || ""}
                        onChange={(e) => updateCharacterLink(i, "url", e.target.value)}
                        className={INPUT_CLS}
                      />
                      <input
                        type="text"
                        placeholder="Подпись (необязательно)"
                        value={link.caption || ""}
                        onChange={(e) => updateCharacterLink(i, "caption", e.target.value)}
                        className={INPUT_CLS}
                      />
                      <input
                        type="text"
                        placeholder="Кастомный лейбл (необязательно)"
                        value={link.custom_label || ""}
                        onChange={(e) => updateCharacterLink(i, "custom_label", e.target.value)}
                        className={INPUT_CLS}
                      />
                      <div className="flex items-center gap-2">
                        <label title="Цвет фона" className="w-10 h-10 p-1 rounded-lg border border-white/15">
                          <input
                            type="color"
                            value={link.custom_color || "#ffffff"}
                            onChange={(e) => updateCharacterLink(i, "custom_color", e.target.value)}
                            className="w-full h-full bg-transparent border-none cursor-pointer"
                          />
                        </label>
                        <input
                          type="text"
                          placeholder="Цвет фона (HEX)"
                          value={link.custom_color || ""}
                          onChange={(e) => updateCharacterLink(i, "custom_color", e.target.value)}
                          className={INPUT_CLS}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label title="Цвет текста" className="w-10 h-10 p-1 rounded-lg border border-white/15">
                          <input
                            type="color"
                            value={link.custom_text_color || "#000000"}
                            onChange={(e) => updateCharacterLink(i, "custom_text_color", e.target.value)}
                            className="w-full h-full bg-transparent border-none cursor-pointer"
                          />
                        </label>
                        <input
                          type="text"
                          placeholder="Цвет текста (HEX)"
                          value={link.custom_text_color || ""}
                          onChange={(e) => updateCharacterLink(i, "custom_text_color", e.target.value)}
                          className={INPUT_CLS}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCharacterLink(i)}
                      className="mt-3 text-xs text-rose-400 hover:text-rose-300"
                    >
                      Удалить ссылку
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCharacterLink}
                  disabled={linkPresets.length === 0}
                  className="rounded-xl px-3 py-1.5 border text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: BORDER, background: "rgba(255,255,255,0.03)" }}
                  title={
                    linkPresets.length === 0
                      ? "Сначала создайте пресеты ссылок в базе данных"
                      : "Добавить ссылку"
                  }
                >
                  + Добавить ссылку
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm mb-2">Фото (оставьте пустым, чтобы не менять)</label>
              <input
                type="file"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className={FILE_INPUT_CLS}
              />
            </div>
          </div>

          {message && (
            <p className={"mt-3 text-sm " + (message.type === "error" ? "text-red-400" : "text-emerald-400")}>
              {message.text}
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { resetForm(); setShowAddForm(false); }}
              className="rounded-xl px-4 py-2 border font-medium"
              style={{ borderColor: BORDER, background: "rgba(255,255,255,0.03)" }}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl px-4 py-2 font-semibold text-black disabled:opacity-60"
              style={{ background: ACCENT }}
            >
              {isSubmitting ? "Сохранение..." : editingCharacter ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {characters.map((c) => (
          <div key={c.id} className="rounded-2xl p-4" style={surfaceStyle()}>
            <div className="flex items-center gap-4">
              <img
                src={c.photo || "https://placehold.co/80x80?text=%20"}
                alt={c.name}
                className="w-16 h-16 rounded-xl object-cover border"
                style={{ borderColor: BORDER }}
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-sm opacity-80 truncate">{c.occupation}</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => startEdit(c)}
                  className="p-2.5 rounded-xl border"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2.5 rounded-xl border text-rose-300"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
