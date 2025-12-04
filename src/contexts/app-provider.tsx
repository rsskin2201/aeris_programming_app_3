'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { getDoc, doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth, useFirestore, useUser as useFirebaseAuthUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { User, Role, Zone, BlockedDay, AppNotification } from '@/lib/types';
import { ZONES, ROLES, USER_STATUS } from '@/lib/types';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { InspectionRecord, CollaboratorCompany, QualityControlCompany, Inspector, Installer, ExpansionManager, Sector, mockUsers } from '@/lib/mock-data';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  // Auth State
  user: User | null;
  isUserLoading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  addMultipleUsers: (users: (Omit<User, 'id'> & { password?: string })[]) => void;


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

  // Temp mock data management
  addMultipleCollaborators: (data: CollaboratorCompany[]) => void;
  addMultipleQualityControlCompanies: (data: QualityControlCompany[]) => void;
  addMultipleInspectors: (data: Inspector[]) => void;
  addMultipleInstallers: (data: Installer[]) => void;
  addMultipleExpansionManagers: (data: ExpansionManager[]) => void;
  addMultipleSectors: (data: Sector[]) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

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
  const { toast } = useToast();
  const { user: firebaseUser, loading: isUserLoading } = useFirebaseAuthUser();

  const addMultipleUsers = useCallback((users: (Omit<User, 'id'> & { password?: string })[]) => {
    if (!firestore || !auth) return;
    users.forEach(async (user) => {
      const email = `${user.username}@aeris.com`;
      if (!user.password) {
          console.error("Skipping user creation due to missing password", user);
          return;
      }
      try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, user.password);
        const uid = userCredential.user.uid;
        
        // Create user profile in Firestore
        const { password, ...userProfileData } = user;
        const userProfile: User = { ...userProfileData, id: uid };
        const docRef = doc(firestore, 'users', uid);
        setDocumentNonBlocking(docRef, userProfile, { merge: false });

      } catch (error: any) {
        if (error.code !== 'auth/email-already-in-use') {
            console.error("Error creating a user during bulk upload:", error);
        }
      }
    });
  }, [auth, firestore]);

  const seedUsers = useCallback(() => {
    const passwords = {
      [ROLES.ADMIN]: 'Admin.2024!',
      [ROLES.GESTOR]: 'Gestor.2024!',
      [ROLES.COLABORADOR]: 'Colab.2024!',
      [ROLES.SOPORTE]: 'Soporte.2024!',
      [ROLES.COORDINADOR_SSPP]: 'Coord.2024!',
      [ROLES.CALIDAD]: 'Calidad.2024!',
      [ROLES.CANALES]: 'Canales.2024!',
      [ROLES.VISUAL]: 'Visual.2024!',
    };

    const usersToSeed = mockUsers.map(u => ({
      ...u,
      password: passwords[u.role] || 'Default.2024!',
    }));
    
    addMultipleUsers(usersToSeed);
    localStorage.setItem('users_seeded', 'true');
    toast({ title: "Usuarios de demostración creados", description: "Puedes iniciar sesión con los usuarios de prueba."});

  }, [addMultipleUsers, toast]);

  useEffect(() => {
    if (firestore && auth && !localStorage.getItem('users_seeded')) {
      seedUsers();
    }
  }, [firestore, auth, seedUsers]);


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
  

  const login = useCallback(async (username: string, password: string): Promise<User | null> => {
    if (!auth || !firestore) throw new Error("Firebase services not available.");
    
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("username", "==", username));
    
    try {
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw { code: 'auth/invalid-credential', message: 'Usuario o contraseña incorrectos.' };
        }

        const userDoc = querySnapshot.docs[0];
        const userProfile = { id: userDoc.id, ...userDoc.data() } as User;
        
        const email = `${userProfile.username}@aeris.com`;

        await signInWithEmailAndPassword(auth, email, password);
        // On successful sign-in, Firebase automatically handles the user state.
        // The `useEffect` listening to `firebaseUser` will then fetch the profile.
        return userProfile;

    } catch (error: any) {
      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
            path: usersRef.path,
            operation: 'list', // getDocs is a list operation
        });
        errorEmitter.emit('permission-error', permissionError);
        // We still throw a user-friendly error to be caught by the form
        throw new Error('No tienes permiso para realizar esta acción. Contacta a un administrador.');
      }
      
      console.error("Login process failed:", error);
      throw error; // Re-throw other errors (like auth/wrong-password) to be handled by the form
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

  const addMultipleEntities = (collectionName: string) => (data: any[]) => {
    if (!firestore) return;
    data.forEach(item => {
        if (!item.id) {
            console.warn("Skipping item without ID in bulk add:", item);
            return;
        }
        const docRef = doc(firestore, collectionName, item.id);
        setDocumentNonBlocking(docRef, item, { merge: true });
    });
  };

  const addMultipleCollaborators = addMultipleEntities('empresas_colaboradoras');
  const addMultipleQualityControlCompanies = addMultipleEntities('empresas_control_calidad');
  const addMultipleInspectors = addMultipleEntities('inspectores');
  const addMultipleInstallers = addMultipleEntities('instaladores');
  const addMultipleExpansionManagers = addMultipleEntities('gestores_expansion');
  const addMultipleSectors = addMultipleEntities('sectores');


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
      addMultipleUsers,
      addMultipleCollaborators,
      addMultipleQualityControlCompanies,
      addMultipleInspectors,
      addMultipleInstallers,
      addMultipleExpansionManagers,
      addMultipleSectors,
    }),
    [
      user, isUserLoading, login, logout, operatorName, zone, isZoneConfirmed, formsEnabled, weekendsEnabled, blockedDays, notifications, devModeEnabled, 
      confirmZone, toggleForms, toggleWeekends, toggleDevMode, addBlockedDay, removeBlockedDay, addNotification, markNotificationAsRead, setZone, addMultipleUsers, addMultipleCollaborators, addMultipleQualityControlCompanies, addMultipleInspectors, addMultipleInstallers, addMultipleExpansionManagers, addMultipleSectors
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
