export interface VehiculoInfo {
  plate: string;
  marca?: string | null;
  modelo?: string | null;
  color?: string | null;
  tipo?: string | null;
}

export interface MoFeatures {
  num_autores: number | null;
  arma_fuego: boolean;
  arma_blanca: boolean;
  moto: boolean;
  inhibidor: boolean;
}

export interface Hecho {
  id: number;
  fecha: string | null; // YYYY-MM-DD
  qth: string | null;
  comuna: string | null;
  lat: number | null;
  lon: number | null;
  modalidades: string[];
  resultado: string | null;
  causas: string[];
  n_intervenciones: number;
  vehicles: VehiculoInfo[];
  resumen: string;
  /** Texto normalizado (minúsculas, sin acentos) con TODOS los campos, usado solo para el buscador. No se muestra. */
  searchText: string;
  mo: MoFeatures;
}

/**
 * Una fila original de la planilla que forma parte de un hecho (un mismo hecho
 * puede tener varias intervenciones/expedientes). Solo se pide bajo demanda,
 * vía /api/hechos/[id], para no inflar el payload de /api/data.
 */
export interface Intervencion {
  rowId: number;
  nombre: string;
  tipoIntervencion: string | null;
  fecha: string | null;
  causa: string | null;
  modalidad: string | null;
  resultado: string | null;
  qth: string | null;
  /** Relato completo (sin truncar), con DNIs redactados. */
  referencia: string;
  /** Vehículos asociados a esta intervención (columnas DOMINIO 1-9 + base de vehículos por NOMBRE). */
  vehiculos: VehiculoInfo[];
  /** Todas las columnas originales no vacías (excepto REFERENCIA), con DNIs redactados. */
  campos: Record<string, string>;
}

export interface HechoDetalle {
  id: number;
  intervenciones: Intervencion[];
}

export type EdgeType = 'vehiculo' | 'mo_geo_tiempo';

export interface Edge {
  a: number;
  b: number;
  type: EdgeType;
  detail: string;
  weight: number;
  dist_m: number | null;
  days_diff: number | null;
  modalidad: string | null;
}

export interface DashboardData {
  nodes: Hecho[];
  edges: Edge[];
  generatedAt: string;
  sourceErrors?: string[];
}