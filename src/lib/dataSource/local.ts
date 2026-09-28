import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import type { RawRow } from '../sheets';

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

/**
 * Lee la primera hoja de un .xlsx local y la devuelve como array de objetos,
 * usando la primera fila como encabezado — mismo formato que
 * fetchSheetAsObjects, para que el resto del pipeline no note la diferencia.
 */
export function readLocalXlsxAsObjects(relativeOrAbsolutePath: string): RawRow[] {
  const absPath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(process.cwd(), relativeOrAbsolutePath);

  if (!fs.existsSync(absPath)) {
    throw new Error(
      `No se encontró el archivo local "${relativeOrAbsolutePath}" (buscado en ${absPath}). ` +
        'Verificá dataSourceConfig.ts o las variables LOCAL_NORMALIZADO_PATH / LOCAL_VEHICULOS_PATH.'
    );
  }

  const workbook = XLSX.readFile(absPath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });

  return rawRows.map((row) => {
    const obj: RawRow = {};
    Object.entries(row).forEach(([key, value]) => {
      obj[key.trim()] = cellToString(value);
    });
    return obj;
  });
}
