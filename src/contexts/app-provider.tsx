'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo } from 'react';
import type { User, Role, Zone } from '@/lib/types';
import { ROLES, ZONES } from '@/lib/types';
import { mockUsers } from '@/lib/mock-data';

interface AppContextType {
  user: User | null;
  zone: Zone;
  login: (username: string) => User | null;
  logout: () => void;
  setZone: (zone: Zone) => void;
  switchRole: (role: Role) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [zone, setZone] = useState<Zone>(ZONES[0]);

  const login = (username: string): User | null => {
    const foundUser = mockUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (foundUser) {
      setUser(foundUser);
      return foundUser;
    }
    // For demo, allow login with any role name for testing
    const roleKey = Object.keys(ROLES).find(key => ROLES[key as keyof typeof ROLES].toLowerCase().split(' ')[0] === username.toLowerCase());
    if (roleKey) {
        const roleUser = mockUsers.find(u => u.role === ROLES[roleKey as keyof typeof ROLES]);
        if (roleUser) {
            setUser(roleUser);
            return roleUser;
        }
    }
    return null;
  };

  const logout = () => {
    setUser(null);
  };
  
  const switchRole = (role: Role) => {
    const newUser = mockUsers.find(u => u.role === role);
    if (newUser) {
      setUser(newUser);
    }
  };

  const contextValue = useMemo(
    () => ({
      user,
      zone,
      login,
      logout,
      setZone,
      switchRole,
    }),
    [user, zone]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
