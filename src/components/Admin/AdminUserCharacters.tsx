// project/src/components/Admin/AdminUserCharacters.tsx

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Save, X, CheckCircle, Ban, Loader2 } from 'lucide-react';
import { useUserCharacters } from '../../contexts/UserCharactersContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserCharacter } from '../../types';
import { useData } from '../../contexts/DataContext';

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
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Персонажи от пользователей</h2>
        <div className="text-slate-400">Всего: {userCharacters.length}</div>
      </div>

      {message && ( /* Message rendering */ )}

      {editingCharacter && (
        <div className="rounded-2xl p-4 sm:p-6 mb-6" style={surfaceStyle({ elevated: true })}>
          <h3 className="text-xl font-bold text-white mb-4">Редактировать: {editingCharacter.name}</h3>
          {/* Form fields... */}
        </div>
      )}

      <div className="space-y-3">
        {userCharacters.map((character) => (
          <div key={character.id} className="rounded-2xl p-4" style={surfaceStyle()}>
            {/* Character details... */}
          </div>
        ))}
      </div>
    </div>
  );
}