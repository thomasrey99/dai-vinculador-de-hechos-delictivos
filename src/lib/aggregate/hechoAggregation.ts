import type { ParsedRow } from '../entityResolution';
import type { Hecho, VehiculoInfo } from '../types';
import { toISODate, redactAndTrim } from '../normalize';
import { collectVehiclesForRow } from './vehicleMap';
import { mode } from './statsUtils';
import { buildSearchText } from './searchTextBuilder';

function groupRowsById(rows: ParsedRow[], groupOf: Map<number, number>): Map<number, ParsedRow[]> {
  const groups = new Map<number, ParsedRow[]>();
  rows.forEach((r) => {
    const g = groupOf.get(r.rowId)!;
    const arr = groups.get(g) || [];
    arr.push(r);
    groups.set(g, arr);
  });
  return groups;
}

function average(arr: number[]): number | null {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
}

function aggregateOneGroup(id: number, groupRows: ParsedRow[], trustedByNombre: Map<string, VehiculoInfo[]>): Hecho {
  const sorted = [...groupRows].sort((a, b) => {
    const ta = a.fechaHecho ? a.fechaHecho.getTime() : Infinity;
    const tb = b.fechaHecho ? b.fechaHecho.getTime() : Infinity;
    return ta - tb;
  });
  const first = sorted[0];

  const vehiclesByPlate = new Map<string, VehiculoInfo>();
  groupRows.forEach((r) => {
    collectVehiclesForRow(r, trustedByNombre).forEach((v) => vehiclesByPlate.set(v.plate, v));
  });

  const modalidades = Array.from(new Set(groupRows.map((r) => r.modalidad).filter((m): m is string => !!m)));
  const causas = Array.from(new Set(groupRows.map((r) => r.causaStr).filter((c): c is string => !!c)));

  const lats = groupRows.map((r) => r.lat).filter((v): v is number => v !== null);
  const lons = groupRows.map((r) => r.lon).filter((v): v is number => v !== null);

  const referenciaRow = groupRows.find((r) => r.referencia);
  const comunaRow = groupRows.find((r) => r.comuna);
  const numAutoresVals = groupRows.map((r) => r.mo.num_autores).filter((v): v is number => v !== null);

  const hecho: Hecho = {
    id,
    fecha: toISODate(first.fechaHecho),
    qth: first.qth,
    comuna: comunaRow ? comunaRow.comuna : null,
    lat: average(lats),
    lon: average(lons),
    modalidades,
    resultado: first.resultado,
    causas,
    n_intervenciones: groupRows.length,
    vehicles: Array.from(vehiclesByPlate.values()),
    resumen: redactAndTrim(referenciaRow?.referencia),
    searchText: '',
    mo: {
      num_autores: numAutoresVals.length ? mode(numAutoresVals) : null,
      arma_fuego: groupRows.some((r) => r.mo.arma_fuego),
      arma_blanca: groupRows.some((r) => r.mo.arma_blanca),
      moto: groupRows.some((r) => r.mo.moto),
      inhibidor: groupRows.some((r) => r.mo.inhibidor),
    },
  };
  hecho.searchText = buildSearchText(hecho, groupRows);
  return hecho;
}

/**
 * Agrupa las filas parseadas (ya unidas por resolveHechoGroups) en hechos
 * canónicos, uniendo vehículos, modalidades, causas, etc.
 */
export function aggregateHechos(
  rows: ParsedRow[],
  groupOf: Map<number, number>,
  trustedByNombre: Map<string, VehiculoInfo[]>
): Hecho[] {
  const groups = groupRowsById(rows, groupOf);
  const hechos: Hecho[] = [];
  let nextId = 0;
  groups.forEach((groupRows) => {
    hechos.push(aggregateOneGroup(nextId++, groupRows, trustedByNombre));
  });
  return hechos;
}
