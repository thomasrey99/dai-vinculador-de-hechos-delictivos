import { getNormalizadoRows, getVehiculosRows } from './dataSource';
import { CACHE_TTL_SECONDS } from './sheetsConfig';
import { parseNormalizadoRows, resolveHechoGroups } from './entityResolution';
import { buildTrustedPlateMap, aggregateHechos } from './aggregate';
import { buildVehicleEdges, buildMoGeoTimeEdges } from './linking';
import type { DashboardData, HechoDetalle, Intervencion } from './types';

interface CacheEntry {
  data: DashboardData;
  detalles: Map<number, Intervencion[]>;
  timestamp: number;
}

// Se guarda en globalThis para que /api/data y /api/hechos/[id] compartan el
// mismo cache (y por lo tanto los mismos ids de hecho) aunque Next compile cada
// ruta por separado en desarrollo.
const globalStore = globalThis as typeof globalThis & { __dashboardCache?: CacheEntry | null };

async function getCacheEntry(forceRefresh = false): Promise<CacheEntry> {
  const now = Date.now();
  const cached = globalStore.__dashboardCache;
  if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_SECONDS * 1000) {
    return cached;
  }

  const sourceErrors: string[] = [];

  const [normalizadoRaw, vehiculosRaw] = await Promise.all([
    getNormalizadoRows().catch((e) => {
      sourceErrors.push(`No se pudo leer NORMALIZADO: ${e.message || e}`);
      return [];
    }),
    getVehiculosRows().catch((e) => {
      sourceErrors.push(`No se pudo leer base_de_vehiculos: ${e.message || e}`);
      return [];
    }),
  ]);

  if (normalizadoRaw.length === 0) {
    sourceErrors.push('No se leyeron filas de NORMALIZADO — revisá dataSourceConfig.ts / sheetsConfig.ts y las credenciales o rutas locales.');
  }

  const parsedRows = parseNormalizadoRows(normalizadoRaw);
  const groupOf = resolveHechoGroups(parsedRows);
  const trustedByNombre = buildTrustedPlateMap(vehiculosRaw);
  const { hechos, detalles } = aggregateHechos(parsedRows, groupOf, trustedByNombre);

  const { edges: vehicleEdges, edgeKeySet } = buildVehicleEdges(hechos);
  const moEdges = buildMoGeoTimeEdges(hechos, edgeKeySet);

  const data: DashboardData = {
    nodes: hechos,
    edges: [...vehicleEdges, ...moEdges],
    generatedAt: new Date().toISOString(),
    sourceErrors: sourceErrors.length ? sourceErrors : undefined,
  };

  const entry: CacheEntry = { data, detalles, timestamp: now };
  globalStore.__dashboardCache = entry;
  return entry;
}

export async function buildDashboardData(forceRefresh = false): Promise<DashboardData> {
  return (await getCacheEntry(forceRefresh)).data;
}

/** Detalle completo (todas las intervenciones y columnas originales) de un hecho. null si el id no existe. */
export async function getHechoDetalle(id: number): Promise<HechoDetalle | null> {
  const { detalles } = await getCacheEntry(false);
  const intervenciones = detalles.get(id);
  return intervenciones ? { id, intervenciones } : null;
}

export function invalidateCache() {
  globalStore.__dashboardCache = null;
}