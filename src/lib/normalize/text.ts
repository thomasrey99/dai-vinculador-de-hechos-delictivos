/** Limpia y trunca el texto de referencia, redactando DNIs. */
export function redactAndTrim(text: string | null | undefined, maxlen = 240): string {
  if (!text) return '';
  let t = text.replace(/_x000D_/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  t = t.replace(/\b\d{7,8}\b/g, '[DNI]');
  const m = t.match(/Hecho:\s*(.+)/);
  if (m) t = m[1];
  if (t.length > maxlen) {
    const cut = t.slice(0, maxlen);
    t = cut.slice(0, cut.lastIndexOf(' ')) + '…';
  }
  return t;
}

export function cleanComuna(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s || ['NO', 'NAN'].includes(s.toUpperCase())) return null;
  const m = s.match(/^\d+/);
  return m ? m[0] : null;
}
