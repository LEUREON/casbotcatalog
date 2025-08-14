// project/src/pages/SupportChatPage.tsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Message } from '../types';
import { Send, Paperclip, PlusCircle, ArrowLeft, Image as ImageIcon, File as FileIcon, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const FilePreview = ({ file, onRemove }: { file: File, onRemove: () => void }) => (
    <div className="relative group bg-slate-700/50 p-2 rounded-lg flex items-center space-x-2">
        {file.type.startsWith('image/') ? <ImageIcon className="h-5 w-5 text-slate-400"/> : <FileIcon className="h-5 w-5 text-slate-400"/>}
        <span className="text-xs text-slate-300 truncate">{file.name}</span>
        <button onClick={onRemove} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={12} />
        </button>
    </div>
);

const MessageBubble = ({ msg, isOwn }: { msg: Message, isOwn: boolean }) => (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-md p-3 rounded-2xl ${isOwn ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
            <p className="text-sm font-semibold">{isOwn ? "Вы" : msg.userName}</p>
            <p className="text-sm mt-1 whitespace-pre-wrap break-words">{msg.content}</p>
            {msg.files && msg.files.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                    {msg.files.map(url => (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline text-cyan-300 break-all">
                            {url.split('/').pop()?.split('?')[0]}
                        </a>
                    ))}
                </div>
            )}
            <p className={`text-xs mt-2 ${isOwn ? 'text-blue-200' : 'text-slate-400'} text-right`}>{new Date(msg.createdAt).toLocaleTimeString()}</p>
        </div>
    </div>
);

function TicketView({ ticket, onBack }: { ticket: Message, onBack: () => void }) {
    const { user } = useAuth();
    const { messages, addMessage, updateMessage } = useData();
    const [replyContent, setReplyContent] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const conversation = useMemo(() => [ticket, ...messages.filter(m => m.parent === ticket.id)].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [messages, ticket]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        conversation.forEach(msg => {
            if (!msg.isReadByUser && msg.userId !== user?.id) {
                updateMessage(msg.id, { isReadByUser: true });
            }
        });
    }, [conversation, updateMessage, user?.id]);

    const handleReply = async () => {
        if (!replyContent.trim() && files.length === 0) return;
        
        const formData = new FormData();
        formData.append('content', replyContent);
        formData.append('parent', ticket.id);
        formData.append('isTicket', 'false');
        files.forEach(file => formData.append('files', file));

        const success = await addMessage(formData);
        if (success) {
            setReplyContent('');
            setFiles([]);
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-white/10 flex items-center space-x-3">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full"><ArrowLeft /></button>
                <div className="min-w-0">
                    <h2 className="text-lg font-bold text-white truncate">{ticket.subject}</h2>
                    <p className="text-xs text-slate-400">Тикет #{ticket.id.slice(-6)}</p>
                </div>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                {conversation.map(msg => <MessageBubble key={msg.id} msg={msg} isOwn={msg.userId === user?.id} />)}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-white/10 bg-slate-800/50">
                 {files.length > 0 && (
                    <div className="mb-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {files.map((file, i) => <FilePreview key={i} file={file} onRemove={() => setFiles(f => f.filter((_, idx) => idx !== i))} />)}
                    </div>
                )}
                <div className="flex items-center space-x-2">
                    <input type="file" multiple id="file-input" className="hidden" onChange={e => setFiles(f => [...f, ...Array.from(e.target.files || [])])} />
                    <label htmlFor="file-input" className="p-3 bg-slate-700/50 rounded-full cursor-pointer hover:bg-slate-600/50"><Paperclip /></label>
                    <input type="text" value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Напишите ответ..." className="w-full px-4 py-3 glass rounded-full text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                    <button onClick={handleReply} className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-colors"><Send /></button>
                </div>
            </div>
        </div>
    );
}

function NewTicketView({ onBack }: { onBack: () => void }) {
    const { addMessage } = useData();
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    
    const handleSubmit = async () => {
        if (!subject.trim() || !content.trim()) return;

        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('content', content);
        formData.append('isTicket', 'true');
        files.forEach(file => formData.append('files', file));
        
        const success = await addMessage(formData);
        if (success) onBack();
    };

    return (
        <div className="p-6">
            <button onClick={onBack} className="flex items-center space-x-2 text-slate-300 hover:text-white mb-4"><ArrowLeft size={18}/><span>Назад</span></button>
            <h2 className="text-2xl font-bold text-white mb-4">Новый тикет</h2>
            <div className="space-y-4">
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Тема обращения" className="w-full px-4 py-3 glass rounded-xl"/>
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} placeholder="Опишите вашу проблему..." className="w-full px-4 py-3 glass rounded-xl resize-none"/>
                <div className="flex items-center justify-between">
                    <label htmlFor="new-file-input" className="flex items-center space-x-2 cursor-pointer text-cyan-400 hover:text-cyan-300">
                        <Paperclip size={18}/><span>Прикрепить файлы ({files.length})</span>
                    </label>
                    <input type="file" multiple id="new-file-input" className="hidden" onChange={e => setFiles(f => [...f, ...Array.from(e.target.files || [])])} />
                    <button onClick={handleSubmit} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-colors">Отправить</button>
                </div>
            </div>
        </div>
    );
}

export function SupportChatPage() {
  const { user } = useAuth();
  const { messages, loadMessages } = useData();
  const [activeTicket, setActiveTicket] = useState<Message | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
      const ticketId = location.state?.ticketId;
      if (ticketId && messages.length > 0) {
          const ticketToOpen = messages.find(m => m.id === ticketId && m.isTicket);
          if (ticketToOpen) {
              setActiveTicket(ticketToOpen);
          }
      }
  }, [location.state, messages]);

  const userTickets = useMemo(() => {
    if (!user) return [];
    
    const tickets = messages.filter(m => m.isTicket && m.userId === user.id);
    const replies = messages.filter(m => !m.isTicket);

    return tickets.map(ticket => {
        const conversation = [ticket, ...replies.filter(r => r.parent === ticket.id)];
        const lastMessage = conversation.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        
        return { 
            ...ticket, 
            lastActivity: lastMessage ? new Date(lastMessage.createdAt) : new Date(ticket.createdAt) 
        };
    }).sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());

  }, [messages, user]);

  const hasUnreadReplies = (ticket: Message) => {
    return messages.some(m => m.parent === ticket.id && !m.isReadByUser && m.userId !== user?.id);
  };
  
  if (activeTicket) {
      return <div className="max-w-4xl mx-auto glass rounded-3xl border border-white/10 overflow-hidden h-[80vh]"><TicketView ticket={activeTicket} onBack={() => setActiveTicket(null)} /></div>
  }
  
  if (isCreating) {
      return <div className="max-w-4xl mx-auto glass rounded-3xl border border-white/10"><NewTicketView onBack={() => setIsCreating(false)} /></div>
  }

  return (
    <div className="min-h-screen p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-white">Мои обращения</h1>
                <button onClick={() => setIsCreating(true)} className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-colors">
                    <PlusCircle size={18} />
                    <span>Создать тикет</span>
                </button>
            </div>
            <div className="glass rounded-2xl border border-white/10 p-4 space-y-3">
                {userTickets.length > 0 ? userTickets.map(ticket => (
                    <div key={ticket.id} onClick={() => setActiveTicket(ticket)} className="glass-light p-4 rounded-xl cursor-pointer hover:bg-white/5 flex justify-between items-center">
                        <div className="min-w-0">
                            <p className="font-semibold text-white truncate max-w-xs sm:max-w-md">{ticket.subject}</p>
                            <p className="text-xs text-slate-400">Тикет #{ticket.id.slice(-6)} • Активность: {new Date(ticket.lastActivity).toLocaleString()}</p>
                        </div>
                        {hasUnreadReplies(ticket) && <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse flex-shrink-0"></div>}
                    </div>
                )) : (
                    <div className="text-center text-slate-400 py-8">
                        <p>У вас еще нет обращений.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}