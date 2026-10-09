// Run with PGlite available to Node (no production connection is used).
import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const root = new URL('../../', import.meta.url)
const db = new PGlite()
try {
  await db.exec(`
    create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated;
    insert into auth.users values(gen_random_uuid(),'fabianmendoza.py@gmail.com');
    create table public.season(id text primary key,name text not null unique,startdate date not null,enddate date not null,active boolean not null default false);
    create table public."Player"(id text primary key,name text not null,dorsal integer not null,positions text[],active boolean not null default true,"createdAt" timestamp not null default current_timestamp);
    create table public."Match"(id text primary key,"myTeam" text not null,"rivalTeam" text not null,"myPos" integer not null,"rivalPos" integer not null,date timestamptz not null,location text not null,"scoreHome" integer not null default 0,"scoreAway" integer not null default 0,kit smallint not null default 1,seasonid text not null references public.season(id));
    create table public."Goal"(id text primary key,minute integer,"matchId" text not null references public."Match" on update cascade on delete cascade,"playerId" text not null references public."Player" on update cascade on delete cascade);
    create table public."MatchSquad"(id text primary key,"matchId" text not null references public."Match" on update cascade on delete cascade,"playerId" text not null references public."Player" on update cascade on delete cascade);
    create table public."Event"(id text primary key,name text not null,cost double precision not null,date timestamptz not null,seasonid text not null references public.season);
    create table public."Payment"(id text primary key,paid boolean not null default false,"playerId" text not null references public."Player" on update cascade on delete cascade,"eventId" text not null references public."Event" on update cascade on delete cascade);
    create unique index "MatchSquad_matchId_playerId_key" on public."MatchSquad"("matchId","playerId");
    create unique index "Payment_playerId_eventId_key" on public."Payment"("playerId","eventId");
    insert into public.season values('s','Local','2026-01-01','2026-12-31',true);
    insert into public."Player"(id,name,dorsal,positions,active) values
      ('c','Corneas',22,array['Defensa (R)','Lateral (R)'],true),
      ('l','Leobardo',22,array['Lateral (L)'],true),
      ('s','Sebastian',123,array['Mediocentro','Lateral'],false);
    insert into public."Match"(id,"myTeam","rivalTeam","myPos","rivalPos",date,location,seasonid,"scoreHome") values
      ('m','ITJAGUARS FC',' Rival   FC ',1,2,'2026-01-07T02:50:00Z','Local','s',5),
      ('m2','ITJ FC','rival fc',1,2,'2026-07-09T01:50:00Z','Local','s',2);
    insert into public."MatchSquad" values('squad','m','c');
    insert into public."Goal" values('historical',null,'m','c');
  `)
  const policies = { Event:'La raza puede ver los eventos',Goal:'La raza puede ver los goles',Match:'La raza puede ver los partidos',MatchSquad:'La raza puede ver las alineaciones',Payment:'La raza puede ver los pagos',Player:'La raza puede ver a los jugadores',season:'La raza puede ver las seasons' }
  for (const [table,policy] of Object.entries(policies)) {
    await db.exec(`alter table public."${table}" enable row level security;
      grant all on public."${table}" to anon, authenticated;
      create policy "${policy}" on public."${table}" for select to anon using (true);
      create policy "Solo Admin" on public."${table}" for all to authenticated using (true) with check (true);
      create policy test on public."${table}" for select to authenticated using (true);`)
  }
  for (const name of ['20261007024919_club_contract.sql','20261007190054_financial_public_projection_lockdown.sql','20261008235036_phase2_players_rivals_goals.sql']) {
    await db.exec(await readFile(new URL(`supabase/migrations/${name}`,root),'utf8'))
  }
  const query = async sql => (await db.query(sql)).rows
  const reject = async (sql, pattern) => {
    let failure
    try { await db.exec(sql) } catch (error) { failure = error }
    assert.ok(failure, `Expected rejection: ${sql}`)
    if (pattern) assert.match(failure.message,pattern)
  }
  assert.deepEqual(await query(`select name,dorsal from public."Player" order by name`),[
    {name:'Corneas',dorsal:22},{name:'Leobardo',dorsal:24},{name:'Sebastian',dorsal:12}])
  assert.equal((await query(`select * from public.rival`)).length,1)
  assert.equal((await query(`select kind from public."Goal"`))[0].kind,'player')
  assert.equal((await query(`select positions from public."Player" where id='c'`))[0].positions[0],'Defensa (R)')
  await db.exec(`select set_config('request.jwt.claim.sub',(select id::text from auth.users limit 1),false); set role authenticated;`)
  const team = (await query(`select id from public.team order by slug limit 1`))[0].id
  const created = (await query(`select public.save_player('{"name":"New","dorsal":30,"primary_position":"WB","secondary_positions":["CM"],"preferred_side":"R"}',array['${team}','${team}']) id`))[0].id
  assert.equal((await query(`select active from public."Player" where id='${created}'`))[0].active,true)
  assert.equal((await query(`select * from public.player_team where player_id='${created}'`)).length,1)
  await reject(`select public.save_player('{"id":"${created}","secondary_positions":["CM","CM"]}')`,/Duplicate secondary/)
  await reject(`select public.save_player('{"id":"${created}","positions":["Portero"],"primary_position":"ST"}')`,/Conflicting/)
  await db.exec(`select public.save_player('{"id":"s","nickname":"Seba"}',array['${team}']);`)
  await db.exec(`select public.save_player('{"id":"s","foot":"BOTH"}');`)
  assert.equal((await query(`select active from public."Player" where id='s'`))[0].active,false)
  assert.equal((await query(`select * from public.player_team where player_id='s'`)).length,1)
  await reject(`select public.save_player('{"id":"s","nickname":"Lost"}',array['missing'])`,/Unknown membership/)
  assert.equal((await query(`select nickname from public."Player" where id='s'`))[0].nickname,'Seba')
  await db.exec(`select public.save_player('{"id":"s"}',array[]::text[]);`)
  assert.equal((await query(`select * from public.player_team where player_id='s'`)).length,0)
  await reject(`select public.save_player('{"id":"s","active":true,"dorsal":22}')`,/unique/)
  await reject(`update public."Player" set dorsal=100 where id='s'`,/player_dorsal_range/)
  await db.exec(`update public."Player" set positions=array['Lateral (L)','Delantero'] where id='l';`)
  assert.deepEqual((await query(`select primary_position,secondary_positions,preferred_side from public."Player" where id='l'`))[0],
    {primary_position:'WB',secondary_positions:['ST'],preferred_side:'L'})
  await db.exec(`select public.save_player('{"id":"l","primary_position":"DM","secondary_positions":["CM"],"preferred_side":"C"}');`)
  assert.deepEqual((await query(`select positions from public."Player" where id='l'`))[0].positions,['Mediocentro defensivo','Mediocentro'])
  await reject(`update public."Player" set positions=array['Invented'] where id='l'`,/Unknown legacy/)
  await reject(`delete from public."Player" where id='c'`,/permission denied/)
  await db.exec(`select public.save_match('{"id":"m","rivalTeam":" New   Rival "}',array['c','l']);`)
  assert.equal((await query(`select "rivalTeam","scoreHome" from public."Match" where id='m'`))[0].rivalTeam,'New Rival')
  const originalRival = (await query(`select id from public.rival where normalized_name='rival fc'`))[0].id
  await db.exec(`select public.save_match('{"id":"m","rivalId":"${originalRival}"}',array['c','l']);`)
  assert.equal((await query(`select "rivalTeam" from public."Match" where id='m'`))[0].rivalTeam,'Rival FC')
  await reject(`select public.save_match('{"id":"m","rivalTeam":"  "}',array['c','l'])`,/Nonblank/)
  await reject(`select public.save_match('{"id":"m","rivalId":"missing"}',array['c','l'])`,/Unknown rival/)
  // Same ID is not a changed field: name-only edits intentionally resolve by name.
  const otherRival = (await query(`select id from public.rival where normalized_name='new rival'`))[0].id
  await reject(`select public.save_match('{"id":"m","rivalId":"${otherRival}","rivalTeam":"Conflict"}',array['c','l'])`,/Conflicting/)
  await db.exec(`select public.add_goal('m','c'); select public.add_goal('m',null,'own_goal',120); select public.add_goal('m',null,'unknown',0);`)
  assert.equal((await query(`select sum(goals)::int goals from public.v_player_stats`))[0].goals,2)
  assert.equal((await query(`select * from public.v_player_stats where player_id is null`)).length,0)
  await reject(`select public.add_goal('m','s')`,/Scorer must/)
  await reject(`select public.add_goal('m',null,'player')`,/Scorer must|goal_kind_player/)
  await reject(`select public.add_goal('m','c','own_goal')`,/goal_kind_player/)
  await reject(`select public.add_goal('m','c','player',121)`,/goal_minute_range/)
  await reject(`update public."Match" set "scoreHome"=3 where id='m'`,/below recorded/)
  await reject(`update public."Match" set "scoreAway"=-1 where id='m'`,/match_nonnegative/)
  await reject(`delete from public."MatchSquad" where "matchId"='m' and "playerId"='c'`,/recorded scorer/)
  await reject(`update public."MatchSquad" set "playerId"='s' where "matchId"='m' and "playerId"='c'`,/recorded scorer/)
  await reject(`select public.save_match('{"id":"m","location":"Lost"}',array['l'])`,/recorded scorer/)
  assert.equal((await query(`select location from public."Match" where id='m'`))[0].location,'Local')
  await db.exec(`select public.add_goal('m',null,'unknown');`)
  await reject(`insert into public."Goal"("matchId",kind) values('m','unknown')`,/exceed/)
  await reject(`update public."Goal" set "matchId"='m2' where id='historical'`,/Scorer must/)
  await db.exec(`select public.remove_goal((select id from public."Goal" where kind='own_goal' limit 1));`)
  await db.exec(`select public.add_goal('m',null,'own_goal');`)
  await reject(`select public.remove_goal('missing')`,/Goal not found/)
  assert.equal((await query(`select played::int from public.v_head_to_head where team_id=(select "teamId" from public."Match" where id='m')`))[0].played,1)
  await db.exec(`reset role; select set_config('request.jwt.claim.sub',gen_random_uuid()::text,false); set role authenticated;`)
  await reject(`select public.add_goal('m',null,'unknown')`,/Administrator/)
  await reject(`select public.save_player('{"name":"Nonadmin","dorsal":30}')`,/Administrator/)
  await reject(`insert into public.rival(name,slug) values('No','no')`,/row-level security/)
  await db.exec(`reset role; set role anon;`)
  assert.equal((await query(`select count(*)::int n from public.v_match`))[0].n,2)
  assert.equal((await query(`select count(*)::int n from public."Goal"`))[0].n,5)
  await reject(`select public.add_goal('m',null,'unknown')`,/permission denied/)
  await reject(`select * from public."Payment"`,/permission denied/)
  console.log('Phase 2 passed: migrations, backfills, compatibility, RPC atomicity, history/goal guards, aggregates, admin/nonadmin/anon permissions.')
  console.log('Concurrency requires multi-session PostgreSQL review; PGlite is single-session.')
} catch (error) {
  console.error(error.message, error.internalQuery ?? '', error.where ?? '')
  process.exitCode = 1
} finally { await db.close() }
