# Parent review — phase 2

Parent reviewed the full 447-line SQL and explicitly authorized application. Applied remotely as **20261008235036 / phase2_players_rivals_goals** on 2026-10-08 23:50:36 UTC; do not reapply it.
Use `PHASE2_CONTRACT.md` for client contracts and rollout sequencing.

## Read-only preflight

These were checked before application; review drift for any future corrective migration:

```sql
select name, count(*), array_agg(dorsal order by dorsal)
from public."Player" where name in ('Corneas','Leobardo','Sebastian') group by name;
select dorsal, array_agg(name) from public."Player" where active
group by dorsal having count(*) > 1;
select name, dorsal from public."Player" where dorsal not between 1 and 99;
select g.* from public."Goal" g where not exists (
  select 1 from public."MatchSquad" s
  where s."matchId" = g."matchId" and s."playerId" = g."playerId"
);
select m.id, m."scoreHome", count(g.id) as recorded
from public."Match" m join public."Goal" g on g."matchId" = m.id
group by m.id having count(g.id) > m."scoreHome";
select * from public."Goal" where minute not between 0 and 120;
select id from public."Match" where "scoreHome" < 0 or "scoreAway" < 0;
select id, "rivalTeam" from public."Match"
where btrim(regexp_replace("rivalTeam", '[[:space:]]+', ' ', 'g')) = '';
```

The expected baseline contains Corneas/Leobardo active duplicate 22 and Sebastian 123; these are the only approved corrections. Migration resolves names and checks all destinations afresh. Any other drift requires review, not a speculative correction. Recheck existing functions/policies against prerequisites if schema history changed since inspection.

## Two-session concurrency check (isolated local database only)

Apply prerequisites and the prepared migration to a disposable local database with the approved-name fixtures. Create a dedicated test match with a valid team/schedule (or explicit schedule_override), scoreHome=1, zero goals, and two existing players in its squad. Resolve the generated match/player IDs client-side and substitute `MATCH_ID`, `PLAYER_A`, `PLAYER_B` below. Use owner role for trigger tests or a configured real local admin JWT for RPC/RLS tests. Never use production fixtures.

### Overflow serialization

Session A:

```sql
begin;
insert into public."Goal"("matchId", "playerId") values ('MATCH_ID','PLAYER_A');
-- Leave transaction open while session B starts.
```

Session B:

```sql
begin;
set local lock_timeout = '30s';
insert into public."Goal"("matchId", "playerId") values ('MATCH_ID','PLAYER_B');
-- Must wait for session A's Match parent lock.
```

Commit A; B must resume with `Recorded goals exceed scoreHome`. Roll back B. Verify exactly one goal and scoreHome=1. Repeat with A inserting unknown/own_goal and B inserting a player goal, and with B using `add_goal` as local admin. Failure to block or overflow rejection failure stops review.

Repeat at REPEATABLE READ, forcing B's snapshot before A commits. B must reject with a serialization failure (the triggers write a new parent row version), never commit a second goal. Retry the whole B transaction at the caller.

### Score/goal serialization

Reset fixture goals to zero and scoreHome=1. A begins and inserts one goal without committing. B begins and updates scoreHome=0; it must wait. Commit A; B must reject the score below recorded count. Roll back B. Reverse ordering: A lowers scoreHome=0 without committing, B attempts a goal; commit A, and B must reject overflow.

### Squad/goal serialization

Reset to zero goals and scoreHome=1. A begins and inserts a goal for PLAYER_A. B begins and deletes/reassigns PLAYER_A's squad row; it must wait. Commit A; B must reject removing the recorded scorer. Reverse ordering: A deletes that squad row without committing, B attempts a goal for PLAYER_A; commit A, B must reject a scorer outside squad.

### Rival upsert

Use two dedicated matches. In A begin and update rivalTeam to `Concurrent Rival`. In B begin and update the other match's rivalTeam to ` concurrent   rival `; B must wait for the normalized-name unique conflict. Commit A then B; verify both rival IDs equal and exactly one normalized-name row. Accent/punctuation/FC variants must remain separate. Clean up only disposable test fixtures; discard the local database when finished.

Current evidence: parent authorized remote rollout; synthetic PGlite and remote rollback-only role/integrity tests passed. Two-session checks remain pending because local Docker daemon was unavailable at rollout. Record PostgreSQL version and outcomes here when the follow-up isolated concurrency test runs. No concurrency proof is claimed from single-session SQL tests.
