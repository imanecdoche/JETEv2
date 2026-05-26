import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorage } from '../contexts/StorageContext';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDialog } from '../contexts/DialogContext';
import { ChevronLeft, CalendarPlus, Copy, Save } from 'lucide-react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

const CATEGORIES = [
  { id: 'sell', label: 'Sell' },
  { id: 'buyback', label: 'Buyback' },
  { id: 'trade_in', label: 'Trade In' },
  { id: 'reviews', label: 'Review' },
  { id: 'services', label: 'Service' },
  { id: 'cnn', label: 'CNN' },
];

export default function AddPastData() {
  const navigate = useNavigate();
  const { addPastDataSummary, transactionSummaries, mode } = useStorage();
  const { currentUser, isLandscapeLayout } = useApp();
  const { t } = useLanguage();
  const { alert } = useDialog();
  
  const [date, setDate] = useState<string>(startOfDay(new Date()).toISOString().split('T')[0]);
  const [counts, setCounts] = useState<Record<string, number>>({
    sell: 0,
    buyback: 0,
    trade_in: 0,
    reviews: 0,
    services: 0,
    cnn: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleShortcutUrl = (daysOffset: number) => {
    const d = startOfDay(subDays(new Date(), daysOffset));
    setDate(d.toISOString().split('T')[0]);
  };

  const handleCountChange = (catId: string, val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10) || 0;
    setCounts(prev => ({ ...prev, [catId]: num }));
  };

  const handleCopyPrevious = async () => {
    // Find the latest summary before the selected date
    const selectedDate = new Date(date).getTime();
    const pastSums = transactionSummaries
      .filter(s => new Date(s.date).getTime() < selectedDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (pastSums.length > 0) {
      setCounts(pastSums[0].categories);
    } else {
      await alert({ message: "No previous summary data found." });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setLoading(true);

    const totalTransactions = Object.values(counts).reduce((sum: number, val: number) => sum + val, 0);

    const summaryData = {
      date,
      source: 'manual_summary',
      categories: counts,
      totalTransactions,
      createdBy: currentUser?.id,
      timestamp: Date.now()
    };

    try {
      await addPastDataSummary(summaryData);
      navigate(-1);
    } catch (err) {
      console.error(err);
      await alert({ message: 'Failed to save summary.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full relative pb-32">
      <div className="px-4 py-6 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif text-[#b68c5b] tracking-tight flex items-center gap-2">
              <CalendarPlus size={28} /> Add Past Data
            </h1>
            <p className="text-sm text-gray-500 font-medium">Input historical transaction totals</p>
          </div>
          <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-sm border border-gray-100 hover:bg-gray-50 hover:text-gray-800 active:scale-95 transition-all">
            <ChevronLeft size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Date</label>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
            />
            
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" onClick={() => handleShortcutUrl(1)} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold border border-gray-100 hover:bg-gray-100 transition-colors">Yesterday</button>
              <button type="button" onClick={() => handleShortcutUrl(2)} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold border border-gray-100 hover:bg-gray-100 transition-colors">2 Days Ago</button>
              <button type="button" onClick={() => handleShortcutUrl(7)} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold border border-gray-100 hover:bg-gray-100 transition-colors">Last Week</button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="flex justify-between items-end border-b border-gray-100 pb-3 mb-2">
              <h3 className="font-bold text-gray-800">Category Transaction Counts</h3>
              <button type="button" onClick={handleCopyPrevious} className="text-xs font-bold uppercase text-[#b68c5b] flex items-center gap-1 hover:opacity-80 transition-opacity">
                <Copy size={14} /> Copy Previous
              </button>
            </div>

            <div className={`grid grid-cols-2 gap-4 ${isLandscapeLayout ? 'md:grid-cols-3' : ''}`}>
              {CATEGORIES.map(cat => (
                <div key={cat.id}>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{cat.label}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={counts[cat.id] === 0 ? '' : counts[cat.id]}
                    onChange={(e) => handleCountChange(cat.id, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-xl font-bold text-center outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-gray-800 transition-shadow"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#b68c5b] text-white px-8 py-4 rounded-2xl font-semibold shadow-lg shadow-[#b68c5b]/20 flex items-center justify-center hover:bg-[#a07a4f] transition-all w-full md:w-auto md:min-w-[200px]"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={20} className="mr-2" />
                  Save Summary
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
