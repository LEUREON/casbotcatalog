// project/src/components/Layout/Sidebar.tsx
import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  Compass,
  BarChart2,
  Users,
  User,
  Heart,
  Bot,
  ShoppingBag,
  MessageSquare,
  Shield,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Bell,
  PlusCircle
} from 'lucide-react';

const navigation = [
    { text: 'Каталог персонажей', to: '/characters', icon: Compass },
    { text: 'Рейтинг', to: '/rating', icon: BarChart2 },
    { text: 'Персонажи польз.', to: '/user-characters', icon: Users },
    { text: 'Избранное', to: '/favorites', icon: Heart },
    { text: 'Уведомления', to: '/notifications', icon: Bell },
    { text: 'Магазин', to: '/shop', icon: ShoppingBag },
    { text: 'Заказать бота', to: '/order-bot', icon: Bot },
    { text: 'Предложить персонажа', to: '/submit-character', icon: PlusCircle },
    { text: 'Поддержка', to: '/support', icon: MessageSquare },
];

interface SidebarProps {
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setCollapsed }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    if(logout) logout();
  };

  return (
    <div className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:w-24' : 'lg:w-72'}`}>
        <div className="relative flex flex-col h-full p-4 w-full bg-[rgba(15,15,21,.96)] backdrop-blur-md border-r border-[rgba(255,255,255,.08)]">
            <div className={`flex items-center flex-shrink-0 mb-8 h-12 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-start px-4'}`}>
              <Link to="/" className="flex items-center group">
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }} 
                      animate={{ opacity: 1, width: 'auto', transition: { delay: 0.2 } }} 
                      exit={{ opacity: 0, width: 0 }}
                      className="font-bold tracking-tighter whitespace-nowrap text-2xl text-textPrimary"
                    >
                      CAS Каталог
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>
            
            <nav className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                {navigation.map(item => (
                    <Row key={item.to} {...item} isCollapsed={isCollapsed} isActive={location.pathname === item.to} />
                ))}
                {user?.role === 'admin' && <Row icon={Shield} text="Админ панель" to="/admin" isCollapsed={isCollapsed} isActive={location.pathname === '/admin'} />}
            </nav>
            
            <div className="flex-shrink-0 mt-6 space-y-3">
              {user ? (
                 <Row icon={LogOut} text="Выйти" onClick={handleLogout} danger isCollapsed={isCollapsed} />
              ) : (
                !isCollapsed && 
                <AnimatePresence>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                      <Link to="/login" className="w-full text-center block py-3 glass rounded-2xl font-semibold border border-[rgba(255,255,255,.08)] text-white hover:bg-white/5">
                        Войти
                      </Link>
                    </motion.div>
                </AnimatePresence>
              )}
               <button onClick={() => setCollapsed(!isCollapsed)} className={`w-full p-3 rounded-2xl glass flex items-center border border-[rgba(255,255,255,.08)] text-white transition-colors hover:bg-white/5 ${isCollapsed ? 'justify-center' : ''}`}>
                    {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
                    {!isCollapsed && <motion.span initial={{ opacity: 0, width: 0, marginLeft: 0 }} animate={{ opacity: 1, width: 'auto', marginLeft: '0.75rem', transition: { delay: 0.2 } }} exit={{ opacity: 0, width: 0, marginLeft: 0 }} className="text-sm font-semibold whitespace-nowrap">Свернуть</motion.span>}
              </button>
            </div>
        </div>
    </div>
  );
}

function Row({ icon: Icon, text, danger, to, onClick, isCollapsed, isActive }: { icon: React.ElementType, text: string, danger?: boolean, to?: string, onClick?: () => void, isCollapsed?: boolean, isActive?: boolean }) {
  const className = `w-full p-3 rounded-2xl glass flex items-center border border-[rgba(255,255,255,.08)] transition-colors ${
    danger ? "text-red-400 hover:bg-red-500/10 hover:border-red-500/20" : "text-white hover:bg-white/5"
  } ${isActive ? 'bg-white/10' : ''} ${isCollapsed ? 'justify-center' : ''}`;

  const content = (
    <>
      <div className="w-10 h-10 rounded-full grid place-items-center glass-circle">
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <AnimatePresence>
        {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0, width: 0, marginLeft: 0 }} 
              animate={{ opacity: 1, width: 'auto', marginLeft: '0.75rem', transition: { delay: 0.2 } }} 
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              className="text-sm font-semibold whitespace-nowrap"
            >
                {text}
            </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1, transition: { delay: 0.3 } }} 
              exit={{ opacity: 0 }}
              className="ml-auto opacity-70"
            >
                <ChevronRight />
            </motion.span>
        )}
      </AnimatePresence>
    </>
  );

  if (to) {
    return <NavLink to={to} onClick={onClick} className={className}>{content}</NavLink>;
  }
  return <button onClick={onClick} className={className}>{content}</button>;
} 