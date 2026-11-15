-- PIXEL PERFECT – admin activity over time (run once after 0001 + 0002).
-- Dashboard → SQL Editor → paste → Run. Safe to re-run; no data is changed.
--
-- Feeds the dashboard's date-range selector and "פעילות שחקנים לאורך זמן" chart:
--   admin_activity(24)  → last 24 hours, one point per hour
--   admin_activity(168) → last 7 days,   one point per day
--   admin_activity(720) → last 30 days,  one point per day
-- Buckets follow the given time zone (default Israel), so days start at local midnight.
--
-- Returns json:
--   active : players seen in the range (same definition as admin_overview.active_24h)
--   unit   : 'hour' | 'day'
--   series : [{ t: bucket start, players: distinct players with gameplay events in the bucket }]
-- Read-only; admins only.

create or replace function public.admin_activity(p_hours integer default 24, p_tz text default 'Asia/Jerusalem')
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_unit    text;
  v_step    interval;
  v_buckets integer;
  v_last    timestamp;  -- start of the current bucket, local time
begin
  if not public.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  if p_hours is null or p_hours not in (24, 168, 720) then
    raise exception 'invalid range %', p_hours using errcode = '22023';
  end if;
  if p_tz is null or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz) then
    raise exception 'invalid time zone %', p_tz using errcode = '22023';
  end if;

  v_unit    := case when p_hours = 24 then 'hour' else 'day' end;
  v_step    := case when p_hours = 24 then interval '1 hour' else interval '1 day' end;
  v_buckets := case when p_hours = 24 then 24 else p_hours / 24 end;
  v_last    := date_trunc(v_unit, now() at time zone p_tz);

  return json_build_object(
    'active', (select count(*) from public.players p
                where p.last_seen_at > now() - make_interval(hours => p_hours)),
    'unit',   v_unit,
    'series', coalesce((
      select json_agg(json_build_object('t', s.t0, 'players', s.n) order by s.t0)
        from (
          select (b at time zone p_tz) as t0,
                 (select count(distinct e.user_id)
                    from public.player_events e
                   where e.created_at >= (b at time zone p_tz)
                     and e.created_at <  ((b + v_step) at time zone p_tz)) as n
            from generate_series(v_last - (v_buckets - 1) * v_step, v_last, v_step) as b
        ) s
    ), '[]'::json)
  );
end;
$$;

revoke all on function public.admin_activity(integer, text) from public, anon;
grant execute on function public.admin_activity(integer, text) to authenticated;
