export const ROLES = {
  ADMIN: 'Administrador',
  COLABORADOR: 'Empresa Colaboradora',
  GESTOR: 'Gestor de Expansión',
  CALIDAD: 'Empresa de Control de Calidad',
  SOPORTE: 'Soporte a Procesos',
  CANALES: 'Canales',
  VISUAL: 'Visual User',
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
};

export const MODULES = {
  DASHBOARD: 'dashboard',
  INSPECTIONS: 'inspections',
  CALENDAR: 'calendar',
  RECORDS: 'records',
  ENTITIES: 'entities',
  STATISTICS: 'statistics',
  USERS: 'users',
} as const;

export type Module = (typeof MODULES)[keyof typeof MODULES];

export type ModuleInfo = {
  id: Module;
  name: string;
  description: string;
  path: string;
  icon: React.ElementType;
};
