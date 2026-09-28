import { useEffect, useMemo, useState } from 'react';
import type { DashboardData } from '@/lib/types';
import { buildSearchIndex, searchHechos, type SearchResult } from '@/lib/search';

const DEBOUNCE_MS = 250;

export function useHechoSearch(data: DashboardData | null) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // El índice solo se reconstruye cuando cambian los datos, no en cada tecla.
  const index = useMemo(() => (data ? buildSearchIndex(data.nodes) : null), [data]);

  const results: SearchResult[] = useMemo(() => {
    if (!index || !data || !debouncedQuery.trim()) return [];
    return searchHechos(index, data.nodes, debouncedQuery, { limit: 50 });
  }, [index, data, debouncedQuery]);

  const isActive = debouncedQuery.trim().length > 0;
  const matchedIds = useMemo(() => new Set(results.map((r) => r.hecho.id)), [results]);

  return { query, setQuery, results, isActive, matchedIds };
}
