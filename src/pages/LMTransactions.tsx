import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Filter, Gem, Trash2, Edit2 } from 'lucide-react';
import { useStorage } from '../contexts/StorageContext';
import { useDialog } from '../contexts/DialogContext';
import { format, parseISO } from 'date-fns';
import BrandLogo from '../components/BrandLogo';
import Rupiah from '../components/Rupiah';

export default function LMTransactions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lmTransactions, deleteLmTransaction } = useStorage();
  const { confirm } = useDialog();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sell' | 'terima'>('all');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.highlightedId) {
      setHighlightedId(location.state.highlightedId);
      // Remove highlight after a few seconds
      const timer = setTimeout(() => {
        setHighlightedId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const filtered = useMemo(() => {
    return lmTransactions.filter(t => {
      // search by customer name, phone, or LM code
      const nameMatch = t.customerName?.toLowerCase().includes(search.toLowerCase());
      const phoneMatch = t.customerPhone?.includes(search);
      const codeMatch = t.items?.some((i: any) => i.lmCode?.toLowerCase().includes(search.toLowerCase()));

      const typeMatch = filterType === 'all' ? true : t.type === filterType;

      return (nameMatch || phoneMatch || codeMatch) && typeMatch;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [lmTransactions, search, filterType]);

  const stats = useMemo(() => {
    let gramTerima = 0;
    let rpTerima = 0;
    let gramSell = 0;
    let rpSell = 0;

    lmTransactions.forEach(t => {
      if (t.type === 'terima') {
        gramTerima += t.totalGram || 0;
        rpTerima += t.totalPrice || 0;
      } else {
        gramSell += t.totalGram || 0;
        rpSell += t.totalPrice || 0;
      }
    });

    return { gramTerima, rpTerima, gramSell, rpSell };
  }, [lmTransactions]);

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Transaksi',
      message: `Hapus transaksi LM milik ${name}?`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
    });
    if (isConfirmed) {
      await deleteLmTransaction(id);
    }
  };

  const formatRp = (num: number) => {
    return <Rupiah value={num} classNameRp="text-[0.8em] opacity-70 font-normal" />;
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <header className="px-5 py-6 bg-white shadow-sm border-b border-gray-100 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#b68c5b]/10 text-[#b68c5b] p-2 rounded-[16px]">
              <Gem size={24} />
            </div>
            <div>
              <h1 className="text-xl font-serif font-medium text-gray-800">Antam / LM</h1>
              <p className="text-xs text-gray-400">Pusat Data Logam Mulia</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/lm/add')}
            className="w-10 h-10 bg-[#b68c5b] text-white rounded-full flex items-center justify-center shadow-md transform transition-transform active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#b68c5b] mb-2">Terima (In)</p>
            <p className="text-xl font-serif font-medium text-gray-800">{stats.gramTerima.toFixed(2)}g</p>
            <p className="text-xs text-gray-400 font-mono mt-1">{formatRp(stats.rpTerima)}</p>
          </div>
          <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Sell (Out)</p>
            <p className="text-xl font-serif font-medium text-gray-800">{stats.gramSell.toFixed(2)}g</p>
            <p className="text-xs text-gray-400 font-mono mt-1">{formatRp(stats.rpSell)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama, hp, kode LM..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-[20px] text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20 transition-all"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${filterType === 'all' ? 'bg-[#b68c5b] text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('terima')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${filterType === 'terima' ? 'bg-[#b68c5b] text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
          >
            Terima
          </button>
          <button
            onClick={() => setFilterType('sell')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${filterType === 'sell' ? 'bg-indigo-500 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
          >
            Sell
          </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          {filtered.length > 0 ? (
            filtered.map(t => (
              <div 
                key={t.id} 
                className={`bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 relative group cursor-pointer transition-all duration-300 ${
                  highlightedId === t.id ? 'animate-pulse-card ring-2 ring-[#b68c5b]/50' : ''
                }`} 
                onClick={() => navigate(`/lm/edit/${t.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-4">
                    <h3 className="font-semibold text-gray-800 text-base">{t.customerName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{t.customerPhone} {t.customerNik && `• ${t.customerNik}`}</p>
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{format(t.timestamp, 'dd MMM yyyy, HH:mm')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${t.type === 'terima' ? 'bg-[#b68c5b]/10 text-[#b68c5b]' : 'bg-indigo-50 text-indigo-600'}`}>
                      {t.type}
                    </span>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-[16px] overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Detail ({t.items?.length || 0} brg)</p>
                    <div className="text-right flex items-center gap-3">
                      <p className="text-sm font-bold text-gray-800">{t.totalGram.toFixed(2)}g</p>
                      <p className="text-xs font-mono font-medium text-gray-500">{formatRp(t.totalPrice)}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {t.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs py-3 px-4 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-6 flex items-center justify-center bg-gray-50/50 rounded-lg p-1 border border-gray-100 overflow-hidden flex-shrink-0">
                            <BrandLogo brand={item.brand} className="max-h-5 max-w-full object-contain" showFallbackText={false} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-700">{item.brand} <span className="text-gray-400 text-[10.5px] font-normal ml-0.5">({item.year || '-'})</span></span>
                            {item.lmCode && <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono mt-0.5">{item.lmCode}</span>}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                           <span className="font-semibold text-gray-800 text-sm">{item.weight}g</span>
                           <span className="text-gray-400 font-mono text-[10px]">{formatRp(item.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-1 mt-4 pt-4 border-t border-gray-50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/lm/edit/${t.id}`); }}
                    className="text-gray-400 hover:text-[#b68c5b] p-2 hover:bg-[#b68c5b]/5 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 size={16} />
                    <span className="text-xs font-medium uppercase">Edit</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.customerName); }}
                    className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 size={16} />
                    <span className="text-xs font-medium uppercase">Hapus</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 bg-white rounded-[24px] border border-dashed border-gray-200">
              <Gem size={32} className="mb-3 text-gray-200" />
              <p className="text-sm font-medium">Belum ada transaksi LM</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}