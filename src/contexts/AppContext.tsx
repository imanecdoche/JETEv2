import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, isFirebasePlaceholder } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';

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
        // We still keep the employee profile logic but link it to the firebase user
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
    const checkLandscape = () => {
      setIsClientLandscape(window.innerWidth > window.innerHeight || window.innerWidth >= 768);
    };
    checkLandscape();
    window.addEventListener('resize', checkLandscape);
    return () => window.removeEventListener('resize', checkLandscape);
  }, []);

  const handleSetUser = (user: Employee | null) => {
    setCurrentUser(user);
    if (user) {
      if (firebaseUser) {
        localStorage.setItem(`jeweltrack_user_${firebaseUser.uid}`, JSON.stringify(user));
      } else {
        localStorage.setItem('jeweltrack_local_user', JSON.stringify(user));
      }
    } else {
      localStorage.removeItem('jeweltrack_local_user');
    }
  };

  const logout = async () => {
    if (!isFirebasePlaceholder) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Firebase logout omitted or unavailable:', e);
      }
    }
    setCurrentUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('jeweltrack_local_user');
  };

  const handleSetAdaptMode = (mode: AdaptMode) => {
    localStorage.setItem('jeweltrack_adapt_mode', mode);
    setAdaptModeState(mode);
  };

  const isLandscapeLayout = adaptMode === 'landscape' ? true : (adaptMode === 'portrait' ? false : isClientLandscape);

  return (
    <AppContext.Provider value={{ 
      currentUser, setCurrentUser: handleSetUser, firebaseUser, isReady, 
      adaptMode, setAdaptMode: handleSetAdaptMode, isLandscapeLayout,
      logout
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
