import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LEVELS } from '../game/levels';
import { copy } from '../copy/he';

export type Overview = {
  total_players: number;
  players_started: number;
  players_completed: number;
  total_level_completions: number;
  active_24h: number;
};
export type LevelRow = { level_id: number; players_started: number; players_completed: number };
export type DeviceRow = { device_type: string; device_os: string; device_model: string | null; players: number };
export type Player = {
  user_id: string;
  display_name: string;
  first_seen_at: string;
  last_seen_at: string;
  games_started: number;
  current_level: number;
  completed_levels_count: number;
  game_completed: boolean;
  device_type?: string | null;
  device_os?: string | null;
  device_browser?: string | null;
  device_model?: string | null;
};
export type Activity = { active: number; unit: 'hour' | 'day'; series: { t: string; players: number }[] };

/** Range of the date selector, in hours (the values admin_activity accepts). */
export type Range = 24 | 168 | 720;
export const RANGES: { value: Range; label: string; active: string }[] = [
  { value: 24, label: '24 שעות אחרונות', active: 'פעילים ב-24 שעות' },
  { value: 168, label: '7 ימים אחרונים', active: 'פעילים ב-7 ימים' },
  { value: 720, label: '30 ימים אחרונים', active: 'פעילים ב-30 ימים' },
];

export type AdminData = {
  overview: Overview | null;
  levels: LevelRow[];
  /** null = migration 0002 not run */
  devices: DeviceRow[] | null;
  players: Player[];
  /** null = migration 0003 not run (or still loading) */
  activity: Activity | null;
  activityMissing: boolean;
};

const TZ = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem';
  } catch {
    return 'Asia/Jerusalem';
  }
})();

/** All players, newest activity first (PostgREST caps a response at 1000 rows, so page through). */
async function loadPlayers(sb: SupabaseClient) {
  const page = 1000;
  const out: Player[] = [];
  for (let from = 0; from < 20000; from += page) {
    const { data, error } = await sb
      .from('players')
      .select('*') // tolerant of optional columns (device info arrives with migration 0002)
      .order('last_seen_at', { ascending: false })
      .order('user_id')
      .range(from, from + page - 1);
    if (error) return { data: out, error };
    out.push(...((data as Player[]) ?? []));
    if (!data || data.length < page) break;
  }
  return { data: out, error: null };
}

export function useAdminData(sb: SupabaseClient, range: Range) {
  const [data, setData] = useState<AdminData>({
    overview: null,
    levels: [],
    devices: null,
    players: [],
    activity: null,
    activityMissing: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const loadActivity = useCallback(
    async (r: Range) => {
      const { data: a, error: e } = await sb.rpc('admin_activity', { p_hours: r, p_tz: TZ });
      setData((d) => ({ ...d, activity: e ? null : (a as Activity), activityMissing: !!e }));
    },
    [sb],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [ov, lv, dv, pl] = await Promise.all([
      sb.rpc('admin_overview'),
      sb.rpc('admin_level_stats'),
      sb.rpc('admin_device_stats'),
      loadPlayers(sb),
      loadActivity(range),
    ]);
    const err = ov.error ?? lv.error ?? pl.error;
    if (err) setError(err.message);
    setData((d) => ({
      ...d,
      overview: (ov.data as Overview) ?? null,
      levels: (lv.data as LevelRow[]) ?? [],
      // device stats are optional: null = migration 0002 not run yet
      devices: dv.error ? null : ((dv.data as DeviceRow[]) ?? []),
      players: pl.data,
    }));
    setLoadedAt(new Date());
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb, loadActivity]);

  useEffect(() => {
    void load();
  }, [load]);

  // changing the range only reloads the activity series
  const [first, setFirst] = useState(true);
  useEffect(() => {
    if (first) return setFirst(false);
    void loadActivity(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return { data, error, loading, loadedAt, reload: load };
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

export type LevelProgress = {
  level: number;
  place: string;
  started: number;
  completed: number;
  /** share of the players who started level 1 that reached this level */
  reached: number;
  /** completed / started */
  rate: number | null;
  /** finished this level but did not start the next one */
  drop: number | null;
};

/** Every numbered level, even ones nobody reached yet. */
export function levelProgress(levels: LevelRow[]): LevelProgress[] {
  const count = Math.max(LEVELS.length, ...levels.map((l) => l.level_id), 0);
  const by = new Map(levels.map((l) => [l.level_id, l]));
  const rows = Array.from({ length: count }, (_, i) => {
    const r = by.get(i + 1);
    return { level: i + 1, started: Number(r?.players_started ?? 0), completed: Number(r?.players_completed ?? 0) };
  });
  const base = rows[0]?.started ?? 0;
  return rows.map((r, i) => {
    const next = rows[i + 1];
    return {
      ...r,
      place: copy.level.places[i] ?? '',
      reached: base ? r.started / base : 0,
      rate: r.started ? r.completed / r.started : null,
      drop: next && r.completed ? Math.max(0, 1 - next.started / r.completed) : null,
    };
  });
}

/** Platform families shown in the dashboard. */
export type Family = 'ios' | 'android' | 'windows' | 'mac' | 'other';
export const FAMILY_LABEL: Record<Family, string> = {
  ios: 'iOS',
  android: 'Android',
  windows: 'PC · Windows',
  mac: 'Mac · macOS',
  other: 'אחר',
};
export function family(os: string | null | undefined): Family | null {
  if (!os) return null;
  if (/^(iOS|iPadOS)/i.test(os)) return 'ios';
  if (/^Android/i.test(os)) return 'android';
  if (/^Windows/i.test(os)) return 'windows';
  if (/^macOS/i.test(os)) return 'mac';
  return 'other';
}

export function deviceFamilies(rows: DeviceRow[]) {
  const counts = new Map<Family, number>();
  for (const r of rows) {
    const f = family(r.device_os) ?? 'other';
    counts.set(f, (counts.get(f) ?? 0) + Number(r.players));
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const list = (['ios', 'android', 'windows', 'mac'] as Family[])
    .map((f) => ({ family: f, n: counts.get(f) ?? 0 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  if (counts.get('other')) list.push({ family: 'other', n: counts.get('other')! });
  return { total, list };
}

const TYPE_LABEL: Record<string, string> = { mobile: 'נייד', tablet: 'טאבלט', desktop: 'מחשב' };
/** non-empty parts, without repeats ("Android · Android 14" → "Android 14") */
const uniq = (parts: (string | null | undefined)[]) => {
  const xs = parts.filter((x): x is string => !!x);
  return xs.filter((x, i) => !xs.some((y, j) => j !== i && y !== x && y.startsWith(x)) && xs.indexOf(x) === i);
};
/** "נייד · iPhone · iOS 18 · Safari" (skips what is unknown) */
export const deviceText = (p: Player) =>
  p.device_type
    ? uniq([TYPE_LABEL[p.device_type] ?? p.device_type, p.device_model, p.device_os, p.device_browser]).join(' · ')
    : '';

export type Status = 'active' | 'progress' | 'done' | 'new';
export const STATUS_LABEL: Record<Status, string> = {
  active: 'פעיל',
  progress: 'בתהליך',
  done: 'הושלם',
  new: 'לא התחיל',
};
const DAY = 24 * 3600 * 1000;
/** הושלם = finished the game; פעיל = seen in the last 24 h; בתהליך = reached a level; else לא התחיל */
export function status(p: Player, now = Date.now()): Status {
  if (p.game_completed) return 'done';
  if (now - new Date(p.last_seen_at).getTime() < DAY) return 'active';
  if (p.current_level > 0) return 'progress';
  return 'new';
}

const two = (n: number) => String(n).padStart(2, '0');
/** "29.10.2026" */
export const dateText = (iso: string) => {
  const d = new Date(iso);
  return `${two(d.getDate())}.${two(d.getMonth() + 1)}.${d.getFullYear()}`;
};
/** "11:16, 15.11.2026" */
export const dateTimeText = (iso: string) => {
  const d = new Date(iso);
  return `${two(d.getHours())}:${two(d.getMinutes())}, ${dateText(iso)}`;
};
export function DateTime({ iso }: { iso: string }) {
  const d = dateText(iso);
  return (
    <span dir="ltr" className="a-dt">
      {timeText(iso)}, {d.slice(0, 5)}
      <span className="a-yr">{d.slice(5)}</span>
    </span>
  );
}
export const timeText = (iso: string) => {
  const d = new Date(iso);
  return `${two(d.getHours())}:${two(d.getMinutes())}`;
};
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const num = (n: number | undefined | null) => (n == null ? '–' : n.toLocaleString('he-IL'));
