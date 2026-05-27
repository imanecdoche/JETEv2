import React, { useState, useMemo } from 'react';
import { 
  X, Calendar, Download, FileText, User, Clock, 
  ChevronRight, ArrowUpRight, ArrowDownRight, RefreshCw 
} from 'lucide-react';
import { 
  format, startOfWeek, endOfWeek, startOfDay, endOfDay, 
  isSameDay, isSameMonth, isSameYear, isWithinInterval, parseISO 
} from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { useApp } from '../contexts/AppContext';
import { useStorage } from '../contexts/StorageContext';
import { useDialog } from '../contexts/DialogContext';
import { jsPDF } from 'jspdf';
import Rupiah, { formatRupiahString } from './Rupiah';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export function ReportModal({ isOpen, onClose }: ReportModalProps) {
  const { t } = useLanguage();
  const { currentUser } = useApp();
  const { transactions, transactionSummaries } = useStorage();
  const { alert } = useDialog();

  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState<string>(format(new Date(), 'yyyy'));
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Get active range details based on filters
  const rangeLabel = useMemo(() => {
    try {
      if (period === 'daily') {
        const d = parseISO(selectedDate);
        return format(d, 'EEEE, d MMMM yyyy');
      } else if (period === 'weekly') {
        const d = parseISO(selectedDate);
        const start = startOfWeek(d, { weekStartsOn: 1 });
        const end = endOfWeek(d, { weekStartsOn: 1 });
        return `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy')} (Week)`;
      } else if (period === 'monthly') {
        const parts = selectedMonth.split('-');
        const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
        return format(date, 'MMMM yyyy');
      } else if (period === 'yearly') {
        return `Tahun ${selectedYear}`;
      } else if (period === 'custom') {
        if (!startDate || !endDate) return 'No selection';
        return `${format(parseISO(startDate), 'd MMM yyyy')} s/d ${format(parseISO(endDate), 'd MMM yyyy')}`;
      }
    } catch (e) {
      return '';
    }
    return '';
  }, [period, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  // Compute filtered transactions and stats
  const filteredData = useMemo(() => {
    let filteredTrxs = [...transactions];
    
    // Sort transactions oldest to newest for historical report feel
    filteredTrxs.sort((a, b) => a.timestamp - b.timestamp);

    filteredTrxs = filteredTrxs.filter(t => {
      const date = new Date(t.timestamp);
      
      try {
        switch (period) {
          case 'daily': {
            const target = parseISO(selectedDate);
            return isSameDay(date, target);
          }
          case 'weekly': {
            const pivot = parseISO(selectedDate);
            const startStr = startOfWeek(pivot, { weekStartsOn: 1 });
            const endStr = endOfWeek(pivot, { weekStartsOn: 1 });
            return isWithinInterval(date, { start: startOfDay(startStr), end: endOfDay(endStr) });
          }
          case 'monthly': {
            const parts = selectedMonth.split('-');
            const target = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
            return isSameMonth(date, target);
          }
          case 'yearly': {
            const yearNum = parseInt(selectedYear);
            return isSameYear(date, new Date(yearNum, 0, 1));
          }
          case 'custom': {
            if (!startDate || !endDate) return true;
            return isWithinInterval(date, {
              start: startOfDay(parseISO(startDate)),
              end: endOfDay(parseISO(endDate))
            });
          }
          default:
            return true;
        }
      } catch (err) {
        return true;
      }
    });

    // Calculate core totals
    let totalQty = 0;
    let totalGram = 0;
    let cashIn = 0;
    let cashOut = 0;
    let sellCount = 0;
    let buyCount = 0;
    let tradeInCount = 0;
    let othersCount = 0;
    let gramIn = 0;
    let gramOut = 0;

    filteredTrxs.forEach(t => {
      const qty = t.type === 'trade_in' ? ((t.qty || 0) + (t.sellQty || 0)) : (t.qty || 0);
      const gram = t.type === 'trade_in' ? ((t.gram || 0) + (t.sellGram || 0)) : (t.gram || 0);
      
      totalQty += qty;
      totalGram += gram;

      if (t.type === 'buyback') {
        buyCount++;
        gramIn += (t.gram || 0);
        cashOut += (t.price || 0);
      } else if (t.type === 'sell') {
        sellCount++;
        gramOut += (t.gram || 0);
        cashIn += (t.price || 0);
      } else if (t.type === 'trade_in') {
        tradeInCount++;
        gramIn += (t.sellGram || 0);
        gramOut += (t.gram || 0);
        const diff = (t.price || 0) - (t.sellPrice || 0);
        if (diff > 0) {
          cashIn += diff;
        } else if (diff < 0) {
          cashOut += Math.abs(diff);
        }
      } else {
        othersCount++;
        if (t.price) {
          cashIn += t.price;
        }
      }
    });

    const netCash = cashIn - cashOut;

    return {
      trxs: filteredTrxs,
      stats: {
        count: filteredTrxs.length,
        totalQty,
        totalGram,
        cashIn,
        cashOut,
        netCash,
        sellCount,
        buyCount,
        tradeInCount,
        othersCount,
        gramIn,
        gramOut
      }
    };
  }, [transactions, period, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  const formatRupiah = (num: number) => {
    return formatRupiahString(num);
  };

  const generatePDF = () => {
    if (filteredData.trxs.length === 0) {
      alert({ message: 'Tidak ada data transaksi untuk diekspor pada periode ini.' });
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const rootName = "JewelTrack";
      const reportTitle = `${period.toUpperCase()} PERFORMANCE & RECONCILIATION`;
      
      const primaryColor = [182, 140, 91]; // #b68c5b
      const darkColor = [31, 41, 55]; // Gray-800
      const lightBg = [249, 250, 251]; // Gray-50
      const borderLineColor = [229, 231, 235]; // Gray-200

      let currentPage = 1;
      const getPageCountText = () => `Halaman ${currentPage}`;

      // Helper to draw clean visual headers on each page
      const drawHeader = (pageNum: number) => {
        // Gold header bar representation
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(15, 12, 180, 2.5, 'F');

        // Branding Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text(rootName.toUpperCase(), 15, 23);

        // Branding description line
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(110, 115, 125);
        doc.text('Jewelry Store Premium Performance Tracker & POS', 15, 27);

        // Document Meta Right
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('OFFICIAL OPERATIONAL RECAND RECON', 195, 22, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(110, 115, 125);
        doc.text(`Dicetak: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 195, 27, { align: 'right' });

        // Divider Line
        doc.setDrawColor(borderLineColor[0], borderLineColor[1], borderLineColor[2]);
        doc.setLineWidth(0.3);
        doc.line(15, 31, 195, 31);
      };

      // Helper to draw clean footers
      const drawFooter = () => {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text('Dokumen ini dihasilkan secara otomatis oleh sistem pencatatan JewelTrack yang sah.', 15, 285);
        doc.text(getPageCountText(), 195, 285, { align: 'right' });
      };

      // PAGE 1 SETUP
      drawHeader(currentPage);

      // Section: Period Details Title Header
      let y = 40;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text(`LAPORAN KINERJA: ${rangeLabel.toUpperCase()}`, 15, y);

      // Meta detail block
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(`Tipe Dokumen  : Laporan Transaksi (${period.toUpperCase()})`, 15, y);
      doc.text(`Diproses Oleh : ${currentUser?.name || 'Karyawan'}`, 115, y);
      
      y += 4.5;
      doc.text(`Rentang Waktu : ${rangeLabel}`, 15, y);
      doc.text(`Wewenang      : ${currentUser?.role?.toUpperCase() || 'STAF'}`, 115, y);

      y += 7;

      // Section Banner: KPI Stats Boxes
      // Draw beautiful cards for metrics using rect
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.setDrawColor(borderLineColor[0], borderLineColor[1], borderLineColor[2]);
      doc.roundedRect(15, y, 56, 24, 2, 2, 'FD'); // Inflow
      doc.roundedRect(77, y, 56, 24, 2, 2, 'FD'); // Outflow
      doc.roundedRect(139, y, 56, 24, 2, 2, 'FD'); // Net

      // Content inside KPI Boxes
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      
      // Box 1
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text('TOTAL DEBIT (UANG MASUK)', 15 + 4, y + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text(formatRupiah(filteredData.stats.cashIn), 15 + 4, y + 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text('Penjualan & Selisih Tukar Tambah', 15 + 4, y + 20);

      // Box 2
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(225, 29, 72); // rose-600
      doc.text('TOTAL KREDIT (UANG KELUAR)', 77 + 4, y + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text(formatRupiah(filteredData.stats.cashOut), 77 + 4, y + 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text('Beli Balik & Selisih Tukar Tambah', 77 + 4, y + 20);

      // Box 3
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('SALDO REKONSILIASI BERSIH', 139 + 4, y + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(filteredData.stats.netCash >= 0 ? 5 : 220, filteredData.stats.netCash >= 0 ? 120 : 30, filteredData.stats.netCash >= 0 ? 80 : 30);
      doc.text(formatRupiah(filteredData.stats.netCash), 139 + 4, y + 15);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text('Selisih Kas Bersih Tersimpan', 139 + 4, y + 20);

      y += 30;

      // Secondary Stats list (Quantity, Grams stats)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(borderLineColor[0], borderLineColor[1], borderLineColor[2]);
      doc.roundedRect(15, y, 180, 18, 1, 1, 'D');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(75, 85, 99);
      
      // Column placements for fine detail row
      doc.text(`Total Volume Transaksi: ${filteredData.stats.count} item`, 20, y + 11);
      doc.line(75, y + 4, 75, y + 14);
      doc.text(`Gramasi Masuk: ${filteredData.stats.gramIn.toFixed(2)}g`, 80, y + 11);
      doc.line(132, y + 4, 132, y + 14);
      doc.text(`Gramasi Keluar: ${filteredData.stats.gramOut.toFixed(2)}g`, 137, y + 11);

      y += 26;

      // Table Header Section: Transaction List
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('DETIL TRANSAKSI DAN OPERASIONAL', 15, y);

      y += 4.5;

      // Table Header Row Design
      doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.rect(15, y, 180, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);

      // Columns map widths: No(8), Tanggal(22), Pelanggan(35), Tipe(20), ItemDetail(55), Price(40)
      doc.text('NO', 17, y + 5.5);
      doc.text('TANGGAL', 25, y + 5.5);
      doc.text('PELANGGAN', 47, y + 5.5);
      doc.text('TIPE', 82, y + 5.5);
      doc.text('DETAIL ITEM', 102, y + 5.5);
      doc.text('NOMINAL', 193, y + 5.5, { align: 'right' });

      y += 8;

      let no = 1;
      filteredData.trxs.forEach((trx) => {
        // Safe check for vertical space. If we are too low on page, wrap to next page.
        if (y > 265) {
          drawFooter();
          doc.addPage();
          currentPage++;
          y = 35; // start slightly higher on next pages
          drawHeader(currentPage);

          // Draw table header again
          doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
          doc.rect(15, y, 180, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text('NO', 17, y + 5.5);
          doc.text('TANGGAL', 25, y + 5.5);
          doc.text('PELANGGAN', 47, y + 5.5);
          doc.text('TIPE', 82, y + 5.5);
          doc.text('DETAIL ITEM', 102, y + 5.5);
          doc.text('NOMINAL', 193, y + 5.5, { align: 'right' });
          y += 8;
        }

        // Draw light zebra striping
        if (no % 2 === 0) {
          doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
          doc.rect(15, y, 180, 7.5, 'F');
        }

        // Content variables
        const trxDate = format(new Date(trx.timestamp), 'yyyy-MM-dd');
        const customer = trx.customerName || 'Walk-in';
        
        let typeStr = trx.type;
        if (trx.type === 'sell') typeStr = 'Sell (Penjualan)';
        else if (trx.type === 'buyback') typeStr = 'Buyback (Beli Balik)';
        else if (trx.type === 'trade_in') typeStr = 'TradeIn (Tukar)';
        else if (trx.type === 'services') typeStr = 'Service (Jasa)';
        else if (trx.type === 'reviews') typeStr = 'Review Ulasan';
        else typeStr = trx.type.toUpperCase();

        const qtyText = `Qty: ${trx.qty || 1} | ${trx.gram || 0}g`;
        let detailText = qtyText;
        if (trx.type === 'trade_in') {
          detailText = `K: ${trx.qty} (${trx.gram}g) / M: ${trx.sellQty} (${trx.sellGram}g)`;
        }

        let priceText = '';
        if (trx.type === 'trade_in') {
          const diffVal = (trx.price || 0) - (trx.sellPrice || 0);
          if (diffVal > 0) {
            priceText = `+ ${formatRupiah(diffVal)}`;
          } else if (diffVal < 0) {
            priceText = `- ${formatRupiah(Math.abs(diffVal))}`;
          } else {
            priceText = 'Rp 0';
          }
        } else {
          priceText = formatRupiah(trx.price || 0);
        }

        // Output lines
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(31, 41, 55);

        doc.text(no.toString(), 17, y + 5);
        doc.text(trxDate, 25, y + 5);
        
        // Truncate customer name if too long
        const truncatedCust = customer.length > 18 ? customer.substring(0, 16) + '..' : customer;
        doc.text(truncatedCust, 47, y + 5);

        doc.setFont('helvetica', 'semibold');
        doc.text(typeStr, 82, y + 5);
        doc.setFont('helvetica', 'normal');

        doc.text(detailText, 102, y + 5);
        doc.text(priceText, 193, y + 5, { align: 'right' });

        // Bottom thin row divider
        doc.setDrawColor(243, 244, 246);
        doc.setLineWidth(0.15);
        doc.line(15, y + 7.5, 195, y + 7.5);

        y += 7.5;
        no++;
      });

      // Bottom footer for the final page
      drawFooter();

      // SAVE WORK WITH FILE DESIGNATION
      const formattedFileName = `JEWELTRACK_REPORT_${period.toUpperCase()}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(formattedFileName);

    } catch (err) {
      console.error(err);
      alert({ message: 'Error generating PDF. Please check data fields or format.' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Interactive Filter Panel */}
        <div className="w-full md:w-[350px] bg-gray-50/55 border-b md:border-b-0 md:border-r border-gray-100 p-6 flex flex-col justify-between overflow-y-auto gap-6 shrink-0">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-serif font-bold text-gray-800">Cetak Laporan PDF</h3>
                <p className="text-xs text-gray-400 font-medium">Export transaksi dalam berkas PDF berkualitas tinggi</p>
              </div>
              <button 
                onClick={onClose} 
                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors md:hidden"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selection tab */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-[#b68c5b]">Periode Laporan</label>
              <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-2xl">
                {(['daily', 'weekly', 'monthly', 'yearly', 'custom'] as ReportPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p);
                    }}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all text-center ${
                      period === p 
                        ? 'bg-[#b68c5b] text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-250/20'
                    }`}
                  >
                    {p === 'daily' ? 'Harian' : p === 'weekly' ? 'Mingguan' : p === 'monthly' ? 'Bulanan' : p === 'yearly' ? 'Tahunan' : 'Rentang'}
                  </button>
                ))}
              </div>
            </div>

            {/* Date picking logic */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Calendar size={13} className="text-[#b68c5b]" /> Tentukan Parameter
              </span>

              {period === 'daily' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Pilih Tanggal</label>
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#b68c5b]"
                  />
                </div>
              )}

              {period === 'weekly' && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Pilih Tanggal dalam Minggu Tujuan</label>
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#b68c5b]"
                    />
                  </div>
                  <div className="text-[10px] text-gray-400 italic">
                    Sistem akan menyaring transaksi sepanjang satu minggu penuh (Senin s/d Minggu) berdasarkan tanggal yang Anda pilih.
                  </div>
                </div>
              )}

              {period === 'monthly' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Pilih Bulan dan Tahun</label>
                  <input 
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#b68c5b]"
                  />
                </div>
              )}

              {period === 'yearly' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Pilih Tahun</label>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#b68c5b]"
                  >
                    {Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 3 + i).toString()).map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              )}

              {period === 'custom' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Dari Tanggal</label>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#b68c5b]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Sampai Tanggal</label>
                    <input 
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-[#b68c5b]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={generatePDF}
            className="w-full h-12 bg-[#b68c5b] hover:bg-[#b68c5b]/90 text-white rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-md active:scale-95 text-sm"
          >
            <Download size={16} /> Unduh Laporan PDF
          </button>
        </div>

        {/* Right Preview Panel (High-fidelity A4-alike paper design) */}
        <div className="flex-1 bg-gray-100 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <FileText size={14} /> LIVE PREVIEW LAPORAN
            </span>
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors hidden md:flex"
            >
              <X size={20} />
            </button>
          </div>

          {/* Letter style preview page */}
          <div className="flex-1 max-w-[550px] w-full min-h-[480px] bg-white border border-gray-200 shadow-xl rounded-2xl mx-auto p-6 md:p-8 flex flex-col justify-between font-sans text-gray-800 text-xs">
            
            <div className="space-y-5">
              {/* Gold border top */}
              <div className="h-1 bg-[#b68c5b] w-full rounded-full" />

              {/* Branding/Header lines */}
              <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                <div>
                  <h4 className="text-sm font-black text-gray-800 tracking-wider">JEWELTRACK</h4>
                  <p className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide">Official Reconciliation Doc</p>
                </div>
                <div className="text-right">
                  <span className="bg-[#b68c5b]/10 text-[#b68c5b] px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide">
                    {period} Report
                  </span>
                  <p className="text-[9px] text-gray-400 mt-1">{format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
                </div>
              </div>

              {/* Meta information row */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100 text-[10px]">
                <div>
                  <span className="text-gray-400 font-medium block">PERIODE</span>
                  <span className="font-bold text-gray-700 uppercase tracking-wide">{rangeLabel}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">OLEH KARYAWAN</span>
                  <span className="font-bold text-gray-700 uppercase">{currentUser?.name || 'Karyawan'}</span>
                </div>
              </div>

              {/* Big Financial metrics */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">KILAS BALIK REKONSILIASI KAS</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                    <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-wide block">Debit (Masuk)</span>
                    <span className="text-xs font-bold text-emerald-800 block mt-1">
                      <Rupiah value={filteredData.stats.cashIn} classNameRp="text-[0.8em] opacity-70 font-normal" />
                    </span>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-3 border border-rose-100 text-center">
                    <span className="text-[9px] text-rose-600 font-extrabold uppercase tracking-wide block">Kredit (Keluar)</span>
                    <span className="text-xs font-bold text-rose-800 block mt-1">
                      <Rupiah value={filteredData.stats.cashOut} classNameRp="text-[0.8em] opacity-70 font-normal" />
                    </span>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 border border-[#b68c5b]/20 text-center">
                    <span className="text-[9px] text-[#b68c5b] font-extrabold uppercase tracking-wide block">Bersih (Net)</span>
                    <span className="text-xs font-bold text-amber-80 block mt-1">
                      <Rupiah value={filteredData.stats.netCash} classNameRp="text-[0.8em] opacity-70 font-normal" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Tiny Overview of Grams */}
              <div className="bg-gray-50 p-2.5 rounded-xl text-[10px] flex justify-between items-center px-4 text-gray-500 border border-gray-100">
                <span>Gramasi Logam Mulia Masuk: <strong>{filteredData.stats.gramIn.toFixed(2)}g</strong></span>
                <span className="text-gray-200">|</span>
                <span>Gramasi Logam Mulia Keluar: <strong>{filteredData.stats.gramOut.toFixed(2)}g</strong></span>
              </div>

              {/* Transactions list Table Preview */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 ml-1">
                  TRANSAKSI DIKERJAKAN ({filteredData.trxs.length})
                </span>
                <div className="max-h-[140px] overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100 bg-white">
                  {filteredData.trxs.length > 0 ? (
                    filteredData.trxs.map((t, idx) => (
                      <div key={t.id || idx} className="p-2.5 text-[10px] flex justify-between items-center hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-300">{(idx + 1).toString().padStart(2, '0')}</span>
                          <div>
                            <div className="font-bold text-gray-700 capitalize flex items-center gap-1">
                              {t.type === 'sell' && <ArrowUpRight size={12} className="text-emerald-500" />}
                              {t.type === 'buyback' && <ArrowDownRight size={12} className="text-rose-500" />}
                              {t.type === 'trade_in' && <RefreshCw size={12} className="text-[#b68c5b]" />}
                              {t.type}
                              <span className="text-[8px] font-medium text-gray-400 font-sans ml-1">({t.customerName || 'Walk-in'})</span>
                            </div>
                            <span className="text-[9px] text-gray-400">{t.qty || 1} item &bull; {t.gram || 0}g</span>
                          </div>
                        </div>
                        <span className="font-bold text-[#b68c5b] text-right font-serif">
                          {t.type === 'trade_in' ? (
                            (t.price - t.sellPrice) >= 0 ? (
                              <span>+ <Rupiah value={t.price - t.sellPrice} classNameRp="text-[0.8em] opacity-70 font-normal" /></span>
                            ) : (
                              <span>- <Rupiah value={Math.abs(t.price - t.sellPrice)} classNameRp="text-[0.8em] opacity-70 font-normal" /></span>
                            )
                          ) : (
                            <Rupiah value={t.price || 0} classNameRp="text-[0.8em] opacity-70 font-normal" />
                          )}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-300 text-[11px] italic font-medium">
                      Tidak ada transaksi di rentang tanggal terpilih.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom certification lines */}
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-[9px] text-gray-400 italic">
              <span>Sertifikasi JewelTrack &bull; Page 1 of 1</span>
              <span>Dicetak Secara Aman</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
