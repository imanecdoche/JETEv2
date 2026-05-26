import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, User, Plus, BarChart2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useApp } from '../contexts/AppContext';

export default function BottomNav() {
  const { t } = useLanguage();
  const { isLandscapeLayout } = useApp();
  const location = useLocation();

  return (
    <div className={`
      fixed bg-white z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]
      ${isLandscapeLayout 
        ? 'left-0 top-0 bottom-0 w-24 h-full flex flex-col justify-center gap-12 px-0 border-r border-gray-100 rounded-r-3xl' 
        : 'bottom-0 left-0 right-0 h-20 border-t border-gray-100 flex items-center justify-around px-2 rounded-t-3xl'}
    `}>
      <NavLink 
        to="/" 
        className={({ isActive }) => 
          `flex flex-col items-center gap-1 transition-colors w-16 ${isActive ? 'text-[#b68c5b]' : 'text-gray-400 hover:text-gray-600'}`
        }
      >
        <Home size={24} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
        <span className="text-[10px] font-medium uppercase tracking-wider">{t('home')}</span>
      </NavLink>

      <NavLink 
        to="/lm" 
        className={({ isActive }) => 
          `flex flex-col items-center gap-1 transition-colors w-16 ${(isActive || location.pathname.startsWith('/lm')) ? 'text-[#b68c5b]' : 'text-gray-400 hover:text-gray-600'}`
        }
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={location.pathname.startsWith('/lm') ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gem"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
        <span className="text-[10px] font-medium uppercase tracking-wider">Antam</span>
      </NavLink>

      <NavLink 
        to="/add" 
        className={`
          bg-[#b68c5b] text-white p-4 rounded-full shadow-lg shadow-[#b68c5b]/30 transform transition-transform active:scale-95
          ${isLandscapeLayout ? 'mx-auto' : 'relative -top-6'}
        `}
      >
        <Plus size={28} strokeWidth={2.5} />
      </NavLink>

      <NavLink 
        to="/analytics" 
        className={({ isActive }) => 
          `flex flex-col items-center gap-1 transition-colors w-16 ${isActive ? 'text-[#b68c5b]' : 'text-gray-400 hover:text-gray-600'}`
        }
      >
        <BarChart2 size={24} strokeWidth={location.pathname.startsWith('/analytics') ? 2.5 : 2} />
        <span className="text-[10px] font-medium uppercase tracking-wider">Recap</span>
      </NavLink>

      <NavLink 
        to="/settings" 
        className={({ isActive }) => 
          `flex flex-col items-center gap-1 transition-colors w-16 ${isActive ? 'text-[#b68c5b]' : 'text-gray-400 hover:text-gray-600'}`
        }
      >
        <User size={24} strokeWidth={location.pathname === '/settings' ? 2.5 : 2} />
        <span className="text-[10px] font-medium uppercase tracking-wider">{t('settingsNav')}</span>
      </NavLink>
    </div>
  );
}

function isActive(path: string) {
  return window.location.pathname === path;
}
