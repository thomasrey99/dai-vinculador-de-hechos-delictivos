import type { Edge, Hecho } from '@/lib/types';

interface LinkedHechosListProps {
  selectedId: number;
  links: Edge[];
  nodesById: Map<number, Hecho>;
  onSelect: (id: number) => void;
}

export function LinkedHechosList({ selectedId, links, nodesById, onSelect }: LinkedHechosListProps) {
  return (
    <>
      <div className="section-title" style={{ marginTop: 16 }}>Hechos vinculados ({links.length})</div>
      {links.length === 0 && (
        <div className="empty-state">Sin vinculaciones bajo los filtros actuales.</div>
      )}
      {links.map((e, i) => {
        const otherId = e.a === selectedId ? e.b : e.a;
        const other = nodesById.get(otherId);
        if (!other) return null;
        return (
          <div className="link-item" key={i} onClick={() => onSelect(otherId)}>
            <span className={e.type === 'vehiculo' ? 'type-veh' : 'type-mo'}>
              {e.type === 'vehiculo' ? 'VEHÍCULO' : 'MO/ZONA/TIEMPO'}
            </span> — {e.detail}
            <div className="lqth">{other.qth || '(sin dirección)'}</div>
            <div className="ldate">{other.fecha || ''} · {(other.modalidades || []).join(', ')}</div>
          </div>
        );
      })}
    </>
  );
}
