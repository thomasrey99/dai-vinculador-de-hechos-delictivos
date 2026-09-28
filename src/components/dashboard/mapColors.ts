export function colorForResult(r: string | null): string {
  if (!r) return '#6b7a99';
  const u = r.toUpperCase();
  if (u.includes('POSITIVO')) return '#6fae6f';
  if (u.includes('NEGATIVO')) return '#b85c5c';
  return '#8b93a3';
}
