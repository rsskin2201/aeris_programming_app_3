'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { User, Role, Zone, BlockedDay, PasswordResetRequest, UserStatus, AppNotification } from '@/lib/types';
import { ROLES, ZONES, USER_STATUS } from '@/lib/types';
import { mockUsers as initialMockUsers, mockRecords as initialMockRecords, InspectionRecord, sampleCollaborators as initialCollaborators, sampleQualityControlCompanies as initialQualityCompanies, sampleInspectors as initialInspectors, sampleInstallers as initialInstallers, sampleExpansionManagers as initialManagers, sampleSectors as initialSectors, CollaboratorCompany, QualityControlCompany, Inspector, Installer, ExpansionManager, Sector } from '@/lib/mock-data';

interface AppContextType {
  user: User | null;
  operatorName: string | null;
  zone: Zone;
  isZoneConfirmed: boolean;
  formsEnabled: boolean;
  weekendsEnabled: boolean;
  blockedDays: Record<string, BlockedDay>;
  passwordRequests: PasswordResetRequest[];
  notifications: AppNotification[];
  devModeEnabled: boolean;
  
  // Records
  records: InspectionRecord[];
  getRecordById: (id: string) => InspectionRecord | undefined;
  addRecord: (newRecord: InspectionRecord) => void;
  updateRecord: (updatedRecord: Partial<InspectionRecord> & { id: string }) => void;
  addMultipleRecords: (newRecords: InspectionRecord[]) => void;
  
  // Entities
  collaborators: CollaboratorCompany[];
  qualityCompanies: QualityControlCompany[];
  inspectors: Inspector[];
  installers: Installer[];
  expansionManagers: ExpansionManager[];
  sectors: Sector[];
  users: User[];
  addCollaborator: (newCollaborator: CollaboratorCompany) => void;
  updateCollaborator: (updatedCollaborator: CollaboratorCompany) => void;
  addQualityCompany: (newCompany: QualityControlCompany) => void;
  updateQualityCompany: (updatedCompany: QualityControlCompany) => void;
  addInspector: (newInspector: Inspector) => void;
  updateInspector: (updatedInspector: Inspector) => void;
  addInstaller: (newInstaller: Installer) => void;
  updateInstaller: (updatedInstaller: Installer) => void;
  addExpansionManager: (newManager: ExpansionManager) => void;
  updateExpansionManager: (updatedManager: ExpansionManager) => void;
  addSector: (newSector: Sector) => void;
  updateSector: (updatedSector: Sector) => void;
  addUser: (newUser: User) => void;
  updateUser: (updatedUser: User) => void;
  deleteUser: (username: string) => void;
  addMultipleUsers: (newUsers: User[]) => void;
  addMultipleCollaborators: (newCollaborators: CollaboratorCompany[]) => void;
  addMultipleQualityControlCompanies: (newCompanies: QualityControlCompany[]) => void;
  addMultipleInspectors: (newInspectors: Inspector[]) => void;
  addMultipleInstallers: (newInstallers: Installer[]) => void;
  addMultipleExpansionManagers: (newManagers: ExpansionManager[]) => void;
  addMultipleSectors: (newSectors: Sector[]) => void;

  // Auth & Settings
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  setZone: (zone: Zone) => void;
  switchRole: (role: Role) => void;
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
  // Auth & Settings State
  const [user, setUser] = useState<User | null>(null);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [zone, setZone] = useState<Zone>(ZONES[0]);
  const [isZoneConfirmed, setIsZoneConfirmed] = useState(false);
  const [formsEnabled, setFormsEnabled] = useState(true);
  const [weekendsEnabled, setWeekendsEnabled] = useState(false);
  const [passwordRequests, setPasswordRequests] = useState<PasswordResetRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [devModeEnabled, setDevModeEnabled] = useState(false);
  
  // Data State
  const [records, setRecords] = useState<InspectionRecord[]>(initialMockRecords);
  const [collaborators, setCollaborators] = useState<CollaboratorCompany[]>(initialCollaborators);
  const [qualityCompanies, setQualityCompanies] = useState<QualityControlCompany[]>(initialQualityCompanies);
  const [inspectors, setInspectors] = useState<Inspector[]>(initialInspectors);
  const [installers, setInstallers] = useState<Installer[]>(initialInstallers);
  const [expansionManagers, setExpansionManagers] = useState<ExpansionManager[]>(initialManagers);
  const [sectors, setSectors] = useState<Sector[]>(initialSectors);
  const [users, setUsers] = useState<User[]>(initialMockUsers);
  const [blockedDays, setBlockedDays] = useState<Record<string, BlockedDay>>({
      "2024-09-16": { reason: "Día de la Independencia" },
      "2024-11-18": { reason: "Revolución Mexicana" },
  });

  // Auth & Settings Callbacks
  const login = async (username: string, password: string): Promise<User | null> => {
    // This is a mock login. In a real app, you'd call Firebase Auth.
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    // In this mock, we'll just check if the user exists. We are not checking passwords.
    if (foundUser) {
      setUser(foundUser);
      setOperatorName(foundUser.name);
      setIsZoneConfirmed(false); // Force zone selection on new login
      return foundUser;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    setOperatorName(null);
    setIsZoneConfirmed(false);
  };
  
  const switchRole = (role: Role) => {
    const newUser = users.find(u => u.role === role);
    if (newUser) {
      // This is a mock implementation. In a real scenario, you would handle this differently.
      setUser(newUser);
      setOperatorName(currentOpName => currentOpName || newUser.name);
      setIsZoneConfirmed(false);
    }
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
    
    const admins = users.filter(u => u.role === ROLES.ADMIN);
    admins.forEach(admin => {
        addNotification({
            recipientUsername: admin.username,
            message: `Nueva solicitud de reseteo de contraseña de ${request.username}.`
        });
    });

  }, [users]);

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
  
  // Records Callbacks
  const getRecordById = useCallback((id: string) => records.find(record => record.id === id), [records]);
  const addRecord = useCallback((newRecord: InspectionRecord) => setRecords(prev => [newRecord, ...prev]), []);
  const updateRecord = useCallback((updatedRecord: Partial<InspectionRecord> & { id: string }) => {
    setRecords(prev => prev.map(record => record.id === updatedRecord.id ? { ...record, ...updatedRecord } : record));
  }, []);
  const addMultipleRecords = useCallback((newRecords: InspectionRecord[]) => setRecords(prev => [...newRecords, ...prev]), []);


  // Entities Callbacks
  const addCollaborator = useCallback((item: CollaboratorCompany) => setCollaborators(prev => [item, ...prev]), []);
  const updateCollaborator = useCallback((item: CollaboratorCompany) => setCollaborators(prev => prev.map(c => c.id === item.id ? item : c)), []);
  
  const addQualityCompany = useCallback((item: QualityControlCompany) => setQualityCompanies(prev => [item, ...prev]), []);
  const updateQualityCompany = useCallback((item: QualityControlCompany) => setQualityCompanies(prev => prev.map(c => c.id === item.id ? item : c)), []);

  const addInspector = useCallback((item: Inspector) => setInspectors(prev => [item, ...prev]), []);
  const updateInspector = useCallback((item: Inspector) => setInspectors(prev => prev.map(i => i.id === item.id ? item : i)), []);

  const addInstaller = useCallback((item: Installer) => setInstallers(prev => [item, ...prev]), []);
  const updateInstaller = useCallback((item: Installer) => setInstallers(prev => prev.map(i => i.id === item.id ? item : i)), []);

  const addExpansionManager = useCallback((item: ExpansionManager) => setExpansionManagers(prev => [item, ...prev]), []);
  const updateExpansionManager = useCallback((item: ExpansionManager) => setExpansionManagers(prev => prev.map(m => m.id === item.id ? item : m)), []);

  const addSector = useCallback((item: Sector) => setSectors(prev => [item, ...prev]), []);
  const updateSector = useCallback((item: Sector) => setSectors(prev => prev.map(s => s.id === item.id ? item : s)), []);
  
  const addUser = useCallback((item: User) => setUsers(prev => [item, ...prev]), []);
  const updateUser = useCallback((item: User) => setUsers(prev => prev.map(u => u.username === item.username ? item : u)), []);
  const deleteUser = useCallback((username: string) => setUsers(prev => prev.filter(u => u.username !== username)), []);

  const addMultipleUsers = useCallback((newUsers: User[]) => setUsers(prev => [...newUsers, ...prev]), []);
  const addMultipleCollaborators = useCallback((newItems: CollaboratorCompany[]) => setCollaborators(prev => [...newItems, ...prev]), []);
  const addMultipleQualityControlCompanies = useCallback((newItems: QualityControlCompany[]) => setQualityCompanies(prev => [...newItems, ...prev]), []);
  const addMultipleInspectors = useCallback((newItems: Inspector[]) => setInspectors(prev => [...newItems, ...prev]), []);
  const addMultipleInstallers = useCallback((newItems: Installer[]) => setInstallers(prev => [...newItems, ...prev]), []);
  const addMultipleExpansionManagers = useCallback((newItems: ExpansionManager[]) => setExpansionManagers(prev => [...newItems, ...prev]), []);
  const addMultipleSectors = useCallback((newItems: Sector[]) => setSectors(prev => [...newItems, ...prev]), []);


  const contextValue = useMemo(
    () => ({
      user,
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
      users,
      getRecordById,
      addRecord,
      updateRecord,
      addMultipleRecords,
      addCollaborator,
      updateCollaborator,
      addQualityCompany,
      updateQualityCompany,
      addInspector,
      updateInspector,
      addInstaller,
      updateInstaller,
      addExpansionManager,
      updateExpansionManager,
      addSector,
      updateSector,
      addUser,
      updateUser,
      deleteUser,
      addMultipleUsers,
      addMultipleCollaborators,
      addMultipleQualityControlCompanies,
      addMultipleInspectors,
      addMultipleInstallers,
      addMultipleExpansionManagers,
      addMultipleSectors,
      login,
      logout,
      switchRole,
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
      user, operatorName, zone, isZoneConfirmed, formsEnabled, weekendsEnabled, blockedDays, passwordRequests, notifications, devModeEnabled, records, collaborators, qualityCompanies, inspectors, installers, expansionManagers, sectors, users,
      getRecordById, addRecord, updateRecord, addMultipleRecords, confirmZone, toggleForms, toggleWeekends, toggleDevMode, addBlockedDay, removeBlockedDay, addCollaborator, updateCollaborator, addQualityCompany, updateQualityCompany, addInspector, updateInspector, addInstaller, updateInstaller, addExpansionManager, updateExpansionManager, addSector, updateSector, addUser, updateUser, deleteUser, login, logout, switchRole, addPasswordRequest, resolvePasswordRequest, addNotification, markNotificationAsRead,
      addMultipleUsers, addMultipleCollaborators, addMultipleQualityControlCompanies, addMultipleInspectors, addMultipleInstallers, addMultipleExpansionManagers, addMultipleSectors
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
