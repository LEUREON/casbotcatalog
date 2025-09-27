import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../../contexts/DataContext';
import { Character, CharacterLink } from '../../types';
import { pb } from '../../lib/pocketbase';
import { TagInput } from '../ui/TagInput';
import { SimpleWysiwygEditor } from '../ui/SimpleWysiwygEditor';
import { ImageUploader } from '../ui/ImageUploader';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '../ui/GlassPanel';
import { ANIM } from '../../lib/animations';
import { getAgeGroup } from '../../utils/getAgeGroup';

// Стили для консистентности UI
const INPUT_CLS = "w-full rounded-lg px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 transition-all";
const SELECT_CLS = INPUT_CLS + " pr-10 appearance-none";
const BUTTON_PRIMARY_CLS = "flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-white transition-all duration-300";
const BUTTON_SECONDARY_CLS = "flex items-center justify-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-white/10 border border-white/20 text-text-secondary hover:bg-white/20 transition-all";

export const AdminCharacters: React.FC = () => {
  const { characters, addCharacter, updateCharacter, deleteCharacter, allCategories, allTags } = useData();
  const [editingState, setEditingState] = useState<'new' | Character | null>(null);
  const [formData, setFormData] = useState<Partial<Character> & { photoFile?: File | null }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const filteredCharacters = useMemo(() => {
    return characters.filter(char =>
      char.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [characters, searchTerm]);

  useEffect(() => {
    if (editingState) {
      if (editingState === 'new') {
        setFormData({
          name: "", occupation: "", description: "", fullDescription: "",
          gender: "female", age: 18, tags: [], links: [], category: [], rating: 0, isNew: true
        });
        setPreviewUrl(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setFormData({ ...editingState, photoFile: null });
        setPreviewUrl(editingState.photo || null);
        setTimeout(() => {
          formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }
  }, [editingState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const isCheckbox = type === 'checkbox';
    // @ts-ignore
    setFormData(prev => ({ ...prev, [name]: isCheckbox ? e.target.checked : value }));
  };

  const handleTagChange = (field: 'tags' | 'category', value: string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // ✅ НАЧАЛО: Улучшенное управление аватаром
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setFormData(p => ({ ...p, photoFile: file }));
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  const handleRemovePhoto = () => {
      setFormData(p => ({ ...p, photo: undefined, photoFile: null }));
      setPreviewUrl(null);
  };
  // ✅ КОНЕЦ

  const addLink = () => setFormData(prev => ({ ...prev, links: [...(prev.links || []), { label: "", url: "" }] }));
  const updateLink = (index: number, field: keyof CharacterLink, value: string) => { setFormData(prev => ({ ...prev, links: (prev.links || []).map((link, i) => (i === index ? { ...link, [field]: value } : link)) })); };
  const removeLink = (index: number) => { setFormData(prev => ({ ...prev, links: (prev.links || []).filter((_, i) => i !== index) })); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Имя персонажа обязательно для заполнения.");

    const dataToSend = new FormData();
    const { photoFile, ...restData } = formData;
    
    Object.entries(restData).forEach(([key, value]) => {
      if (key === 'photo') return;
      if (key === 'links' || key === 'tags' || key === 'category') {
        dataToSend.append(key, JSON.stringify(value || []));
      } else if (typeof value === 'boolean') {
        dataToSend.append(key, value ? 'true' : 'false');
      } else if (value !== null && value !== undefined) {
        dataToSend.append(key, String(value));
      }
    });

    if (photoFile) {
      dataToSend.append("photo", photoFile);
    } else if (formData.photo === undefined) {
      // Если фото было удалено, отправляем пустую строку
      dataToSend.append("photo", "");
    }

    dataToSend.set("ageGroup", getAgeGroup(Number(formData.age ?? 0)));

    if (editingState && editingState !== 'new') {
      await updateCharacter(editingState.id, dataToSend);
      alert("Персонаж успешно обновлен");
    } else {
      await addCharacter(dataToSend);
      alert("Персонаж успешно создан");
    }
    setEditingState(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить этого персонажа? Это действие необратимо.")) {
      await deleteCharacter(id);
      alert("Персонаж удален");
      if (typeof editingState !== 'string' && editingState?.id === id) {
        setEditingState(null);
      }
    }
  };

  const FormComponent = (
    <GlassPanel>
      <form onSubmit={handleSave} className="space-y-5">
        <h3 className="text-xl font-bold">
          {editingState === 'new' ? "Создание нового персонажа" : `Редактирование: ${formData.name}`}
        </h3>
        
        <div><label className="block text-sm mb-1.5">Имя</label><input type="text" name="name" value={formData.name || ""} onChange={handleInputChange} className={INPUT_CLS} required/></div>
        <div><label className="block text-sm mb-1.5">Профессия</label><input type="text" name="occupation" value={formData.occupation || ""} onChange={handleInputChange} className={INPUT_CLS} /></div>
        <div><label className="block text-sm mb-1.5">Короткое описание</label><input type="text" name="description" value={formData.description || ""} onChange={handleInputChange} className={INPUT_CLS}/></div>
        <div><label className="block text-sm mb-1.5">Полное описание</label><SimpleWysiwygEditor value={formData.fullDescription || ""} onChange={(html) => setFormData(prev => ({ ...prev, fullDescription: html }))} /></div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm mb-1.5">Пол</label><select name="gender" value={formData.gender || "female"} onChange={handleInputChange} className={SELECT_CLS}><option value="female">Женский</option><option value="male">Мужской</option></select></div>
          <div><label className="block text-sm mb-1.5">Возраст</label><input type="number" name="age" value={formData.age || 0} onChange={handleInputChange} className={INPUT_CLS} min={0} /></div>
        </div>
        
        <div className="flex items-center pt-2">
            <input
                type="checkbox"
                id="isNewToggle"
                name="isNew"
                checked={!!formData.isNew}
                onChange={handleInputChange}
                className="w-4 h-4 text-[var(--accent-primary)] bg-white/10 border-white/20 rounded focus:ring-[var(--accent-primary)] focus:ring-2"
            />
            <label htmlFor="isNewToggle" className="ml-2 text-sm font-medium">
                Отметить как 'Новый'
            </label>
        </div>
        
        <div><label className="block text-sm mb-1.5">Категории</label><TagInput value={formData.category || []} onChange={(v) => handleTagChange('category', v)} suggestions={allCategories}/></div>
        <div><label className="block text-sm mb-1.5">Теги</label><TagInput value={formData.tags || []} onChange={(v) => handleTagChange('tags', v)} suggestions={allTags}/></div>
        
        <div>
            <label className="block text-sm mb-1.5">Ссылки</label>
            <div className="space-y-3">
                {(formData.links || []).map((link, i) => (
                    <div key={i} className="p-3 rounded-lg border grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto] gap-3 items-center" style={{ borderColor: 'var(--border-color)' }}>
                        <input type="text" placeholder="Текст кнопки" value={link.label} onChange={(e) => updateLink(i, "label", e.target.value)} className={INPUT_CLS}/>
                        <input type="url" placeholder="URL (https://...)" value={link.url} onChange={(e) => updateLink(i, "url", e.target.value)} className={INPUT_CLS}/>
                        <button type="button" onClick={() => removeLink(i)} className="text-red-400 hover:text-red-300 transition-colors p-2"><Trash2 size={16}/></button>
                    </div>
                ))}
                <button type="button" onClick={addLink} className={BUTTON_SECONDARY_CLS}><Plus size={16}/> Добавить ссылку</button>
            </div>
        </div>
        
        {/* ✅ НАЧАЛО: Обновленный блок для аватара */}
        <div>
            <label className="block text-sm mb-1.5">Аватар</label>
            <div className="flex items-center gap-4">
                {previewUrl && (
                    <div className="relative w-24 h-24">
                        <img src={previewUrl} alt="Превью" className="w-full h-full object-cover rounded-lg"/>
                        <button type="button" onClick={handleRemovePhoto} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                            <Trash2 size={14}/>
                        </button>
                    </div>
                )}
                <input type="file" onChange={handlePhotoChange} className={`${INPUT_CLS} p-0 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2.5 file:text-white hover:file:bg-white/20 transition-colors flex-1`} />
            </div>
        </div>
        {/* ✅ КОНЕЦ */}

        <div className="flex gap-3 pt-4 border-t border-white/10">
          <motion.button type="button" {...ANIM.buttonTap} onClick={() => setEditingState(null)} className={BUTTON_SECONDARY_CLS}>Отмена</motion.button>
          <motion.button type="submit" {...ANIM.buttonTap} className={`${BUTTON_PRIMARY_CLS} flex-1`} style={{ background: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))` }}>Сохранить</motion.button>
        </div>
      </form>
    </GlassPanel>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold">Управление персонажами</h2>
        <motion.button {...ANIM.buttonTap} onClick={() => setEditingState('new')} className={BUTTON_PRIMARY_CLS} style={{ background: `linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))` }}>
          <Plus size={16} /> Добавить
        </motion.button>
      </div>

      <AnimatePresence>
        {editingState === 'new' && (
          <motion.div key="new-character-form" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {FormComponent}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {filteredCharacters.map((c) => (
          <div key={c.id}>
            <GlassPanel>
              <div className="flex items-center gap-4">
                <img src={c.photo || "https://placehold.co/80x80?text=?"} alt={c.name} className="w-16 h-16 rounded-xl object-cover border" style={{ borderColor: 'var(--border-color)' }}/>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-sm opacity-80 truncate">{c.occupation}</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <motion.button {...ANIM.buttonTap} onClick={() => setEditingState(c)} className={BUTTON_SECONDARY_CLS}><Edit size={16} /></motion.button>
                  <motion.button {...ANIM.buttonTap} onClick={() => handleDelete(c.id)} className={`${BUTTON_SECONDARY_CLS} !text-red-400 hover:!bg-red-500/20`}><Trash2 size={16} /></motion.button>
                </div>
              </div>
            </GlassPanel>
            <AnimatePresence>
              {editingState && typeof editingState !== 'string' && editingState.id === c.id && (
                <motion.div ref={formRef} key={`edit-form-${c.id}`} initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -20, height: 0 }} className="mt-4">
                  {FormComponent}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};