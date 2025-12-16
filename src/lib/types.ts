export const ROLES = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  COLABORADOR: 'Empresa Colaboradora',
  SOPORTE: 'Soporte a Procesos',
  COORDINADOR_SSPP: 'Coordinador SSPP',
  CALIDAD: 'Empresa Control de Calidad',
  CANALES: 'Canales',
  VISUAL: 'Visual',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ZONES = [
  'Zona Norte',
  'Zona Centro',
  'Bajio Norte',
  'Bajio Sur',
  'Bajios',
  'Todas las zonas',
] as const;
export type Zone = (typeof ZONES)[number];

export const USER_STATUS = {
    ACTIVO: 'Activo',
    INACTIVO: 'Inactivo',
} as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export type User = {
  id: string; // Firebase Auth UID
  name: string;
  username: string;
  role: Role;
  zone: Zone;
  status: UserStatus;
};

export const MODULES = {
  DASHBOARD: 'dashboard',
  INSPECTIONS: 'inspections',
  CALENDAR: 'calendar',
  RECORDS: 'records',
  ENTITIES: 'entities',
  STATISTICS: 'statistics',
  USERS: 'users',
  SALESFORCE_UPLOAD: 'salesforce_upload',
  USER_UPLOAD: 'user_upload',
  ENTITY_UPLOAD: 'entity_upload',
} as const;

export type Module = (typeof MODULES)[keyof typeof MODULES];

export type ModuleInfo = {
  id: Module;
  name: string;
  description: string;
  path: string;
  icon: React.ElementType;
};

export type BlockedDay = {
    reason: string;
}

export const STATUS = {
    REGISTRADA: 'REGISTRADA',
    CONFIRMADA_POR_GE: 'CONFIRMADA POR GE',
    PROGRAMADA: 'PROGRAMADA',
    EN_PROCESO: 'EN PROCESO',
    PENDIENTE_INFORMAR_DATOS: 'PENDIENTE INFORMAR DATOS',
    APROBADA: 'APROBADA',
    NO_APROBADA: 'NO APROBADA',
    RECHAZADA: 'RECHAZADA',
    CANCELADA: 'CANCELADA',
    FALTA_INFORMACION: 'FALTA INFORMACION',
    CONECTADA: 'CONECTADA',
    DESCARTADO: 'DESCARTADO',
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

export type PasswordResetRequest = {
    id: string;
    username: string;
    email: string;
    date: Date;
};

export type AppNotification = {
    id: string;
    recipientId?: string;
    recipientUsername?: string;
    recipientRole?: Role;
    requesterId?: string;
    requesterUsername?: string;
    message: string;
    details?: string;
    date: Date;
    read: boolean;
    link?: string;
};

export type NewMeterRequest = {
  id: string;
  requesterId: string;
  requesterUsername: string;
  requesterName: string;
  requesterRole: Role;
  zone: Zone;
  marca: string;
  tipo: string;
  date: Date;
  details: string;
}

export type ChangeHistory = {
  id: string;
  inspectionId: string;
  timestamp: string;
  userId: string;
  username: string;
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
}
