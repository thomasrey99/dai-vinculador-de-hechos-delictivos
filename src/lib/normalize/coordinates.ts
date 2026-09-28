/** Corrige coordenadas exportadas como enteros sin punto decimal, ej -346478608 -> -34.6478608 */
export function fixCoordNormalizado(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const f = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (isNaN(f)) return null;
  if (Math.abs(f) > 1000) {
    const s = Math.trunc(f).toString();
    const neg = s.startsWith('-');
    const digits = neg ? s.slice(1) : s;
    const out = digits.slice(0, 2) + '.' + digits.slice(2);
    const val = parseFloat((neg ? '-' : '') + out);
    return isNaN(val) ? null : val;
  }
  return f;
}

/** Corrige coordenadas que vienen con coma decimal, ej "-34,6284888" */
export function fixCoordVehiculos(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const s = String(raw).replace(',', '.');
  const f = parseFloat(s);
  return isNaN(f) ? null : f;
}

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dphi = toRad(lat2 - lat1);
  const dlmb = toRad(lon2 - lon1);
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dlmb / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
