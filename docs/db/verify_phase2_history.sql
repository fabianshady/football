-- Supplemental rollback-only historical compatibility/FK/RLS checks; owner role.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$ declare p text; m text; denied boolean; begin
  select "playerId","matchId" into p,m from public."Goal" order by id limit 1;
  denied:=false;
  begin delete from public."Player" where id=p;
  exception when foreign_key_violation then denied:=true; end;
  if not denied then raise exception 'Player history FK did not protect delete'; end if;
  denied:=false;
  begin delete from public."Match" where id=m;
  exception when foreign_key_violation then denied:=true; end;
  if not denied then raise exception 'Match history FK did not protect delete'; end if;
end $$;
select set_config('request.jwt.claim.sub',(select user_id::text from private.admin_users order by user_id limit 1),true);
set local role authenticated;
do $$ declare m text; players text[]; before_ids text[]; after_ids text[];
  before_home integer; before_away integer; inactive_id text; occupied integer; denied boolean; begin
  select "matchId" into m from public."Goal" order by id limit 1;
  select array_agg("playerId" order by "playerId"),array_agg(id order by id)
    into players,before_ids from public."MatchSquad" where "matchId"=m;
  select "scoreHome","scoreAway" into before_home,before_away from public."Match" where id=m;
  perform public.save_match(jsonb_build_object('id',m),players);
  select array_agg(id order by id) into after_ids from public."MatchSquad" where "matchId"=m;
  if before_ids is distinct from after_ids or not exists(select 1 from public."Match"
    where id=m and "scoreHome"=before_home and "scoreAway"=before_away) then
    raise exception 'Existing historical save_match changed scores/squad IDs'; end if;
  select id into inactive_id from public."Player" where not active order by name limit 1;
  select dorsal into occupied from public."Player" where active order by dorsal limit 1;
  denied:=false;
  begin perform public.save_player(jsonb_build_object('id',inactive_id,'active',true,'dorsal',occupied));
  exception when unique_violation then denied:=true; end;
  if not denied then raise exception 'Active dorsal reactivation accepted'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
set local role authenticated;
do $$ declare denied boolean; m text; begin
  select mm.id into m from public."Match" mm where mm."scoreHome">
    (select count(*) from public."Goal" g where g."matchId"=mm.id) order by mm.id limit 1;
  if m is null then raise exception 'Under-cap fixture unavailable'; end if;
  -- An over-cap choice would fail in BEFORE trigger before RLS is evaluated.
  denied:=false;
  begin insert into public."Goal"("matchId",kind) values(m,'unknown');
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Nonadmin direct Goal insert allowed'; end if;
end $$;
reset role;
select 'historical save_match, restrictive deletes, reactivation, nonadmin direct Goal checks passed; all rolled back' result;
rollback;
