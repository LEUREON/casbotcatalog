import React, { useState, useMemo } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { Character, CharacterLink } from "../../types";
import { getAgeGroup } from "../../utils/getAgeGroup";
import { SimpleWysiwygEditor } from "../ui/SimpleWysiwygEditor";
import { GlassPanel } from "../ui/GlassPanel";
import { motion } from "framer-motion";
import { ANIM } from "../../lib/animations";
import { TagInput } from "../ui/TagInput";

const ACCENT_PRIMARY = "var(--accent-primary)";
const ACCENT_SECONDARY = "var(--accent-secondary)";
const BORDER_COLOR = "var(--border-color)";
const INPUT_CLS = "w-full rounded-lg px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all";
const SELECT_CLS = INPUT_CLS + " pr-10 appearance-none";
const FILE_INPUT_CLS = "block w-full text-sm text-white/90 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-white hover:bg-white/20 transition-colors";
const BUTTON_PRIMARY_CLS = "flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-white transition-all duration-300";
const BUTTON_SECONDARY_CLS = "flex items-center justify-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-white/10 border border-white/20 text-text-secondary hover:bg-white/20 transition-all";


export function AdminCharacters() {
  const { characters, addCharacter, updateCharacter, deleteCharacter } = useData();
  const { user } = useAuth();

  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // Добавляем 'category' в состояние формы
  const [formData, setFormData] = useState<Partial<Omit<Character, "id" | "createdAt">>>({
    name: "", occupation: "", description: "", fullDescription: "",
    gender: "female", age: 18, ageGroup: "18+", tags: [], links: [], category: [],
  });

  const allAvailableTags = useMemo(() => {
    const tagSet = new Set<string>();
    characters.forEach(character => {
      (character.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [characters]);

  // Собираем все существующие категории для автодополнения
  const allAvailableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    characters.forEach(character => {
      (character.category || []).forEach(cat => categorySet.add(cat));
    });
    return Array.from(categorySet).sort();
  }, [characters]);
  
  const resetForm = () => {
    setFormData({
      name: "", occupation: "", description: "", fullDescription: "",
      gender: "female", age: 18, ageGroup: "18+", tags: [], links: [], category: [],
    });
    setPhotoFile(null); setEditingCharacter(null);
  };

  const startEdit = (c: Character) => {
    setEditingCharacter(c);
    setShowAddForm(true);
    setFormData(c);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) { setMessage({ type: "error", text: "Имя персонажа обязательно." }); return; }
    setIsSubmitting(true); setMessage(null);
    try {
      const dataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'photo') return;
        // ▼▼▼ ВАЖНО: Преобразуем массивы тегов, ссылок и категорий в JSON-строку ▼▼▼
        if (key === 'tags' || key === 'links' || key === 'category') { 
          dataToSend.append(key, JSON.stringify(value || [])); 
        } 
        else if (value !== null && value !== undefined) { 
          dataToSend.append(key, String(value)); 
        }
      });
      dataToSend.set("ageGroup", String(getAgeGroup(Number(formData.age ?? 18))));
      if (photoFile) dataToSend.append("photo", photoFile);

      if (editingCharacter) {
        await updateCharacter(editingCharacter.id, dataToSend);
        setMessage({ type: "success", text: "Персонаж обновлён" });
      } else {
        dataToSend.append("createdBy", (user as any).id);
        dataToSend.append("rating", "0");
        dataToSend.append("reviewCount", "0");
        await addCharacter(dataToSend);
        setMessage({ type: "success", text: "Персонаж добавлен" });
      }
      resetForm(); setShowAddForm(false); setPhotoFile(null);
    } catch (err: any) {
      console.error("Ошибка сохранения:", err);
      const errorResponse = err?.response?.message || err?.message || "Ошибка сохранения";
      setMessage({ type: "error", text: errorResponse });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };
  
  const addCharacterLink = () => setFormData(prev => ({ ...prev, links: [...(prev.links || []), { label: "", url: "" }] }));
  const updateCharacterLink = (index: number, field: keyof CharacterLink, value: string) => { setFormData(prev => ({ ...prev, links: (prev.links || []).map((link, i) => (i === index ? { ...link, [field]: value } : link)) })); };
  const removeCharacterLink = (index: number) => { setFormData(prev => ({ ...prev, links: (prev.links || []).filter((_, i) => i !== index) })); };
  const handleDelete = async (id: string) => { if (confirm("Удалить персонажа? Это действие необратимо.")) await deleteCharacter(id); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold">Управление персонажами</h2>
        <motion.button {...ANIM.buttonTap} onClick={() => { resetForm(); setShowAddForm(true); }} className={BUTTON_PRIMARY_CLS} style={{ background: `linear-gradient(135deg, ${ACCENT_PRIMARY}, ${ACCENT_SECONDARY})` }}>
          <Plus size={16} /> Добавить
        </motion.button>
      </div>

      {showAddForm && (
        <GlassPanel delay={0.1}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-lg font-bold">
              {editingCharacter ? `Редактирование: ${editingCharacter.name}` : "Новый персонаж"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm mb-1.5">Имя</label><input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={INPUT_CLS}/></div>
              <div><label className="block text-sm mb-1.5">Профессия</label><input type="text" value={formData.occupation || ""} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} className={INPUT_CLS} /></div>
              <div className="sm:col-span-2"><label className="block text-sm mb-1.5">Короткое описание</label><input type="text" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={INPUT_CLS}/></div>
              <div className="sm:col-span-2"><label className="block text-sm mb-1.5">Полное описание</label><SimpleWysiwygEditor value={formData.fullDescription || ""} onChange={(html) => setFormData(prev => ({ ...prev, fullDescription: html }))} placeholder="Начните вводить описание персонажа..."/></div>
              <div><label className="block text-sm mb-1.5">Пол</label><select value={(formData.gender as any) || "female"} onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })} className={SELECT_CLS}><option value="female">Женский</option><option value="male">Мужской</option></select></div>
              <div><label className="block text-sm mb-1.5">Возраст</label><input type="number" value={Number(formData.age ?? 18)} onChange={(e) => { const v = e.target.value; const next = v === "" ? (0) : Math.max(0, Number(v)); setFormData({ ...formData, age: next as any }); }} className={INPUT_CLS} min={0} /></div>
              
              {/* ▼▼▼ ИЗМЕНЕНИЕ ЗДЕСЬ: Добавлено поле для Категорий ▼▼▼ */}
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1.5">Категории</label>
                <TagInput 
                  allTags={allAvailableCategories}
                  selectedTags={formData.category || []}
                  onChange={(newCategories) => setFormData(prev => ({ ...prev, category: newCategories }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1.5">Теги</label>
                <TagInput 
                  allTags={allAvailableTags}
                  selectedTags={formData.tags || []}
                  onChange={(newTags) => setFormData(prev => ({ ...prev, tags: newTags }))}
                />
              </div>
              {/* ▲▲▲ КОНЕЦ ИЗМЕНЕНИЯ ▲▲▲ */}

              <div className="sm:col-span-2"><label className="block text-sm mb-1.5">Ссылки</label>
                <div className="space-y-3">
                  {(formData.links || []).map((link, i) => (
                    <div key={i} className="p-3 rounded-lg border grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ borderColor: BORDER_COLOR }}>
                      <input type="text" placeholder="Текст кнопки" value={link.label} onChange={(e) => updateCharacterLink(i, "label", e.target.value)} className={INPUT_CLS}/>
                      <input type="url" placeholder="URL (https://...)" value={link.url} onChange={(e) => updateCharacterLink(i, "url", e.target.value)} className={INPUT_CLS}/>
                      <button type="button" onClick={() => removeCharacterLink(i)} className="sm:col-span-2 text-xs text-red-400 hover:text-red-300 transition-colors text-left">Удалить</button>
                    </div>
                  ))}
                  <button type="button" onClick={addCharacterLink} className={BUTTON_SECONDARY_CLS}>+ Добавить ссылку</button>
                </div>
              </div>
              <div className="sm:col-span-2"><label className="block text-sm mb-1.5">Фото</label><input type="file" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className={FILE_INPUT_CLS} /></div>
            </div>
            {message && (<p className={"mt-4 text-sm " + (message.type === "error" ? "text-red-400" : "text-emerald-400")}>{message.text}</p>)}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <motion.button type="button" {...ANIM.buttonTap} onClick={() => { resetForm(); setShowAddForm(false); }} className={BUTTON_SECONDARY_CLS}>Отмена</motion.button>
              <motion.button type="submit" {...ANIM.buttonTap} disabled={isSubmitting} className={`${BUTTON_PRIMARY_CLS} flex-1`} style={{ background: `linear-gradient(135deg, ${ACCENT_PRIMARY}, ${ACCENT_SECONDARY})` }}>
                {isSubmitting ? "Сохранение..." : "Сохранить"}
              </motion.button>
            </div>
          </form>
        </GlassPanel>
      )}

      <div className="space-y-4">
        {characters.map((c) => (
          <GlassPanel key={c.id}>
            <div className="flex items-center gap-4">
              <img src={c.photo || "https://placehold.co/80x80?text=%20"} alt={c.name} className="w-16 h-16 rounded-xl object-cover border" style={{ borderColor: BORDER_COLOR }}/>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-sm opacity-80 truncate">{c.occupation}</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <motion.button {...ANIM.buttonTap} onClick={() => startEdit(c)} className={BUTTON_SECONDARY_CLS}><Edit size={16} /></motion.button>
                <motion.button {...ANIM.buttonTap} onClick={() => handleDelete(c.id)} className={`${BUTTON_SECONDARY_CLS} !text-red-400 hover:!bg-red-500/20`}><Trash2 size={16} /></motion.button>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
} 