import type { SearchResult } from '@/lib/search';

interface SearchResultsListProps {
  results: SearchResult[];
  query: string;
  onSelect: (id: number) => void;
}

export function SearchResultsList({ results, query, onSelect }: SearchResultsListProps) {
  if (!query.trim()) return null;

  return (
    <div>
      <div className="section-title">Resultados ({results.length})</div>
      {results.length === 0 && (
        <div className="empty-state">Sin coincidencias para &quot;{query}&quot;.</div>
      )}
      <div id="search-results-list">
        {results.map(({ hecho, reasons }) => (
          <div key={hecho.id} className="search-result-item" onClick={() => onSelect(hecho.id)}>
            <div className="qth-mini">{hecho.qth || '(sin dirección)'}</div>
            <div className="meta">{hecho.fecha || ''} · {(hecho.modalidades || []).join(', ')}</div>
            {reasons.length > 0 && (
              <div className="reason-row">
                {reasons.slice(0, 3).map((r, i) => (
                  <span className="reason-chip" key={i}>{r}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
