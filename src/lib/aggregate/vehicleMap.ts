import type { RawRow } from '../sheets';
import type { ParsedRow } from '../entityResolution';
import type { VehiculoInfo } from '../types';
import { cleanPlate } from '../normalize';

/** Construye un mapa NOMBRE -> lista de vehículos confiables, desde base_de_vehiculos. */
export function buildTrustedPlateMap(vehiculosRows: RawRow[]): Map<string, VehiculoInfo[]> {
  const map = new Map<string, VehiculoInfo[]>();
  for (const r of vehiculosRows) {
    const estado = (r['ESTADO_DOMINIO'] || '').toUpperCase();
    if (estado !== 'COMPLETO' && estado !== 'PARCIAL') continue;
    const plate = cleanPlate(r['DOMINIO']);
    if (!plate) continue;
    const nombre = String(r['NOMBRE'] ?? '').trim();
    const info: VehiculoInfo = {
      plate,
      marca: r['MARCA'] || null,
      modelo: r['MODELO'] || null,
      color: r['COLOR'] || null,
      tipo: r['TIPO'] || null,
    };
    const arr = map.get(nombre) || [];
    arr.push(info);
    map.set(nombre, arr);
  }
  return map;
}

/** Une los vehículos confiables (por NOMBRE) con los que la propia fila trae en sus columnas DOMINIO 1-9. */
export function collectVehiclesForRow(row: ParsedRow, trustedByNombre: Map<string, VehiculoInfo[]>): VehiculoInfo[] {
  const byPlate = new Map<string, VehiculoInfo>();
  for (const v of trustedByNombre.get(row.NOMBRE) || []) {
    byPlate.set(v.plate, v);
  }
  for (const p of row.plates) {
    if (!byPlate.has(p)) {
      byPlate.set(p, row.plateDetails[p] || { plate: p });
    }
  }
  return Array.from(byPlate.values());
}
