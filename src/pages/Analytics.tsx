import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnalytics, TimeFilter } from '../hooks/useAnalytics';
import { useLanguage } from '../contexts/LanguageContext';
import { useApp } from '../contexts/AppContext';
import { useDialog } from '../contexts/DialogContext';
import { exportCSV } from '../utils/analytics';
import { ReportModal } from '../components/ReportModal';
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
    if (!num || num === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const activeCategoryStr = useMemo(() => {
    if (categoryDistribution.length === 0) return 'N/A';
    const sorted = [...categoryDistribution].sort((a,b) => b.value - a.value);
    return t('cat_' + sorted[0].name) || sorted[0].name;
  }, [categoryDistribution, t]);

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
          <div className="bg-white border border-gray-100 p-5 rounded-[24px] shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-6 flex items-center gap-2">
              <PieChartIcon size={16} /> Category Distribution
            </h3>
            <div className="h-64 w-full">
              {categoryDistribution.length > 0 ? (
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
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(val: number, name: string) => [val, t('cat_' + name) || name]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      formatter={(value) => <span className="text-xs font-medium text-gray-600">{t('cat_' + value) || value}</span>}
                      iconType="circle"
                      iconSize={8}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm font-medium text-gray-400">No category data</div>
              )}
            </div>
          </div>
        </div>

      </div>

      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  );
}
