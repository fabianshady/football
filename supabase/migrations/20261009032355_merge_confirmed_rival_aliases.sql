begin;
lock table public.rival, public."Match" in share row exclusive mode;
do $$
declare pair record; source_id text; target_id text;
begin
  for pair in select * from (values
    ('AE Trucking','AE Trucking FC'),
    ('C.M.T FC','CMT FC'),
    ('Union Real','Union Real FC')
  ) as approved(source_name,target_name) loop
    select id into source_id from public.rival where name = pair.source_name;
    select id into target_id from public.rival where name = pair.target_name;
    if source_id is null or target_id is null or source_id = target_id then
      raise exception 'Confirmed rival pair drift: % / %', pair.source_name, pair.target_name;
    end if;
    update public."Match" set "rivalId" = target_id, "rivalTeam" = pair.target_name where "rivalId" = source_id;
    delete from public.rival where id = source_id;
  end loop;
end $$;
-- Only these aliases have been explicitly confirmed by the club owner.
-- Resolve future legacy name-only writes to the surviving rival, without fuzzy matching.
create or replace function public.normalize_rival_name(p_name text) returns text
language sql immutable strict security invoker set search_path = pg_catalog as $$
  select case normalized
    when 'ae trucking' then 'ae trucking fc'
    when 'c.m.t fc' then 'cmt fc'
    when 'union real' then 'union real fc'
    else normalized end
  from (select lower(btrim(regexp_replace(p_name, '[[:space:]]+', ' ', 'g'))) as normalized) as input
$$;
commit;
