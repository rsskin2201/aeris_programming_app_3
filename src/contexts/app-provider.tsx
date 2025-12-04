'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { getDoc, doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth, useFirestore, useUser as useFirebaseAuthUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { User, Role, Zone, BlockedDay, AppNotification, PasswordResetRequest, NewMeterRequest } from '@/lib/types';
import { ZONES, ROLES, USER_STATUS, STATUS } from '@/lib/types';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { InspectionRecord, CollaboratorCompany, QualityControlCompany, Inspector, Installer, ExpansionManager, Sector, Meter, mockUsers } from '@/lib/mock-data';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface AppContextType {
  // Auth State
  user: User | null;
  isUserLoading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  addMultipleUsers: (users: (Omit<User, 'id'> & { password?: string })[]) => void;
  requestPasswordReset: (username: string, email: string) => void;
  requestNewMeter: (request: Omit<NewMeterRequest, 'id' | 'date'>) => void;
  reprogramInspection: (record: InspectionRecord) => void;


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
  addMultipleMeters: (data: Meter[]) => void;
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
  const router = useRouter();
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
    
    const email = `${username.toLowerCase().trim()}@aeris.com`;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const authedUser = userCredential.user;
        
        const userDocRef = doc(firestore, 'users', authedUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            await signOut(auth);
            throw new Error('No se encontró el perfil de usuario asociado a estas credenciales.');
        }

        return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error: any) {
      if (error.code === 'permission-denied') {
          throw new Error('No tienes permiso para realizar esta acción. Contacta a un administrador.');
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
          throw new Error('Usuario o contraseña incorrectos.');
      }
      
      console.error("Login process failed:", error);
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
  
  const addNotification = useCallback((notificationData: Omit<AppNotification, 'id' | 'date' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notificationData,
      id: `notif-${Date.now()}-${Math.random()}`,
      date: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const requestPasswordReset = useCallback((username: string, email: string) => {
    const resetRequest: PasswordResetRequest = {
        id: `reset-${Date.now()}`,
        username,
        email,
        date: new Date(),
    };
    addNotification({
        recipientRole: ROLES.ADMIN,
        message: `Solicitud de reseteo de contraseña`,
        details: `Usuario: ${username}, Correo: ${email}`,
    });
  }, [addNotification]);
  
  const requestNewMeter = useCallback((request: Omit<NewMeterRequest, 'id' | 'date'>) => {
    addNotification({
        recipientRole: ROLES.ADMIN,
        message: `Solicitud de Alta de Medidor`,
        details: `Solicitante: ${request.requesterName} (${request.requesterRole}) | Zona: ${request.zone} | Marca: ${request.marca} | Tipo: ${request.tipo}`,
    });
     addNotification({
        recipientRole: ROLES.COORDINADOR_SSPP,
        message: `Solicitud de Alta de Medidor`,
        details: `Solicitante: ${request.requesterName} (${request.requesterRole}) | Zona: ${request.zone} | Marca: ${request.marca} | Tipo: ${request.tipo}`,
    });
  }, [addNotification]);

  const reprogramInspection = useCallback((record: InspectionRecord) => {
    if (!firestore) return;

    // 1. Clone the record
    const { id: oldId, status: oldStatus, ...restOfRecord } = record;
    const newId = `INSP-RP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newRecord: InspectionRecord = {
      ...restOfRecord,
      id: newId,
      status: STATUS.REGISTRADA, // 2. Reset status
      createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      createdBy: user?.username || 'desconocido',
      reprogrammedFromId: oldId, // 3. Add trace
    };

    // 4. Save the new record
    const newDocRef = doc(firestore, 'inspections', newId);
    setDocumentNonBlocking(newDocRef, newRecord, { merge: false });

    // 5. Update the old record
    const oldDocRef = doc(firestore, 'inspections', oldId);
    const updatedOldRecord: Partial<InspectionRecord> = {
        status: `${oldStatus} - REPROGRAMADA` as any,
        reprogrammedToId: newId,
    };
    updateDocumentNonBlocking(oldDocRef, updatedOldRecord);

    toast({
        title: "Registro Clonado para Reprogramación",
        description: "Serás redirigido al nuevo borrador en un momento."
    });

    // 6. Navigate to the new record's edit page
    let path = '/inspections/individual'; // Default path
    if (newRecord.type === 'Masiva PES') {
      path = '/inspections/massive';
    } else if (newRecord.type === 'Especial') {
      path = '/inspections/special';
    }
    router.push(`${path}?id=${newId}&mode=edit&from=records`);

  }, [firestore, user, router, toast]);


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
  const addMultipleMeters = addMultipleEntities('medidores');


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
      requestPasswordReset,
      requestNewMeter,
      markNotificationAsRead,
      addMultipleUsers,
      addMultipleCollaborators,
      addMultipleQualityControlCompanies,
      addMultipleInspectors,
      addMultipleInstallers,
      addMultipleExpansionManagers,
      addMultipleSectors,
      addMultipleMeters,
      reprogramInspection,
    }),
    [
      user, isUserLoading, login, logout, operatorName, zone, isZoneConfirmed, formsEnabled, weekendsEnabled, blockedDays, notifications, devModeEnabled, 
      confirmZone, toggleForms, toggleWeekends, toggleDevMode, addBlockedDay, removeBlockedDay, addNotification, requestPasswordReset, requestNewMeter, markNotificationAsRead, setZone, addMultipleUsers, addMultipleCollaborators, addMultipleQualityControlCompanies, addMultipleInspectors, addMultipleInstallers, addMultipleExpansionManagers, addMultipleSectors, addMultipleMeters, reprogramInspection
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
