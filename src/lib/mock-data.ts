import { Role, ROLES, User, Zone, ZONES, Status, STATUS, UserStatus, USER_STATUS } from '@/lib/types';

export const mockUsers: User[] = [
  { name: 'Admin User', username: 'admin', role: ROLES.ADMIN, zone: 'Todas las zonas', status: USER_STATUS.ACTIVO },
  { name: 'Gerardo Gestor', username: 'gestor', role: ROLES.GESTOR, zone: 'Zona Norte', status: USER_STATUS.ACTIVO },
  { name: 'Ana Colaboradora', username: 'colaboradora', role: ROLES.COLABORADOR, zone: 'Bajio Norte', status: USER_STATUS.ACTIVO },
  { name: 'Sofia Soporte', username: 'soporte', role: ROLES.SOPORTE, zone: 'Zona Centro', status: USER_STATUS.ACTIVO },
  { name: 'Samuel Coordinador', username: 'coordinador', role: ROLES.COORDINADOR_SSPP, zone: 'Todas las zonas', status: USER_STATUS.ACTIVO },
  { name: 'Carla Calidad', username: 'calidad', role: ROLES.CALIDAD, zone: 'Bajio Sur', status: USER_STATUS.ACTIVO },
  { name: 'Carlos Canales', username: 'canales', role: ROLES.CANALES, zone: 'Todas las zonas', status: USER_STATUS.ACTIVO },
  { name: 'Victor Visual', username: 'visual', role: ROLES.VISUAL, zone: 'Todas las zonas', status: USER_STATUS.INACTIVO },
];

export type InspectionRecord = {
  id: string;
  type: 'Individual PES' | 'Masiva PES' | 'Especial' | string;
  address: string;
  client: string;
  requestDate: string;
  createdAt: string;
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
  horarioProgramacion?: string;
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
};

export const mockRecords: InspectionRecord[] = [
  { id: 'INS-001', type: 'Individual PES', address: 'Av. Siempre Viva 742', client: 'Springfield Power Plant', requestDate: '2024-07-15', createdAt: '2024-07-14 10:30', createdBy: 'gestor', status: STATUS.APROBADA, inspector: 'Juan Pérez', zone: 'Zona Norte', gestor: 'RICARDO MENDOZA', collaboratorCompany: 'GASLINK S.A. DE C.V.', sector: 'SANTA FE', poliza: 'P-12345', caso: 'AT-0000001', serieMdd: 'MDD-001', mercado: 'ES-SV', horarioProgramacion: '10:00' },
  { id: 'INS-002', type: 'Especial', address: 'Calle Falsa 123', client: 'Kwik-E-Mart', requestDate: '2024-07-16', createdAt: '2024-07-15 11:00', createdBy: 'colaboradora', status: STATUS.PROGRAMADA, inspector: 'Maria Garcia', zone: 'Zona Centro', gestor: 'VERÓNICA LUNA', collaboratorCompany: 'SERVIGAS DEL NORTE', sector: 'CENTRO', poliza: 'P-67890', caso: 'AT-0000002', serieMdd: 'MDD-002', mercado: 'CN', horarioProgramacion: '11:00' },
  { id: 'INS-003', type: 'Masiva PES', address: 'Blvd. del Ocaso 450', client: 'Residencial Ocaso', requestDate: '2024-07-18', createdAt: '2024-07-17 14:00', createdBy: 'admin', status: STATUS.PENDIENTE_INFORMAR_DATOS, inspector: 'N/A', zone: 'Bajio Norte', gestor: 'ALEJANDRO SOLIS', collaboratorCompany: 'CONEXIONES SEGURAS', sector: 'INDUSTRIAL QUERETARO', poliza: 'P-11223', caso: 'AT-0000003', serieMdd: 'MDD-003', mercado: 'NE', horarioProgramacion: '14:00' },
  { id: 'INS-004', type: 'Individual PES', address: 'Paseo de la Reforma 222', client: 'Torre Mayor Oficinas', requestDate: '2024-07-20', createdAt: '2024-07-19 09:15', createdBy: 'gestor', status: STATUS.NO_APROBADA, inspector: 'N/A', zone: 'Bajio Sur', gestor: 'RICARDO MENDOZA', collaboratorCompany: 'ENERGÍA CONFIABLE', sector: 'SANTA FE', poliza: 'P-44556', caso: 'AT-0000004', serieMdd: 'MDD-004', mercado: 'SH', horarioProgramacion: '09:00' },
  { id: 'INS-005', type: 'Individual PES', address: 'Insurgentes Sur 300', client: 'Comercial del Sur', requestDate: '2024-07-21', createdAt: '2024-07-20 16:45', createdBy: 'colaboradora', status: STATUS.APROBADA, inspector: 'Juan Pérez', zone: 'Zona Norte', gestor: 'VERÓNICA LUNA', collaboratorCompany: 'GASLINK S.A. DE C.V.', sector: 'CENTRO', poliza: 'P-77889', caso: 'AT-0000005', serieMdd: 'MDD-005', mercado: 'SP', horarioProgramacion: '16:00' },
];

export const mockInstallerCompanies = [
  { id: 'IC-01', name: 'Instalaciones Modernas S.A.' },
  { id: 'IC-02', name: 'GasSeguro de México' },
  { id: 'IC-03', name: 'Conectando Hogares S. de R.L.' },
];

export const mockInstallers = [
  { id: 'INST-001', name: 'Mario Hernández', companyId: 'IC-01', certEndDate: '2025-01-01', status: 'Activo' },
  { id: 'INST-002', name: 'Luisa Fernández', companyId: 'IC-01', certEndDate: '2024-08-01', status: 'Activo' },
  { id: 'INST-003', name: 'Roberto Díaz', companyId: 'IC-02', certEndDate: '2025-03-15', status: 'Activo' },
  { id: 'INST-004', name: 'Patricia Alarcón', companyId: 'IC-03', certEndDate: '2024-12-01', status: 'Inactivo' },
];


export const mockMunicipalities = [
    { id: 'MUN-01', name: 'Guadalajara' },
    { id: 'MUN-02', name: 'Zapopan' },
    { id: 'MUN-03', name: 'Tlaquepaque' },
    { id: 'MUN-04', name: 'Tonalá' },
    { id: 'MUN-05', name: 'Monterrey' },
    { id: 'MUN-06', name: 'San Pedro Garza García' },
    { id: 'MUN-07', name: 'Ciudad de México - Miguel Hidalgo' },
];

export type CollaboratorCompany = {
    id: string;
    name: string;
    rfc: string;
    zone: Zone;
    status: 'Activa' | 'Inactiva' | 'Deshabilitada';
    created_at: string;
}

export const sampleCollaborators: CollaboratorCompany[] = [
    { id: 'EC-001', name: 'GASLINK S.A. DE C.V.', rfc: 'GLI010203AB4', zone: 'Zona Norte', status: 'Activa', created_at: '2023-01-15' },
    { id: 'EC-002', name: 'SERVIGAS DEL NORTE', rfc: 'SGN050607CD8', zone: 'Zona Norte', status: 'Activa', created_at: '2023-02-20' },
    { id: 'EC-003', name: 'CONEXIONES SEGURAS', rfc: 'CSE101112EFG', zone: 'Bajio Norte', status: 'Inactiva', created_at: '2023-03-10' },
    { id: 'EC-004', name: 'ENERGÍA CONFIABLE', rfc: 'ECO151213HIJ', zone: 'Zona Centro', status: 'Deshabilitada', created_at: '2023-04-05' },
];

export type QualityControlCompany = {
  id: string;
  name: string;
  rfc: string;
  zone: Zone;
  status: 'Activa' | 'Inactiva' | 'Deshabilitada';
  created_at: string;
}

export const sampleQualityControlCompanies: QualityControlCompany[] = [
  { id: 'ECC-001', name: 'VERIGAS CALIDAD TOTAL', rfc: 'VGT010101XYZ', zone: 'Zona Centro', status: 'Activa', created_at: '2022-11-30' },
  { id: 'ECC-002', name: 'INSPECCIONES PRECISAS S.C.', rfc: 'IPE020202ABC', zone: 'Bajio Sur', status: 'Activa', created_at: '2023-05-18' },
  { id: 'ECC-003', name: 'CONTROL Y SEGURIDAD ENERGÉTICA', rfc: 'CSE030303DEF', zone: 'Zona Norte', status: 'Inactiva', created_at: '2023-08-01' },
];

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

export const sampleInspectors: Inspector[] = [
    { id: 'INSP-001', name: 'JUAN PÉREZ', position: 'Inspector', qualityCompany: 'VERIGAS CALIDAD TOTAL', certStartDate: '2024-01-01', certEndDate: '2025-01-01', status: 'Activo', createdAt: '2023-12-15', zone: 'Zona Centro' },
    { id: 'INSP-002', name: 'MARÍA GARCÍA', position: 'Inspector', qualityCompany: 'INSPECCIONES PRECISAS S.C.', certStartDate: '2023-06-01', certEndDate: '2024-06-01', status: 'Activo', createdAt: '2023-05-20', zone: 'Bajio Sur' },
    { id: 'INSP-003', name: 'CARLOS SÁNCHEZ', position: 'Inspector', qualityCompany: 'VERIGAS CALIDAD TOTAL', certStartDate: '2024-03-15', certEndDate: '2025-03-15', status: 'Inactivo', createdAt: '2024-03-01', zone: 'Zona Norte' },
];


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

export const sampleInstallers: Installer[] = [
    { id: 'INST-001', name: 'PEDRO RAMIREZ', position: 'Instalador', collaboratorCompany: 'GASLINK S.A. DE C.V.', certStartDate: '2024-02-01', certEndDate: '2025-02-01', status: 'Activo', createdAt: '2024-01-15', zone: 'Zona Norte' },
    { id: 'INST-002', name: 'LAURA JUAREZ', position: 'Instalador', collaboratorCompany: 'SERVIGAS DEL NORTE', certStartDate: '2023-08-01', certEndDate: '2024-08-01', status: 'Activo', createdAt: '2023-07-20', zone: 'Zona Norte' },
    { id: 'INST-003', name: 'FERNANDO GONZALEZ', position: 'Instalador', collaboratorCompany: 'CONEXIONES SEGURAS', certStartDate: '2024-05-15', certEndDate: '2025-05-15', status: 'Inactivo', createdAt: '2024-05-01', zone: 'Bajio Norte' },
];

export type ExpansionManager = {
    id: string;
    name: string;
    position: 'Gestor de Expansion';
    zone: Zone;
    assignment: 'Expansión' | 'Saturación';
    subAssignment: string;
    status: 'Activo' | 'Inactivo' | 'Deshabilitado';
    createdAt: string;
}

export const sampleExpansionManagers: ExpansionManager[] = [
    { id: 'GE-001', name: 'RICARDO MENDOZA', position: 'Gestor de Expansion', zone: 'Zona Norte', assignment: 'Expansión', subAssignment: 'SECTOR RESIDENCIAL NORTE', status: 'Activo', createdAt: '2023-01-20' },
    { id: 'GE-002', name: 'VERÓNICA LUNA', position: 'Gestor de Expansion', zone: 'Zona Centro', assignment: 'Saturación', subAssignment: 'COMERCIAL CENTRO HISTÓRICO', status: 'Activo', createdAt: '2023-02-25' },
    { id: 'GE-003', name: 'ALEJANDRO SOLIS', position: 'Gestor de Expansion', zone: 'Bajio Norte', assignment: 'Expansión', subAssignment: 'PARQUE INDUSTRIAL QUERÉTARO', status: 'Inactivo', createdAt: '2023-04-12' },
];

export type Sector = {
    id: string;
    zone: Zone;
    assignment: 'Expansión' | 'Saturación';
    subAssignment: string;
    sector: string;
    sectorKey: string;
    status: 'Activo' | 'Inactivo' | 'Deshabilitado';
    createdAt: string;
};

export const sampleSectors: Sector[] = [
    { id: 'SEC-001', zone: 'Zona Norte', assignment: 'Expansión', subAssignment: 'RESIDENCIAL SANTA FE', sector: 'SANTA FE', sectorKey: 'SF01', status: 'Activo', createdAt: '2023-01-10' },
    { id: 'SEC-002', zone: 'Zona Centro', assignment: 'Saturación', subAssignment: 'CENTRO HISTORICO', sector: 'CENTRO', sectorKey: 'CEN01', status: 'Activo', createdAt: '2023-02-15' },
    { id: 'SEC-003', zone: 'Bajio Norte', assignment: 'Expansión', subAssignment: 'PARQUE INDUSTRIAL', sector: 'INDUSTRIAL QUERETARO', sectorKey: 'INDQRO', status: 'Inactivo', createdAt: '2023-03-20' },
];
