import type { VehiculoInfo } from '@/lib/types';

interface VehicleTagsProps {
  vehicles: VehiculoInfo[];
}

export function VehicleTags({ vehicles }: VehicleTagsProps) {
  if (vehicles.length === 0) return null;
  return (
    <div style={{ marginTop: 8 }}>
      {vehicles.map((v) => (
        <span className="veh-tag" key={v.plate}>
          {v.plate}
          {v.marca ? ` · ${v.marca}` : ''}
          {v.modelo ? ` ${v.modelo}` : ''}
          {v.color ? ` · ${v.color}` : ''}
        </span>
      ))}
    </div>
  );
}
