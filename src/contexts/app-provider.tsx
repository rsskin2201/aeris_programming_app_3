'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { getDoc, doc, setDoc, collection, getDocs, query, where, QueryConstraint, addDoc } from 'firebase/firestore';
import { useAuth, useFirestore, useUser as useFirebaseAuthUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { User, Role, Zone, BlockedDay, AppNotification, PasswordResetRequest, NewMeterRequest, ChangeHistory, Municipio } from '@/lib/types';
import { ZONES, ROLES, USER_STATUS, STATUS } from '@/lib/types';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { InspectionRecord, CollaboratorCompany, QualityControlCompany, Inspector, Installer, ExpansionManager, Sector, Meter, mockUsers } from '@/lib/mock-data';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { createFirebaseUser } from '@/firebase/auth-utils';

interface AppContextType {
  // Auth State
  user: User | null;
  isUserLoading: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  addMultipleUsers: (users: (Omit<User, 'id'> & { password?: string })[]) => Promise<void>;
  requestPasswordReset: (username: string, email: string) => void;
  requestNewMeter: (request: Omit<NewMeterRequest, 'id' | 'date'>) => void;
  reprogramInspection: (record: InspectionRecord) => void;
  cancelInspection: (recordId: string) => void;
  buildQuery: (collectionName: string) => QueryConstraint[];


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
  addMultipleMunicipios: (data: Municipio[]) => void;
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

 const addMultipleUsers = useCallback(async (users: (Omit<User, 'id'> & { password?: string })[]) => {
    if (!firestore || !auth) {
      throw new Error("Servicios de Firebase no disponibles para la carga masiva.");
    }
    if (!auth.currentUser) {
        throw new Error("El administrador debe estar autenticado para realizar esta operación.");
    }

    for (const newUser of users) {
        const email = `${newUser.username}@aeris.com`;
        if (!newUser.password) {
            console.warn("Omitiendo usuario por falta de contraseña:", newUser.username);
            continue;
        }

        try {
            const createdAuthUser = await createFirebaseUser(auth, email, newUser.password);
            
            if (createdAuthUser) {
                const { password, ...userProfileData } = newUser;
                const userProfile: User = { ...userProfileData, id: createdAuthUser.uid };

                const docRef = doc(firestore, 'users', createdAuthUser.uid);
                await setDoc(docRef, userProfile);
                
                toast({
                    title: `Éxito: ${newUser.username}`,
                    description: 'Usuario creado en Auth y Firestore.',
                    variant: 'default',
                    duration: 2000,
                });
            } else {
                throw new Error("La creación de la autenticación del usuario no devolvió un usuario.");
            }
        } catch (error: any) {
            console.error(`Error al crear el usuario ${newUser.username}:`, error);
            throw new Error(`Falló la creación del usuario ${newUser.username}: ${error.message}`);
        }
    }
  }, [auth, firestore, toast]);

  useEffect(() => {
    const fetchUserProfile = async (uid: string) => {
      if (!firestore) return;
      const userDocRef = doc(firestore, 'users', uid);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userProfile = userDoc.data() as User;
          setUser(userProfile);
          setOperatorName(userProfile.name);
        } else {
          console.error(
            'No se encontró perfil de usuario en Firestore para el UID:',
            uid
          );
          setUser(null);
        }
      } catch (error: any) {
        console.error('Error al obtener el perfil de usuario:', error);
        setUser(null); // Clear user state on error
        if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
          });
          errorEmitter.emit('permission-error', permissionError);
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
    // Persist notification to Firestore
    if (firestore) {
      addDoc(collection(firestore, 'notifications'), {
        ...notificationData,
        date: newNotification.date,
        read: false,
      });
    }
  }, [firestore]);

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
    const commonNotification = {
        requesterId: request.requesterId,
        requesterUsername: request.requesterUsername,
        message: 'Solicitud de Alta de Medidor',
        details: request.details,
        link: `/entities#Medidores`,
    };
    addNotification({
      ...commonNotification,
      recipientRole: ROLES.ADMIN,
    });
    addNotification({
      ...commonNotification,
      recipientRole: ROLES.COORDINADOR_SSPP,
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
      status: STATUS.REGISTRADA,
      tipoProgramacion: 'REPROGRAMACION',
      createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      createdBy: user?.username || 'desconocido',
      reprogrammedFromId: oldId,
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

    const cancelInspection = useCallback((recordId: string) => {
    if (!firestore || !user) return;
    
    const docRef = doc(firestore, 'inspections', recordId);
    const updateData: Partial<InspectionRecord> = {
      status: STATUS.DESCARTADO,
      lastModifiedBy: user.username,
      lastModifiedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };
    
    updateDocumentNonBlocking(docRef, updateData);
    
    toast({
      variant: 'destructive',
      title: 'Inspección Descartada',
      description: `El registro ${recordId} ha sido marcado como descartado.`,
    });
  }, [firestore, user, toast]);


  const confirmZone = useCallback((newZone: Zone) => {
    setZone(newZone);
    setIsZoneConfirmed(true);
  }, []);

  const addMultipleEntities = (collectionName: string, idPrefix: string) => (data: any[]) => {
    if (!firestore) return;
    data.forEach(item => {
        const entityId = item.id || `${idPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const docRef = doc(firestore, collectionName, entityId);
        setDocumentNonBlocking(docRef, { ...item, id: entityId }, { merge: true });
    });
  };

  const addMultipleCollaborators = addMultipleEntities('empresas_colaboradoras', 'EC');
  const addMultipleQualityControlCompanies = addMultipleEntities('empresas_control_calidad', 'ECC');
  const addMultipleInspectors = addMultipleEntities('inspectores', 'INSP');
  const addMultipleInstallers = addMultipleEntities('instaladores', 'INST');
  const addMultipleExpansionManagers = addMultipleEntities('gestores_expansion', 'GE');
  const addMultipleSectors = addMultipleEntities('sectores', 'SEC');
  const addMultipleMeters = addMultipleEntities('medidores', 'MDD');
  const addMultipleMunicipios = addMultipleEntities('municipios', 'MUN');
  
  const buildQuery = useCallback((collectionName: string): QueryConstraint[] => {
    if (!user) return [];
    
    const constraints: QueryConstraint[] = [];
    
    // Non-admins (except specific roles) are filtered by zone
    if (user.role !== ROLES.ADMIN && zone !== 'Todas las zonas') {
      if (zone === 'Bajios') {
        constraints.push(where('zone', 'in', ['Bajio Norte', 'Bajio Sur']));
      } else {
        constraints.push(where('zone', '==', zone));
      }
    }
    
    return constraints;
  }, [user, zone]);


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
      addMultipleMunicipios,
      reprogramInspection,
      cancelInspection,
      buildQuery,
    }),
    [
      user, isUserLoading, login, logout, operatorName, zone, isZoneConfirmed, formsEnabled, weekendsEnabled, blockedDays, notifications, devModeEnabled, 
      confirmZone, toggleForms, toggleWeekends, toggleDevMode, addBlockedDay, removeBlockedDay, addNotification, requestPasswordReset, requestNewMeter, markNotificationAsRead, setZone, addMultipleUsers, addMultipleCollaborators, addMultipleQualityControlCompanies, addMultipleInspectors, addMultipleInstallers, addMultipleExpansionManagers, addMultipleSectors, addMultipleMeters, addMultipleMunicipios, reprogramInspection, cancelInspection, buildQuery
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
