import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useFullscreen } from '../hooks/useFullscreen';

export function HeaderClock() {
  const [time, setTime] = useState(new Date());
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <time className="text-sm md:text-base font-serif font-semibold text-gray-700 tracking-wider">
        {format(time, 'HH:mm:ss')}
      </time>
      <button 
        onClick={toggleFullscreen}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-50 active:scale-95 transition-all"
        aria-label="Toggle Fullscreen"
      >
        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>
    </div>
  );
}
