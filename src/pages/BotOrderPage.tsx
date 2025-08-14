// src/pages/BotOrderPage.tsx

import React, { useState } from 'react';
import { Bot, CreditCard, Send, Check, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { CharacterOrder } from '../types';

const getStatusInfo = (status: CharacterOrder['status']) => {
    switch (status) {
      case 'pending': return { icon: <Clock className="h-4 w-4 text-yellow-400" />, label: 'В ожидании', color: 'text-yellow-400' };
      case 'processing': return { icon: <Clock className="h-4 w-4 text-blue-400 animate-spin" />, label: 'В работе', color: 'text-blue-400' };
      case 'completed': return { icon: <CheckCircle className="h-4 w-4 text-green-400" />, label: 'Завершен', color: 'text-green-400' };
      case 'rejected': return { icon: <XCircle className="h-4 w-4 text-red-400" />, label: 'Отклонен', color: 'text-red-400' };
      default: return { icon: <Clock className="h-4 w-4 text-slate-400" />, label: 'Неизвестно', color: 'text-slate-400' };
    }
};

export function BotOrderPage() {
  const { user } = useAuth();
  const { addOrder, orders } = useData();
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-8 border border-red-500/20 text-center">
          <Bot className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Доступ запрещен</h2>
          <p className="text-slate-400">Войдите в систему для создания заказа</p>
        </div>
      </div>
    );
  }

  const userOrders = orders.filter(order => order.userId === user.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Пожалуйста, заполните описание вашего заказа.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const success = await addOrder({ description });
      
      if (success) {
        setMessage({ type: 'success', text: 'Заказ успешно отправлен! Администратор рассмотрит его в ближайшее время.' });
        setDescription('');
      } else {
        throw new Error("Failed to add order");
      }
      
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при отправке заказа. Попробуйте еще раз.' });
    } finally {
      setIsSubmitting(false);
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
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl blur-xl opacity-75 animate-pulse"></div>
                <div className="relative p-4 bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl border border-white/20 shadow-2xl">
                  <Bot className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-purple-200 to-violet-200 bg-clip-text text-transparent mb-2">
                  Заказать бота
                </h1>
                <div className="flex items-center space-x-3 text-slate-400">
                  <CreditCard className="h-5 w-5 text-purple-400" />
                  <span>Создайте уникального AI-персонажа</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Form and Orders Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <form onSubmit={handleSubmit} className="glass rounded-3xl border border-white/10 p-6 lg:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Новый заказ</h2>
            {message && (
              <div className={`p-4 rounded-xl border ${
                message.type === 'success' 
                  ? 'bg-green-500/20 border-green-500/30 text-green-300'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}>
                <div className="flex items-center space-x-2 text-sm">
                  {message.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  <span>{message.text}</span>
                </div>
              </div>
            )}
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-300 mb-2">
                Опишите вашего персонажа
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none custom-scrollbar"
                placeholder="Опишите имя, характер, внешность, предысторию и другие детали вашего будущего бота..."
                required
              />
              <p className="text-xs text-slate-500 mt-2">Чем подробнее описание, тем точнее будет результат.</p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 font-bold"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить заказ'}
              <Send size={18}/>
            </button>
          </form>
        </div>
        <div className="xl:col-span-1">
          <div className="glass rounded-3xl border border-white/10 p-6 lg:p-8 h-full">
            <h3 className="text-xl font-bold text-white mb-4">История заказов</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {userOrders.length > 0 ? (
                userOrders.map(order => {
                  const status = getStatusInfo(order.status);
                  return (
                    <div key={order.id} className="glass p-4 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-white">Заказ #{order.id.slice(-6)}</p>
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs ${status.color}`}>
                           {status.icon} <span>{status.label}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-slate-300 line-clamp-2">{order.description}</p>
                      {order.adminNotes && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs text-purple-300 font-semibold mb-1">Комментарий:</p>
                            <p className="text-xs text-slate-300">{order.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Ваши заказы будут отображаться здесь.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}