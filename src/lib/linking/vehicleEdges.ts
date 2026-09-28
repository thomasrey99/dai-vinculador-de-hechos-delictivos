import type { Hecho, Edge } from '../types';

/** Aristas por vehículo compartido entre hechos distintos. */
export function buildVehicleEdges(hechos: Hecho[]): { edges: Edge[]; edgeKeySet: Set<string> } {
  const plateToHechos = new Map<string, number[]>();
  hechos.forEach((h) => {
    h.vehicles.forEach((v) => {
      const arr = plateToHechos.get(v.plate) || [];
      arr.push(h.id);
      plateToHechos.set(v.plate, arr);
    });
  });

  const edges: Edge[] = [];
  const edgeKeySet = new Set<string>();

  plateToHechos.forEach((idsRaw, plate) => {
    const ids = Array.from(new Set(idsRaw)).sort((a, b) => a - b);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = `${ids[i]}-${ids[j]}`;
        if (edgeKeySet.has(key)) continue;
        edgeKeySet.add(key);
        edges.push({
          a: ids[i], b: ids[j], type: 'vehiculo',
          detail: `Vehículo compartido: ${plate}`,
          weight: 3, dist_m: null, days_diff: null, modalidad: null,
        });
      }
    }
  });

  return { edges, edgeKeySet };
}
