'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback } from 'react';
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
  
  // Records
  records: InspectionRecord[];
  getRecordById: (id: string) => InspectionRecord | undefined;
  addRecord: (newRecord: InspectionRecord) => void;
  updateRecord: (updatedRecord: InspectionRecord) => void;
  
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


  // Auth & Settings
  login: (username: string, operatorName?: string) => User | null;
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
  const login = (username: string, opName?: string): User | null => {
    const foundUser = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    
    const userToLogin = foundUser || (() => {
        const roleKey = Object.keys(ROLES).find(key => ROLES[key as keyof typeof ROLES].toLowerCase().split(' ')[0] === username.toLowerCase());
        return roleKey ? users.find(u => u.role === ROLES[key as keyof typeof ROLES]) : undefined;
    })();

    if (userToLogin) {
      setUser(userToLogin);
      setOperatorName(opName || userToLogin.name);
      setIsZoneConfirmed(false);
      return userToLogin;
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
    
    // Also send a notification to the admin
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
  const updateRecord = useCallback((updatedRecord: InspectionRecord) => {
    setRecords(prev => prev.map(record => record.id === updatedRecord.id ? updatedRecord : record));
  }, []);

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
      login,
      logout,
      switchRole,
      confirmZone,
      toggleForms,
      toggleWeekends,
      addBlockedDay,
      removeBlockedDay,
      addPasswordRequest,
      resolvePasswordRequest,
      addNotification,
      markNotificationAsRead,
    }),
    [
      user, operatorName, zone, isZoneConfirmed, formsEnabled, weekendsEnabled, blockedDays, passwordRequests, notifications, records, collaborators, qualityCompanies, inspectors, installers, expansionManagers, sectors, users,
      getRecordById, addRecord, updateRecord, confirmZone, toggleForms, toggleWeekends, addBlockedDay, removeBlockedDay, addCollaborator, updateCollaborator, addQualityCompany, updateQualityCompany, addInspector, updateInspector, addInstaller, updateInstaller, addExpansionManager, updateExpansionManager, addSector, updateSector, addUser, updateUser, deleteUser, login, logout, switchRole, addPasswordRequest, resolvePasswordRequest, addNotification, markNotificationAsRead
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
