interface DateRangeFilterProps {
  dateFrom: string;
  dateTo: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
}

export function DateRangeFilter({ dateFrom, dateTo, onFromChange, onToChange }: DateRangeFilterProps) {
  return (
    <div>
      <div className="section-title">Rango de fechas del hecho</div>
      <div className="field">
        <label>Desde</label>
        <input type="date" value={dateFrom} onChange={(e) => onFromChange(e.target.value)} />
      </div>
      <div className="field">
        <label>Hasta</label>
        <input type="date" value={dateTo} onChange={(e) => onToChange(e.target.value)} />
      </div>
    </div>
  );
}
