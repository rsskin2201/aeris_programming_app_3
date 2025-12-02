'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import type { User, Role, Zone, BlockedDay, PasswordResetRequest, AppNotification } from '@/lib/types';
import { ROLES, ZONES } from '@/lib/types';
import { mockRecords as initialMockRecords, InspectionRecord, mockUsers } from '@/lib/mock-data';
import { setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';


interface AppContextType {
  // SIMULATED Auth State
  user: User | null;
  setUserProfile: (profile: User | null) => void;

  operatorName: string | null;
  zone: Zone;
  isZoneConfirmed: boolean;
  formsEnabled: boolean;
  weekendsEnabled: boolean;
  blockedDays: Record<string, BlockedDay>;
  passwordRequests: PasswordResetRequest[];
  notifications: AppNotification[];
  devModeEnabled: boolean;
  
  // Mock Data for Entities
  records: InspectionRecord[];
  addRecord: (record: InspectionRecord) => void;
  updateRecord: (record: InspectionRecord) => void;
  getRecordById: (id: string) => InspectionRecord | undefined;
  addMultipleRecords: (records: InspectionRecord[]) => void;
  
  // Auth & Settings
  logout: () => void;
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
  // App-specific State
  const [user, setUser] = useState<User | null>(null);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [zone, setZone] = useState<Zone>(ZONES[0]);
  const [isZoneConfirmed, setIsZoneConfirmed] = useState(false);
  const [formsEnabled, setFormsEnabled] = useState(true);
  const [weekendsEnabled, setWeekendsEnabled] = useState(false);
  const [passwordRequests, setPasswordRequests] = useState<PasswordResetRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  const firestore = useFirestore();
  const { user: authUser, isUserLoading } = useAuth();
  
  // Mock Data States
  const [records, setRecords] = useState<InspectionRecord[]>(initialMockRecords);
 
  const [blockedDays, setBlockedDays] = useState<Record<string, BlockedDay>>({
      "2024-09-16": { reason: "Día de la Independencia" },
      "2024-11-18": { reason: "Revolución Mexicana" },
  });

  const setUserProfile = useCallback((profile: User | null) => {
    setUser(profile);
  }, []);
  
  useEffect(() => {
    if (isUserLoading) return;

    if (authUser) {
      const userRef = doc(firestore, 'users', authUser.uid);
      getDoc(userRef).then(docSnap => {
        if (docSnap.exists()) {
          setUser(docSnap.data() as User);
        } else {
          // This case might happen if user exists in Auth but not in Firestore.
          // You might want to log them out or create a default profile.
          console.warn("User profile not found in Firestore for UID:", authUser.uid);
          setUser(null); // Or handle appropriately
        }
      });
    } else {
      setUser(null);
    }
  }, [authUser, isUserLoading, firestore]);

  
  useEffect(() => {
    if (user) {
        setOperatorName(user.name);
    } else {
        setOperatorName(null);
    }
  }, [user]);

  // Auth & Settings Callbacks
  const logout = () => {
    setUserProfile(null);
    setIsZoneConfirmed(false);
  };

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
    
    // This part should be handled by a backend function in a real app
    mockUsers.filter(u => u.role === ROLES.ADMIN).forEach(adminUser => {
        addNotification({
            recipientUsername: adminUser.username,
            message: `Nueva solicitud de reseteo de contraseña de ${request.username}.`
        });
    });

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

  // CRUD Records
  const addRecord = (record: InspectionRecord) => setRecords(prev => [record, ...prev]);
  const updateRecord = (record: InspectionRecord) => setRecords(prev => prev.map(r => r.id === record.id ? record : r));
  const addMultipleRecords = (newRecords: InspectionRecord[]) => setRecords(prev => [...newRecords, ...prev]);
  const getRecordById = (id: string) => records.find(r => r.id === id);


  const contextValue = useMemo(
    () => ({
      user,
      setUserProfile,
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
      records,
      addRecord,
      updateRecord,
      getRecordById,
      addMultipleRecords,
      logout,
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
      user, operatorName, zone, isZoneConfirmed, formsEnabled, weekendsEnabled, blockedDays, passwordRequests, notifications, devModeEnabled, records,
      confirmZone, toggleForms, toggleWeekends, toggleDevMode, addBlockedDay, removeBlockedDay, logout, addPasswordRequest, resolvePasswordRequest, addNotification, markNotificationAsRead, setUserProfile
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
