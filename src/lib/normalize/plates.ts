const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^ABC ?123$/, /^AB ?123 ?CD$/, /^A ?123 ?BCD$/, /^123 ?ABC$/,
  /^XXX ?\d*$/, /^A DETERMINAR$/, /^NO$/, /^NO POSEE$/, /^COMPLETAR$/,
  /^SIN DOMINIO$/, /^\?+\d*$/, /^S\/D$/, /^-+$/,
];

const KNOWN_PLACEHOLDER_CANDIDATES = new Set(['ABC123', 'AB123CD', 'A123BCD', '123ABC']);

/** Limpia y valida un dominio (patente); devuelve null si es un placeholder o no matchea un formato válido AR. */
export function cleanPlate(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim().toUpperCase();
  if (s === '' || s === 'NAN') return null;

  const quoted = s.match(/"([^"]+)"/);
  const inner = quoted ? quoted[1].trim() : s;
  const innerClean = inner.replace(/[^A-Z0-9]/g, '');
  const baseClean = s.replace(/[^A-Z0-9]/g, '');
  const candidate = quoted ? innerClean : baseClean;
  if (candidate === '') return null;

  for (const pat of PLACEHOLDER_PATTERNS) {
    if (pat.test(candidate) || pat.test(s)) return null;
  }

  if (/^[A-Z]{3}\d{3}$/.test(candidate)) return candidate; // auto viejo
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(candidate)) return candidate; // auto mercosur
  if (/^\d{3}[A-Z]{3}$/.test(candidate)) return candidate; // moto vieja
  if (/^[A-Z]\d{3}[A-Z]{3}$/.test(candidate)) return candidate; // moto mercosur

  if (s.includes('DETERMINAR') || KNOWN_PLACEHOLDER_CANDIDATES.has(candidate)) {
    return null;
  }

  if (candidate.length >= 5 && candidate.length <= 7 && /\d/.test(candidate) && /[A-Z]/.test(candidate)) {
    return candidate;
  }
  return null;
}
