'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { User, Role, Zone, BlockedDay, PasswordResetRequest, UserStatus, AppNotification } from '@/lib/types';
import { ROLES, ZONES, USER_STATUS } from '@/lib/types';
import { mockRecords as initialMockRecords, InspectionRecord, sampleCollaborators as initialCollaborators, sampleQualityControlCompanies as initialQualityCompanies, sampleInspectors as initialInspectors, sampleInstallers as initialInstallers, sampleExpansionManagers as initialManagers, sampleSectors as initialSectors, CollaboratorCompany, QualityControlCompany, Inspector, Installer, ExpansionManager, Sector, mockUsers } from '@/lib/mock-data';

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
  addMultipleRecords: (records: InspectionRecord[]) => void;
  
  users: User[];
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (username: string) => void;
  addMultipleUsers: (users: User[]) => void;
  
  collaborators: CollaboratorCompany[];
  addCollaborator: (company: CollaboratorCompany) => void;
  updateCollaborator: (company: CollaboratorCompany) => void;
  addMultipleCollaborators: (companies: CollaboratorCompany[]) => void;

  qualityCompanies: QualityControlCompany[];
  addQualityCompany: (company: QualityControlCompany) => void;
  updateQualityCompany: (company: QualityControlCompany) => void;
  addMultipleQualityControlCompanies: (companies: QualityControlCompany[]) => void;

  inspectors: Inspector[];
  addInspector: (inspector: Inspector) => void;
  updateInspector: (inspector: Inspector) => void;
  addMultipleInspectors: (inspectors: Inspector[]) => void;

  installers: Installer[];
  addInstaller: (installer: Installer) => void;
  updateInstaller: (installer: Installer) => void;
  addMultipleInstallers: (installers: Installer[]) => void;

  expansionManagers: ExpansionManager[];
  addExpansionManager: (manager: ExpansionManager) => void;
  updateExpansionManager: (manager: ExpansionManager) => void;
  addMultipleExpansionManagers: (managers: ExpansionManager[]) => void;

  sectors: Sector[];
  addSector: (sector: Sector) => void;
  updateSector: (sector: Sector) => void;
  addMultipleSectors: (sectors: Sector[]) => void;
  
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
  const [user, setUserProfile] = useState<User | null>(null);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [zone, setZone] = useState<Zone>(ZONES[0]);
  const [isZoneConfirmed, setIsZoneConfirmed] = useState(false);
  const [formsEnabled, setFormsEnabled] = useState(true);
  const [weekendsEnabled, setWeekendsEnabled] = useState(false);
  const [passwordRequests, setPasswordRequests] = useState<PasswordResetRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  
  // Mock Data States
  const [users, setUsers] = useState<User[]>(mockUsers);
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
    
    const adminUsernames = mockUsers.filter(u => u.role === ROLES.ADMIN).map(u => u.username);
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

  // CRUD Records
  const addRecord = (record: InspectionRecord) => setRecords(prev => [record, ...prev]);
  const updateRecord = (record: InspectionRecord) => setRecords(prev => prev.map(r => r.id === record.id ? record : r));
  const addMultipleRecords = (newRecords: InspectionRecord[]) => setRecords(prev => [...newRecords, ...prev]);

  // CRUD Users
  const addUser = (user: User) => setUsers(prev => [user, ...prev]);
  const updateUser = (user: User) => setUsers(prev => prev.map(u => u.username === user.username ? {...u, ...user} : u));
  const deleteUser = (username: string) => setUsers(prev => prev.filter(u => u.username !== username));
  const addMultipleUsers = (newUsers: User[]) => setUsers(prev => [...newUsers, ...prev]);
  
  // CRUD Collaborators
  const addCollaborator = (company: CollaboratorCompany) => setCollaborators(prev => [company, ...prev]);
  const updateCollaborator = (company: CollaboratorCompany) => setCollaborators(prev => prev.map(c => c.id === company.id ? company : c));
  const addMultipleCollaborators = (companies: CollaboratorCompany[]) => setCollaborators(prev => [...companies, ...prev]);

  // CRUD Quality Companies
  const addQualityCompany = (company: QualityControlCompany) => setQualityCompanies(prev => [company, ...prev]);
  const updateQualityCompany = (company: QualityControlCompany) => setQualityCompanies(prev => prev.map(c => c.id === company.id ? company : c));
  const addMultipleQualityControlCompanies = (companies: QualityControlCompany[]) => setQualityCompanies(prev => [...companies, ...prev]);

  // CRUD Inspectors
  const addInspector = (inspector: Inspector) => setInspectors(prev => [inspector, ...prev]);
  const updateInspector = (inspector: Inspector) => setInspectors(prev => prev.map(i => i.id === inspector.id ? inspector : i));
  const addMultipleInspectors = (inspectors: Inspector[]) => setInspectors(prev => [...inspectors, ...prev]);

  // CRUD Installers
  const addInstaller = (installer: Installer) => setInstallers(prev => [installer, ...prev]);
  const updateInstaller = (installer: Installer) => setInstallers(prev => prev.map(i => i.id === installer.id ? installer : i));
  const addMultipleInstallers = (installers: Installer[]) => setInstallers(prev => [...installers, ...prev]);

  // CRUD Expansion Managers
  const addExpansionManager = (manager: ExpansionManager) => setExpansionManagers(prev => [manager, ...prev]);
  const updateExpansionManager = (manager: ExpansionManager) => setExpansionManagers(prev => prev.map(m => m.id === manager.id ? manager : m));
  const addMultipleExpansionManagers = (managers: ExpansionManager[]) => setExpansionManagers(prev => [...managers, ...prev]);

  // CRUD Sectors
  const addSector = (sector: Sector) => setSectors(prev => [sector, ...prev]);
  const updateSector = (sector: Sector) => setSectors(prev => prev.map(s => s.id === sector.id ? sector : s));
  const addMultipleSectors = (sectors: Sector[]) => setSectors(prev => [...sectors, ...prev]);

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
      addMultipleRecords,
      users,
      addUser,
      updateUser,
      deleteUser,
      addMultipleUsers,
      collaborators,
      addCollaborator,
      updateCollaborator,
      addMultipleCollaborators,
      qualityCompanies,
      addQualityCompany,
      updateQualityCompany,
      addMultipleQualityControlCompanies,
      inspectors,
      addInspector,
      updateInspector,
      addMultipleInspectors,
      installers,
      addInstaller,
      updateInstaller,
      addMultipleInstallers,
      expansionManagers,
      addExpansionManager,
      updateExpansionManager,
      addMultipleExpansionManagers,
      sectors,
      addSector,
      updateSector,
      addMultipleSectors,
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
      user, operatorName, zone, isZoneConfirmed, formsEnabled, weekendsEnabled, blockedDays, passwordRequests, notifications, devModeEnabled, records, users, collaborators, qualityCompanies, inspectors, installers, expansionManagers, sectors,
      confirmZone, toggleForms, toggleWeekends, toggleDevMode, addBlockedDay, removeBlockedDay, logout, addPasswordRequest, resolvePasswordRequest, addNotification, markNotificationAsRead
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
