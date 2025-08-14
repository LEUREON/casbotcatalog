import React, { useState } from 'react';
import { Bot, Clock, CheckCircle, XCircle, Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { CharacterOrder } from '../../types';

export function AdminOrders() {
  const { orders, updateOrder } = useData();
  const [editingOrder, setEditingOrder] = useState<CharacterOrder | null>(null);
  const [formData, setFormData] = useState<Partial<CharacterOrder>>({});

  const handleEdit = (order: CharacterOrder) => {
    setEditingOrder(order);
    setFormData(order);
  };

  const handleSave = () => {
    if (editingOrder && formData) {
      updateOrder(editingOrder.id, formData);
      setEditingOrder(null);
      setFormData({});
    }
  };

  const handleCancel = () => {
    setEditingOrder(null);
    setFormData({});
  };

  const updateStatus = (orderId: string, status: CharacterOrder['status']) => {
    updateOrder(orderId, { status });
  };

  const addCustomField = () => {
    const fieldName = prompt('Введите название поля:');
    if (fieldName && formData.customFields) {
      setFormData({
        ...formData,
        customFields: {
          ...formData.customFields,
          [fieldName]: ''
        }
      });
    } else if (fieldName) {
      setFormData({
        ...formData,
        customFields: { [fieldName]: '' }
      });
    }
  };

  const updateCustomField = (fieldName: string, value: any) => {
    setFormData({
      ...formData,
      customFields: {
        ...formData.customFields,
        [fieldName]: value
      }
    });
  };

  const removeCustomField = (fieldName: string) => {
    if (formData.customFields) {
      const { [fieldName]: removed, ...rest } = formData.customFields;
      setFormData({
        ...formData,
        customFields: rest
      });
    }
  };

  const getStatusColor = (status: CharacterOrder['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'processing': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getStatusLabel = (status: CharacterOrder['status']) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'processing': return 'В работе';
      case 'completed': return 'Завершен';
      case 'rejected': return 'Отклонен';
      default: return 'Неизвестно';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Заказы ботов</h2>
        <div className="flex items-center space-x-2 text-slate-400">
          <Bot className="h-5 w-5" />
          <span>Всего заказов: {orders.length}</span>
        </div>
      </div>

      {/* Edit Form */}
      {editingOrder && (
        <div className="glass-light rounded-2xl p-6 mb-6 border border-purple-500/20">
          <h3 className="text-xl font-bold text-white mb-4">Редактировать заказ</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Статус</label>
                <select
                  value={formData.status || 'pending'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as CharacterOrder['status'] })}
                  className="w-full px-4 py-3 glass rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="pending">Ожидает</option>
                  <option value="processing">В работе</option>
                  <option value="completed">Завершен</option>
                  <option value="rejected">Отклонен</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Заказчик</label>
                <input
                  type="text"
                  value={formData.userName || ''}
                  readOnly
                  className="w-full px-4 py-3 glass rounded-xl text-slate-400 bg-slate-800/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Описание заказа</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Комментарии администратора</label>
              <textarea
                value={formData.adminNotes || ''}
                onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 glass rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                placeholder="Добавьте комментарии для заказчика..."
              />
            </div>

            {/* Custom Fields */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-white">Дополнительные поля</label>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="flex items-center space-x-1 text-sm text-purple-400 hover:text-white transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Добавить поле</span>
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.customFields && Object.entries(formData.customFields).map(([fieldName, value]) => (
                  <div key={fieldName} className="flex space-x-2">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-400 mb-1">{fieldName}</label>
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => updateCustomField(fieldName, e.target.value)}
                        className="w-full px-3 py-2 glass rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomField(fieldName)}
                      className="mt-5 p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
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

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="glass-light rounded-2xl p-6 border border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-bold text-white">Заказ #{order.id.slice(-6)}</h3>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">Заказчик: {order.userName}</p>
                    <p className="text-slate-400 text-sm">
                      Дата: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(order)}
                    className="flex items-center space-x-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Редактировать</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Описание заказа:</h4>
                  <p className="text-slate-300 text-sm">{order.description}</p>
                </div>

                {order.adminNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">Комментарии администратора:</h4>
                    <p className="text-slate-300 text-sm">{order.adminNotes}</p>
                  </div>
                )}

                {order.customFields && Object.keys(order.customFields).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-2">Дополнительные поля:</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      {Object.entries(order.customFields).map(([fieldName, value]) => (
                        <div key={fieldName} className="glass rounded-lg p-3">
                          <span className="text-xs text-slate-400">{fieldName}:</span>
                          <p className="text-sm text-white">{value as string}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Status Actions */}
              <div className="flex space-x-2 mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={() => updateStatus(order.id, 'processing')}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all text-sm"
                  disabled={order.status === 'processing'}
                >
                  <Clock className="h-3 w-3" />
                  <span>В работу</span>
                </button>
                <button
                  onClick={() => updateStatus(order.id, 'completed')}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all text-sm"
                  disabled={order.status === 'completed'}
                >
                  <CheckCircle className="h-3 w-3" />
                  <span>Завершить</span>
                </button>
                <button
                  onClick={() => updateStatus(order.id, 'rejected')}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all text-sm"
                  disabled={order.status === 'rejected'}
                >
                  <XCircle className="h-3 w-3" />
                  <span>Отклонить</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Нет заказов</h3>
            <p className="text-slate-400">Заказы ботов будут отображаться здесь</p>
          </div>
        )}
      </div>
    </div>
  );
}