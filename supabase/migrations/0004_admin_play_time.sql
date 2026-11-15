-- PIXEL PERFECT – admin average play time (run once after 0001–0003).
-- Dashboard → SQL Editor → paste → Run. Safe to re-run; no data is changed.
--
-- Feeds "זמן משחק ממוצע" in the dashboard's "סיכום ביצועים" card:
-- for every finished game, the time from the play's start (the player's last
-- 'game_started' before their 'game_completed') to the finish. Runs longer than
-- 6 hours (tab left open) are ignored.
--
-- Returns json: { avg_seconds: number | null, players: number }
-- Read-only; admins only.

create index if not exists player_events_user_type_time_idx
  on public.player_events (user_id, event_type, created_at);

create or replace function public.admin_play_time()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;

  return (
    select json_build_object(
      'avg_seconds', round(avg(extract(epoch from (c.created_at - s.started))))::integer,
      'players',     count(*)
    )
      from public.player_events c
      cross join lateral (
        select max(e.created_at) as started
          from public.player_events e
         where e.user_id = c.user_id
           and e.event_type = 'game_started'
           and e.created_at <= c.created_at
      ) s
     where c.event_type = 'game_completed'
       and s.started is not null
       and c.created_at - s.started < interval '6 hours'
  );
end;
$$;

revoke all on function public.admin_play_time() from public, anon;
grant execute on function public.admin_play_time() to authenticated;
