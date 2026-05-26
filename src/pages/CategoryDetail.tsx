import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, Trash2, Edit3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStorage } from '../contexts/StorageContext';

const CATEGORIES: Record<string, { label: string, color: string }> = {
  sell: { label: 'cat_sell', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  buyback: { label: 'cat_buyback', color: 'bg-rose-50 text-rose-700 border-rose-100' },
  trade_in: { label: 'cat_trade_in', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  reviews: { label: 'cat_reviews', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  services: { label: 'cat_services', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  cnn: { label: 'cat_cnn', color: 'bg-slate-50 text-slate-700 border-slate-100' },
};

export default function CategoryDetail() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const dateStr = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const { t } = useLanguage();
  const { transactions: allTransactions, transactionSummaries: allSummaries, loading, deleteTransaction } = useStorage();

  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  const category = CATEGORIES[categoryId || ''] || CATEGORIES.sell;

  const transactions = useMemo(() => {
    if (!currentUser || !categoryId) return [];
    return allTransactions
      .filter(trx => trx.userId === currentUser.id && trx.type === categoryId && trx.date === dateStr)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [allTransactions, currentUser, categoryId, dateStr]);

  const hasSummary = useMemo(() => {
    if (!currentUser || !categoryId) return false;
    const summary = allSummaries.find(s => s.createdBy === currentUser.id && s.date === dateStr);
    return summary && summary.categories && summary.categories[categoryId] > 0;
  }, [allSummaries, currentUser, categoryId, dateStr]);

  const confirmDelete = async () => {
    if (transactionToDelete) {
      try {
        await deleteTransaction(transactionToDelete);
      } catch (error) {
        console.error(error);
      } finally {
        setTransactionToDelete(null);
      }
    }
  };

  const formatRupiah = (num: number) => {
    if (!num || num === 0) return 'N/A';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400 font-serif translate-y-1/2 h-full flex flex-col justify-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-full">
      <div className="px-4 py-6 md:px-6">
        <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-sm border border-gray-100 hover:bg-gray-50 hover:text-gray-800 active:scale-95 transition-all mb-6">
          <ChevronLeft size={24} />
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-serif text-gray-800 tracking-tight">{t(category.label)}</h1>
          <p className="text-sm text-gray-400 font-medium tracking-wide mt-1">
            {format(parseISO(dateStr), 'EEEE, dd MMMM yyyy')}
          </p>
        </header>

        {transactions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
            {hasSummary ? (
              <div>
                <div className="inline-block px-3 py-1 bg-[#b68c5b]/10 text-[#b68c5b] rounded-full text-xs font-bold uppercase tracking-wider mb-3">Summary Entry</div>
                <p className="text-gray-500 font-medium">No detailed transaction records available for this date.</p>
              </div>
            ) : (
              <p className="text-gray-400 font-serif italic">{t('noRecords')}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map(trx => {
              if (trx.type === 'trade_in') {
                const diff = (trx.price || 0) - (trx.sellPrice || 0);
                return (
                  <div key={trx.id} className="bg-gradient-to-br from-[#f8f9fa] to-white rounded-[24px] p-5 shadow-sm border border-blue-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 bg-blue-500" />
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg mb-1">{trx.customerName}</h3>
                        <div className="text-xs font-medium uppercase tracking-wider text-gray-400 inline-block px-2 py-1 bg-gray-100 rounded-md">
                          {format(new Date(trx.timestamp), 'HH:mm')}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest bg-blue-50 px-2 py-1 rounded-md">Trade-In</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm font-medium border border-gray-100 bg-white rounded-2xl p-4">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                        <span className="text-gray-500">Buy (New)</span>
                        <span className="text-gray-800">{formatRupiah(trx.price)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                        <span className="text-gray-500">Sell (Old)</span>
                        <span className="text-gray-800">{formatRupiah(trx.sellPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 text-[#b68c5b]">
                        <span>{diff >= 0 ? "Cust Adds" : "Cust Rcv"}</span>
                        <span className="text-lg font-serif">Rp {Math.abs(diff).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {trx.notes && (
                      <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-xl italic">
                        "{trx.notes}"
                      </p>
                    )}

                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 mt-2 relative z-10">
                      <button onClick={() => setTransactionToDelete(trx.id)} className="w-auto px-4 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors border border-red-200 font-medium text-sm gap-2 whitespace-nowrap relative z-10">
                        <Trash2 size={16} /> {t('delete')}
                      </button>
                      <button 
                        onClick={() => navigate(`/edit/${trx.id}`)}
                        className="w-auto px-4 h-10 rounded-xl bg-white text-gray-700 flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 font-medium text-sm gap-2 whitespace-nowrap relative z-10"
                      >
                        <Edit3 size={16} /> {t('edit')}
                      </button>
                    </div>
                  </div>
                );
              }
              
              if (trx.type === 'reviews') {
                return (
                  <div key={trx.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-purple-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 bg-purple-500" />
                    
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-gray-800 text-lg">{trx.customerName}</h3>
                      <div className="text-xs font-medium uppercase tracking-wider text-gray-400 inline-block px-2 py-1 bg-gray-50 rounded-md">
                        {format(new Date(trx.timestamp), 'HH:mm')}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 mt-4 relative z-10">
                      <button onClick={() => setTransactionToDelete(trx.id)} className="w-auto px-4 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors border border-red-200 font-medium text-sm gap-2 whitespace-nowrap relative z-10">
                        <Trash2 size={16} /> {t('delete')}
                      </button>
                      <button 
                        onClick={() => navigate(`/edit/${trx.id}`)}
                        className="w-auto px-4 h-10 rounded-xl bg-white text-gray-700 flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 font-medium text-sm gap-2 whitespace-nowrap relative z-10"
                      >
                        <Edit3 size={16} /> {t('edit')}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={trx.id} className={`bg-white rounded-[24px] p-5 shadow-sm border ${category.color.split(' ')[2]} relative overflow-hidden group`}>
                  <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 ${category.color.split(' ')[0]}`} />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg mb-1">{trx.customerName}</h3>
                      <div className="text-xs font-medium uppercase tracking-wider text-gray-400 inline-block px-2 py-1 bg-gray-50 rounded-md">
                        {format(new Date(trx.timestamp), 'HH:mm')}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-light text-[#b68c5b]">{formatRupiah(trx.price)}</p>
                    </div>
                  </div>

                  <div className="flex bg-[#f8f6f3] rounded-2xl p-3 mb-4">
                    <div className="flex-1 text-center border-r border-gray-200/50">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">{t('qtyLabel')}</p>
                      <p className="font-serif text-lg text-gray-700 leading-none">{trx.qty}</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">{t('weightLabel')}</p>
                      <p className="font-serif text-lg text-gray-700 leading-none">{trx.gram.toFixed(2)}<span className="text-xs text-gray-400 ml-1">g</span></p>
                    </div>
                  </div>

                  {trx.notes && (
                    <p className="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded-xl italic">
                      "{trx.notes}"
                    </p>
                  )}

                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 mt-2 relative z-10">
                    <button onClick={() => setTransactionToDelete(trx.id)} className="w-auto px-4 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors border border-red-200 font-medium text-sm gap-2 whitespace-nowrap relative z-10">
                      <Trash2 size={16} /> {t('delete')}
                    </button>
                    <button 
                      onClick={() => navigate(`/edit/${trx.id}`)}
                      className="w-auto px-4 h-10 rounded-xl bg-white text-gray-700 flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200 font-medium text-sm gap-2 whitespace-nowrap relative z-10"
                    >
                      <Edit3 size={16} /> {t('edit')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {transactionToDelete && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-6">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6 mx-auto">
                <Trash2 size={32} />
              </div>
              <h2 className="text-2xl font-serif text-gray-800 text-center mb-2 tracking-tight">
                {t('confirmDelete')}
              </h2>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setTransactionToDelete(null)}
                  className="flex-1 py-4 rounded-2xl font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 rounded-2xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
