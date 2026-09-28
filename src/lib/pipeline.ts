import { getNormalizadoRows, getVehiculosRows } from './dataSource';
import { CACHE_TTL_SECONDS } from './sheetsConfig';
import { parseNormalizadoRows, resolveHechoGroups } from './entityResolution';
import { buildTrustedPlateMap, aggregateHechos } from './aggregate';
import { buildVehicleEdges, buildMoGeoTimeEdges } from './linking';
import type { DashboardData } from './types';

interface CacheEntry {
  data: DashboardData;
  timestamp: number;
}

let cache: CacheEntry | null = null;

export async function buildDashboardData(forceRefresh = false): Promise<DashboardData> {
  const now = Date.now();
  if (!forceRefresh && cache && now - cache.timestamp < CACHE_TTL_SECONDS * 1000) {
    return cache.data;
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
  const hechos = aggregateHechos(parsedRows, groupOf, trustedByNombre);

  const { edges: vehicleEdges, edgeKeySet } = buildVehicleEdges(hechos);
  const moEdges = buildMoGeoTimeEdges(hechos, edgeKeySet);

  const data: DashboardData = {
    nodes: hechos,
    edges: [...vehicleEdges, ...moEdges],
    generatedAt: new Date().toISOString(),
    sourceErrors: sourceErrors.length ? sourceErrors : undefined,
  };

  cache = { data, timestamp: now };
  return data;
}

export function invalidateCache() {
  cache = null;
}
