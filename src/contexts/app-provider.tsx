'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback } from 'react';
import type { User, Role, Zone } from '@/lib/types';
import { ROLES, ZONES } from '@/lib/types';
import { mockUsers } from '@/lib/mock-data';

interface AppContextType {
  user: User | null;
  zone: Zone;
  isZoneConfirmed: boolean;
  login: (username: string) => User | null;
  logout: () => void;
  setZone: (zone: Zone) => void;
  switchRole: (role: Role) => void;
  confirmZone: (zone: Zone) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [zone, setZone] = useState<Zone>(ZONES[0]);
  const [isZoneConfirmed, setIsZoneConfirmed] = useState(false);


  const login = (username: string): User | null => {
    const foundUser = mockUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (foundUser) {
      setUser(foundUser);
      setIsZoneConfirmed(false); // Reset on login
      return foundUser;
    }
    // For demo, allow login with any role name for testing
    const roleKey = Object.keys(ROLES).find(key => ROLES[key as keyof typeof ROLES].toLowerCase().split(' ')[0] === username.toLowerCase());
    if (roleKey) {
        const roleUser = mockUsers.find(u => u.role === ROLES[roleKey as keyof typeof ROLES]);
        if (roleUser) {
            setUser(roleUser);
            setIsZoneConfirmed(false); // Reset on login
            return roleUser;
        }
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    setIsZoneConfirmed(false);
  };
  
  const switchRole = (role: Role) => {
    const newUser = mockUsers.find(u => u.role === role);
    if (newUser) {
      setUser(newUser);
      setIsZoneConfirmed(false); // Reset on role switch
    }
  };

  const confirmZone = useCallback((newZone: Zone) => {
    setZone(newZone);
    setIsZoneConfirmed(true);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      zone,
      isZoneConfirmed,
      login,
      logout,
      setZone,
      switchRole,
      confirmZone,
    }),
    [user, zone, isZoneConfirmed, confirmZone]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
