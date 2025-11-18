import { Role, ROLES, User } from '@/lib/types';

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
