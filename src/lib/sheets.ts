import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { InterventionSheetConfig } from './sheetsConfig';

export type RawRow = Record<string, string>;

let cachedAuth: JWT | null = null;

/**
 * Arma el cliente autenticado con la cuenta de servicio.
 *
 * Soporta dos formas de pasar las credenciales por variable de entorno:
 *  1) GOOGLE_SERVICE_ACCOUNT_JSON: el JSON completo del archivo de la cuenta
 *     de servicio, como string (podés pegarlo tal cual, o en base64).
 *  2) GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY por
 *     separado.
 */
function getAuth(): JWT {
  if (cachedAuth) return cachedAuth;

  const scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

  const rawJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    let jsonStr = rawJson;
    // soporta base64 para evitar problemas de escaping de \n en .env
    if (!rawJson.trim().startsWith('{')) {
      jsonStr = Buffer.from(rawJson, 'base64').toString('utf-8');
    }
    const creds = JSON.parse(jsonStr);
    cachedAuth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes,
    });
    return cachedAuth;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !privateKey) {
    throw new Error(
      'Faltan credenciales de Google. Definí GOOGLE_SERVICE_ACCOUNT_JSON o ' +
        'GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY en .env.local'
    );
  }
  cachedAuth = new google.auth.JWT({ email, key: privateKey, scopes });
  return cachedAuth;
}

/**
 * Lee una hoja completa y la devuelve como array de objetos, usando la fila
 * `headerRow` (1-indexed, por defecto 1) como encabezado — útil cuando la
 * fila 1 es un banner combinado de instrucciones, como en Colaboraciones.
 * Si se pasa `idColumnName`, esa columna se renombra a "NOMBRE" para que el
 * resto del pipeline la use de forma uniforme sin importar el tipo de
 * intervención de origen.
 */
export async function fetchSheetAsObjects(config: InterventionSheetConfig): Promise<RawRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const range = config.range || `'${config.sheetName}'`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });

  const values = res.data.values || [];
  const headerRowIdx = (config.headerRow || 1) - 1; // convert to 0-indexed
  if (values.length < headerRowIdx + 2) return [];

  const headers = values[headerRowIdx].map((h) => String(h).trim());
  const rows: RawRow[] = [];

  for (let i = headerRowIdx + 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.every((c) => c === '' || c === undefined || c === null)) continue;
    const obj: RawRow = {};
    headers.forEach((h, idx) => {
      const v = row[idx];
      const key = config.idColumnName && h === config.idColumnName ? 'NOMBRE' : h;
      obj[key] = v === undefined || v === null ? '' : String(v);
    });
    rows.push(obj);
  }
  return rows;
}

/**
 * Lee varias hojas en paralelo y las une, agregando (si no existe ya) la
 * columna TIPO DE INTERVENCION con la etiqueta configurada para cada una.
 */
export async function fetchAndUnionSheets(configs: InterventionSheetConfig[]): Promise<RawRow[]> {
  const results = await Promise.allSettled(
    configs.map(async (c) => {
      const rows = await fetchSheetAsObjects(c);
      return rows.map((r) => ({
        ...r,
        'TIPO DE INTERVENCION': r['TIPO DE INTERVENCION'] || c.tipoIntervencion,
      }));
    })
  );

  const unioned: RawRow[] = [];
  results.forEach((r, idx) => {
    if (r.status === 'fulfilled') {
      unioned.push(...r.value);
    } else {
      console.error(
        `Error leyendo hoja "${configs[idx].sheetName}" (${configs[idx].spreadsheetId}):`,
        r.reason?.message || r.reason
      );
    }
  });
  return unioned;
}
