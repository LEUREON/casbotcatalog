// project/src/components/Admin/AdminUsers.tsx

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { User, Shield, Edit, Lock, Unlock, Mail, UserCircle, Save, X, Image as ImageIcon } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { User as UserType } from '../../types';

export function AdminUsers() {
  const { users, usersLoading, loadUsers, updateUser } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<Partial<UserType> & { newPassword?: string, newPasswordConfirm?: string }>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openEditModal = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      nickname: user.nickname,
      username: user.username,
      email: user.email,
      role: user.role,
    });
    setAvatarFile(null);
    setMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setMessage('');
    
    if (formData.newPassword && formData.newPassword !== formData.newPasswordConfirm) {
        setMessage('Пароли не совпадают!');
        return;
    }
    if (formData.newPassword && formData.newPassword.length < 8) {
        setMessage('Новый пароль должен содержать не менее 8 символов.');
        return;
    }

    const dataToSend = new FormData();
    if (formData.nickname !== editingUser.nickname) dataToSend.append('nickname', formData.nickname || '');
    if (formData.username !== editingUser.username) dataToSend.append('username', formData.username || '');
    if (formData.email !== editingUser.email) dataToSend.append('email', formData.email || '');
    if (formData.role !== editingUser.role) dataToSend.append('role', formData.role || 'user');
    if (formData.newPassword) {
        dataToSend.append('password', formData.newPassword);
        dataToSend.append('passwordConfirm', formData.newPasswordConfirm || '');
    }
    if (avatarFile) {
        dataToSend.append('avatar', avatarFile);
    }
    
    let hasData = false;
    // @ts-ignore
    for (const _ of dataToSend.entries()) {
        hasData = true;
        break;
    }
    if (!hasData) {
        setMessage('Нет изменений для сохранения.');
        return;
    }

    const success = await updateUser(editingUser.id, dataToSend);

    if (success) {
      closeModal();
    } else {
      setMessage('Ошибка при обновлении пользователя.');
    }
  };

  const handleBlockToggle = (user: UserType) => {
    // ▼▼▼ ИСПРАВЛЕНИЕ ЗДЕСЬ ▼▼▼
    updateUser(user.id, { is_blocked: !user.isBlocked });
    // ▲▲▲ КОНЕЦ ИСПРАВЛЕНИЙ ▲▲▲
  };

  if (usersLoading) {
    return <div className="p-6 text-center text-slate-400 animate-pulse">Загрузка пользователей...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Управление пользователями</h2>
        <div className="flex items-center space-x-2 text-slate-400">
          <Shield className="h-5 w-5" />
          <span>Всего: {users.length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="glass-light rounded-2xl p-4 border border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <img
                  src={user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${user.username}`}
                  alt={user.nickname}
                  className="w-12 h-12 rounded-full object-cover bg-slate-700"
                />
                <div>
                  <h3 className="font-bold text-white">
                    {user.nickname} <span className="text-slate-400 text-sm">@{user.username}</span>
                  </h3>
                  <p className="text-slate-400 text-sm">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-300'}`}>
                  {user.role}
                </span>
                {user.isBlocked && (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold">ЗАБЛОКИРОВАН</span>
                )}
              </div>
              <div className="flex space-x-2">
                <button onClick={() => openEditModal(user)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleBlockToggle(user)} className={`p-2 rounded-lg ${user.isBlocked ? "text-green-400 hover:bg-green-500/20" : "text-red-400 hover:bg-red-500/20"}`}>
                  {user.isBlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl glass p-6 text-left align-middle shadow-xl transition-all border border-white/10">
                            <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white mb-4">
                                Редактировать: {editingUser?.nickname}
                            </Dialog.Title>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Никнейм</label>
                                    <input type="text" value={formData.nickname || ''} onChange={(e) => setFormData({...formData, nickname: e.target.value})} className="w-full px-4 py-2 glass rounded-lg text-white" />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Логин</label>
                                    <input type="text" value={formData.username || ''} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2 glass rounded-lg text-white" />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Email</label>
                                    <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 glass rounded-lg text-white" />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Роль</label>
                                    <select value={formData.role || 'user'} onChange={(e) => setFormData({...formData, role: e.target.value as 'user' | 'admin'})} className="w-full px-4 py-2 glass rounded-lg text-white">
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Новый пароль (оставьте пустым, чтобы не менять)</label>
                                    <input type="password" placeholder="Новый пароль" value={formData.newPassword || ''} onChange={(e) => setFormData({...formData, newPassword: e.target.value})} className="w-full px-4 py-2 glass rounded-lg text-white mb-2" />
                                    <input type="password" placeholder="Подтвердите пароль" value={formData.newPasswordConfirm || ''} onChange={(e) => setFormData({...formData, newPasswordConfirm: e.target.value})} className="w-full px-4 py-2 glass rounded-lg text-white" />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 mb-1 block">Новый аватар</label>
                                    <input type="file" onChange={(e) => setAvatarFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"/>
                                </div>
                            </div>
                            
                            {message && <p className="text-sm text-red-400 mt-4">{message}</p>}

                            <div className="mt-6 flex justify-end space-x-2">
                                <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-white/10">Отмена</button>
                                <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Сохранить</button>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </Dialog>
      </Transition>
    </div>
  );
}