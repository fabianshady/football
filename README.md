# ITJAGUARS FC · Sitio público

Sitio en español para consultar equipos, partidos, estadísticas, plantilla y aportaciones pendientes del club. Este repositorio (`football`) contiene la aplicación pública; [football-admin](https://github.com/fabianshady/football-admin) contiene la administración (carpeta local `../app_futbol`). Ambas aplicaciones comparten el mismo proyecto Supabase.

## Requisitos y arranque

- **Node.js 22** y npm (también utilizados por CI y Docker).
- Un proyecto Supabase con el contrato de base de datos descrito abajo.

```sh
npm ci
cp .env.example .env.local
# Completar las variables de .env.local
npm run dev
```

Abrir http://localhost:3000. Para ejecutar simultáneamente la administración, iniciar aquella aplicación en otro puerto: `npm run dev -- --port 3002`.

### Variables de entorno

La plantilla `.env.example` contiene únicamente nombres y valores vacíos. El sitio público usa un cliente **server-only**, sin sesión de usuario:

| Variable | Uso |
| --- | --- |
| `SUPABASE_URL` | URL del proyecto; configuración de servidor preferida. |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publicable; configuración de servidor preferida. |
| `NEXT_PUBLIC_SUPABASE_URL` | Alternativa compatible a la URL de servidor. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Alternativa compatible a la clave de servidor; también utilizada por administración. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Última alternativa para instalaciones con la antigua clave `anon`. |

Completar la pareja de servidor **o** la pareja `NEXT_PUBLIC_`. Las variables de servidor tienen prioridad y permiten configurar el contenedor al arrancar. Solo se necesita una clave publicable/anon, **no una clave `service_role`**. Obtener URL y clave en la configuración API del proyecto Supabase. Los archivos `.env*` locales están excluidos de Git salvo la plantilla.

Sin credenciales, el sitio muestra un estado explícito de configuración no disponible. Una consulta fallida llega al límite de error de la ruta; no se presenta como una lista vacía ni como estadísticas con ceros.

## Rutas

| Ruta | Contenido |
| --- | --- |
| `/` | Presentación del club, equipos y próximos partidos. |
| `/[equipo]` | Resumen del equipo y temporada seleccionada. |
| `/[equipo]/partidos` | Archivo con búsqueda y filtros. |
| `/[equipo]/estadisticas` | Métricas, gráficos SVG y goleadores. |
| `/plantilla` | Jugadores activos y totales acumulados. |
| `/finanzas` | Aportaciones pendientes y datos públicos de transferencia. |
| `/partido/[id]` | Marcador, goles, convocatoria, uniforme y pizarra de fútbol 7. |

Los slugs provienen de `team` (actualmente `itjaguars` e `itj-fc`); `/itj` es una ruta obsoleta. `?temporada=<id>` mantiene la selección entre páginas del equipo. Equipos, temporadas o partidos inexistentes muestran la vista 404.

## Arquitectura y datos

- Next.js 16.1.6 App Router, React 19 y TypeScript.
- Tailwind CSS 4: tokens y estilos en `app/globals.css`, sin configuración legacy de Tailwind.
- `app/`: rutas y estados de carga, error y no encontrado.
- `components/`: navegación, tema, partidos, plantilla, finanzas y gráficos SVG.
- `lib/queries.ts`: consultas de servidor; React `cache` deduplica dentro de la petición.
- `lib/supabase.ts`: cliente anónimo tipado, sin persistencia de sesión.
- `lib/database.types.ts`: tipos generados del esquema compartido.
- `lib/datetime.ts`, `lib/matches.ts`, `lib/public.ts`: fechas, mapeo y reglas de presentación.
- `supabase/migrations/`: historial SQL compartido; `docs/db/`: verificación y procedimientos manuales.

Las listas leen `v_match`, `v_team_season_stats`, `v_team_season_monthly`, `v_player_stats` y `v_player_debt`. El detalle usa las relaciones deportivas de `Match`, `Goal`, `MatchSquad` y `Player`. Finanzas consume la proyección pública acotada `v_player_debt`, sin consultar directamente `Event` o `Payment`. `club_settings` contiene los datos públicos de contacto y transferencia.

### Tiempo y estadísticas

Los partidos se guardan como instantes UTC y se muestran principalmente en **America/Tijuana**, con horario de verano real. La zona del visitante aparece como información secundaria. No usar un desplazamiento UTC fijo ni deducir la fecha local a partir del día UTC.

Para eventos financieros de fecha única, el admin convierte el día seleccionado a **mediodía de Tijuana** y almacena el instante UTC. El admin los presenta con `formatCalendarDate` en Tijuana; `/finanzas` público actualmente formatea el instante con `Intl.DateTimeFormat` en UTC. Los eventos nuevos guardados a mediodía conservan el mismo día en ambas zonas; esto no garantiza que cualquier timestamp histórico arbitrario represente el mismo día local.

Las estadísticas de resultados consideran partidos con fecha pasada. El esquema no contiene un estado de finalización: un partido pasado sin jugar con marcador 0–0 puede contar como empate.

### Contrato compartido de Supabase

La migración **`20261007024919_club_contract.sql`**, nombre remoto `club_contract`, fue aplicada el **7 de octubre de 2026, 02:49:19 UTC**. Añade catálogo de equipos, horarios, configuración del club, vistas, autorización `is_admin()` y RPCs atómicas para administración. Los IDs siguen siendo texto y son generados por la base de datos. Iniciar la aplicación no ejecuta migraciones.

El cierre financiero **`20261007190054 / financial_public_projection_lockdown`** ya fue aplicado por la tarea coordinadora mediante la herramienta de migraciones, antes del despliegue de `dev`. El privilegio `SELECT` de `anon` es **false** para `Event` y `Payment`; la proyección sanitizada `v_player_debt` sigue accesible y devolvió **14 filas en la comprobación posterior** (snapshot dinámico, no un conteo garantizado). **El sitio legacy de `main`, que lee esas tablas directamente, pierde esa funcionalidad con el cierre**; esta versión usa la proyección compatible. Ver [estado y registro SQL](docs/db/MIGRATION_HANDOFF.md); no repetir la migración aplicada.

La protección de contraseñas filtradas sigue pendiente: requiere **Pro o superior**. MCP no dispone de herramienta para ajustes Auth y el CLI no tiene token/sesión de Management API (`supabase projects list` falló). El propietario debe activar **Leaked password protection** en Dashboard → Authentication → Email → Password security. [Requisitos e instrucciones de Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Comprobaciones

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

`typecheck` genera los tipos de rutas de Next antes de ejecutar TypeScript. `npm test` ejecuta `tests/public/*.test.ts` con el runner de Node 22 y cubre fechas/DST, mapeo, selección de temporada y tema. Para servir una compilación local: `npm run start`.

La [verificación de navegador de solo lectura](tests/e2e/README.md) describe requisitos, comandos, cobertura y evidencia. Necesita Playwright instalado externamente y configuración Supabase real; no forma parte de `npm test`.

## Desarrollo y despliegue

1. Trabajar en `dev` y ejecutar las comprobaciones locales.
2. Publicar `dev` y validar el despliegue Preview/de pruebas configurado en el proveedor: navegación, ambos equipos, temporadas, fechas de Tijuana, finanzas y tema en móvil/escritorio.
3. Probar también administración con una cuenta autorizada y comprobar los límites anónimo/no administrador.
4. Tras validar ambos repositorios, abrir y revisar el cambio `dev` → `main`; la integración en producción es **manual**.

Workflows actuales:

| Workflow | Disparador y función |
| --- | --- |
| `ci.yml` | PR hacia `main`: lint, tipos, tests y build con Node 22. |
| `predeploy.yml` | Push a `main`: repite las comprobaciones. Solo bloquea Vercel si se configura como check requerido en el proveedor. |
| `docker.yml` | Push a `main`: publica `linux/arm64` en GHCR como `app_futbol_public`, etiquetas `latest` y SHA corto. |

Los workflows públicos omiten ciertos cambios solo documentales. La build de CI usa valores ficticios y no verifica conectividad ni datos reales. Los despliegues Preview dependen de la integración Git del proveedor; estos workflows no crean uno por sí mismos ni aplican migraciones.

## Docker

El Dockerfile usa Node 22, build standalone mediante `NEXT_PRIVATE_STANDALONE=true` y usuario no root. El puerto del contenedor es **3001**, distinto del puerto local predeterminado.

```sh
docker build -t itjaguars-public .
docker run --rm -p 3001:3001 --env-file .env.local itjaguars-public
```

Con `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` se configura el servidor en runtime. Si se utiliza la pareja `NEXT_PUBLIC_`, pasar también los argumentos de compilación `--build-arg NEXT_PUBLIC_SUPABASE_URL` y `--build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` con esas variables exportadas en el shell. GHCR las obtiene de los secrets de GitHub con esos mismos nombres.

## Documentación

- [Sistema visual y comportamiento](docs/design/DESIGN.md).
- [Estado del contrato de base de datos](docs/db/MIGRATION_HANDOFF.md).
- [Notas, permisos, verificación y rollback](docs/db/MIGRATION_NOTES.md).
- [Verificación de navegador](tests/e2e/README.md).

Repositorio privado mantenido por [fabianshady](https://github.com/fabianshady), sin licencia declarada.
