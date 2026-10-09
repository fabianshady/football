-- PREPARED ONLY. Parent review/authorization required before remote application.
-- Depends on club_contract and financial_public_projection_lockdown.
begin;

-- Block concurrent writes while validating/backfilling this one-time transition.
lock table public."Player", public."Match", public."MatchSquad", public."Goal", public."Payment"
  in share row exclusive mode;

-- Resolve approved corrections by unique exact names, never generated IDs.
do $$ declare correction record; n integer; existing_dorsal integer; begin
  for correction in select * from (values ('Leobardo',22,24),('Sebastian',123,12),('Corneas',22,22))
    as approved(name, previous_dorsal, dorsal) loop
    select count(*), min(dorsal) into n, existing_dorsal from public."Player" where name = correction.name;
    if n <> 1 or existing_dorsal not in (correction.previous_dorsal, correction.dorsal) then
      raise exception 'Approved dorsal selector drift for %; parent review required', correction.name;
    end if;
    if exists (select 1 from public."Player" where active and name <> correction.name and dorsal = correction.dorsal) then
      raise exception 'Approved dorsal % now occupied; parent review required', correction.dorsal;
    end if;
    update public."Player" set dorsal = correction.dorsal where name = correction.name;
  end loop;
end $$;

alter table public."Player"
  add column nickname text,
  add column primary_position text check (primary_position in ('GK','CB','WB','DM','CM','AM','W','ST')),
  add column secondary_positions text[] not null default array[]::text[],
  add column preferred_side text not null default 'ANY' check (preferred_side in ('L','R','C','ANY')),
  add column foot text check (foot in ('L','R','BOTH')),
  add constraint player_dorsal_range check (dorsal between 1 and 99),
  add constraint player_secondary_codes check (
    secondary_positions <@ array['GK','CB','WB','DM','CM','AM','W','ST']::text[]
    and array_position(secondary_positions, null) is null
    and array_ndims(secondary_positions) <= 1),
  add constraint player_primary_not_secondary check (primary_position is null or not primary_position = any(secondary_positions)),
  add constraint player_secondary_requires_primary check (primary_position is not null or cardinality(secondary_positions) = 0);
create unique index player_active_dorsal_unique on public."Player"(dorsal) where active;

create function public.player_position_code(p_label text) returns text
language plpgsql immutable security invoker set search_path = pg_catalog as $$
declare label text := btrim(regexp_replace(p_label, '\s*\([LRC]\)$', '')); begin
  return case label when 'Portero' then 'GK' when 'Defensa' then 'CB' when 'Lateral' then 'WB'
    when 'Mediocentro defensivo' then 'DM' when 'Mediocentro' then 'CM' when 'Mediapunta' then 'AM'
    when 'Extremo' then 'W' when 'Delantero' then 'ST'
    when 'GK' then 'GK' when 'CB' then 'CB' when 'WB' then 'WB' when 'DM' then 'DM'
    when 'CM' then 'CM' when 'AM' then 'AM' when 'W' then 'W' when 'ST' then 'ST' else null end;
end $$;
create function public.player_position_codes(p_labels text[]) returns text[]
language plpgsql immutable security invoker set search_path = pg_catalog as $$
declare label text; code text; codes text[] := array[]::text[]; begin
  foreach label in array coalesce(p_labels, array[]::text[]) loop
    code := public.player_position_code(label);
    if code is null then raise exception 'Unknown legacy position: %', label; end if;
    if not code = any(codes) then codes := array_append(codes, code); end if;
  end loop;
  return codes;
end $$;
create function public.player_position_side(p_labels text[]) returns text
language sql immutable security invoker set search_path = pg_catalog as $$
  select case when count(distinct side) = 1 then min(side) else 'ANY' end
  from (select substring(label from '\(([LRC])\)$') as side from unnest(p_labels) label) s
  where side is not null
$$;
-- No names, nicknames, feet or legal identities are invented. Keep source positions intact.
update public."Player" set
  primary_position = (public.player_position_codes(positions))[1],
  secondary_positions = coalesce((public.player_position_codes(positions))[2:], array[]::text[]),
  preferred_side = public.player_position_side(positions);

create function public.sync_player_positions() returns trigger
language plpgsql security invoker set search_path = pg_catalog as $$
declare legacy_changed boolean; structured_changed boolean; codes text[]; expected text[]; begin
  if tg_op = 'INSERT' then
    legacy_changed := new.positions is not null;
    structured_changed := new.primary_position is not null or cardinality(new.secondary_positions) > 0;
  else
    legacy_changed := new.positions is distinct from old.positions;
    structured_changed := new.primary_position is distinct from old.primary_position
      or new.secondary_positions is distinct from old.secondary_positions
      or new.preferred_side is distinct from old.preferred_side;
  end if;
  if legacy_changed then
    codes := public.player_position_codes(new.positions);
    if structured_changed then
      expected := case when new.primary_position is null then array[]::text[]
        else array[new.primary_position] || new.secondary_positions end;
      if codes is distinct from expected then raise exception 'Conflicting legacy and structured positions'; end if;
    else
      new.primary_position := codes[1];
      new.secondary_positions := coalesce(codes[2:], array[]::text[]);
      new.preferred_side := public.player_position_side(new.positions);
    end if;
  end if;
  if structured_changed then
    select coalesce(array_agg(case code
      when 'GK' then 'Portero' when 'CB' then 'Defensa' when 'WB' then 'Lateral'
      when 'DM' then 'Mediocentro defensivo' when 'CM' then 'Mediocentro'
      when 'AM' then 'Mediapunta' when 'W' then 'Extremo' when 'ST' then 'Delantero' else code end
      || case when new.preferred_side in ('L','R','C') and code in ('CB','WB','W')
        then ' (' || new.preferred_side || ')' else '' end order by ord), array[]::text[])
    into new.positions
    from unnest(case when new.primary_position is null then array[]::text[]
      else array[new.primary_position] || new.secondary_positions end) with ordinality as p(code,ord);
  end if;
  if (select count(*) from unnest(new.secondary_positions)) <>
     (select count(distinct p) from unnest(new.secondary_positions) p) then
    raise exception 'Duplicate secondary position';
  end if;
  return new;
end $$;
create trigger player_positions_before_write before insert or update on public."Player"
for each row execute function public.sync_player_positions();

-- Protect financial and sporting player history from cascaded deletion.
alter table public."Goal" drop constraint "Goal_playerId_fkey",
  add constraint "Goal_playerId_fkey" foreign key ("playerId") references public."Player"(id) on update cascade on delete restrict;
alter table public."MatchSquad" drop constraint "MatchSquad_playerId_fkey",
  add constraint "MatchSquad_playerId_fkey" foreign key ("playerId") references public."Player"(id) on update cascade on delete restrict;
alter table public."Payment" drop constraint "Payment_playerId_fkey",
  add constraint "Payment_playerId_fkey" foreign key ("playerId") references public."Player"(id) on update cascade on delete restrict;
drop policy admin_delete on public."Player";
revoke delete on public."Player" from public, anon, authenticated;

create table public.player_team (
  player_id text not null references public."Player"(id) on update cascade on delete restrict,
  team_id text not null references public.team(id) on update cascade on delete restrict,
  primary key (player_id, team_id)
);
create index player_team_team_idx on public.player_team(team_id);
-- Historical participation is evidence of affiliation, NOT certified current membership.
insert into public.player_team(player_id, team_id)
select distinct s."playerId", m."teamId" from public."MatchSquad" s join public."Match" m on m.id = s."matchId";

create function public.save_player(p_player jsonb, p_team_ids text[] default null) returns text
language plpgsql security invoker set search_path = pg_catalog as $$
declare current_player public."Player"%rowtype; proposed public."Player"%rowtype;
  v_player_id text; teams text[]; key_name text; begin
  if not public.is_admin() then raise exception 'Administrator required' using errcode = '42501'; end if;
  if p_player is null or jsonb_typeof(p_player) <> 'object' then raise exception 'Player object required'; end if;
  for key_name in select jsonb_object_keys(p_player) loop
    if key_name <> all(array['id','name','dorsal','positions','active','nickname','primary_position','secondary_positions','preferred_side','foot']) then
      raise exception 'Unsupported player field: %', key_name;
    end if;
  end loop;
  if p_team_ids is not null then
    if exists (select 1 from unnest(p_team_ids) t where t is null or btrim(t) = '') then raise exception 'Null/blank team ID'; end if;
    select coalesce(array_agg(distinct t order by t), array[]::text[]) into teams from unnest(p_team_ids) t;
    perform t.id from public.team t where t.id = any(teams) order by t.id for key share;
    if (select count(*) from public.team where id = any(teams)) <> cardinality(teams) then raise exception 'Unknown membership team'; end if;
  end if;
  v_player_id := p_player ->> 'id';
  if p_player ? 'id' then
    if v_player_id is null or btrim(v_player_id) = '' then raise exception 'Existing player ID required'; end if;
    select * into current_player from public."Player" where id = v_player_id for update;
    if not found then raise exception 'Player not found'; end if;
    proposed := jsonb_populate_record(current_player, p_player);
    update public."Player" set name = proposed.name, dorsal = proposed.dorsal, active = proposed.active,
      positions = proposed.positions, nickname = proposed.nickname, primary_position = proposed.primary_position,
      secondary_positions = proposed.secondary_positions, preferred_side = proposed.preferred_side, foot = proposed.foot
    where id = v_player_id;
  else
    proposed := jsonb_populate_record(null::public."Player", p_player);
    insert into public."Player"(name,dorsal,active,positions,nickname,primary_position,secondary_positions,preferred_side,foot)
    values (proposed.name,proposed.dorsal,case when p_player ? 'active' then proposed.active else true end,
      proposed.positions,proposed.nickname,proposed.primary_position,
      case when p_player ? 'secondary_positions' then proposed.secondary_positions else array[]::text[] end,
      case when p_player ? 'preferred_side' then proposed.preferred_side else 'ANY' end,proposed.foot)
    returning id into v_player_id;
  end if;
  if teams is not null then
    delete from public.player_team pt where pt.player_id = v_player_id and not pt.team_id = any(teams);
    insert into public.player_team(player_id,team_id) select v_player_id,t from unnest(teams) t on conflict do nothing;
  end if;
  return v_player_id;
end $$;

create function public.normalize_rival_name(p_name text) returns text
language sql immutable strict security invoker set search_path = pg_catalog as $$
  select lower(btrim(regexp_replace(p_name, '[[:space:]]+', ' ', 'g')))
$$;
create table public.rival (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  slug text not null unique,
  normalized_name text generated always as (public.normalize_rival_name(name)) stored not null unique,
  constraint rival_nonblank_name check (normalized_name <> ''),
  constraint rival_nonblank_slug check (btrim(slug) <> '')
);
-- Hash suffix preserves accent/punctuation distinctions without speculative alias merges.
insert into public.rival(name, slug)
select canonical, coalesce(nullif(btrim(regexp_replace(normalized, '[^a-z0-9]+', '-', 'g'), '-'),''),'rival')
  || '-' || md5(normalized)
from (select public.normalize_rival_name("rivalTeam") normalized,
  min(btrim(regexp_replace("rivalTeam", '[[:space:]]+', ' ', 'g'))) canonical
  from public."Match" group by public.normalize_rival_name("rivalTeam")) names;
alter table public."Match" add column "rivalId" text references public.rival(id) on delete restrict;
update public."Match" m set "rivalId" = r.id from public.rival r
where r.normalized_name = public.normalize_rival_name(m."rivalTeam");
alter table public."Match" alter column "rivalId" set not null;
create index match_rival_idx on public."Match"("rivalId");

create function public.sync_match_rival() returns trigger
language plpgsql security invoker set search_path = pg_catalog as $$
declare resolved public.rival%rowtype; name_changed boolean; id_changed boolean; normalized text; canonical text; begin
  if tg_op = 'UPDATE' then
    name_changed := new."rivalTeam" is distinct from old."rivalTeam";
    id_changed := new."rivalId" is distinct from old."rivalId";
  else
    name_changed := new."rivalTeam" is not null;
    id_changed := new."rivalId" is not null;
  end if;
  if (name_changed and not id_changed) or new."rivalId" is null then
    normalized := public.normalize_rival_name(new."rivalTeam");
    if normalized is null or normalized = '' then raise exception 'Nonblank rival name required'; end if;
    canonical := btrim(regexp_replace(new."rivalTeam", '[[:space:]]+', ' ', 'g'));
    insert into public.rival(name,slug) values (canonical,
      coalesce(nullif(btrim(regexp_replace(normalized, '[^a-z0-9]+', '-', 'g'), '-'),''),'rival') || '-' || md5(normalized))
    on conflict (normalized_name) do update set name = rival.name returning * into resolved;
  else
    select * into resolved from public.rival where id = new."rivalId";
    if not found then raise exception 'Unknown rival ID'; end if;
    if name_changed and public.normalize_rival_name(new."rivalTeam") is distinct from resolved.normalized_name then
      raise exception 'Conflicting rivalId and rivalTeam';
    end if;
  end if;
  new."rivalId" := resolved.id;
  new."rivalTeam" := resolved.name;
  return new;
end $$;
create trigger match_rival_before_write before insert or update of "rivalId", "rivalTeam" on public."Match"
for each row execute function public.sync_match_rival();

do $$ declare tbl text; begin
  foreach tbl in array array['player_team','rival'] loop
    execute format('alter table public.%I enable row level security',tbl);
    execute format('revoke all on public.%I from public, anon, authenticated',tbl);
    execute format('grant select on public.%I to anon',tbl);
    execute format('grant select,insert,update,delete on public.%I to authenticated',tbl);
    execute format('create policy public_read on public.%I for select to anon,authenticated using (true)',tbl);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check ((select public.is_admin()))',tbl);
    execute format('create policy admin_update on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',tbl);
    execute format('create policy admin_delete on public.%I for delete to authenticated using ((select public.is_admin()))',tbl);
  end loop;
end $$;

-- Preflight fails transactionally on historical drift; never infer missing goal rows.
do $$ begin
  if exists (select 1 from public."Goal" g where not exists (
    select 1 from public."MatchSquad" s where s."matchId" = g."matchId" and s."playerId" = g."playerId")) then
    raise exception 'Historical scorer outside squad; parent review required';
  end if;
  if exists (select 1 from public."Match" m where m."scoreHome" < (select count(*) from public."Goal" g where g."matchId" = m.id)) then
    raise exception 'Historical goal count exceeds score; parent review required';
  end if;
end $$;
alter table public."Goal" alter column "playerId" drop not null,
  add column kind text not null default 'player' check (kind in ('player','own_goal','unknown')),
  add constraint goal_kind_player check ((kind = 'player' and "playerId" is not null) or (kind in ('own_goal','unknown') and "playerId" is null)),
  add constraint goal_minute_range check (minute between 0 and 120);
alter table public."Match" add constraint match_nonnegative_scores check ("scoreHome" >= 0 and "scoreAway" >= 0);
-- Matches with sporting history cannot be removed through legacy cascades either.
alter table public."Goal" drop constraint "Goal_matchId_fkey",
  add constraint "Goal_matchId_fkey" foreign key ("matchId") references public."Match"(id) on update cascade on delete restrict;
alter table public."MatchSquad" drop constraint "MatchSquad_matchId_fkey",
  add constraint "MatchSquad_matchId_fkey" foreign key ("matchId") references public."Match"(id) on update cascade on delete restrict;

create function public.guard_goal_write() returns trigger
language plpgsql security invoker set search_path = pg_catalog as $$
declare parent_score integer; goals bigint; begin
  -- Lock parent(s) BEFORE reading squad or counts. Sorted locks for moved goals.
  if tg_op = 'INSERT' then
    perform id from public."Match" where id = new."matchId" for update;
  elsif tg_op = 'DELETE' then
    perform id from public."Match" where id = old."matchId" for update;
    update public."Match" set location = location where id = old."matchId";
    return old;
  else
    perform id from public."Match" where id in (old."matchId",new."matchId") order by id for update;
  end if;
  -- Create a parent row version as well as a lock: stale REPEATABLE READ writers
  -- must serialize-fail instead of counting goals from an old snapshot.
  if tg_op = 'UPDATE' then
    update public."Match" set location = location where id in (old."matchId",new."matchId");
  else
    update public."Match" set location = location where id = new."matchId";
  end if;
  select "scoreHome" into parent_score from public."Match" where id = new."matchId";
  if not found then raise exception 'Match not found'; end if;
  if new.kind = 'player' and not exists (select 1 from public."MatchSquad"
    where "matchId" = new."matchId" and "playerId" = new."playerId") then
    raise exception 'Scorer must belong to match squad';
  end if;
  if tg_op = 'UPDATE' then
    select count(*) into goals from public."Goal" where "matchId" = new."matchId" and id <> old.id;
  else
    select count(*) into goals from public."Goal" where "matchId" = new."matchId";
  end if;
  if goals + 1 > parent_score then raise exception 'Recorded goals exceed scoreHome'; end if;
  return new;
end $$;
create trigger goal_guard_before_write before insert or update or delete on public."Goal"
for each row execute function public.guard_goal_write();

create function public.guard_match_score() returns trigger
language plpgsql security invoker set search_path = pg_catalog as $$ begin
  -- UPDATE already holds the same parent row lock used by all goal/squad writes.
  if new."scoreHome" < (select count(*) from public."Goal" where "matchId" = old.id) then
    raise exception 'scoreHome cannot be below recorded goal count';
  end if;
  return new;
end $$;
create trigger match_score_before_update before update of "scoreHome" on public."Match"
for each row execute function public.guard_match_score();

create function public.guard_squad_write() returns trigger
language plpgsql security invoker set search_path = pg_catalog as $$ begin
  if tg_op = 'INSERT' then
    perform id from public."Match" where id = new."matchId" for update;
    update public."Match" set location = location where id = new."matchId";
    return new;
  elsif tg_op = 'UPDATE' then
    perform id from public."Match" where id in (old."matchId",new."matchId") order by id for update;
    update public."Match" set location = location where id in (old."matchId",new."matchId");
    if new."matchId" = old."matchId" and new."playerId" = old."playerId" then return new; end if;
  else
    perform id from public."Match" where id = old."matchId" for update;
    update public."Match" set location = location where id = old."matchId";
  end if;
  if exists (select 1 from public."Goal" where "matchId" = old."matchId" and "playerId" = old."playerId" and kind = 'player') then
    raise exception 'Cannot remove a recorded scorer from match squad';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger squad_guard_before_write before insert or update or delete on public."MatchSquad"
for each row execute function public.guard_squad_write();

create or replace function public.save_match(p_match jsonb, p_player_ids text[]) returns text
language plpgsql security invoker set search_path = pg_catalog as $$
declare current_match public."Match"%rowtype; proposed public."Match"%rowtype;
  match_id text; players text[]; key_name text; begin
  if not public.is_admin() then raise exception 'Administrator required' using errcode = '42501'; end if;
  if p_match is null or jsonb_typeof(p_match) <> 'object' then raise exception 'Match object required'; end if;
  for key_name in select jsonb_object_keys(p_match) loop
    if key_name <> all(array['id','teamId','myTeam','rivalId','rivalTeam','myPos','rivalPos','date','location','scoreHome','scoreAway','kit','seasonid','schedule_override']) then
      raise exception 'Unsupported match field: %', key_name;
    end if;
  end loop;
  if p_player_ids is null or exists (select 1 from unnest(p_player_ids) p where p is null or btrim(p) = '') then
    raise exception 'Explicit player array required; null/blank player IDs forbidden';
  end if;
  select coalesce(array_agg(distinct p order by p), array[]::text[]) into players from unnest(p_player_ids) p;
  match_id := p_match ->> 'id';
  if p_match ? 'id' then
    if match_id is null or btrim(match_id) = '' then raise exception 'Existing match ID required'; end if;
    select * into current_match from public."Match" where id = match_id for update;
    if not found then raise exception 'Match not found'; end if;
    if exists (select 1 from public."Goal" where "matchId" = match_id and kind = 'player' and not "playerId" = any(players)) then
      raise exception 'Cannot remove a recorded scorer from match squad';
    end if;
  end if;
  perform p.id from public."Player" p where p.id = any(players) order by p.id for key share;
  if (select count(*) from public."Player" p where p.id = any(players)) <> cardinality(players) then raise exception 'Unknown player in squad'; end if;
  if p_match ? 'id' then
    proposed := jsonb_populate_record(current_match, p_match);
    update public."Match" set "teamId" = proposed."teamId", "myTeam" = proposed."myTeam",
      "rivalId" = proposed."rivalId", "rivalTeam" = proposed."rivalTeam", "myPos" = proposed."myPos", "rivalPos" = proposed."rivalPos",
      date = proposed.date, location = proposed.location, "scoreHome" = proposed."scoreHome", "scoreAway" = proposed."scoreAway",
      kit = proposed.kit, seasonid = proposed.seasonid, schedule_override = proposed.schedule_override where id = match_id;
  else
    proposed := jsonb_populate_record(null::public."Match", p_match);
    insert into public."Match"("teamId","myTeam","rivalId","rivalTeam","myPos","rivalPos",date,location,"scoreHome","scoreAway",kit,seasonid,schedule_override)
    values (proposed."teamId",proposed."myTeam",proposed."rivalId",proposed."rivalTeam",proposed."myPos",proposed."rivalPos",proposed.date,proposed.location,
      case when p_match ? 'scoreHome' then proposed."scoreHome" else 0 end,
      case when p_match ? 'scoreAway' then proposed."scoreAway" else 0 end,
      case when p_match ? 'kit' then proposed.kit else 1 end,proposed.seasonid,
      case when p_match ? 'schedule_override' then proposed.schedule_override else false end) returning id into match_id;
  end if;
  delete from public."MatchSquad" where "matchId" = match_id and not "playerId" = any(players);
  insert into public."MatchSquad"("matchId","playerId") select match_id,p from unnest(players) p
    on conflict ("matchId","playerId") do nothing;
  return match_id;
end $$;

create function public.add_goal(p_match_id text, p_player_id text default null, p_kind text default 'player', p_minute integer default null)
returns text language plpgsql security invoker set search_path = pg_catalog as $$
declare goal_id text; begin
  if not public.is_admin() then raise exception 'Administrator required' using errcode = '42501'; end if;
  perform id from public."Match" where id = p_match_id for update;
  if not found then raise exception 'Match not found'; end if;
  insert into public."Goal"("matchId","playerId",kind,minute) values (p_match_id,p_player_id,p_kind,p_minute) returning id into goal_id;
  return goal_id;
end $$;
create function public.remove_goal(p_goal_id text) returns void
language plpgsql security invoker set search_path = pg_catalog as $$
declare match_id text; begin
  if not public.is_admin() then raise exception 'Administrator required' using errcode = '42501'; end if;
  select "matchId" into match_id from public."Goal" where id = p_goal_id;
  if not found then raise exception 'Goal not found'; end if;
  perform id from public."Match" where id = match_id for update;
  delete from public."Goal" where id = p_goal_id;
  if not found then raise exception 'Goal not found'; end if;
end $$;

-- Explicit old column order: CREATE OR REPLACE may only append view columns.
create or replace view public.v_match with (security_invoker = true) as
select m.id,m."myTeam",m."rivalTeam",m."myPos",m."rivalPos",m.date,m.location,m."scoreHome",m."scoreAway",m.kit,m.seasonid,m."teamId",m.schedule_override,
  t.slug as team_slug,t.name as team_name,m.date at time zone 'America/Tijuana' as kickoff_local,
  extract(dow from m.date at time zone 'America/Tijuana')::integer as kickoff_weekday,
  to_char(m.date at time zone 'America/Tijuana','HH24:MI') as kickoff_slot,
  m."rivalId",r.id as rival_id,r.slug as rival_slug,r.name as rival_name
from public."Match" m join public.team t on t.id = m."teamId" join public.rival r on r.id = m."rivalId";
create view public.v_head_to_head with (security_invoker = true) as
select "teamId" as team_id,"rivalId" as rival_id,count(*) as played,
  count(*) filter (where "scoreHome" > "scoreAway") as wins,
  count(*) filter (where "scoreHome" = "scoreAway") as draws,
  count(*) filter (where "scoreHome" < "scoreAway") as losses,
  sum("scoreHome") as goals_for,sum("scoreAway") as goals_against,max(date) as last_played
from public."Match" where date < now() group by "teamId","rivalId";
create or replace view public.v_player_stats with (security_invoker = true) as
with callups as (
  select s."playerId" as player_id,m."teamId" as team_id,m.seasonid as season_id,count(*) as call_ups
  from public."MatchSquad" s join public."Match" m on m.id = s."matchId" group by s."playerId",m."teamId",m.seasonid
), goals as (
  select g."playerId" as player_id,m."teamId" as team_id,m.seasonid as season_id,count(*) as goals
  from public."Goal" g join public."Match" m on m.id = g."matchId"
  where g.kind = 'player' and g."playerId" is not null group by g."playerId",m."teamId",m.seasonid
)
select coalesce(c.player_id,g.player_id) as player_id,coalesce(c.team_id,g.team_id) as team_id,
  coalesce(c.season_id,g.season_id) as season_id,coalesce(c.call_ups,0::bigint) as call_ups,coalesce(g.goals,0::bigint) as goals
from callups c full join goals g on c.player_id = g.player_id and c.team_id = g.team_id and c.season_id = g.season_id;
revoke all on public.v_head_to_head from public,anon,authenticated;
grant select on public.v_head_to_head to anon,authenticated;

-- Internal trigger functions are not RPCs. Pure helpers must remain executable by
-- writers (including generated-column evaluation); they expose no table data.
revoke all on function public.player_position_code(text),public.player_position_codes(text[]),public.player_position_side(text[]),
  public.normalize_rival_name(text) from public,anon,authenticated;
grant execute on function public.player_position_code(text),public.player_position_codes(text[]),public.player_position_side(text[]),
  public.normalize_rival_name(text) to authenticated;
revoke all on function public.sync_player_positions(),public.sync_match_rival(),public.guard_goal_write(),
  public.guard_match_score(),public.guard_squad_write() from public,anon,authenticated;
revoke all on function public.save_player(jsonb,text[]),public.save_match(jsonb,text[]),
  public.add_goal(text,text,text,integer),public.remove_goal(text) from public,anon,authenticated;
grant execute on function public.save_player(jsonb,text[]),public.save_match(jsonb,text[]),
  public.add_goal(text,text,text,integer),public.remove_goal(text) to authenticated;
commit;
