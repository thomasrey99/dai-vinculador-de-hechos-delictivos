/** Normaliza direcciones para poder compararlas como clave de deduplicación. */
export function normAddr(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.trim().toLowerCase();
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/\bavenida\b|\bav\.?\b/g, 'av');
  s = s.replace(/[^a-z0-9 ]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s || null;
}
