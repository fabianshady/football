# Recursos de marca y metadatos

## Fuente y reproducción

Las seis imágenes de `resources/` fueron aportadas por el propietario del proyecto. Se conservan como fuentes de edición; no se sirven al navegador ni se incluyen en el contexto Docker. No hay una licencia comercial externa declarada para estas imágenes. El escudo original es `public/logo.png`.

Ejecutar `npm run prepare:brand` (Sharp, versión fijada en `package-lock.json`) para regenerar `public/brand/`. El comando informa dimensiones y bytes de cada salida. Los archivos generados se versionan y la compilación no necesita ejecutar el script.

| Fuente | Salida | Uso |
| --- | --- | --- |
| `og-home.png` | `brand/og-home.png`, 1200×630 | Fondo claro de tarjeta principal; texto añadido por ImageResponse. |
| `og-background.png` | `brand/og-background.png`, 1200×630 | Fondo oscuro de tarjetas de equipo y partido. |
| `empty-states-1.png` | `brand/empty-goals.webp`, 640×640 | Estado sin goles en detalle del partido. |
| `empty-states-2.png` | `brand/empty-lineup.webp`, 640×640 | Estado de convocatoria pendiente en detalle del partido. |
| `empty-states-3.png` | `brand/empty-head-to-head.webp`, 640×640 | Estado sin historial rival. |
| `icon-maskable.png` + escudo | `brand/icon-maskable-512.png` | Anillo decorativo con escudo centrado de 170×170, dentro de la zona segura. |
| Escudo | `brand/logo.webp`, `brand/logo.png` | Marca optimizada para UI y JSON-LD/OG respectivamente. |
| Escudo | `brand/icon-{32,180,192,512}.png` | Favicon, Apple y manifest. |

Los fondos OG usan PNG indexado para compatibilidad con ImageResponse. Las ilustraciones WebP conservan transparencia. El anillo vacío no sustituye el escudo. `public/preview.png` es un recurso legacy conservado; los metadatos nuevos no lo usan.

## SEO y tarjetas sociales

`lib/seo.ts` centraliza origen, canonical, Open Graph, Twitter y serialización JSON-LD segura. Cada ruta pública define título, descripción y canonical. Las variantes de equipo con temporada válida llevan canonical de esa selección; sin filtro, el canonical es la ruta base. Las tarjetas de equipo muestran el historial de todas las temporadas, etiquetado explícitamente. Partido y equipo usan sus propias rutas `opengraph-image`; plantilla, jugador y finanzas comparten la tarjeta de marca.

`SportsTeam` identifica el club/equipo y su escudo. `SportsEvent` usa fecha UTC real, sede textual y competidores; no infiere localía, estado de finalización ni coordenadas. Los marcadores pasados se llaman **registrados**: la fecha pasada no confirma que se jugó. Finanzas tiene descripción genérica sin nombres, deudas ni datos bancarios.

`SITE_URL` configura el origen canónico (por defecto `https://itjaguars.fabianms.com`). `VERCEL_ENV` tiene prioridad sobre `SITE_ENV`; solo `production` permite indexar. En hosting propio, sin esas variables, `NODE_ENV=production` permite indexar; configurar `SITE_ENV=preview` para un contenedor de pruebas. En desarrollo/preview los metadatos usan noindex, robots bloquea todo y sitemap está vacío. Sitemap de producción contiene rutas públicas e IDs, sin nombres financieros, filtros ni fechas de modificación inventadas. Un error de consulta se propaga; solo las tarjetas OG tienen fallback estable de marca.

Las tarjetas leen sus fondos y escudo locales con Node. El build standalone debe distribuir `public/` (el Dockerfile ya lo copia). No hay solicitud a almacenamiento externo para las imágenes de metadatos.

## Verificación de esta entrega

Verificación final contra Supabase live con phase2 `20261008235036`: lint, tipos, 26 pruebas públicas, 15 pruebas admin y ambos builds pasan; los tipos compartidos son idénticos. Con servidores compilados: 165 comprobaciones públicas (136 móvil/escritorio claro/oscuro, 24 selecciones de temporada y 5 preview), 32 comprobaciones admin y 74 enlaces/recursos pasan. Las 22 fichas, incluida la plantilla de 18 activos y membresías `player_team`, funcionan. Sitemap de producción devuelve 100 URLs únicas; preview devuelve cero y robots bloqueado. Ocho tarjetas OG, incluidos IDs desconocidos, y dos fallbacks sin configuración devuelven PNG 1200×630. Los cinco iconos tienen rutas y dimensiones correctas. No hay OG raíz duplicado ni uso de `preview.png` en metadatos.

El escudo original pesa 1.881.229 bytes (1024×1024); la UI pública usa `brand/logo.webp`, 61.192 bytes (384×384), mediante optimización de Next Image. Admin también usa Next Image, pero sus enlaces favicon/Apple todavía apuntan al original `/logo.png`. Las respuestas OG finales pesan aproximadamente 706–817 KB: optimizar los fondos no garantiza que ImageResponse produzca una respuesta del mismo tamaño. Se conservan originales y recursos legacy.

La instrumentación Vercel se monta únicamente con `VERCEL=1`, evitando scripts 404/MIME en hosting propio. Se verificaron cero errores de consola, excepciones, fallos reales de red y escrituras intentadas. Las cancelaciones `GET ?_rsc` por navegación se registran aparte. No hay partidos futuros en este snapshot; los límites temporales futuros se cubren en pruebas unitarias. No se usaron credenciales ni sesiones autenticadas, y no se ejecutó SQL remoto. Evidencia y límites completos: `tests/e2e/README.md`.
