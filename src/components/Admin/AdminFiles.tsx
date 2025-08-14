// project/src/components/Admin/AdminFiles.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Folder, Image as ImageIcon, Trash2, User, UserSquare, Users, Loader2 } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useUserCharacters } from '../../contexts/UserCharactersContext';
import { pb } from '../../lib/pocketbase';
import { motion } from 'framer-motion';

type FileItem = {
  id: string;
  collectionId: string;
  collectionName: 'users' | 'characters' | 'user_characters';
  recordId: string;
  fileName: string;
  fileUrl: string;
  contextName: string; // Nickname or character name
};

const FolderButton = ({ icon, label, count, isActive, onClick }: { icon: React.ReactNode, label: string, count: number, isActive: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 w-full text-left ${isActive ? 'bg-blue-500/20' : 'hover:bg-white/5'}`}
  >
    <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-700/50 text-slate-300'}`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className={`font-semibold ${isActive ? 'text-white' : 'text-slate-200'}`}>{label}</p>
      <p className="text-xs text-slate-400">{count} файлов</p>
    </div>
  </button>
);

const FileCard = ({ file, onDelete }: { file: FileItem, onDelete: (file: FileItem) => void }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="glass-light p-3 rounded-xl border border-white/10 flex items-center justify-between"
  >
    <div className="flex items-center space-x-3 min-w-0">
      <img src={file.fileUrl} alt={file.fileName} className="w-12 h-12 rounded-lg object-cover bg-slate-700 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-sm text-slate-400 truncate">Владелец: <span className="font-semibold text-white">{file.contextName}</span></p>
        <p className="text-xs text-slate-500 truncate">{file.fileName}</p>
      </div>
    </div>
    <button onClick={() => onDelete(file)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0 ml-2">
      <Trash2 size={18} />
    </button>
  </motion.div>
);

export function AdminFiles() {
  const { users, characters, loadUsers, loadCharacters } = useData();
  const { userCharacters, loadUserCharacters } = useUserCharacters();

  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [activeFolder, setActiveFolder] = useState<'users' | 'characters' | 'user_characters'>('users');
  const [loading, setLoading] = useState(true);

  const processFiles = useCallback(() => {
    const processed: FileItem[] = [];

    users.forEach(user => {
      if (user.avatar && user.avatar.includes('/api/files/')) {
        processed.push({
          id: `${user.id}-avatar`,
          collectionId: user.id, // For users, this isn't the collectionId but helps identify
          collectionName: 'users',
          recordId: user.id,
          fileName: user.avatar.split('/').pop()?.split('?')[0] || 'avatar',
          fileUrl: user.avatar,
          contextName: user.nickname,
        });
      }
    });

    characters.forEach(char => {
      if (char.photo && char.photo.includes('/api/files/')) {
        processed.push({
          id: `${char.id}-photo`,
          collectionId: pb.collection('characters').collectionIdOrName,
          collectionName: 'characters',
          recordId: char.id,
          fileName: char.photo.split('/').pop()?.split('?')[0] || 'photo',
          fileUrl: char.photo,
          contextName: char.name,
        });
      }
    });
    
    userCharacters.forEach(char => {
      if (char.photo && char.photo.includes('/api/files/')) {
        processed.push({
          id: `${char.id}-photo-user`,
          collectionId: pb.collection('user_characters').collectionIdOrName,
          collectionName: 'user_characters',
          recordId: char.id,
          fileName: char.photo.split('/').pop()?.split('?')[0] || 'photo',
          fileUrl: char.photo,
          contextName: char.name,
        });
      }
    });

    setAllFiles(processed);
  }, [users, characters, userCharacters]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadUsers(),
      loadCharacters(),
      loadUserCharacters()
    ]).finally(() => {
      setLoading(false);
    });
  }, [loadUsers, loadCharacters, loadUserCharacters]);

  useEffect(() => {
    processFiles();
  }, [users, characters, userCharacters, processFiles]);


  const handleDelete = async (file: FileItem) => {
    if (confirm(`Вы уверены, что хотите удалить файл для "${file.contextName}"? Это действие необратимо.`)) {
      try {
        const fieldToClear = file.collectionName === 'users' ? 'avatar' : 'photo';
        await pb.collection(file.collectionName).update(file.recordId, { [fieldToClear]: null });
        
        // Optimistically update UI
        setAllFiles(prev => prev.filter(f => f.id !== file.id));

      } catch (error) {
        console.error("Ошибка при удалении файла:", error);
        alert("Не удалось удалить файл.");
      }
    }
  };

  const folders = useMemo(() => ({
    users: allFiles.filter(f => f.collectionName === 'users'),
    characters: allFiles.filter(f => f.collectionName === 'characters'),
    user_characters: allFiles.filter(f => f.collectionName === 'user_characters'),
  }), [allFiles]);

  const displayedFiles = folders[activeFolder];

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-400 animate-pulse">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
        Загрузка файлов...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Файловый менеджер</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-slate-300 mb-4 px-2">Папки</h3>
          <div className="space-y-2">
            <FolderButton 
              icon={<Users size={20} />} 
              label="Аватары" 
              count={folders.users.length}
              isActive={activeFolder === 'users'}
              onClick={() => setActiveFolder('users')}
            />
            <FolderButton 
              icon={<User size={20} />} 
              label="Персонажи (Админ)" 
              count={folders.characters.length}
              isActive={activeFolder === 'characters'}
              onClick={() => setActiveFolder('characters')}
            />
            <FolderButton 
              icon={<UserSquare size={20} />} 
              label="Персонажи (Польз.)" 
              count={folders.user_characters.length}
              isActive={activeFolder === 'user_characters'}
              onClick={() => setActiveFolder('user_characters')}
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-lg font-semibold text-slate-300">Содержимое папки</h3>
            <span className="text-sm text-slate-400">{displayedFiles.length} элементов</span>
          </div>
          <div className="glass-light p-4 rounded-2xl border border-white/10 min-h-[400px]">
            {displayedFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayedFiles.map(file => (
                  <FileCard key={file.id} file={file} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                <ImageIcon size={48} className="mb-4" />
                <p className="font-semibold">В этой папке пусто</p>
                <p className="text-sm">Загруженные файлы появятся здесь.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}