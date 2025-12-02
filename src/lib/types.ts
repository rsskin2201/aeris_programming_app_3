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
  email: string;
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
    PENDIENTE_CORRECCION: 'PENDIENTE CORRECCION',
    CONECTADA: 'CONECTADA',
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

export type PasswordResetRequest = {
    id: string;
    username: string;
    email: string;
    date: Date;
    recipientRole: Role;
};

export type AppNotification = {
    id: string;
    recipientUsername: string;
    message: string;
    date: Date;
    read: boolean;
    link?: string;
}
