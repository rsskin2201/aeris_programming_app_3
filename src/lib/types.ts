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

export type CollaboratorCompany = {
    id: string;
    name: string;
    rfc: string;
    codSap: string;
    zone: Zone;
    status: 'Activa' | 'Inactiva' | 'Deshabilitada';
    created_at: string;
}

export type QualityControlCompany = {
  id: string;
  name: string;
  rfc: string;
  zone: Zone;
  status: 'Activa' | 'Inactiva' | 'Deshabilitada';
  created_at: string;
}

export type Inspector = {
    id: string;
    name: string;
    position: 'Inspector';
    qualityCompany: string;
    certStartDate: string;
    certEndDate: string;
    status: 'Activo' | 'Inactivo' | 'Deshabilitado';
    createdAt: string;
    zone: Zone;
};


export type Installer = {
    id: string;
    name: string;
    position: 'Instalador';
    collaboratorCompany: string;
    certStartDate: string;
    certEndDate: string;
    status: 'Activo' | 'Inactivo' | 'Deshabilitado';
    createdAt: string;
    zone: Zone;
};

export type ExpansionManager = {
    id: string;
    name: string;
    position: 'Gestor de Expansion';
    zone: Zone;
    assignment: 'Expansión' | 'Saturación' | 'Ambos';
    subAssignment: string;
    status: 'Activo' | 'Inactivo' | 'Deshabilitado';
    createdAt: string;
}

export type Sector = {
    id: string;
    zone: Zone;
    assignment: 'Expansión' | 'Saturación' | 'Ambos';
    subAssignment: string;
    sector: string;
    sectorKey: string;
    status: 'Activo' | 'Inactivo' | 'Deshabilitado';
    createdAt: string;
};

export type Meter = {
  id: string;
  marca: string;
  tipo: string;
  zona: Zone;
  status: 'Activo' | 'Inactivo';
  createdAt: string;
};

export type Municipio = {
  id: string;
  nombre: string;
  zona: Zone;
  sectorId: string;
  status: 'Activo' | 'Inactivo' | 'Deshabilitado';
  createdAt: string;
}

export type InspectionRecord = {
  id: string;
  type: 'Individual PES' | 'Masiva PES' | 'Especial' | string;
  address: string;
  client: string;
  requestDate: string; // yyyy-MM-dd
  createdAt: string; // yyyy-MM-dd HH:mm:ss
  createdBy: string;
  status: Status;
  inspector: string;
  zone: Zone;
  gestor: string;
  collaboratorCompany: string;
  sector: string;
  poliza: string;
  caso: string;
  serieMdd?: string;
  mercado: string;
  horarioProgramacion: string;
  observaciones?: string;

  // Checklist fields
  municipality?: string;
  colonia?: string;
  calle?: string;
  numero?: string;
  portal?: string;
  escalera?: string;
  piso?: string;
  puerta?: string;
  tipoInspeccion?: string;
  tipoProgramacion?: string;
  tipoMdd?: string;
  oferta?: string;
  grupoMercado?: string;
  semana?: string;
  marcaMdd?: string;
  tipoMddCampo?: string;
  presion?: string;
  folioIt?: string;
  precinto?: string;
  epp?: string;
  controlPrevio?: string;
  mtsInstalados?: string;
  materialTuberia?: string;
  folioChecklist?: string;
  defectosCorregidos?: string;
  defectosNoCorregidos?: string;
  horaEntrada?: string;
  horaSalida?: string;
  ventilaPreexistente?: string;
  ventilacionEcc?: string;
  aparatosConectados?: string;
  equipo_1?: string;
  marca_eq1?: string;
  coCor_eq1?: string;
  coAmb_eq1?: string;
  equipo_2?: string;
  marca_eq2?: string;
  coCor_eq2?: string;
  coAmb_eq2?: string;
  equipo_3?: string;
  marca_eq3?: string;
  coCor_eq3?: string;
  coAmb_eq3?: string;
  equipo_4?: string;
  marca_eq4?: string;
  coCor_eq4?: string;
  coAmb_eq4?: string;
  equipo_5?: string;
  marca_eq5?: string;
  coCor_eq5?: string;
  coAmb_eq5?: string;
  nombreCliente?: string;
  telCliente?: string;
  motivoCancelacion?: string;
  comentariosOca?: string;
  formaDePago?: string;
  equipoExtra?: string;
  capturista?: string;
  hraDeAudio?: string;
  infFormasPago?: string;
  altaSms?: string;
  appNaturgy?: string;
  entregaGuia?: string;

  // Support Validation Fields
  fechaConexion?: string;
  datosConfirmados?: boolean;
  observacionesSoporte?: string;
  tipoRechazo?: string;
  motivoRechazo?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;

  // Reprogramación fields
  reprogrammedFromId?: string;
  reprogrammedToId?: string;
};
