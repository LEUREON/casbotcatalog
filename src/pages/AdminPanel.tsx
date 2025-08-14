// project/src/pages/AdminPanel.tsx

import React, { useState, useEffect } from 'react';
import { Shield, Users, Bot, ShoppingBag, MessageSquare, User, File, UserSquare, Mail } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { AdminCharacters } from '../components/Admin/AdminCharacters';
import { AdminUsers } from '../components/Admin/AdminUsers';
import { AdminOrders } from '../components/Admin/AdminOrders';
import { AdminShop } from '../components/Admin/AdminShop';
import { AdminSupport } from '../components/Admin/AdminSupport'; // <-- Правильный импорт
import { AdminFiles } from '../components/Admin/AdminFiles';
import { AdminUserCharacters } from '../components/Admin/AdminUserCharacters';
import { AdminBroadcast } from '../components/Admin/AdminBroadcast';

export function AdminPanel() {
  const { isAdmin } = useAuth();
  const { loadUsers, loadOrders, loadShopItems, loadMessages, loadUserCharacters, loadNewsletters } = useData();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState(location.state?.initialTab || 'characters');

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'files') {
      loadUsers();
    }
    
    switch (activeTab) {
      case 'orders': loadOrders(); break;
      case 'shop': loadShopItems(); break;
      case 'messages': loadMessages(); break;
      case 'user-characters': loadUserCharacters(); break;
      case 'broadcast': loadNewsletters(); break;
    }
  }, [activeTab, loadUsers, loadOrders, loadShopItems, loadMessages, loadUserCharacters, loadNewsletters]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-8 border border-red-500/20 text-center">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Доступ запрещен</h2>
            <p className="text-slate-400">Только администраторы могут получить доступ к этой странице.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'characters', label: 'Персонажи', icon: User, gradient: 'from-purple-500 to-violet-500' },
    { id: 'user-characters', label: 'Персонажи (польз.)', icon: UserSquare, gradient: 'from-green-500 to-teal-500' },
    { id: 'users', label: 'Пользователи', icon: Users, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'orders', label: 'Заказы ботов', icon: Bot, gradient: 'from-green-500 to-emerald-500' },
    { id: 'shop', label: 'Магазин', icon: ShoppingBag, gradient: 'from-pink-500 to-rose-500' },
    { id: 'messages', label: 'Поддержка', icon: MessageSquare, gradient: 'from-indigo-500 to-purple-500' },
    { id: 'broadcast', label: 'Объявления', icon: Mail, gradient: 'from-amber-500 to-orange-500' },
    { id: 'files', label: 'Файлы', icon: File, gradient: 'from-gray-500 to-slate-500' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'characters': return <AdminCharacters />;
      case 'user-characters': return <AdminUserCharacters />;
      case 'users': return <AdminUsers />;
      case 'orders': return <AdminOrders />;
      case 'shop': return <AdminShop />;
      case 'messages': return <AdminSupport />; // <-- Правильный компонент
      case 'broadcast': return <AdminBroadcast />;
      case 'files': return <AdminFiles />;
      default: return <AdminCharacters />;
    }
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-purple-500/10 rounded-3xl blur-3xl animate-pulse"></div>
          <div className="relative glass rounded-3xl p-6 lg:p-8 border border-purple-500/20 shadow-2xl">
            <div className="flex items-center space-x-4">
              <div className="relative p-4 bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl border border-white/20 shadow-2xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-purple-200 to-violet-200 bg-clip-text text-transparent mb-2">
                  Панель администратора
                </h1>
                <p className="text-slate-400">Управление контентом и пользователями</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="mb-8">
        <div className="glass rounded-2xl p-2 border border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative p-4 rounded-xl transition-all duration-300 ${activeTab === tab.id ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg` : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <div className="relative flex flex-col items-center space-y-2">
                  <tab.icon className="h-6 w-6" />
                  <span className="text-sm font-medium text-center">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="glass rounded-3xl border border-white/10 min-h-[600px]">
        {renderContent()}
      </div>
    </div>
  );
}