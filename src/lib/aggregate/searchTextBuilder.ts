import type { ParsedRow } from '../entityResolution';
import type { Hecho, VehiculoInfo } from '../types';
import { redactAndTrim } from '../normalize';

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Traduce los flags de MO a palabras, para que el buscador los "vea" como texto. */
function moFlagsToWords(hecho: Pick<Hecho, 'mo'>): string {
  const words: string[] = [];
  if (hecho.mo.num_autores) {
    words.push(`${hecho.mo.num_autores} autores`, `${hecho.mo.num_autores} personas`);
  }
  if (hecho.mo.arma_fuego) words.push('arma de fuego', 'pistola', 'revolver', 'armado');
  if (hecho.mo.arma_blanca) words.push('arma blanca', 'cuchillo', 'armado');
  if (hecho.mo.moto) words.push('moto', 'motocicleta', 'motochorro');
  if (hecho.mo.inhibidor) words.push('inhibidor', 'bloqueador de señal');
  return words.join(' ');
}

function vehiclesToWords(vehicles: VehiculoInfo[]): string {
  return vehicles
    .map((v) => [v.plate, v.marca, v.modelo, v.color, v.tipo].filter(Boolean).join(' '))
    .join(' ');
}

/**
 * Concatena TODAS las columnas relevantes de un hecho (dirección, modalidad,
 * resultado, comuna, causas, vehículos, MO detectado, y el relato completo
 * de todas las filas del grupo) en un único string normalizado para indexar.
 */
export function buildSearchText(
  hechoPartial: Pick<Hecho, 'qth' | 'modalidades' | 'resultado' | 'comuna' | 'causas' | 'vehicles' | 'mo'>,
  groupRows: ParsedRow[]
): string {
  const uniqueReferencias = Array.from(
    new Set(groupRows.map((r) => r.referencia).filter((r): r is string => !!r))
  ).map((r) => redactAndTrim(r, 600));

  const parts = [
    hechoPartial.qth,
    hechoPartial.modalidades.join(' '),
    hechoPartial.resultado,
    hechoPartial.comuna,
    hechoPartial.causas.join(' '),
    vehiclesToWords(hechoPartial.vehicles),
    moFlagsToWords(hechoPartial),
    ...uniqueReferencias,
  ].filter(Boolean) as string[];

  return stripAccents(parts.join(' ').toLowerCase());
}
