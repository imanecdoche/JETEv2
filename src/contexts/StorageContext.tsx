import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, getDoc, writeBatch, setDoc, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isFirebasePlaceholder } from '../firebase';
import { useApp } from './AppContext';

type StorageMode = 'local' | 'firestore';

interface StorageContextType {
  mode: StorageMode;
  setModeWithSync: (mode: StorageMode, syncLocalData?: boolean) => Promise<void>;
  transactions: any[];
  transactionSummaries: any[];
  lmTransactions: any[];
  loading: boolean;
  addTransaction: (data: any) => Promise<void>;
  addLmTransaction: (data: any) => Promise<string | undefined>;
  addPastDataSummary: (data: any) => Promise<void>;
  updateTransaction: (id: string, data: any) => Promise<void>;
  updateLmTransaction: (id: string, data: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteLmTransaction: (id: string) => Promise<void>;
  getTransaction: (id: string) => Promise<any>;
  getLmTransaction: (id: string) => Promise<any>;
  bulkImport: (data: { transactions?: any[], summaries?: any[], lmTransactions?: any[] }) => Promise<void>;
  appTargets: { daily: number; weekly: number; monthly: number };
  updateAppTargets: (targets: { daily: number; weekly: number; monthly: number }) => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser } = useApp();
  const [mode, setMode] = useState<StorageMode>(() => {
    return (localStorage.getItem('jeweltrack_storage_mode') as StorageMode) || 'local';
  });
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionSummaries, setTransactionSummaries] = useState<any[]>([]);
  const [lmTransactions, setLmTransactions] = useState<any[]>([]);
  const [appTargets, setAppTargets] = useState<{ daily: number; weekly: number; monthly: number }>({
    daily: 13.33,
    weekly: 100,
    monthly: 400
  });
  const [loading, setLoading] = useState(true);

  // Synchronize storage mode with firebase connection state
  useEffect(() => {
    if (firebaseUser) {
      setMode('firestore');
      localStorage.setItem('jeweltrack_storage_mode', 'firestore');
    } else {
      setMode('local');
      localStorage.setItem('jeweltrack_storage_mode', 'local');
    }
  }, [firebaseUser]);

  // Load data based on mode and user
  useEffect(() => {
    if (isFirebasePlaceholder || mode === 'local') {
      setLoading(true);
      const loadLocal = () => {
        const localTrxs = JSON.parse(localStorage.getItem('jeweltrack_local_transactions') || '[]');
        const localSums = JSON.parse(localStorage.getItem('jeweltrack_local_transaction_summaries') || '[]');
        const localLms = JSON.parse(localStorage.getItem('jeweltrack_local_lm_transactions') || '[]');
        const localTargets = JSON.parse(localStorage.getItem('jeweltrack_local_targets') || 'null');
        setTransactions(localTrxs);
        setTransactionSummaries(localSums);
        setLmTransactions(localLms);
        if (localTargets) setAppTargets(localTargets);
        setLoading(false);
      };
      
      loadLocal();
      window.addEventListener('storage', loadLocal);
      return () => window.removeEventListener('storage', loadLocal);
    }

    if (mode === 'firestore' && !firebaseUser) {
      setLoading(false);
      setTransactions([]);
      setTransactionSummaries([]);
      setLmTransactions([]);
      return;
    }

    setLoading(true);
    if (firebaseUser) {
      let unsubscribeTrx: (() => void) | undefined;
      let unsubscribeSums: (() => void) | undefined;
      let unsubscribeLms: (() => void) | undefined;
      let unsubscribeTargets: (() => void) | undefined;
 
      // Mandatory connection test
      const testConnection = async () => {
        try {
          const { getDocFromServer } = await import('firebase/firestore');
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }
      };
      testConnection();
 
      try {
        const uid = firebaseUser.uid;
        
        // Query transactions owned by user
        const qTrx = query(collection(db, 'transactions'), where('ownerId', '==', uid));
        unsubscribeTrx = onSnapshot(qTrx, (snapshot) => {
          const trxs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTransactions(trxs);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'transactions'));
        
        // Query summaries owned by user
        const qSums = query(collection(db, 'transaction_summaries'), where('ownerId', '==', uid));
        unsubscribeSums = onSnapshot(qSums, (snapshot) => {
          const sums = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTransactionSummaries(sums);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'transaction_summaries'));
 
        // Query lm transactions owned by user
        const qLms = query(collection(db, 'lm_transactions'), where('ownerId', '==', uid));
        unsubscribeLms = onSnapshot(qLms, (snapshot) => {
          const lms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setLmTransactions(lms);
        }, (err) => handleFirestoreError(err, OperationType.GET, 'lm_transactions'));
 
        // Query targets for user
        unsubscribeTargets = onSnapshot(doc(db, 'settings', `app_targets_${uid}`), (snap) => {
          if (snap.exists()) {
            setAppTargets(snap.data() as any);
          }
          setLoading(false);
        }, (err) => handleFirestoreError(err, OperationType.GET, `settings/app_targets_${uid}`));
 
        return () => {
          if (unsubscribeTrx) unsubscribeTrx();
          if (unsubscribeSums) unsubscribeSums();
          if (unsubscribeLms) unsubscribeLms();
          if (unsubscribeTargets) unsubscribeTargets();
        };
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
  }, [mode, firebaseUser]);

  const saveLocalTrxs = (trxs: any[]) => {
    localStorage.setItem('jeweltrack_local_transactions', JSON.stringify(trxs));
    setTransactions(trxs);
  };

  const saveLocalTransactionSummaries = (sums: any[]) => {
    localStorage.setItem('jeweltrack_local_transaction_summaries', JSON.stringify(sums));
    setTransactionSummaries(sums);
  };

  const saveLocalLms = (lms: any[]) => {
    localStorage.setItem('jeweltrack_local_lm_transactions', JSON.stringify(lms));
    setLmTransactions(lms);
  };

  const setModeWithSync = async (newMode: StorageMode, syncLocalData: boolean = false) => {
    if (isFirebasePlaceholder && newMode === 'firestore') {
      alert('Cloud Sync is currently unavailable because Firebase is not configured. Please use Continue Offline.');
      return;
    }

    if (!firebaseUser && newMode === 'firestore') {
      alert('Please login first to use Cloud Sync.');
      return;
    }

    setLoading(true);
    if (newMode === 'firestore' && syncLocalData && firebaseUser) {
      const uid = firebaseUser.uid;
      const localTrxs = JSON.parse(localStorage.getItem('jeweltrack_local_transactions') || '[]');
      const localSums = JSON.parse(localStorage.getItem('jeweltrack_local_transaction_summaries') || '[]');
      const localLms = JSON.parse(localStorage.getItem('jeweltrack_local_lm_transactions') || '[]');
      const localTargets = JSON.parse(localStorage.getItem('jeweltrack_local_targets') || 'null');
      
      const batch = writeBatch(db);

      localTrxs.forEach((trx: any) => {
        const { id, ...data } = trx;
        const ref = doc(collection(db, 'transactions'));
        batch.set(ref, { ...data, ownerId: uid });
      });
      
      localSums.forEach((sum: any) => {
        const { id, ...data } = sum;
        const ref = doc(collection(db, 'transaction_summaries'));
        batch.set(ref, { ...data, ownerId: uid });
      });
      
      localLms.forEach((lm: any) => {
        const { id, ...data } = lm;
        const ref = doc(collection(db, 'lm_transactions'));
        batch.set(ref, { ...data, ownerId: uid });
      });

      if (localTargets) {
        const targetRef = doc(db, 'settings', `app_targets_${uid}`);
        batch.set(targetRef, { ...localTargets, ownerId: uid });
      }
      
      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'batch-sync');
      }

      localStorage.removeItem('jeweltrack_local_transactions');
      localStorage.removeItem('jeweltrack_local_transaction_summaries');
      localStorage.removeItem('jeweltrack_local_lm_transactions');
      localStorage.setItem('jeweltrack_storage_mode', newMode);
      window.location.reload();
    } else {
      localStorage.setItem('jeweltrack_storage_mode', newMode);
      window.location.reload();
    }
  };

  const addTransaction = async (data: any) => {
    if (mode === 'local') {
      const trxs = [...transactions, { id: crypto.randomUUID(), ...data, timestamp: Date.now() }];
      saveLocalTrxs(trxs);
    } else if (firebaseUser) {
      try {
        await addDoc(collection(db, 'transactions'), { ...data, ownerId: firebaseUser.uid, timestamp: Date.now() });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'transactions');
      }
    }
  };

  const addPastDataSummary = async (data: any) => {
    if (mode === 'local') {
      const sums = [...transactionSummaries, { id: crypto.randomUUID(), ...data }];
      saveLocalTransactionSummaries(sums);
    } else if (firebaseUser) {
      try {
        await addDoc(collection(db, 'transaction_summaries'), { ...data, ownerId: firebaseUser.uid });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'transaction_summaries');
      }
    }
  };

  const updateTransaction = async (id: string, data: any) => {
    if (mode === 'local') {
      const trxs = transactions.map(t => t.id === id ? { ...t, ...data } : t);
      saveLocalTrxs(trxs);
    } else {
      try {
        await updateDoc(doc(db, 'transactions', id), data);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `transactions/${id}`);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    if (mode === 'local') {
      const trxs = transactions.filter(t => t.id !== id);
      saveLocalTrxs(trxs);
    } else {
      try {
        await deleteDoc(doc(db, 'transactions', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `transactions/${id}`);
      }
    }
  };

  const addLmTransaction = async (data: any): Promise<string | undefined> => {
    if (mode === 'local') {
      const newId = crypto.randomUUID();
      const lms = [...lmTransactions, { id: newId, ...data, timestamp: Date.now() }];
      saveLocalLms(lms);
      return newId;
    } else if (firebaseUser) {
      try {
        const docRef = await addDoc(collection(db, 'lm_transactions'), { ...data, ownerId: firebaseUser.uid, timestamp: Date.now() });
        return docRef.id;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'lm_transactions');
      }
    }
  };

  const updateLmTransaction = async (id: string, data: any) => {
    if (mode === 'local') {
      const lms = lmTransactions.map(t => t.id === id ? { ...t, ...data } : t);
      saveLocalLms(lms);
    } else {
      try {
        await updateDoc(doc(db, 'lm_transactions', id), data);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `lm_transactions/${id}`);
      }
    }
  };

  const deleteLmTransaction = async (id: string) => {
    if (mode === 'local') {
      const lms = lmTransactions.filter(t => t.id !== id);
      saveLocalLms(lms);
    } else {
      try {
        await deleteDoc(doc(db, 'lm_transactions', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `lm_transactions/${id}`);
      }
    }
  };

  const getTransaction = async (id: string) => {
    if (mode === 'local') {
      return transactions.find(t => t.id === id) || null;
    } else {
      try {
        const snap = await getDoc(doc(db, 'transactions', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `transactions/${id}`);
      }
    }
  };

  const getLmTransaction = async (id: string) => {
    if (mode === 'local') {
      return lmTransactions.find(t => t.id === id) || null;
    } else {
      try {
        const snap = await getDoc(doc(db, 'lm_transactions', id));
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `lm_transactions/${id}`);
      }
    }
  };

  const bulkImport = async (importData: { transactions?: any[], summaries?: any[], lmTransactions?: any[] }) => {
    setLoading(true);
    try {
      if (mode === 'local') {
        if (importData.transactions) {
          const currentTrxs = JSON.parse(localStorage.getItem('jeweltrack_local_transactions') || '[]');
          const merged = [...currentTrxs, ...importData.transactions.map(t => ({ ...t, id: t.id || crypto.randomUUID() }))];
          saveLocalTrxs(merged);
        }
        if (importData.summaries) {
          const currentSums = JSON.parse(localStorage.getItem('jeweltrack_local_transaction_summaries') || '[]');
          const merged = [...currentSums, ...importData.summaries.map(s => ({ ...s, id: s.id || crypto.randomUUID() }))];
          saveLocalTransactionSummaries(merged);
        }
        if (importData.lmTransactions) {
          const currentLms = JSON.parse(localStorage.getItem('jeweltrack_local_lm_transactions') || '[]');
          const merged = [...currentLms, ...importData.lmTransactions.map(l => ({ ...l, id: l.id || crypto.randomUUID() }))];
          saveLocalLms(merged);
        }
      } else if (firebaseUser) {
        const uid = firebaseUser.uid;
        const batch = writeBatch(db);
        
        if (importData.transactions) {
          importData.transactions.forEach(t => {
            const { id, ...data } = t;
            const ref = id ? doc(collection(db, 'transactions'), id) : doc(collection(db, 'transactions'));
            batch.set(ref, { ...data, ownerId: uid }, { merge: true });
          });
        }
        
        if (importData.summaries) {
          importData.summaries.forEach(s => {
            const { id, ...data } = s;
            const ref = id ? doc(collection(db, 'transaction_summaries'), id) : doc(collection(db, 'transaction_summaries'));
            batch.set(ref, { ...data, ownerId: uid }, { merge: true });
          });
        }

        if (importData.lmTransactions) {
          importData.lmTransactions.forEach(l => {
            const { id, ...data } = l;
            const ref = id ? doc(collection(db, 'lm_transactions'), id) : doc(collection(db, 'lm_transactions'));
            batch.set(ref, { ...data, ownerId: uid }, { merge: true });
          });
        }
        
        try {
          await batch.commit();
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'bulk-import');
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateAppTargets = async (targets: { daily: number; weekly: number; monthly: number }) => {
    localStorage.setItem('jeweltrack_local_targets', JSON.stringify(targets));
    setAppTargets(targets);
    
    if (firebaseUser) {
      const uid = firebaseUser.uid;
      try {
        await setDoc(doc(db, 'settings', `app_targets_${uid}`), { ...targets, ownerId: uid }, { merge: true });
        
        // Also save on user profile document directly
        await setDoc(doc(db, 'users', uid), { targets }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `settings/app_targets_${uid}`);
      }
    }
  };

  return (
    <StorageContext.Provider value={{
      mode, setModeWithSync, transactions, transactionSummaries, lmTransactions, loading,
      addTransaction, addPastDataSummary, updateTransaction, deleteTransaction,
      addLmTransaction, updateLmTransaction, deleteLmTransaction,
      getTransaction, getLmTransaction, bulkImport,
      appTargets, updateAppTargets
    }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used inside StorageProvider');
  return ctx;
}
