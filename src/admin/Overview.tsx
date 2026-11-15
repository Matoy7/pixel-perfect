import { useMemo, type ReactNode } from 'react';
import { Donut, LevelBars, Sparkline } from './charts';
import { IconArrowUp, IconChevronLeft, IconClock, IconLayers, IconPhone, IconPie, IconPlay, IconTrophy, IconUsers } from './icons';
import { Kpi, StatusBadge } from './ui';
import {
  DateTime,
  RANGES,
  deviceFamilies,
  growth,
  levelProgress,
  num,
  pct,
  pct1,
  SOURCE_TAIL,
  sourceLabel,
  sourcesFromPlayers,
  status,
  type AdminData,
  type Range,
  type SourceRow,
} from './data';

/** Card with the reference's header: icon tile, title, optional left-side extra. */
function Panel({ icon, title, extra, className = '', children }: { icon: ReactNode; title: string; extra?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`o-card ${className}`}>
      <header className="o-card__head">
        <span className="o-tile">{icon}</span>
        <h2>{title}</h2>
        {extra && <div className="o-card__extra">{extra}</div>}
      </header>
      {children}
    </section>
  );
}

/**
 * פילוח מקורות משתמשים: players per source, biggest first, regular browser / other last.
 * Empty rows → no source data recorded (nothing is invented).
 */
function Sources({ rows }: { rows: SourceRow[] | null }) {
  const list = (rows ?? []).filter((r) => r.players > 0);
  const total = list.reduce((a, r) => a + r.players, 0);
  if (!total) {
    return (
      <div className="o-empty-state">
        <span className="o-tile">
          <IconPie />
        </span>
        <b>אין עדיין נתוני מקורות</b>
        <span>עדיין לא נשמר באיזו אפליקציה או בדפדפן נפתח המשחק, ולכן אין נתונים להצגה.</span>
      </div>
    );
  }
  const tail = (s: string) => SOURCE_TAIL.indexOf(s);
  const sorted = [...list].sort((a, b) => tail(a.source) - tail(b.source) || b.players - a.players);
  return (
    <div className="o-src">
      {sorted.map((r) => (
        <div key={r.source} className="o-src__row">
          <span className="o-src__name">
            <bdi>{sourceLabel(r.source)}</bdi>
          </span>
          <span className="o-perf__track" dir="ltr">
            <span className="o-perf__fill" style={{ width: `${(r.players / total) * 100}%` }} />
          </span>
          <span className="o-src__value" dir="ltr">
            <b>{num(r.players)}</b> <span>({pct(r.players / total)})</span>
          </span>
        </div>
      ))}
      <p className="o-src__note">לפי האפליקציה שבה נפתח המשחק בביקור האחרון של כל שחקן ({num(total)} שחקנים)</p>
    </div>
  );
}

export function Overview({ data, range, loading }: { data: AdminData; range: Range; loading: boolean }) {
  const { overview: ov, activity, players } = data;
  const levels = useMemo(() => levelProgress(data.levels), [data.levels]);
  const devices = useMemo(() => (data.devices ? deviceFamilies(data.devices) : null), [data.devices]);
  const grow = useMemo(() => growth(players, range), [players, range]);
  const sources = useMemo(() => sourcesFromPlayers(players), [players]);
  const recent = players.slice(0, 3); // already newest activity first
  const r = RANGES.find((x) => x.value === range)!;
  // active in the selected range (0003); without it, the fixed 24 h figure
  const activeValue = activity ? activity.active : ov?.active_24h;
  const activeLabel = activity ? r.active : RANGES[0].active;

  return (
    <div className="o-grid">
      <div className="o-row o-row--top">
        <div className="o-kpis">
          <Kpi icon={<IconPlay />} value={num(ov?.players_started)} label="התחילו לשחק" />
          <Kpi icon={<IconTrophy />} value={num(ov?.players_completed)} label="השלמו משחק" />
          <Kpi icon={<IconUsers />} value={num(activeValue)} label={activeLabel} />
          <Kpi icon={<IconLayers />} value={num(ov?.total_level_completions)} label="השלמות שלבים" />
        </div>

        <section className="o-hero" aria-label="גידול במספר השחקנים">
          <Sparkline points={grow.points} unit={range === 24 ? 'hour' : 'day'} />
        </section>

        <section className="o-unique">
          <div className="o-unique__title">
            <span className="o-tile">
              <IconUsers />
            </span>
            <h2>שחקנים ייחודיים</h2>
          </div>
          <div className="o-unique__value">{num(ov?.total_players)}</div>
          <div className="o-unique__pill" title={`${num(grow.added)} שחקנים חדשים ב${r.label}`}>
            <span>{r.compare}</span>
            <IconArrowUp size={14} className="o-unique__arrow" />
            <span className="o-unique__delta" dir="ltr">
              {grow.change === null ? (grow.added ? `+${num(grow.added)}` : '0%') : `+${pct1(grow.change)}`}
            </span>
          </div>
        </section>
      </div>

      <div className="o-row o-row--mid">
        <Panel icon={<IconPhone />} title="מכשירים ופלטפורמות" className="o-devices">
          {devices === null ? (
            <p className="o-note">
              נתוני מכשירים עדיין לא זמינים: יש להריץ את <code>supabase/migrations/0002_player_device.sql</code> ב-SQL Editor.
            </p>
          ) : devices.total === 0 ? (
            <p className="o-note">אין עדיין נתוני מכשירים (נאספים מהביקור הבא של כל שחקן).</p>
          ) : (
            <Donut total={devices.total} list={devices.list} />
          )}
        </Panel>
        <Panel icon={<IconLayers />} title="התקדמות השחקנים לפי שלב" extra={<span className="o-muted">{levels.length} שלבים</span>} className="o-levels">
          <LevelBars rows={levels} />
        </Panel>
      </div>

      <div className="o-row o-row--bot">
        <Panel icon={<IconPie />} title="פילוח מקורות משתמשים" className="o-perf o-sources">
          <Sources rows={sources} />
        </Panel>
        <Panel
          icon={<IconClock />}
          title="שחקנים אחרונים"
          className="o-recent"
          extra={
            <a className="o-link" href="#players">
              לכל השחקנים <IconChevronLeft size={20} />
            </a>
          }
        >
          <table className="o-table">
            <colgroup>
              <col className="o-col-name" />
              <col className="o-col-date" />
              <col className="o-col-lvl" />
              <col className="o-col-status" />
            </colgroup>
            <thead>
              <tr>
                <th>מזהה שחקן</th>
                <th>פעילות אחרונה</th>
                <th className="o-c">שלב</th>
                <th className="o-c">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.user_id}>
                  <td className="o-strong" title={p.user_id}>
                    {p.display_name}
                  </td>
                  <td>
                    <DateTime iso={p.last_seen_at} />
                  </td>
                  <td className="o-c">{p.current_level || '–'}</td>
                  <td className="o-c">
                    <StatusBadge s={status(p)} />
                  </td>
                </tr>
              ))}
              {!recent.length && (
                <tr>
                  <td colSpan={4} className="o-empty">
                    {loading ? 'טוען…' : 'אין עדיין שחקנים'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
