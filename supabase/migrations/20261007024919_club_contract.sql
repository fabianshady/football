-- Parent-owned rollout. Prepared from read-only schema inspection on 2026-10-06.
-- Run as postgres/migration owner. No remote execution was performed by the author.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table private.admin_users enable row level security;
revoke all on private.admin_users from public, anon, authenticated;
-- Existing "Solo Admin" policy evidence names this real admin and test@test.com.
-- Resolve identity at deployment; never embed a generated auth UUID or seed test.
insert into private.admin_users(user_id)
select id from auth.users where lower(email) = 'fabianmendoza.py@gmail.com';
do $$ begin
  if not exists (select 1 from private.admin_users) then
    raise exception 'Existing real administrator was not found; abort deployment';
  end if;
end $$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = pg_catalog
as $$ select exists (
  select 1 from private.admin_users a where a.user_id = (select auth.uid())
) $$;
revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

create table public.team (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name text not null unique,
  match_weekday integer not null check (match_weekday between 0 and 6),
  league_name text,
  sort_order integer not null default 0
);
create table public.kickoff_slot (
  time time without time zone primary key,
  constraint kickoff_slot_whole_minute check (extract(second from time) = 0)
);
insert into public.kickoff_slot(time) values
  ('18:50'), ('19:40'), ('20:30'), ('21:20'), ('22:10');
create table public.club_settings (
  id integer primary key check (id = 1),
  phone text, clabe text, account text, bank text,
  weekly_fee numeric check (weekly_fee >= 0 and weekly_fee < 'Infinity'::numeric)
);
-- Previously published constants, verified with git show HEAD:components/club-tabs.tsx.
insert into public.club_settings(id, phone, clabe, account, bank, weekly_fee)
values (1, '5517275953', '638180000142128116', '1566875932', 'BBVA', 120);

-- Fail closed on unrecognized historic names, rather than inventing teams/schedules.
do $$ begin
  if exists (select 1 from public."Match" where "myTeam" not in ('ITJ FC','ITJAGUARS FC')) then
    raise exception 'Unknown historical myTeam; review explicit team mapping before deployment';
  end if;
end $$;
insert into public.team(slug, name, match_weekday, sort_order)
select case "myTeam" when 'ITJ FC' then 'itj-fc' else 'itjaguars' end,
       "myTeam", case "myTeam" when 'ITJ FC' then 3 else 2 end,
       case "myTeam" when 'ITJ FC' then 2 else 1 end
from (select distinct "myTeam" from public."Match") names;
alter table public."Match"
  add column "teamId" text references public.team(id),
  add column schedule_override boolean not null default false;
update public."Match" m set "teamId" = t.id from public.team t where t.name = m."myTeam";
alter table public."Match" alter column "teamId" set not null;
-- No date corrections and no historic override flags. Abort on drift instead.
do $$ begin
  if exists (
    select 1 from public."Match" m join public.team t on t.id = m."teamId"
    where extract(dow from m.date at time zone 'America/Tijuana') <> t.match_weekday
       or not exists (select 1 from public.kickoff_slot s
                      where s.time = (m.date at time zone 'America/Tijuana')::time)
  ) then raise exception 'Historical schedule mismatch; do not silently correct dates'; end if;
end $$;

do $$ declare tbl text; begin
  foreach tbl in array array['Event','Goal','Match','MatchSquad','Payment','Player','season'] loop
    execute format('alter table public.%I alter column id set default gen_random_uuid()::text', tbl);
  end loop;
end $$;

-- Existing unique indexes already cover (matchId,playerId) and (playerId,eventId).
-- Verify rather than silently deleting duplicate rows or building redundant indexes.
do $$ begin
  if to_regclass('public."MatchSquad_matchId_playerId_key"') is null
     or to_regclass('public."Payment_playerId_eventId_key"') is null then
    raise exception 'Expected squad/payment unique indexes missing; inspect schema drift';
  end if;
end $$;
create index idx_goal_match on public."Goal"("matchId");
create index idx_goal_player on public."Goal"("playerId");
create index idx_squad_player on public."MatchSquad"("playerId");
create index idx_payment_event on public."Payment"("eventId");
create index idx_match_team_season_date on public."Match"("teamId", seasonid, date desc);
-- Preserve idx_match_season and idx_event_season; new composite doesn't cover season alone.

-- Preserve anon SELECT on all seven tables during compatibility deployment.
-- Replace authenticated ALL/test policies so no permissive legacy bypass survives.
do $$ declare tbl text; begin
  foreach tbl in array array['Event','Goal','Match','MatchSquad','Payment','Player','season'] loop
    execute format('drop policy "Solo Admin" on public.%I', tbl);
    execute format('drop policy test on public.%I', tbl);
    execute format('alter table public.%I enable row level security', tbl);
    execute format('create policy authenticated_read on public.%I for select to authenticated using (%s)',
      tbl, case when tbl in ('Event','Payment') then '(select public.is_admin())' else 'true' end);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check ((select public.is_admin()))', tbl);
    execute format('create policy admin_update on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', tbl);
    execute format('create policy admin_delete on public.%I for delete to authenticated using ((select public.is_admin()))', tbl);
    -- RLS does not protect TRUNCATE. Remove the observed broad legacy privileges.
    execute format('revoke all on public.%I from public, anon, authenticated', tbl);
    execute format('grant select on public.%I to anon', tbl);
    execute format('grant select, insert, update, delete on public.%I to authenticated', tbl);
  end loop;
  foreach tbl in array array['team','kickoff_slot','club_settings'] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('revoke all on public.%I from public, anon, authenticated', tbl);
    execute format('grant select on public.%I to anon', tbl);
    execute format('grant select, insert, update, delete on public.%I to authenticated', tbl);
    execute format('create policy public_read on public.%I for select to anon, authenticated using (true)', tbl);
    execute format('create policy admin_insert on public.%I for insert to authenticated with check ((select public.is_admin()))', tbl);
    execute format('create policy admin_update on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', tbl);
    execute format('create policy admin_delete on public.%I for delete to authenticated using ((select public.is_admin()))', tbl);
  end loop;
end $$;

create function public.sync_match_team_schedule() returns trigger
language plpgsql security invoker set search_path = pg_catalog
as $$
declare resolved public.team%rowtype; local_date timestamp without time zone;
begin
  -- Old admin changes only myTeam: resolve the NEW string, not the OLD teamId.
  if tg_op = 'UPDATE' then
    if new."myTeam" is distinct from old."myTeam" and new."teamId" is not distinct from old."teamId" then
      select * into resolved from public.team where name = new."myTeam";
    else
      select * into resolved from public.team where id = new."teamId";
      if new."myTeam" is distinct from old."myTeam" and new."teamId" is distinct from old."teamId"
         and new."myTeam" is distinct from resolved.name then
        raise exception 'Conflicting teamId and myTeam';
      end if;
    end if;
  elsif new."teamId" is null then
    select * into resolved from public.team where name = new."myTeam";
  else
    select * into resolved from public.team where id = new."teamId";
    if new."myTeam" is not null and new."myTeam" is distinct from resolved.name then
      raise exception 'Conflicting teamId and myTeam';
    end if;
  end if;
  if resolved.id is null then raise exception 'Unknown team; select an existing team'; end if;
  new."teamId" := resolved.id;
  new."myTeam" := resolved.name;
  if new.date is null or not isfinite(new.date) then raise exception 'Valid match date required'; end if;
  local_date := new.date at time zone 'America/Tijuana';
  if not new.schedule_override then
    if extract(dow from local_date) <> resolved.match_weekday then
      raise exception 'Wrong team weekday in America/Tijuana; explicit schedule_override required';
    end if;
    -- Exact time equality rejects nonzero seconds AND fractional seconds.
    if not exists (select 1 from public.kickoff_slot s where s.time = local_date::time) then
      raise exception 'Unauthorized kickoff time; explicit schedule_override required';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.sync_match_team_schedule() from public, anon, authenticated;
create trigger match_team_schedule_before_write
before insert or update of date, "teamId", "myTeam", schedule_override
on public."Match" for each row execute function public.sync_match_team_schedule();

create function public.save_match(p_match jsonb, p_player_ids text[]) returns text
language plpgsql security invoker set search_path = pg_catalog
as $$
declare current_match public."Match"%rowtype; proposed public."Match"%rowtype;
        match_id text; players text[]; key_name text;
begin
  if not public.is_admin() then raise exception 'Administrator required' using errcode = '42501'; end if;
  if p_match is null or jsonb_typeof(p_match) <> 'object' then raise exception 'Match object required'; end if;
  for key_name in select jsonb_object_keys(p_match) loop
    if key_name <> all(array['id','teamId','myTeam','rivalTeam','myPos','rivalPos','date','location','scoreHome','scoreAway','kit','seasonid','schedule_override']) then
      raise exception 'Unsupported match field: %', key_name;
    end if;
  end loop;
  if p_player_ids is null or exists (select 1 from unnest(p_player_ids) p where p is null or btrim(p) = '') then
    raise exception 'Explicit player array required; null/blank player IDs forbidden';
  end if;
  select coalesce(array_agg(distinct p order by p), array[]::text[]) into players from unnest(p_player_ids) p;
  -- Lock referenced rows against deletion; reject every missing ID rather than filtering.
  perform p.id from public."Player" p where p.id = any(players) order by p.id for key share;
  if (select count(*) from public."Player" p where p.id = any(players)) <> cardinality(players) then
    raise exception 'Unknown player in squad';
  end if;
  match_id := p_match ->> 'id';
  if p_match ? 'id' then
    if match_id is null or btrim(match_id) = '' then raise exception 'Existing match ID required'; end if;
    select * into current_match from public."Match" where id = match_id for update;
    if not found then raise exception 'Match not found'; end if;
    -- Populate onto locked row: absent scores (and other fields) retain current values.
    proposed := jsonb_populate_record(current_match, p_match);
    update public."Match" set
      "teamId" = proposed."teamId", "myTeam" = proposed."myTeam",
      "rivalTeam" = proposed."rivalTeam", "myPos" = proposed."myPos", "rivalPos" = proposed."rivalPos",
      date = proposed.date, location = proposed.location,
      "scoreHome" = proposed."scoreHome", "scoreAway" = proposed."scoreAway",
      kit = proposed.kit, seasonid = proposed.seasonid, schedule_override = proposed.schedule_override
    where id = match_id;
  else
    proposed := jsonb_populate_record(null::public."Match", p_match);
    insert into public."Match"("teamId", "myTeam", "rivalTeam", "myPos", "rivalPos", date, location,
                               "scoreHome", "scoreAway", kit, seasonid, schedule_override)
    values (proposed."teamId", proposed."myTeam", proposed."rivalTeam", proposed."myPos", proposed."rivalPos",
      proposed.date, proposed.location,
      case when p_match ? 'scoreHome' then proposed."scoreHome" else 0 end,
      case when p_match ? 'scoreAway' then proposed."scoreAway" else 0 end,
      case when p_match ? 'kit' then proposed.kit else 1 end, proposed.seasonid,
      case when p_match ? 'schedule_override' then proposed.schedule_override else false end)
    returning id into match_id;
  end if;
  delete from public."MatchSquad" where "matchId" = match_id;
  insert into public."MatchSquad"("matchId", "playerId") select match_id, p from unnest(players) p;
  return match_id;
end $$;
revoke all on function public.save_match(jsonb, text[]) from public, anon, authenticated;
grant execute on function public.save_match(jsonb, text[]) to authenticated;

create function public.create_event_with_payments(p_name text, p_cost numeric, p_date timestamptz, p_season_id text)
returns text language plpgsql security invoker set search_path = pg_catalog
as $$ declare event_id text; begin
  if not public.is_admin() then raise exception 'Administrator required' using errcode = '42501'; end if;
  if p_name is null or btrim(p_name) = '' or p_cost is null or p_cost < 0
     or p_cost >= 'Infinity'::numeric or p_cost = 'NaN'::numeric
     or p_date is null or not isfinite(p_date) or p_season_id is null or btrim(p_season_id) = '' then
    raise exception 'Valid event name, finite nonnegative cost, date and season required';
  end if;
  insert into public."Event"(name, cost, date, seasonid)
  values (btrim(p_name), p_cost, p_date, p_season_id) returning id into event_id;
  insert into public."Payment"("playerId", "eventId", paid)
  select id, event_id, false from public."Player" where active;
  return event_id;
end $$;
revoke all on function public.create_event_with_payments(text, numeric, timestamptz, text) from public, anon, authenticated;
grant execute on function public.create_event_with_payments(text, numeric, timestamptz, text) to authenticated;

create view public.v_match with (security_invoker = true) as
select m.*, t.slug as team_slug, t.name as team_name,
       m.date at time zone 'America/Tijuana' as kickoff_local,
       extract(dow from m.date at time zone 'America/Tijuana')::integer as kickoff_weekday,
       to_char(m.date at time zone 'America/Tijuana','HH24:MI') as kickoff_slot
from public."Match" m join public.team t on t.id = m."teamId";
-- Scores mean Nosotros/Rival (not venue); no completion status exists.
create view public.v_team_season_stats with (security_invoker = true) as
select "teamId" as team_id, seasonid as season_id, count(*) as played,
       count(*) filter (where "scoreHome" > "scoreAway") as wins,
       count(*) filter (where "scoreHome" = "scoreAway") as draws,
       count(*) filter (where "scoreHome" < "scoreAway") as losses,
       sum("scoreHome") as goals_for, sum("scoreAway") as goals_against
from public."Match" where date < now() group by "teamId", seasonid;
create view public.v_team_season_monthly with (security_invoker = true) as
select "teamId" as team_id, seasonid as season_id,
       to_char(date at time zone 'America/Tijuana','YYYY-MM') as month,
       sum("scoreHome") as scored, sum("scoreAway") as conceded
from public."Match" where date < now() group by "teamId", seasonid, to_char(date at time zone 'America/Tijuana','YYYY-MM');
create view public.v_player_stats with (security_invoker = true) as
with callups as (
  select s."playerId" as player_id, m."teamId" as team_id, m.seasonid as season_id, count(*) as call_ups
  from public."MatchSquad" s join public."Match" m on m.id = s."matchId"
  group by s."playerId", m."teamId", m.seasonid
), goals as (
  select g."playerId" as player_id, m."teamId" as team_id, m.seasonid as season_id, count(*) as goals
  from public."Goal" g join public."Match" m on m.id = g."matchId"
  group by g."playerId", m."teamId", m.seasonid
)
select coalesce(c.player_id,g.player_id) as player_id, coalesce(c.team_id,g.team_id) as team_id,
       coalesce(c.season_id,g.season_id) as season_id, coalesce(c.call_ups,0::bigint) as call_ups,
       coalesce(g.goals,0::bigint) as goals
from callups c full join goals g on c.player_id = g.player_id and c.team_id = g.team_id and c.season_id = g.season_id;

-- Intentional, narrowly scoped public projection, independent of financial table RLS.
-- No arguments, dynamic SQL, identifiers, payment IDs or bank details are exposed.
create function public.get_public_player_debts()
returns table(id text, name text, dorsal integer, total_debt numeric, events jsonb)
language sql stable security definer set search_path = pg_catalog
as $$
  select p.id, p.name, p.dorsal, sum(e.cost::numeric) as total_debt,
    jsonb_agg(jsonb_build_object('name', e.name, 'date', e.date, 'cost', e.cost)
              order by e.date, e.name, e.id) as events
  from public."Player" p join public."Payment" pay on pay."playerId" = p.id
  join public."Event" e on e.id = pay."eventId"
  where p.active and not pay.paid group by p.id, p.name, p.dorsal
$$;
revoke all on function public.get_public_player_debts() from public, anon, authenticated;
grant execute on function public.get_public_player_debts() to anon, authenticated;
create view public.v_player_debt with (security_invoker = true) as
select id, name, dorsal, total_debt, events from public.get_public_player_debts();
revoke all on public.v_match, public.v_team_season_stats, public.v_team_season_monthly,
              public.v_player_stats, public.v_player_debt from public, anon, authenticated;
grant select on public.v_match, public.v_team_season_stats, public.v_team_season_monthly,
                public.v_player_stats, public.v_player_debt to anon, authenticated;
commit;
