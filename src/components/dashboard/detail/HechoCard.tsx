import type { Hecho } from '@/lib/types';
import { VehicleTags } from './VehicleTags';
import { MoSummary } from './MoSummary';

interface HechoCardProps {
  hecho: Hecho;
  onClose: () => void;
  onViewDetail: () => void;
}

function resultBadgeClass(resultado: string | null): string {
  if (!resultado) return '';
  const u = resultado.toUpperCase();
  if (u.includes('POSITIVO')) return 'result-pos';
  if (u.includes('NEGATIVO')) return 'result-neg';
  return '';
}

export function HechoCard({ hecho, onClose, onViewDetail }: HechoCardProps) {
  return (
    <div className="hecho-card">
      <span className="close-x" onClick={onClose}>✕</span>
      <div className="hid">
        Hecho #{hecho.id}{hecho.causas.length ? ` · Causa ${hecho.causas[0]}` : ''}
      </div>
      <div className="date">{hecho.fecha || 'Fecha no registrada'}</div>
      <div className="qth">{hecho.qth || '(sin dirección)'}</div>

      <div className="badge-row">
        {hecho.resultado && (
          <span className={`badge ${resultBadgeClass(hecho.resultado)}`}>{hecho.resultado}</span>
        )}
        {hecho.comuna && <span className="badge">Comuna {hecho.comuna}</span>}
        {hecho.n_intervenciones > 1 && (
          <span className="badge">{hecho.n_intervenciones} expedientes unificados</span>
        )}
        {hecho.modalidades.map((m) => <span className="badge" key={m}>{m}</span>)}
      </div>

      <VehicleTags vehicles={hecho.vehicles} />
      <MoSummary mo={hecho.mo} />

      <div className="resumen-text">{hecho.resumen}</div>

      <button type="button" className="btn-detail" onClick={onViewDetail}>
        Ver detalle
      </button>
    </div>
  );
}