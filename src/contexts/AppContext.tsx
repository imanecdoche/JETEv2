import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, isFirebasePlaceholder, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface Employee {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  dob?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  identityNo?: string;
  npwp?: string;
  targets?: { daily: number; weekly: number; monthly: number };
  language?: string;
  adaptMode?: string;
  sessionActiveId?: string;
  sessionLastActive?: number;
}

export type AdaptMode = 'auto' | 'portrait' | 'landscape';

interface AppContextType {
  currentUser: Employee | null;
  setCurrentUser: (user: Employee | null) => void;
  firebaseUser: FirebaseUser | null;
  isReady: boolean;
  adaptMode: AdaptMode;
  setAdaptMode: (mode: AdaptMode) => void;
  isLandscapeLayout: boolean;
  logout: () => Promise<void>;
  sessionConflict: 'in_use' | 'kicked_out' | null;
  forceTakeOverSession: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [adaptMode, setAdaptModeState] = useState<AdaptMode>(
    (localStorage.getItem('jeweltrack_adapt_mode') as AdaptMode) || 'auto'
  );
  const [isClientLandscape, setIsClientLandscape] = useState(false);
  const [currentSessionId] = useState(() => {
    let sid = sessionStorage.getItem('jeweltrack_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      sessionStorage.setItem('jeweltrack_session_id', sid);
    }
    return sid;
  });
  const [sessionConflict, setSessionConflict] = useState<'in_use' | 'kicked_out' | null>(null);

  useEffect(() => {
    if (isFirebasePlaceholder) {
      setFirebaseUser(null);
      const localUser = localStorage.getItem('jeweltrack_local_user');
      if (localUser) {
        setCurrentUser(JSON.parse(localUser));
      } else {
        setCurrentUser(null);
      }
      setIsReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // Read fast local fallback
        const stored = localStorage.getItem(`jeweltrack_user_${user.uid}`);
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        } else {
          setCurrentUser({
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            role: 'owner',
            email: user.email || ''
          });
        }
      } else {
        const localUser = localStorage.getItem('jeweltrack_local_user');
        if (localUser) {
          setCurrentUser(JSON.parse(localUser));
        } else {
          setCurrentUser(null);
        }
      }
      setIsReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isFirebasePlaceholder || !firebaseUser) {
      setSessionConflict(null);
      return;
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    let isInitial = true;

    // Initialize profile if missing
    const initializeIfNeeded = async () => {
      try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          const stored = localStorage.getItem(`jeweltrack_user_${firebaseUser.uid}`);
          const currentProfile = stored ? JSON.parse(stored) : {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: 'owner',
            email: firebaseUser.email || '',
            active: true,
            ownerId: firebaseUser.uid
          };
          await setDoc(userDocRef, {
            ...currentProfile,
            id: firebaseUser.uid,
            active: true,
            ownerId: firebaseUser.uid,
            sessionActiveId: currentSessionId,
            sessionLastActive: Date.now()
          });
        }
      } catch (e) {
        console.warn('Profile initialization skipped:', e);
      }
    };

    initializeIfNeeded();

    const unsubscribe = onSnapshot(userDocRef, async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data() as Employee;
      
      // Real-time complete profile & preferences sync
      setCurrentUser(data);
      localStorage.setItem(`jeweltrack_user_${firebaseUser.uid}`, JSON.stringify(data));
      
      if (data.targets) {
        localStorage.setItem('jeweltrack_local_targets', JSON.stringify(data.targets));
      }
      if (data.language) {
        localStorage.setItem('app_language', data.language);
      }
      if (data.adaptMode) {
        localStorage.setItem('jeweltrack_adapt_mode', data.adaptMode);
        setAdaptModeState(data.adaptMode as AdaptMode);
      }

      // Active session checks
      const remoteSessionId = data.sessionActiveId;
      const remoteLastActive = data.sessionLastActive || 0;
      const now = Date.now();

      if (remoteSessionId && remoteSessionId !== currentSessionId) {
        const isRecent = (now - remoteLastActive) < 120000; // 2 minutes active window
        if (isRecent) {
          if (isInitial) {
            setSessionConflict('in_use');
          } else {
            setSessionConflict('kicked_out');
          }
        } else {
          // Stale session, safely take over
          try {
            await setDoc(userDocRef, {
              sessionActiveId: currentSessionId,
              sessionLastActive: Date.now()
            }, { merge: true });
            setSessionConflict(null);
          } catch (e) {
            console.warn('Take over stale session omitted:', e);
          }
        }
      } else {
        setSessionConflict(null);
        if (!remoteSessionId) {
          try {
            await setDoc(userDocRef, {
              sessionActiveId: currentSessionId,
              sessionLastActive: Date.now()
            }, { merge: true });
          } catch (e) {
            console.warn('Set session active omitted:', e);
          }
        }
      }
      isInitial = false;
    }, (error) => {
      console.warn('Realtime session synchronization warning:', error);
    });

    const pingInterval = setInterval(async () => {
      if (sessionConflict) return;
      try {
        await setDoc(userDocRef, {
          sessionLastActive: Date.now(),
          sessionActiveId: currentSessionId
        }, { merge: true });
      } catch (e) {
        console.warn('Session ping error in background:', e);
      }
    }, 45000);

    return () => {
      unsubscribe();
      clearInterval(pingInterval);
    };
  }, [firebaseUser, currentSessionId, sessionConflict]);

  useEffect(() => {
    const checkLandscape = () => {
      setIsClientLandscape(window.innerWidth > window.innerHeight || window.innerWidth >= 768);
    };
    checkLandscape();
    window.addEventListener('resize', checkLandscape);
    return () => window.removeEventListener('resize', checkLandscape);
  }, []);

  const handleSetUser = async (user: Employee | null) => {
    setCurrentUser(user);
    if (user) {
      if (firebaseUser) {
        localStorage.setItem(`jeweltrack_user_${firebaseUser.uid}`, JSON.stringify(user));
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userDocRef, {
            ...user,
            id: firebaseUser.uid,
            active: true,
            ownerId: firebaseUser.uid
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }
      } else {
        localStorage.setItem('jeweltrack_local_user', JSON.stringify(user));
      }
    } else {
      localStorage.removeItem('jeweltrack_local_user');
    }
  };

  const logout = async () => {
    if (!isFirebasePlaceholder && firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, {
          sessionActiveId: '',
          sessionLastActive: 0
        }, { merge: true });
        await signOut(auth);
      } catch (e) {
        console.warn('Firebase logout session clear omitted or failed:', e);
        try {
          await signOut(auth);
        } catch (_) {}
      }
    }
    setCurrentUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('jeweltrack_local_user');
    setSessionConflict(null);
  };

  const forceTakeOverSession = async () => {
    if (!firebaseUser) return;
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        sessionActiveId: currentSessionId,
        sessionLastActive: Date.now()
      }, { merge: true });
      setSessionConflict(null);
    } catch (e) {
      console.warn('Force take over session failed:', e);
    }
  };

  const handleSetAdaptMode = async (mode: AdaptMode) => {
    localStorage.setItem('jeweltrack_adapt_mode', mode);
    setAdaptModeState(mode);
    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, { adaptMode: mode }, { merge: true });
      } catch (e) {
        console.warn('AdaptMode cloud sync omitted or pending:', e);
      }
    }
  };

  const isLandscapeLayout = adaptMode === 'landscape' ? true : (adaptMode === 'portrait' ? false : isClientLandscape);

  return (
    <AppContext.Provider value={{ 
      currentUser, setCurrentUser: handleSetUser, firebaseUser, isReady, 
      adaptMode, setAdaptMode: handleSetAdaptMode, isLandscapeLayout,
      logout, sessionConflict, forceTakeOverSession
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
