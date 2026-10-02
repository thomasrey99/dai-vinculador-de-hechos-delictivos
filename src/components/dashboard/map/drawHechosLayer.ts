import type * as LeafletNS from 'leaflet';
import type { Hecho, Edge, EdgeType } from '@/lib/types';
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

const EDGE_COLOR: Record<EdgeType, string> = {
  vehiculo: '#e0a458',
  mo_geo_tiempo: '#4fa8a0',
};
// Color del mapa base: se usa como "borde" oscuro debajo de la línea para que resalte.
const EDGE_HALO = '#0c0e13';

/** Dibuja los marcadores de hechos y las líneas de vínculo sobre las capas dadas. */
export function drawHechosLayer({
  L, markerLayer, linkLayer, visibleNodes, edges, selectedId, nodesById, edgePasses, onMarkerClick,
}: DrawLayersArgs) {
  markerLayer.clearLayers();
  linkLayer.clearLayers();

  // Vínculos del hecho seleccionado (ya filtrados) y tipo de vínculo con cada vecino,
  // para resaltar también los marcadores de los hechos vinculados.
  const selectedEdges: Edge[] = [];
  const linkedTypes = new Map<number, EdgeType>();
  if (selectedId !== null) {
    edges.forEach((e) => {
      if (!edgePasses(e)) return;
      if (e.a !== selectedId && e.b !== selectedId) return;
      selectedEdges.push(e);
      const otherId = e.a === selectedId ? e.b : e.a;
      if (!linkedTypes.has(otherId) || e.type === 'vehiculo') linkedTypes.set(otherId, e.type);
    });
  }

  const markers: LeafletNS.CircleMarker[] = [];
  let selectedMarker: LeafletNS.CircleMarker | null = null;

  visibleNodes.forEach((n) => {
    if (n.lat === null || n.lon === null) return;
    const isSelected = n.id === selectedId;
    const linkedType = linkedTypes.get(n.id);
    const baseRadius = n.vehicles.length > 0 ? 5 : 3.5;
    const marker = L.circleMarker([n.lat, n.lon], {
      radius: isSelected ? 8 : linkedType ? Math.max(baseRadius, 6.5) : baseRadius,
      color: isSelected ? '#e0a458' : linkedType ? EDGE_COLOR[linkedType] : colorForResult(n.resultado),
      weight: isSelected ? 2.5 : linkedType ? 2.5 : 1,
      fillColor: colorForResult(n.resultado),
      fillOpacity: n.vehicles.length > 0 || linkedType ? 0.85 : 0.45,
    });
    marker.on('click', () => onMarkerClick(n.id));
    marker.bindTooltip(`${n.qth || ''}<br>${n.fecha || ''}<br>${(n.modalidades || []).join(', ')}`, { sticky: true });
    marker.addTo(markerLayer);
    markers.push(marker);
    if (isSelected) selectedMarker = marker;
  });

  const drawEdge = (e: Edge, strong: boolean) => {
    const na = nodesById.get(e.a);
    const nb = nodesById.get(e.b);
    if (!na?.lat || !nb?.lat) return;
    const path: [number, number][] = [[na.lat, na.lon!], [nb.lat, nb.lon!]];

    if (strong) {
      // Borde oscuro más ancho debajo de la línea, para que se despegue del mapa.
      L.polyline(path, { color: EDGE_HALO, weight: 8, opacity: 0.85, interactive: false }).addTo(linkLayer);
    }

    const line = L.polyline(path, {
      color: EDGE_COLOR[e.type],
      weight: strong ? 4 : 1.5,
      opacity: strong ? 1 : 0.55,
      className: strong ? (e.type === 'vehiculo' ? 'link-glow-veh' : 'link-glow-mo') : undefined,
    });
    line.on('click', () => onMarkerClick(na.id === selectedId ? nb.id : na.id));
    line.addTo(linkLayer);
  };

  if (selectedId !== null) {
    selectedEdges.forEach((e) => drawEdge(e, true));
  } else {
    let shown = 0;
    for (const e of edges) {
      if (e.type !== 'vehiculo') continue;
      if (!edgePasses(e)) continue;
      drawEdge(e, false);
      shown++;
      if (shown > 400) break;
    }
  }

  // Las líneas se agregaron después de los puntos: los traemos al frente para
  // que sigan siendo clickeables (el seleccionado, al final, queda arriba de todo).
  markers.forEach((m) => m.bringToFront());
  (selectedMarker as LeafletNS.CircleMarker | null)?.bringToFront();
}