'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { Hecho, Edge } from '@/lib/types';
import { drawHechosLayer } from './drawHechosLayer';
import { MapLegend } from './MapLegend';

type LeafletModule = typeof import('leaflet');
type LeafletMap = import('leaflet').Map;
type LeafletLayerGroup = import('leaflet').LayerGroup;

export interface MapViewHandle {
  fitToNodes: (ids: number[]) => void;
}

interface MapViewProps {
  visibleNodes: Hecho[];
  edges: Edge[];
  selectedId: number | null;
  nodesById: Map<number, Hecho>;
  edgePasses: (e: Edge) => boolean;
  onSelect: (id: number) => void;
}

const INITIAL_CENTER: [number, number] = [-34.6037, -58.4416];
const INITIAL_ZOOM = 12;

// URL de tiles del mapa. Por defecto usa Carto Dark Matter (requiere API key
// desde que Carto cambió su política). Pegá acá la URL completa que te da el
// panel de Carto al generar tu key (ya viene con el ?api_key=... incluido) en
// NEXT_PUBLIC_MAP_TILE_URL, en tu .env.local.
const DEFAULT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DEFAULT_ATTRIBUTION = '&copy; <a href="https://carto.com/attributions">CARTO</a>';

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || DEFAULT_TILE_URL;
const TILE_ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || DEFAULT_ATTRIBUTION;

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { visibleNodes, edges, selectedId, nodesById, edgePasses, onSelect },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markerLayer = useRef<LeafletLayerGroup | null>(null);
  const linkLayer = useRef<LeafletLayerGroup | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const [, forceTick] = useRefreshTick();

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapInstance.current) return;
    import('leaflet').then((L) => {
      leafletRef.current = L;
      const map = L.map(containerRef.current!, { zoomControl: true, attributionControl: true })
        .setView(INITIAL_CENTER, INITIAL_ZOOM);
      L.tileLayer(TILE_URL, {
        maxZoom: 19,
        attribution: TILE_ATTRIBUTION,
      }).addTo(map);
      markerLayer.current = L.layerGroup().addTo(map);
      linkLayer.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
      forceTick(); // trigger a draw pass once the map is ready
    });
    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // pan to the selected hecho
  useEffect(() => {
    if (selectedId === null || !mapInstance.current) return;
    const n = nodesById.get(selectedId);
    if (n?.lat !== null && n?.lat !== undefined && n?.lon !== null && n?.lon !== undefined) {
      mapInstance.current.panTo([n.lat, n.lon]);
    }
  }, [selectedId, nodesById]);

  // redraw markers/edges whenever inputs change
  useEffect(() => {
    const L = leafletRef.current;
    if (!L || !markerLayer.current || !linkLayer.current) return;
    drawHechosLayer({
      L,
      markerLayer: markerLayer.current,
      linkLayer: linkLayer.current,
      visibleNodes,
      edges,
      selectedId,
      nodesById,
      edgePasses,
      onMarkerClick: onSelect,
    });
  }, [visibleNodes, edges, selectedId, nodesById, edgePasses, onSelect]);

  useImperativeHandle(ref, () => ({
    fitToNodes: (ids: number[]) => {
      const L = leafletRef.current;
      if (!L || !mapInstance.current) return;
      const pts = ids
        .map((id) => nodesById.get(id))
        .filter((n): n is Hecho => !!n && n.lat !== null)
        .map((n) => [n.lat!, n.lon!] as [number, number]);
      if (pts.length) mapInstance.current.fitBounds(pts, { padding: [60, 60], maxZoom: 15 });
    },
  }), [nodesById]);

  return (
    <div id="map-container" style={{ position: 'relative' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      <MapLegend />
    </div>
  );
});

/** Pequeño hook para forzar un re-render (usado solo para redibujar apenas el mapa termina de inicializarse). */
function useRefreshTick() {
  return useReducerTick();
}
function useReducerTick() {
  return require('react').useReducer((x: number) => x + 1, 0);
}
