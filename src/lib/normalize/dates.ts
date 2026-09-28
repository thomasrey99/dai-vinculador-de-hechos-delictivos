const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
};

/** Parsea fechas en formato largo español ("1 de enero de 2026") o dd-mm-yyyy/ISO como fallback. */
export function parseSpanishDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();

  const m = s.match(/(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/i);
  if (m) {
    const day = parseInt(m[1], 10);
    const mesStr = m[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const mes = MESES[mesStr] || MESES[m[2]];
    const year = parseInt(m[3], 10);
    if (mes) {
      const d = new Date(Date.UTC(year, mes - 1, day));
      if (!isNaN(d.getTime())) return d;
    }
  }

  const m2 = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m2) {
    const d = new Date(Date.UTC(parseInt(m2[3], 10), parseInt(m2[2], 10) - 1, parseInt(m2[1], 10)));
    if (!isNaN(d.getTime())) return d;
  }

  const generic = new Date(raw);
  if (!isNaN(generic.getTime())) return generic;
  return null;
}

export function toISODate(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

export function daysBetweenISO(a: string | null, b: string | null): number | null {
  if (!a || !b) return null;
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round(Math.abs(da - db) / 86400000);
}
