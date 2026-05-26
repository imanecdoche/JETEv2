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
import BottomNav from './components/BottomNav';

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
  const { currentUser, isReady, isLandscapeLayout } = useApp();
  const location = useLocation();
  
  if (!isReady) {
    return null; // Or a nice splash screen
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  const hideNavbarPaths = ['/add', '/edit', '/lm/add', '/lm/edit'];
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
