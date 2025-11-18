'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback } from 'react';
import type { User, Role, Zone } from '@/lib/types';
import { ROLES, ZONES } from '@/lib/types';
import { mockUsers } from '@/lib/mock-data';

interface AppContextType {
  user: User | null;
  operatorName: string | null;
  zone: Zone;
  isZoneConfirmed: boolean;
  formsEnabled: boolean;
  weekendsEnabled: boolean;
  login: (username: string, operatorName?: string) => User | null;
  logout: () => void;
  setZone: (zone: Zone) => void;
  switchRole: (role: Role) => void;
  confirmZone: (zone: Zone) => void;
  toggleForms: () => void;
  toggleWeekends: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [zone, setZone] = useState<Zone>(ZONES[0]);
  const [isZoneConfirmed, setIsZoneConfirmed] = useState(false);
  const [formsEnabled, setFormsEnabled] = useState(true);
  const [weekendsEnabled, setWeekendsEnabled] = useState(false);


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


  const contextValue = useMemo(
    () => ({
      user,
      operatorName,
      zone,
      isZoneConfirmed,
      formsEnabled,
      weekendsEnabled,
      login,
      logout,
      setZone,
      switchRole,
      confirmZone,
      toggleForms,
      toggleWeekends,
    }),
    [user, operatorName, zone, isZoneConfirmed, formsEnabled, weekendsEnabled, confirmZone, toggleForms, toggleWeekends]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
