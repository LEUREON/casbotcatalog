// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { UserCharactersProvider } from './contexts/UserCharactersContext';
import { ReviewsProvider } from './contexts/ReviewsContext';
import { Layout } from './components/Layout/Layout';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { ScrollManager } from './components/Layout/ScrollManager';
import Preloader from './components/common/Preloader';
import { AnimatePresence, motion } from 'framer-motion';
import { useTrueViewportHeight } from './hooks/useTrueViewportHeight';

// --- Lazy pages ---
const CharactersPage      = lazy(() => import('./pages/CharactersPage').then(m => ({ default: m.CharactersPage })));
const CharacterPage       = lazy(() => import('./pages/CharacterPage').then(m => ({ default: m.CharacterPage })));
const RatingPage          = lazy(() => import('./pages/RatingPage').then(m => ({ default: m.RatingPage })));
const AdminPanel          = lazy(() => import('./pages/AdminPanel').then(m => ({ default: m.AdminPanel })));
const ProfilePage         = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const ShopPage            = lazy(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })));
const FavoritesPage       = lazy(() => import('./pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const SupportChatPage     = lazy(() => import('./pages/SupportChatPage').then(m => ({ default: m.SupportChatPage })));
const SubmitCharacterPage = lazy(() => import('./pages/SubmitCharacterPage').then(m => ({ default: m.SubmitCharacterPage })));
const NotificationsPage   = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));

// 🔹 Страница просмотра одного пользовательского персонажа
const UserCharacterPage   = lazy(() =>
  import('./pages/UserCharacterPage').then(m => ({ default: m.default ?? (m as any).UserCharacterPage }))
);

// --- Guards ---
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/" />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

// --- App content with routes ---
function AppContent() {
  const { loading: dataLoading } = useData();
  const { loading: authLoading } = useAuth();
  useTrueViewportHeight();

  const isLoading = dataLoading || authLoading;

  return (
    <>
      <Preloader isLoading={isLoading} />
      <AnimatePresence>
        {!isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <ScrollManager />
            <Suspense fallback={<Preloader isLoading={true} />}>
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

                  {/* просмотр конкретного пользовательского персонажа */}
                  <Route path="user-characters/:id" element={<UserCharacterPage />} />

                  {/* редактор — создание и редактирование */}
                  <Route path="submit-character" element={<ProtectedRoute><SubmitCharacterPage /></ProtectedRoute>} />
                  <Route path="submit-character/:id" element={<ProtectedRoute><SubmitCharacterPage /></ProtectedRoute>} />

                  <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- App root ---
function App() {
  return (
    <Router>
      <AuthProvider>
        <DataProvider>
          <UserCharactersProvider>
            <ReviewsProvider>
              <AppContent />
            </ReviewsProvider>
          </UserCharactersProvider>
        </DataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
