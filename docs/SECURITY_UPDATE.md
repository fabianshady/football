# Actualización de seguridad de Next.js · 2026-11-02

## Alcance

Se actualizan el sitio público y el admin, conservando el trabajo de rendimiento pendiente en `dev`. No hay cambios en Supabase ni en sus permisos. Esta actualización local no corrige por sí sola el despliegue existente: requiere reconstruir y desplegar ambos proyectos.

| Dependencia | Antes | Después |
| --- | --- | --- |
| `next` | 16.1.6 | **16.4.4**, versión exacta en ambos manifiestos |
| `eslint-config-next` | 16.1.6 | **16.4.4**, alineada con el framework |
| `sharp` | 0.34.5 | **0.35.5**, directa en el público y transitiva de Next en el admin |

Se regeneran ambos `package-lock.json`. `ws`, `source-map-js` y `baseline-browser-mapping` reciben actualizaciones transitivas compatibles cuando corresponde. Un seguimiento posterior (ver «Resultado final de auditoría») actualizó además, de forma compatible, `@humanfs`, `brace-expansion`, `flatted`, `js-yaml`, `picomatch` y `browserslist`. No se ejecutó `npm audit fix --force`, ni se actualizaron React o las reglas de negocio. Node.js 22 sigue siendo compatible.

16.4.4 es la [versión estable publicada consultada](https://github.com/vercel/next.js/releases/tag/v16.4.4). Next anunció [otro parche de seguridad para el 3 de noviembre de 2026](https://nextjs.org/blog/upcoming-nextjs-security-release-november-2026), que atenderá siete vulnerabilidades medias cuyos avisos aún no se publican a la fecha de esta verificación. Revisar la versión disponible y volver a auditar antes del despliegue; no se instaló un canary ni se afirma que 16.4.4 incluya ese parche futuro.

## Avisos atendidos

- [RCE en optimización de imágenes SVG · GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw): Next 16.4.1 o superior; requiere resolver Sharp 0.35.5 o superior. Se comprueba el árbol instalado, no solo el número de Next.
- [RCE en funciones `use cache` · GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr): corregido desde Next 16.4.1. No se usa la ausencia de esa función como sustituto de actualizar.
- El cambio también retira los avisos anteriores de Next 16.1.6 reportados por npm sobre Server Actions, RSC, proxy y procesamiento de imágenes. No se ejecutaron exploits ni se infiere que hubiese una intrusión.

## Verificación y límites

En ambos repositorios pasaron lint, generación de tipos, TypeScript, tests y compilación de producción sobre Next 16.4.4. El sitio público tiene **26 tests** y el admin **29** tests unitarios (13 checks adicionales del fixture, ver abajo). La última actualización transitiva solo se reverificó con tests unitarios y build; no se repitieron las pruebas de navegador/fixture después de ella, así que la evidencia de runtime de abajo corresponde al estado previo a esa actualización.

No se construyeron imágenes Docker en esta máquina: el daemon está apagado. Los Dockerfiles siguen usando Node 22 y los lockfiles incluyen los binarios Sharp 0.35.5 para Linux ARM64/musl; la construcción real de la imagen sigue siendo una comprobación del entorno de publicación.

`npm audit --omit=dev` devuelve **0 vulnerabilidades** en ambos árboles instalados y resueltos por sus lockfiles. Esto no significa ausencia absoluta de vulnerabilidades. El resultado depende de la base de avisos de npm en la fecha de ejecución.

**Historial (antes del seguimiento):** la auditoría completa conservaba 21 avisos en el público (17 moderados, 4 altos) y 20 en el admin (17 moderados, 3 altos), todos fuera del árbol de producción, sin críticos. Se conserva como registro; ya no es el estado actual.

## Resultado final de auditoría (2026-11-02)

Tras actualizar de forma compatible `@humanfs`, `brace-expansion`, `flatted`, `js-yaml`, `picomatch` y `browserslist`, ambos repositorios quedan así:

- Producción (`npm audit --omit=dev`): **0**.
- Altos/críticos en el árbol completo: **0** (`npm audit --audit-level=high` sale con 0, aunque imprime los avisos moderados).
- Auditoría completa: **16 avisos moderados** en cada repositorio (antes 21→16 en el público y 20→16 en el admin), todos de herramientas de desarrollo y con la misma causa en cascada: un único aviso, [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) en `minimatch` < 11.0.1.
- `npm audit` sin opciones **sale con código 1** actualmente. No se ignora ni se oculta: no se afirma que todos los avisos estén corregidos ni que la auditoría completa esté limpia.

### Por qué quedan los 16 moderados

- Los plugins actuales de ESLint (`react`, `import`, `jsx-a11y`) requieren `minimatch` 3 por su API invocable; `typescript-eslint` requiere la versión 10. Ninguna versión corregida (≥ 11.0.1) satisface esos rangos declarados; además, forzarla en los consumidores de 3.x rompe su importación invocable. No se presupone compatibilidad solo porque npm permita un override.
- ESLint 10, aún moderno, sigue requiriendo `minimatch` 10 (afectado). ESLint 9 está fuera de soporte (EOL); ambos repositorios fijan `eslint` en la última 9.x, **9.39.5**, y npm muestra el aviso de deprecación (línea de «unsupported») al instalar.
- No se usan `overrides`, shims, supresiones personalizadas, `npm audit fix --force` ni degradaciones de ESLint (p. ej. a 4). La corrección depende de actualizaciones upstream o de una migración de lint revisada por el mantenedor; no se eliminan reglas para esquivar el aviso.

### Riesgo y recomendación

El aviso afecta a patrones `glob` de `minimatch` procesados por herramientas de lint. Solo se debe ejecutar lint sobre repositorios de confianza y con globs propios; no usar patrones arbitrarios o no confiables. Un PR no confiable puede controlar la configuración de ESLint, y esa configuración ya ejecuta código arbitrario al correr el lint, por lo que no basta con descartar el aviso como «solo desarrollo»: en CI no se debe lintear código de PR no confiable con secretos. Producción sigue en 0 y no hay altos ni críticos; los 16 moderados requieren actualizaciones upstream o la migración de lint mencionada.

Los workflows de ambos repositorios ya ejecutan, tras `npm ci`, `npm audit --omit=dev` (esperado 0) y `npm audit --audit-level=high` (sale con 0, imprime 16). El primer paso rechaza cualquier aviso de producción; el segundo rechaza altos/críticos también de desarrollo. `npm audit` plano no se usa como puerta mientras exista el aviso moderado descrito, pero no se silencia su salida. Para bloquear despliegues, el proveedor debe exigir esos checks; publicar un workflow no configura automáticamente esa política.

Tras actualizar aparecieron referencias antiguas en `.next/dev/types`; se eliminaron únicamente los directorios de tipos generados y se regeneraron. No fue necesario desactivar tipos ni debilitar controles de permisos. Next añadió su importación generada `root-params.d.ts` a `next-env.d.ts`.

Los builds de fixture deben reconstruirse con el entorno normal después de las pruebas, ya que las variables `NEXT_PUBLIC_*` se incorporan al bundle. La validación en localhost no sustituye la comprobación del despliegue real. Los cambios se publican en `dev` tras la verificación final; no se modifica `main` ni se ejecutan migraciones de base de datos en este seguimiento.

## Publicación

1. Revisar y publicar ambos `dev` con sus lockfiles.
2. Construir con `npm ci`, ejecutar checks y audit de producción, y probar navegación, login y previews.
3. Desplegar imágenes/bundles nuevos; no reutilizar la imagen anterior ni un build de fixture.
4. Comprobar la versión resuelta en el artefacto publicado. El sitio que sigue ejecutando 16.1.6 continúa pendiente de actualización.

## Evidencia de ejecución en runtime (2026-11-02)

Ejecutada con Next 16.4.4 en ambos repos, Node 22.16.0, sin cookies, credenciales ni escrituras a base de datos reales.

- **Admin, fixture sintético** (`tests/e2e/admin-performance.mjs --build --runs 2`, backend local en `127.0.0.1:54329`, Playwright externo): **13/13 checks** correctos. Cubren redirecciones de anónimo, token inválido/expirado, no-admin sin lecturas protegidas, una consulta `is_admin` y 1–2 llamadas a Auth por carga (HS256 puede necesitar una validación adicional de `getClaims` en el proxy), sin fuga de caché entre peticiones (secuencial y concurrente), lecturas en paralelo, navegación real por todas las páginas admin, un único editor modal montado de forma perezosa en partidos y mutación obsoleta rechazada sin escritura. Los benchmarks (2 ejecuciones, latencia sintética) no son comparables con producción ni con las cifras históricas de 16.1.6 en `docs/PERFORMANCE.md` del admin, que no se modificaron.
- **Admin restaurado**: tras la prueba se ejecutó `npm run build` normal con el entorno real del proyecto; `grep` sobre `.next/server` y `.next/static` no encuentra `127.0.0.1:54329` (0 archivos). Puertos 3107 y 54329 sin procesos residuales.
- **Público, remoto anónimo solo-GET** (`tests/e2e/live-readonly.mjs`): completó sin fallos: 169 comprobaciones de páginas públicas, 32 de admin sin credenciales (guardas), 76 de enlaces; 0 errores de consola, 0 errores de página, 0 peticiones fallidas, 0 escrituras bloqueadas. Incluye el PNG OG con dimensiones y fallbacks de marca, manifest, sitemap y noindex en admin. Datos vivos actuales: 2 temporadas, 75 partidos, 19 jugadores activos (22 totales). Ninguna aserción se relajó.

### Límites

- Playwright 1.60.0 (`~/.npm/_npx`) esperaba el binario chromium 1223 y solo existe el 1243. Para el script público se usó un envoltorio temporal fuera del repo (en el directorio temporal) que lanza el Chrome instalado (`channel: 'chrome'`); el script admin ya tenía ese respaldo. El script en sí no se modificó.
- Sharp no exporta `sharp/package.json`; la verificación posterior utilizó su API pública `require('sharp').versions.sharp`: **0.35.5** en ambos proyectos (libvips **8.18.7**). Coincide con los lockfiles y con `npm ls`. La generación OG también pasó con PNG 1200×630.
- No se construyeron imágenes Docker, ni se probó el despliegue real, ni login con credenciales reales (solo rutas protegidas sin sesión y fixture sintético).
- `npm audit --omit=dev`: 0 en ambos. Auditoría completa: 16 moderados en cada repositorio (historial previo: 21 y 20), ninguno alto ni crítico, solo desarrollo; `npm audit` plano sale con 1.
