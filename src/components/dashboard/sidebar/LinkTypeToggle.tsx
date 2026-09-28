interface LinkTypeToggleProps {
  activeTypes: Set<string>;
  onToggle: (type: string) => void;
}

export function LinkTypeToggle({ activeTypes, onToggle }: LinkTypeToggleProps) {
  return (
    <div>
      <div className="section-title">Tipos de vínculo</div>
      <div className="toggle-row">
        <div
          className={`toggle veh ${activeTypes.has('vehiculo') ? 'active' : ''}`}
          onClick={() => onToggle('vehiculo')}
        >
          Vehículo
        </div>
        <div
          className={`toggle mo ${activeTypes.has('mo_geo_tiempo') ? 'active' : ''}`}
          onClick={() => onToggle('mo_geo_tiempo')}
        >
          MO + Zona/Tiempo
        </div>
      </div>
    </div>
  );
}
