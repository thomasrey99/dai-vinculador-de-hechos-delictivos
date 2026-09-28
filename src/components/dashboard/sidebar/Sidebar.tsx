import type { Hecho } from '@/lib/types';
import type { SeriesItem } from '@/hooks/useHechoFilters';
import type { SearchResult } from '@/lib/search';
import { LinkTypeToggle } from './LinkTypeToggle';
import { MoGeoTimeFilters } from './MoGeoTimeFilters';
import { DateRangeFilter } from './DateRangeFilter';
import { ModalidadChips } from './ModalidadChips';
import { RepeatedVehiclesList } from './RepeatedVehiclesList';
import { SearchBar, SearchResultsList } from '../search';

interface SidebarProps {
  sourceErrors?: string[];
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  searchResults: SearchResult[];
  onSelectSearchResult: (id: number) => void;
  activeTypes: Set<string>;
  onToggleType: (type: string) => void;
  radiusMax: number;
  daysMax: number;
  onRadiusChange: (v: number) => void;
  onDaysChange: (v: number) => void;
  dateFrom: string;
  dateTo: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  modalidadCounts: [string, number][];
  activeModalidades: Set<string>;
  onToggleModalidad: (m: string) => void;
  seriesList: SeriesItem[];
  nodesById: Map<number, Hecho>;
  onSelectSeries: (ids: number[]) => void;
  onReset: () => void;
}

export function Sidebar(props: SidebarProps) {
  return (
    <div id="left">
      {props.sourceErrors && (
        <div className="error-banner">
          {props.sourceErrors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}

      <SearchBar query={props.searchQuery} onChange={props.onSearchQueryChange} />
      <SearchResultsList
        results={props.searchResults}
        query={props.searchQuery}
        onSelect={props.onSelectSearchResult}
      />

      <LinkTypeToggle activeTypes={props.activeTypes} onToggle={props.onToggleType} />

      <MoGeoTimeFilters
        radiusMax={props.radiusMax}
        daysMax={props.daysMax}
        onRadiusChange={props.onRadiusChange}
        onDaysChange={props.onDaysChange}
      />

      <DateRangeFilter
        dateFrom={props.dateFrom}
        dateTo={props.dateTo}
        onFromChange={props.onFromChange}
        onToChange={props.onToChange}
      />

      <ModalidadChips
        counts={props.modalidadCounts}
        active={props.activeModalidades}
        onToggle={props.onToggleModalidad}
      />

      <RepeatedVehiclesList
        seriesList={props.seriesList}
        nodesById={props.nodesById}
        onSelect={props.onSelectSeries}
      />

      <span id="reset-btn" onClick={props.onReset}>Limpiar filtros</span>
    </div>
  );
}
