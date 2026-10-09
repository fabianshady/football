# Parent-owned database handoff

## Phase 2 (applied on parent authorization)

Applied remotely: **20261008235036 / phase2_players_rivals_goals**, 2026-10-08 23:50:36 UTC,
exact parent-reviewed SQL: `supabase/migrations/20261008235036_phase2_players_rivals_goals.sql`.
Contracts/types: `PHASE2_CONTRACT.md` and regenerated `lib/database.types.ts` (also admin repo);
preflight/concurrency review: `PHASE2_REVIEW.md`; isolated verification: `verify_phase2.mjs`.
Includes structured players + historical membership backfill, approved dorsals, rival identity,
typed goal kinds, history protections, and parent-lock goal/squad/score guards.
PGlite and remote `verify_phase2_remote.sql` rollback-only role/atomicity/compatibility tests passed;
194 goals / 22 players / 69 matches / 667 squads / 749 payments retained; 55 rivals and 36 historical
memberships backfilled. Corneas22/Leobardo24/Sebastian12 corrected by unique name selectors.
No verification fixtures or historical missing goals persisted. Public 26/admin 15 tests, typing and lint passed.
Two-session PostgreSQL check and authenticated browser flows remain pending; no app deployment by this task.

## Estado operativo actualizado

Están aplicadas remotamente `20261007024919 / club_contract` y **`20261007190054 / financial_public_projection_lockdown`**. La tarea coordinadora aplicó el cierre mediante la herramienta de migraciones por solicitud del usuario, antes del despliegue de `dev`. `anon` tiene privilegio `SELECT` **false** sobre `Event` y sobre `Payment`; `v_player_debt` sanitizada sigue accesible y devolvió **14 filas** en la comprobación posterior. Ese conteo es un snapshot dinámico, no un contrato ni una garantía. No repetir el SQL aplicado.

El público nuevo usa `v_player_debt`. El público legacy de `main`, que consulta las tablas financieras directamente, pierde esa funcionalidad con el cierre. La protección de contraseñas filtradas sigue pendiente y requiere **Pro o superior**: MCP no tiene herramienta de ajustes Auth y el CLI carece de token/sesión Management API (`supabase projects list` falló). El propietario debe activar **Leaked password protection** en Dashboard → Authentication → Email → Password security. [Documentación](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Evidencia de la migración de compatibilidad

Compatibility SQL **applied remotely on parent authorization**, name `club_contract`, version **20261007024919** (2026-10-07 02:49:19 UTC). No app deployment or commit. Admin contracts were read from `app_futbol/docs/ADMIN_ADAPTATION.md` and current actions/validation.

- Already applied: `football/supabase/migrations/20261007024919_club_contract.sql` (filename aligned to remote history).
- Run rollback-only verification: `football/docs/db/verify_migration.sql` (stop on errors).
- Full detail/policy snapshot/security rationale: `football/docs/db/MIGRATION_NOTES.md`.
- Already applied: `football/supabase/migrations/20261007190054_financial_public_projection_lockdown.sql`. `football/docs/db/deferred_financial_lockdown.sql` is now a historical reference with commented emergency reversal, not a pending execution step.
- Emergency schema reversal: `football/docs/db/rollback_club_contract.sql`; export metadata and revert apps first. Restores original policies/grants, including unsafe old test membership policy, and does not rewind data edits.

Contract: generated text IDs/defaults; `team`, `kickoff_slot.time`, singleton `club_settings`; Match `teamId` FK and `schedule_override`; `is_admin()` authenticated-only, backed by private inaccessible membership. Real existing admin resolved by email from original policy evidence; test@test.com excluded. Admin never reads membership.

RPC signatures exactly match adapted actions: `save_match(p_match jsonb,p_player_ids text[]) -> text`, `create_event_with_payments(p_name text,p_cost numeric,p_date timestamptz,p_season_id text) -> text`. Invoker/RLS, authenticated-only EXECUTE; locked edits preserve omitted scores and replace validated deduplicated squads atomically. Event/payments atomic. One BEFORE trigger synchronizes teamId/myTeam, supports legacy name-only updates, rejects unknown teams and validates exact Tijuana weekday/time unless explicit override.

Public views match current `football/lib/queries.ts` and types. Sanitized public debts use an intentionally narrow read-only fixed-search-path definer function through invoker view; no raw payment IDs, event IDs, auth membership or bank data. Sports authenticated SELECT remains true; financial authenticated SELECT admin-only. Original anonymous financial access was retained by the compatibility migration and removed by 20261007190054. Blanket legacy grants reduced to remove RLS-bypassing TRUNCATE.

Audit discrepancy: earlier 67 matches were valid; fresh snapshot is **69**, all valid Tijuana weekday/slot/seconds. No schedule/date corrections. Winter 18:50 = 02:50Z next day; summer = 01:50Z next day. Existing squad/payment unique indexes reused; only missing indexes added. Past-by-date stats are a heuristic: no completion status exists, so past unplayed 0–0 counts as draw.

Local PGlite execution passed migration, transactional verification (including forced payment failure rollback), aggregate anti-amplification, debt projection after lockdown, and rollback. Remote compatibility rollback-only checks passed for admin/nonadmin/anon roles, valid/invalid schedules, teamId-only RPC and legacy-name edits, omitted scores, dedup/unknown squads, event/payments and invalid-season rollback. Verification-only Payment DDL/forced failure omitted remotely to avoid production table-wide locks. Historical compatibility snapshot after rolled-back checks: 69 matches / 39 events / 729 payments / 668 squads / 22 players / 189 goals; one real admin, no test admin; 12 projected debt players. These are historical counts; the later lockdown snapshot returned 14 debt rows. Financial lockdown is applied; destructive rollback remains **not applied**.

Post-migration Supabase-generated types persisted in both repos; clients now use Database generics. Nullable admin Player.positions normalized to [] at read boundaries. See MIGRATION_NOTES for checks and advisor links: private membership no-policy and narrow callable definer warnings intentional; leaked-password protection still disabled for owner Auth-settings follow-up; previous policy/FK performance findings cleared, newly added indexes report unused INFO. Parent owns app deployment and UI verification.

Post-typing checks passed: public ESLint/TypeScript/10 tests; admin npm run check (ESLint/TypeScript/6 tests); git diff --check in both repos.
