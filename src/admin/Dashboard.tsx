import { useCallback, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LEVELS } from '../game/levels';

type Overview = {
  total_players: number;
  players_started: number;
  players_completed: number;
  total_level_completions: number;
  active_24h: number;
};
type LevelRow = { level_id: number; players_started: number; players_completed: number };
type Player = {
  user_id: string;
  display_name: string;
  first_seen_at: string;
  last_seen_at: string;
  current_level: number;
  completed_levels_count: number;
  game_completed: boolean;
};
type Activity = { user_id: string; event_type: string; level_id: number | null; created_at: string };
type Sort = 'last_seen_at' | 'current_level';

const EVENT_LABEL: Record<string, string> = {
  game_started: 'התחיל משחק',
  level_started: 'התחיל שלב',
  level_completed: 'סיים שלב',
  game_completed: 'סיים את המשחק',
};

const fmt = new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' });
const when = (iso: string) => fmt.format(new Date(iso));
const pct = (n: number) => `${Math.round(n * 100)}%`;

export function Dashboard({ sb, email, onSignOut }: { sb: SupabaseClient; email: string; onSignOut: () => void }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<Sort>('last_seen_at');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [ov, lv, pl, ac] = await Promise.all([
      sb.rpc('admin_overview'),
      sb.rpc('admin_level_stats'),
      sb
        .from('players')
        .select('user_id,display_name,first_seen_at,last_seen_at,current_level,completed_levels_count,game_completed')
        .order(sort, { ascending: false })
        .order('last_seen_at', { ascending: false })
        .limit(500),
      sb.from('player_events').select('user_id,event_type,level_id,created_at').order('created_at', { ascending: false }).limit(20),
    ]);
    const err = ov.error ?? lv.error ?? pl.error ?? ac.error;
    if (err) setError(err.message);
    setOverview((ov.data as Overview) ?? null);
    setLevels((lv.data as LevelRow[]) ?? []);
    const ps = (pl.data as Player[]) ?? [];
    setPlayers(ps);
    const acts = (ac.data as Activity[]) ?? [];
    setActivity(acts);
    // names for the activity feed (players already loaded cover most)
    const map: Record<string, string> = Object.fromEntries(ps.map((p) => [p.user_id, p.display_name]));
    const missing = [...new Set(acts.map((a) => a.user_id))].filter((id) => !map[id]);
    if (missing.length) {
      const { data } = await sb.from('players').select('user_id,display_name').in('user_id', missing);
      for (const p of (data as { user_id: string; display_name: string }[]) ?? []) map[p.user_id] = p.display_name;
    }
    setNames(map);
    setLoading(false);
  }, [sb, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  // every numbered level, even ones nobody reached yet
  const levelCount = Math.max(LEVELS.length, ...levels.map((l) => l.level_id), 0);
  const byLevel = new Map(levels.map((l) => [l.level_id, l]));
  const rows = Array.from({ length: levelCount }, (_, i) => {
    const r = byLevel.get(i + 1);
    return { level: i + 1, started: Number(r?.players_started ?? 0), completed: Number(r?.players_completed ?? 0) };
  });
  const maxStarted = Math.max(1, ...rows.map((r) => r.started));

  return (
    <main className="adm">
      <header className="adm-head">
        <h1 className="adm-title">PIXEL PERFECT · ניהול</h1>
        <div className="adm-head__side">
          <span className="adm-muted adm-small" dir="ltr">
            {email}
          </span>
          <button className="adm-btn adm-btn--ghost" onClick={() => void load()} disabled={loading}>
            {loading ? 'טוען…' : 'רענון'}
          </button>
          <button className="adm-btn adm-btn--ghost" onClick={onSignOut}>
            התנתקות
          </button>
        </div>
      </header>

      {error && <p className="adm-error">שגיאה בטעינת הנתונים: {error}</p>}

      <section className="adm-tiles" aria-label="סקירה">
        <Tile label="שחקנים ייחודיים" value={overview?.total_players} />
        <Tile label="התחילו לשחק" value={overview?.players_started} />
        <Tile label="סיימו את המשחק" value={overview?.players_completed} />
        <Tile label="השלמות שלבים" value={overview?.total_level_completions} />
        <Tile label="פעילים ב-24 השעות האחרונות" value={overview?.active_24h} />
      </section>

      <div className="adm-grid">
        <section className="adm-card">
          <h2 className="adm-h2">שלבים</h2>
          <div className="adm-legend adm-small">
            <span>
              <i className="adm-swatch adm-swatch--track" /> התחילו
            </span>
            <span>
              <i className="adm-swatch adm-swatch--fill" /> סיימו
            </span>
          </div>
          <div className="adm-scroll">
          <table className="adm-table adm-levels">
            <thead>
              <tr>
                <th>שלב</th>
                <th className="adm-wide">התחילו / סיימו</th>
                <th>השלמה</th>
                <th title="מי שסיים את השלב ולא התחיל את הבא">נשירה לשלב הבא</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const next = rows[i + 1];
                const rate = r.started ? r.completed / r.started : null;
                const drop = next && r.completed ? 1 - next.started / r.completed : null;
                return (
                  <tr key={r.level} title={`שלב ${r.level}: ${r.started} התחילו, ${r.completed} סיימו`}>
                    <td>{r.level}</td>
                    <td className="adm-wide">
                      <div className="adm-barcell">
                      <div className="adm-bar" aria-hidden="true">
                        <div className="adm-bar__track" style={{ width: `${(r.started / maxStarted) * 100}%` }}>
                          <div
                            className="adm-bar__fill"
                            style={{ width: r.started ? `${(r.completed / r.started) * 100}%` : 0 }}
                          />
                        </div>
                      </div>
                      <span className="adm-small adm-num">
                        {r.started} / {r.completed}
                      </span>
                      </div>
                    </td>
                    <td className="adm-num">{rate === null ? '–' : pct(rate)}</td>
                    <td className="adm-num">{drop === null ? '–' : pct(Math.max(0, drop))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </section>

        <section className="adm-card">
          <h2 className="adm-h2">פעילות אחרונה</h2>
          {activity.length === 0 ? (
            <p className="adm-muted">אין עדיין פעילות.</p>
          ) : (
            <ul className="adm-feed">
              {activity.map((a, i) => (
                <li key={i}>
                  <span>
                    <b>{names[a.user_id] ?? a.user_id.slice(0, 8)}</b> · {EVENT_LABEL[a.event_type] ?? a.event_type}
                    {a.level_id ? ` ${a.level_id}` : ''}
                  </span>
                  <span className="adm-muted adm-small">{when(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="adm-card">
        <div className="adm-card__head">
          <h2 className="adm-h2">שחקנים ({players.length})</h2>
          <div className="adm-seg" role="group" aria-label="מיון">
            <button aria-pressed={sort === 'last_seen_at'} onClick={() => setSort('last_seen_at')}>
              פעילות אחרונה
            </button>
            <button aria-pressed={sort === 'current_level'} onClick={() => setSort('current_level')}>
              שלב נוכחי
            </button>
          </div>
        </div>
        <div className="adm-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>שחקן</th>
                <th>מזהה</th>
                <th>ביקור ראשון</th>
                <th>פעילות אחרונה</th>
                <th>שלב נוכחי</th>
                <th>שלבים שהושלמו</th>
                <th>סיים</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.user_id}>
                  <td>{p.display_name}</td>
                  <td className="adm-muted adm-small" dir="ltr" title={p.user_id}>
                    {p.user_id.slice(0, 8)}
                  </td>
                  <td className="adm-small">{when(p.first_seen_at)}</td>
                  <td className="adm-small">{when(p.last_seen_at)}</td>
                  <td className="adm-num">{p.current_level || '–'}</td>
                  <td className="adm-num">{p.completed_levels_count}</td>
                  <td>{p.game_completed ? <span className="adm-done">✓ כן</span> : <span className="adm-muted">לא</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="adm-card adm-tile">
      <div className="adm-tile__value">{value ?? '–'}</div>
      <div className="adm-tile__label">{label}</div>
    </div>
  );
}
