/**
 * ÚNICO PUNTO donde se resuelve "cuál es el access token del usuario actual".
 *
 * HOY (sin login): no hay usuarios ni sesiones todavía, así que devuelve
 * NEXT_PUBLIC_ACCESS_TOKEN (default "1234") para todo el mundo — es un
 * placeholder, no una decisión de arquitectura definitiva.
 *
 * MAÑANA (con login): cuando exista el sistema de login que guarda un token
 * por usuario, ESTE es el único archivo que hay que tocar. Ejemplos según
 * cómo terminen guardando el token:
 *
 *   // Si lo guardan en una cookie de sesión (ej. seteada por el backend al loguearse):
 *   export function getAccessToken(): string | null {
 *     return getCookie('access_token');
 *   }
 *
 *   // Si usan un context de auth de React (ej. AuthProvider con useAuth()):
 *   // en ese caso esta función deja de tener sentido como está y el token
 *   // se lee directo del context en el hook useAccessToken (ver ese archivo)
 *   // en vez de desde acá.
 *
 *   // Si lo guardan en localStorage tras el login:
 *   export function getAccessToken(): string | null {
 *     return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
 *   }
 *
 * El resto de la app (el widget de Flowise, y cualquier otra cosa que en el
 * futuro necesite "el token del usuario actual") nunca debería leer
 * NEXT_PUBLIC_ACCESS_TOKEN directamente — todos pasan por acá.
 */

const DEFAULT_ACCESS_TOKEN = process.env.NEXT_PUBLIC_ACCESS_TOKEN || '1234';

const LOCAL_STORAGE_KEY = 'access_token';

/**
 * Devuelve el token del usuario actual, o null si todavía no se resolvió
 * (por ejemplo, mientras carga la sesión). Placeholder actual: intenta
 * localStorage primero (por si algo ya lo dejó guardado ahí — algo común una
 * vez que exista el login) y si no hay nada, cae al default global.
 */
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) return stored;
  }
  return DEFAULT_ACCESS_TOKEN;
}

/**
 * Guarda el token del usuario actual. Pensado para que el futuro flujo de
 * login llame a esto apenas el usuario se autentica (ej. justo después de
 * recibir la respuesta del endpoint de login). Los componentes que ya están
 * usando useAccessToken() se actualizan solos al detectar el cambio.
 */
export function setAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, token);
    window.dispatchEvent(new CustomEvent('access-token-changed'));
  }
}

/** Limpia el token guardado (ej. al hacer logout), volviendo al default global. */
export function clearAccessToken(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('access-token-changed'));
  }
}
