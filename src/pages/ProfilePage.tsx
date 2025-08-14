// project/src/pages/ProfilePage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { User, Save, Lock, Shield, AtSign, X, Image as ImageIcon, Link as LinkIcon, Upload, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, nickname: user.nickname, email: user.email }));
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  if (!user) { return <div></div>; }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) { // 3MB
        setMessage({ type: 'error', text: 'Файл слишком большой (макс. 3МБ)' });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarUrl('');
    }
  };

  const handleUrlLoad = async () => {
    if (!avatarUrl.trim()) return;
    try {
      const response = await fetch(avatarUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      if (blob.size > 3 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Файл по ссылке слишком большой (макс. 3МБ)' });
        return;
      }
      const file = new File([blob], "avatar.jpg", { type: blob.type });
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setMessage({ type: 'success', text: 'Аватар по ссылке загружен!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Не удалось загрузить изображение по ссылке.' });
    }
  };

  const handleSave = async () => {
    setMessage(null);
    const updates: any = { avatarFile };

    if (formData.nickname !== user.nickname) updates.nickname = formData.nickname;
    if (formData.email !== user.email) updates.email = formData.email;
    
    if (formData.newPassword) {
      if (!formData.currentPassword) { setMessage({ type: 'error', text: 'Введите текущий пароль для смены' }); return; }
      if (formData.newPassword !== formData.confirmPassword) { setMessage({ type: 'error', text: 'Новые пароли не совпадают' }); return; }
      if (formData.newPassword.length < 8) { setMessage({ type: 'error', text: 'Пароль должен быть не менее 8 символов' }); return; }
      updates.oldPassword = formData.currentPassword;
      updates.password = formData.newPassword;
    }
    
    const result = await updateProfile(updates);
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });

    if (result.success) {
      setIsEditing(false);
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setAvatarFile(null);
      setAvatarUrl('');
    }
    
    setTimeout(() => setMessage(null), 4000);
  };
  
  const handleCancel = () => {
    if (user) {
        setFormData({
            nickname: user.nickname,
            email: user.email,
            currentPassword: '', newPassword: '', confirmPassword: '',
        });
        setAvatarPreview(user.avatar || '');
        setAvatarFile(null);
        setAvatarUrl('');
    }
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="mb-8">
        <div className="relative glass rounded-3xl p-6 lg:p-8 border border-accent-primary/20 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="relative p-4 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-2xl border border-white/20 shadow-2xl">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-1">
                Мой профиль
              </h1>
              <p className="text-slate-400">Управление аккаунтом и настройками</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="glass rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <img src={avatarPreview || `https://api.dicebear.com/8.x/initials/svg?seed=${user.username}`} alt={user.nickname} className="w-16 h-16 rounded-full object-cover bg-slate-700"/>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user.nickname}</h2>
                  <p className="text-slate-400">@{user.username}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity">
                    <User className="h-4 w-4" /><span>Редактировать</span>
                  </button>
                ) : (
                  <>
                    <button onClick={handleSave} className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity">
                      <Save className="h-4 w-4" /><span>Сохранить</span>
                    </button>
                    <button onClick={handleCancel} className="flex items-center space-x-2 px-5 py-2.5 glass text-slate-300 hover:text-white rounded-xl font-semibold">
                      <X className="h-4 w-4" /><span>Отмена</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            {message && (
              <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className={`mb-6 p-4 rounded-xl border text-sm ${ message.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
                {message.text}
              </motion.div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white">Основная информация</h3>
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-slate-300 mb-2"><User size={16}/><span>Логин (нельзя изменить)</span></label>
                  <input type="text" value={user.username} disabled className="w-full px-4 py-3 glass rounded-xl text-slate-400 cursor-not-allowed"/>
                </div>
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-slate-300 mb-2"><Shield size={16}/><span>Никнейм</span></label>
                  <input type="text" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} disabled={!isEditing} className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-secondary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"/>
                </div>
                <div>
                  <label className="flex items-center space-x-2 text-sm font-semibold text-slate-300 mb-2"><AtSign size={16}/><span>Email</span></label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!isEditing} className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-secondary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"/>
                </div>
              </div>
              <div className="space-y-6">
                 <h3 className="text-xl font-bold text-white">Смена аватара</h3>
                 {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-semibold text-slate-300 mb-2"><Upload size={16}/><span>Загрузить файл (до 3МБ)</span></label>
                      <input ref={fileInputRef} type="file" onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden"/>
                      <button onClick={() => fileInputRef.current?.click()} className="w-full text-center py-3 glass rounded-xl font-semibold text-cyan-300 hover:text-white transition-colors">
                        Выбрать изображение
                      </button>
                    </div>
                     <div>
                      <label className="flex items-center space-x-2 text-sm font-semibold text-slate-300 mb-2"><LinkIcon size={16}/><span>Или вставьте ссылку</span></label>
                      <div className="flex space-x-2">
                        <input type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="flex-1 w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-secondary/50 transition-all" placeholder="https://..."/>
                        <button onClick={handleUrlLoad} className="px-4 glass rounded-xl text-cyan-300 hover:text-white transition-colors"><Check size={20}/></button>
                      </div>
                    </div>
                  </div>
                 ) : (
                    <div className="glass rounded-xl p-4 h-full flex items-center justify-center"><p className="text-slate-400 text-sm text-center">Нажмите "Редактировать", чтобы изменить аватар и другие данные</p></div>
                 )}
              </div>
              <div className="space-y-6 lg:col-span-2">
                <h3 className="text-xl font-bold text-white">Изменение пароля</h3>
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type='password' value={formData.currentPassword} onChange={e => setFormData({...formData, currentPassword: e.target.value})} placeholder="Текущий пароль" className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-secondary/50"/>
                    <input type='password' value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} placeholder="Новый пароль" className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-secondary/50"/>
                    <input type='password' value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} placeholder="Подтвердите пароль" className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-secondary/50"/>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Нажмите "Редактировать", чтобы изменить пароль.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}