// project/src/components/Auth/RegisterForm.tsx

import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AnimatedBackground = () => (
    <div 
        className="fixed inset-0 -z-10 animate-star-pan"
        style={{ 
            backgroundColor: 'var(--color-background)',
            backgroundImage: 'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noise)" opacity="0.03"/></svg>\')' 
        }}
    />
);

export function RegisterForm() {
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Пароли не совпадают');
      return;
    }
    setLoading(true);
    const result = await register(username, nickname, email, password);
    if (result.success) {
      navigate('/');
    } else {
      setMessage(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="glass rounded-3xl border border-border-primary/50 shadow-2xl">
          <div className="p-8">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="p-3 bg-surface-primary border border-border-primary rounded-xl mb-4">
                  <UserPlus className="h-6 w-6 text-mint" />
              </div>
              <h1 className="text-2xl font-bold text-white">Регистрация</h1>
              <p className="text-text-secondary mt-1">Присоединяйтесь к нам</p>
            </div>

            {message && (
              <div className="mb-4 text-center text-rose-quartz bg-rose-quartz/10 p-3 rounded-xl border border-rose-quartz/20 text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <input value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-3 bg-background-primary border border-border-primary rounded-xl text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-mint transition-all" placeholder="Логин" required />
              <input value={nickname} onChange={e => setNickname(e.target.value)} className="w-full px-4 py-3 bg-background-primary border border-border-primary rounded-xl text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-mint transition-all" placeholder="Никнейм" required />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-background-primary border border-border-primary rounded-xl text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-mint transition-all" placeholder="Email" required />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-background-primary border border-border-primary rounded-xl text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-mint transition-all" placeholder="Пароль" required />
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-background-primary border border-border-primary rounded-xl text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-mint transition-all" placeholder="Повторите пароль" required />

              <button
                type="submit"
                disabled={loading}
                className="w-full group px-6 py-3 bg-mint text-background-primary rounded-xl shadow-lg shadow-mint/20 transition-all disabled:opacity-50 font-bold"
              >
                {loading ? 'Создание...' : 'Создать аккаунт'}
              </button>
            </form>
          </div>

          <div className="bg-black/20 p-4 text-center rounded-b-3xl border-t border-border-primary">
            <p className="text-sm text-text-secondary">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="font-semibold text-mint hover:text-white transition-colors">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}