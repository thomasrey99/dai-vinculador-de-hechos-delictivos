import type { RawRow } from '../sheets';
import type { ParsedRow } from '../entityResolution';
import type { Hecho, Intervencion, VehiculoInfo } from '../types';
import { toISODate, redactAndTrim, redactDni } from '../normalize';
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

function sortByFecha(rows: ParsedRow[]): ParsedRow[] {
  return [...rows].sort((a, b) => {
    const ta = a.fechaHecho ? a.fechaHecho.getTime() : Infinity;
    const tb = b.fechaHecho ? b.fechaHecho.getTime() : Infinity;
    return ta - tb;
  });
}

/** Columnas originales no vacías, sin REFERENCIA (ya se muestra como relato) y con DNIs redactados. */
function cleanCampos(raw: RawRow): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!value || key === 'REFERENCIA') continue;
    out[key] = key === 'N° CAUSA' ? value : redactDni(value);
  }
  return out;
}

function buildIntervenciones(
  sortedRows: ParsedRow[],
  trustedByNombre: Map<string, VehiculoInfo[]>
): Intervencion[] {
  return sortedRows.map((r) => ({
    rowId: r.rowId,
    nombre: r.NOMBRE,
    tipoIntervencion: r.tipoIntervencion,
    fecha: toISODate(r.fechaHecho),
    causa: r.causaStr,
    modalidad: r.modalidad,
    resultado: r.resultado,
    qth: r.qth,
    referencia: redactDni(r.referencia),
    vehiculos: collectVehiclesForRow(r, trustedByNombre),
    campos: cleanCampos(r.raw),
  }));
}

function aggregateOneGroup(id: number, groupRows: ParsedRow[], trustedByNombre: Map<string, VehiculoInfo[]>): Hecho {
  const sorted = sortByFecha(groupRows);
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

export interface AggregateResult {
  hechos: Hecho[];
  /** hechoId -> filas originales (intervenciones) que lo forman, para la vista de detalle. */
  detalles: Map<number, Intervencion[]>;
}

/**
 * Agrupa las filas parseadas (ya unidas por resolveHechoGroups) en hechos
 * canónicos, uniendo vehículos, modalidades, causas, etc. Además devuelve,
 * por separado, el detalle completo de cada hecho (sus intervenciones).
 */
export function aggregateHechos(
  rows: ParsedRow[],
  groupOf: Map<number, number>,
  trustedByNombre: Map<string, VehiculoInfo[]>
): AggregateResult {
  const groups = groupRowsById(rows, groupOf);
  const hechos: Hecho[] = [];
  const detalles = new Map<number, Intervencion[]>();
  let nextId = 0;
  groups.forEach((groupRows) => {
    const id = nextId++;
    hechos.push(aggregateOneGroup(id, groupRows, trustedByNombre));
    detalles.set(id, buildIntervenciones(sortByFecha(groupRows), trustedByNombre));
  });
  return { hechos, detalles };
}