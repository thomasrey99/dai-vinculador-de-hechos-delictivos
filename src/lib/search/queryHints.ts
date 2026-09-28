import { normalizeForSearch } from './textNormalize';

const NUM_WORDS: Record<string, number> = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10,
};

const WEAPON_WORDS = ['arma de fuego', 'arma blanca', 'pistola', 'revolver', 'cuchillo', 'armado', 'inhibidor'];
const VEHICLE_TYPE_WORDS = ['moto', 'motocicleta', 'motochorro', 'auto', 'automovil', 'camioneta'];
const COLOR_WORDS = [
  'negro', 'negra', 'blanco', 'blanca', 'rojo', 'roja', 'azul', 'verde', 'gris',
  'amarillo', 'amarilla', 'marron', 'celeste', 'violeta', 'rosa', 'naranja', 'bordo', 'plateado', 'dorado',
];
const CLOTHING_WORDS = [
  'remera', 'campera', 'buzo', 'pantalon', 'gorra', 'capucha', 'casco', 'zapatillas', 'short', 'bermuda', 'bicicleta',
];

export interface QueryHints {
  numAutores: number | null;
  weaponHints: string[];
  vehicleTypeHints: string[];
  colorHints: string[];
  clothingHints: string[];
  normalizedQuery: string;
}

function findMatches(text: string, list: string[]): string[] {
  return list.filter((w) => text.includes(w));
}

export function parseQueryHints(rawQuery: string): QueryHints {
  const normalized = normalizeForSearch(rawQuery);

  // "3 masculinos", "3 autores", "3 personas" -> numAutores = 3
  let numAutores: number | null = null;
  const digitMatch = normalized.match(/\b(\d{1,2})\s*(masculin|femenin|autor|person|sujet|delincuent)/);
  if (digitMatch) {
    numAutores = parseInt(digitMatch[1], 10);
  } else {
    const wordAlt = Object.keys(NUM_WORDS).join('|');
    const wordMatch = normalized.match(new RegExp(`\\b(${wordAlt})\\s+(masculin|femenin|autor|person|sujet|delincuent)`));
    if (wordMatch) numAutores = NUM_WORDS[wordMatch[1]];
  }

  return {
    numAutores,
    weaponHints: findMatches(normalized, WEAPON_WORDS),
    vehicleTypeHints: findMatches(normalized, VEHICLE_TYPE_WORDS),
    colorHints: findMatches(normalized, COLOR_WORDS),
    clothingHints: findMatches(normalized, CLOTHING_WORDS),
    normalizedQuery: normalized,
  };
}
