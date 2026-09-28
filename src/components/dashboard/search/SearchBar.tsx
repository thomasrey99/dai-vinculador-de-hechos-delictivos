interface SearchBarProps {
  query: string;
  onChange: (v: string) => void;
}

export function SearchBar({ query, onChange }: SearchBarProps) {
  return (
    <div>
      <div className="section-title">Búsqueda de metadatos</div>
      <div className="field">
        <input
          type="text"
          placeholder='Ej: "3 masculinos", "masculino de remera negra"...'
          value={query}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
