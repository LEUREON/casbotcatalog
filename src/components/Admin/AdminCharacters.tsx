// project/src/components/Admin/AdminCharacters.tsx

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Link as LinkIcon, Image, Check } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Character, Link as LinkType } from '../../types';
import { getAgeGroup } from '../../utils/getAgeGroup';

export function AdminCharacters() {
  const { characters, addCharacter, updateCharacter, deleteCharacter } = useData();
  const { user, isAdmin } = useAuth();
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // ▼▼▼ ИЗМЕНЕНИЕ: Устанавливаем рейтинг и кол-во отзывов по умолчанию в 0 ▼▼▼
  const [formData, setFormData] = useState<Partial<Character>>({
    name: '',
    occupation: '',
    description: '',
    fullDescription: '',
    gender: 'female',
    age: 18,
    ageGroup: '18+',
    rating: 0,
    reviewCount: 0,
    isNew: true,
    tags: [],
    links: [],
  });

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setFormData(character);
    setShowAddForm(true);
    setPhotoFile(null);
  };
  
  const handleCancel = () => {
    setEditingCharacter(null);
    setShowAddForm(false);
    setMessage(null);
    setPhotoFile(null);
    setFormData({
      name: '', occupation: '', description: '', fullDescription: '',
      gender: 'female', age: 18, ageGroup: '18+', rating: 0,
      reviewCount: 0, isNew: true, tags: [], links: []
    });
  };
  // ▲▲▲ КОНЕЦ ИЗМЕНЕНИЙ ▲▲▲

  const handleSave = async () => {
    if (!formData.name || !formData.occupation || !user || !isAdmin) {
      setMessage({ type: 'error', text: 'Заполните все обязательные поля' });
      return;
    }
    if (!editingCharacter && !photoFile) {
      setMessage({ type: 'error', text: 'Пожалуйста, загрузите фотографию для нового персонажа.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const dataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'photo') return;
      if (key === 'tags' || key === 'links') {
        dataToSend.append(key, JSON.stringify(value));
      } else if (value !== null && value !== undefined) {
        dataToSend.append(key, String(value));
      }
    });

    if (photoFile) {
      dataToSend.append('photo', photoFile);
    }
    dataToSend.append('createdBy', user.id);
    
    // ▼▼▼ ИЗМЕНЕНИЕ: Убеждаемся, что новые персонажи создаются с нулевым рейтингом ▼▼▼
    if (!editingCharacter) {
        dataToSend.append('rating', '0');
        dataToSend.append('reviewCount', '0');
    }
    // ▲▲▲ КОНЕЦ ИЗМЕНЕНИЙ ▲▲▲

    try {
      let success = false;
      if (editingCharacter) {
        // @ts-ignore
        success = await updateCharacter(editingCharacter.id, dataToSend);
        setMessage(success ? { type: 'success', text: 'Персонаж успешно обновлен!' } : { type: 'error', text: 'Ошибка при обновлении персонажа' });
      } else {
        // @ts-ignore
        success = await addCharacter(dataToSend);
        setMessage(success ? { type: 'success', text: 'Персонаж успешно создан!' } : { type: 'error', text: 'Ошибка при создании персонажа' });
      }

      if (success) {
        handleCancel();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error saving character:', error);
      setMessage({ type: 'error', text: 'Произошла ошибка при сохранении' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого персонажа?')) {
      const success = await deleteCharacter(id);
      if (success) {
        setMessage({ type: 'success', text: 'Персонаж успешно удален!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Ошибка при удалении персонажа' });
      }
    }
  };

  const addTag = () => {
    const newTag = prompt('Введите новый тег:');
    if (newTag && formData.tags) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
    }
  };

  const removeTag = (index: number) => {
    if (formData.tags) {
      setFormData({
        ...formData,
        tags: formData.tags.filter((_, i) => i !== index)
      });
    }
  };

  const addLink = () => {
    const links = formData.links || [];
    setFormData({
      ...formData,
      links: [...links, { label: '', url: '' }]
    });
  };

  const updateLink = (index: number, field: keyof LinkType, value: string) => {
    const links = formData.links || [];
    const updatedLinks = links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    );
    setFormData({
      ...formData,
      links: updatedLinks
    });
  };

  const removeLink = (index: number) => {
    const links = formData.links || [];
    setFormData({
      ...formData,
      links: links.filter((_, i) => i !== index)
    });
  };

  const handleAgeChange = (ageValue: number) => {
    const newAge = Math.max(0, ageValue);
    setFormData({
      ...formData,
      age: newAge,
      ageGroup: getAgeGroup(newAge)
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Управление персонажами</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить персонажа</span>
        </button>
      </div>

       {showAddForm && (
        <div className="glass-light rounded-2xl p-6 mb-6 border border-purple-500/20">
          {message && (
            <div className={`mb-6 p-4 rounded-2xl border ${
              message.type === 'success'
                ? 'bg-green-500/20 border-green-500/30 text-green-300'
                : 'bg-red-500/20 border-red-500/30 text-red-300'
            }`}>
              <div className="flex items-center space-x-2">
                {message.type === 'success' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span>{message.text}</span>
              </div>
            </div>
          )}

          <h3 className="text-xl font-bold text-white mb-4">
            {editingCharacter ? 'Редактировать персонажа' : 'Добавить персонажа'}
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                 <div>
                <label className="block text-sm font-medium text-white mb-2">Имя</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Введите имя персонажа"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Профессия</label>
                <input
                  type="text"
                  value={formData.occupation || ''}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Введите профессию"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Краткое описание</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  placeholder="Краткое описание персонажа"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Полное описание</label>
                <textarea
                  value={formData.fullDescription || ''}
                  onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  placeholder="Подробное описание персонажа"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Фотография</label>
                <input
                  type="file"
                  onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)}
                  accept="image/*"
                  className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/10 file:text-purple-300 hover:file:bg-purple-500/20"
                />
                {(editingCharacter?.photo || photoFile) && (
                    <div className="mt-2">
                        <img 
                            src={photoFile ? URL.createObjectURL(photoFile) : editingCharacter?.photo} 
                            alt="Превью" 
                            className="w-24 h-24 rounded-xl object-cover"
                        />
                    </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Пол</label>
                  <select
                    value={formData.gender || 'female'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="female">Женский</option>
                    <option value="male">Мужской</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Возраст (0 = бессмертный)</label>
                  <input
                    type="number"
                    value={formData.age || 0}
                    onChange={(e) => handleAgeChange(parseInt(e.target.value))}
                    className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Возрастная группа (автоматически)</label>
                <select
                  value={formData.ageGroup || '18+'}
                  disabled 
                  className="w-full px-4 py-3 glass rounded-xl text-slate-400 bg-slate-800/50 cursor-not-allowed"
                >
                  <option value="18+">18+</option>
                  <option value="45+">45+</option>
                  <option value="immortal">Бессмертный</option>
                </select>
              </div>

              {/* ▼▼▼ ИЗМЕНЕНИЕ: Удаляем поля Рейтинг и Кол-во отзывов ▼▼▼ */}
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isNew || false}
                    onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-white">Новый персонаж</span>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">Теги</label>
                  <button
                    type="button"
                    onClick={addTag}
                    className="text-sm text-purple-400 hover:text-white transition-colors"
                  >
                    + Добавить тег
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="flex items-center space-x-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-purple-400 hover:text-red-400 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">Ссылки</label>
                  <button
                    type="button"
                    onClick={addLink}
                    className="text-sm text-cyan-400 hover:text-white transition-colors"
                  >
                    + Добавить ссылку
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.links?.map((link, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Название ссылки"
                        value={link.label}
                        onChange={(e) => updateLink(index, 'label', e.target.value)}
                        className="flex-1 px-3 py-2 glass rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                      />
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={link.url}
                        onChange={(e) => updateLink(index, 'url', e.target.value)}
                        className="flex-1 px-3 py-2 glass rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
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
              disabled={isSubmitting || !formData.name || !formData.occupation}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all"
            >
              {isSubmitting ? (
                <div className="loading-dots">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Сохранить</span>
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 glass text-slate-300 hover:text-white rounded-xl transition-all"
            >
              <X className="h-4 w-4" />
              <span>Отмена</span>
            </button>
          </div>
        </div>
      )}
      
        {message && !showAddForm && (
        <div className={`mb-6 p-4 rounded-2xl border ${
          message.type === 'success'
            ? 'bg-green-500/20 border-green-500/30 text-green-300'
            : 'bg-red-500/20 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {characters.map((character) => (
          <div key={character.id} className="glass-light rounded-2xl p-4 border border-white/10">
            <div className="flex items-start space-x-4">
              <img
                src={character.photo}
                alt={character.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{character.name}</h3>
                <p className="text-cyan-400 text-sm truncate">{character.occupation}</p>
                <p className="text-slate-400 text-sm mt-1 line-clamp-2">{character.description}</p>

                {character.links && character.links.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {character.links.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <LinkIcon className="h-3 w-3" />
                        <span className="truncate">{link.label}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => handleEdit(character)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all text-sm"
              >
                <Edit className="h-3 w-3" />
                <span>Редактировать</span>
              </button>
              <button
                onClick={() => handleDelete(character.id)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm"
              >
                <Trash2 className="h-3 w-3" />
                <span>Удалить</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}