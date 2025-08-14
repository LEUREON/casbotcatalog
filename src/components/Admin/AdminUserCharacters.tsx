// project/src/components/Admin/AdminUserCharacters.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye, CheckCircle, Ban, Loader2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useUserCharacters } from '../../contexts/UserCharactersContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserCharacter } from '../../types';

export function AdminUserCharacters() {
  const { userCharacters, loading: userCharactersLoading, loadUserCharacters, updateUserCharacter, deleteUserCharacter } = useUserCharacters();
  const { addNotification } = useData(); 
  const { user, isAdmin } = useAuth();
  const [editingCharacter, setEditingCharacter] = useState<UserCharacter | null>(null);
  const [formData, setFormData] = useState<Partial<UserCharacter>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUserCharacters();
  }, [loadUserCharacters]);

  const handleEdit = (character: UserCharacter) => {
    setEditingCharacter(character);
    setFormData(character);
    setMessage(null);
  };

  const handleSave = async () => {
    if (!editingCharacter || !isAdmin || !user) {
      setMessage({ type: 'error', text: 'У вас нет прав для этого действия.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const oldStatus = editingCharacter.status;
    const newStatus = formData.status;

    try {
      const success = await updateUserCharacter(editingCharacter.id, formData);
      if (success) {
        if (newStatus && oldStatus !== newStatus && oldStatus === 'pending') {
          const statusMessage = newStatus === 'approved' 
            ? 'одобрил вашего персонажа' 
            : 'отклонил вашего персонажа';
            
          await addNotification({
            recipientId: editingCharacter.createdBy,
            senderId: user.id,
            senderName: user.nickname,
            type: 'status_change',
            entityId: editingCharacter.id,
            message: `${statusMessage}: "${editingCharacter.name}"`,
            isRead: false,
          });
        }

        setMessage({ type: 'success', text: 'Персонаж успешно обновлен!' });
        handleCancel();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Ошибка при обновлении персонажа.' });
      }
    } catch (error) {
      console.error('Ошибка при сохранении персонажа:', error);
      setMessage({ type: 'error', text: 'Произошла ошибка при сохранении.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingCharacter(null);
    setFormData({});
    setMessage(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого пользовательского персонажа? Это действие необратимо.')) {
      try {
        const success = await deleteUserCharacter(id);
        if (success) {
          setMessage({ type: 'success', text: 'Персонаж успешно удален!' });
          setTimeout(() => setMessage(null), 3000);
        } else {
          setMessage({ type: 'error', text: 'Ошибка при удалении персонажа.' });
        }
      } catch (error) {
        console.error("Ошибка при удалении пользовательского персонажа:", error);
        setMessage({ type: 'error', text: 'Не удалось удалить персонажа.' });
      }
    }
  };

  const getStatusColor = (status: UserCharacter['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusLabel = (status: UserCharacter['status']) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'approved': return 'Одобрен';
      case 'rejected': return 'Отклонен';
      default: return 'Неизвестно';
    }
  };

  if (userCharactersLoading) {
    return (
      <div className="p-6 text-center text-slate-400 animate-pulse">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
        Загрузка персонажей пользователей...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Управление персонажами пользователей</h2>
        <div className="flex items-center space-x-2 text-slate-400">
          <span>Всего: {userCharacters.length}</span>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-2xl border ${
          message.type === 'success' 
            ? 'bg-green-500/20 border-green-500/30 text-green-300'
            : 'bg-red-500/20 border-red-500/30 text-red-300'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {editingCharacter && (
        <div className="glass-light rounded-2xl p-6 mb-6 border border-teal-500/20">
          <h3 className="text-xl font-bold text-white mb-4">Редактировать персонажа: {editingCharacter.name}</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Имя</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  placeholder="Имя персонажа"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Профессия</label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation || ''}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  placeholder="Профессия"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Полное описание</label>
                <textarea
                  name="fullDescription"
                  value={formData.fullDescription || ''}
                  onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                  placeholder="Подробное описание персонажа"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Статус</label>
                <select
                  name="status"
                  value={formData.status || 'pending'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as UserCharacter['status'] })}
                  className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value="pending">Ожидает</option>
                  <option value="approved">Одобрен</option>
                  <option value="rejected">Отклонен</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Пол</label>
                <select
                  name="gender"
                  value={formData.gender || 'female'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                  className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value="female">Женский</option>
                  <option value="male">Мужской</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Возраст</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age || 18}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">URL фотографии</label>
                <input
                  type="url"
                  name="photo"
                  value={formData.photo || ''}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Сохранить</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-3 glass text-slate-300 hover:text-white rounded-xl transition-all disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              <span>Отмена</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {userCharacters.length > 0 ? (
          userCharacters.map((character) => (
            <div key={character.id} className="glass-light rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={character.photo}
                    alt={character.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{character.name}</h3>
                    <p className="text-cyan-400 text-sm truncate">{character.occupation}</p>
                    <p className="text-slate-400 text-xs">Добавил: {character.createdBy}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(character.status)}`}>
                    {getStatusLabel(character.status)}
                  </span>
                  <button
                    onClick={() => handleEdit(character)}
                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(character.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-1 line-clamp-2">{character.description}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold text-white mb-2">Нет пользовательских персонажей</h3>
            <p className="text-slate-400">Пользователи пока не добавили персонажей.</p>
          </div>
        )}
      </div>
    </div>
  );
}