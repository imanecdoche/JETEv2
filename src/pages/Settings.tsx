import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStorage } from '../contexts/StorageContext';
import { useDialog } from '../contexts/DialogContext';
import { User, LogOut, ShieldCheck, ShieldAlert, Plus, X, MonitorSmartphone, Database, Cloud, Tablet, Smartphone, Download, Upload, Trash2, Key, Target, AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDaysInMonth } from 'date-fns';

export default function Settings() {
  const { currentUser, setCurrentUser, adaptMode, setAdaptMode, logout, firebaseUser } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const { mode, setModeWithSync, loading, transactions, transactionSummaries, lmTransactions, bulkImport, appTargets, updateAppTargets } = useStorage();
  const { confirm } = useDialog();
  const navigate = useNavigate();
  const [isImporting, setIsImporting] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [tempTargets, setTempTargets] = useState(appTargets);
  const [targetError, setTargetError] = useState<string | null>(null);

  const handleUpdateTargets = async () => {
    const { daily, weekly, monthly } = tempTargets;
    
    if (parseFloat(daily as any) >= parseFloat(weekly as any)) {
      setTargetError('Daily target cannot be greater than weekly');
      return;
    }
    if (parseFloat(weekly as any) >= parseFloat(monthly as any)) {
      setTargetError('Weekly target cannot be greater than monthly');
      return;
    }
    
    setTargetError(null);
    try {
      await updateAppTargets({
        daily: parseFloat(daily as any),
        weekly: parseFloat(weekly as any),
        monthly: parseFloat(monthly as any)
      });
      alert('Targets updated successfully!');
    } catch (error) {
      console.error(error);
    }
  };

  const resetToDefault = () => {
    const monthly = 400;
    const weekly = monthly / 4;
    const days = getDaysInMonth(new Date());
    const daily = parseFloat((monthly / days).toFixed(2));
    
    setTempTargets({ daily, weekly, monthly });
    setTargetError(null);
  };

  const checkAdmin = (val: string) => {
    setAdminId(val);
    if (val === 'bj2026') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      message: t('switchAccount'),
      confirmText: 'Logout',
    });
    if (isConfirmed) {
      await logout();
      navigate('/');
    }
  };

  const handleToggleStorage = async (newMode: 'local' | 'firestore') => {
    if (mode === newMode) return;

    if (newMode === 'firestore') {
      const localTrxs = JSON.parse(localStorage.getItem('jeweltrack_local_transactions') || '[]');
      if (localTrxs.length > 0) {
        const syncConfirmed = await confirm({
          message: t('syncPrompt'),
          confirmText: 'Sync to Cloud'
        });
        if (syncConfirmed) {
          await setModeWithSync('firestore', true);
        } else {
          const deleteConfirmed = await confirm({
            message: t('deleteLocalPrompt'),
            confirmText: 'Switch Anyway'
          });
          if (deleteConfirmed) {
            await setModeWithSync('firestore', false);
          }
        }
      } else {
        await setModeWithSync('firestore', false);
      }
    } else {
      await setModeWithSync('local');
    }
  };

  const handleExport = () => {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      mode,
      transactions,
      summaries: transactionSummaries,
      lmTransactions
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jeweltrack_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);
          
          if (!data.transactions && !data.summaries && !data.lmTransactions) {
            throw new Error('Invalid backup file');
          }

          const isConfirmed = await confirm({
            message: `Importing data will merge the file contents with your current ${mode} storage. Continue?`,
            confirmText: 'Import Now'
          });

          if (isConfirmed) {
            await bulkImport({
              transactions: data.transactions,
              summaries: data.summaries,
              lmTransactions: data.lmTransactions
            });
            alert('Import successful!');
          }
        } catch (err) {
          console.error(err);
          alert('Import failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
          setIsImporting(false);
          // reset input
          e.target.value = '';
        }
      };
      reader.readAsText(file);
    } catch (err) {
      console.error(err);
      setIsImporting(false);
    }
  };

  const languages = [
    { code: 'id', name: '🇮🇩 Indonesia' },
    { code: 'en', name: '🇺🇸 English' },
    { code: 'es', name: '🇪🇸 Español' },
    { code: 'zh', name: '🇨🇳 Mandarin' },
    { code: 'tl', name: '🇵🇭 Tagalog' },
  ];

  if (loading) {
    return <div className="p-12 text-center text-gray-400 font-serif">{t('loading')}</div>;
  }

  return (
    <div className="px-4 py-6 md:p-6 min-h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-serif text-gray-800 tracking-tight">{t('settings')}</h1>
        <p className="text-sm text-gray-500 font-medium">{t('manageEmployees')}</p>
      </header>

      <div className="space-y-6 pb-20">
        <section>
          <div className="flex items-center justify-between mb-4 ml-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Sales Targets (Gram)</h2>
            <button 
              onClick={resetToDefault}
              className="text-[10px] font-bold text-[#b68c5b] uppercase tracking-wider flex items-center gap-1 bg-[#b68c5b]/5 px-2 py-1 rounded-lg"
            >
              <RefreshCw size={10} /> Reset Default
            </button>
          </div>
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 ml-1">Monthly</label>
                <input 
                  type="number" 
                  value={tempTargets.monthly}
                  onChange={e => setTempTargets({...tempTargets, monthly: parseFloat(e.target.value) || 0})}
                  className="w-full bg-gray-50 border-none rounded-xl px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 ml-1">Weekly</label>
                <input 
                  type="number" 
                  value={tempTargets.weekly}
                  onChange={e => setTempTargets({...tempTargets, weekly: parseFloat(e.target.value) || 0})}
                  className="w-full bg-gray-50 border-none rounded-xl px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 ml-1">Daily</label>
                <input 
                  type="number" 
                  value={tempTargets.daily}
                  step="0.01"
                  onChange={e => setTempTargets({...tempTargets, daily: parseFloat(e.target.value) || 0})}
                  className="w-full bg-gray-50 border-none rounded-xl px-3 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                />
              </div>
            </div>

            {targetError && (
              <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl text-xs font-medium animate-in fade-in zoom-in duration-200">
                <AlertTriangle size={14} />
                {targetError}
              </div>
            )}

            <button 
              onClick={handleUpdateTargets}
              className="w-full bg-[#b68c5b] text-white py-3 rounded-xl text-sm font-bold shadow-md hover:bg-[#a07b4f] transition-colors"
            >
              Update Targets
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">Admin Access</h2>
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isAdmin ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                {isAdmin ? <ShieldCheck size={24} /> : <Key size={24} />}
              </div>
              <div className="flex-1">
                <input 
                  type="password"
                  placeholder="Enter Admin ID"
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#b68c5b]/20"
                  value={adminId}
                  onChange={(e) => checkAdmin(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1 ml-1 uppercase tracking-wider font-bold">
                  {isAdmin ? 'Admin Mode Activated' : 'Enter ID to unlock admin features'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">{t('currentAccount')}</h2>
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#b68c5b]/10 flex items-center justify-center text-[#b68c5b]">
                <User size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{currentUser?.name || firebaseUser?.email || 'User'}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{firebaseUser?.email}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-gray-50"
            >
              <LogOut size={20} />
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">{t('storageMode')}</h2>
          <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex gap-2">
            <button
              onClick={() => handleToggleStorage('local')}
              className={`flex-1 py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                mode === 'local'
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Database size={24} />
              <div className="text-center">
                <p className="text-sm font-bold mb-1">Local</p>
                <p className="text-[10px] font-medium opacity-80 leading-tight">{t('localDesc')}</p>
              </div>
            </button>
            <button
              onClick={() => handleToggleStorage('firestore')}
              className={`flex-1 py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                mode === 'firestore'
                  ? 'bg-[#b68c5b] text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Cloud size={24} />
              <div className="text-center">
                <p className="text-sm font-bold mb-1">Cloud</p>
                <p className="text-[10px] font-medium opacity-80 leading-tight">{t('firestoreDesc')}</p>
              </div>
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">{t('language')}</h2>
          <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as any)}
                className={`flex-1 min-w-[100px] py-3 px-4 rounded-2xl text-sm font-medium transition-all ${
                  language === lang.code 
                    ? 'bg-[#b68c5b] text-white shadow-md scale-105' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">Data Management</h2>
          <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex flex-col gap-2">
            <button
              onClick={() => navigate('/add-past')}
              className="flex items-center gap-4 py-3 px-4 rounded-2xl transition-all bg-gray-50 text-gray-600 hover:bg-gray-100 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#b68c5b]/10 flex items-center justify-center text-[#b68c5b]">
                <Plus size={16} />
              </div>
              <div>
                <span className="text-sm font-bold block mb-0.5">Add Past Data</span>
                <span className="text-[10px] text-gray-500 font-medium">Input historical transaction totals manually</span>
              </div>
            </button>
            
            <button
              onClick={async () => {
                const isConfirmed = await confirm({
                  message: "Upload current local data to Firestore? This will switch your storage mode to Cloud.",
                  confirmText: "Upload & Sync"
                });
                if (isConfirmed) {
                  await setModeWithSync('firestore', true);
                }
              }}
              className="flex items-center gap-4 py-3 px-4 rounded-2xl transition-all bg-gray-50 text-gray-600 hover:bg-gray-100 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Cloud size={16} />
              </div>
              <div>
                <span className="text-sm font-bold block mb-0.5">Update &amp; Sync Data</span>
                <span className="text-[10px] text-gray-500 font-medium">Upload local data to Cloud and switch mode</span>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-3 py-3 px-4 rounded-2xl transition-all bg-gray-50 text-gray-600 hover:bg-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Download size={16} />
                </div>
                <span className="text-sm font-bold">Export JSON</span>
              </button>

              <label className="flex items-center gap-3 py-3 px-4 rounded-2xl transition-all bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <Upload size={16} />
                </div>
                <span className="text-sm font-bold">Import JSON</span>
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleImport}
                  disabled={isImporting}
                />
              </label>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">{t('screenAdaptation')}</h2>
          <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex flex-col gap-2">
            {[
              { id: 'auto', label: 'adaptAuto', icon: MonitorSmartphone },
              { id: 'portrait', label: 'adaptPortrait', icon: Smartphone },
              { id: 'landscape', label: 'adaptLandscape', icon: Tablet }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setAdaptMode(option.id as any)}
                className={`flex items-center gap-4 py-3 px-4 rounded-2xl transition-all ${
                  adaptMode === option.id 
                    ? 'bg-[#b68c5b] text-white shadow-md' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <option.icon size={20} className={adaptMode === option.id ? 'text-white' : 'text-gray-400'} />
                <span className="text-sm font-medium">{t(option.label)}</span>
                {adaptMode === option.id && <div className="ml-auto px-2 py-1 bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">{t('enabled')}</div>}
              </button>
            ))}
          </div>
        </section>

        <section className="pt-4">
          <div className="bg-[#b68c5b]/5 rounded-[24px] p-6 border border-[#b68c5b]/10 text-center">
            <p className="text-xs text-[#b68c5b] font-medium leading-relaxed italic">
              "Excellence is not a skill, it's an attitude. Keep tracking, keep growing."
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
