// ============================================================================
// FUENTE DE DATOS: local (.xlsx) vs. online (Google Sheets)
// ============================================================================
// Por ahora usamos los archivos .xlsx locales que ya tenías. El día que
// migren a las planillas online, alcanza con:
//   1) completar sheetsConfig.ts con los IDs reales de la spreadsheet, y
//   2) cambiar DATA_SOURCE a "sheets" (variable de entorno o acá abajo).
// El resto del pipeline (normalización, dedup, vinculación, buscador) no
// cambia en absoluto — ambas fuentes devuelven la misma forma de datos.
// ============================================================================

export type DataSourceMode = 'local' | 'sheets';

export const DATA_SOURCE: DataSourceMode =
  (process.env.DATA_SOURCE as DataSourceMode) || 'local';

export const LOCAL_FILES = {
  normalizado: process.env.LOCAL_NORMALIZADO_PATH || './data/2026_NORMALIZADO.xlsx',
  vehiculos: process.env.LOCAL_VEHICULOS_PATH || './data/base_de_vehiculos_2026.xlsx',
};
