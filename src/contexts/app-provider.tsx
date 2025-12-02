'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { useAuth, useFirestore, useUser as useFirebaseAuthUser } from '@/firebase';
import type { User, Role, Zone, BlockedDay, PasswordResetRequest, AppNotification } from '@/lib/types';
import { ROLES, ZONES } from '@/lib/types';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

interface AppContextType {
  // Auth State
  user: User | null;
  isUserLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;

  operatorName: string | null;
  zone: Zone;
  isZoneConfirmed: boolean;
  formsEnabled: boolean;
  weekendsEnabled: boolean;
  blockedDays: Record<string, BlockedDay>;
  passwordRequests: PasswordResetRequest[];
  notifications: AppNotification[];
  devModeEnabled: boolean;
  
  // Settings
  setZone: (zone: Zone) => void;
  confirmZone: (zone: Zone) => void;
  toggleForms: () => void;
  toggleWeekends: () => void;
  addBlockedDay: (date: string, reason: string) => void;
  removeBlockedDay: (date: string) => void;
  addPasswordRequest: (request: Omit<PasswordResetRequest, 'id' | 'date'>) => void;
  resolvePasswordRequest: (id: string) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  toggleDevMode: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [zone, setZone] = useState<Zone>(ZONES[0]);
  const [isZoneConfirmed, setIsZoneConfirmed] = useState(false);
  const [formsEnabled, setFormsEnabled] = useState(true);
  const [weekendsEnabled, setWeekendsEnabled] = useState(false);
  const [passwordRequests, setPasswordRequests] = useState<PasswordResetRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  
  const [blockedDays, setBlockedDays] = useState<Record<string, BlockedDay>>({
      "2024-09-16": { reason: "Día de la Independencia" },
      "2024-11-18": { reason: "Revolución Mexicana" },
  });

  const auth = useAuth();
  const firestore = useFirestore();
  const { user: firebaseUser, loading: isUserLoading } = useFirebaseAuthUser();

  useEffect(() => {
    const fetchUserProfile = async (uid: string) => {
        if (!firestore) return;
        const userDocRef = doc(firestore, "users", uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userProfile = userDoc.data() as User;
            setUser(userProfile);
            setOperatorName(userProfile.name);
        } else {
            console.error("No user profile found in Firestore for UID:", uid);
            setUser(null);
            await signOut(auth);
        }
    };

    if (firebaseUser) {
        fetchUserProfile(firebaseUser.uid);
    } else {
        setUser(null);
        setOperatorName(null);
        setIsZoneConfirmed(false);
    }
  }, [firebaseUser, firestore, auth]);
  

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    if (!auth || !firestore) throw new Error("Firebase services not available.");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const authedUser = userCredential.user;
    
    const userDocRef = doc(firestore, 'users', authedUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        const userProfile = userDoc.data() as User;
        setUser(userProfile);
        setOperatorName(userProfile.name);
        return userProfile;
    } else {
        await signOut(auth);
        throw new Error("User profile does not exist in Firestore.");
    }
  }, [auth, firestore]);

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setOperatorName(null);
    setIsZoneConfirmed(false);
  }, [auth]);

  const confirmZone = useCallback((newZone: Zone) => {
    setZone(newZone);
    setIsZoneConfirmed(true);
  }, []);

  const toggleForms = useCallback(() => setFormsEnabled(prev => !prev), []);
  const toggleWeekends = useCallback(() => setWeekendsEnabled(prev => !prev), []);
  const toggleDevMode = useCallback(() => setDevModeEnabled(prev => !prev), []);

  const addBlockedDay = useCallback((date: string, reason: string) => {
    setBlockedDays(prev => ({ ...prev, [date]: { reason } }));
  }, []);

  const removeBlockedDay = useCallback((date: string) => {
    setBlockedDays(prev => {
        const newBlockedDays = { ...prev };
        delete newBlockedDays[date];
        return newBlockedDays;
    });
  }, []);

  const addPasswordRequest = useCallback((request: Omit<PasswordResetRequest, 'id' | 'date'>) => {
    const newRequest: PasswordResetRequest = {
        ...request,
        id: `req-${Date.now()}`,
        date: new Date(),
    };
    setPasswordRequests(prev => [newRequest, ...prev]);
  }, []);

  const resolvePasswordRequest = useCallback((id: string) => {
      setPasswordRequests(prev => prev.filter(req => req.id !== id));
  }, []);

  const addNotification = useCallback((notificationData: Omit<AppNotification, 'id' | 'date' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notificationData,
      id: `notif-${Date.now()}-${Math.random()}`,
      date: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      isUserLoading,
      login,
      logout,
      operatorName,
      zone,
      setZone,
      isZoneConfirmed,
      formsEnabled,
      weekendsEnabled,
      blockedDays,
      passwordRequests,
      notifications,
      devModeEnabled,
      confirmZone,
      toggleForms,
      toggleWeekends,
      toggleDevMode,
      addBlockedDay,
      removeBlockedDay,
      addPasswordRequest,
      resolvePasswordRequest,
      addNotification,
      markNotificationAsRead,
    }),
    [
      user, isUserLoading, login, logout, operatorName, zone, isZoneConfirmed, formsEnabled, weekendsEnabled, blockedDays, passwordRequests, notifications, devModeEnabled, 
      confirmZone, toggleForms, toggleWeekends, toggleDevMode, addBlockedDay, removeBlockedDay, addPasswordRequest, resolvePasswordRequest, addNotification, markNotificationAsRead, setZone
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
