// ============================================================================
// CONFIGURACIÓN DE PLANILLAS
// ============================================================================
// Completá acá los IDs reales de cada Google Sheet y el nombre exacto de la
// pestaña (tab) que corresponde. El ID de una spreadsheet es la parte de la
// URL entre /d/ y /edit, por ejemplo:
// https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit#gid=0
//
// Podés tener cada tipo de intervención como una pestaña distinta dentro de
// la MISMA spreadsheet, o como spreadsheets separadas — ambos casos están
// soportados, solo tenés que poner el spreadsheetId correspondiente en cada
// entrada (puede repetirse si están todas en el mismo archivo).
// ============================================================================

export interface InterventionSheetConfig {
  /** ID de la spreadsheet de Google Sheets (la misma para todas las pestañas, en tu caso) */
  spreadsheetId: string;
  /** Nombre exacto de la pestaña (case-sensitive) */
  sheetName: string;
  /** Etiqueta de tipo de intervención a asignar si la hoja no trae su propia columna TIPO DE INTERVENCION */
  tipoIntervencion: string;
  /**
   * Número de fila (1-indexed) donde están los encabezados reales de columna.
   * Usá 2 si la fila 1 es un banner/instrucciones combinado, como en la
   * planilla de Colaboraciones.
   */
  headerRow?: number;
  /**
   * Nombre de la columna que identifica unívocamente cada intervención en
   * ESTA pestaña (para poder cruzarla con base_de_vehiculos por NOMBRE).
   * En la pestaña de Colaboraciones esa columna se llama literalmente
   * "REG LEGALES" (no "NOMBRE"); en SAE probablemente se llame "SAE".
   * El código la renombra internamente a "NOMBRE".
   */
  idColumnName?: string;
  /** Rango a leer (por defecto toda la hoja). Ej: "A1:CG5000" */
  range?: string;
}

// Todas las pestañas de intervención viven en esta misma spreadsheet.
const MAIN_SPREADSHEET_ID = process.env.SHEET_ID_PRINCIPAL || 'TODO_PONER_ID_SPREADSHEET_PRINCIPAL';

export const NORMALIZADO_SHEETS: InterventionSheetConfig[] = [
  {
    spreadsheetId: MAIN_SPREADSHEET_ID,
    sheetName: 'SAE',
    tipoIntervencion: 'SAE',
    headerRow: 2,
    idColumnName: 'SAE',
  },
  {
    spreadsheetId: MAIN_SPREADSHEET_ID,
    sheetName: 'COLABORACIONES',
    tipoIntervencion: 'REG LEGALES',
    headerRow: 2,
    idColumnName: 'REG LEGALES',
  },
  {
    spreadsheetId: MAIN_SPREADSHEET_ID,
    sheetName: 'V SIN INGRESO',
    tipoIntervencion: 'V.S.I.',
    headerRow: 2,
    idColumnName: 'V SIN INGRESO',
  },
  {
    spreadsheetId: MAIN_SPREADSHEET_ID,
    sheetName: 'PEDIDOS JEFES',
    tipoIntervencion: 'P.J.',
    headerRow: 2,
    idColumnName: 'PEDIDOS JEFES',
  },
  {
    spreadsheetId: MAIN_SPREADSHEET_ID,
    sheetName: 'EXPLOTACION DE PRENSA',
    tipoIntervencion: 'PRENSA',
    headerRow: 2,
    idColumnName: 'EXPLOTACION DE PRENSA',
  },
  // Si aparece alguna pestaña de intervención más, sumala acá con el mismo patrón.
];

export const VEHICULOS_SHEET: InterventionSheetConfig = {
  spreadsheetId: process.env.SHEET_ID_VEHICULOS || 'TODO_PONER_ID_SPREADSHEET_VEHICULOS',
  sheetName: process.env.SHEET_TAB_VEHICULOS || 'Hoja 1',
  tipoIntervencion: 'VEHICULOS',
  headerRow: 1,
};

// Cuánto tiempo (en segundos) se cachea en memoria el resultado del pipeline
// antes de volver a leer las planillas. Súbelo si las planillas no cambian
// seguido, bájalo si necesitás ver cambios casi en vivo.
export const CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10);

// Parámetros del motor de vinculación (se pueden ajustar en vivo desde el
// dashboard también, esto son los valores máximos/por defecto del backend).
export const LINKING_DEFAULTS = {
  radiusMetersMax: 600,
  daysWindowMax: 15,
  // Modalidades que NO generan vínculos por MO+geo+tiempo (catch-alls, búsquedas
  // de paradero, etc. que no representan series delictivas reales)
  excludedModalidades: ['PARADERO', 'OTROS (ACLARAR EN RESEÑA)'],
  // Salvavidas de memoria: si una sola modalidad tiene más hechos que esto
  // (típico si el Sheet online acumula muchos años de historial), el motor
  // de MO+geo+tiempo solo analiza los N más recientes de esa modalidad en
  // vez de compararlos todos entre sí. Subilo si tu servidor tiene RAM de
  // sobra y necesitás cubrir más historial.
  maxModalidadBucketSize: parseInt(process.env.MAX_MODALIDAD_BUCKET_SIZE || '6000', 10),
  // Tope global de aristas por MO+geo+tiempo, por si aun así el volumen es
  // enorme (corta el cómputo en vez de agotar la memoria del proceso).
  maxMoEdges: parseInt(process.env.MAX_MO_EDGES || '150000', 10),
};
