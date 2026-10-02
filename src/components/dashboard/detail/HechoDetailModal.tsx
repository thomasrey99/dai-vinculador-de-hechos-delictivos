'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Hecho, Intervencion, VehiculoInfo } from '@/lib/types';
import { useHechoDetalle } from '@/hooks/useHechoDetalle';
import { VehicleTags } from './VehicleTags';
import { MoSummary } from './MoSummary';

interface HechoDetailModalProps {
  hecho: Hecho;
  onClose: () => void;
}

interface PlateEntry {
  info: VehiculoInfo;
  /** Intervenciones donde aparece la patente (index = posición dentro del hecho, base 0). */
  apariciones: { index: number; item: Intervencion }[];
}

/** Arma, para cada patente del hecho, la lista de intervenciones en las que aparece. */
function buildPlateIndex(intervenciones: Intervencion[]): PlateEntry[] {
  const byPlate = new Map<string, PlateEntry>();
  intervenciones.forEach((item, index) => {
    item.vehiculos.forEach((v) => {
      const entry = byPlate.get(v.plate) ?? { info: v, apariciones: [] };
      // Nos quedamos con la versión que traiga más datos (marca/modelo/color).
      if (!entry.info.marca && v.marca) entry.info = v;
      entry.apariciones.push({ index, item });
      byPlate.set(v.plate, entry);
    });
  });
  return Array.from(byPlate.values()).sort(
    (a, b) => b.apariciones.length - a.apariciones.length || a.info.plate.localeCompare(b.info.plate)
  );
}

function vehicleLabel(v: VehiculoInfo): string {
  return [v.marca, v.modelo, v.color].filter(Boolean).join(' · ');
}

function scrollToIntervencion(rowId: number) {
  document.getElementById(`interv-${rowId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function PlatesSection({
  plates,
  total,
  onJump,
}: {
  plates: PlateEntry[];
  total: number;
  onJump: (rowId: number) => void;
}) {
  return (
    <>
      <div className="section-title" style={{ marginTop: 18 }}>Vehículos ({plates.length})</div>
      {plates.map(({ info, apariciones }) => (
        <details className="plate-item" key={info.plate}>
          <summary>
            <span className="veh-tag">{info.plate}</span>
            <span className="pmeta">
              {vehicleLabel(info) ? `${vehicleLabel(info)} — ` : ''}
              en {apariciones.length} de {total} intervención{total === 1 ? '' : 'es'}
            </span>
          </summary>
          <ul className="plate-appearances">
            {apariciones.map(({ index, item }) => (
              <li key={item.rowId}>
                <button type="button" className="link-btn" onClick={() => onJump(item.rowId)}>
                  #{index + 1}
                </button>
                {item.fecha || 's/f'} · {item.qth || '(sin dirección)'}
                {item.tipoIntervencion ? ` · ${item.tipoIntervencion}` : ''}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </>
  );
}

function IntervencionItem({
  item,
  index,
  total,
  focused,
}: {
  item: Intervencion;
  index: number;
  total: number;
  focused: boolean;
}) {
  const campos = Object.entries(item.campos);

  return (
    <div id={`interv-${item.rowId}`} className={`intervencion${focused ? ' intervencion--focus' : ''}`}>
      <div className="ihead">
        {total > 1 ? `${index + 1} de ${total} · ` : ''}
        {item.tipoIntervencion || 'Intervención'}
        {item.nombre ? ` · ${item.nombre}` : ''}
      </div>

      <div className="badge-row">
        {item.fecha && <span className="badge">{item.fecha}</span>}
        {item.causa && <span className="badge">Causa {item.causa}</span>}
        {item.modalidad && <span className="badge">{item.modalidad}</span>}
        {item.resultado && <span className="badge">{item.resultado}</span>}
      </div>

      {item.qth && <div className="resumen-text" style={{ marginTop: 0, marginBottom: 6 }}>{item.qth}</div>}
      <VehicleTags vehicles={item.vehiculos} />

      <div className="relato" style={{ marginTop: 8 }}>{item.referencia || '(sin relato)'}</div>

      {campos.length > 0 && (
        <details className="campos-toggle">
          <summary>Todos los campos ({campos.length})</summary>
          <table className="campos-table">
            <tbody>
              {campos.map(([key, value]) => (
                <tr key={key}>
                  <td className="k">{key}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

/**
 * Modal con el detalle completo de un hecho. Solo se monta cuando el usuario
 * pide "Ver detalle", así que el fetch a /api/hechos/[id] ocurre únicamente
 * bajo demanda.
 */
export function HechoDetailModal({ hecho, onClose }: HechoDetailModalProps) {
  const { detalle, loading, error } = useHechoDetalle(hecho.id);
  const [focusedRowId, setFocusedRowId] = useState<number | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const plates = useMemo(() => (detalle ? buildPlateIndex(detalle.intervenciones) : []), [detalle]);

  const jumpTo = (rowId: number) => {
    setFocusedRowId(rowId);
    scrollToIntervencion(rowId);
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="hecho-modal-title">
        <div className="modal-header">
          <div className="hid" id="hecho-modal-title">
            Hecho #{hecho.id}{hecho.causas.length ? ` · Causa ${hecho.causas.join(', ')}` : ''}
          </div>
          <div className="date">{hecho.fecha || 'Fecha no registrada'}</div>
          <div className="qth">{hecho.qth || '(sin dirección)'}</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar" autoFocus>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="badge-row">
            {hecho.resultado && <span className="badge">{hecho.resultado}</span>}
            {hecho.comuna && <span className="badge">Comuna {hecho.comuna}</span>}
            {hecho.modalidades.map((m) => <span className="badge" key={m}>{m}</span>)}
          </div>
          <MoSummary mo={hecho.mo} />

          {loading && <div className="empty-state">Cargando detalle…</div>}
          {error && <div className="error-banner">No se pudo cargar el detalle: {error}</div>}

          {detalle && plates.length > 0 && (
            <PlatesSection plates={plates} total={detalle.intervenciones.length} onJump={jumpTo} />
          )}

          {detalle && (
            <>
              <div className="section-title" style={{ marginTop: 18 }}>
                Intervenciones ({detalle.intervenciones.length})
              </div>
              {detalle.intervenciones.map((item, i) => (
                <IntervencionItem
                  key={item.rowId}
                  item={item}
                  index={i}
                  total={detalle.intervenciones.length}
                  focused={item.rowId === focusedRowId}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}