// project/src/App.tsx

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { UserCharactersProvider } from './contexts/UserCharactersContext';
import { ReviewsProvider } from './contexts/ReviewsContext';
import { Layout } from './components/Layout/Layout';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { CharactersPage } from './pages/CharactersPage';
import { CharacterPage } from './pages/CharacterPage';
import { RatingPage } from './pages/RatingPage';
import { AdminPanel } from './pages/AdminPanel';
import { ProfilePage } from './pages/ProfilePage';
import { ShopPage } from './pages/ShopPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { SupportChatPage } from './pages/SupportChatPage';
import { ScrollManager } from './components/Layout/ScrollManager';
import { UserCharactersPage } from './pages/UserCharactersPage';
import { SubmitCharacterPage } from './pages/SubmitCharacterPage';
import { NotificationsPage } from './pages/NotificationsPage';
import Preloader from './components/common/Preloader';
import VirtualKeyboardRoot from './components/common/VirtualKeyboardRoot';
import { AnimatePresence, motion } from 'framer-motion';
import { useTrueViewportHeight } from './hooks/useTrueViewportHeight'; // <-- 1. ИМПОРТИРУЕМ ХУК

// Защищенный роут для админа
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/" />;
}

// Защищенный роут для авторизованных пользователей
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    return user ? <>{children}</> : <Navigate to="/login" />;
}

// Основной контент приложения с роутингом
function AppContent() {
  const { loading: dataLoading } = useData();
  const { loading: authLoading } = useAuth();
  
  useTrueViewportHeight(); // <-- 2. ВЫЗЫВАЕМ ХУК

  const isLoading = dataLoading || authLoading;

  return (
    <>
      <Preloader isLoading={isLoading} />
      <AnimatePresence>
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ScrollManager />
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />

              <Route path="/" element={<Layout />}>
                  <Route index element={<Navigate to="/characters" replace />} />
                  <Route path="characters" element={<CharactersPage />} />
                  <Route path="characters/:characterId" element={<CharacterPage />} />
                  <Route path="rating" element={<RatingPage />} />
                  <Route path="shop" element={<ShopPage />} />
                  <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
                  <Route path="support" element={<ProtectedRoute><SupportChatPage /></ProtectedRoute>} />
                  <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

                  <Route path="user-characters" element={<UserCharactersPage />} />
                  <Route path="submit-character" element={<ProtectedRoute><SubmitCharacterPage /></ProtectedRoute>} />

                  <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Главный компонент App, оборачивающий все в провайдеры
function App() {
  return (
    <Router>
      <VirtualKeyboardRoot>
        <AuthProvider>
        <DataProvider>
          <UserCharactersProvider>
            <ReviewsProvider>
              <AppContent />
            </ReviewsProvider>
          </UserCharactersProvider>
        </DataProvider>
      </AuthProvider>
      </VirtualKeyboardRoot>
    </Router>
  );
}

export default App;