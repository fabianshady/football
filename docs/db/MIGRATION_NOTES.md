# Club database migration — parent handoff

## Estado operativo actualizado

Están aplicadas remotamente **`20261007024919 / club_contract`** y **`20261007190054 / financial_public_projection_lockdown`**. La tarea coordinadora aplicó el cierre mediante la herramienta de migraciones por solicitud del usuario, antes del despliegue de `dev`. La comprobación posterior confirmó privilegio `SELECT` de `anon` **false** tanto en `public."Event"` como en `public."Payment"`, y lectura anónima conservada de la proyección sanitizada `v_player_debt`, con **14 filas en ese snapshot**. El conteo cambia con los datos y no es un contrato ni una garantía.

El sitio legacy de `main` pierde las consultas financieras directas con el cierre; el nuevo lector usa `v_player_debt`. El SQL exacto está registrado en `supabase/migrations/20261007190054_financial_public_projection_lockdown.sql`. No repetir la migración aplicada: las políticas originales ya no existen. `docs/db/deferred_financial_lockdown.sql` queda como registro manual histórico y referencia al SQL canónico, con reversión de emergencia comentada.

La protección de contraseñas filtradas sigue pendiente y requiere **Pro o superior**. MCP no expone herramienta de ajustes Auth; el CLI no dispone de token/sesión de Management API, confirmado por el error de `supabase projects list`. No se pudo activar. El propietario debe hacerlo en Dashboard → Authentication → Email → Password security → **Leaked password protection**. [Requisitos e instrucciones](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Evidencia de la fase de compatibilidad

Prepared 2026-10-06 using read-only remote inspection; **compatibility migration applied remotely on parent authorization at 2026-10-07 02:49:19 UTC**, name `club_contract`, version **20261007024919**. No application deployment or commit was performed by that compatibility task. Financial lockdown was subsequently applied as 20261007190054; destructive rollback remains unapplied.

## Files and order

1. `supabase/migrations/20261007024919_club_contract.sql`: transactional compatibility migration, already applied. Filename aligned with the actual remote migration version to avoid duplicate application by CLI. SQL body is the reviewed 302-line contract.
2. `docs/db/verify_migration.sql`: post-migration checks; all test writes, temporary validation trigger and fixtures are inside a transaction ending in **ROLLBACK**. Run with stop-on-error. If a client stops on an error, explicitly roll back/disconnect.
3. `supabase/migrations/20261007190054_financial_public_projection_lockdown.sql`: exact transactional lockdown SQL, already applied remotely. Drops the original anonymous Event/Payment SELECT policies and revokes SELECT on both tables from anon. `docs/db/deferred_financial_lockdown.sql` is a historical reference only; do not replay the applied block.
4. `docs/db/rollback_club_contract.sql`: manual schema reversal, after reverting apps and exporting new data. See limitations below.
5. `docs/db/MIGRATION_HANDOFF.md`: concise matching handoff copied to admin `app_futbol/docs/db/MIGRATION_HANDOFF.md`.

Review against a fresh schema snapshot before application. This is a one-time migration against the inspected baseline, deliberately not an idempotent schema reconciler. Plain CREATE/DROP and drift guards fail rather than silently overwrite unexpected objects.

## Contracts inspected

Public: `lib/queries.ts`, `lib/types.ts`, `lib/matches.ts`, `lib/public.ts`, `lib/team-page.ts`. Admin: `../app_futbol/docs/ADMIN_ADAPTATION.md`, `src/app/actions/matches.ts`, `src/app/actions/payments.ts`, `src/lib/validation.ts`, and settings action usage. Admin is already adapted: it uses `is_admin`, team/slot/settings tables, invoker RPCs, and omits update score keys deliberately. No membership table access is needed.

`team` has generated **text** IDs, `slug`, exact legacy `name`, DOW `match_weekday` (Sunday=0), nullable `league_name`, and `sort_order`. Slugs are `itjaguars` / `itj-fc`; callers read these from the database. League names remain NULL because no authoritative value was supplied. Team seed rows come from **distinct Match.myTeam**, with explicit known-name schedule mapping. No generated ID is embedded. Unknown historical names abort; unknown future team references fail the trigger even with override.

`kickoff_slot.time` is a `time without time zone` PK. `club_settings.id=1` is the intentional singleton contract, not a generated entity ID. Public transfer details were recovered from `git show HEAD:components/club-tabs.tsx`: phone `5517275953`, CLABE `638180000142128116`, account `1566875932`, bank `BBVA`, weekly fee `120`. This singleton contains intentionally public transfer instructions, not private banking records. No bank data is included in the debt projection.

All seven existing entity PKs stay **text** and gain `gen_random_uuid()::text` defaults. Existing IDs, dates, scores, FK cascade behavior and unique indexes stay intact. `Match.teamId` is backfilled by exact team name then made NOT NULL, with a FK; old inserts may omit it because the BEFORE trigger resolves myTeam before constraints run. `schedule_override` defaults false. Name-only old-admin updates resolve the **new** string, while teamId-only updates synchronize myTeam. Conflicting explicit changes fail. One ordered trigger synchronizes team fields before validating date, avoiding multi-trigger ordering ambiguity. Score-only direct updates do not invoke schedule validation.

## Actual schema / policy snapshot

PostgreSQL **17.6**. Seven RLS-enabled tables: `Event`, `Goal`, `Match`, `MatchSquad`, `Payment`, `Player`, `season`. No existing user-defined triggers were found. No team/slot/settings/private membership tables appeared in inspection.

All seven originally had these three **PERMISSIVE** policies:

| Table | Original anon SELECT policy (USING true) |
|---|---|
| Event | La raza puede ver los eventos |
| Goal | La raza puede ver los goles |
| Match | La raza puede ver los partidos |
| MatchSquad | La raza puede ver las alineaciones |
| Payment | La raza puede ver los pagos |
| Player | La raza puede ver a los jugadores |
| season | La raza puede ver las seasons |

For every table, `test` was authenticated SELECT USING `true`; `Solo Admin` was authenticated ALL with identical USING/WITH CHECK:

```sql
((auth.jwt() ->> 'email'::text) = ANY
 (ARRAY['fabianmendoza.py@gmail.com'::text, 'test@test.com'::text]))
```

All seven originally granted anon/authenticated SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE. Original IDs had no defaults. `Match.scoreHome/scoreAway=0`, `kit=1`, `Payment.paid=false`, `Player.active=true`, `Player.createdAt=CURRENT_TIMESTAMP`, and `season.active=false` remain as observed.

Existing indexes: each table's PK; `season_name_key`; `idx_match_season(seasonid)`; `idx_event_season(seasonid)`; unique `MatchSquad_matchId_playerId_key(matchId,playerId)` and `Payment_playerId_eventId_key(playerId,eventId)`. The latter two are standalone unique indexes, not pg_constraint UNIQUE entries. Migration checks their existence and does not build duplicates or remove data. Added only missing Goal match/player, squad player, payment event, and Match `(teamId,seasonid,date DESC)` indexes. Parent should recheck index definitions if baseline drift occurred.

## Access model and security rationale

- `private.admin_users(user_id)` resolves the existing real email to auth.users.id. Read-only inspection confirmed one matching real user. **test@test.com is not seeded.** No anon/authenticated schema usage or table privileges; RLS enabled with no direct policies. Migration aborts if real seed is missing.
- `public.is_admin()` is STABLE SECURITY DEFINER with `search_path=pg_catalog`, fully qualified membership/auth references, and EXECUTE granted **authenticated only**, PUBLIC/anon explicitly revoked. It returns only current membership boolean; UUID membership is not exposed. Create as the privileged migration owner, not a client role.
- On seven legacy tables, remove `Solo Admin` and `test`; preserve named anon SELECT true for compatibility. Authenticated SELECT stays true for five sports tables; Event/Payment authenticated SELECT becomes admin-only. Authenticated INSERT/UPDATE/DELETE use `(select public.is_admin())`, including UPDATE WITH CHECK.
- Legacy blanket privileges are replaced with anon SELECT and authenticated SELECT/INSERT/UPDATE/DELETE. In particular, TRUNCATE must be removed: it is not RLS-controlled. Existing service_role privileges are not altered.
- New team/slot/settings tables are publicly readable and admin-writable under RLS.
- `save_match(jsonb,text[]) -> text` and `create_event_with_payments(text,numeric,timestamptz,text) -> text` are **SECURITY INVOKER**, require is_admin and obey RLS. PUBLIC/anon EXECUTE is revoked, only authenticated granted. Match edits lock the row; omitted scores persist; squad IDs are deduplicated, null/blank/unknown IDs rejected, players locked against deletion, squad replaced atomically. Events and all active-player unpaid payments are created atomically, with no catch-and-continue failures. Existing Event cost stays double precision to avoid changing the legacy contract; numeric RPC input casts on insertion.
- All views use `security_invoker=true`. Sports views obey underlying RLS.
- Public debts are explicitly authorized product data: **active player id/name/dorsal, total_debt, and unpaid events with only name/date/cost**. `get_public_player_debts()` is the sole narrow STABLE read-only SECURITY DEFINER projection, fixed pg_catalog search_path, fully qualified tables, no parameters/dynamic SQL, no payment/event IDs, auth metadata or bank data. It bypasses raw financial RLS only for this fixed output; EXECUTE is intentionally granted anon/authenticated. `v_player_debt` invokes it via an invoker view. This deliberately exposed definer RPC is a scoped exception to the general recommendation to keep privileged helpers in private schemas; it is required to serve authorized public debt data after raw financial access is closed. Owners must not broaden its output to `SELECT *`.
- Compatibility migration retained anon raw Event/Payment SELECT temporarily. The applied **20261007190054 / financial_public_projection_lockdown** removes those two anon policies and revokes SELECT on both tables from anon. Authenticated financial reads remain admin-only; the narrow public debt projection stays readable. Legacy anonymous raw-table readers are no longer functional.

Reference: [Supabase RLS and invoker views](https://supabase.com/docs/guides/database/postgres/row-level-security).

## View columns and aggregation

- `v_match`: `Match.*`, plus `team_slug text`, `team_name text`, `kickoff_local timestamp without time zone`, `kickoff_weekday integer`, `kickoff_slot text` (HH:MM).
- `v_team_season_stats`: `team_id text`, `season_id text`, `played/wins/draws/losses/goals_for/goals_against bigint`. Counts only `date < now()`. Scores are Nosotros/Rival regardless of venue.
- `v_team_season_monthly`: `team_id`, `season_id`, `month text` (**YYYY-MM**, Tijuana month), `scored/conceded bigint`; also past-by-date.
- `v_player_stats`: `player_id`, `team_id`, `season_id`, `call_ups/goals bigint`; separate squad and goal aggregates FULL JOIN avoids multiplied counts and retains goals without squad entries. Includes recorded callups/goals across all dates, matching public totals.
- `v_player_debt`: `id text`, `name text`, `dorsal integer`, `total_debt numeric`, `events jsonb`. Only active players with unpaid payments; no season filter, matching existing public debts. Event JSON has name/date/cost only.

**Date heuristic concern:** there is no match completion/status column. An unplayed but past-scheduled 0–0 match is counted as a draw. This migration does not invent a status table or imply that passing kickoff proves completion. No rows are synthesized for empty team/seasons; public uses maybeSingle/null.

## Tijuana audit — no schedule corrections

The earlier 67-match audit was valid. Fresh read-only inspection now found **69**, all valid: ITJAGUARS FC 35 on local Tuesday (DOW 2), ITJ FC 34 on local Wednesday (DOW 3). All times are exactly 18:50, 19:40, 20:30, 21:20 or 22:10, seconds zero. UTC dates commonly land on the **next day**. Winter **18:50 = 02:50Z next day**; summer **18:50 = 01:50Z next day**. America/Tijuana continues DST; never use a fixed offset or UTC weekday. Trigger compares exact local time, rejecting nonzero/fractional seconds unless explicit override. Backfill modifies neither date nor schedule flags, and aborts on mismatches instead of silently correcting them.

## Verification performed / parent checks

Docker daemon was unavailable. Prepared SQL was executed locally in **PGlite PostgreSQL**, with isolated baseline-shaped tables, legacy policies/indexes, auth helpers and test users (no remote data copy). Main migration, rollback and deferred lockdown executed successfully. Rolled-back verification exercised valid winter/summer saves, invalid seconds/fraction/minute/day, overrides, unknown teams, legacy myTeam update, unknown squad IDs, dedup, omitted scores, atomic event creation and forced post-insert payment failure, nonadmin RPC/financial rejection, anon views and private-schema restrictions. Additional local check proved 1 callup + 2 goals is not amplified and sanitized anon debt survives deferred raw Payment denial. These are local SQL checks, not claims of remote rollout validation.

Both compatibility and financial lockdown migrations are now applied. Parent still owns application deployment and UI verification: legacy public deployment impact, admin create/edit/goals/payments/settings, new public reader and schema-cache discovery. The user authorized lockdown before deploying `dev`; the post-lockdown check confirmed no anon SELECT privilege on Event/Payment while the debt projection remained readable (14 rows in that dynamic snapshot).

## Remote execution evidence — 2026-10-07 UTC

Before application: migration history empty; table/column, policy/index and trigger snapshots matched the reviewed baseline. Logs showed routine checkpoints and one client disconnect, no migration blocker. Security/performance advisors were inspected before and after. No development branch was created.

`supabase_apply_migration(name='club_contract')` returned success. History records **20261007024919 / club_contract**. Remote SQL is the reviewed local contract (one incidental whitespace difference in transmission, no SQL/content difference). The local file was subsequently renamed to the returned version; its original preparation comment describes authorship at preparation time, not current status.

Inspected `verify_migration.sql` before execution. Ran its safe DML/role assertions in one BEGIN/ROLLBACK transaction, with 5s lock timeout and 30s statement timeout. **Omitted its temporary Payment trigger/function and forced payment-rejection case on remote** to avoid taking table-wide DDL locks on active financial tables; that case remains locally verified. Added teamId-only RPC edit and explicit anonymous mutation-denial checks. This was a production-safe subset plus role checks, not a claim that the entire local verification file was run remotely.

Remote assertions passed: real admin check; winter/summer valid saves; deduplicated squad; omitted score preservation; unknown-player rejection with unchanged score/squad; wrong minute, nonzero/fractional seconds and weekday rejection; explicit overrides; unknown-team rejection even with override; legacy myTeam-only update; **RPC teamId-only edit correctly resynchronizes old proposed myTeam**; active-player event payments; invalid-season event rollback; authenticated nonmember denied raw financial reads and both RPCs; anon reads all five views, restricted RPC/schema privileges and INSERT/UPDATE/DELETE denial; debt event JSON keys exactly cost/date/name. Every test write was rolled back.

Historical compatibility post-test evidence: **69 matches, 39 events, 729 payments, 668 squad entries, 22 players, 189 goals** (same counts as that baseline); two teams, five slots, one settings singleton; **zero test matches/events**, zero team/schedule mismatches; exactly the single contract Match trigger, no verification trigger. Membership: **one real admin, zero test@test.com admins**. At that pre-lockdown snapshot, anon SQL read 69 v_match rows, **12 debt players**, and 39 raw events / 729 raw payments. These historical counts are not current guarantees: after 20261007190054, anon raw financial SELECT privileges are false and the later debt projection snapshot returned 14 rows. These are database-role checks, not claims of deployed app/browser testing.

Supabase tool generated the post-migration public schema types; saved semantically unchanged (condensed formatting) in `lib/database.types.ts` and admin `src/lib/database.types.ts`. Public createClient and admin server/browser/proxy clients use `<Database>`. Generated nullable Player.positions required normalizing NULL to [] at the two admin player-read boundaries; schema nullability was not falsely narrowed. Public has no browser Supabase client. Generated Match.Insert requires both teamId/myTeam because the generator cannot infer BEFORE-trigger population; adapted admin correctly uses JSON RPC for creation.

After typing clients, public ESLint, TypeScript (`--incremental false`) and all **10 tests** passed; admin `npm run check` passed ESLint, TypeScript and all **6 tests**. `git diff --check` passed in both repositories. No production build/deployment was performed by this remote-application task.

### Post-application advisors

- [Private membership RLS with no policies (INFO)](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy): intentional deny-by-default; no client schema/table privileges. Do not add direct membership read policies to silence this notice.
- [Anonymous executable definer function (WARN)](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable): intentional public `get_public_player_debts()` projection, rationale above.
- [Authenticated executable definer functions (WARN)](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable): intentional debt projection and current-user-only `is_admin()` boolean.
- [Leaked password protection disabled (WARN)](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection): still pending, requires Pro or above. MCP has no Auth-settings mutation tool; CLI Management API access is unavailable (no token/session; `supabase projects list` failed). Owner must enable Leaked password protection in Dashboard → Authentication → Email → Password security. No setting was changed.
- Previous unindexed-FK, auth-RLS-initplan and overlapping-policy findings cleared. Only [unused index INFO](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) appeared for five just-created indexes before traffic; retain and assess with a meaningful observation window.

## Rollback considerations

While diagnosing app issues, retaining the additive schema keeps old myTeam writes supported. Restoring an earlier frontend alone does **not** restore its raw anonymous financial reads after 20261007190054; those require the separately authorized emergency reversal documented in `deferred_financial_lockdown.sql`. If full schema reversal is necessary, export `team`, `Match.teamId/schedule_override`, settings, private membership and a full DB backup first. Stop new clients, revert both apps, then run the manual rollback. It removes only added objects/defaults/indexes and restores the **exact original policy expressions and observed grants**, including test@test.com and broad privileges; that is a faithful emergency reversal, not the desired security model. It handles the applied financial lockdown by recreating missing original anon policies.

Rollback keeps all legacy matches/goals/squads/events/payments/players/seasons, including records created after rollout, and synchronized myTeam strings. It does not rewind historical edits, UTC dates, scores, squad replacements, payment states, newly generated IDs, admin membership changes or new team names. Backfill was generated-ID metadata, not a reversible identity mapping after metadata is dropped. No data cleanup is hidden in rollback. Restore a pre-rollout backup if historical contents must be recovered. `private` schema is left in place to avoid deleting later parent objects; its original access state must be reviewed separately if it preexisted.
