-- PIXEL PERFECT – anonymous player analytics
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.
--
-- Design
--  * Every visitor is an anonymous Supabase Auth user; auth.uid() is the player id.
--  * Clients never write tables directly: all writes go through track_event()
--    (SECURITY DEFINER), which validates input and derives the aggregates, so a
--    player can only ever record events for themselves and cannot fake totals.
--  * Clients can read only their own rows. Admins (listed in public.admins, never
--    anonymous) can read everything and call the admin_* reporting functions.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.players (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  display_name           text        not null,          -- friendly label, e.g. "Player 4821" (not unique)
  first_seen_at          timestamptz not null default now(),
  last_seen_at           timestamptz not null default now(),
  games_started          integer     not null default 0, -- times PLAY was pressed
  current_level          integer     not null default 0, -- furthest numbered level reached (0 = none yet)
  completed_levels_count integer     not null default 0, -- distinct numbered levels completed
  game_completed         boolean     not null default false,
  game_completed_at      timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table if not exists public.player_events (
  id         bigint generated always as identity primary key,
  user_id    uuid        not null references public.players (user_id) on delete cascade,
  event_type text        not null
             check (event_type in ('game_started', 'level_started', 'level_completed', 'game_completed')),
  level_id   integer     check (level_id between 1 and 100),  -- numbered level; null for game events
  created_at timestamptz not null default now(),
  check ((event_type in ('level_started', 'level_completed')) = (level_id is not null))
);

-- Level history: the FIRST time a player started / completed each level, and
-- the first game completion. Refreshes and replays never add duplicates.
-- (game_started is a plain log: one row per play.)
create unique index if not exists player_events_first_time
  on public.player_events (user_id, event_type, coalesce(level_id, 0))
  where event_type in ('level_started', 'level_completed', 'game_completed');

create index if not exists player_events_created_at on public.player_events (created_at desc);
create index if not exists player_events_level      on public.player_events (event_type, level_id);
create index if not exists players_last_seen        on public.players (last_seen_at desc);

-- Administrators: add rows only from the SQL editor (see setup guide).
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Admin check
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
     and exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.players       enable row level security;
alter table public.player_events enable row level security;
alter table public.admins        enable row level security;  -- no policies: invisible to clients

drop policy if exists "players: read own"       on public.players;
drop policy if exists "players: admin read"     on public.players;
drop policy if exists "events: read own"        on public.player_events;
drop policy if exists "events: admin read"      on public.player_events;

create policy "players: read own"   on public.players       for select to authenticated using (user_id = (select auth.uid()));
create policy "players: admin read" on public.players       for select to authenticated using ((select public.is_admin()));
create policy "events: read own"    on public.player_events for select to authenticated using (user_id = (select auth.uid()));
create policy "events: admin read"  on public.player_events for select to authenticated using ((select public.is_admin()));
-- No insert / update / delete policies: writes only through track_event().

-- ---------------------------------------------------------------------------
-- The one write path for players
-- ---------------------------------------------------------------------------

create or replace function public.track_event(p_event text, p_level integer default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if p_event not in ('visit', 'game_started', 'level_started', 'level_completed', 'game_completed') then
    raise exception 'unknown event %', p_event using errcode = '22023';
  end if;
  if p_event in ('level_started', 'level_completed') and (p_level is null or p_level not between 1 and 100) then
    raise exception 'invalid level %', p_level using errcode = '22023';
  end if;

  -- first visit creates the player; every call refreshes last activity
  insert into public.players (user_id, display_name)
  values (uid, 'Player ' || (abs(hashtext(uid::text)) % 9000 + 1000))
  on conflict (user_id) do update set last_seen_at = now(), updated_at = now();

  if p_event = 'visit' then
    return;
  end if;

  if p_event = 'game_started' then
    insert into public.player_events (user_id, event_type) values (uid, 'game_started');
    update public.players set games_started = games_started + 1 where user_id = uid;
    return;
  end if;

  insert into public.player_events (user_id, event_type, level_id)
  values (uid, p_event, case when p_event = 'game_completed' then null else p_level end)
  on conflict do nothing;  -- first time only

  if p_event = 'level_started' then
    update public.players
       set current_level = greatest(current_level, p_level)
     where user_id = uid;
  elsif p_event = 'level_completed' then
    update public.players
       set current_level = greatest(current_level, p_level),
           completed_levels_count = (
             select count(*) from public.player_events e
              where e.user_id = uid and e.event_type = 'level_completed')
     where user_id = uid;
  else -- game_completed
    update public.players
       set game_completed = true,
           game_completed_at = coalesce(game_completed_at, now())
     where user_id = uid;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin reporting (refuse anyone who is not an admin)
-- ---------------------------------------------------------------------------

create or replace function public.admin_overview()
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
  return json_build_object(
    'total_players',           (select count(*) from public.players),
    'players_started',         (select count(*) from public.players where games_started > 0),
    'players_completed',       (select count(*) from public.players where game_completed),
    'total_level_completions', (select count(*) from public.player_events where event_type = 'level_completed'),
    'active_24h',              (select count(*) from public.players where last_seen_at > now() - interval '24 hours')
  );
end;
$$;

create or replace function public.admin_level_stats()
returns table (level_id integer, players_started bigint, players_completed bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admins only' using errcode = '42501';
  end if;
  return query
    select e.level_id,
           count(*) filter (where e.event_type = 'level_started'),
           count(*) filter (where e.event_type = 'level_completed')
      from public.player_events e
     where e.level_id is not null
     group by e.level_id
     order by e.level_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Function permissions
-- ---------------------------------------------------------------------------

revoke all on function public.track_event(text, integer) from public, anon;
revoke all on function public.admin_overview()            from public, anon;
revoke all on function public.admin_level_stats()         from public, anon;
revoke all on function public.is_admin()                  from public, anon;
grant execute on function public.track_event(text, integer) to authenticated;
grant execute on function public.admin_overview()            to authenticated;
grant execute on function public.admin_level_stats()         to authenticated;
grant execute on function public.is_admin()                  to authenticated;

grant select on public.players, public.player_events to authenticated;
revoke insert, update, delete on public.players, public.player_events, public.admins from anon, authenticated;
