import type { Hecho, Edge } from '../types';
import { haversineMeters } from '../normalize/coordinates';
import { daysBetweenISO } from '../normalize/dates';
import { LINKING_DEFAULTS } from '../sheetsConfig';

export interface MoGeoTimeOptions {
  radiusMeters?: number;
  daysWindow?: number;
  excludedModalidades?: string[];
}

const METERS_PER_DEGREE_LAT = 111_320;

function degreesLat(meters: number): number {
  return meters / METERS_PER_DEGREE_LAT;
}
function degreesLon(meters: number, atLat: number): number {
  const metersPerDegreeLon = METERS_PER_DEGREE_LAT * Math.cos((atLat * Math.PI) / 180);
  return meters / Math.max(metersPerDegreeLon, 1);
}

/** Agrupa hechos válidos (con coords+fecha+modalidad, sin las excluidas) por modalidad primaria. */
function groupByModalidad(hechos: Hecho[], excluded: Set<string>): Map<string, Hecho[]> {
  const byModalidad = new Map<string, Hecho[]>();
  hechos.forEach((h) => {
    if (h.lat === null || h.lon === null || !h.fecha) return;
    const primary = h.modalidades[0];
    if (!primary || excluded.has(primary)) return;
    const arr = byModalidad.get(primary) || [];
    arr.push(h);
    byModalidad.set(primary, arr);
  });
  return byModalidad;
}

/**
 * Ubica cada hecho en una celda de grilla de ~radiusMeters de lado. Así, para
 * encontrar posibles vecinos de un hecho alcanza con mirar su celda y las 8
 * celdas alrededor, en vez de comparar contra TODOS los hechos de la
 * modalidad — evita el O(n²) que se vuelve inmanejable con datasets grandes.
 */
function buildGrid(group: Hecho[], radiusMeters: number): Map<string, Hecho[]> {
  const grid = new Map<string, Hecho[]>();
  const cellSizeM = Math.max(radiusMeters, 100);
  group.forEach((h) => {
    const dLat = degreesLat(cellSizeM);
    const dLon = degreesLon(cellSizeM, h.lat!);
    const cx = Math.floor(h.lon! / dLon);
    const cy = Math.floor(h.lat! / dLat);
    const key = `${cx}:${cy}`;
    const arr = grid.get(key) || [];
    arr.push(h);
    grid.set(key, arr);
  });
  return grid;
}

function cellCoords(key: string): [number, number] {
  const [cx, cy] = key.split(':').map((v) => parseInt(v, 10));
  return [cx, cy];
}

/**
 * Si una modalidad tiene demasiados hechos (dataset online muy extenso),
 * evitamos comparar contra todo el historial: nos quedamos con los N más
 * recientes para el análisis de MO+geo+tiempo. Los hechos descartados siguen
 * apareciendo igual en el mapa, solo no generan estas aristas.
 */
function capToRecent(group: Hecho[], maxSize: number): Hecho[] {
  if (group.length <= maxSize) return group;
  return [...group].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).slice(0, maxSize);
}

/** Aristas por misma modalidad + cercanía geográfica y temporal. */
export function buildMoGeoTimeEdges(
  hechos: Hecho[],
  excludeKeys: Set<string>,
  opts: MoGeoTimeOptions = {}
): Edge[] {
  const radiusMeters = opts.radiusMeters ?? LINKING_DEFAULTS.radiusMetersMax;
  const daysWindow = opts.daysWindow ?? LINKING_DEFAULTS.daysWindowMax;
  const excluded = new Set(opts.excludedModalidades ?? LINKING_DEFAULTS.excludedModalidades);
  const maxBucketSize = LINKING_DEFAULTS.maxModalidadBucketSize;
  const maxTotalEdges = LINKING_DEFAULTS.maxMoEdges;

  const byModalidad = groupByModalidad(hechos, excluded);
  const edges: Edge[] = [];
  const seenPairs = new Set<string>();

  outer: for (const [modalidad, rawGroup] of byModalidad) {
    const group = capToRecent(rawGroup, maxBucketSize);
    const grid = buildGrid(group, radiusMeters);

    for (const [key, cellPoints] of grid) {
      const [cx, cy] = cellCoords(key);
      const neighborPoints: Hecho[] = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const arr = grid.get(`${cx + dx}:${cy + dy}`);
          if (arr) neighborPoints.push(...arr);
        }
      }

      for (const ha of cellPoints) {
        for (const hb of neighborPoints) {
          if (ha.id >= hb.id) continue; // cada par se procesa una sola vez
          const pairKey = `${ha.id}-${hb.id}`;
          if (seenPairs.has(pairKey)) continue;
          seenPairs.add(pairKey);

          const days = daysBetweenISO(ha.fecha, hb.fecha);
          if (days === null || days > daysWindow) continue;
          const dist = haversineMeters(ha.lat!, ha.lon!, hb.lat!, hb.lon!);
          if (dist > radiusMeters) continue;

          const edgeKey = `${Math.min(ha.id, hb.id)}-${Math.max(ha.id, hb.id)}`;
          if (excludeKeys.has(edgeKey)) continue;

          edges.push({
            a: Math.min(ha.id, hb.id), b: Math.max(ha.id, hb.id), type: 'mo_geo_tiempo',
            detail: `Mismo MO "${modalidad}", ${Math.round(dist)}m, ${days}d de diferencia`,
            weight: 1, dist_m: Math.round(dist), days_diff: days, modalidad,
          });

          if (edges.length >= maxTotalEdges) break outer;
        }
      }
    }
  }

  return edges;
}
