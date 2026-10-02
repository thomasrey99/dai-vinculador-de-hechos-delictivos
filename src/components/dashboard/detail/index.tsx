'use client';

import { useEffect, useState } from 'react';
import type { Edge, Hecho } from '@/lib/types';
import { HechoCard } from './HechoCard';
import { HechoDetailModal } from './HechoDetailModal';
import { LinkedHechosList } from './LinkedHechosList';

interface DetailPanelProps {
  selectedNode: Hecho | null;
  selectedId: number | null;
  links: Edge[];
  nodesById: Map<number, Hecho>;
  onClose: () => void;
  onSelect: (id: number) => void;
}

export function DetailPanel({ selectedNode, selectedId, links, nodesById, onClose, onSelect }: DetailPanelProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  // Al cambiar de hecho seleccionado (o deseleccionar), el modal se cierra.
  useEffect(() => {
    setDetailOpen(false);
  }, [selectedId]);

  return (
    <div id="right">
      {!selectedNode && (
        <div className="empty-state">
          Hacé clic en un punto del mapa, o en un vehículo reincidente de la izquierda, para ver el detalle del hecho y sus vinculaciones.
        </div>
      )}
      {selectedNode && selectedId !== null && (
        <>
          <HechoCard hecho={selectedNode} onClose={onClose} onViewDetail={() => setDetailOpen(true)} />
          <LinkedHechosList selectedId={selectedId} links={links} nodesById={nodesById} onSelect={onSelect} />
        </>
      )}

      {detailOpen && selectedNode && (
        <HechoDetailModal hecho={selectedNode} onClose={() => setDetailOpen(false)} />
      )}
    </div>
  );
}