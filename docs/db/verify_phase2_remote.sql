-- Rollback-only verification after phase2_players_rivals_goals; migration owner.
-- No DDL, persisted fixtures, real goals, memberships, or match edits.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
select set_config('request.jwt.claim.sub', (select user_id::text from private.admin_users order by user_id limit 1), true);
set local role authenticated;
do $$
declare p text; q text; outsider text; m text; m2 text; t text; v_season_id text; r text;
  g text; own_id text; unknown_id text; squad_id text; row_player public."Player"%rowtype;
  row_match public."Match"%rowtype; denied boolean;
begin
  if not public.is_admin() then raise exception 'Admin fixture unavailable'; end if;
  select id into t from public.team order by slug limit 1;
  select id into v_season_id from public.season order by startdate desc limit 1;
  p := public.save_player(jsonb_build_object('name','__phase2_verify_' || gen_random_uuid(),
    'dorsal',99,'active',false,'primary_position','WB','secondary_positions',array['CM'],'preferred_side','R'),array[t,t]);
  q := public.save_player(jsonb_build_object('name','__phase2_verify_' || gen_random_uuid(),
    'dorsal',98,'active',false,'positions',array['Lateral (L)','Delantero']));
  outsider := public.save_player(jsonb_build_object('name','__phase2_verify_' || gen_random_uuid(),
    'dorsal',97,'active',false));
  select * into row_player from public."Player" where id=q;
  if row_player.primary_position <> 'WB' or row_player.secondary_positions <> array['ST']
    or row_player.preferred_side <> 'L' then raise exception 'Legacy WB mapping failed'; end if;
  if (select count(*) from public.player_team where player_id=p) <> 1 then raise exception 'Membership dedup failed'; end if;
  perform public.save_player(jsonb_build_object('id',p,'nickname','Verify','foot','BOTH'));
  select * into row_player from public."Player" where id=p;
  if row_player.active or row_player.foot <> 'BOTH' or row_player.positions <> array['Lateral (R)','Mediocentro']
    or (select count(*) from public.player_team where player_id=p) <> 1 then raise exception 'Omitted fields/membership failed'; end if;
  denied := false;
  begin perform public.save_player(jsonb_build_object('id',p,'nickname','Lost'),array['__missing_' || gen_random_uuid()]);
  exception when others then if sqlerrm not like 'Unknown membership team%' then raise; end if; denied:=true; end;
  if not denied or (select nickname from public."Player" where id=p) <> 'Verify' then raise exception 'Membership atomic failure failed'; end if;
  perform public.save_player(jsonb_build_object('id',p),array[]::text[]);
  if exists(select 1 from public.player_team where player_id=p) then raise exception 'Explicit membership clear failed'; end if;
  perform public.save_player(jsonb_build_object('id',p,'primary_position','DM','secondary_positions',array['WB'],'preferred_side','C'),array[t]);
  if (select positions from public."Player" where id=p) <> array['Mediocentro defensivo','Lateral (C)'] then raise exception 'Structured sync failed'; end if;
  update public."Player" set positions=array['Lateral (L)','Portero'] where id=p;
  select * into row_player from public."Player" where id=p;
  if row_player.primary_position <> 'WB' or row_player.secondary_positions <> array['GK'] or row_player.preferred_side <> 'L' then
    raise exception 'Legacy update sync failed'; end if;
  denied:=false;
  begin delete from public."Player" where id=p;
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Player DELETE privilege survived'; end if;
  denied:=false;
  begin update public."Player" set dorsal=100 where id=p;
  exception when check_violation then denied:=true; end;
  if not denied then raise exception 'Dorsal check failed'; end if;

  -- Typed ID-only match create through RPC; ephemeral rival uses an existing ID.
  select id into r from public.rival order by slug limit 1;
  m:=public.save_match(jsonb_build_object('teamId',t,'rivalId',r,'myPos',1,'rivalPos',2,
    'date','2026-01-01T12:00:00Z','location','__phase2_verify','scoreHome',3,'scoreAway',1,
    'seasonid',v_season_id,'schedule_override',true),array[p,q,q]);
  m2:=public.save_match(jsonb_build_object('teamId',t,'rivalTeam',' __phase2_rival_' || gen_random_uuid() || ' ',
    'myPos',1,'rivalPos',2,'date','2026-01-01T12:00:00Z','location','__phase2_verify',
    'scoreHome',2,'seasonid',v_season_id,'schedule_override',true),array[q]);
  update public."Match" set "rivalTeam"=' __phase2_legacy_' || gen_random_uuid() || '  FC ' where id=m2;
  if not exists(select 1 from public."Match" mm join public.rival rr on rr.id=mm."rivalId"
    where mm.id=m2 and mm."rivalTeam"=rr.name) then raise exception 'Legacy rival update failed'; end if;
  perform public.save_match(jsonb_build_object('id',m2,'rivalId',r),array[q]);
  if (select "rivalId" from public."Match" where id=m2) <> r then raise exception 'Rival ID update failed'; end if;
  denied:=false;
  begin perform public.save_match(jsonb_build_object('id',m2,'rivalTeam','   '),array[q]);
  exception when others then if sqlerrm not like 'Nonblank rival name required%' then raise; end if; denied:=true; end;
  if not denied then raise exception 'Blank rival accepted'; end if;

  g:=public.add_goal(m,p);
  own_id:=public.add_goal(m,null,'own_goal',120);
  unknown_id:=public.add_goal(m,null,'unknown',0);
  if (select count(*) from public."Goal" where "matchId"=m) <> 3 then raise exception 'Goal kinds failed'; end if;
  if exists(select 1 from public.v_player_stats where player_id is null) then raise exception 'Null stats group'; end if;
  if (select goals from public.v_player_stats where player_id=p and team_id=t and season_id=v_season_id) <> 1 then
    raise exception 'Own/unknown credited to player'; end if;
  denied:=false;
  begin insert into public."Goal"("matchId",kind) values(m,'unknown');
  exception when others then if sqlerrm not like 'Recorded goals exceed scoreHome%' then raise; end if; denied:=true; end;
  if not denied then raise exception 'Direct overflow accepted'; end if;
  denied:=false;
  begin update public."Goal" set minute=121 where id=g;
  exception when check_violation then denied:=true; end;
  if not denied then raise exception 'Minute range failed'; end if;
  denied:=false;
  begin update public."Goal" set "playerId"=outsider where id=g;
  exception when others then if sqlerrm not like 'Scorer must belong to match squad%' then raise; end if; denied:=true; end;
  if not denied then raise exception 'Outside-squad update accepted'; end if;
  denied:=false;
  begin update public."Match" set "scoreHome"=2 where id=m;
  exception when others then if sqlerrm not like 'scoreHome cannot be below recorded goal count%' then raise; end if; denied:=true; end;
  if not denied then raise exception 'Score decrement accepted'; end if;
  denied:=false;
  begin update public."Match" set "scoreAway"=-1 where id=m;
  exception when check_violation then denied:=true; end;
  if not denied then raise exception 'Negative score accepted'; end if;
  denied:=false;
  begin delete from public."MatchSquad" where "matchId"=m and "playerId"=p;
  exception when others then if sqlerrm not like 'Cannot remove a recorded scorer%' then raise; end if; denied:=true; end;
  if not denied then raise exception 'Scorer deletion accepted'; end if;
  select id into squad_id from public."MatchSquad" where "matchId"=m and "playerId"=p;
  perform public.save_match(jsonb_build_object('id',m,'location','__phase2_changed'),array[p,q]);
  if not exists(select 1 from public."MatchSquad" where id=squad_id) then raise exception 'Retained squad row replaced'; end if;
  denied:=false;
  begin perform public.save_match(jsonb_build_object('id',m,'location','Lost'),array[q]);
  exception when others then if sqlerrm not like 'Cannot remove a recorded scorer%' then raise; end if; denied:=true; end;
  if not denied or (select location from public."Match" where id=m) <> '__phase2_changed' then raise exception 'Scorer RPC rollback failed'; end if;
  perform public.remove_goal(unknown_id);
  denied:=false;
  begin perform public.add_goal(m,null,'player');
  exception when others then if sqlerrm not like 'Scorer must belong to match squad%' then raise; end if; denied:=true; end;
  if not denied then raise exception 'Null player goal accepted'; end if;
  denied:=false;
  begin perform public.add_goal(m,p,'own_goal');
  exception when check_violation then denied:=true; end;
  if not denied then raise exception 'Own goal with player accepted'; end if;
  denied:=false;
  begin perform public.add_goal(m,outsider);
  exception when others then if sqlerrm not like 'Scorer must belong to match squad%' then raise; end if; denied:=true; end;
  if not denied then raise exception 'Outside-squad insert accepted'; end if;
  insert into public."Goal"("matchId",kind) values(m,'unknown');
  if not exists(select 1 from public.v_match where id=m and rival_id=r and rival_slug is not null and rival_name is not null) then
    raise exception 'v_match rival contract failed'; end if;
  if not exists(select 1 from public.v_head_to_head where team_id=t and rival_id=r and played>=2) then
    raise exception 'Head-to-head contract failed'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
set local role authenticated;
do $$ declare denied boolean; changed integer; begin
  if public.is_admin() then raise exception 'Nonadmin unexpectedly admin'; end if;
  perform count(*) from public."Player";
  perform count(*) from public.rival;
  perform count(*) from public.player_team;
  perform count(*) from public.v_match;
  perform count(*) from public.v_head_to_head;
  denied:=false;
  begin perform public.save_player('{"name":"No","dorsal":99}');
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Nonadmin RPC allowed'; end if;
  denied:=false;
  begin perform public.add_goal('__missing',null,'unknown');
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Nonadmin goal RPC allowed'; end if;
  denied:=false;
  begin insert into public.rival(name,slug) values('__nonadmin','__nonadmin');
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Nonadmin rival write allowed'; end if;
  update public."Player" set nickname='__nonadmin';
  get diagnostics changed = row_count;
  if changed<>0 then raise exception 'Nonadmin player UPDATE changed rows'; end if;
end $$;
reset role;
set local role anon;
do $$ declare denied boolean; begin
  perform count(*) from public."Player";
  perform count(*) from public."Goal";
  perform count(*) from public.rival;
  perform count(*) from public.player_team;
  perform count(*) from public.v_match;
  perform count(*) from public.v_head_to_head;
  perform count(*) from public.v_player_debt;
  denied:=false;
  begin perform public.add_goal('__missing',null,'unknown');
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Anon RPC allowed'; end if;
  denied:=false;
  begin insert into public."Goal"("matchId",kind) values('__missing','unknown');
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Anon goal write allowed'; end if;
  denied:=false;
  begin perform count(*) from public."Payment";
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Anon raw financial access allowed'; end if;
end $$;
reset role;
select 'phase2 rollback-only admin/nonadmin/anon verification passed' as result;
rollback;
