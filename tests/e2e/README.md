# Live read-only browser verification

Run with Node 22, the real public Supabase configuration in `.env`, and an
externally installed Playwright with Chromium. No browser dependencies are added
to this repository.

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/node_modules/playwright/index.mjs \
  node --experimental-strip-types tests/e2e/live-readonly.mjs
```

The runner starts its own Next webpack development servers on ports 3213 (public)
and 3214 (admin), verifies that the ports are free, and stops those processes in
`finally`. The admin repository defaults to the adjacent `../app_futbol` directory.
Overrides: `LIVE_PUBLIC_PORT`, `LIVE_ADMIN_PORT`, `LIVE_ADMIN_DIR`, and
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
