// project/src/components/Admin/AdminBroadcast.tsx

import React, { useState, useEffect } from 'react';
import { Mail, Send, Trash2, Edit, Save, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Newsletter } from '../../types';

export function AdminBroadcast() {
  const { newsletters, loadNewsletters, addNewsletter, updateNewsletter, deleteNewsletter } = useData();
  const { user } = useAuth();

  const [formData, setFormData] = useState<{title: string, content: string, imageFile: File | null}>({ title: '', content: '', imageFile: null });
  const [editingItem, setEditingItem] = useState<Newsletter | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadNewsletters();
  }, [loadNewsletters]);

  const handleEdit = (item: Newsletter) => {
    setEditingItem(item);
    setFormData({ title: item.title, content: item.content, imageFile: null });
  };

  const handleCancel = () => {
    setEditingItem(null);
    setFormData({ title: '', content: '', imageFile: null });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить это объявление?')) {
        await deleteNewsletter(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !user) return;
    
    setIsSubmitting(true);
    setMessage('');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('content', formData.content);
    data.append('sentBy', user.id);
    data.append('status', 'sent');
    if (formData.imageFile) {
        data.append('image', formData.imageFile);
    }

    try {
      const success = editingItem 
        ? await updateNewsletter(editingItem.id, data)
        : await addNewsletter(data);

      if (success) {
        setMessage(editingItem ? 'Объявление успешно обновлено!' : 'Объявление успешно создано!');
        handleCancel();
        // @ts-ignore
        e.target.reset();
      } else {
        setMessage('Ошибка при сохранении объявления.');
      }
    } catch (err) {
      setMessage('Произошла ошибка.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">{editingItem ? 'Редактировать объявление' : 'Новое объявление'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Заголовок</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Сообщение (поддерживает HTML)</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(f => ({ ...f, content: e.target.value }))}
              rows={10}
              className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Изображение (необязательно)</label>
            <input
              type="file"
              onChange={(e) => setFormData(f => ({ ...f, imageFile: e.target.files ? e.target.files[0] : null }))}
              accept="image/*"
              className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500/10 file:text-orange-300 hover:file:bg-orange-500/20"
            />
          </div>
          <div className="flex space-x-2">
            <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 font-bold"
            >
                <Save size={18} />
                <span>{isSubmitting ? 'Сохранение...' : (editingItem ? 'Сохранить изменения' : 'Опубликовать')}</span>
            </button>
            {editingItem && (
                <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-4 glass text-slate-300 rounded-xl"
                >
                <X size={18} />
                </button>
            )}
          </div>
          {message && <p className="text-center text-green-400 mt-2">{message}</p>}
        </form>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">История объявлений</h2>
        <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
          {newsletters.length > 0 ? (
            newsletters.map(item => (
              <div key={item.id} className="glass-light p-4 rounded-xl border border-white/10">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-white">{item.title}</p>
                        <p className="text-xs text-slate-400 mb-2">
                        Опубликовано: {new Date(item.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={() => handleEdit(item)} className="p-2 hover:bg-white/10 rounded-md text-blue-400"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-white/10 rounded-md text-red-400"><Trash2 size={16}/></button>
                    </div>
                </div>
                <p className="text-sm text-slate-300 line-clamp-2" dangerouslySetInnerHTML={{ __html: item.content }} />
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-8">Еще не было ни одного объявления.</p>
          )}
        </div>
      </div>
    </div>
  );
}