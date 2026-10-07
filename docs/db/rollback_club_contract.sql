-- MANUAL DESTRUCTIVE SCHEMA ROLLBACK. Revert both apps and export new contract data first.
-- Drops added schema only; keeps every legacy entity, squad/payment and edited myTeam/date.
-- Does NOT undo data writes since rollout or restore historic names/settings automatically.
begin;
drop view public.v_player_debt, public.v_player_stats, public.v_team_season_monthly,
          public.v_team_season_stats, public.v_match;
drop function public.get_public_player_debts();
drop function public.save_match(jsonb,text[]);
drop function public.create_event_with_payments(text,numeric,timestamptz,text);
drop trigger match_team_schedule_before_write on public."Match";
drop function public.sync_match_team_schedule();
do $$ declare tbl text; public_policy text; old_admin text :=
  '(auth.jwt() ->> ''email''::text) = ANY (ARRAY[''fabianmendoza.py@gmail.com''::text, ''test@test.com''::text])';
begin
  foreach tbl in array array['Event','Goal','Match','MatchSquad','Payment','Player','season'] loop
    execute format('drop policy authenticated_read on public.%I',tbl);
    execute format('drop policy admin_insert on public.%I',tbl);
    execute format('drop policy admin_update on public.%I',tbl);
    execute format('drop policy admin_delete on public.%I',tbl);
    execute format('create policy "Solo Admin" on public.%I for all to authenticated using (%s) with check (%s)',tbl,old_admin,old_admin);
    execute format('create policy test on public.%I for select to authenticated using (true)',tbl);
    -- Restore the original anon policy if deferred lockdown has already removed it.
    public_policy := case tbl
      when 'Event' then 'La raza puede ver los eventos' when 'Goal' then 'La raza puede ver los goles'
      when 'Match' then 'La raza puede ver los partidos' when 'MatchSquad' then 'La raza puede ver las alineaciones'
      when 'Payment' then 'La raza puede ver los pagos' when 'Player' then 'La raza puede ver a los jugadores'
      else 'La raza puede ver las seasons' end;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=tbl and policyname=public_policy) then
      execute format('create policy %I on public.%I for select to anon using (true)',public_policy,tbl);
    end if;
    execute format('grant all on public.%I to anon, authenticated',tbl);
    execute format('alter table public.%I alter column id drop default',tbl);
  end loop;
end $$;
drop index public.idx_goal_match, public.idx_goal_player, public.idx_squad_player,
           public.idx_payment_event, public.idx_match_team_season_date;
alter table public."Match" drop column "teamId", drop column schedule_override;
drop table public.club_settings, public.kickoff_slot, public.team;
drop function public.is_admin();
drop table private.admin_users;
-- Do not drop private schema: other parent-owned objects may have been added.
commit;
