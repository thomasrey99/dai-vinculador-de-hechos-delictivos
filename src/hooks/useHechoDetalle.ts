import { useEffect, useState } from 'react';
import type { HechoDetalle } from '@/lib/types';

/** Pide a /api/hechos/[id] el detalle completo del hecho seleccionado. */
export function useHechoDetalle(id: number | null) {
  const [detalle, setDetalle] = useState<HechoDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) {
      setDetalle(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setDetalle(null);

    fetch(`/api/hechos/${id}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Error ${res.status}`);
        }
        return res.json();
      })
      .then((d: HechoDetalle) => setDetalle(d))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  return { detalle, loading, error };
}