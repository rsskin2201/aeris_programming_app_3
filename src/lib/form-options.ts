'use client';

/**
 * Este archivo centraliza todas las opciones para los campos de selección (listas desplegables)
 * utilizados en los formularios de la aplicación.
 */

// Opciones para formularios de Puesta en Servicio (PES)
export const TIPO_PROGRAMACION_PES = ['SALESFORCE', 'PARRILLA', 'REPROGRAMACION', 'ESPONTANEA'] as const;
export const TIPO_MDD = ['G-1,6', 'G-10', 'G-2,5', 'G-4', 'G-6', 'G-16', 'G-25', 'G-40'] as const;
export const MERCADO = ['ES', 'CN', 'NE', 'SH', 'SP', 'SV'] as const;

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

// Opciones de programación manual para los formularios de inspección
export const MANUAL_PROGRAMACION_OPTIONS = ['PARRILLA', 'ESPONTANEA'] as const;

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
export const FORMA_PAGO = ['PAGO A EC', 'PENDIENTE', 'IACEPTA', 'PAGO POR LOTE', 'OXXO', 'TRANSFERENCIA', 'TIENDA DE CONVENIENCIA'] as const;
export const MOTIVO_CANCELACION = [
    'CLIENTE AUSENTE',
    'CLIENTE CANCELO',
    'CLIENTE NO PERMITE QUE TERMINEN',
    'DEFECTOS EN LA INSTALACION',
    'DIRECCION ERRONEA',
    'EC AUSENTE',
    'EC MANDA CORREO DE CANCELACION',
    'FUGA EN LA INSTALACION',
    'FUGA NO LOCALIZADA',
    'INSPECTOR AUSENTE',
    'INSTALACION NO TERMINADA',
    'NO HAY EQUIPOS PARA LIBERAR',
    'RETIRO DE CERCHA',
    'RETIRO DE MDD/CORREO DE GE',
    'SIN ACCESO A AREA DE MEDIDORES',
    'SIN EQUIPOS',
    'SIN VENTILACION PERMANENTE',
    'YA HABIA MEDIDOR COLGADO',
    'SIN ACCESO',
    'SIN ACOMETIDA',
    'CANCELADA POR BIPISA',
    'MEDIDOR EQUIVOCADO',
] as const;
