/** Minúsculas, sin acentos, sin puntuación (mantiene dígitos). */
export function normalizeForSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñ ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'y', 'o',
  'en', 'con', 'por', 'para', 'que', 'se', 'su', 'sus', 'al', 'a', 'es',
]);

/** Tokeniza texto ya normalizado, descartando stopwords y tokens de 1 caracter. */
export function tokenize(normalizedText: string): string[] {
  return normalizedText
    .split(' ')
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}
