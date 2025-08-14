// project/src/pages/SubmitCharacterPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserCharacters } from '../contexts/UserCharactersContext';
import { Plus, Loader2, Send, X, Link as LinkIcon, Image } from 'lucide-react';
import { getAgeGroup } from '../utils/getAgeGroup';
import { motion } from 'framer-motion';
import { UserCharacter, Link as LinkType } from '../types';

export function SubmitCharacterPage() {
  const { user } = useAuth();
  const { addUserCharacter } = useUserCharacters();
  const navigate = useNavigate();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Partial<Omit<UserCharacter, 'id' | 'createdAt'>>>({
    name: '',
    occupation: '',
    description: '',
    fullDescription: '',
    gender: 'female',
    age: 18,
    ageGroup: '18+',
    tags: [],
    links: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-8 border border-red-500/20 text-center">
          <Plus className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Доступ запрещен</h2>
          <p className="text-slate-400">Войдите в систему, чтобы предложить персонажа</p>
        </div>
      </div>
    );
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const age = parseInt(e.target.value, 10);
    const newAge = isNaN(age) ? 0 : Math.max(0, age);
    setFormData({
      ...formData,
      age: newAge,
      ageGroup: getAgeGroup(newAge),
    });
  };

  const addTag = () => {
    const newTag = prompt('Введите новый тег:');
    if (newTag) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), newTag.trim()] }));
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({ ...prev, tags: (prev.tags || []).filter((_, i) => i !== index) }));
  };
  
  const addLink = () => {
    setFormData(prev => ({ ...prev, links: [...(prev.links || []), { label: '', url: '' }] }));
  };

  const updateLink = (index: number, field: keyof LinkType, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: (prev.links || []).map((link, i) => i === index ? { ...link, [field]: value } : link),
    }));
  };

  const removeLink = (index: number) => {
    setFormData(prev => ({ ...prev, links: (prev.links || []).filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.occupation?.trim() || !photoFile) {
      setMessage({ type: 'error', text: 'Пожалуйста, заполните обязательные поля: Имя, Профессия и Фото.' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);

    const dataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
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
    
    try {
      // @ts-ignore
      const success = await addUserCharacter(dataToSend);
      if (success) {
        setMessage({ type: 'success', text: 'Ваш персонаж успешно отправлен на рассмотрение!' });
        setFormData({
          name: '', occupation: '', description: '', fullDescription: '', gender: 'female',
          age: 18, ageGroup: '18+', tags: [], links: []
        });
        setPhotoFile(null);
        // @ts-ignore
        e.target.reset();
        setTimeout(() => navigate('/user-characters'), 3000);
      } else {
        setMessage({ type: 'error', text: 'Ошибка при отправке персонажа. Попробуйте еще раз.' });
      }
    } catch (error) {
      console.error("Ошибка при отправке персонажа:", error);
      setMessage({ type: 'error', text: 'Произошла ошибка при отправке.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="mb-8">
        <div className="relative glass rounded-3xl p-6 lg:p-8 border border-green-400/20 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="relative p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl border border-white/20 shadow-2xl">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent mb-2">Предложить персонажа</h1>
              <p className="text-slate-400">Добавьте своего уникального AI-персонажа в каталог</p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto glass rounded-3xl border border-white/10 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6">
            {message && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mb-4 p-4 rounded-2xl border text-sm ${message.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
                <div className="flex items-center space-x-2">
                    {message.type === 'success' ? (<Check className="h-4 w-4" />) : (<X className="h-4 w-4" />)}
                    <span>{message.text}</span>
                </div>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-white mb-2">Имя <span className="text-red-400">*</span></label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50" placeholder="Введите имя персонажа" required/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-white mb-2">Профессия <span className="text-red-400">*</span></label>
                    <input type="text" name="occupation" value={formData.occupation || ''} onChange={handleInputChange} className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50" placeholder="Введите профессию" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-white mb-2">Краткое описание</label>
                    <textarea name="description" value={formData.description || ''} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none" placeholder="Краткое описание персонажа"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-white mb-2">Полное описание</label>
                    <textarea name="fullDescription" value={formData.fullDescription || ''} onChange={handleInputChange} rows={4} className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none" placeholder="Подробное описание персонажа"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-white mb-2">Фотография <span className="text-red-400">*</span></label>
                    <input
                      type="file"
                      required
                      onChange={(e) => setPhotoFile(e.target.files ? e.target.files[0] : null)}
                      accept="image/*"
                      className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500/10 file:text-green-300 hover:file:bg-green-500/20"
                    />
                     {photoFile && (
                        <div className="mt-2">
                            <img 
                                src={URL.createObjectURL(photoFile)} 
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
                        <select name="gender" value={formData.gender || 'female'} onChange={handleInputChange} className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50">
                            <option value="female">Женский</option>
                            <option value="male">Мужской</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Возраст</label>
                        <input type="number" name="age" value={formData.age || 0} onChange={handleAgeChange} className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50" min="0"/>
                        <p className="text-xs text-slate-400 mt-1">Введите 0, если персонаж бессмертный.</p>
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-white">Теги</label>
                    <button type="button" onClick={addTag} className="text-sm text-green-400 hover:text-white transition-colors">
                        + Добавить тег
                    </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                    {formData.tags?.map((tag, index) => (
                        <span key={index} className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm">
                        <span>{tag}</span>
                        <button type="button" onClick={() => removeTag(index)} className="text-green-400 hover:text-red-400 transition-colors">
                            <X className="h-3 w-3" />
                        </button>
                        </span>
                    ))}
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-white">Ссылки</label>
                    <button type="button" onClick={addLink} className="text-sm text-cyan-400 hover:text-white transition-colors">
                        + Добавить ссылку
                    </button>
                    </div>
                    <div className="space-y-2">
                    {formData.links?.map((link, index) => (
                        <div key={index} className="flex space-x-2">
                        <input type="text" placeholder="Название ссылки" value={link.label} onChange={(e) => updateLink(index, 'label', e.target.value)} className="flex-1 px-3 py-2 glass rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"/>
                        <input type="url" placeholder="https://example.com" value={link.url} onChange={(e) => updateLink(index, 'url', e.target.value)} className="flex-1 px-3 py-2 glass rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"/>
                        <button type="button" onClick={() => removeLink(index)} className="p-2 text-red-400 hover:text-red-300 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                        </div>
                    ))}
                    </div>
                </div>
                </div>
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 font-bold text-lg"
            >
                {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                <>
                    <Send className="h-5 w-5" />
                    <span>Отправить персонажа</span>
                </>
                )}
            </button>
        </form>
      </div>
    </div>
  );
}