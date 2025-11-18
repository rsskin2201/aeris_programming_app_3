import { Role, ROLES, User, Zone } from '@/lib/types';

export const mockUsers: User[] = [
  { name: 'Admin User', username: 'admin', role: ROLES.ADMIN },
  { name: 'Gerardo Gestor', username: 'gestor', role: ROLES.GESTOR },
  { name: 'Ana Colaboradora', username: 'colaboradora', role: ROLES.COLABORADOR },
  { name: 'Sofia Soporte', username: 'soporte', role: ROLES.SOPORTE },
  { name: 'Carla Calidad', username: 'calidad', role: ROLES.CALIDAD },
  { name: 'Carlos Canales', username: 'canales', role: ROLES.CANALES },
  { name: 'Victor Visual', username: 'visual', role: ROLES.VISUAL },
];

export type InspectionRecord = {
  id: string;
  type: 'Individual PES' | 'Masiva PES' | 'Especial';
  address: string;
  client: string;
  requestDate: string;
  status: 'Pendiente Aprobación' | 'Contemplado' | 'Aprobado' | 'Rechazado';
  inspector: string;
};

export const mockRecords: InspectionRecord[] = [
  { id: 'INS-001', type: 'Individual PES', address: 'Av. Siempre Viva 742', client: 'Springfield Power Plant', requestDate: '2024-07-15', status: 'Aprobado', inspector: 'Juan Pérez' },
  { id: 'INS-002', type: 'Especial', address: 'Calle Falsa 123', client: 'Kwik-E-Mart', requestDate: '2024-07-16', status: 'Contemplado', inspector: 'Maria Garcia' },
  { id: 'INS-003', type: 'Masiva PES', address: 'Blvd. del Ocaso 450', client: 'Residencial Ocaso', requestDate: '2024-07-18', status: 'Pendiente Aprobación', inspector: 'N/A' },
  { id: 'INS-004', type: 'Individual PES', address: 'Paseo de la Reforma 222', client: 'Torre Mayor Oficinas', requestDate: '2024-07-20', status: 'Rechazado', inspector: 'N/A' },
  { id: 'INS-005', type: 'Individual PES', address: 'Insurgentes Sur 300', client: 'Comercial del Sur', requestDate: '2024-07-21', status: 'Aprobado', inspector: 'Juan Pérez' },
];

export const mockInstallerCompanies = [
  { id: 'IC-01', name: 'Instalaciones Modernas S.A.' },
  { id: 'IC-02', name: 'GasSeguro de México' },
  { id: 'IC-03', name: 'Conectando Hogares S. de R.L.' },
];

export const mockInstallers = [
  { id: 'INST-001', name: 'Mario Hernández', companyId: 'IC-01' },
  { id: 'INST-002', name: 'Luisa Fernández', companyId: 'IC-01' },
  { id: 'INST-003', name: 'Roberto Díaz', companyId: 'IC-02' },
  { id: 'INST-004', name: 'Patricia Alarcón', companyId: 'IC-03' },
];

export const mockSectors = [
  { id: 'SEC-01', name: 'Residencial A' },
  { id: 'SEC-02', name: 'Comercial Centro' },
  { id: 'SEC-03', name: 'Industrial Norte' },
  { id: 'SEC-04', name: 'Residencial B-1' },
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
    { id: 'EC-001', name: 'GasLink S.A. de C.V.', rfc: 'GLI010203AB4', zone: 'Zona Norte', status: 'Activa', created_at: '2023-01-15' },
    { id: 'EC-002', name: 'ServiGas del Norte', rfc: 'SGN050607CD8', zone: 'Zona Norte', status: 'Activa', created_at: '2023-02-20' },
    { id: 'EC-003', name: 'Conexiones Seguras', rfc: 'CSE101112EFG', zone: 'Bajio Norte', status: 'Inactiva', created_at: '2023-03-10' },
    { id: 'EC-004', name: 'Energía Confiable', rfc: 'ECO151213HIJ', zone: 'Zona Centro', status: 'Deshabilitada', created_at: '2023-04-05' },
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
  { id: 'ECC-001', name: 'VeriGas Calidad Total', rfc: 'VGT010101XYZ', zone: 'Zona Centro', status: 'Activa', created_at: '2022-11-30' },
  { id: 'ECC-002', name: 'Inspecciones Precisas S.C.', rfc: 'IPE020202ABC', zone: 'Bajio Sur', status: 'Activa', created_at: '2023-05-18' },
  { id: 'ECC-003', name: 'Control y Seguridad Energética', rfc: 'CSE030303DEF', zone: 'Zona Norte', status: 'Inactiva', created_at: '2023-08-01' },
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
};

export const sampleInspectors: Inspector[] = [
    { id: 'INSP-001', name: 'Juan Pérez', position: 'Inspector', qualityCompany: 'VeriGas Calidad Total', certStartDate: '2024-01-01', certEndDate: '2025-01-01', status: 'Activo', createdAt: '2023-12-15' },
    { id: 'INSP-002', name: 'María García', position: 'Inspector', qualityCompany: 'Inspecciones Precisas S.C.', certStartDate: '2023-06-01', certEndDate: '2024-06-01', status: 'Activo', createdAt: '2023-05-20' },
    { id: 'INSP-003', name: 'Carlos Sánchez', position: 'Inspector', qualityCompany: 'VeriGas Calidad Total', certStartDate: '2024-03-15', certEndDate: '2025-03-15', status: 'Inactivo', createdAt: '2024-03-01' },
];
