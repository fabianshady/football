-- Parent runs AFTER migration, ideally on a restored local/staging database first.
-- Entire script is rolled back. Run as postgres; stop on errors (psql -v ON_ERROR_STOP=1).
begin;
-- Deliberately fail after Event insertion to verify cross-table rollback.
-- Trigger/function and fixtures disappear with the final ROLLBACK.
create function pg_temp.reject_verification_payment() returns trigger
language plpgsql security invoker set search_path = pg_catalog as $$ begin
  if exists (select 1 from public."Event" where id=new."eventId" and name='Forced payment failure') then
    raise exception 'Verification-only payment rejection';
  end if;
  return new;
end $$;
create trigger verification_payment_rejection before insert on public."Payment"
for each row execute function pg_temp.reject_verification_payment();
select set_config('request.jwt.claim.sub', user_id::text, true),
       set_config('request.jwt.claims', jsonb_build_object('sub',user_id,'role','authenticated')::text, true)
from private.admin_users limit 1;
set local role authenticated;
do $$
declare t public.team%rowtype; sid text; pid text; mid text; eid text; payload jsonb;
        rejected boolean; before_score integer; before_squad text[]; failed_date timestamptz;
begin
  if not public.is_admin() then raise exception 'Admin seed/auth claims failed'; end if;
  select * into strict t from public.team where name = 'ITJAGUARS FC';
  select id into strict sid from public.season order by startdate desc limit 1;
  select id into strict pid from public."Player" where active order by id limit 1;
  payload := jsonb_build_object('teamId',t.id,'rivalTeam','Migration verification',
    'myPos',1,'rivalPos',2,'date','2026-01-07T02:50:00Z','location','Verification',
    'kit',1,'seasonid',sid,'scoreHome',3,'scoreAway',1,'schedule_override',false);
  mid := public.save_match(payload, array[pid,pid]);
  if (select count(*) from public."MatchSquad" where "matchId"=mid) <> 1 then
    raise exception 'Squad deduplication failed'; end if;
  perform public.save_match((payload - 'scoreHome' - 'scoreAway') || jsonb_build_object('id',mid), array[pid]);
  if (select "scoreHome" from public."Match" where id=mid) <> 3 then
    raise exception 'Omitted scores were not preserved'; end if;
  select "scoreHome" into before_score from public."Match" where id=mid;
  select array_agg("playerId" order by "playerId") into before_squad from public."MatchSquad" where "matchId"=mid;
  rejected := false;
  begin
    perform public.save_match(payload || jsonb_build_object('id',mid,'scoreHome',99), array[pid,'__unknown_verification_player__']);
  exception when others then rejected := true; end;
  if not rejected or (select "scoreHome" from public."Match" where id=mid) <> before_score
     or (select array_agg("playerId" order by "playerId") from public."MatchSquad" where "matchId"=mid) is distinct from before_squad then
    raise exception 'Invalid squad was accepted or left partial writes'; end if;
  foreach failed_date in array array[
    '2026-01-07T02:50:01Z'::timestamptz, -- nonzero seconds
    '2026-01-07T02:50:00.001Z'::timestamptz, -- fractional seconds
    '2026-01-07T02:51:00Z'::timestamptz, -- unauthorized minute
    '2026-01-08T02:50:00Z'::timestamptz -- wrong local weekday
  ] loop
    rejected := false;
    begin perform public.save_match(payload || jsonb_build_object('date',failed_date), array[pid]);
    exception when others then rejected := true; end;
    if not rejected then raise exception 'Invalid schedule accepted: %',failed_date; end if;
  end loop;
  perform public.save_match(payload || jsonb_build_object('date','2026-07-08T01:50:00Z'), array[pid]);
  perform public.save_match(payload || jsonb_build_object('date','2026-01-08T02:51:01Z','schedule_override',true), array[]::text[]);
  rejected := false;
  begin
    perform public.save_match(payload || jsonb_build_object('teamId','__unknown_team__','schedule_override',true), array[pid]);
  exception when others then rejected := true; end;
  if not rejected then raise exception 'Override accepted unknown team'; end if;
  -- Old-admin string-only update resolves NEW name, not old teamId.
  update public."Match" set "myTeam"='ITJ FC', date='2026-01-08T02:50:00Z' where id=mid;
  if (select m."teamId" from public."Match" m where id=mid) <>
     (select id from public.team where name='ITJ FC') then raise exception 'Legacy team update failed'; end if;
  rejected := false;
  begin update public."Match" set "myTeam"='Unknown legacy team' where id=mid;
  exception when others then rejected := true; end;
  if not rejected then raise exception 'Unknown legacy team accepted'; end if;
  eid := public.create_event_with_payments('Migration verification',120,now(),sid);
  if (select count(*) from public."Payment" where "eventId"=eid) <>
     (select count(*) from public."Player" where active) then raise exception 'Active payments incomplete'; end if;
  rejected := false;
  begin perform public.create_event_with_payments('Invalid verification event',120,now(),'__unknown_season__');
  exception when others then rejected := true; end;
  if not rejected or exists (select 1 from public."Event" where name='Invalid verification event') then
    raise exception 'Invalid event accepted or left partial writes'; end if;
  rejected := false;
  begin perform public.create_event_with_payments('Forced payment failure',120,now(),sid);
  exception when others then rejected := true; end;
  if not rejected or exists (select 1 from public."Event" where name='Forced payment failure') then
    raise exception 'Payment failure did not roll back Event'; end if;
end $$;
reset role;

-- A nonmember may read sports, but not finances or write through either RPC.
select set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
set local role authenticated;
do $$ declare rejected boolean := false; begin
  if public.is_admin() then raise exception 'Nonmember is admin'; end if;
  perform id from public."Match" limit 1;
  if exists (select 1 from public."Event") or exists (select 1 from public."Payment") then
    raise exception 'Authenticated nonadmin can read raw financial rows'; end if;
  begin perform public.save_match('{}',array[]::text[]);
  exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'Nonadmin save permitted'; end if;
  rejected := false;
  begin perform public.create_event_with_payments('Rejected',0,now(),'invalid');
  exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'Nonadmin event create permitted'; end if;
end $$;
reset role;
set local role anon;
select * from public.v_match limit 1;
select * from public.v_team_season_stats limit 1;
select * from public.v_team_season_monthly limit 1;
select * from public.v_player_stats limit 1;
select * from public.v_player_debt limit 1;
do $$ begin
  if has_function_privilege(current_user,'public.is_admin()','execute')
     or has_function_privilege(current_user,'public.save_match(jsonb,text[])','execute')
     or has_function_privilege(current_user,'public.create_event_with_payments(text,numeric,timestamptz,text)','execute')
     or has_schema_privilege(current_user,'private','usage') then
    raise exception 'Anonymous privileged access'; end if;
end $$;
reset role;
rollback;

-- Read-only checks (safe both before and after the manual financial lockdown).
select schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_policies where schemaname in ('public','private') order by tablename,policyname;
select m.id from public."Match" m join public.team t on t.id=m."teamId"
where m."myTeam" <> t.name or (not m.schedule_override and (
  extract(dow from m.date at time zone 'America/Tijuana') <> t.match_weekday
  or not exists (select 1 from public.kickoff_slot s where s.time=(m.date at time zone 'America/Tijuana')::time)));
select 'squad' as source,"matchId" as parent,"playerId",count(*) from public."MatchSquad"
group by "matchId","playerId" having count(*)>1
union all
select 'payment',"eventId","playerId",count(*) from public."Payment"
group by "eventId","playerId" having count(*)>1;
