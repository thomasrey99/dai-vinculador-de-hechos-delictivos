import { useCallback, useMemo, useState } from 'react';
import type { DashboardData, Hecho, Edge } from '@/lib/types';

export interface SeriesItem {
  plate: string;
  ids: number[];
}

export function useHechoFilters(data: DashboardData | null) {
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set(['vehiculo', 'mo_geo_tiempo']));
  const [radiusMax, setRadiusMax] = useState(600);
  const [daysMax, setDaysMax] = useState(15);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeModalidades, setActiveModalidades] = useState<Set<string>>(new Set());

  const nodesById = useMemo(() => {
    const m = new Map<number, Hecho>();
    data?.nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [data]);

  const passesFilters = useCallback((n: Hecho) => {
    if (dateFrom && n.fecha && n.fecha < dateFrom) return false;
    if (dateTo && n.fecha && n.fecha > dateTo) return false;
    if (activeModalidades.size > 0 && !n.modalidades.some((m) => activeModalidades.has(m))) return false;
    return true;
  }, [dateFrom, dateTo, activeModalidades]);

  const edgePasses = useCallback((e: Edge) => {
    if (!activeTypes.has(e.type)) return false;
    if (e.type === 'mo_geo_tiempo') {
      if (e.dist_m !== null && e.dist_m > radiusMax) return false;
      if (e.days_diff !== null && e.days_diff > daysMax) return false;
    }
    const na = nodesById.get(e.a);
    const nb = nodesById.get(e.b);
    if (!na || !nb || !passesFilters(na) || !passesFilters(nb)) return false;
    return true;
  }, [activeTypes, radiusMax, daysMax, nodesById, passesFilters]);

  const visibleNodes = useMemo(() => (data ? data.nodes.filter(passesFilters) : []), [data, passesFilters]);

  const modalidadCounts = useMemo(() => {
    const counts = new Map<string, number>();
    data?.nodes.forEach((n) => n.modalidades.forEach((m) => counts.set(m, (counts.get(m) || 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 18);
  }, [data]);

  const seriesList = useMemo<SeriesItem[]>(() => {
    if (!data) return [];
    const plateGroups = new Map<string, Set<number>>();
    data.edges.filter((e) => e.type === 'vehiculo').forEach((e) => {
      const plate = e.detail.split(': ')[1];
      const set = plateGroups.get(plate) || new Set<number>();
      set.add(e.a); set.add(e.b);
      plateGroups.set(plate, set);
    });
    return Array.from(plateGroups.entries())
      .map(([plate, ids]) => ({ plate, ids: Array.from(ids) }))
      .sort((a, b) => b.ids.length - a.ids.length)
      .slice(0, 60);
  }, [data]);

  const toggleModalidad = useCallback((m: string) => {
    setActiveModalidades((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  }, []);

  const toggleType = useCallback((t: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setDateFrom('');
    setDateTo('');
    setActiveModalidades(new Set());
  }, []);

  return {
    nodesById,
    passesFilters,
    edgePasses,
    visibleNodes,
    modalidadCounts,
    seriesList,
    activeTypes,
    radiusMax,
    daysMax,
    dateFrom,
    dateTo,
    activeModalidades,
    setRadiusMax,
    setDaysMax,
    setDateFrom,
    setDateTo,
    toggleModalidad,
    toggleType,
    resetFilters,
  };
}
