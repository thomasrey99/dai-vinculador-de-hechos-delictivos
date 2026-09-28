interface MoGeoTimeFiltersProps {
  radiusMax: number;
  daysMax: number;
  onRadiusChange: (v: number) => void;
  onDaysChange: (v: number) => void;
}

export function MoGeoTimeFilters({ radiusMax, daysMax, onRadiusChange, onDaysChange }: MoGeoTimeFiltersProps) {
  return (
    <div>
      <div className="section-title">Filtros — MO/Geo/Tiempo</div>
      <div className="field">
        <label>Radio máximo: {radiusMax} m</label>
        <input
          type="range" min={100} max={600} step={50} value={radiusMax}
          onChange={(e) => onRadiusChange(parseInt(e.target.value))}
        />
      </div>
      <div className="field">
        <label>Ventana temporal: {daysMax} días</label>
        <input
          type="range" min={1} max={15} step={1} value={daysMax}
          onChange={(e) => onDaysChange(parseInt(e.target.value))}
        />
      </div>
    </div>
  );
}
