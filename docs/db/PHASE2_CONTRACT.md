# Phase 2 — applied database contract

**Status: remotely applied on explicit parent/user authorization, 2026-10-08 23:50:36 UTC.** No application deployment, commit, or push was performed by the database task.

Migration: `supabase/migrations/20261008235036_phase2_players_rivals_goals.sql`, remote name `phase2_players_rivals_goals`. The reviewed 447-line SQL was applied exactly; its original preparation header is preserved as provenance. Local filename now matches remote history.
Dependencies: the two already-applied `20261007024919` / `20261007190054` migrations.
Types regenerated via Supabase after application and persisted, condensed, in `football/lib/database.types.ts` and `app_futbol/src/lib/database.types.ts`. Actual inferred rival→v_match relationships replaced prepared guesses. `CHECK`-constrained text is used throughout; there are no PostgreSQL enums. Exported unions and nullable RPC arguments are documented manual refinements of generated string/nonnullable-argument types. The generator permits `normalized_name` string writes in types, but SQL's generated column rejects them; clients must omit it.

## Players

Existing `id`, `name`, `createdAt`, `active`, `dorsal`, and nullable legacy `positions` retain their names/types. No legal names, nicknames, feet, or new player identities are inferred.

| Column | Contract |
| --- | --- |
| `nickname` | nullable text |
| `primary_position` | nullable text: `GK CB WB DM CM AM W ST` |
| `secondary_positions` | nonnull text array, default `[]`; valid unique codes, no primary duplicate; requires primary when nonempty |
| `preferred_side` | nonnull text `L R C ANY`, default `ANY` |
| `foot` | nullable text `L R BOTH` |
| `dorsal` | existing integer, required 1–99; unique among `active = true` only |

Legacy mapping: Portero→GK, Defensa→CB, **Lateral→WB** (carrilero; UI may place WB in both defense and midfield bands), Mediocentro→CM, Delantero→ST. Additional supported labels: Mediocentro defensivo→DM, Mediapunta→AM, Extremo→W; raw codes are accepted as legacy labels too. First distinct code becomes primary; subsequent distinct codes become secondary. A single consistent `(L)`, `(R)`, or `(C)` suffix yields the preferred side; absent/conflicting suffixes yield ANY. Unknown legacy labels abort, rather than discard data.

The backfill preserves original `positions` arrays. A legacy-only write derives structured positions/side. A structured change writes compatible Spanish legacy labels; side suffixes are emitted for CB/WB/W. Simultaneous changed legacy/structured fields must describe the same ordered codes; structured preferred side wins. Unrelated updates do not reformat the source array. A primary can be cleared only with secondary `[]`.

Approved corrections use unique exact-name selectors at execution time: **Corneas 22, Leobardo 24, Sebastian 12**. Expected prior/approved dorsals and destination availability are checked dynamically. Duplicate names, changed source numbers, newly occupied destinations, or any other invalid/duplicate active dorsal abort the entire transaction.

`player_team(player_id text, team_id text)` has a composite PK and restrictive FKs. Initial DISTINCT MatchSquad→Match participation is historical evidence, **not verified current membership**; admins must review/edit it. Future match squads do not automatically modify memberships, and membership does not constrain historical squad editing.

### `save_player(p_player jsonb, p_team_ids text[] DEFAULT NULL) → text`

Admin-only, security invoker, authenticated EXECUTE; returns player ID. Object allowlist:
`id,name,dorsal,positions,active,nickname,primary_position,secondary_positions,preferred_side,foot`.
`createdAt` is immutable through this RPC. Existing ID must resolve; omitted ID creates with generated ID. New players require name/dorsal and default active true, secondary [], side ANY. On edit all omitted fields (including active) are preserved; explicit null is accepted only by nullable columns.

- Omitted/null `p_team_ids`: preserve memberships; new player gets none.
- `[]`: remove memberships.
- Nonempty array: atomically replace with validated, deduplicated existing team IDs.
- Any failure rolls back both player and memberships.

Player DELETE privilege/policy is removed for API admins. Deactivate players instead. Goal, MatchSquad, Payment and membership player FKs are restrictive, so privileged accidental deletes with history fail as well. Match sporting-history FKs are restrictive too; deleting a populated match now errors instead of cascading away squad/goals. Goal removal remains an explicit admin operation.

## Rivals

`rival(id text DEFAULT gen_random_uuid()::text, name text, slug text UNIQUE, normalized_name text UNIQUE)`.
`normalized_name` is generated, read-only: collapse whitespace, trim, lowercase. Accents, punctuation and FC suffixes remain distinct **except for explicitly confirmed aliases**. Follow-up migration `20261009032355_merge_confirmed_rival_aliases.sql` maps AE Trucking→AE Trucking FC, C.M.T FC→CMT FC and Union Real→Union Real FC. Future legacy name writes resolve to the surviving IDs too. The original backfill chose the lexicographically first trimmed/collapsed spelling; the follow-up synchronized names only on reassigned matches. Names/slugs cannot be blank.

Auto-generated slugs use a readable ASCII prefix plus full MD5 of the normalized name. The suffix distinguishes accented/punctuated names with otherwise identical prefixes. Slugs are stable persisted identifiers; direct admin creation supplies a slug. Renaming a rival retains its slug and changes the canonical `v_match.rival_name`; it does not rewrite all historical `rivalTeam` strings.

`Match.rivalId`: required restrictive FK, indexed. Trigger compatibility:

- Legacy name-only insert/change resolves or creates rival using concurrent-safe `ON CONFLICT(normalized_name) DO UPDATE ... RETURNING`.
- ID-only insert/change resolves existing rival and synchronizes `rivalTeam` to canonical name.
- Both changed: normalized name must match the selected ID or fail.
- Blank/whitespace-only name or unknown ID fails.
- Old/new clients can continue using `save_match(p_match jsonb,p_player_ids text[]) → text`; its allowlist now includes `rivalId`. Omitted rival fields/scores remain preserved. Use this RPC for ID-only creation (generated table Insert types still reflect required legacy columns).

`v_match` preserves every original column in original order and appends `rivalId`, `rival_id`, `rival_slug`, `rival_name`. Display canonical `rival_name`; group/link by `rival_id`/`rival_slug`.

`v_head_to_head`: `team_id,rival_id,played,wins,draws,losses,goals_for,goals_against,last_played`. All seasons, grouped by our team and rival. Same existing `date < now()` heuristic: there is no completion status, so a past unplayed 0–0 counts as a draw. Scores are Nosotros/Rival regardless of venue.

## Goals and squad integrity

| Column | Contract |
| --- | --- |
| `kind` | nonnull text `player own_goal unknown`, default `player` |
| `playerId` | nullable FK; required for player, must be null for own_goal/unknown |
| `minute` | nullable existing integer, 0–120 inclusive |

All goal kinds represent goals **for us**, so all count against `Match.scoreHome`. An own goal here means an opponent's own goal credited to our score. Historical goals remain `player`; all existing IDs/attributions/minutes survive. No unknown goals are auto-created: an under-attributed 9-goal match remains under-attributed unless an admin explicitly records the missing goals. Direct table SELECT exposes all kinds, including null Player joins. Consumers must preserve those rows and render kind-aware labels.

`v_player_stats` counts only `kind = player` with nonnull player ID; no null-player groups, and independent squad/goal aggregates prevent multiplication. Score/team aggregate views continue to use match scores.

### RPCs

- `add_goal(p_match_id text, p_player_id text DEFAULT NULL, p_kind text DEFAULT 'player', p_minute integer DEFAULT NULL) → text` returns generated goal ID.
- `remove_goal(p_goal_id text) → void` fails for missing ID. Direct admin DELETE remains supported.
- Both require admin, security invoker, authenticated-only EXECUTE.

Direct INSERT/UPDATE/DELETE goal writes also use parent Match row locks. Before checking squad or counting goals, insert locks its parent; a move/update locks old/new parents in ID order; delete locks its parent. Counts include **all kinds**, exclude the old row on update, and enforce `count <= scoreHome`. Both match scores must be nonnegative. Updating scoreHome below recorded count fails.

Goal/squad triggers also write an unchanged parent `location` after acquiring the lock. This creates a Match row version so stale REPEATABLE READ/SERIALIZABLE transactions fail serialization instead of validating old snapshot counts; it does not alter location values. This also produces a Match UPDATE event for realtime/audit consumers. Higher-isolation clients must retry serialization failures.

Squad INSERT/UPDATE/DELETE locks the same parent(s), and removing/reassigning a recorded player scorer fails. `save_match` locks the match first, rejects removing scorers explicitly, deletes only deselected rows, and inserts only missing rows via ON CONFLICT. Retained squad row IDs survive. Remove/reassign goals before removing a scorer; remove goals before lowering the score. Multi-row direct operations may deadlock under contention because PostgreSQL acquires target-row locks before BEFORE triggers; the aborted transaction must be retried as a whole. Parent serialization prevents successful inconsistent writes.

## Review and verification

Read-only inspection on 2026-10-08: **69 Match / 22 Player / 194 Goal / 749 Payment**, no goal overflow, no scorers outside squads, no out-of-range minutes or negative scores. Counts are observations, not migration assertions. Migration locks source tables and revalidates drift transactionally. Goal minute/score CHECKs and dorsal index validate all existing rows without inferred repairs. Source rival strings and all historical goal/payment records are retained.

`docs/db/verify_phase2.mjs` builds a synthetic pre-phase-1 schema, applies both prerequisites and phase 2, and tests roles, backfills, position compatibility, membership semantics, atomic failures, rival name/ID edits, squad/scorer guards, goal kinds/limits/minutes, score guards, aggregates, and public financial lockdown. It passed using the pre-existing external PGlite installation; no workspace dependency was added.

Local command when PGlite is resolvable: `node docs/db/verify_phase2.mjs`. In this workspace the external installation was resolved by a temporary loader in `/var/folders/z0/_yy5p7dj4wxftg5sn00zrlt80000gn/T/opencode/phase2-loader.mjs`.

PGlite is single-session. Docker daemon remains unavailable at application time; real two-session concurrency is **not yet verified**. The follow-up procedure is in `PHASE2_REVIEW.md` for an isolated PostgreSQL/Supabase local stack. Parent authorized rollout with this limitation documented.

Post-application advisors: no missing-FK-index or new security findings. Two new indexes report [unused-index INFO](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index): `player_team_team_idx`, `match_rival_idx`; retain them for FK/relation access. Private admin table without policies and narrow existing security-definer projections unchanged ([RLS advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [public projection advisor](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [authenticated definer advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)). Existing [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) remains an owner Auth-settings task. No new definer functions were introduced.

Parent owns application deployment and authenticated browser verification. Null-player goal rendering must be ready before admins add own_goal/unknown rows. Both repositories now type the applied schema. No authenticated browser credentials/session were provided; SQL role tests do not establish browser/login flow correctness.

### Remote evidence

Preflight/postflight and final after rolled-back tests: **194 Goal / 22 Player / 69 Match / 667 MatchSquad / 749 Payment**. Dorsals 24/12 were free among active and inactive players; exact approved selectors unique. Persisted corrections: Corneas 22 / Leobardo 24 / Sebastian 12. Backfilled **55 rival rows / 36 historical membership pairs**; **57 head-to-head groups** at the observed time. All 194 historical goals remain `player`; zero unknown/own goals, zero overflow and zero null-player stats groups. No missing historical goals were inserted.

`docs/db/verify_phase2_remote.sql` passed remotely inside one BEGIN/ROLLBACK with generated ephemeral fixtures only: real-admin invoker RPCs; typed ID-only and legacy rival creation/updates; WB/side/primary/secondary sync; omitted inactive/optional fields; membership dedup/preserve/clear/invalid-team atomic rollback; player DELETE denial; all goal kinds with minute 0/120 and null-player joins; direct overflow, invalid minute/attribution/outside-squad failures; negative/lowered score rejection; scorer deletion/RPC removal rejection; old save_match retained scorer/squad IDs and omitted scores; explicit goal removal; v_match/H2H; nonadmin/anon read and write/RPC denial; sanitized debt access with raw Payment denied. Final query found zero persisted verification players/rivals. Parent location-version updates did not recurse.

Supplemental `verify_phase2_history.sql` passed with ROLLBACK: actual historical save_match keeps scores/squad row IDs; owner-level Player/Match deletion fails restrictive history FKs; active-dorsal reactivation fails; under-cap direct Goal INSERT is denied to nonadmin by RLS. Initial nonadmin insert selected an at-cap match and was rejected by the BEFORE overflow trigger before RLS; the whole transaction aborted. Selecting an under-cap match then proved RLS denial separately. No changes persisted in either run. Remote PostgreSQL version observed: **17.6**. Trigger functions have EXECUTE revoked from anon/authenticated but run through installed triggers; pure helper functions are authenticated-callable invokers and expose no table data.

The owner confirmed **AE Trucking / AE Trucking FC**, **CMT FC / C.M.T FC**, **Union Real / Union Real FC** as identical teams. Follow-up **20261009032355 / merge_confirmed_rival_aliases** merged each pair, preserving target IDs/slugs and assigning both matches to each target. Post-check: 52 rivals, 69 matches, 194 goals; each surviving rival has two matches. No dates, scores, squads or goals changed. This is an explicitly approved alias mapping, not general fuzzy matching. Separating them again requires reviewing the affected matches; do not infer their old identities from the canonical display name.

Post-refresh checks passed: public TypeScript/ESLint/**26 tests**; admin `npm run check` (TypeScript/ESLint/**15 tests**). Multi-session concurrency and authenticated browser testing remain pending.

### Practical rollback limitations

The successful migration cannot be undone with a transaction rollback now. Approved dorsal corrections must not be silently reverted to duplicate 22/out-of-range 123. Structured fields, edited memberships and rival IDs/slugs may now have application-owned data. Own/unknown goals prevent simply restoring playerId NOT NULL; deleting them would destroy recorded history. Dropping views/tables/columns, restoring cascade FKs/player DELETE or rewriting attribution requires a separately reviewed destructive migration with explicit confirmation, data export and application coordination. No destructive reversal was executed. Prefer a narrowly reviewed forward fix preserving recorded data.
