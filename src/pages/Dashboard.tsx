import React, { useMemo, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useStorage } from '../contexts/StorageContext';
import { HeaderClock } from '../components/HeaderClock';
import { LoadingScreen } from '../components/LoadingScreen';
import { motion, AnimatePresence } from 'motion/react';
import { Target, TrendingUp, Trophy, Flame, Zap } from 'lucide-react';

const CATEGORIES = [
  { id: 'sell', label: 'cat_sell', color: 'bg-emerald-50 text-emerald-700' },
  { id: 'buyback', label: 'cat_buyback', color: 'bg-rose-50 text-rose-700' },
  { id: 'trade_in', label: 'cat_trade_in', color: 'bg-blue-50 text-blue-700' },
  { id: 'reviews', label: 'cat_reviews', color: 'bg-purple-50 text-purple-700' },
  { id: 'services', label: 'cat_services', color: 'bg-amber-50 text-amber-700' },
  { id: 'cnn', label: 'cat_cnn', color: 'bg-slate-50 text-slate-700' },
];

interface ProgressBarProps {
  percent: number;
  gradient?: string;
  bgClass?: string;
  heightClass?: string;
  delay?: number;
}

const MultiLayerProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  gradient,
  bgClass,
  heightClass = 'h-2',
  delay = 0,
}) => {
  if (percent <= 0) {
    return (
      <div className={`${heightClass} w-full bg-gray-50 rounded-full relative`} />
    );
  }

  const layersCount = Math.max(1, Math.ceil(percent / 100));
  const topmostLayerPercent = percent > 100 ? (percent % 100 === 0 ? 100 : percent % 100) : percent;

  const getLayerColor = (layerIndex: number) => {
    const text = (gradient || bgClass || '').toLowerCase();
    
    if (text.includes('emerald') || text.includes('green') || text.includes('teal')) {
      const colors = [
        'bg-gradient-to-r from-emerald-500 to-emerald-600',  // Layer 1
        'bg-gradient-to-r from-teal-500 to-teal-600',        // Layer 2
        'bg-gradient-to-r from-cyan-500 to-cyan-600',        // Layer 3
        'bg-gradient-to-r from-blue-500 to-blue-600',        // Layer 4
        'bg-gradient-to-r from-indigo-500 to-indigo-600',    // Layer 5
      ];
      return colors[layerIndex % colors.length];
    }
    
    if (text.includes('amber') || text.includes('yellow') || text.includes('orange')) {
      const colors = [
        'bg-gradient-to-r from-amber-500 to-amber-600',      // Layer 1
        'bg-gradient-to-r from-orange-500 to-orange-600',    // Layer 2
        'bg-gradient-to-r from-red-500 to-red-600',          // Layer 3
        'bg-gradient-to-r from-rose-500 to-rose-600',        // Layer 4
        'bg-gradient-to-r from-pink-500 to-pink-600',        // Layer 5
      ];
      return colors[layerIndex % colors.length];
    }
    
    if (text.includes('rose') || text.includes('red') || text.includes('pink') || text.includes('coral')) {
      const colors = [
        'bg-gradient-to-r from-rose-500 to-rose-600',        // Layer 1
        'bg-gradient-to-r from-pink-500 to-pink-600',        // Layer 2
        'bg-gradient-to-r from-fuchsia-500 to-fuchsia-600',  // Layer 3
        'bg-gradient-to-r from-purple-500 to-purple-600',    // Layer 4
        'bg-gradient-to-r from-violet-500 to-violet-600',    // Layer 5
      ];
      return colors[layerIndex % colors.length];
    }
    
    if (text.includes('blue') || text.includes('cyan') || text.includes('indigo')) {
      const colors = [
        'bg-gradient-to-r from-blue-500 to-blue-600',        // Layer 1
        'bg-gradient-to-r from-indigo-500 to-indigo-600',    // Layer 2
        'bg-gradient-to-r from-cyan-500 to-cyan-600',        // Layer 3
        'bg-gradient-to-r from-teal-500 to-teal-600',        // Layer 4
        'bg-gradient-to-r from-emerald-500 to-emerald-600',  // Layer 5
      ];
      return colors[layerIndex % colors.length];
    }
    
    if (text.includes('purple') || text.includes('violet')) {
      const colors = [
        'bg-gradient-to-r from-purple-500 to-purple-600',    // Layer 1
        'bg-gradient-to-r from-fuchsia-500 to-fuchsia-600',  // Layer 2
        'bg-gradient-to-r from-pink-500 to-pink-600',        // Layer 3
        'bg-gradient-to-r from-rose-500 to-rose-600',        // Layer 4
        'bg-gradient-to-r from-amber-500 to-amber-600',      // Layer 5
      ];
      return colors[layerIndex % colors.length];
    }

    const fallbacks = [
      'bg-gradient-to-r from-emerald-500 to-emerald-600',
      'bg-gradient-to-r from-teal-500 to-teal-600',
      'bg-gradient-to-r from-blue-500 to-blue-600',
      'bg-gradient-to-r from-purple-500 to-purple-600',
    ];
    return fallbacks[layerIndex % fallbacks.length];
  };

  const getFlameColors = (topmostColorClass: string) => {
    const text = topmostColorClass.toLowerCase();
    if (text.includes('emerald') || text.includes('green') || text.includes('teal')) {
      return {
        outer: '#10B981',  // emerald-500
        middle: '#34D399', // emerald-400
        inner: '#6EE7B7',  // emerald-300
        core: '#A7F3D0',   // emerald-200
        glow: 'rgba(16, 185, 129, 0.5)',
      };
    }
    if (text.includes('amber') || text.includes('yellow') || text.includes('orange')) {
      return {
        outer: '#F59E0B',  // amber-500
        middle: '#FBBF24', // amber-400
        inner: '#FDE68A',  // amber-300
        core: '#FEF3C7',   // amber-200
        glow: 'rgba(245, 158, 11, 0.5)',
      };
    }
    if (text.includes('rose') || text.includes('red') || text.includes('pink') || text.includes('coral') || text.includes('fuchsia')) {
      return {
        outer: '#F43F5E',  // rose-500
        middle: '#FB7185', // rose-400
        inner: '#FDA4AF',  // rose-300
        core: '#FFE4E6',   // rose-200
        glow: 'rgba(244, 63, 94, 0.5)',
      };
    }
    if (text.includes('blue') || text.includes('cyan') || text.includes('indigo')) {
      return {
        outer: '#3B82F6',  // blue-500
        middle: '#60A5FA', // blue-400
        inner: '#93C5FD',  // blue-300
        core: '#DBEAFE',   // blue-200
        glow: 'rgba(59, 130, 246, 0.5)',
      };
    }
    if (text.includes('purple') || text.includes('violet')) {
      return {
        outer: '#8B5CF6',  // purple-500
        middle: '#A78BFA', // purple-400
        inner: '#C4B5FD',  // purple-300
        core: '#EDE9FE',   // purple-200
        glow: 'rgba(139, 92, 246, 0.5)',
      };
    }
    return {
      outer: '#10B981',
      middle: '#34D399',
      inner: '#6EE7B7',
      core: '#FFFFFF',
      glow: 'rgba(16, 185, 129, 0.5)',
    };
  };

  const topmostLayerColorClass = getLayerColor(layersCount - 1);
  const flameColors = getFlameColors(topmostLayerColorClass);

  return (
    <div className="relative w-full overflow-visible py-1">
      {/* Actual Progress Bar */}
      <div className={`${heightClass} w-full bg-gray-50 rounded-full overflow-hidden relative`}>
        {Array.from({ length: layersCount }).map((_, index) => {
          const isLastLayer = index === layersCount - 1;
          const isSecondLastLayer = index === layersCount - 2;
          
          let opacity = 0;
          if (isLastLayer) {
            opacity = 1.0;
          } else if (isSecondLastLayer) {
            opacity = 0.4;
          } else {
            opacity = 0.0;
          }

          const widthPercent = isLastLayer ? (percent % 100 === 0 && percent > 0 ? 100 : percent % 100) : 100;
          const layerColor = getLayerColor(index);
          
          return (
            <motion.div
              key={index}
              initial={{ width: 0 }}
              animate={{ width: `${widthPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: delay + index * 0.15 }}
              className={`absolute left-0 top-0 h-full ${layerColor} overflow-hidden`}
              style={{
                opacity: opacity,
                zIndex: index + 1,
              }}
            >
              <div className="absolute inset-0 animate-barber-pole opacity-55" />
            </motion.div>
          );
        })}
      </div>

      {/* Burning Fire Effect at the Tip (only if percent > 100) */}
      {percent > 100 && (
        <motion.div
          initial={{ left: 0, opacity: 0 }}
          animate={{ left: `${topmostLayerPercent}%`, opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut', delay: delay + (layersCount - 1) * 0.15 }}
          className="absolute top-1/2 -translate-y-1/2 -mt-[1px] -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center select-none"
        >
          {/* Flame Container */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Ambient heat aura using matching brand color */}
            <div 
              className="absolute w-6 h-6 rounded-full blur-[6px] opacity-40 animate-pulse" 
              style={{ backgroundColor: flameColors.outer }}
            />
            
            {/* Spark Particles */}
            <div className="absolute w-1 h-1 rounded-full animate-spark-1" style={{ top: '25%', left: '40%', backgroundColor: flameColors.inner }} />
            <div className="absolute w-1.5 h-1.5 rounded-full animate-spark-2" style={{ top: '40%', left: '50%', backgroundColor: flameColors.outer }} />
            <div className="absolute w-1 h-1 rounded-full animate-spark-3" style={{ top: '30%', left: '60%', backgroundColor: flameColors.middle }} />

            {/* Cartoon SVG Flame (Bonfire / 🔥 Shape, Asymmetrical, with Multiple Peaks) */}
            <div className="animate-flame-flicker">
              <div className="animate-flame-bob flex items-center justify-center mb-1">
                <svg 
                  viewBox="0 0 24 30" 
                  className="w-5 h-7"
                  style={{
                    filter: `drop-shadow(0 2px 4px ${flameColors.outer}) drop-shadow(0 4px 10px ${flameColors.glow})`
                  }}
                >
                  {/* Outer Tongue (🔥 base) */}
                  <path 
                    d="M 12 3 C 12 3 13.8 6.5 13.8 9.2 C 13.8 11 15 12.5 16.5 13.5 C 18 14.5 19.5 16 19.8 18.5 C 20.2 21.5 18 25 14.5 26.5 C 11 28 7.5 27.5 5.5 24.5 C 3.5 21.5 4.5 17 7 13.5 C 7.5 12.8 7.8 11.8 7.5 11 C 7.2 10.2 6.5 9.5 6 9 C 6 9 10 7.5 11 5.5 C 11.5 4.5 12 3 12 3 Z" 
                    fill={flameColors.outer} 
                  />
                  {/* Middle Tongue */}
                  <path 
                    d="M 12 8 C 12 8 13.2 11 13.2 13 C 13.2 14.5 14 15.5 15 16.2 C 16 17 17 18 17.2 20 C 17.5 22 15.8 24.5 13.5 25.5 C 11.2 26.5 8.7 26 7.2 23.8 C 5.8 21.5 6.5 18.2 8.2 15.5 C 8.5 15 8.7 14.2 8.5 13.5 C 8.3 12.8 7.8 12.2 7.5 11.8 C 7.5 11.8 10.5 11 11.2 9.5 C 11.5 8.8 12 8 12 8 Z" 
                    fill={flameColors.middle} 
                  />
                  {/* Inner Tongue */}
                  <path 
                    d="M 12 13 C 12 13 12.8 15.2 12.8 16.5 C 12.8 17.5 13.2 18.2 14 18.8 C 14.8 19.4 15.2 20 15.2 21.2 C 15.2 22.5 14 24 12.5 24.5 C 11 25 9.2 24.5 8.2 23 C 7.2 21.5 7.8 19.5 9 17.5 C 9.2 17.2 9.3 16.8 9.2 16.2 C 9 15.8 8.5 15.2 8.2 14.8 C 8.2 14.8 10.8 14.5 11.2 13.8 C 11.5 13.4 12 13 12 13 Z" 
                    fill={flameColors.inner} 
                  />
                  {/* Glowing Hot Spot Core */}
                  <path 
                    d="M 12 17 C 12 17 12.4 18.5 12.4 19.5 C 12.4 20 12.7 20.5 13 21 C 13.3 21.5 13.5 22 13.5 22.8 C 13.5 23.5 12.8 24.2 12 24.5 C 11.2 24.8 10.2 24.5 9.5 23.8 C 8.8 23 9 21.8 9.8 20.5 C 10 20.2 10 19.8 9.8 19.5 C 9.5 19.2 9.2 18.8 9 18.5 C 9 18.5 11 18.2 11.4 17.8 C 11.6 17.5 12 17 12 17 Z" 
                    fill={flameColors.core} 
                    opacity="0.9"
                  />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const { currentUser } = useApp();
  const { t } = useLanguage();
  const { transactions: allTransactions, transactionSummaries: allSummaries, appTargets, loading } = useStorage();
  const [dailyMode, setDailyMode] = useState<'static' | 'adaptive'>('static');
  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getDayEndCountdown = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();

    if (hours === 19 && minutes >= 30) {
      const remainingMinutes = 59 - minutes;
      const remainingSeconds = 59 - seconds;
      return `${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return null;
  };

  const countdown = getDayEndCountdown();

  const currentStats = useMemo(() => {
    let day = 0;
    let week = 0;
    let month = 0;

    const myTrxs = allTransactions.filter(t => t.userId === currentUser?.id);
    const mySums = allSummaries.filter(s => s.createdBy === currentUser?.id);

    myTrxs.forEach(t => {
      const date = new Date(t.timestamp);
      let grams = 0;
      
      // Only count "Sell" weight (items moving out of store)
      if (t.type === 'sell' || t.type === 'trade_in') {
        grams = t.gram || 0;
      }
      
      if (isToday(date)) day += grams;
      if (isThisWeek(date, { weekStartsOn: 1 })) week += grams;
      if (isThisMonth(date)) month += grams;
    });

    mySums.forEach(s => {
      const d = new Date(`${s.date}T00:00:00`);
      // For summaries, we assume totalGram represents the intended target metric 
      // (usually people track target by sales volume)
      const grams = s.totalGram || 0; 
      
      if (isToday(d)) day += grams;
      if (isThisWeek(d, { weekStartsOn: 1 })) week += grams;
      if (isThisMonth(d)) month += grams;
    });

    return { day, week, month };
  }, [allTransactions, allSummaries, currentUser]);

  const getTagline = (percent: number) => {
    if (percent === 0) return "Let's start the engine!";
    if (percent < 30) return "Keep going! You got this.";
    if (percent < 50) return "Halfway there! Almost home.";
    if (percent < 80) return "You're on fire today!";
    if (percent < 100) return "Almost complete! One more push!";
    return "Target Achieved! Masterpiece!";
  };

  const getWeeklyTagline = (percent: number) => {
     if (percent < 50) return "Step by step, day by day.";
     if (percent < 100) return "Dominating the week!";
     return "Week goal crushed! Amazing!";
  };

  const getMonthlyTagline = (percent: number) => {
    if (percent < 50) return "Consistency is the key to gold.";
    if (percent < 100) return "Legends are made this month!";
    return "GOAT status confirmed! Incredible!";
  };

  const getProgressStyles = (percent: number) => {
    if (percent >= 100) return {
      text: 'text-emerald-600',
      bg: 'bg-emerald-500',
      gradient: 'from-emerald-400 to-emerald-600',
    };
    if (percent >= 80) return {
      text: 'text-emerald-500',
      bg: 'bg-emerald-400',
      gradient: 'from-emerald-300 to-emerald-500',
    };
    if (percent >= 50) return {
      text: 'text-amber-500',
      bg: 'bg-amber-500',
      gradient: 'from-amber-400 to-amber-600',
    };
    return {
      text: 'text-rose-500',
      bg: 'bg-rose-500',
      gradient: 'from-rose-400 to-rose-600',
    };
  };

  const currentDayOfMonth = new Date().getDate();
  const remainingMonthlyTarget = Math.max(0, appTargets.monthly - currentStats.month);
  const adaptiveDailyTarget = remainingMonthlyTarget / currentDayOfMonth;
  
  const effectiveDailyTarget = dailyMode === 'static' ? appTargets.daily : adaptiveDailyTarget;

  const dayPercent = effectiveDailyTarget > 0 ? Math.round((currentStats.day / effectiveDailyTarget) * 100) : (currentStats.day > 0 ? 100 : 0);
  const weekPercent = appTargets.weekly > 0 ? Math.round((currentStats.week / appTargets.weekly) * 100) : 0;
  const monthPercent = appTargets.monthly > 0 ? Math.round((currentStats.month / appTargets.monthly) * 100) : 0;

  const dayStyles = getProgressStyles(dayPercent);
  const weekStyles = getProgressStyles(weekPercent);
  const monthStyles = getProgressStyles(monthPercent);

  const transactions = useMemo(() => {
    if (!currentUser) return [];
    return allTransactions
      .filter(t => t.userId === currentUser.id)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [allTransactions, currentUser]);


  const summaries = useMemo(() => {
    if (!currentUser) return [];
    return allSummaries
      .filter(s => s.createdBy === currentUser.id)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [allSummaries, currentUser]);

  const grouped = useMemo(() => {
    const acc: Record<string, { details: any[], summary?: any }> = {};
    transactions.forEach((curr: any) => {
      if (!acc[curr.date]) acc[curr.date] = { details: [] };
      acc[curr.date].details.push(curr);
    });

    summaries.forEach((s: any) => {
      const k = s.date;
      if (!acc[k]) acc[k] = { details: [] };
      if (!acc[k].summary) {
        acc[k].summary = s;
      } else {
        const existing = acc[k].summary;
        const combinedCats = { ...existing.categories };
        if (s.categories) {
          Object.keys(s.categories).forEach(cat => {
            combinedCats[cat] = (combinedCats[cat] || 0) + (s.categories[cat] || 0);
          });
        }
        acc[k].summary = {
          ...existing,
          totalTransactions: (existing.totalTransactions || 0) + (s.totalTransactions || 0),
          categories: combinedCats
        };
      }
    });
    return acc;
  }, [transactions, summaries]);

  const sortedDates = useMemo(() => Object.keys(grouped).sort((a, b) => b.localeCompare(a)), [grouped]);

  const formatRupiah = (num: number) => {
    if (!num || num === 0) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  if (loading) {
    return <LoadingScreen message="Fetching data..." />;
  }

  return (
    <div className="px-3 py-6 md:px-6 min-h-full">
      <header className="mb-6 flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif text-gray-800 tracking-tight">{t('hi')}, {currentUser?.name.split(' ')[0]}!</h1>
          <p className="text-sm text-gray-500 font-medium tracking-wide">{t('readySales')}</p>
        </div>
        <HeaderClock />
      </header>

      {countdown && (
        <motion.div
           animate={{ opacity: [1, 0.4, 1] }}
           transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
           className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-2xl mb-6 shadow-sm flex items-center justify-center gap-2"
        >
          <Zap size={16} className="text-rose-500 fill-rose-500" />
          <span className="font-medium text-sm tracking-wide">Day will end in {countdown}</span>
        </motion.div>
      )}

      {/* Targets Section */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-2 mb-2 ml-1">
          <Target size={16} className="text-[#b68c5b]" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#b68c5b]">Progress &amp; Targets</h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Daily */}
          <div style={{ perspective: 1000 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={dailyMode}
                initial={{ opacity: 0, rotateX: 90 }}
                animate={{ opacity: 1, rotateX: 0 }}
                exit={{ opacity: 0, rotateX: -90 }}
                transition={{ duration: 0.2 }}
                onClick={() => setDailyMode(m => m === 'static' ? 'adaptive' : 'static')}
                className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 relative overflow-hidden cursor-pointer"
              >
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${dailyMode === 'adaptive' ? 'text-indigo-500' : 'text-gray-400'}`}>
                      {dailyMode === 'static' ? 'Daily Goal' : 'Adaptive Pace'}
                    </p>
                    <div className="flex items-center gap-2">
                      {dailyMode === 'static' ? <Flame size={14} className={dayStyles.text} /> : <Zap size={14} className={dayStyles.text} />}
                      <p className="text-lg font-serif font-medium text-gray-800">
                        {currentStats.day.toFixed(2)} 
                        <span className="text-[10px] font-sans text-gray-400 font-bold mx-1">/</span>
                        <span className="text-xs font-sans text-gray-400">{effectiveDailyTarget.toFixed(2)}</span>
                        <span className={`text-[10px] font-sans font-bold ml-2 ${dayPercent >= 100 ? 'text-emerald-500' : (dailyMode === 'adaptive' ? 'text-indigo-500' : 'text-orange-500')}`}>
                          {(currentStats.day - effectiveDailyTarget) > 0 ? '+' : ''}{(currentStats.day - effectiveDailyTarget).toFixed(2)}g
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${dayStyles.text}`}>Day %</p>
                    <p className={`text-lg font-serif font-medium ${dayStyles.text}`}>{dayPercent}%</p>
                  </div>
                </div>
                
                <MultiLayerProgressBar
                  percent={dayPercent}
                  gradient={dayStyles.gradient}
                  heightClass="h-2"
                />
                <p className="text-[9px] font-medium text-gray-400 mt-2 flex items-center gap-1 italic">
                  {dayPercent >= 100 ? <span className="text-emerald-500">🏆</span> : '✨'} {getTagline(dayPercent)}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Weekly */}
            <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex justify-between items-start mb-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weekly</p>
                <span className={`text-[10px] font-bold ${weekStyles.text}`}>{weekPercent}%</span>
              </div>
              <div className="flex items-center gap-1 mb-2">
                <TrendingUp size={12} className={weekStyles.text} />
                <p className="text-sm font-serif font-medium">
                  {currentStats.week.toFixed(2)}
                  <span className="text-[9px] font-sans text-gray-300 font-bold mx-0.5">/</span>
                  <span className="text-[10px] font-sans text-gray-400">{appTargets.weekly.toFixed(0)}</span>
                  <span className={`text-[9px] font-sans font-bold ml-1.5 ${weekPercent >= 100 ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {(currentStats.week - appTargets.weekly) > 0 ? '+' : ''}{(currentStats.week - appTargets.weekly).toFixed(2)}g
                  </span>
                </p>
              </div>
              <MultiLayerProgressBar
                percent={weekPercent}
                bgClass={weekStyles.bg}
                heightClass="h-1.5"
                delay={0.2}
              />
              <p className="text-[8px] font-medium text-gray-400 mt-2 italic leading-tight flex items-center gap-1">
                {weekPercent >= 100 && <span className="text-emerald-500">🏆</span>} {getWeeklyTagline(weekPercent)}
              </p>
            </div>

            {/* Monthly */}
            <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex justify-between items-start mb-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monthly</p>
                <span className={`text-[10px] font-bold ${monthStyles.text}`}>{monthPercent}%</span>
              </div>
              <div className="flex items-center gap-1 mb-2">
                <Trophy size={12} className={monthStyles.text} />
                <p className="text-sm font-serif font-medium">
                  {currentStats.month.toFixed(2)}
                  <span className="text-[9px] font-sans text-gray-300 font-bold mx-0.5">/</span>
                  <span className="text-[10px] font-sans text-gray-400">{appTargets.monthly.toFixed(0)}</span>
                  <span className={`text-[9px] font-sans font-bold ml-1.5 ${monthPercent >= 100 ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {(currentStats.month - appTargets.monthly) > 0 ? '+' : ''}{(currentStats.month - appTargets.monthly).toFixed(2)}g
                  </span>
                </p>
              </div>
              <MultiLayerProgressBar
                percent={monthPercent}
                bgClass={monthStyles.bg}
                heightClass="h-1.5"
                delay={0.4}
              />
              <p className="text-[8px] font-medium text-gray-400 mt-2 italic leading-tight flex items-center gap-1">
                {monthPercent >= 100 && <span className="text-emerald-500">🏆</span>} {getMonthlyTagline(monthPercent)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex justify-end">
        <NavLink 
          to="/add-past"
          className="flex items-center gap-2 bg-white border border-[#b68c5b]/30 text-[#b68c5b] px-4 py-2 rounded-2xl shadow-sm text-xs font-bold uppercase tracking-wider hover:bg-[#FAF9F6] active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><line x1="12" x2="12" y1="14" y2="18"/><line x1="8" x2="16" y1="16" y2="16"/></svg>
          Add Past Data
        </NavLink>
      </div>

      {sortedDates.length === 0 ? (
        <div className="text-center text-gray-400 mt-20">
          <p className="font-serif">{t('noTransactions')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((dateStr) => {
            const dateData = grouped[dateStr];
            const trxs = dateData.details;
            const summaryData = dateData.summary;
            const dateObj = parseISO(dateStr);
            const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
            
            return (
              <div key={dateStr}>
                <div className="flex items-center justify-between mb-4 border-b border-gray-200/50 pb-2">
                  <h2 className="text-lg font-serif font-medium text-gray-800">
                    {isToday ? t('today') : format(dateObj, 'dd MMM yyyy')}
                  </h2>
                  {summaryData && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#b68c5b] bg-[#b68c5b]/10 px-2 py-1 rounded-lg">
                      Summary Entry
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map(cat => {
                    const catTrxs = trxs.filter((t: any) => t.type === cat.id);
                    let recordCount = catTrxs.length;
                    if (summaryData?.categories?.[cat.id]) {
                      recordCount += summaryData.categories[cat.id];
                    }
                    
                    const isTradeIn = cat.id === 'trade_in';
                    const qtyIn = isTradeIn ? catTrxs.reduce((sum: number, t: any) => sum + (t.sellQty || 0), 0) : 0;
                    const qtyOut = catTrxs.reduce((sum: number, t: any) => sum + (t.qty || 0), 0);
                    const totalQty = isTradeIn ? qtyIn + qtyOut : qtyOut;

                    const totalGrams = catTrxs.reduce((sum: number, t: any) => {
                      if (isTradeIn) {
                        return sum + (t.gram || 0) + (t.sellGram || 0);
                      }
                      return sum + (t.gram || 0);
                    }, 0);
                    const totalPrice = catTrxs.reduce((sum: number, t: any) => {
                      if (isTradeIn) {
                        return sum + Math.abs((t.price || 0) - (t.sellPrice || 0));
                      }
                      return sum + (t.price || 0);
                    }, 0);

                    return (
                      <NavLink 
                        key={cat.id} 
                        to={`/category/${cat.id}?date=${dateStr}`}
                        className={`p-4 rounded-3xl overflow-hidden relative shadow-sm border border-white/50 transition-transform active:scale-95 flex flex-col justify-between ${cat.color} min-h-[120px]`}
                      >
                        <h3 className="font-medium text-sm mb-1 z-10 relative opacity-90 uppercase tracking-widest">{t(cat.label)}</h3>
                        <div className="z-10 relative mt-auto">
                          <p className="text-4xl font-serif font-medium mb-2 leading-none">
                            {recordCount} <span className="text-xs font-sans tracking-widest uppercase opacity-75 inline-block -ml-1">TRX</span>
                          </p>
                          <div className="flex gap-2 text-[10px] opacity-75 font-bold tracking-wide uppercase border-t border-current/10 pt-2 flex-wrap">
                            {totalQty > 0 || totalGrams > 0 || totalPrice > 0 ? (
                              <>
                                {totalQty > 0 && <span>{isTradeIn ? `${qtyIn}/${qtyOut}` : totalQty} {t('items')}</span>}
                                {totalQty > 0 && totalGrams > 0 && <span>&bull;</span>}
                                {totalGrams > 0 && <span>{totalGrams.toFixed(2)}g</span>}
                                {(totalQty > 0 || totalGrams > 0) && totalPrice > 0 && <span>&bull;</span>}
                                {totalPrice > 0 && <span>{formatRupiah(totalPrice)}</span>}
                              </>
                            ) : summaryData?.categories?.[cat.id] > 0 ? (
                             <span>N/A</span>
                            ) : (
                              <span>0 {t('items')} &bull; 0.00g &bull; Rp 0</span>
                            )}
                          </div>
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
