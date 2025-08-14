import React, { useState } from 'react';
import { ShoppingBag, Plus, Edit, Trash2, Save, X, Image, ExternalLink } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { ShopItem } from '../../types';

export function AdminShop() {
  const { shopItems, addShopItem, updateShopItem, deleteShopItem } = useData();
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<ShopItem>>({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: '',
    isActive: true,
    actionButtons: []
  });

  const handleEdit = (item: ShopItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowAddForm(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.description) return;

    const itemData = {
      ...formData,
      price: formData.price || 0,
      isActive: formData.isActive !== false,
      actionButtons: formData.actionButtons || []
    } as Omit<ShopItem, 'id' | 'createdAt'>;

    if (editingItem) {
      updateShopItem(editingItem.id, itemData);
    } else {
      addShopItem(itemData);
    }

    handleCancel();
  };

  const handleCancel = () => {
    setEditingItem(null);
    setShowAddForm(false);
    setFormData({
      name: '',
      description: '',
      price: 0,
      image: '',
      category: '',
      isActive: true,
      actionButtons: []
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
      deleteShopItem(id);
    }
  };

  const addActionButton = () => {
    const buttons = formData.actionButtons || [];
    setFormData({
      ...formData,
      actionButtons: [...buttons, { label: '', url: '' }]
    });
  };

  const updateActionButton = (index: number, field: 'label' | 'url', value: string) => {
    const buttons = formData.actionButtons || [];
    const updatedButtons = buttons.map((button, i) => 
      i === index ? { ...button, [field]: value } : button
    );
    setFormData({
      ...formData,
      actionButtons: updatedButtons
    });
  };

  const removeActionButton = (index: number) => {
    const buttons = formData.actionButtons || [];
    setFormData({
      ...formData,
      actionButtons: buttons.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Управление магазином</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить товар</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="glass-light rounded-2xl p-6 mb-6 border border-pink-500/20">
          <h3 className="text-xl font-bold text-white mb-4">
            {editingItem ? 'Редактировать товар' : 'Добавить товар'}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Название</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  placeholder="Введите название товара"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Описание</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
                  placeholder="Описание товара"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">URL изображения</label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={formData.image || ''}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="flex-1 px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                    placeholder="https://example.com/image.jpg"
                  />
                  <button className="p-3 glass rounded-xl text-pink-400 hover:text-white transition-colors">
                    <Image className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Цена</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || 0}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Категория</label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  placeholder="Категория товара"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-white">Активный товар</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">Кнопки действий</label>
                  <button
                    type="button"
                    onClick={addActionButton}
                    className="text-sm text-pink-400 hover:text-white transition-colors"
                  >
                    + Добавить кнопку
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.actionButtons?.map((button, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Текст кнопки"
                        value={button.label}
                        onChange={(e) => updateActionButton(index, 'label', e.target.value)}
                        className="flex-1 px-3 py-2 glass rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-sm"
                      />
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={button.url}
                        onChange={(e) => updateActionButton(index, 'url', e.target.value)}
                        className="flex-1 px-3 py-2 glass rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeActionButton(index)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>Сохранить</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-6 py-3 glass text-slate-300 hover:text-white rounded-xl transition-all"
            >
              <X className="h-4 w-4" />
              <span>Отмена</span>
            </button>
          </div>
        </div>
      )}

      {/* Shop Items List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {shopItems.length > 0 ? (
          shopItems.map((item) => (
            <div key={item.id} className="glass-light rounded-2xl p-4 border border-white/10">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-32 object-cover rounded-xl mb-4"
                />
              )}
              
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-white">{item.name}</h3>
                  {!item.isActive && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold">
                      НЕАКТИВЕН
                    </span>
                  )}
                </div>
                
                <p className="text-slate-400 text-sm line-clamp-2">{item.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-400">${item.price}</span>
                  <span className="text-sm text-slate-400">{item.category}</span>
                </div>

                {/* Action Buttons Preview */}
                {item.actionButtons && item.actionButtons.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-white/10">
                    <h4 className="text-xs font-medium text-slate-400">Кнопки действий:</h4>
                    {item.actionButtons.map((button, index) => (
                      <a
                        key={index}
                        href={button.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{button.label}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all text-sm"
                >
                  <Edit className="h-3 w-3" />
                  <span>Редактировать</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Удалить</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <ShoppingBag className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Нет товаров</h3>
            <p className="text-slate-400">Добавьте первый товар в магазин</p>
          </div>
        )}
      </div>
    </div>
  );
}