import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useFullscreen } from '../hooks/useFullscreen';
import { useLanguage } from '../contexts/LanguageContext';

export function HeaderClock() {
  const [time, setTime] = useState(new Date());
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { language } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getLocaleString = () => {
    const localeMap: Record<string, string> = {
      en: 'en-US',
      id: 'id-ID',
      es: 'es-ES',
      zh: 'zh-CN',
      tl: 'fil-PH'
    };
    return localeMap[language] || 'id-ID';
  };

  const formattedDate = new Intl.DateTimeFormat(getLocaleString(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(time);

  const formattedTime = new Intl.DateTimeFormat(getLocaleString(), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(time);

  return (
    <div className="flex items-center gap-2">
      <div className="text-right">
        <div className="text-sm font-bold text-[#b68c5b] font-mono tracking-wide">
          {formattedTime}
        </div>
        <div className="text-[10px] md:text-xs text-gray-500 font-medium font-sans mt-0.5 whitespace-nowrap">
          {formattedDate}
        </div>
      </div>
      <button 
        onClick={toggleFullscreen}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-50 active:scale-95 transition-all"
        aria-label="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
    </div>
  );
}

