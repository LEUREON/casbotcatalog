// project/src/components/Admin/AdminShop.tsx

import React, { useState } from 'react';
import { ShoppingBag, Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShopItem } from '../../types';

// --- Стили ---
const ACCENT = "#f7cfe1";
const BORDER = "rgba(255,255,255,0.10)";

function surfaceStyle({
  elevated = false,
}: { elevated?: boolean } = {}) {
  const baseAlpha = elevated ? 0.09 : 0.07;
  return {
    background: `rgba(255,255,255,${baseAlpha})`,
    border: `1px solid ${BORDER}`,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  } as React.CSSProperties;
}

const INPUT_CLS = "w-full rounded-xl px-4 py-2.5 bg-black/[.15] border border-white/15 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50";
const SELECT_CLS = INPUT_CLS + " pr-10 appearance-none";
const TEXTAREA_CLS = INPUT_CLS + " min-h-[100px] resize-y";
const FILE_INPUT_CLS = "w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20";

// --- Тип для состояния формы ---
type FormState = {
  name: string;
  description: string;
  price: number;
  category: string;
  isActive: boolean;
  imageFile: File | null;
  actionButtons: string; // Храним JSON как строку для textarea
};

const defaultFormState: FormState = {
  name: '',
  description: '',
  price: 0,
  category: '',
  isActive: true,
  imageFile: null,
  actionButtons: '[]',
};

// --- Основной компонент ---
export function AdminShop() {
  const { shopItems, addShopItem, updateShopItem, deleteShopItem } = useData();
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<FormState>(defaultFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const clearMessage = () => setTimeout(() => setMessage(null), 4000);

  // --- Обработчики ---

  const handleCancel = () => {
    setEditingItem(null);
    setFormData(defaultFormState);
    setShowAddForm(false);
    setMessage(null);
  };

  const handleEdit = (item: ShopItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isActive: item.isActive,
      imageFile: null, // Файл сбрасывается, загружаем новый только при необходимости
      actionButtons: JSON.stringify(item.actionButtons || []), // Конвертируем массив в JSON-строку
    });
    setShowAddForm(true);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
      await deleteShopItem(id);
      setMessage({ type: 'success', text: 'Товар удален.' });
      clearMessage();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
        setMessage({ type: 'error', text: 'Название и категория обязательны.' });
        clearMessage();
        return;
    }
    
    setIsSubmitting(true);
    setMessage(null);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', String(formData.price));
    data.append('category', formData.category);
    data.append('isActive', String(formData.isActive));
    data.append('actionButtons', formData.actionButtons); // Отправляем JSON как строку

    if (formData.imageFile) {
        data.append('image', formData.imageFile);
    }

    try {
      if (editingItem) {
        await updateShopItem(editingItem.id, data);
        setMessage({ type: 'success', text: 'Товар успешно обновлен!' });
      } else {
        await addShopItem(data);
        setMessage({ type: 'success', text: 'Товар успешно создан!' });
      }
      handleCancel();
    } catch (err: any) {
      setMessage({ type: 'error', text: `Ошибка: ${err.message || 'Не удалось сохранить товар.'}` });
    } finally {
      setIsSubmitting(false);
      clearMessage();
    }
  };

  // --- JSX ---

  return (
    <div className="p-4 sm:p-6">
      {/* Заголовок и кнопка "Добавить" */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Управление магазином</h2>
        <button 
          onClick={() => { handleCancel(); setShowAddForm(true); }} 
          className="flex items-center space-x-2 px-4 py-2 rounded-xl font-medium text-black" 
          style={{ background: ACCENT }}
        >
          <Plus className="h-4 w-4" />
          <span>Добавить товар</span>
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-xl border text-sm ${message.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
          {message.text}
        </div>
      )}

      {/* Форма добавления/редактирования */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl mb-6 overflow-hidden" 
            style={surfaceStyle({ elevated: true })}
          >
            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <h3 className="text-xl font-bold text-white mb-4">{editingItem ? 'Редактировать' : 'Добавить'} товар</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Название */}
                <div>
                  <label className="block text-sm mb-2">Название</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} className={INPUT_CLS} required />
                </div>
                {/* Категория */}
                <div>
                  <label className="block text-sm mb-2">Категория</label>
                  <input type="text" value={formData.category} onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))} className={INPUT_CLS} placeholder="Например: Промокод" required />
                </div>
                {/* Описание */}
                <div className="md:col-span-2">
                  <label className="block text-sm mb-2">Описание</label>
                  <textarea value={formData.description} onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))} className={TEXTAREA_CLS} />
                </div>
                {/* Цена */}
                <div>
                  <label className="block text-sm mb-2">Цена (в рублях)</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className={INPUT_CLS} min={0} />
                </div>
                {/* Активность */}
                <div>
                  <label className="block text-sm mb-2">Активен</label>
                  <select value={String(formData.isActive)} onChange={(e) => setFormData(f => ({ ...f, isActive: e.target.value === 'true' }))} className={SELECT_CLS}>
                    <option value="true">Да (виден в магазине)</option>
                    <option value="false">Нет (скрыт)</option>
                  </select>
                </div>
                {/* Изображение */}
                <div className="md:col-span-2">
                  <label className="block text-sm mb-2">Изображение (оставьте пустым, чтобы не менять)</label>
                  <input 
                    type="file" 
                    onChange={(e) => setFormData(f => ({ ...f, imageFile: e.target.files ? e.target.files[0] : null }))} 
                    accept="image/*" 
                    className={FILE_INPUT_CLS}
                  />
                </div>
                 {/* Action Buttons (JSON) */}
                 <div className="md:col-span-2">
                  <label className="block text-sm mb-2">Кнопки (JSON массив)</label>
                  <textarea 
                    value={formData.actionButtons} 
                    onChange={(e) => setFormData(f => ({ ...f, actionButtons: e.target.value }))} 
                    className={TEXTAREA_CLS}
                    placeholder='[{"label": "Купить", "url": "https://..."}]'
                  />
                  <p className="text-xs text-slate-400 mt-1">Введите валидный JSON или оставьте `[]`.</p>
                </div>
              </div>

              {/* Кнопки формы */}
              <div className="flex space-x-2 pt-4 mt-4 border-t border-white/10">
                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 font-bold text-black" style={{background: ACCENT}}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  <span>{isSubmitting ? 'Сохранение...' : (editingItem ? 'Сохранить' : 'Добавить товар')}</span>
                </button>
                <button type="button" onClick={handleCancel} className="px-5 py-3 rounded-xl border" style={{borderColor: BORDER, background: 'rgba(255,255,255,0.05)'}}>
                  <X size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Список товаров */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shopItems.map((item) => (
          <div key={item.id} className="rounded-2xl p-4 flex flex-col" style={surfaceStyle()}>
            <div className="flex items-start gap-4">
              <img 
                src={item.image ? item.image : `https://placehold.co/80x80/222/555?text=${item.name.charAt(0)}`} 
                alt={item.name}
                className="w-20 h-20 rounded-xl object-cover border" 
                style={{borderColor: BORDER}}
              />
              <div className="min-w-0 flex-1">
                <span className={`text-xs px-2 py-0.5 rounded ${item.isActive ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
                  {item.isActive ? 'Активен' : 'Скрыт'}
                </span>
                <p className="font-bold text-white truncate mt-1">{item.name}</p>
                <p className="text-sm text-slate-400">{item.category}</p>
                <p className="text-lg font-semibold text-white mt-1">{item.price} ₽</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                <button onClick={() => handleEdit(item)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm border" style={{borderColor: BORDER, background: "rgba(255,255,255,0.03)"}}>
                    <Edit size={16} /> Ред.
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2.5 rounded-xl border text-red-400" style={{borderColor: BORDER, background: "rgba(255,255,255,0.03)"}}>
                    <Trash2 size={16} />
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}