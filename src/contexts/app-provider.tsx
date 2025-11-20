'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback } from 'react';
import type { User, Role, Zone, BlockedDay } from '@/lib/types';
import { ROLES, ZONES } from '@/lib/types';
import { mockUsers, mockRecords as initialMockRecords, InspectionRecord } from '@/lib/mock-data';

interface AppContextType {
  user: User | null;
  operatorName: string | null;
  zone: Zone;
  isZoneConfirmed: boolean;
  formsEnabled: boolean;
  weekendsEnabled: boolean;
  blockedDays: Record<string, BlockedDay>;
  records: InspectionRecord[];
  getRecordById: (id: string) => InspectionRecord | undefined;
  addRecord: (newRecord: InspectionRecord) => void;
  updateRecord: (updatedRecord: InspectionRecord) => void;
  login: (username: string, operatorName?: string) => User | null;
  logout: () => void;
  setZone: (zone: Zone) => void;
  switchRole: (role: Role) => void;
  confirmZone: (zone: Zone) => void;
  toggleForms: () => void;
  toggleWeekends: () => void;
  addBlockedDay: (date: string, reason: string) => void;
  removeBlockedDay: (date: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [zone, setZone] = useState<Zone>(ZONES[0]);
  const [isZoneConfirmed, setIsZoneConfirmed] = useState(false);
  const [formsEnabled, setFormsEnabled] = useState(true);
  const [weekendsEnabled, setWeekendsEnabled] = useState(false);
  const [records, setRecords] = useState<InspectionRecord[]>(initialMockRecords);
  const [blockedDays, setBlockedDays] = useState<Record<string, BlockedDay>>({
      "2024-09-16": { reason: "Día de la Independencia" },
      "2024-11-18": { reason: "Revolución Mexicana" },
  });


  const login = (username: string, opName?: string): User | null => {
    const foundUser = mockUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
    
    const userToLogin = foundUser || (() => {
        const roleKey = Object.keys(ROLES).find(key => ROLES[key as keyof typeof ROLES].toLowerCase().split(' ')[0] === username.toLowerCase());
        return roleKey ? mockUsers.find(u => u.role === ROLES[key as keyof typeof ROLES]) : undefined;
    })();

    if (userToLogin) {
      setUser(userToLogin);
      setOperatorName(opName || userToLogin.name);
      setIsZoneConfirmed(false); // Reset on login
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
    const newUser = mockUsers.find(u => u.role === role);
    if (newUser) {
      setUser(newUser);
      // Keep operatorName or reset to new user's default name
      setOperatorName(currentOpName => currentOpName || newUser.name);
      setIsZoneConfirmed(false); // Reset on role switch
    }
  };

  const confirmZone = useCallback((newZone: Zone) => {
    setZone(newZone);
    setIsZoneConfirmed(true);
  }, []);

  const toggleForms = useCallback(() => {
    setFormsEnabled(prev => !prev);
  }, []);
  
  const toggleWeekends = useCallback(() => {
    setWeekendsEnabled(prev => !prev);
  }, []);

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
  
  const getRecordById = useCallback((id: string) => {
    return records.find(record => record.id === id);
  }, [records]);

  const addRecord = useCallback((newRecord: InspectionRecord) => {
    setRecords(prevRecords => [newRecord, ...prevRecords]);
  }, []);

  const updateRecord = useCallback((updatedRecord: InspectionRecord) => {
    setRecords(prevRecords => 
        prevRecords.map(record => record.id === updatedRecord.id ? updatedRecord : record)
    );
  }, []);


  const contextValue = useMemo(
    () => ({
      user,
      operatorName,
      zone,
      isZoneConfirmed,
      formsEnabled,
      weekendsEnabled,
      blockedDays,
      records,
      getRecordById,
      addRecord,
      updateRecord,
      login,
      logout,
      setZone,
      switchRole,
      confirmZone,
      toggleForms,
      toggleWeekends,
      addBlockedDay,
      removeBlockedDay,
    }),
    [user, operatorName, zone, isZoneConfirmed, formsEnabled, weekendsEnabled, blockedDays, records, getRecordById, addRecord, updateRecord, confirmZone, toggleForms, toggleWeekends, addBlockedDay, removeBlockedDay]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}