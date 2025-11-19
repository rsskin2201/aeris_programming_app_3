export const ROLES = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  COLABORADOR: 'Empresa Colaboradora',
  SOPORTE: 'Soporte a Procesos',
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

export type User = {
  name: string;
  username: string;
  role: Role;
  zone: Zone;
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
    APROBADA: 'APROBADA',
    NO_APROBADA: 'NO APROBADA',
    CANCELADA: 'CANCELADA',
    RESULTADO_REGISTRADO: 'RESULTADO REGISTRADO',
    // Old statuses for compatibility
    Aprobado: 'Aprobado',
    Contemplado: 'Contemplado',
    Pendiente_Aprobacion: 'Pendiente Aprobación',
    Rechazado: 'Rechazado',
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];
