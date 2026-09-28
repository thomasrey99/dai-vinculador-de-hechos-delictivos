import type { RawRow } from '../sheets';
import { fetchAndUnionSheets, fetchSheetAsObjects } from '../sheets';
import { NORMALIZADO_SHEETS, VEHICULOS_SHEET } from '../sheetsConfig';
import { DATA_SOURCE, LOCAL_FILES } from '../dataSourceConfig';
import { readLocalXlsxAsObjects } from './local';

export async function getNormalizadoRows(): Promise<RawRow[]> {
  if (DATA_SOURCE === 'local') {
    return readLocalXlsxAsObjects(LOCAL_FILES.normalizado);
  }
  return fetchAndUnionSheets(NORMALIZADO_SHEETS);
}

export async function getVehiculosRows(): Promise<RawRow[]> {
  if (DATA_SOURCE === 'local') {
    return readLocalXlsxAsObjects(LOCAL_FILES.vehiculos);
  }
  return fetchSheetAsObjects(VEHICULOS_SHEET);
}
