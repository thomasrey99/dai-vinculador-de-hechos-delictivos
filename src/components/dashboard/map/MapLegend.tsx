export function MapLegend() {
  return (
    <div id="legend">
      <div className="row"><span className="dot" style={{ background: 'var(--accent-neutral)' }} /> Hecho</div>
      <div className="row"><span className="dot" style={{ background: '#fff', boxShadow: '0 0 0 2px var(--accent-veh)' }} /> Hecho seleccionado</div>
      <div className="row"><span className="line-sample" style={{ background: 'var(--accent-veh)' }} /> Vínculo por vehículo</div>
      <div className="row"><span className="line-sample" style={{ background: 'var(--accent-mo)' }} /> Vínculo por MO/zona/tiempo</div>
    </div>
  );
}
