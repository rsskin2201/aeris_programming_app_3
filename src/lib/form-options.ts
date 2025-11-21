'use client';

/**
 * Este archivo centraliza todas las opciones para los campos de selección (listas desplegables)
 * utilizados en los formularios de la aplicación.
 */

// Opciones para formularios de Puesta en Servicio (PES)
export const TIPO_PROGRAMACION_PES = ['SALESFORCE', 'PARRILLA', 'REPROGRAMACION', 'ESPONTANEA', 'PEC'] as const;
export const TIPO_MDD = ['G-1,6', 'G-10', 'G-2,5', 'G-4', 'G-6', 'G-16', 'G-25', 'G-40'] as const;
export const MERCADO = ['ES-SV', 'CN', 'NE', 'SH', 'SP', 'SV'] as const;

// Opciones para el formulario de Inspección Masiva
export const TIPO_INSPECCION_MASIVA = [
    'Programacion PES',
    'Retiro de Cercha',
    'Calibracion',
    'Preinspección IRI'
] as const;


// Opciones para formularios de Inspecciones Especiales
export const TIPO_INSPECCION_ESPECIAL = [
    'Retiro de Cercha', 
    'Reclamacion',
    'Calibracion',
    'Terminacion de Obra',
    'Inspección de PH-IRC',
    'PH Monoxido',
    'Pre Inspección IRI',
    'Pre Inspección IRC',
    'Retiro de Termomanografo'
] as const;

export const TIPO_PROGRAMACION_ESPECIAL = ['PARRILLA', 'REPROGRAMACION', 'ESPONTANEA'] as const;

// Opciones para el formulario de Checklist
export const MARCA_MDD = ['ELSTER', 'ITRON', 'METREX', 'HONEYWELL', 'GOLDCARD'] as const;
export const SI_NO = ['Si', 'No'] as const;
export const MATERIAL_TUBERIA = [
    'COBRE',
    'MULTICAPA',
    'COBRE Y MULTICAPA',
    'TUBERIA EXISTENTE',
    'GALVANIZADO',
    'COBRE Y GALVANIZADO',
    'MULTICAPA Y GALVANIZADO',
    'GALVANIZADO Y ACERO'
] as const;
export const EQUIPO = [
    'BOILER DE ACUMULACION',
    'BOILER DE PASO',
    'CALDERA',
    'ESTUFA',
    'ESTUFA/PARRILLA',
    'FREIDORA',
    'HORNO',
    'OTRO',
    'PARRILLA',
    'PLANTA DE LUZ',
    'SECADORA'
] as const;
export const FORMA_PAGO = ['PAGO A EC', 'PENDIENTE', 'IACEPTA', 'PAGO POR LOTE', 'OXXO', 'TRANSFERENCIA'] as const;


// Opciones Centralizadas
export const mockMunicipalities = [
    { id: 'MUN-01', name: 'Guadalajara' },
    { id: 'MUN-02', name: 'Zapopan' },
    { id: 'MUN-03', name: 'Tlaquepaque' },
    { id: 'MUN-04', name: 'Tonalá' },
    { id: 'MUN-05', name: 'Monterrey' },
    { id: 'MUN-06', name: 'San Pedro Garza García' },
    { id: 'MUN-07', name: 'Ciudad de México - Miguel Hidalgo' },
];
