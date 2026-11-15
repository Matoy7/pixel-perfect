import { useMemo, type ReactNode } from 'react';
import { Donut, LevelBars, Sparkline } from './charts';
import { IconArrowUp, IconBars, IconChevronLeft, IconClock, IconLayers, IconPhone, IconPlay, IconTrophy, IconUsers } from './icons';
import { Kpi, StatusBadge } from './ui';
import {
  DateTime,
  RANGES,
  deviceFamilies,
  durationText,
  growth,
  levelProgress,
  num,
  pct1,
  performance,
  status,
  type AdminData,
  type Range,
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

/** Light bar anchored on the left (as in the reference). */
function PerfRow({ label, value, fill, title }: { label: string; value: ReactNode; fill: number | null; title?: string }) {
  return (
    <div className="o-perf__row" title={title}>
      <span className="o-perf__label">{label}</span>
      <span className="o-perf__track" dir="ltr">
        <span className="o-perf__fill" style={{ width: `${Math.max(0, Math.min(1, fill ?? 0)) * 100}%` }} />
      </span>
      <b className="o-perf__value" dir="ltr">
        {value}
      </b>
    </div>
  );
}

/** Scale of the average-play-time bar. */
const PLAY_TIME_SCALE = 25 * 60;

export function Overview({ data, range, loading }: { data: AdminData; range: Range; loading: boolean }) {
  const { overview: ov, activity, players } = data;
  const levels = useMemo(() => levelProgress(data.levels), [data.levels]);
  const devices = useMemo(() => (data.devices ? deviceFamilies(data.devices) : null), [data.devices]);
  const grow = useMemo(() => growth(players, range), [players, range]);
  const perf = useMemo(() => performance(players, ov), [players, ov]);
  const recent = players.slice(0, 3); // already newest activity first
  const r = RANGES.find((x) => x.value === range)!;
  // active in the selected range (0003); without it, the fixed 24 h figure
  const activeValue = activity ? activity.active : ov?.active_24h;
  const activeLabel = activity ? r.active : RANGES[0].active;
  const pt = data.playTime;

  return (
    <div className="o-grid">
      <div className="o-row o-row--top">
        <div className="o-kpis">
          <Kpi icon={<IconPlay />} value={num(ov?.players_started)} label="התחילו לשחק" />
          <Kpi icon={<IconTrophy />} value={num(ov?.players_completed)} label="השלמו משחק" />
          <Kpi icon={<IconUsers />} value={num(activeValue)} label={activeLabel} />
          <Kpi icon={<IconLayers />} value={num(ov?.total_level_completions)} label="השלמות שלבים" />
        </div>

        <section className="o-hero">
          <Sparkline points={grow.points} unit={range === 24 ? 'hour' : 'day'} />
          <div className="o-hero__text">
            <div className="o-hero__title">
              <h2>שחקנים ייחודיים</h2>
              <span className="o-hero__icon">
                <IconUsers />
              </span>
            </div>
            <div className="o-hero__value">{num(ov?.total_players)}</div>
            <div className="o-hero__pill" title={`${num(grow.added)} שחקנים חדשים ב${r.label}`}>
              <span>{r.compare}</span>
              <IconArrowUp size={18} className="o-hero__arrow" />
              <span className="o-hero__delta" dir="ltr">
                {grow.change === null ? (grow.added ? `+${num(grow.added)}` : '0%') : `+${pct1(grow.change)}`}
              </span>
            </div>
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
        <Panel icon={<IconBars />} title="סיכום ביצועים" className="o-perf">
          <div className="o-perf__list">
            <PerfRow
              label="שיעור השלמת משחק"
              value={perf.completion === null ? '–' : pct1(perf.completion)}
              fill={perf.completion}
              title="שחקנים שסיימו את כל השלבים, מתוך מי שהתחיל לשחק"
            />
            <PerfRow
              label="זמן משחק ממוצע"
              value={pt?.avg_seconds != null ? durationText(pt.avg_seconds) : '–'}
              fill={pt?.avg_seconds != null ? pt.avg_seconds / PLAY_TIME_SCALE : null}
              title={
                pt
                  ? `זמן ממוצע מתחילת משחק ועד סיום כל השלבים (${num(pt.players)} שחקנים שסיימו). הפס: מתוך 25 דקות`
                  : 'יוצג אחרי הרצת supabase/migrations/0004_admin_play_time.sql'
              }
            />
            <PerfRow
              label="שיעור נשירה"
              value={perf.drop === null ? '–' : pct1(perf.drop)}
              fill={perf.drop}
              title="שחקנים שהתחילו, לא סיימו ולא חזרו 7 ימים, מתוך מי שהתחיל לשחק"
            />
          </div>
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
