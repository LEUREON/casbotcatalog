// src/components/Admin/AdminShop.tsx
import React, { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { ShopItem } from "../../types";
import { GlassPanel } from "../ui/GlassPanel";
import { motion } from "framer-motion";
import { ANIM } from "../../lib/animations";

const INPUT_CLS = "w-full rounded-lg px-4 py-2.5 bg-white/5 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/50 transition-all";
const BUTTON_PRIMARY_CLS = "flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-white transition-all duration-300 bg-gradient-to-r from-accent-primary to-accent-secondary";
const BUTTON_SECONDARY_CLS = "flex items-center justify-center gap-2 px-4 py-2 rounded-full font-medium text-sm bg-white/10 border border-white/20 text-text-secondary hover:bg-white/20 transition-all";

type ActionButton = {
  label: string;
  url: string;
};

export function AdminShop() {
  const { shopItems, addShopItem, updateShopItem, deleteShopItem } = useData();
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Partial<ShopItem>>({
    name: "",
    description: "",
    price: 0,
    category: "",
    isActive: true,
    actionButtons: [],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      category: "",
      isActive: true,
      actionButtons: [],
    });
    setImageFile(null);
    setEditingItem(null);
    setShowForm(false);
  };

  const startEdit = (item: ShopItem) => {
    setEditingItem(item);
    setFormData({
      ...item,
      actionButtons: Array.isArray(item.actionButtons) ? item.actionButtons : [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'image') return;
      if (key === 'actionButtons') {
        data.append(key, JSON.stringify(value || []));
      } else if (value !== null && value !== undefined) {
        data.append(key, String(value));
      }
    });

    if (imageFile) {
      data.append('image', imageFile);
    }

    if (editingItem) {
      await updateShopItem(editingItem.id, data);
    } else {
      await addShopItem(data);
    }
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить этот товар?")) {
      await deleteShopItem(id);
    }
  };

  const addActionButton = () => {
    setFormData(prev => ({
      ...prev,
      actionButtons: [...(prev.actionButtons || []), { label: "Купить", url: "" }],
    }));
  };

  const updateActionButton = (index: number, field: keyof ActionButton, value: string) => {
    setFormData(prev => ({
      ...prev,
      actionButtons: (prev.actionButtons || []).map((btn, i) => i === index ? { ...btn, [field]: value } : btn),
    }));
  };

  const removeActionButton = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actionButtons: (prev.actionButtons || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold">Управление магазином</h2>
        <motion.button {...ANIM.buttonTap} onClick={() => { resetForm(); setShowForm(true); }} className={BUTTON_PRIMARY_CLS}>
          <Plus size={16} /> Добавить товар
        </motion.button>
      </div>

      {showForm && (
        <GlassPanel delay={0.1}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-lg font-bold">
              {editingItem ? `Редактирование: ${editingItem.name}` : "Новый товар"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm mb-1.5">Название</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={INPUT_CLS} required /></div>
              <div><label className="block text-sm mb-1.5">Цена (в рублях)</label><input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} className={INPUT_CLS} required /></div>
              <div className="sm:col-span-2"><label className="block text-sm mb-1.5">Категория</label><input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={INPUT_CLS} /></div>
              <div className="sm:col-span-2"><label className="block text-sm mb-1.5">Описание</label><textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={INPUT_CLS} rows={3}></textarea></div>
              <div className="sm:col-span-2"><label className="block text-sm mb-1.5">Изображение</label><input type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} className={`${INPUT_CLS} p-0 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2.5 file:text-white hover:file:bg-white/20 transition-colors`} /></div>
              
              <div className="sm:col-span-2"><label className="block text-sm mb-1.5">Кнопки действий</label>
                <div className="space-y-3">
                  {(formData.actionButtons || []).map((btn, i) => (
                    <div key={i} className="p-3 rounded-lg border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="text" placeholder="Текст кнопки" value={btn.label} onChange={e => updateActionButton(i, "label", e.target.value)} className={INPUT_CLS} />
                      <input type="url" placeholder="URL (https://...)" value={btn.url} onChange={e => updateActionButton(i, "url", e.target.value)} className={INPUT_CLS} />
                      <button type="button" onClick={() => removeActionButton(i)} className="sm:col-span-2 text-xs text-red-400 hover:text-red-300 transition-colors text-left">Удалить кнопку</button>
                    </div>
                  ))}
                  <button type="button" onClick={addActionButton} className={BUTTON_SECONDARY_CLS}>+ Добавить кнопку</button>
                </div>
              </div>
              
              <div className="sm:col-span-2 flex items-center gap-2"><input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} id="isActiveCheckbox" className="w-4 h-4" /><label htmlFor="isActiveCheckbox" className="text-sm">Активный товар</label></div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <motion.button type="button" {...ANIM.buttonTap} onClick={resetForm} className={BUTTON_SECONDARY_CLS}>Отмена</motion.button>
              <motion.button type="submit" {...ANIM.buttonTap} className={`${BUTTON_PRIMARY_CLS} flex-1`}>
                Сохранить товар
              </motion.button>
            </div>
          </form>
        </GlassPanel>
      )}

      <div className="space-y-4">
        {shopItems.map((item) => (
          <GlassPanel key={item.id}>
            <div className="flex items-center gap-4">
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover border border-white/10" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{item.name}</div>
                <div className="text-sm opacity-80 truncate">{item.price} ₽</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <motion.button {...ANIM.buttonTap} onClick={() => startEdit(item)} className={BUTTON_SECONDARY_CLS}><Edit size={16} /></motion.button>
                <motion.button {...ANIM.buttonTap} onClick={() => handleDelete(item.id)} className={`${BUTTON_SECONDARY_CLS} !text-red-400 hover:!bg-red-500/20`}><Trash2 size={16} /></motion.button>
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}