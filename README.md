# Vinculación de Hechos Delictivos — CABA

Dashboard interno (Next.js) que lee las planillas (hoy en `.xlsx` locales,
mañana en Google Sheets con una cuenta de servicio), las une, deduplica
hechos repetidos bajo distintos expedientes, y detecta vinculaciones por
**vehículo compartido**, **modus operandi + cercanía geográfica/temporal**,
y un **buscador de metadatos** sobre todos los campos.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Mapa: generar API key de Carto

El mapa usa los tiles oscuros de Carto (Dark Matter), que desde hace un
tiempo requieren cuenta gratuita:

1. Entrá a [carto.com](https://carto.com/) y creá una cuenta.
2. Generá una API key de Basemaps (te va a dar una URL lista para usar, algo
   como `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=...`).
3. Pegala completa en `NEXT_PUBLIC_MAP_TILE_URL` en tu `.env.local`.

Si no ponés ninguna key, el mapa igual carga pero Carto le pone una marca de
agua de "API KEY REQUIRED" sobre los tiles.

## 3. Fuente de datos: local por ahora

El proyecto viene configurado para leer directamente los `.xlsx` que ya están
en la carpeta `data/` (`2026_NORMALIZADO.xlsx` y `base_de_vehiculos_2026.xlsx`).
No hace falta ninguna credencial para esto — es el modo por defecto
(`DATA_SOURCE=local`).

```bash
cp .env.local.example .env.local
npm run dev
```

Abrí `http://localhost:3000` y ya debería mostrar los hechos.

Si en algún momento reemplazan esos archivos por versiones más nuevas,
simplemente sobreescribilos en `data/` (mismo nombre) y refrescá la página —
el cache interno dura `CACHE_TTL_SECONDS` segundos (5 minutos por defecto), o
entrá a `/api/data?refresh=1` para forzar la relectura inmediata.

## 4. Migrar a Google Sheets online (cuando estén listos)

Cuando quieran pasar a leer las planillas online en vivo, los pasos son:

1. Compartir cada Google Sheet con el email de la cuenta de servicio
   (permiso Lector).
2. En `.env.local`, completar `GOOGLE_SERVICE_ACCOUNT_JSON` y
   `SHEET_ID_PRINCIPAL` / `SHEET_ID_VEHICULOS` (ver `sheetsConfig.ts` para el
   detalle de pestañas: `SAE`, `COLABORACIONES`, `V SIN INGRESO`,
   `PEDIDOS JEFES`, `EXPLOTACION DE PRENSA`).
3. Cambiar `DATA_SOURCE=sheets` en `.env.local`.
4. Reiniciar el servidor.

No hay que tocar ni una línea del pipeline (normalización, dedup, vinculación,
buscador) — `src/lib/dataSource/index.ts` es el único punto que decide de
dónde vienen las filas, y ambas fuentes devuelven exactamente la misma forma
de datos.

## 5. Producción

```bash
npm run build
npm run start
```

## Cómo está armado

```
src/
  lib/
    dataSourceConfig.ts     — toggle local/sheets + rutas de los .xlsx locales
    dataSource/             — capa de acceso a datos (implementación intercambiable)
      local.ts                (lee .xlsx locales con SheetJS)
      index.ts                (decide local vs. sheets según dataSourceConfig)
    sheetsConfig.ts         — IDs de spreadsheet y parámetros de vinculación (modo online)
    sheets.ts               — cliente de Google Sheets API (modo online)
    normalize/             — normalización, un archivo por tipo de dato
      dates.ts               (parseo de fechas en español, ISO)
      coordinates.ts         (coordenadas + haversine)
      plates.ts              (limpieza/validación de patentes)
      address.ts              (normalización de direcciones)
      text.ts                 (redacción de DNI, limpieza de comuna)
      index.ts                (barrel)
    moExtraction.ts         — extracción heurística de modus operandi
    entityResolution/       — deduplicación de "mismo hecho, distinto expediente"
      unionFind.ts            (estructura union-find genérica)
      parseRows.ts            (RawRow -> ParsedRow)
      groupHechos.ts          (agrupa por causa o por fecha+dirección)
      index.ts
    aggregate/               — arma los hechos canónicos
      vehicleMap.ts            (cruce con base_de_vehiculos)
      hechoAggregation.ts      (fusión de filas en un Hecho)
      searchTextBuilder.ts     (arma el corpus de texto de TODAS las columnas para el buscador)
      statsUtils.ts             (moda, etc.)
      index.ts
    linking/                 — motor de vinculación
      vehicleEdges.ts           (vehículo compartido)
      moEdges.ts                (MO + geo + tiempo)
      index.ts
    search/                  — buscador de metadatos
      textNormalize.ts          (normalización + tokenización)
      queryHints.ts             (extrae cantidad de autores, armas, colores, prendas de la consulta)
      bm25.ts                   (índice + score de similitud de texto)
      searchHechos.ts           (combina BM25 + bonificaciones estructuradas)
      index.ts
    pipeline.ts              — orquesta todo lo anterior, con cache en memoria
    types.ts                 — tipos compartidos
  hooks/
    useDashboardData.ts      — fetch de /api/data
    useHechoFilters.ts       — estado de filtros + listas derivadas (modalidades, series)
    useHechoSearch.ts        — estado de la búsqueda, debounce, índice BM25 memoizado
  app/
    api/data/route.ts        — endpoint que devuelve { nodes, edges } ya procesados
    page.tsx / layout.tsx
    globals.css
  components/
    Dashboard.tsx            — orquestador delgado, conecta hooks + subcomponentes
    dashboard/
      DashboardHeader.tsx
      mapColors.ts
      sidebar/
        Sidebar.tsx, LinkTypeToggle.tsx, MoGeoTimeFilters.tsx,
        DateRangeFilter.tsx, ModalidadChips.tsx, RepeatedVehiclesList.tsx
      search/
        SearchBar.tsx, SearchResultsList.tsx
      map/
        MapView.tsx (imperative handle fitToNodes), MapLegend.tsx, drawHechosLayer.ts
      detail/
        HechoCard.tsx, VehicleTags.tsx, MoSummary.tsx, LinkedHechosList.tsx, index.tsx
```

## Cómo funciona el buscador de metadatos

No depende de ninguna API externa (no hay costo ni latencia de red). Combina
dos técnicas:

1. **Similitud de texto (BM25)**: cada hecho tiene un `searchText` que junta
   dirección, modalidad, resultado, comuna, causas, vehículos (patente,
   marca, modelo, color), el MO detectado (traducido a palabras: "arma de
   fuego", "moto", etc.) y el relato completo de todas las intervenciones del
   grupo. El buscador indexa esto una sola vez (se recalcula solo cuando
   cambian los datos) y rankea por relevancia tipo buscador de texto clásico.
2. **Bonificaciones estructuradas**: la consulta se parsea buscando patrones
   como cantidad de personas ("3 masculinos" → autores=3), armas, tipo de
   vehículo, y frases exactas de 2 palabras (para que "remera negra" pese más
   que "remera" y "negra" apareciendo sueltos en el texto). Estas
   coincidencias estructuradas se muestran como "chips" de motivo en cada
   resultado.

Cuando hay una búsqueda activa, el mapa y el conteo de vínculos quedan
acotados a los hechos que matchean (además de los filtros de fecha/modalidad
ya aplicados), para poder ver de un vistazo dónde y cuándo ocurrieron los
hechos similares.

Si en algún momento quieren mejorar la calidad semántica (por ejemplo, que
"remera oscura" también matchee "remera negra" sin que la palabra literal
coincida), la forma natural de escalarlo es agregar una capa de embeddings
vía alguna API de LLM — pero eso implica costo/latencia por búsqueda y queda
fuera del alcance de esta versión, que funciona 100% local.

### Cache

Por defecto, los datos se vuelven a leer cada 5 minutos
(`CACHE_TTL_SECONDS`), tanto en modo local como online. Podés forzar una
relectura inmediata pegándole a `/api/data?refresh=1`.

### Rendimiento con datasets grandes (Google Sheets)

El motor de MO+geo+tiempo usa una grilla espacial para no comparar todos los
hechos entre sí (evita el clásico O(n²) que se queda sin memoria cuando el
Sheet online acumula varios años de historial). Aun así, hay dos límites de
seguridad configurables por variable de entorno:

- `MAX_MODALIDAD_BUCKET_SIZE` (default 6000): si una sola modalidad tiene más
  hechos que esto, solo se analizan los N más recientes para este criterio.
  Los demás igual aparecen en el mapa, solo no generan estas aristas.
- `MAX_MO_EDGES` (default 150000): tope global de aristas de este tipo, por
  si el volumen es tan grande que igual conviene cortar el cómputo.

Los scripts de `npm run dev/build/start` ya corren con
`NODE_OPTIONS=--max-old-space-size=4096` (4GB de heap) por las dudas: subilo
en `package.json` si tu servidor tiene más RAM y necesitás procesar más
historial sin capar los buckets.

### Ajustar el criterio de vinculación

- `LINKING_DEFAULTS` en `sheetsConfig.ts` define el radio y ventana temporal
  máximos, y qué modalidades quedan excluidas del criterio de MO+geo+tiempo
  (por defecto `PARADERO` y `OTROS`, porque generan vínculos sin significado
  real). Los sliders del dashboard filtran en el cliente por debajo de esos
  máximos.
- Las reglas de deduplicación (mismo N° de causa, o misma fecha+dirección)
  están en `entityResolution/groupHechos.ts`.
- Las reglas de limpieza de patentes (qué formatos son válidos, qué strings
  son placeholders como "A DETERMINAR") están en `normalize/plates.ts`.

## 6. Chatbot embebido (agente de Flowise — TBcargo)

El dashboard carga automáticamente el widget de chat de Flowise (esquina
inferior, como popup) desde `src/components/chatbot/FlowiseChatbotWidget.tsx`,
montado en el layout raíz.

**El access token es por usuario, no un valor único global.** La resolución
del token está separada en tres capas para que integrar el login futuro sea
tocar un solo archivo:

- `src/lib/auth/accessToken.ts` — el ÚNICO lugar que sabe "cuál es el token
  del usuario actual". Hoy, sin login, devuelve `NEXT_PUBLIC_ACCESS_TOKEN`
  (default `1234`) para todos. El día que exista el login, esta es la función
  que hay que reescribir (leer de una cookie de sesión, de un context de auth,
  de `localStorage` tras el login, etc. — hay ejemplos comentados adentro).
  También expone `setAccessToken()` / `clearAccessToken()` para que el futuro
  login/logout los llame.
- `src/hooks/useAccessToken.ts` — hook de React que expone ese token y se
  actualiza solo si algo llama a `setAccessToken()`/`clearAccessToken()`.
- `FlowiseChatbotWidget.tsx` — consume el hook, nunca lee
  `NEXT_PUBLIC_ACCESS_TOKEN` directamente. En cada consulta al agente manda el
  token vigente como `$vars.TBCARGO_ACCESS_TOKEN` (así se llama en el Custom
  Function y en el system prompt del Agente del flujo que me pasaste).

**Limitación actual, a tener en cuenta:** el widget de Flowise se inicializa
una sola vez por carga de página (los embeds de terceros suelen registrar un
custom element global del navegador, y llamar a `init()` dos veces puede
romper o duplicar el widget). Si el login llega a resolverse *después* de que
el chat ya cargó, lo más simple y lo que asumí acá es que el login dispare una
navegación o recarga completa — algo que ya pasa en casi cualquier flujo de
auth. Si en el futuro hace falta cambiar el token sin recargar la página, hay
que revisar primero si `flowise-embed` expone algún método de
destrucción/actualización antes de llamar a `init()` de nuevo.

**Pasos manuales necesarios en Flowise (no se pueden hacer desde acá):**

1. **Settings → Variables**: crear una variable llamada `TBCARGO_ACCESS_TOKEN`
   (si no existe ya). Sin esto, Flowise ignora el override.
2. **Settings → Configuration → Security**, en el chatflow: activar
   "Allow Override" y habilitar específicamente que la propiedad `vars` se
   pueda sobrescribir por API/Embed. Desde Flowise 2.1.4, esto viene
   deshabilitado por defecto por seguridad — si no lo activás, el token nunca
   llega al flujo aunque el embed lo mande bien.

**Nota sobre el flujo que me pasaste:** el nodo Start tiene además una
variable de "Flow State" con el mismo nombre `TBCARGO_ACCESS_TOKEN`, pero
ningún otro nodo la lee (el Custom Function y el prompt usan `$vars`, no
`$flow.state`). Parece un intento anterior sin terminar — no rompe nada
dejarla, pero si no la necesitás para otra cosa la podés borrar del Start
para no confundir a futuro.

**Nota sobre el `apiHost`:** `http://10.108.0.3:3030` es una IP de red local.
Va a funcionar mientras el navegador que abre el dashboard esté en la misma
red que esa instancia de Flowise. Si en algún momento accedés al dashboard
desde afuera de esa red (otra oficina, VPN distinta, etc.), el chat va a
fallar en cargar — en ese caso hay que exponer Flowise en una URL alcanzable
desde donde sea que uses el dashboard.

Variables de entorno relacionadas (ver `.env.local.example`):
`NEXT_PUBLIC_ACCESS_TOKEN`, `NEXT_PUBLIC_FLOWISE_CHATFLOW_ID`,
`NEXT_PUBLIC_FLOWISE_API_HOST`.

## Pendiente / posibles mejoras

- Matching de personas/autores (necesitaría un campo de nombre de sospechoso
  limpio, que hoy no existe en estas planillas).
- Ventanas de radio/tiempo específicas por tipo de delito, en vez de un
  slider global.
- Autenticación de usuarios si el dashboard va a estar expuesto fuera de una
  red interna.
