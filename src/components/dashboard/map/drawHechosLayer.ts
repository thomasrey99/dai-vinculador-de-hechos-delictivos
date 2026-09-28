import type * as LeafletNS from 'leaflet';
import type { Hecho, Edge } from '@/lib/types';
import { colorForResult } from '../mapColors';

interface DrawLayersArgs {
  L: typeof LeafletNS;
  markerLayer: LeafletNS.LayerGroup;
  linkLayer: LeafletNS.LayerGroup;
  visibleNodes: Hecho[];
  edges: Edge[];
  selectedId: number | null;
  nodesById: Map<number, Hecho>;
  edgePasses: (e: Edge) => boolean;
  onMarkerClick: (id: number) => void;
}

/** Dibuja los marcadores de hechos y las líneas de vínculo sobre las capas dadas. */
export function drawHechosLayer({
  L, markerLayer, linkLayer, visibleNodes, edges, selectedId, nodesById, edgePasses, onMarkerClick,
}: DrawLayersArgs) {
  markerLayer.clearLayers();
  linkLayer.clearLayers();

  visibleNodes.forEach((n) => {
    if (n.lat === null || n.lon === null) return;
    const isSelected = n.id === selectedId;
    const radius = n.vehicles.length > 0 ? 5 : 3.5;
    const marker = L.circleMarker([n.lat, n.lon], {
      radius: isSelected ? 8 : radius,
      color: isSelected ? '#e0a458' : colorForResult(n.resultado),
      weight: isSelected ? 2.5 : 1,
      fillColor: colorForResult(n.resultado),
      fillOpacity: n.vehicles.length > 0 ? 0.85 : 0.45,
    });
    marker.on('click', () => onMarkerClick(n.id));
    marker.bindTooltip(`${n.qth || ''}<br>${n.fecha || ''}<br>${(n.modalidades || []).join(', ')}`, { sticky: true });
    marker.addTo(markerLayer);
  });

  const drawEdge = (e: Edge, faint: boolean) => {
    const na = nodesById.get(e.a);
    const nb = nodesById.get(e.b);
    if (!na?.lat || !nb?.lat) return;
    const color = e.type === 'vehiculo' ? '#e0a458' : '#4fa8a0';
    const line = L.polyline([[na.lat, na.lon!], [nb.lat, nb.lon!]], {
      color, weight: faint ? 1 : 2, opacity: faint ? 0.35 : 0.85,
    });
    line.on('click', () => onMarkerClick(na.id === selectedId ? nb.id : na.id));
    line.addTo(linkLayer);
  };

  if (selectedId !== null) {
    edges.forEach((e) => {
      if (!edgePasses(e)) return;
      if (e.a !== selectedId && e.b !== selectedId) return;
      drawEdge(e, false);
    });
  } else {
    let shown = 0;
    for (const e of edges) {
      if (e.type !== 'vehiculo') continue;
      if (!edgePasses(e)) continue;
      drawEdge(e, true);
      shown++;
      if (shown > 400) break;
    }
  }
}
