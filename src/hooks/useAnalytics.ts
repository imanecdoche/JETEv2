import { useState, useMemo } from 'react';
import { useStorage } from '../contexts/StorageContext';
import { useApp } from '../contexts/AppContext';
import { isToday, isThisWeek, isThisMonth, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';

export type TimeFilter = 'today' | 'week' | 'month' | 'custom';

export function useAnalytics() {
  const { transactions: allTransactions, transactionSummaries: allSummaries } = useStorage();
  const { currentUser } = useApp();
  
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions.filter(t => t.type !== 'services' && t.type !== 'cnn');
    
    // Admin sees all, normal user sees their own
    if (currentUser?.role !== 'admin') {
      filtered = filtered.filter(t => t.userId === currentUser?.id);
    }

    filtered = filtered.filter(t => {
      const date = new Date(t.timestamp);
      
      switch (timeFilter) {
        case 'today':
          return isToday(date);
        case 'week':
          return isThisWeek(date, { weekStartsOn: 1 });
        case 'month':
          return isThisMonth(date);
        case 'custom':
          if (startDate && endDate) {
            return isWithinInterval(date, {
              start: startOfDay(parseISO(startDate)),
              end: endOfDay(parseISO(endDate))
            });
          }
          return true; // If dates not selected yet, show all or could be empty.
        default:
          return true;
      }
    });

    return filtered;
  }, [allTransactions, timeFilter, currentUser, startDate, endDate]);

  const filteredSummaries = useMemo(() => {
    let filtered = [...allSummaries];
    
    // Admin sees all, normal user sees their own
    if (currentUser?.role !== 'admin') {
      filtered = filtered.filter(s => s.createdBy === currentUser?.id);
    }

    filtered = filtered.filter(s => {
      const date = new Date(s.date); // the date field is like "2026-05-10"
      // we can parse it to midnight local time for the check
      const d = new Date(`${s.date}T00:00:00`);
      
      switch (timeFilter) {
        case 'today':
          return isToday(d);
        case 'week':
          return isThisWeek(d, { weekStartsOn: 1 });
        case 'month':
          return isThisMonth(d);
        case 'custom':
          if (startDate && endDate) {
            return isWithinInterval(d, {
              start: startOfDay(parseISO(startDate)),
              end: endOfDay(parseISO(endDate))
            });
          }
          return true;
        default:
          return true;
      }
    });

    return filtered;
  }, [allSummaries, timeFilter, currentUser, startDate, endDate]);

  const summary = useMemo(() => {
    let totalQty = 0;
    let totalGram = 0;
    let totalRevenue = 0; // considering as money moving in or out
    let tradeAdds = 0;
    let tradeRefunds = 0;
    let itemsIn = 0;
    let itemsOut = 0;
    let cashIn = 0;
    let cashOut = 0;
    let gramIn = 0;
    let gramOut = 0;

    filteredTransactions.forEach(t => {
      // qty/items are not transaction count, but we report them as secondary detail
      const qty = t.type === 'trade_in' ? ((t.qty || 0) + (t.sellQty || 0)) : (t.qty || 0);
      const gram = t.type === 'trade_in' ? ((t.gram || 0) + (t.sellGram || 0)) : (t.gram || 0);
      
      totalQty += qty;
      totalGram += gram;

      if (t.type === 'buyback') {
        itemsIn += (t.qty || 0);
        gramIn += (t.gram || 0);
        cashOut += (t.price || 0);
      } else if (t.type === 'sell') {
        itemsOut += (t.qty || 0);
        gramOut += (t.gram || 0);
        cashIn += (t.price || 0);
      } else if (t.type === 'trade_in') {
        itemsIn += (t.sellQty || 0);
        itemsOut += (t.qty || 0);
        gramIn += (t.sellGram || 0);
        gramOut += (t.gram || 0);
        const diff = (t.price || 0) - (t.sellPrice || 0);
        if (diff > 0) {
          tradeAdds += diff;
          cashIn += diff;
        } else if (diff < 0) {
          tradeRefunds += Math.abs(diff);
          cashOut += Math.abs(diff);
        }
        totalRevenue += Math.abs(diff); // Or just sum the flow
      } else {
        totalRevenue += t.price || 0;
      }
    });

    let extraTransactions = 0;
    filteredSummaries.forEach(s => {
      extraTransactions += s.totalTransactions || 0;
    });

    totalRevenue = cashIn + cashOut; // Let's redefine totalRevenue as total flow of cash

    return {
      transactionCount: filteredTransactions.length + extraTransactions,
      totalQty,
      totalGram,
      totalRevenue,
      tradeAdds,
      tradeRefunds,
      itemsIn,
      itemsOut,
      cashIn,
      cashOut,
      gramIn,
      gramOut
    };
  }, [filteredTransactions, filteredSummaries]);

  const categoryDistribution = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      acc[t.type] = (acc[t.type] || 0) + 1;
    });
    filteredSummaries.forEach(s => {
      if (s.categories) {
        Object.keys(s.categories).forEach(cat => {
          acc[cat] = (acc[cat] || 0) + (s.categories[cat] || 0);
        });
      }
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value })).filter(c => c.value > 0);
  }, [filteredTransactions, filteredSummaries]);
  
  const trendData = useMemo(() => {
    const acc: Record<string, { count: number, revenue: number }> = {};
    filteredTransactions.forEach(t => {
      // Grouping by yyyy-MM-dd
      const d = new Date(t.timestamp);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!acc[k]) acc[k] = { count: 0, revenue: 0 };
      acc[k].count += 1;
      if (t.type === 'trade_in') {
        acc[k].revenue += Math.abs((t.price || 0) - (t.sellPrice || 0));
      } else {
        acc[k].revenue += t.price || 0;
      }
    });

    filteredSummaries.forEach(s => {
      const k = s.date; // assuming "YYYY-MM-DD"
      if (!acc[k]) acc[k] = { count: 0, revenue: 0 };
      acc[k].count += (s.totalTransactions || 0);
    });

    return Object.entries(acc).map(([date, stats]) => ({ date, ...stats })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTransactions, filteredSummaries]);

  return {
    timeFilter,
    setTimeFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filteredTransactions,
    filteredSummaries,
    summary,
    categoryDistribution,
    trendData
  };
}
