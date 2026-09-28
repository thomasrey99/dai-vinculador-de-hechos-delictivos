'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth/accessToken';

/**
 * Token del usuario actual. Se recalcula solo si algo llama a setAccessToken()
 * / clearAccessToken() en cualquier parte de la app (por ejemplo, el futuro
 * flujo de login al terminar de autenticar, o un botón de logout).
 *
 * Ningún componente debería leer NEXT_PUBLIC_ACCESS_TOKEN directamente — todos
 * pasan por este hook (que a su vez pasa por accessToken.ts, el único lugar
 * que hay que tocar cuando llegue el login real).
 */
export function useAccessToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(getAccessToken());

    const handleChange = () => setToken(getAccessToken());
    window.addEventListener('access-token-changed', handleChange);
    return () => window.removeEventListener('access-token-changed', handleChange);
  }, []);

  return token;
}
