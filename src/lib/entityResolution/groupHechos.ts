import type { ParsedRow } from './parseRows';
import { UnionFind } from './unionFind';
import { toISODate } from '../normalize';

/**
 * Agrupa filas que representan el mismo hecho real:
 *  1) comparten N° de causa, o
 *  2) misma fecha + misma dirección normalizada.
 * Devuelve un Map rowId -> groupId (id del representante canónico).
 */
export function resolveHechoGroups(rows: ParsedRow[]): Map<number, number> {
  const uf = new UnionFind(rows.length);

  const byCausa = new Map<string, number[]>();
  rows.forEach((r) => {
    if (r.causaStr) {
      const arr = byCausa.get(r.causaStr) || [];
      arr.push(r.rowId);
      byCausa.set(r.causaStr, arr);
    }
  });
  byCausa.forEach((ids) => {
    for (let i = 1; i < ids.length; i++) uf.union(ids[0], ids[i]);
  });

  const byDateAddr = new Map<string, number[]>();
  rows.forEach((r) => {
    if (r.fechaHecho && r.qthNorm) {
      const key = `${toISODate(r.fechaHecho)}|${r.qthNorm}`;
      const arr = byDateAddr.get(key) || [];
      arr.push(r.rowId);
      byDateAddr.set(key, arr);
    }
  });
  byDateAddr.forEach((ids) => {
    for (let i = 1; i < ids.length; i++) uf.union(ids[0], ids[i]);
  });

  const result = new Map<number, number>();
  rows.forEach((r) => result.set(r.rowId, uf.find(r.rowId)));
  return result;
}
