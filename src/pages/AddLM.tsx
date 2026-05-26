import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, X, Trash2 } from 'lucide-react';
import { useStorage } from '../contexts/StorageContext';
import { useDialog } from '../contexts/DialogContext';

export default function AddLM() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addLmTransaction, updateLmTransaction, getLmTransaction, lmTransactions } = useStorage();
  const { confirm, alert } = useDialog();

  const [type, setType] = useState<'sell' | 'terima'>('terima');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNik, setCustomerNik] = useState('');

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      const load = async () => {
        const trx = await getLmTransaction(id);
        if (trx) {
          setType(trx.type);
          setCustomerName(trx.customerName);
          setCustomerPhone(trx.customerPhone || '');
          setCustomerNik(trx.customerNik || '');
          setItems(trx.items || []);
        }
      };
      load();
    } else {
      setItems([{ id: Date.now(), brand: 'Antam', weight: '', year: '', price: '', lmCode: '', notes: '' }]);
    }
  }, [id]);

  const addItem = () => {
    setItems(prev => [...prev, { id: Date.now(), brand: 'Antam', weight: '', year: '', price: '', lmCode: '', notes: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      await alert({ message: 'Nama dan Nomor HP wajib diisi' });
      return;
    }

    // Validate items
    let totalGram = 0;
    let totalPrice = 0;
    for (const item of items) {
      if (!item.weight || isNaN(item.weight) || !item.price || isNaN(item.price)) {
        await alert({ message: 'Berat dan Harga pada setiap barang wajib diisi dengan benar' });
        return;
      }
      totalGram += parseFloat(item.weight);
      totalPrice += parseFloat(item.price);
    }

    const payload = {
      type,
      customerName,
      customerPhone,
      customerNik,
      items: items.map(i => ({
        brand: i.brand,
        weight: parseFloat(i.weight),
        year: i.year,
        price: parseFloat(i.price),
        lmCode: i.lmCode,
        notes: i.notes
      })),
      totalGram,
      totalPrice,
      date: new Date().toISOString()
    };

    let newId = id;
    if (id) {
      await updateLmTransaction(id, payload);
    } else {
      const addedId = await addLmTransaction(payload);
      if (addedId) {
        newId = addedId;
      }
    }

    await alert({ message: 'Transaksi berhasil disimpan!' });

    navigate('/lm', { state: { highlightedId: newId } });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <button onClick={() => navigate('/lm')} className="p-2 -ml-2 text-gray-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-serif font-medium text-gray-800">
          {id ? 'Edit Transaksi LM' : 'Transaksi LM Baru'}
        </h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        
        {/* Type Toggle */}
        <div className="bg-white p-1 rounded-2xl flex border border-gray-100 shadow-sm">
          <button
            onClick={() => setType('terima')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${
              type === 'terima' ? 'bg-[#b68c5b] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            Terima
          </button>
          <button
            onClick={() => setType('sell')}
            className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all ${
              type === 'sell' ? 'bg-[#b68c5b] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            Sell
          </button>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Data Customer</h2>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-1">Nama Customer*</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Masukkan nama"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-1">Nomor HP*</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="0812..."
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 ml-1">NIK (Opsional)</label>
            <input
              type="text"
              value={customerNik}
              onChange={e => setCustomerNik(e.target.value)}
              placeholder="16 digit NIK"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
            />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Data Barang Antam/LM</h2>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 space-y-4 relative">
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(index)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 bg-red-50 p-1.5 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
              
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#b68c5b]/10 text-[#b68c5b] flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-700">Barang</span>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1 ml-1">Brand</label>
                <select
                  value={item.brand}
                  onChange={e => updateItem(index, 'brand', e.target.value)}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                >
                  <option value="Antam">Antam</option>
                  <option value="UBS">UBS</option>
                  <option value="Retro">Retro</option>
                  <option value="Microgold Antam">Microgold Antam</option>
                  <option value="Microgold UBS">Microgold UBS</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 ml-1">Berat (gram)*</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.weight}
                    onChange={e => updateItem(index, 'weight', e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 ml-1">Tahun Produksi</label>
                  <input
                    type="text"
                    value={item.year}
                    onChange={e => updateItem(index, 'year', e.target.value)}
                    placeholder="Contoh: 2024"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1 ml-1">Total Harga*</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">Rp</span>
                  <input
                    type="number"
                    value={item.price}
                    onChange={e => updateItem(index, 'price', e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1 ml-1">Kode LM (Opsional)</label>
                <input
                  type="text"
                  value={item.lmCode}
                  onChange={e => updateItem(index, 'lmCode', e.target.value)}
                  placeholder="XY123..."
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1 ml-1">Ketentuan Tambahan (Opsional)</label>
                <textarea
                  value={item.notes}
                  onChange={e => updateItem(index, 'notes', e.target.value)}
                  placeholder="Kondisi kemasan, dll"
                  rows={2}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20 resize-none"
                />
              </div>

            </div>
          ))}

          <button
            onClick={addItem}
            className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-500 font-medium rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-[#b68c5b]/30 hover:text-[#b68c5b] transition-all"
          >
            <Plus size={18} /> Tambah Barang LM Lain
          </button>
        </div>

      </div>

      <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] mt-auto">
        <button
          onClick={handleSubmit}
          className="w-full bg-[#b68c5b] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-sm shadow-lg shadow-[#b68c5b]/30"
        >
          Simpan Transaksi LM
        </button>
      </div>

    </div>
  );
}
