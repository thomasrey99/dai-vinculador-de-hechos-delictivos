# Embeber el chatbot de TB Cargo en el dashboard (Next.js)

Guía paso a paso para embeber el widget del Agentflow de Flowise directamente
en una app Next.js, usando el paquete oficial `flowise-embed-react`.

**Contexto / cuándo usar esta guía:** aplica cuando la instancia de Flowise y
el proyecto Next viven en la **misma red privada** (mismo servidor, misma
VPN, misma LAN de la empresa). En ese caso el widget puede llamar a Flowise
directo desde el navegador, sin necesidad de armar un backend propio que
haga de proxy.

⚠️ Si en algún momento alguien fuera de esa red privada (un cliente externo,
alguien conectándose desde afuera de la oficina) necesita abrir el
dashboard, esta forma de embeber **no va a funcionar** para esa persona: el
`apiHost` es una IP privada (por ejemplo `http://10.108.0.3:3030`) que solo
resuelve dentro de la red. Para ese caso hay que exponer Flowise
públicamente y, mejor, pasar las llamadas por un backend propio (Next API
Route) en vez del widget directo — es un enfoque distinto, avisen si hace
falta y lo armamos aparte.

## 1. Conseguir el `chatflowid` y el `apiHost`

1. Abrí el Agentflow `TB Cargo - Agente Cliente` en Flowise.
2. Arriba a la derecha, ícono `</>` (**Embed in website or use as API**).
3. En la pestaña **Embed**, subpestaña **Popup React** (no "Popup Html" —
   esa es para HTML plano, nosotros usamos el paquete de React).
4. Copiá los dos valores que aparecen en el snippet:
   - `chatflowid`: el ID del Agentflow (ej: `150e3973-d936-4df5-ab5d-0b35fae4b0ca`)
   - `apiHost`: la URL/IP donde corre Flowise (ej: `http://10.108.0.3:3030`)

## 2. Instalar el paquete en el proyecto Next

Desde la raíz del proyecto Next:

```bash
npm install flowise-embed flowise-embed-react
```

## 3. Variables de entorno

Agregar en `.env.local` (en la raíz del proyecto Next). Estas SÍ llevan el
prefijo `NEXT_PUBLIC_` a propósito: el widget corre en el navegador del
usuario, así que necesita poder leerlas del lado del cliente.

```bash
NEXT_PUBLIC_FLOWISE_API_HOST=http://10.108.0.3:3030
NEXT_PUBLIC_FLOWISE_CHATFLOW_ID=150e3973-d936-4df5-ab5d-0b35fae4b0ca
```

Reemplazar por los valores reales copiados en el paso 1. Si el proyecto ya
tiene un `.env.local` con otras variables, solo agregar estas dos líneas.

## 4. Crear el componente del chat

Crear el archivo `app/components/TBCargoChat.tsx` (ajustar la ruta si el
proyecto no usa App Router) con este contenido:

```tsx
'use client';

import dynamic from 'next/dynamic';

const BubbleChat = dynamic(
  () => import('flowise-embed-react').then((mod) => mod.BubbleChat),
  { ssr: false }
);

export default function TBCargoChat() {
  return (
    <BubbleChat
      chatflowid={process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID!}
      apiHost={process.env.NEXT_PUBLIC_FLOWISE_API_HOST!}
    />
  );
}
```

**Por qué `dynamic(..., { ssr: false })`:** el widget manipula el DOM del
navegador directamente (no está pensado para renderizarse en el servidor).
Si se importa de forma normal, Next va a intentar renderizarlo en el
servidor durante el build/SSR y puede romper o generar errores de
hidratación. `ssr: false` le dice a Next que este componente solo se cargue
y renderice en el navegador.

## 5. Montarlo en el layout

Para que la burbuja de chat aparezca en todas las páginas del dashboard,
agregarlo en `app/layout.tsx`, dentro del `<body>`:

```tsx
import TBCargoChat from './components/TBCargoChat';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <TBCargoChat />
      </body>
    </html>
  );
}
```

Si en cambio se quiere el chat solo en una página puntual del dashboard (no
en todas), importar `TBCargoChat` únicamente en esa página en vez de en el
layout general.

## 6. Habilitar CORS en el servidor de Flowise

Como el widget llama a Flowise **directo desde el navegador** (no pasa por
ningún backend propio), el servidor de Flowise tiene que permitir que el
origen del dashboard Next le hable. Configurar estas variables de entorno
en el servidor donde corre Flowise (no en el proyecto Next):

```bash
CORS_ORIGINS=https://tu-dashboard.tu-red-privada.local
IFRAME_ORIGINS=https://tu-dashboard.tu-red-privada.local
```

Si el dashboard corre en varios dominios/puertos durante desarrollo (por
ejemplo `http://localhost:3001` en local y otra URL en el servidor privado),
se pueden separar por coma. Usar `*` en ambas si no hace falta restringir
(por ejemplo, si toda la red privada ya es de confianza), pero no es lo
recomendado si esa red la comparten otras apps o equipos.

Después de cambiar estas variables, reiniciar el servidor de Flowise para
que tomen efecto.

## 7. Probar

1. Levantar el proyecto Next (`npm run dev` o el deploy que corresponda).
2. Abrir el dashboard desde un navegador **dentro de la red privada**.
3. Debería aparecer la burbuja de chat flotante (ícono abajo a la derecha,
   por defecto).
4. Al abrirla y escribir, tiene que responder igual que en el chat de
   prueba de Flowise.

## Checklist de errores comunes

- **La burbuja no aparece**: revisar la consola del navegador (F12). Si hay
  un error de import, confirmar que `flowise-embed` y `flowise-embed-react`
  quedaron instalados (`npm ls flowise-embed-react`).
- **Error de CORS en la consola** (`blocked by CORS policy`): falta agregar
  el origen del dashboard en `CORS_ORIGINS`/`IFRAME_ORIGINS` del servidor de
  Flowise (paso 6), o el servidor no se reinició después de cambiarlas.
- **La burbuja aparece pero no responde / error de red**: confirmar que
  `NEXT_PUBLIC_FLOWISE_API_HOST` sea alcanzable desde el navegador de quien
  prueba (hacer `curl http://10.108.0.3:3030` desde esa misma máquina/red
  para descartar que sea un tema de conectividad y no del widget).
- **Funciona en el servidor pero no para alguien fuera de la red privada**:
  esperable — ver la nota de la sección "Contexto" arriba. Ese caso necesita
  el enfoque de backend propio, no este.

## Nota sobre autenticación

Al momento de escribir esto, el chatflow está configurado en Flowise sin
autorización ("No Authorization"). Como el `apiHost` es una IP privada, hoy
queda protegido por estar dentro de la red interna, no por una API key. Si
esa red la comparten otras apps/equipos además de este dashboard, se puede
sumar una API Key al chatflow en Flowise (**Embed → dropdown "No
Authorization"**) para una capa extra de seguridad — no es obligatorio para
que esta guía funcione, pero vale tenerlo en cuenta.
