import type { MoFeatures } from './types';

const NUM_WORDS: Record<string, number> = {
  uno: 1, una: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10,
};
const NUM_WORDS_ALT = Object.keys(NUM_WORDS).join('|');

function extractNumAutores(text: string | null | undefined): number | null {
  if (!text) return null;
  const t = text.toLowerCase();

  let m = t.match(/(\d{1,2})\s*\(\s*0?\d{1,2}\s*\)\s*(masculin|femenin|sujet|autor|person)/);
  if (m) return parseInt(m[1], 10);

  const re2 = new RegExp(`\\b(${NUM_WORDS_ALT})\\s*\\(\\s*0?\\d{1,2}\\s*\\)\\s*(masculin|femenin|sujet|autor|person)`);
  m = t.match(re2);
  if (m) return NUM_WORDS[m[1]];

  const re3 = new RegExp(`\\b(${NUM_WORDS_ALT})\\s+(masculin|femenin|sujet|autor|delincuent|person)`);
  m = t.match(re3);
  if (m) return NUM_WORDS[m[1]];

  return null;
}

function extractFlag(text: string | null | undefined, keywords: string[]): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return keywords.some((k) => t.includes(k));
}

export function computeMoFeatures(referencia: string | null | undefined): MoFeatures {
  return {
    num_autores: extractNumAutores(referencia),
    arma_fuego: extractFlag(referencia, ['arma de fuego', 'arma tipo pistola', 'pistola', 'revolver']),
    arma_blanca: extractFlag(referencia, ['arma blanca', 'cuchillo', 'corta candado', 'cortacandado']),
    moto: extractFlag(referencia, ['motocicleta', 'en moto', 'motovehiculo', 'moto de']),
    inhibidor: extractFlag(referencia, ['inhibidor']),
  };
}
