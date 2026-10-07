# ITJAGUARS FC — public app design

## Direction

A calm, expressive club companion inspired by the Google Store Pixel product-page language: generous space, confident Inter typography, pill controls, oversized rounded cards, and purposeful tonal contrast. Spanish-first, mobile-first, with the club’s identity expressed through navy and restrained gold rather than decorative effects.

## Visual system

- Identity navy: **#1B2A4A**, fixed for the hero and scoreboards.
- Gold fill: **#D5AF62**; hero action: **#E5C685**. Accessible text gold: **#89651F** in light, **#E0BD76** in dark.
- Light: canvas #F7F8FC, card #FFFFFF, tonal surface #E8EDF6, secondary text #5C677C.
- Dark: canvas #111827, card #1B2537, tonal surface #29364D, secondary text #ACB8CD.
- Primitive identity colors are separate from semantic primary/action colors; dark primary uses a readable pale navy tone.
- Typography: existing open-source Inter via `next/font`, one family for body and display. Large headlines use tight tracking and balanced wrapping; figures are tabular.
- Shape: 40px hero, 32px cards (28px mobile), 16–22px fields and small tonal containers, fully rounded navigation/actions.
- Layout: 1200px content maximum; 24px desktop and 16px mobile gutters; one-column mobile, two-column match/team layouts, three-column roster, four-metric desktop grids.
- Motion: short color/position transitions only; respects reduced motion. No gradients, glowing effects or perpetual decorative animation.

Tokens live in `app/globals.css`, exposed with Tailwind 4 `@theme inline`. There is no legacy Tailwind configuration. Reusable page headings, metrics, navigation, match cards and form styling share this system; tactical pitch colors remain purpose-specific.

## Routes and navigation

- `/`: club introduction, database-driven teams and upcoming matches.
- `/[equipo]`: team overview, selected season, next matches, recent results.
- `/[equipo]/partidos`: searchable/filterable archive with incremental display.
- `/[equipo]/estadisticas`: season-scoped metrics, SVG charts and historical player leaderboards (including players no longer active).
- `/plantilla`: active club registry, searchable by name/dorsal, position and sort controls; career totals across teams/seasons.
- `/finanzas`: active-player pending contributions and database-backed transfer details.
- `/partido/[id]`: score, venue, UTC kickoff, goals, squad, kit and interactive football-7 tactics.

`?temporada=<id>` is retained between team routes. Invalid team/season links receive a 404. Global navigation uses real links, marks the current page and wraps into a full-width row on mobile.

## Theme and accessibility

Light/dark/system controls use `itj-theme` in local storage. A small inline head script resolves appearance before body paint. System mode follows OS changes; storage changes synchronize other tabs. Restricted storage retains a functional per-page fallback. Only the root theme attributes suppress hydration warnings.

Semantic landmarks, skip-to-content link, visible keyboard focus, labeled native form controls, minimum 44px interaction targets, pressed-state tactical controls and polite feedback for search/copy interactions are required. SVG charts have descriptive titles and visible labels; monthly data also has an accessible table. Results are labeled in words, not just colors. Clipboard failures provide manual-copy guidance.

## Data and time contracts

`lib/queries.ts` and `lib/supabase.ts` are server-only. Pure mapping and presentation helpers remain independently testable. `lib/database.types.ts` contains Supabase-generated types from migration 20261007024919; explicit DTOs describe presentation shapes for `team`, `club_settings`, `v_match`, `v_player_debt`, `v_player_stats`, `v_team_season_stats` and `v_team_season_monthly`. List routes use views; match detail retains nested `Match`, `Goal/Player` and `MatchSquad/Player` relations.

Server deployment variables `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` take precedence over the existing `NEXT_PUBLIC_SUPABASE_URL` and publishable/anon key variables. This allows runtime configuration without rebuilding; only public/publishable credentials are needed.

Data-backed routes render on request; React `cache` deduplicates queries within a request without caching failures or empty substitutes across requests. Builds do not require a live database. Missing credentials display an explicit configuration-unavailable view. Query failures throw into the route error boundary, never becoming empty lists or zeroed cached data. Successful empty responses have contextual empty states. Season aggregate rows absent from a successful query represent zero participation, not a fetch failure.

All match timestamps are UTC instants, converted to **America/Tijuana** for primary date/time display, including year. A different viewer zone is secondary and includes its own full date, time and zone. No correction is guessed from weekday or kickoff slot. `schedule_override` is only a display hint. Finance event dates are calendar dates displayed in UTC to avoid date-only shifts.

## Verification

`npm test` uses Node 22’s strip-types runner for UTC/day-boundary and DST behavior, data mapping, aggregate scoping, season selection, match ordering and pre-paint theme behavior (including blocked storage). `npm run lint`, `npm run typecheck`, and `npm run build` verify the complete public app. Existing test artifacts and OpenCode configuration are retained.
