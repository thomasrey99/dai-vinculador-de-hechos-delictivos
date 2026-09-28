import { useEffect, useState } from 'react';
import type { DashboardData } from '@/lib/types';

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/data')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Error ${res.status}`);
        }
        return res.json();
      })
      .then((d: DashboardData) => setData(d))
      .catch((e) => setLoadError(e.message));
  }, []);

  return { data, loadError };
}
