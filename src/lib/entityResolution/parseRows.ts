import type { RawRow } from '../sheets';
import type { VehiculoInfo, MoFeatures } from '../types';
import { parseSpanishDate, fixCoordNormalizado, cleanPlate, normAddr, cleanComuna } from '../normalize';
import { computeMoFeatures } from '../moExtraction';

export interface ParsedRow {
  rowId: number;
  NOMBRE: string;
  fechaHecho: Date | null;
  qth: string | null;
  qthNorm: string | null;
  comuna: string | null;
  lat: number | null;
  lon: number | null;
  modalidad: string | null;
  resultado: string | null;
  causaStr: string | null;
  tipoIntervencion: string | null;
  referencia: string | null;
  plates: string[]; // desde las propias columnas DOMINIO 1-9, ya limpias
  plateDetails: Record<string, VehiculoInfo>;
  mo: MoFeatures;
}

function extractOwnPlates(r: RawRow): { plates: string[]; plateDetails: Record<string, VehiculoInfo> } {
  const plates: string[] = [];
  const plateDetails: Record<string, VehiculoInfo> = {};
  for (let i = 1; i <= 9; i++) {
    const p = cleanPlate(r[`DOMINIO ${i}`]);
    if (p) {
      plates.push(p);
      plateDetails[p] = {
        plate: p,
        marca: r[`MARCA ${i}`] || null,
        modelo: r[`MODELO ${i}`] || null,
        color: r[`COLOR ${i}`] || null,
      };
    }
  }
  return { plates, plateDetails };
}

export function parseNormalizadoRows(rawRows: RawRow[]): ParsedRow[] {
  return rawRows.map((r, idx) => {
    const { plates, plateDetails } = extractOwnPlates(r);
    const qth = r['QTH'] || null;
    return {
      rowId: idx,
      NOMBRE: String(r['NOMBRE'] ?? '').trim(),
      fechaHecho: parseSpanishDate(r['FECHA DEL HECHO']),
      qth,
      qthNorm: normAddr(qth),
      comuna: cleanComuna(r['COMUNA']),
      lat: fixCoordNormalizado(r['LATITUD']),
      lon: fixCoordNormalizado(r['LONGITUD']),
      modalidad: r['MODALIDAD'] || null,
      resultado: r['RESULTADO'] || null,
      causaStr: r['N° CAUSA'] ? String(r['N° CAUSA']).trim() : null,
      tipoIntervencion: r['TIPO DE INTERVENCION'] || null,
      referencia: r['REFERENCIA'] || null,
      plates,
      plateDetails,
      mo: computeMoFeatures(r['REFERENCIA']),
    };
  });
}
