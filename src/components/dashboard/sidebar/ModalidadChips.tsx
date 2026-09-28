interface ModalidadChipsProps {
  counts: [string, number][];
  active: Set<string>;
  onToggle: (modalidad: string) => void;
}

export function ModalidadChips({ counts, active, onToggle }: ModalidadChipsProps) {
  return (
    <div>
      <div className="section-title">Modalidad</div>
      <div className="chip-list">
        {counts.map(([m, count]) => (
          <div
            key={m}
            className={`chip ${active.has(m) ? 'active' : ''}`}
            onClick={() => onToggle(m)}
          >
            {m} ({count})
          </div>
        ))}
      </div>
    </div>
  );
}
