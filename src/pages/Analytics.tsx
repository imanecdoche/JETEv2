import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnalytics, TimeFilter } from '../hooks/useAnalytics';
import { useLanguage } from '../contexts/LanguageContext';
import { useApp } from '../contexts/AppContext';
import { useDialog } from '../contexts/DialogContext';
import { exportCSV } from '../utils/analytics';
import { ReportModal } from '../components/ReportModal';
import Rupiah from '../components/Rupiah';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Download, Calendar, Activity, BarChart2, TrendingUp, Users, PieChart as PieChartIcon, FileDown } from 'lucide-react';

const COLORS = ['#b68c5b', '#4ade80', '#3b82f6', '#a855f7', '#f43f5e', '#f59e0b'];

export default function Analytics() {
  const { t } = useLanguage();
  const { currentUser } = useApp();
  const { alert } = useDialog();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [focusedCategory, setFocusedCategory] = useState<string | null>(null);
  const {
    timeFilter, setTimeFilter, startDate, setStartDate, endDate, setEndDate,
    filteredTransactions, summary, categoryDistribution, trendData
  } = useAnalytics();

  const handleExport = async () => {
    if (filteredTransactions.length === 0) {
      await alert({ message: 'No data to export' });
      return;
    }
    exportCSV(filteredTransactions, `export-${timeFilter}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const formatRupiah = (num: number) => {
    return <Rupiah value={num} classNameRp="text-[0.8em] opacity-70 font-normal" />;
  };

  const activeCategoryStr = useMemo(() => {
    if (categoryDistribution.length === 0) return 'N/A';
    const sorted = [...categoryDistribution].sort((a,b) => b.value - a.value);
    return t('cat_' + sorted[0].name) || sorted[0].name;
  }, [categoryDistribution, t]);

  const totalCategoryVal = useMemo(() => {
    return categoryDistribution.reduce((acc, curr) => acc + curr.value, 0);
  }, [categoryDistribution]);

  const focusedInfo = useMemo(() => {
    if (!focusedCategory) return null;
    const found = categoryDistribution.find(c => c.name === focusedCategory);
    if (!found) return null;
    const percentage = totalCategoryVal > 0 ? (found.value / totalCategoryVal) * 100 : 0;
    return { ...found, percentage };
  }, [focusedCategory, categoryDistribution, totalCategoryVal]);

  return (
    <div className="px-3 py-6 md:px-6 min-h-full pb-28 md:pb-6">
      <header className="mb-8 flex justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-serif text-gray-800 tracking-tight">Recap & Analytics</h1>
          <p className="text-sm text-gray-500 font-medium tracking-wide">Operational insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            to="/add-past"
            className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-white border border-[#b68c5b]/30 text-[#b68c5b] font-medium text-sm hover:bg-[#FAF9F6] transition-colors shadow-sm active:scale-95 whitespace-nowrap"
          >
            <Calendar size={16} /> <span className="hidden sm:inline">Add Past Data</span>
          </Link>
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-[#b68c5b] text-white font-medium text-sm hover:bg-[#b68c5b]/90 transition-colors shadow-sm active:scale-95 whitespace-nowrap"
          >
            <FileDown size={16} /> <span>Laporan PDF</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm active:scale-95 whitespace-nowrap"
          >
            <Download size={16} /> <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </header>

      {/* Filter System */}
      <div className="bg-white rounded-[24px] p-2 flex flex-wrap gap-2 mb-6 shadow-sm border border-gray-100 items-center">
        {(['today', 'week', 'month', 'custom'] as TimeFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setTimeFilter(f)}
            className={`flex-1 min-w-[80px] px-3 py-2.5 rounded-[16px] text-xs font-semibold uppercase tracking-wider transition-all ${
              timeFilter === f 
                ? 'bg-[#b68c5b] text-white shadow-md shadow-[#b68c5b]/20' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {f === 'custom' ? 'Range' : f}
          </button>
        ))}
        
        {timeFilter === 'custom' && (
          <div className="flex w-full gap-2 mt-2 px-2 pb-2">
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm font-medium outline-none"
            />
            <span className="text-gray-400 self-center">-</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-sm font-medium outline-none"
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <div className="bg-[#FAF9F6] border border-[#E8E6E1] p-4 rounded-[24px] shadow-sm flex flex-col items-center text-center justify-center relative overflow-hidden">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#b68c5b] opacity-80 mb-1 z-10 flex items-center gap-1">
            <Activity size={12} /> Transactions
          </div>
          <p className="text-4xl font-serif text-[#8a6a43] z-10">{summary.transactionCount}</p>
        </div>
        
        <div className="bg-white border border-gray-100 p-4 rounded-[24px] shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Total Grams</div>
          <p className="text-2xl font-serif text-gray-800">{summary.totalGram.toFixed(2)}g</p>
        </div>

        <div className="col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-4 rounded-[24px] shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl pointer-events-none" />
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-1 z-10">Total Revenue Vol.</div>
          <p className="text-2xl font-serif text-white z-10">{formatRupiah(summary.totalRevenue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-[24px] shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1 flex items-center gap-1">
             Uang Masuk
          </div>
          <p className="text-xl font-serif text-emerald-900">{formatRupiah(summary.cashIn)}</p>
          <div className="text-[9px] font-medium text-emerald-600/70 tracking-wide uppercase mt-1">Sell + Trade In</div>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-[24px] shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-1 flex items-center gap-1">
             Uang Keluar
          </div>
          <p className="text-xl font-serif text-rose-900">{formatRupiah(summary.cashOut)}</p>
           <div className="text-[9px] font-medium text-rose-600/70 tracking-wide uppercase mt-1">Buyback + Trade In</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-[24px] shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1 flex items-center gap-1">
             Items Masuk
          </div>
          <p className="text-2xl font-serif text-emerald-900">{summary.itemsIn}</p>
          <div className="text-[9px] font-medium text-emerald-600/70 tracking-wide uppercase mt-1">Buyback + Trade In</div>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-[24px] shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-1 flex items-center gap-1">
             Items Keluar
          </div>
          <p className="text-2xl font-serif text-rose-900">{summary.itemsOut}</p>
           <div className="text-[9px] font-medium text-rose-600/70 tracking-wide uppercase mt-1">Sell + Trade In</div>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-[24px] shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1 flex items-center gap-1">
             Gramasi Masuk
          </div>
          <p className="text-2xl font-serif text-emerald-900">{summary.gramIn?.toFixed(2) || '0.00'}</p>
          <div className="text-[9px] font-medium text-emerald-600/70 tracking-wide uppercase mt-1">Buyback + Trade In</div>
        </div>
        <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-[24px] shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-1 flex items-center gap-1">
             Gramasi Keluar
          </div>
          <p className="text-2xl font-serif text-rose-900">{summary.gramOut?.toFixed(2) || '0.00'}</p>
           <div className="text-[9px] font-medium text-rose-600/70 tracking-wide uppercase mt-1">Sell + Trade In</div>
        </div>
      </div>
      
      {(summary.tradeAdds > 0 || summary.tradeRefunds > 0) && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-[24px] shadow-sm text-center flex flex-col items-center justify-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-1">Trade: Cust Adds</div>
            <p className="text-xl font-serif text-blue-900">{formatRupiah(summary.tradeAdds)}</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-[24px] shadow-sm text-center flex flex-col items-center justify-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-orange-500 mb-1">Trade: Cust Rcv</div>
            <p className="text-xl font-serif text-orange-900">{formatRupiah(summary.tradeRefunds)}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="space-y-6">
        
        {/* Trend Chart */}
        <div className="bg-white border border-gray-100 p-5 rounded-[24px] shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-6 flex items-center gap-2">
            <TrendingUp size={16} /> Transaction Trend
          </h3>
          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} width={30} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="count" stroke="#b68c5b" strokeWidth={3} dot={{ r: 4, fill: '#b68c5b', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm font-medium text-gray-400">No trend data</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Category Pie */}
          <div 
            className="bg-white border border-gray-100 p-5 rounded-[24px] shadow-sm select-none cursor-default"
            onClick={() => setFocusedCategory(null)}
          >
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-6 flex items-center gap-2">
              <PieChartIcon size={16} /> Category Distribution
            </h3>
            
            <div className="relative h-64 w-full flex items-center justify-center">
              {categoryDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => {
                          const isFocused = focusedCategory === entry.name;
                          const isAnyFocused = focusedCategory !== null;
                          const opacity = isAnyFocused ? (isFocused ? 1 : 0.35) : 1;
                          
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]}
                              style={{
                                opacity,
                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                cursor: 'pointer',
                                transform: isFocused ? 'scale(1.05)' : 'scale(1)',
                                transformOrigin: 'center'
                              }}
                              onClick={(e: any) => {
                                e.stopPropagation();
                                setFocusedCategory(focusedCategory === entry.name ? null : entry.name);
                              }}
                            />
                          );
                        })}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(val: number, name: string) => [val, t('cat_' + name) || name]}
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 4px 12px -1px rgb(0 0 0 / 0.1)',
                          display: focusedCategory ? 'none' : 'block'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>

                  {/* Absolute Floating Info Card in the Center of Donut */}
                  {focusedInfo && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                      <div 
                        className="bg-white/95 backdrop-blur-md border border-stone-200/50 p-4 rounded-[20px] shadow-lg flex flex-col items-center text-center max-w-[130px] pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1 text-center">
                          {t('cat_' + focusedInfo.name) || focusedInfo.name}
                        </span>
                        <span className="text-xl font-serif font-semibold text-gray-800 leading-none mb-1 text-center">
                          {focusedInfo.value}
                        </span>
                        <span className="text-[10px] font-bold text-white bg-[#b68c5b] px-2.5 py-0.5 rounded-full leading-none text-center">
                          {focusedInfo.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-sm font-medium text-gray-400">No category data</div>
              )}
            </div>

            {/* Custom Interactive Legend with built-in focus interaction */}
            {categoryDistribution.length > 0 && (
              <div className="mt-4 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 gap-2.5 justify-center">
                {categoryDistribution.map((entry, index) => {
                  const isFocused = focusedCategory === entry.name;
                  const isAnyFocused = focusedCategory !== null;
                  const color = COLORS[index % COLORS.length];
                  const exactPercentage = totalCategoryVal > 0 ? (entry.value / totalCategoryVal) * 100 : 0;
                  
                  return (
                    <button
                      key={entry.name}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusedCategory(focusedCategory === entry.name ? null : entry.name);
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-[16px] border transition-all duration-300 cursor-pointer text-left ${
                        isFocused 
                          ? 'bg-stone-50 border-[#b68c5b] shadow-sm scale-[1.02] font-semibold' 
                          : isAnyFocused
                            ? 'opacity-35 border-transparent'
                            : 'border-stone-100 hover:bg-stone-50/50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-in fade-in duration-300" style={{ backgroundColor: color }} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-stone-800 truncate font-semibold leading-none mb-1">
                          {t('cat_' + entry.name) || entry.name}
                        </span>
                        <span className="text-[10px] text-stone-400 font-bold tracking-tight leading-none uppercase">
                          {entry.value} ({exactPercentage.toFixed(0)}%)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
}
