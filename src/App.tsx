import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { StorageProvider } from './contexts/StorageContext';
import { DialogProvider } from './contexts/DialogContext';
import { motion, AnimatePresence } from 'motion/react';
import LoginScreen from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import CategoryDetail from './pages/CategoryDetail';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import AddPastData from './pages/AddPastData';
import LMTransactions from './pages/LMTransactions';
import AddLM from './pages/AddLM';
import AccountDetail from './pages/AccountDetail';
import BottomNav from './components/BottomNav';
import { LoadingScreen } from './components/LoadingScreen';

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="w-full min-h-full flex flex-col"
    >
      {children}
    </motion.div>
  );
}

const RoutesWithKey = Routes as React.ComponentType<any>;

function AuthWrapper() {
  const { currentUser, isReady, isLandscapeLayout, sessionConflict, logout, forceTakeOverSession } = useApp();
  const location = useLocation();
  
  if (!isReady) {
    return <LoadingScreen message="Fetching data..." />;
  }

  // Active session conflict overlay
  if (sessionConflict) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0c0a09]/95 backdrop-blur-md text-gray-100">
        <div className="w-full max-w-md bg-[#1c1917]/90 rounded-[32px] p-8 border border-[#eab308]/20 shadow-2xl shadow-[#eab308]/5 animate-in zoom-in duration-300 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#eab308]/10 border border-[#eab308]/20 flex items-center justify-center mb-6 text-[#eab308] animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
          </div>

          <h2 className="text-2xl font-serif text-white tracking-tight mb-3">
            {sessionConflict === 'in_use' ? 'Akun Sedang Digunakan' : 'Sesi Anda Berakhir'}
          </h2>

          <p className="text-sm text-gray-400 font-medium leading-relaxed mb-8">
            {sessionConflict === 'in_use'
              ? 'Akun ini terdeteksi sedang digunakan pada perangkat atau browser lain. Satu akun hanya diperbolehkan untuk satu sesi aktif secara bersamaan.'
              : 'Seseorang telah masuk ke akun Anda dari perangkat atau browser baru. Sesi aktif Anda di perangkat ini telah dialihkan.'}
          </p>

          <div className="w-full flex flex-col gap-3">
            {sessionConflict === 'in_use' && (
              <button
                onClick={forceTakeOverSession}
                className="w-full bg-[#b68c5b] hover:bg-[#a07b4f] active:scale-95 text-white py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-[#b68c5b]/10 cursor-pointer flex items-center justify-center gap-2"
              >
                Gunakan Sesi Di Sini (Gantikan)
              </button>
            )}

            <button
              onClick={logout}
              className="w-full bg-stone-800 hover:bg-stone-700 text-[#b68c5b] py-4 rounded-2xl font-bold text-base transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#b68c5b]/10"
            >
              Keluar Sesi Sekarang (Logout)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  const hideNavbarPaths = ['/add', '/edit', '/lm/add', '/lm/edit', '/account'];
  const shouldHideNavbar = hideNavbarPaths.some(path => location.pathname.startsWith(path) && location.pathname !== '/add-past');

  return (
    <div className={`flex h-screen bg-bg-warm shadow-xl overflow-hidden relative ${isLandscapeLayout ? 'flex-row' : 'flex-col'}`}>
      <div className={`flex-1 overflow-y-auto ${!shouldHideNavbar ? (isLandscapeLayout ? 'pb-0 pl-24' : 'pb-32') : ''}`}>
        <div className={`min-h-full mx-auto ${isLandscapeLayout ? 'w-full max-w-7xl' : 'w-full sm:max-w-[480px] md:max-w-xl'}`}>
          <AnimatePresence mode="wait">
            <RoutesWithKey location={location} key={location.pathname}>
              <Route path="/" element={<AnimatedPage><Dashboard /></AnimatedPage>} />
              <Route path="/add" element={<AnimatedPage><AddTransaction /></AnimatedPage>} />
              <Route path="/edit/:id" element={<AnimatedPage><AddTransaction /></AnimatedPage>} />
              <Route path="/add-past" element={<AnimatedPage><AddPastData /></AnimatedPage>} />
              <Route path="/category/:categoryId" element={<AnimatedPage><CategoryDetail /></AnimatedPage>} />
              <Route path="/analysis" element={<AnimatedPage><Analytics /></AnimatedPage>} />
              <Route path="/analytics" element={<AnimatedPage><Analytics /></AnimatedPage>} />
              <Route path="/lm" element={<AnimatedPage><LMTransactions /></AnimatedPage>} />
              <Route path="/lm/add" element={<AnimatedPage><AddLM /></AnimatedPage>} />
              <Route path="/lm/edit/:id" element={<AnimatedPage><AddLM /></AnimatedPage>} />
              <Route path="/settings" element={<AnimatedPage><Settings /></AnimatedPage>} />
              <Route path="/account" element={<AnimatedPage><AccountDetail /></AnimatedPage>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </RoutesWithKey>
          </AnimatePresence>
        </div>
      </div>
      {!shouldHideNavbar && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <LanguageProvider>
        <StorageProvider>
          <DialogProvider>
            <Router>
              <AuthWrapper />
            </Router>
          </DialogProvider>
        </StorageProvider>
      </LanguageProvider>
    </AppProvider>
  );
}
