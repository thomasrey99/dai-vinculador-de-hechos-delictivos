'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Edge } from '@/lib/types';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useHechoFilters } from '@/hooks/useHechoFilters';
import { useHechoSearch } from '@/hooks/useHechoSearch';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { LoadingScreen } from './dashboard/LoadingScreen';
import { Sidebar } from './dashboard/sidebar';
import { MapView, type MapViewHandle } from './dashboard/map';
import { DetailPanel } from './dashboard/detail';

export default function Dashboard() {
  const { data, loadError } = useDashboardData();
  const filters = useHechoFilters(data);
  const search = useHechoSearch(data);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const mapRef = useRef<MapViewHandle>(null);

  const selectedNode = selectedId !== null ? filters.nodesById.get(selectedId) ?? null : null;

  // Cuando hay una búsqueda activa, el mapa y los vínculos quedan acotados a
  // los hechos que matchean (además de los filtros de fecha/modalidad ya aplicados).
  const effectiveVisibleNodes = useMemo(
    () => filters.visibleNodes.filter((n) => !search.isActive || search.matchedIds.has(n.id)),
    [filters.visibleNodes, search.isActive, search.matchedIds]
  );

  const combinedEdgePasses = useCallback((e: Edge) => {
    if (!filters.edgePasses(e)) return false;
    if (search.isActive && (!search.matchedIds.has(e.a) || !search.matchedIds.has(e.b))) return false;
    return true;
  }, [filters, search.isActive, search.matchedIds]);

  const linksForSelected = useMemo(() => {
    if (!data || selectedId === null) return [];
    return data.edges.filter((e) => (e.a === selectedId || e.b === selectedId) && combinedEdgePasses(e));
  }, [data, selectedId, combinedEdgePasses]);

  const linkCount = useMemo(() => {
    if (!data) return 0;
    if (selectedId !== null) return linksForSelected.length;
    return data.edges.filter((e) => e.type === 'vehiculo' && combinedEdgePasses(e)).length;
  }, [data, selectedId, linksForSelected, combinedEdgePasses]);

  const focusHecho = (id: number) => setSelectedId(id);

  const selectSeries = (ids: number[]) => {
    if (ids.length === 0) return;
    setSelectedId(ids[0]);
    mapRef.current?.fitToNodes(ids);
  };

  if (loadError) {
    return (
      <div className="loading-screen" style={{ flexDirection: 'column', gap: 12, padding: 24, textAlign: 'center' }}>
        <div>No se pudieron cargar los datos: {loadError}</div>
        <div style={{ fontSize: 11, color: 'var(--muted-2)' }}>
          Revisá las credenciales de Google y los IDs de spreadsheet en <code>src/lib/sheetsConfig.ts</code> / <code>.env.local</code>.
        </div>
      </div>
    );
  }

  if (!data) {
    return <LoadingScreen />;
  }

  return (
    <div id="app">
      <DashboardHeader
        hechosCount={effectiveVisibleNodes.length}
        conVehiculoCount={effectiveVisibleNodes.filter((n) => n.vehicles.length > 0).length}
        linksCount={linkCount}
      />

      <Sidebar
        sourceErrors={data.sourceErrors}
        searchQuery={search.query}
        onSearchQueryChange={search.setQuery}
        searchResults={search.results}
        onSelectSearchResult={focusHecho}
        activeTypes={filters.activeTypes}
        onToggleType={filters.toggleType}
        radiusMax={filters.radiusMax}
        daysMax={filters.daysMax}
        onRadiusChange={filters.setRadiusMax}
        onDaysChange={filters.setDaysMax}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        onFromChange={filters.setDateFrom}
        onToChange={filters.setDateTo}
        modalidadCounts={filters.modalidadCounts}
        activeModalidades={filters.activeModalidades}
        onToggleModalidad={filters.toggleModalidad}
        seriesList={filters.seriesList}
        nodesById={filters.nodesById}
        onSelectSeries={selectSeries}
        onReset={() => { filters.resetFilters(); search.setQuery(''); setSelectedId(null); }}
      />

      <MapView
        ref={mapRef}
        visibleNodes={effectiveVisibleNodes}
        edges={data.edges}
        selectedId={selectedId}
        nodesById={filters.nodesById}
        edgePasses={combinedEdgePasses}
        onSelect={focusHecho}
      />

      <DetailPanel
        selectedNode={selectedNode}
        selectedId={selectedId}
        links={linksForSelected}
        nodesById={filters.nodesById}
        onClose={() => setSelectedId(null)}
        onSelect={focusHecho}
      />
    </div>
  );
}