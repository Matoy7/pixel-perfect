-- PIXEL PERFECT – player device info (run once after 0001).
-- Dashboard → SQL Editor → paste → Run. Safe to re-run; no data is reset.
--
-- Adds the player's device (latest seen) to public.players, written only
-- through set_device() for the signed-in player, and a device summary for admins.
-- Collected from the browser itself (type / OS / browser / model) – no personal data.

alter table public.players
  add column if not exists device_type       text,        -- 'mobile' | 'tablet' | 'desktop'
  add column if not exists device_os         text,        -- e.g. 'iOS 18', 'Android 14', 'Windows', 'macOS'
  add column if not exists device_browser    text,        -- e.g. 'Safari', 'Chrome', 'Samsung Internet'
  add column if not exists device_model      text,        -- e.g. 'iPhone', 'Pixel 8', 'SM-S911B', 'Mac', 'PC'
  add column if not exists device_updated_at timestamptz;

alter table public.players drop constraint if exists players_device_type_check;
alter table public.players
  add constraint players_device_type_check check (device_type is null or device_type in ('mobile', 'tablet', 'desktop'));

create or replace function public.set_device(
  p_type text, p_os text, p_browser text, p_model text
)
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
  if p_type not in ('mobile', 'tablet', 'desktop') then
    raise exception 'invalid device type %', p_type using errcode = '22023';
  end if;
  update public.players
     set device_type       = p_type,
         device_os         = left(nullif(trim(p_os), ''), 40),
         device_browser    = left(nullif(trim(p_browser), ''), 40),
         device_model      = left(nullif(trim(p_model), ''), 60),
         device_updated_at = now(),
         updated_at        = now()
   where user_id = uid;  -- the player row is created by track_event('visit')
end;
$$;

create or replace function public.admin_device_stats()
returns table (device_type text, device_os text, device_model text, players bigint)
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
    select p.device_type,
           split_part(coalesce(p.device_os, ''), ' ', 1),  -- OS family (no version)
           p.device_model,
           count(*)
      from public.players p
     where p.device_type is not null
     group by 1, 2, 3
     order by 4 desc;
end;
$$;

revoke all on function public.set_device(text, text, text, text) from public, anon;
revoke all on function public.admin_device_stats()                from public, anon;
grant execute on function public.set_device(text, text, text, text) to authenticated;
grant execute on function public.admin_device_stats()                to authenticated;
