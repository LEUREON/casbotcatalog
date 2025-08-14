// project/src/components/Auth/LoginForm.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoginStatus } from '../../types';
import { motion } from 'framer-motion';
import { LogIn, User, Lock, Frown } from 'lucide-react';

const NoiseBackground = () => (
  <div className="fixed inset-0 -z-10 animate-star-pan" style={{
    backgroundColor: 'var(--color-background)',
    backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noise)" opacity="0.03"/></svg>')`
  }}/>
);

export function LoginForm() {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isUserBlocked } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const blocked = await isUserBlocked(identity);
    if (blocked) {
      setErrorMessage('Ваш аккаунт заблокирован.');
      setIsSubmitting(false);
      return;
    }

    const status = await login(identity, password);
    if (status === LoginStatus.SUCCESS) {
      navigate('/');
    } else {
      setErrorMessage('Неверный логин или пароль.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        <NoiseBackground />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-sm">
            <div className="glass rounded-3xl border border-border-primary/50 shadow-2xl">
                <div className="p-8">
                    <div className="flex flex-col items-center text-center mb-8">
                        {errorMessage.includes('заблокирован') ? (
                           <Frown className="h-12 w-12 text-rose-quartz mb-4" />
                        ) : (
                          <div className="p-3 bg-surface-primary border border-border-primary rounded-xl mb-4">
                            <LogIn className="h-6 w-6 text-lavender" />
                          </div>
                        )}
                        <h1 className="text-2xl font-bold text-white">Вход в аккаунт</h1>
                        <p className="text-text-secondary mt-1">Добро пожаловать!</p>
                    </div>
                    
                    {errorMessage && (
                        <div className="mb-4 text-center text-rose-quartz bg-rose-quartz/10 p-3 rounded-xl border border-rose-quartz/20 text-sm">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
                            <input type="text" value={identity} onChange={(e) => setIdentity(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-background-primary border border-border-primary rounded-xl text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-lavender transition-all" placeholder="Логин или Email" />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-background-primary border border-border-primary rounded-xl text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-lavender transition-all" placeholder="Пароль" />
                        </div>
                        
                        <button type="submit" disabled={isSubmitting} className="w-full group flex items-center justify-center space-x-2 px-6 py-3 bg-lavender text-background-primary rounded-xl shadow-lg shadow-lavender/20 transition-all disabled:opacity-50 font-bold">
                            <span>{isSubmitting ? "Вход..." : "Войти"}</span>
                        </button>
                    </form>
                </div>

                <div className="bg-black/20 p-4 text-center rounded-b-3xl border-t border-border-primary">
                    <p className="text-sm text-text-secondary">
                        Еще нет аккаунта?{' '}
                        <Link to="/register" className="font-semibold text-lavender hover:text-white transition-colors">Создать</Link>
                    </p>
                </div>
            </div>
        </motion.div>
    </div>
  );
}