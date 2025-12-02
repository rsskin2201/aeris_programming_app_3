'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { User, Role, Zone, BlockedDay, PasswordResetRequest, UserStatus, AppNotification } from '@/lib/types';
import { ROLES, ZONES, USER_STATUS } from '@/lib/types';
import { useUser, useAuth } from '@/firebase';
import { mockRecords as initialMockRecords, InspectionRecord, sampleCollaborators as initialCollaborators, sampleQualityControlCompanies as initialQualityCompanies, sampleInspectors as initialInspectors, sampleInstallers as initialInstallers, sampleExpansionManagers as initialManagers, sampleSectors as initialSectors, CollaboratorCompany, QualityControlCompany, Inspector, Installer, ExpansionManager, Sector } from '@/lib/mock-data';

interface AppContextType {
  // User from Firebase Auth
  authUser: User | null;
  isAuthLoading: boolean;
  
  // App-specific user profile from Firestore
  userProfile: User | null;
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
  
  // Simplified Records - will be replaced by Firestore hooks in components
  records: InspectionRecord[];
  
  // Simplified Entities - will be replaced by Firestore hooks in components
  collaborators: CollaboratorCompany[];
  qualityCompanies: QualityControlCompany[];
  inspectors: Inspector[];
  installers: Installer[];
  expansionManagers: ExpansionManager[];
  sectors: Sector[];
  
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
  // Firebase Auth State
  const { user: authUser, loading: isAuthLoading } = useUser();
  const auth = useAuth();

  // App-specific State
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [zone, setZone] = useState<Zone>(ZONES[0]);
  const [isZoneConfirmed, setIsZoneConfirmed] = useState(false);
  const [formsEnabled, setFormsEnabled] = useState(true);
  const [weekendsEnabled, setWeekendsEnabled] = useState(false);
  const [passwordRequests, setPasswordRequests] = useState<PasswordResetRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  
  // Mock Data (will be phased out)
  const [records, setRecords] = useState<InspectionRecord[]>(initialMockRecords);
  const [collaborators, setCollaborators] = useState<CollaboratorCompany[]>(initialCollaborators);
  const [qualityCompanies, setQualityCompanies] = useState<QualityControlCompany[]>(initialQualityCompanies);
  const [inspectors, setInspectors] = useState<Inspector[]>(initialInspectors);
  const [installers, setInstallers] = useState<Installer[]>(initialInstallers);
  const [expansionManagers, setExpansionManagers] = useState<ExpansionManager[]>(initialManagers);
  const [sectors, setSectors] = useState<Sector[]>(initialSectors);

  const [blockedDays, setBlockedDays] = useState<Record<string, BlockedDay>>({
      "2024-09-16": { reason: "Día de la Independencia" },
      "2024-11-18": { reason: "Revolución Mexicana" },
  });
  
  useEffect(() => {
    if (authUser && userProfile) {
        setOperatorName(userProfile.name);
    } else {
        setOperatorName(null);
    }
  }, [authUser, userProfile]);

  // Auth & Settings Callbacks
  const logout = () => {
    auth.signOut();
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
    
    // In a real app, you would get admins from Firestore
    const adminUsernames = ['admin'];
    adminUsernames.forEach(adminUsername => {
        addNotification({
            recipientUsername: adminUsername,
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
  
  const contextValue = useMemo(
    () => ({
      authUser,
      isAuthLoading,
      userProfile,
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
      collaborators,
      qualityCompanies,
      inspectors,
      installers,
      expansionManagers,
      sectors,
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
      authUser, isAuthLoading, userProfile, operatorName, zone, isZoneConfirmed, formsEnabled, weekendsEnabled, blockedDays, passwordRequests, notifications, devModeEnabled, records, collaborators, qualityCompanies, inspectors, installers, expansionManagers, sectors,
      confirmZone, toggleForms, toggleWeekends, toggleDevMode, addBlockedDay, removeBlockedDay, logout, addPasswordRequest, resolvePasswordRequest, addNotification, markNotificationAsRead
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
