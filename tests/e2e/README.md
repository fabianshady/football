# Live read-only browser verification

Run with Node 22, the real public Supabase configuration in `.env`, and an
externally installed Playwright with Chromium. No browser dependencies are added
to this repository.

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/node_modules/playwright/index.mjs \
  node --experimental-strip-types tests/e2e/live-readonly.mjs
```

Build both repositories first (`npm run build` in each). The runner starts compiled
Next production servers on ports 3213 (public), 3214 (admin), 3215 (preview), and
3216 (unconfigured OG fallback), verifies that the ports are free, and stops those processes in
`finally`. The admin repository defaults to the adjacent `../app_futbol` directory.
Overrides: `LIVE_PUBLIC_PORT`, `LIVE_ADMIN_PORT`, `LIVE_PREVIEW_PORT`, `LIVE_UNCONFIGURED_PORT`, `LIVE_ADMIN_DIR`, and
`LIVE_ARTIFACT_DIR`. Screenshots, server logs, and `evidence.json` go to a new
temporary directory by default.

All direct remote reads use GET with the public API key. Browser requests other
than GET/HEAD/OPTIONS are blocked and cause the final assertions to fail. The
runner never enters credentials or submits the admin login form.

Coverage includes every live team's summary, matches, and statistics routes;
home, roster, finance; one past and one future match per team when available;
390×844 and 1440×1000 viewports in light/dark; all team/season combinations;
internal link HTTP responses; invalid team/season/match views; search empty state;
theme persistence and OS changes; finance settings and debt-row counts compared
with anonymous remote reads; Tijuana primary/UTC secondary timestamps; and all
admin page guards. It asserts no horizontal overflow, console errors, browser
exceptions, failed browser requests, or attempted writes.

## Final Phase 2 verification · 2026-10-08

Actual remote `gbqlyrawshpalgyhnusl.supabase.co`, after migration `20261008235036`:
2 teams, 2 seasons, 69 matches, 22 players (18 active), 13 debt rows and one settings
row. All direct database access was anonymous GET; no RPC/SQL/auth operation ran.

- Both repositories: lint, typecheck, tests and production build pass (26 public,
  15 admin tests). Shared database types are byte-identical; both diff checks pass.
- 165 public checks: 34 routes × two widths × two themes = 136, plus 24 season
  checks and five preview checks. All 22 player fichas pass, including inactive
  players. Explicit team memberships match remote `player_team`; canonical names,
  titles, header brand, full-name retention and canonical metadata are checked.
- Three match details cover both teams, populated squads and nonempty history.
  Every formation's per-slot reasons and the recommendation match canonical
  positions/sides. Same-team and club histories match strict date-bounded records.
- 32 admin checks: four login views with noindex and empty credentials, plus
  seven protected routes redirected to login in each viewport/theme combination.
- 74 link/resource checks: 58 internal links, two sitemaps, five icons, eight OG
  PNGs and two missing-configuration OG fallbacks. Production sitemap contains
  exactly 100 unique live URLs without query variants; preview has zero entries.
  All ten OG responses are 1200×630; unknown IDs and missing configuration return
  brand-only fallbacks. Robots and manifest also return HTTP 200.
- Zero horizontal overflow, console errors, browser exceptions, genuine failed
  requests or attempted writes. 2,266 cancelled speculative Next RSC GET requests
  are retained separately in evidence: full-document navigation cancels them.
  Only `net::ERR_ABORTED` GET requests carrying `_rsc` are classified this way.
- Fixed the confirmed non-Vercel production analytics 404/MIME issue by mounting
  instrumentation only on Vercel. The browser regression asserts no unavailable
  `/_vercel/` script is emitted on these servers.
- All four owned ports were confirmed free after cleanup.

Evidence: `/var/folders/z0/_yy5p7dj4wxftg5sn00zrlt80000gn/T/football-live-1791504670718/`
(screenshots, OG images, `evidence.json`, four server logs).

Limitations: localhost compiled servers against live Supabase, not deployed-host
verification; three of 69 match details were browser-tested. There are no future
fixtures in this snapshot, so future/equal-date boundaries are covered by the
unit regressions rather than a live future page. Authenticated admin screens and
actions were not exercised. No database write suite ran. Archived seasons use
system/light; default routes use the full light/dark matrix. Missing configuration
was exercised for OG fallback only; sitemap is dynamic and reads live data on
requests, and database query failures propagate rather than returning a fabricated
empty sitemap. Original assets, resources and OpenCode configuration were preserved.

## Verified 2026-10-07

- Remote: `gbqlyrawshpalgyhnusl.supabase.co`, anonymous reads against actual data.
- Observed: 2 teams (`itjaguars`, `itj-fc`), 2 seasons, 69 matches, 20 active
  players, 12 debt rows, and one club settings row.
- 52 public page checks: 13 paths × 2 viewports × 2 themes, all HTTP 200 and
  document width equal to viewport width.
- 24 additional team/season route checks (12 combinations × 2 viewports).
- 35 distinct internal links returned HTTP 200; none used the obsolete `/itj`
  slug. `/itj` rendered the not-found view.
- Finance displayed the remote bank, phone, CLABE, account, and weekly fee;
  all 12 pending debt rows rendered and an expanded debt showed event details.
- Four match details were browser-tested in all four viewport/theme combinations:
  ITJAGUARS vs Hops, ITJAGUARS vs Brujos, ITJ FC vs Lobos TJ, and ITJ FC vs Lote.
  Primary times matched America/Tijuana; UTC was secondary; return links used
  the actual team's slug.
- Admin login: four viewport/theme combinations with empty credentials;
  `/`, `/admin/club`, `/admin/seasons`, `/admin/players`, `/admin/matches`,
  `/admin/goals`, and `/admin/payments` each redirected to `/login` in all four.
- Zero console errors, browser exceptions, failed browser requests, or browser
  write attempts.
- `npm run lint`, `npm run typecheck`, `npm test` (10 tests), `npm run build`,
  and `git diff --check` passed. Both owned server ports were free after cleanup.

Evidence for this run:
`/var/folders/z0/_yy5p7dj4wxftg5sn00zrlt80000gn/T/opencode/live-remote/`
(screenshots, `evidence.json`, and two server logs).

Scope not proven by this run: deployed-host behavior, production-server browser
behavior, every one of the 69 match details, authenticated admin screens/actions,
clipboard operations, exhaustive keyboard/screen-reader accessibility, and
independent correctness of all database statistical calculations. Archived
season routes were checked for selection and successful rendering at both
viewports in system/light; the full light/dark screenshot matrix used the
default season. The build passed separately from the development-server browser
run.
