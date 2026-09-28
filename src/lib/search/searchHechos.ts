import type { Hecho } from '../types';
import type { SearchIndex } from './bm25';
import { bm25Score } from './bm25';
import { normalizeForSearch, tokenize } from './textNormalize';
import { parseQueryHints } from './queryHints';

export interface SearchResult {
  hecho: Hecho;
  score: number;
  reasons: string[];
}

function extractBigrams(normalizedQuery: string): string[] {
  const words = normalizedQuery.split(' ').filter(Boolean);
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }
  return bigrams;
}

/** Bonus por coincidencias estructuradas (cantidad de autores, armas, vehículo, frases exactas). */
function structuredBonus(hecho: Hecho, normalizedQuery: string): { bonus: number; reasons: string[] } {
  const hints = parseQueryHints(normalizedQuery);
  let bonus = 0;
  const reasons: string[] = [];

  if (hints.numAutores !== null && hecho.mo.num_autores === hints.numAutores) {
    bonus += 2.5;
    reasons.push(`coincide cantidad de autores (${hints.numAutores})`);
  }

  hints.weaponHints.forEach((w) => {
    const flagMatch =
      ((w.includes('fuego') || w === 'pistola' || w === 'revolver') && hecho.mo.arma_fuego) ||
      ((w.includes('blanca') || w === 'cuchillo') && hecho.mo.arma_blanca) ||
      (w === 'inhibidor' && hecho.mo.inhibidor);
    if (flagMatch) {
      bonus += 1.2;
      reasons.push(`MO: ${w}`);
    }
  });

  hints.vehicleTypeHints.forEach((v) => {
    if ((v.startsWith('moto') || v === 'motochorro') && hecho.mo.moto) {
      bonus += 1;
      reasons.push('MO: uso de moto');
    }
  });

  extractBigrams(normalizedQuery).forEach((bigram) => {
    if (bigram.length > 4 && hecho.searchText.includes(bigram)) {
      bonus += 3;
      reasons.push(`coincide "${bigram}"`);
    }
  });

  return { bonus, reasons };
}

/**
 * Busca hechos por similitud de texto (BM25 sobre todos los campos) combinada
 * con bonificaciones por coincidencias estructuradas (cantidad de personas,
 * armas, tipo de vehículo, frases exactas como "remera negra").
 */
export function searchHechos(
  index: SearchIndex,
  hechos: Hecho[],
  query: string,
  opts: { limit?: number; minScore?: number } = {}
): SearchResult[] {
  const limit = opts.limit ?? 50;
  const minScore = opts.minScore ?? 0.05;

  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [];
  const queryTokens = tokenize(normalizedQuery);
  if (queryTokens.length === 0) return [];

  const results: SearchResult[] = [];

  for (const hecho of hechos) {
    const textScore = bm25Score(index, hecho.id, queryTokens);
    const { bonus, reasons } = structuredBonus(hecho, normalizedQuery);
    const score = textScore + bonus;
    if (score >= minScore) {
      results.push({ hecho, score, reasons });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
