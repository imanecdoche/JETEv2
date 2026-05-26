import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X, Save, Settings2, Minus, Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStorage } from '../contexts/StorageContext';
import { Modal } from '../components/Modal';

interface ItemDetail {
  weight: string;
  price: string;
  pricePerGram?: string;
  discountType?: string; // 'per_gram' | 'per_item'
  discountValue?: string; // e.g. '5,000' or '10%'
}

function customRoundPrice(value: number): number {
  if (value < 0) return 0;
  const integerVal = Math.round(value);
  const remainder = integerVal % 1000;
  if (remainder >= 500) {
    return integerVal - remainder + 1000;
  } else {
    return integerVal - remainder;
  }
}

function calculateItemPrice(
  weightStr: string,
  pricePerGramStr: string,
  isBuyback: boolean,
  discountType: string = 'per_gram',
  discountValueStr: string = ''
): { price: number; formattedPrice: string } {
  const weight = parseFloat(weightStr) || 0;
  const pricePerGram = parseFloat(pricePerGramStr.replace(/\D/g, '')) || 0;
  
  if (weight <= 0 || pricePerGram <= 0) {
    return { price: 0, formattedPrice: '' };
  }

  let finalPrice = 0;

  if (!isBuyback) {
    finalPrice = pricePerGram * weight;
  } else {
    const cleanDiscount = discountValueStr.trim();
    const isPercent = cleanDiscount.endsWith('%');
    let discountNum = 0;
    
    if (isPercent) {
      discountNum = parseFloat(cleanDiscount.replace('%', '')) || 0;
    } else {
      discountNum = parseFloat(cleanDiscount.replace(/\D/g, '')) || 0;
    }

    if (discountType === 'per_gram') {
      let potonganPerGram = 0;
      if (isPercent) {
        potonganPerGram = (discountNum / 100) * pricePerGram;
      } else {
        potonganPerGram = discountNum;
      }
      finalPrice = (pricePerGram - potonganPerGram) * weight;
    } else {
      const baseItemPrice = pricePerGram * weight;
      let potonganPerItem = 0;
      if (isPercent) {
        potonganPerItem = (discountNum / 100) * baseItemPrice;
      } else {
        potonganPerItem = discountNum;
      }
      finalPrice = baseItemPrice - potonganPerItem;
    }
  }

  if (finalPrice < 0) finalPrice = 0;
  const roundedPrice = customRoundPrice(finalPrice);

  return {
    price: roundedPrice,
    formattedPrice: roundedPrice > 0 ? roundedPrice.toLocaleString('en-US') : ''
  };
}

export default function AddTransaction() {
  const { currentUser, isLandscapeLayout } = useApp();
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const { getTransaction, addTransaction, updateTransaction } = useStorage();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const [items, setItems] = useState<ItemDetail[]>([{
    weight: '',
    price: '',
    pricePerGram: localStorage.getItem('jeweltrack_last_price_per_gram_sell') || '',
    discountType: 'per_gram',
    discountValue: ''
  }]);
  const [sellItems, setSellItems] = useState<ItemDetail[]>([{
    weight: '',
    price: '',
    pricePerGram: localStorage.getItem('jeweltrack_last_price_per_gram_buyback') || '',
    discountType: 'per_gram',
    discountValue: ''
  }]);
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [isSellItemsModalOpen, setIsSellItemsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: 'sell',
    qty: '',
    gram: '',
    price: '',
    customerName: '',
    notes: '',
    sellQty: '',
    sellGram: '',
    sellPrice: '',
  });

  useEffect(() => {
    if (!window.visualViewport) return;
    const viewport = window.visualViewport;
    let initialHeight = viewport.height;
    
    const handleResize = () => {
      if (viewport.height > initialHeight) {
        initialHeight = viewport.height;
      }
      if (viewport.height < initialHeight * 0.80) {
        setIsKeyboardOpen(true);
      } else {
        setIsKeyboardOpen(false);
      }
    };
    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (id) {
      setFetching(true);
      const fetchTransaction = async () => {
        try {
          const data = await getTransaction(id);
          if (data) {
            setFormData({
              type: data.type,
              qty: data.qty.toString(),
              gram: data.gram.toString(),
              price: data.price ? parseInt(data.price.toString().replace(/\D/g, '')).toLocaleString('en-US') : '',
              customerName: data.customerName,
              notes: data.notes || '',
              sellQty: data.sellQty?.toString() || '',
              sellGram: data.sellGram?.toString() || '',
              sellPrice: data.sellPrice ? parseInt(data.sellPrice.toString().replace(/\D/g, '')).toLocaleString('en-US') : '',
            });

            if (data.itemsData) {
              try {
                const parsed = JSON.parse(data.itemsData);
                const restored = parsed.map((item: any) => {
                  let pg = item.pricePerGram;
                  if (!pg) {
                    const wt = parseFloat(item.weight) || 0;
                    const pr = parseFloat(item.price ? item.price.replace(/\D/g, '') : '0') || 0;
                    pg = wt > 0 ? Math.round(pr / wt).toString() : '';
                  }
                  if (pg && !isNaN(parseInt(pg.replace(/\D/g, '')))) {
                    pg = parseInt(pg.replace(/\D/g, ''), 10).toLocaleString('en-US');
                  }
                  return {
                    weight: item.weight || '',
                    price: item.price || '',
                    pricePerGram: pg || '',
                    discountType: item.discountType || 'per_gram',
                    discountValue: item.discountValue || '',
                  };
                });
                setItems(restored);
              } catch(e){}
            }
            if (data.sellItemsData) {
              try {
                const parsed = JSON.parse(data.sellItemsData);
                const restored = parsed.map((item: any) => {
                  let pg = item.pricePerGram;
                  if (!pg) {
                    const wt = parseFloat(item.weight) || 0;
                    const pr = parseFloat(item.price ? item.price.replace(/\D/g, '') : '0') || 0;
                    pg = wt > 0 ? Math.round(pr / wt).toString() : '';
                  }
                  if (pg && !isNaN(parseInt(pg.replace(/\D/g, '')))) {
                    pg = parseInt(pg.replace(/\D/g, ''), 10).toLocaleString('en-US');
                  }
                  return {
                    weight: item.weight || '',
                    price: item.price || '',
                    pricePerGram: pg || '',
                    discountType: item.discountType || 'per_gram',
                    discountValue: item.discountValue || '',
                  };
                });
                setSellItems(restored);
              } catch(e){}
            }
          }
        } catch (error) {
          console.error(error);
        } finally {
          setFetching(false);
        }
      };
      fetchTransaction();
    }
  }, [id, getTransaction]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, isSell = false) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      if (isSell) setFormData({ ...formData, sellPrice: '' });
      else setFormData({ ...formData, price: '' });
      return;
    }
    const formattedValue = parseInt(rawValue, 10).toLocaleString('en-US');
    if (isSell) setFormData({ ...formData, sellPrice: formattedValue });
    else setFormData({ ...formData, price: formattedValue });
  };

  useEffect(() => {
    const q = parseInt(formData.qty, 10);
    if (!isNaN(q) && q > 0 && q !== items.length) {
      if (q > items.length) {
        const isBuyback = formData.type === 'buyback';
        const lastPg = isBuyback
          ? (localStorage.getItem('jeweltrack_last_price_per_gram_buyback') || '')
          : (localStorage.getItem('jeweltrack_last_price_per_gram_sell') || '');
        const newItems = [...items];
        for (let i = items.length; i < q; i++) {
          newItems.push({
            weight: '',
            price: '',
            pricePerGram: lastPg,
            discountType: 'per_gram',
            discountValue: '',
          });
        }
        setItems(newItems);
      } else {
        setItems(items.slice(0, q));
      }
    }
  }, [formData.qty, formData.type]);

  useEffect(() => {
    const sq = parseInt(formData.sellQty, 10);
    if (!isNaN(sq) && sq > 0 && sq !== sellItems.length) {
      if (sq > sellItems.length) {
        const lastPg = localStorage.getItem('jeweltrack_last_price_per_gram_buyback') || '';
        const newSellItems = [...sellItems];
        for (let i = sellItems.length; i < sq; i++) {
          newSellItems.push({
            weight: '',
            price: '',
            pricePerGram: lastPg,
            discountType: 'per_gram',
            discountValue: '',
          });
        }
        setSellItems(newSellItems);
      } else {
        setSellItems(sellItems.slice(0, sq));
      }
    }
  }, [formData.sellQty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const commonData = {
        type: formData.type,
        qty: parseInt(formData.qty) || (formData.type === 'reviews' ? 0 : 1),
        gram: parseFloat(formData.gram) || 0,
        price: parseFloat(formData.price.replace(/\D/g, '')) || 0,
        customerName: formData.customerName || 'Walk-in',
        notes: formData.notes,
        ...(formData.type === 'trade_in' ? {
          sellQty: parseInt(formData.sellQty) || 1,
          sellGram: parseFloat(formData.sellGram) || 0,
          sellPrice: parseFloat(formData.sellPrice.replace(/\D/g, '')) || 0,
          itemsData: JSON.stringify(items.slice(0, parseInt(formData.qty) || 1)),
          sellItemsData: JSON.stringify(sellItems.slice(0, parseInt(formData.sellQty) || 1)),
        } : {
          itemsData: JSON.stringify(items.slice(0, parseInt(formData.qty) || 1)),
        }),
      };

      if (id) {
        await updateTransaction(id, {
          ...commonData,
          updatedAt: Date.now(),
        });
      } else {
        const now = new Date();
        await addTransaction({
          ...commonData,
          userId: currentUser.id,
          date: format(now, 'yyyy-MM-dd'),
          timestamp: now.getTime(),
        });
      }
      navigate(-1);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const isFormValid = formData.type === 'reviews' 
    ? formData.customerName.trim() !== '' 
    : formData.type === 'trade_in'
      ? formData.qty.trim() !== '' && formData.gram.trim() !== '' && formData.sellQty.trim() !== '' && formData.sellGram.trim() !== ''
      : formData.qty.trim() !== '' && formData.gram.trim() !== '';

  const TYPES = [
    { id: 'sell', label: 'cat_sell' },
    { id: 'buyback', label: 'cat_buyback' },
    { id: 'trade_in', label: 'cat_trade_in' },
    { id: 'reviews', label: 'cat_reviews' },
    { id: 'services', label: 'cat_services' },
    { id: 'cnn', label: 'cat_cnn' },
  ];

  const renderItemsInput = (isSell: boolean) => {
    const q = parseInt(isSell ? formData.sellQty : formData.qty, 10) || 1;
    const currentItems = isSell ? sellItems : items;
    const setItemsState = isSell ? setSellItems : setItems;
    const isBuybackItem = isSell || formData.type === 'buyback';

    const setTotal = (newItems: any[]) => {
      let tGram = 0;
      let tPrice = 0;
      newItems.slice(0, q).forEach((i: any) => {
        tGram += parseFloat(i.weight) || 0;
        tPrice += parseFloat(i.price.replace(/\D/g, '')) || 0;
      });
      const formattedGram = parseFloat(tGram.toFixed(4)).toString();
      if (isSell) {
        setFormData(prev => ({...prev, sellGram: formattedGram, sellPrice: tPrice.toLocaleString('en-US')}));
      } else {
        setFormData(prev => ({...prev, gram: formattedGram, price: tPrice.toLocaleString('en-US')}));
      }
    };

    const handleChange = (idx: number, field: 'weight' | 'pricePerGram' | 'discountType' | 'discountValue', val: string) => {
      const newItems = [...currentItems];
      const item = { ...newItems[idx], [field]: val };

      if (field === 'pricePerGram') {
        const numeric = val.replace(/\D/g, '');
        item.pricePerGram = numeric ? parseInt(numeric, 10).toLocaleString('en-US') : '';
        if (isBuybackItem) {
          localStorage.setItem('jeweltrack_last_price_per_gram_buyback', item.pricePerGram);
        } else {
          localStorage.setItem('jeweltrack_last_price_per_gram_sell', item.pricePerGram);
        }
      }

      if (field === 'discountValue') {
        const hasPercent = val.includes('%');
        let processed = val;
        if (hasPercent) {
          const numeric = val.replace(/[^\d.]/g, '');
          processed = numeric ? `${numeric}%` : '';
        } else {
          const numeric = val.replace(/\D/g, '');
          processed = numeric ? parseInt(numeric, 10).toLocaleString('en-US') : '';
        }
        item.discountValue = processed;
      }

      const calcResult = calculateItemPrice(
        item.weight || '',
        item.pricePerGram || '',
        isBuybackItem,
        item.discountType || 'per_gram',
        item.discountValue || ''
      );

      item.price = calcResult.formattedPrice;
      newItems[idx] = item;
      setItemsState(newItems);
      setTotal(newItems);
    };

    if (q >= 5) {
      return (
        <div>
          <button type="button" onClick={() => isSell ? setIsSellItemsModalOpen(true) : setIsItemsModalOpen(true)} className="w-full py-4 text-center border-2 border-dashed border-[#b68c5b]/40 text-[#b68c5b] font-medium rounded-2xl mb-4 hover:bg-[#b68c5b]/5 transition-colors">
            <Settings2 className="inline-block w-5 h-5 mr-2" />
            Fill Item Details ({q} items)
          </button>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Total Weight</label>
              <input type="text" readOnly value={isSell ? formData.sellGram : formData.gram} placeholder="0.00" className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-lg font-medium text-gray-500 outline-none" required />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Total Price</label>
              <input type="text" readOnly value={isSell ? formData.sellPrice : formData.price} placeholder="0" className="w-full bg-gray-100 rounded-2xl px-5 py-4 text-lg font-medium text-gray-500 outline-none" required />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {currentItems.slice(0, q).map((item, idx) => (
          <div key={idx} className="bg-gray-50/40 border border-gray-100 p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-xs font-extrabold text-[#b68c5b] uppercase tracking-wider">
                Item #{idx + 1}
              </span>
              {item.weight && item.price && (
                <span className="text-xs text-gray-400 italic">
                  {isBuybackItem ? 'Buyback Calculated' : 'Sell Calculated'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">
                  Weight (Gram) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={item.weight}
                  onChange={e => handleChange(idx, 'weight', e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">
                  Price per Gram *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={item.pricePerGram || ''}
                  onChange={e => handleChange(idx, 'pricePerGram', e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-[#b68c5b]/20 text-[#b68c5b] font-medium"
                />
              </div>
            </div>

            {isBuybackItem && (
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">
                    Potongan
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5,000 or 10%"
                    value={item.discountValue || ''}
                    onChange={e => handleChange(idx, 'discountValue', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">
                    Jenis Potongan
                  </label>
                  <select
                    value={item.discountType || 'per_gram'}
                    onChange={e => handleChange(idx, 'discountType', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                  >
                    <option value="per_gram">Potongan per Gram</option>
                    <option value="per_item">Potongan per Item</option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 ml-1">
                Calculated Price
              </label>
              <div className="w-full bg-gray-100 border border-gray-200/50 rounded-xl px-4 py-3 text-lg font-bold text-gray-800 flex justify-between items-center">
                <span className="text-sm font-normal text-gray-400 text-left font-sans">Rp</span>
                <span className="font-serif text-[#b68c5b]">
                  {item.price || '0'}
                </span>
              </div>
            </div>
          </div>
        ))}
        {q > 1 && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
             <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Total Weight</label>
               <input type="text" readOnly value={isSell ? formData.sellGram : formData.gram} placeholder="0.00" className="w-full bg-gray-100/50 rounded-2xl px-5 py-4 text-lg font-medium text-gray-600 outline-none" required />
             </div>
             <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Total Price</label>
               <input type="text" readOnly value={isSell ? formData.sellPrice : formData.price} placeholder="0" className="w-full bg-gray-100/50 rounded-2xl px-5 py-4 text-lg font-medium text-[#b68c5b]/70 outline-none" required />
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderModal = (isSell: boolean) => {
    const isOpen = isSell ? isSellItemsModalOpen : isItemsModalOpen;
    const q = parseInt(isSell ? formData.sellQty : formData.qty, 10) || 1;
    const currentItems = isSell ? sellItems : items;
    const setItemsState = isSell ? setSellItems : setItems;
    const isBuybackItem = isSell || formData.type === 'buyback';

    const setTotal = (newItems: any[]) => {
      let tGram = 0;
      let tPrice = 0;
      newItems.slice(0, q).forEach((i: any) => {
        tGram += parseFloat(i.weight) || 0;
        tPrice += parseFloat(i.price.replace(/\D/g, '')) || 0;
      });
      const formattedGram = parseFloat(tGram.toFixed(4)).toString();
      if (isSell) {
        setFormData(prev => ({...prev, sellGram: formattedGram, sellPrice: tPrice.toLocaleString('en-US')}));
      } else {
        setFormData(prev => ({...prev, gram: formattedGram, price: tPrice.toLocaleString('en-US')}));
      }
    };

    const handleChange = (idx: number, field: 'weight' | 'pricePerGram' | 'discountType' | 'discountValue', val: string) => {
      const newItems = [...currentItems];
      const item = { ...newItems[idx], [field]: val };

      if (field === 'pricePerGram') {
        const numeric = val.replace(/\D/g, '');
        item.pricePerGram = numeric ? parseInt(numeric, 10).toLocaleString('en-US') : '';
        if (isBuybackItem) {
          localStorage.setItem('jeweltrack_last_price_per_gram_buyback', item.pricePerGram);
        } else {
          localStorage.setItem('jeweltrack_last_price_per_gram_sell', item.pricePerGram);
        }
      }

      if (field === 'discountValue') {
        const hasPercent = val.includes('%');
        let processed = val;
        if (hasPercent) {
          const numeric = val.replace(/[^\d.]/g, '');
          processed = numeric ? `${numeric}%` : '';
        } else {
          const numeric = val.replace(/\D/g, '');
          processed = numeric ? parseInt(numeric, 10).toLocaleString('en-US') : '';
        }
        item.discountValue = processed;
      }

      const calcResult = calculateItemPrice(
        item.weight || '',
        item.pricePerGram || '',
        isBuybackItem,
        item.discountType || 'per_gram',
        item.discountValue || ''
      );

      item.price = calcResult.formattedPrice;
      newItems[idx] = item;
      setItemsState(newItems);
      setTotal(newItems);
    };

    return (
      <Modal isOpen={isOpen} onClose={() => isSell ? setIsSellItemsModalOpen(false) : setIsItemsModalOpen(false)} title={`Fill ${isSell ? 'Sell' : 'Buy'} Items`}>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 hide-scrollbar">
          {currentItems.slice(0, q).map((item, idx) => (
             <div key={idx} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
                 <div className="text-xs font-bold text-[#b68c5b]">Item #{idx+1}</div>
                 <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Weight *</label>
                       <input type="number" step="0.01" value={item.weight} onChange={e => handleChange(idx, 'weight', e.target.value)} placeholder="0.00" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#b68c5b]" required />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Price per Gram *</label>
                       <input type="text" inputMode="numeric" value={item.pricePerGram || ''} onChange={e => handleChange(idx, 'pricePerGram', e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm text-[#b68c5b] font-medium outline-none focus:border-[#b68c5b]" required />
                     </div>
                 </div>

                 {isBuybackItem && (
                   <div className="grid grid-cols-2 gap-3">
                       <div>
                         <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Potongan</label>
                         <input type="text" value={item.discountValue || ''} onChange={e => handleChange(idx, 'discountValue', e.target.value)} placeholder="e.g. 5,000 or 10%" className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#b68c5b]" />
                       </div>
                       <div>
                         <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Jenis Potongan</label>
                         <select value={item.discountType || 'per_gram'} onChange={e => handleChange(idx, 'discountType', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#b68c5b]">
                           <option value="per_gram">Potongan per Gram</option>
                           <option value="per_item">Potongan per Item</option>
                         </select>
                       </div>
                   </div>
                 )}

                 <div className="text-right text-xs pt-1 border-t border-gray-100/50 flex justify-between items-center text-gray-500">
                   <span>Calculated:</span>
                   <span className="font-serif font-bold text-[#b68c5b]">Rp {item.price || '0'}</span>
                 </div>
             </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4 px-2">
            <div>
               <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Weight</div>
               <div className="font-medium text-lg">{isSell ? formData.sellGram : formData.gram || '0'}<span className="text-sm text-gray-400 ml-1">g</span></div>
            </div>
            <div className="text-right">
               <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Price</div>
               <div className="font-serif text-xl text-[#b68c5b]">{isSell ? formData.sellPrice : formData.price || '0'}</div>
            </div>
          </div>
          <button type="button" onClick={() => isSell ? setIsSellItemsModalOpen(false) : setIsItemsModalOpen(false)} className="w-full bg-[#2c2a29] text-white py-4 rounded-xl font-medium shadow-sm hover:bg-black transition-colors">
            Done
          </button>
        </div>
      </Modal>
    );
  };

  return (
    <div className="min-h-full relative">
      <div className="px-4 py-6 md:px-6 pb-24 md:pb-32">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif text-[#b68c5b] tracking-tight">
            {id ? t('editRecord') : t('addRecord')}
          </h1>
          <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all">
            <X size={24} />
          </button>
        </div>

        {fetching ? (
          <div className="text-center p-12 text-gray-400 font-serif">{t('loading')}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 flex overflow-x-auto gap-2 hide-scrollbar">
              {TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.id })}
                  className={`py-3 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    formData.type === type.id 
                      ? 'bg-[#b68c5b] text-white shadow-md' 
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {t(type.label)}
                </button>
              ))}
            </div>

            {formData.type === 'services' || formData.type === 'cnn' ? (
              <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-[#b68c5b]/10 rounded-full flex items-center justify-center">
                  <div className="animate-[spin_4s_linear_infinite]">
                    <svg className="w-10 h-10 text-[#b68c5b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-serif text-xl text-gray-800 mb-2">Feature Currently Under Development</h3>
                  <p className="text-sm text-gray-500">This module is being built and will be available soon.</p>
                </div>
              </div>
            ) : formData.type === 'reviews' ? (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('customerName')} *</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder={t('walkIn')}
                    required
                    className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                  />
                </div>
              </div>
            ) : formData.type === 'trade_in' ? (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                  <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3">Customer Buys (New Item)</h3>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Item / Customer Desc</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                      placeholder="e.g. Kalung Emas / Mrs. Jane"
                      className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('quantity')} *</label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={formData.qty}
                          onChange={e => setFormData({ ...formData, qty: e.target.value })}
                          placeholder="1"
                          required
                          className="w-full bg-gray-50 rounded-2xl pl-5 pr-28 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                        />
                        <div className="absolute right-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const v = parseInt(formData.qty, 10) || 1;
                              const newVal = Math.max(1, v - 1);
                              setFormData({ ...formData, qty: newVal.toString() });
                            }}
                            className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-transform"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const v = parseInt(formData.qty, 10) || 0;
                              const newVal = v + 1;
                              setFormData({ ...formData, qty: newVal.toString() });
                            }}
                            className="w-10 h-10 rounded-xl bg-[#b68c5b] text-white flex items-center justify-center hover:bg-[#b68c5b]/90 active:scale-95 transition-transform"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {renderItemsInput(false)}
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                  <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3">Customer Sells (Old Item)</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('quantity')} *</label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={formData.sellQty}
                          onChange={e => setFormData({ ...formData, sellQty: e.target.value })}
                          placeholder="1"
                          required
                          className="w-full bg-gray-50 rounded-2xl pl-5 pr-28 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                        />
                        <div className="absolute right-2 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const v = parseInt(formData.sellQty, 10) || 1;
                              const newVal = Math.max(1, v - 1);
                              setFormData({ ...formData, sellQty: newVal.toString() });
                            }}
                            className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-transform"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const v = parseInt(formData.sellQty, 10) || 0;
                              const newVal = v + 1;
                              setFormData({ ...formData, sellQty: newVal.toString() });
                            }}
                            className="w-10 h-10 rounded-xl bg-[#b68c5b] text-white flex items-center justify-center hover:bg-[#b68c5b]/90 active:scale-95 transition-transform"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {renderItemsInput(true)}
                </div>

                <div className="bg-[#b68c5b]/10 rounded-3xl p-6 border border-[#b68c5b]/20">
                  {(() => {
                    const buyPrice = parseFloat(formData.price.replace(/\D/g, '')) || 0;
                    const sellPrice = parseFloat(formData.sellPrice.replace(/\D/g, '')) || 0;
                    const diff = buyPrice - sellPrice;
                    
                    return (
                      <div className="flex flex-col items-center text-center">
                        <span className="text-sm font-medium text-gray-600 mb-1">
                          {diff >= 0 ? "Customer Adds" : "Customer Receives Change"}
                        </span>
                        <span className="text-3xl font-serif text-[#b68c5b]">
                          Rp {Math.abs(diff).toLocaleString('id-ID')}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('quantity')} *</label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={formData.qty}
                        onChange={e => setFormData({ ...formData, qty: e.target.value })}
                        placeholder="1"
                        required
                        className="w-full bg-gray-50 rounded-2xl pl-5 pr-28 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                      />
                      <div className="absolute right-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const v = parseInt(formData.qty, 10) || 1;
                            const newVal = Math.max(1, v - 1);
                            setFormData({ ...formData, qty: newVal.toString() });
                          }}
                          className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:scale-95 transition-transform"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const v = parseInt(formData.qty, 10) || 0;
                            const newVal = v + 1;
                            setFormData({ ...formData, qty: newVal.toString() });
                          }}
                          className="w-10 h-10 rounded-xl bg-[#b68c5b] text-white flex items-center justify-center hover:bg-[#b68c5b]/90 active:scale-95 transition-transform"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {renderItemsInput(false)}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('customerName')}</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder={t('walkIn')}
                    className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-lg font-medium outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{t('notes')}</label>
                    <textarea
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      placeholder={t('notesPlaceholder')}
                      rows={2}
                      className="w-full bg-gray-50 rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20 resize-none"
                    />
                </div>
              </div>
            )}

            {(formData.type !== 'services' && formData.type !== 'cnn') && (
              <div className={`pt-4 ${isLandscapeLayout ? 'pt-0' : ''}`}>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={isLandscapeLayout || isKeyboardOpen ? `
                  fixed bottom-8 right-8 w-16 h-16 bg-[#2c2a29] text-white p-0 rounded-full shadow-2xl z-50 flex items-center justify-center active:scale-[0.98] transition-transform disabled:opacity-70 disabled:bg-gray-400
                ` : `
                  w-full bg-[#2c2a29] text-white py-5 rounded-full font-medium text-lg tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-70 shadow-lg disabled:bg-gray-400
                `}
              >
                {loading ? (
                  (!isLandscapeLayout && !isKeyboardOpen) && <span>{t('loading')}</span>
                ) : (
                  <>
                    {(!isLandscapeLayout && !isKeyboardOpen) && <span className="flex items-center gap-2">
                      <Check size={20} /> {id ? t('update') : t('save')}
                    </span>}
                    {(isLandscapeLayout || isKeyboardOpen) && <span>
                      <Save size={28} />
                    </span>}
                  </>
                )}
              </button>
            </div>
            )}
            {renderModal(false)}
            {renderModal(true)}
          </form>
        )}
      </div>
    </div>
  );
}
