import type { Hecho } from '@/lib/types';
import type { SeriesItem } from '@/hooks/useHechoFilters';

interface RepeatedVehiclesListProps {
  seriesList: SeriesItem[];
  nodesById: Map<number, Hecho>;
  onSelect: (ids: number[]) => void;
}

export function RepeatedVehiclesList({ seriesList, nodesById, onSelect }: RepeatedVehiclesListProps) {
  return (
    <div>
      <div className="section-title">Vehículos reincidentes (2+ hechos)</div>
      <div id="series-list">
        {seriesList.map((item) => {
          const sample = nodesById.get(item.ids[0]);
          const veh = sample?.vehicles.find((v) => v.plate === item.plate);
          return (
            <div key={item.plate} className="series-item" onClick={() => onSelect(item.ids)}>
              <div className="plate">{item.plate}</div>
              <div className="meta">{veh?.marca || ''} {veh?.modelo || ''} — en {item.ids.length} hechos</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
