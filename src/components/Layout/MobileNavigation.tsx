// project/src/components/Layout/MobileNavigation.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  Compass,
  BarChart2,
  Heart,
  User,
  Menu,
  X,
  Bell,
  Users,
  ShoppingBag,
  Bot,
  PlusCircle,
  MessageSquare,
  Shield,
  LogOut,
  ChevronRight
} from 'lucide-react';

// --- Главный компонент ---
export function MobileNavigation() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Блокировка прокрутки фона при открытом меню
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  return (
    <>
      <BottomDock openMenu={() => setMenuOpen(true)} />
      <AnimatePresence>
        {menuOpen && <FullScreenMenu onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

// --- Нижняя панель ---
function BottomDock({ openMenu }: { openMenu: () => void }) {
  const location = useLocation();
  const { user } = useAuth();

  const items = [
    { id: '/characters', icon: Compass, to: '/characters' },
    { id: '/rating', icon: BarChart2, to: '/rating' },
    { id: '/favorites', icon: Heart, to: user ? '/favorites' : '/login' },
    { id: '/profile', icon: User, to: user ? '/profile' : '/login' },
    { id: 'more', icon: Menu, action: openMenu },
  ];
  
  const activeId = location.pathname;

  return (
    <div className="lg:hidden fixed bottom-4 left-0 right-0 z-40">
      <div className="max-w-md mx-auto px-4">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(202,255,72,.35),transparent_60%)]" />
          <div className="relative rounded-[26px] px-2 py-2 glass border border-[rgba(255,255,255,.08)]">
            <div className="grid grid-cols-5 gap-1">
              {items.map(({ id, icon: Icon, action, to }) => (
                <IconButton key={id} active={activeId === id} onClick={action} to={to}>
                  <Icon className="w-[22px] h-[22px]" strokeWidth={activeId === id ? 2.5 : 2} />
                </IconButton>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconButton({ children, onClick, active, to }: { children: React.ReactNode, onClick?: () => void, active: boolean, to?: string }) {
  const className = "mx-auto w-12 h-12 rounded-full grid place-items-center transition text-white " +
    (active ? "bg-[rgba(202,255,72,.18)] ring-1 ring-[rgba(202,255,72,.6)]" : "glass-circle");

  if (to) {
    return <Link to={to} className={className}>{children}</Link>;
  }
  return <button onClick={onClick} className={className} aria-label="bottom-nav-btn">{children}</button>;
}


// --- Полноэкранное меню ---
function FullScreenMenu({ onClose }: { onClose: () => void }) {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        onClose();
        if (logout) {
            setTimeout(logout, 300);
        }
    };
  
    return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-50">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', bounce: 0, duration: .5 }}
        className="absolute inset-0 bg-[rgba(15,15,21,.96)] backdrop-blur-md"
      >
        <div className="absolute inset-0 dotted -z-10" /> 
        <div className="relative max-w-md mx-auto h-full flex flex-col">
          <div className="p-5 flex-1 overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-textSecondary">BETA</div>
                <div className="text-2xl font-bold">CAS Каталог</div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full glass-circle grid place-items-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            {user ? (
                <div className="mt-4 p-4 rounded-2xl glass">
                    <div className="flex items-center gap-3">
                        <img className="w-12 h-12 rounded-full ring-2 ring-[rgba(255,255,255,.07)]" alt={user.nickname} src={user.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${user.username}`} />
                        <div className="flex-1">
                        <div className="font-bold">{user.nickname}</div>
                        <div className="text-xs text-textSecondary">{user.email}</div>
                        </div>
                        <Link to="/profile" onClick={onClose} className="px-3 h-9 rounded-full bg-[rgba(255,255,255,.06)] border border-[rgba(255,255,255,.08)] text-sm flex items-center">
                            Профиль
                        </Link>
                        <Link to="/notifications" onClick={onClose} className="w-10 h-10 rounded-full glass-circle grid place-items-center text-white">
                            <Bell className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="mt-4 p-4 rounded-2xl glass">
                     <Link to="/login" onClick={onClose} className="w-full text-center block py-2 rounded-xl font-semibold bg-neon text-black">
                        Войти / Регистрация
                      </Link>
                </div>
            )}
            
            <div className="mt-4 space-y-3">
              <Row icon={Compass} text="Каталог персонажей" to="/characters" onClick={onClose} />
              <Row icon={Users} text="Персонажи польз." to="/user-characters" onClick={onClose} />
              <Row icon={ShoppingBag} text="Магазин" to="/shop" onClick={onClose} />
              <Row icon={Bot} text="Заказать бота" to="/order-bot" onClick={onClose} />
              <Row icon={PlusCircle} text="Предложить персонажа" to="/submit-character" onClick={onClose} />
              <Row icon={MessageSquare} text="Поддержка" to="/support" onClick={onClose} />
              {user?.role === 'admin' && <Row icon={Shield} text="Админ панель" to="/admin" onClick={onClose} />}
              {user && <Row icon={LogOut} text="Выйти" onClick={handleLogout} danger />}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Row({ icon:Icon, text, danger, to, onClick }: { icon: React.ElementType, text: string, danger?: boolean, to?: string, onClick?: () => void }) {
  const className = "w-full p-3 rounded-2xl glass flex items-center border border-[rgba(255,255,255,.08)] transition-colors " + 
    (danger ? "text-red-400 hover:bg-red-500/10 hover:border-red-500/20" : "text-white hover:bg-white/5");
    
  const content = (
    <>
      <div className="w-10 h-10 rounded-full grid place-items-center glass-circle">
        <Icon className="w-5 h-5" strokeWidth={2}/>
      </div>
      <span className="ml-3 text-sm font-semibold">{text}</span>
      <span className="ml-auto opacity-70">
        <ChevronRight className="w-4 h-4"/>
      </span>
    </>
  );

  if (to) {
    return <Link to={to} onClick={onClick} className={className}>{content}</Link>
  }
  return <button onClick={onClick} className={className}>{content}</button>
} 