'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { getDoc, doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth, useFirestore, useUser as useFirebaseAuthUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { User, Role, Zone, BlockedDay, AppNotification } from '@/lib/types';
import { ZONES, ROLES, USER_STATUS } from '@/lib/types';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

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
  notifications: AppNotification[];
  devModeEnabled: boolean;
  
  // Settings
  setZone: (zone: Zone) => void;
  confirmZone: (zone: Zone) => void;
  toggleForms: () => void;
  toggleWeekends: () => void;
  addBlockedDay: (date: string, reason: string) => void;
  removeBlockedDay: (date: string) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  toggleDevMode: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const mockUsersSeed: Omit<User, 'id'>[] = [
  { name: 'Admin User', username: 'admin', email: 'admin@aeris.com', role: ROLES.ADMIN, zone: 'Todas las zonas', status: USER_STATUS.ACTIVO },
  { name: 'Gerardo Gestor', username: 'gestor', email: 'gestor@aeris.com', role: ROLES.GESTOR, zone: 'Zona Norte', status: USER_STATUS.ACTIVO },
  { name: 'Ana Colaboradora', username: 'colaboradora', email: 'colaborador@aeris.com', role: ROLES.COLABORADOR, zone: 'Bajio Norte', status: USER_STATUS.ACTIVO },
  { name: 'Sofia Soporte', username: 'soporte', email: 'soporte@aeris.com', role: ROLES.SOPORTE, zone: 'Zona Centro', status: USER_STATUS.ACTIVO },
  { name: 'Samuel Coordinador', username: 'coordinador', email: 'coordinador@aeris.com', role: ROLES.COORDINADOR_SSPP, zone: 'Todas las zonas', status: USER_STATUS.ACTIVO },
  { name: 'Carla Calidad', username: 'calidad', email: 'calidad@aeris.com', role: ROLES.CALIDAD, zone: 'Bajio Sur', status: USER_STATUS.ACTIVO },
  { name: 'Carlos Canales', username: 'canales', email: 'canales@aeris.com', role: ROLES.CANALES, zone: 'Todas las zonas', status: USER_STATUS.ACTIVO },
  { name: 'Victor Visual', username: 'visual', email: 'visual@aeris.com', role: ROLES.VISUAL, zone: 'Todas las zonas', status: USER_STATUS.INACTIVO },
];
const defaultPassword = 'password123';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [operatorName, setOperatorName] = useState<string | null>(null);
  const [zone, setZone] = useState<Zone>(ZONES[0]);
  const [isZoneConfirmed, setIsZoneConfirmed] = useState(false);
  const [formsEnabled, setFormsEnabled] = useState(true);
  const [weekendsEnabled, setWeekendsEnabled] = useState(false);
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
    const seedUsers = async () => {
        if (!firestore || !auth) return;

        for (const mockUser of mockUsersSeed) {
            try {
                // Try to create the user. If it fails because the email is in use, it's fine.
                const userCredential = await createUserWithEmailAndPassword(auth, mockUser.email, defaultPassword);
                const uid = userCredential.user.uid;

                // User was created in Auth, now create their profile in Firestore.
                const userProfile: User = { ...mockUser, id: uid };
                await setDoc(doc(firestore, 'users', uid), userProfile);
                console.log(`Successfully created Auth and Firestore user: ${mockUser.username}`);

            } catch (error: any) {
                if (error.code === 'auth/email-already-in-use') {
                    // This is expected if the user already exists, so we can ignore it.
                    console.log(`User ${mockUser.email} already exists in Auth. Ensuring Firestore profile exists.`);
                    
                    // We still need to ensure the Firestore document exists, so we query for it.
                    // This part is a bit complex as we need UID from email. For simplicity, we assume
                    // if auth user exists, firestore doc exists for this seeding script.
                    // A more robust solution might involve a Cloud Function to sync users.

                } else {
                    console.error(`Error processing user ${mockUser.username}:`, error);
                }
            }
        }
        // Sign out after seeding to ensure a clean state for the actual user to log in.
        if (auth.currentUser) {
            await signOut(auth);
        }
    };
    seedUsers();
  }, [firestore, auth]);


  useEffect(() => {
    const fetchUserProfile = async (uid: string) => {
        if (!firestore) return;
        const userDocRef = doc(firestore, "users", uid);
        try {
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userProfile = userDoc.data() as User;
                setUser(userProfile);
                setOperatorName(userProfile.name);
            } else {
                console.error("No user profile found in Firestore for UID:", uid);
                setUser(null);
                if (auth) {
                    await signOut(auth);
                }
            }
        } catch (error: any) {
            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
              console.error("Error fetching user profile:", error);
            }
            
            setUser(null);
            if (auth) {
                await signOut(auth);
            }
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

    try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userProfile = { ...userDoc.data(), id: userDoc.id } as User;
            setUser(userProfile);
            setOperatorName(userProfile.name);
            return userProfile;
        } else {
            await signOut(auth);
            throw new Error("User profile does not exist in Firestore.");
        }
    } catch (error: any) {
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'get',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        // Re-throw the original or a new error to be caught by the login form
        throw error;
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
      notifications,
      devModeEnabled,
      confirmZone,
      toggleForms,
      toggleWeekends,
      toggleDevMode,
      addBlockedDay,
      removeBlockedDay,
      addNotification,
      markNotificationAsRead,
    }),
    [
      user, isUserLoading, login, logout, operatorName, zone, isZoneConfirmed, formsEnabled, weekendsEnabled, blockedDays, notifications, devModeEnabled, 
      confirmZone, toggleForms, toggleWeekends, toggleDevMode, addBlockedDay, removeBlockedDay, addNotification, markNotificationAsRead, setZone
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
