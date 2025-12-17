'use client';

const municipiosPorClave = {
  CDMX: [
    'ALVARO OBREGON',
    'AZCAPOTZALCO',
    'BENITO JUAREZ',
    'COYOACAN',
    'CUAJIMALPA DE MORELOS',
    'CUAUHTEMOC',
    'GUSTAVO A MADERO',
    'IZTACALCO',
    'IZTAPALAPA',
    'LA MAGDALENA CONTRERAS',
    'MIGUEL HIDALGO',
    'TLAHUAC',
    'TLALNEPANTLA',
    'TLALPAN',
    'VENUSTIANO CARRANZA',
    'XOCHIMILCO',
  ],
  TOL: [
    'IXTLAHUACA',
    'LERMA',
    'METEPEC',
    'SAN MATEO ATENCO',
    'TOLUCA',
    'ZINACANTEPEC',
  ],
  VDM: ['HUIXQUILUCAN', 'NAUCALPAN'],
  MTY: [
    'APODACA',
    'CADEREYTA',
    'EL CARMEN',
    'ESCOBEDO',
    'GARCIA',
    'GUADALUPE',
    'JUAREZ',
    'MONTERREY',
    'PESQUERIA',
    'SALINAS VICTORIA',
    'SAN NICOLAS',
    'SAN PEDRO',
    'SANTA CATARINA',
  ],
  AGS: ['AGUASCALIENTES'],
  GTO: [
    'CELAYA',
    'IRAPUATO',
    'LAGOS DE MORENO',
    'LEON',
    'SALAMANCA',
    'SILAO',
  ],
  NVL: ['NUEVO LAREDO'],
  SAL: ['RAMOS ARIZPE', 'SALTILLO', 'ARTEAGA'],
  SLP: ['SAN LUIS POTOSI', 'SOLEDAD G SANCHEZ'],
  ZAC: ['ZACATECAS', 'GUADALUPE'],
};

type SectorClave = keyof typeof municipiosPorClave;

/**
 * Devuelve una lista de municipios basada en una clave encontrada en el nombre del sector.
 * @param nombreSector - El nombre completo del sector (ej. "SECTOR CDMX NORTE").
 * @returns Un array de strings con los nombres de los municipios.
 */
export function getMunicipiosBySector(nombreSector: string): string[] {
  if (!nombreSector) {
    return [];
  }

  const sectorUpper = nombreSector.toUpperCase();
  
  for (const clave in municipiosPorClave) {
    if (sectorUpper.includes(clave)) {
      return municipiosPorClave[clave as SectorClave];
    }
  }

  return [];
}
