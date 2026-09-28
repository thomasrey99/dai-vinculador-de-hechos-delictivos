import type { Hecho } from '../types';
import { normalizeForSearch, tokenize } from './textNormalize';

export interface SearchIndex {
  docTokenCounts: Map<number, Map<string, number>>;
  docLength: Map<number, number>;
  avgDocLength: number;
  idf: Map<string, number>;
  N: number;
}

/** Construye el índice BM25 sobre el searchText de todos los hechos. Recalcular solo cuando cambian los datos. */
export function buildSearchIndex(hechos: Hecho[]): SearchIndex {
  const docTokenCounts = new Map<number, Map<string, number>>();
  const docLength = new Map<number, number>();
  const df = new Map<string, number>();

  hechos.forEach((h) => {
    const tokens = tokenize(normalizeForSearch(h.searchText));
    const counts = new Map<string, number>();
    tokens.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
    docTokenCounts.set(h.id, counts);
    docLength.set(h.id, tokens.length);
    counts.forEach((_, t) => df.set(t, (df.get(t) || 0) + 1));
  });

  const N = hechos.length;
  const idf = new Map<string, number>();
  df.forEach((count, term) => {
    idf.set(term, Math.log(1 + (N - count + 0.5) / (count + 0.5)));
  });

  const totalLength = Array.from(docLength.values()).reduce((s, v) => s + v, 0);
  const avgDocLength = N > 0 ? totalLength / N : 0;

  return { docTokenCounts, docLength, avgDocLength, idf, N };
}

const K1 = 1.5;
const B = 0.75;

/** Puntaje BM25 de un hecho contra los tokens de la consulta. 0 si no comparten ningún término. */
export function bm25Score(index: SearchIndex, hechoId: number, queryTokens: string[]): number {
  const counts = index.docTokenCounts.get(hechoId);
  if (!counts) return 0;
  const docLen = index.docLength.get(hechoId) || 0;
  let score = 0;
  for (const term of queryTokens) {
    const tf = counts.get(term);
    if (!tf) continue;
    const idf = index.idf.get(term) || 0;
    const denom = tf + K1 * (1 - B + B * (docLen / (index.avgDocLength || 1)));
    score += idf * ((tf * (K1 + 1)) / denom);
  }
  return score;
}
