// project/src/components/Admin/AdminSupport.tsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Message } from '../../types';
import { Send, Paperclip, ArrowLeft, Image as ImageIcon, File as FileIcon, X } from 'lucide-react';

const ACCENT = "#f7cfe1";
const BORDER = "rgba(255,255,255,0.10)";

function surfaceStyle({ active = false }: { active?: boolean } = {}) {
  const baseAlpha = 0.07;
  return {
    background: `rgba(255,255,255,${baseAlpha})`,
    border: `1px solid ${active ? ACCENT : BORDER}`,
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  } as React.CSSProperties;
}


const FilePreview = ({ file, onRemove }: { file: File, onRemove: () => void }) => (
    <div className="relative group p-2 rounded-lg flex items-center space-x-2" style={surfaceStyle()}>
        {file.type.startsWith('image/') ? <ImageIcon className="h-5 w-5 text-slate-400"/> : <FileIcon className="h-5 w-5 text-slate-400"/>}
        <span className="text-xs text-slate-300 truncate">{file.name}</span>
        <button onClick={onRemove} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={12} />
        </button>
    </div>
);

const MessageBubble = ({ msg, isOwn }: { msg: Message, isOwn: boolean }) => (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-md p-3 rounded-2xl ${isOwn ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700/80 text-slate-200 rounded-bl-none'}`}>
            <p className="text-sm font-semibold">{isOwn ? "Вы (Админ)" : msg.userName}</p>
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
            <p className={`text-xs mt-2 ${isOwn ? 'text-indigo-200' : 'text-slate-400'} text-right`}>{new Date(msg.createdAt).toLocaleTimeString()}</p>
        </div>
    </div>
);

function TicketViewAdmin({ ticket, onBack }: { ticket: Message, onBack: () => void }) {
    const { user } = useAuth();
    const { messages, addMessage, updateMessage } = useData();
    const [replyContent, setReplyContent] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const conversation = useMemo(() => [ticket, ...messages.filter(m => m.parent === ticket.id)].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [messages, ticket]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        conversation.forEach(msg => {
            if (!msg.isReadByAdmin) updateMessage(msg.id, { isReadByAdmin: true });
        });
    }, [conversation, updateMessage]);

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
                <div className='min-w-0'>
                    <h2 className="text-lg font-bold text-white truncate">{ticket.subject}</h2>
                    <p className="text-xs text-slate-400">Тикет #{ticket.id.slice(-6)} от {ticket.userName}</p>
                </div>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {conversation.map(msg => <MessageBubble key={msg.id} msg={msg} isOwn={msg.userId === user?.id} />)}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-white/10" style={{...surfaceStyle(), border: 'none', borderTop: `1px solid ${BORDER}`}}>
                {files.length > 0 && (
                    <div className="mb-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {files.map((file, i) => <FilePreview key={i} file={file} onRemove={() => setFiles(f => f.filter((_, idx) => idx !== i))} />)}
                    </div>
                )}
                <div className="flex items-center space-x-2">
                    <input type="file" multiple id="admin-file-input" className="hidden" onChange={e => setFiles(f => [...f, ...Array.from(e.target.files || [])])} />
                    <label htmlFor="admin-file-input" className="p-3 rounded-full cursor-pointer hover:bg-white/10 border" style={{borderColor: BORDER}}><Paperclip size={20}/></label>
                    <input type="text" value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Ответ пользователю..." className="w-full px-4 py-3 rounded-full border bg-black/20 focus:ring-2 focus:ring-pink-400/50 outline-none" style={{borderColor: BORDER}}/>
                    <button onClick={handleReply} className="p-3 rounded-full text-black" style={{background: ACCENT}}><Send size={20}/></button>
                </div>
            </div>
        </div>
    );
}

export function AdminSupport() {
    const { messages, loadMessages } = useData();
    const [activeTicket, setActiveTicket] = useState<Message | null>(null);

    useEffect(() => { loadMessages() }, [loadMessages]);

    const tickets = useMemo(() => {
        const allTickets = messages.filter(m => m.isTicket);
        const replies = messages.filter(m => !m.isTicket);

        return allTickets.map(ticket => {
            const lastReply = replies
                .filter(r => r.parent === ticket.id)
                .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            
            const lastActivity = lastReply ? new Date(lastReply.createdAt) : new Date(ticket.createdAt);
            return { ...ticket, lastActivity };
        }).sort((a,b) => b.lastActivity.getTime() - a.lastActivity.getTime());

    }, [messages]);

    const hasUnread = (ticket: Message) => {
        if (!ticket.isReadByAdmin) return true;
        return messages.some(m => m.parent === ticket.id && !m.isReadByAdmin);
    };

    if (activeTicket) {
        return <div className="h-[75vh]"><TicketViewAdmin ticket={activeTicket} onBack={() => setActiveTicket(null)} /></div>
    }

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Обращения в поддержку</h2>
            <div className="space-y-3">
                {tickets.map(ticket => (
                    <div key={ticket.id} onClick={() => setActiveTicket(ticket)} className="rounded-2xl p-4 cursor-pointer hover:bg-white/5 flex justify-between items-center" style={surfaceStyle({active: hasUnread(ticket)})}>
                        <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{ticket.subject}</p>
                            <p className="text-sm text-slate-400">От: {ticket.userName}</p>
                            <p className="text-xs text-slate-500">Тикет #{ticket.id.slice(-6)} • Активность: {new Date(ticket.lastActivity).toLocaleString()}</p>
                        </div>
                        {hasUnread(ticket) && <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse flex-shrink-0 ml-4"></div>}
                    </div>
                ))}
            </div>
        </div>
    );
}