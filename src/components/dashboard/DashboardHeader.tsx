interface DashboardHeaderProps {
  hechosCount: number;
  conVehiculoCount: number;
  linksCount: number;
}

export function DashboardHeader({ hechosCount, conVehiculoCount, linksCount }: DashboardHeaderProps) {
  return (
    <header>
      <h1>Vinculación de Hechos Delictivos</h1>
      <span className="subtitle">CABA — datos en vivo</span>
      <div className="kpis">
        <div className="kpi"><div className="num">{hechosCount}</div><div className="lbl">Hechos</div></div>
        <div className="kpi"><div className="num">{conVehiculoCount}</div><div className="lbl">Con vehículo</div></div>
        <div className="kpi"><div className="num">{linksCount}</div><div className="lbl">Vínculos</div></div>
      </div>
    </header>
  );
}
