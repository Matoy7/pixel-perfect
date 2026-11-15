import { useMemo } from 'react';
import { AreaChart, Donut, LevelBars } from './charts';
import { IconArrowLeft, IconLayers, IconPlay, IconPulse, IconTrophy, IconUsers } from './icons';
import { Card, Kpi, StatusBadge } from './ui';
import { RANGES, DateTime, deviceFamilies, levelProgress, num, status, type AdminData, type Range } from './data';

export function Overview({ data, range, loading }: { data: AdminData; range: Range; loading: boolean }) {
  const { overview: ov, activity } = data;
  const levels = useMemo(() => levelProgress(data.levels), [data.levels]);
  const devices = useMemo(() => (data.devices ? deviceFamilies(data.devices) : null), [data.devices]);
  const recent = data.players.slice(0, 5); // already newest activity first
  const r = RANGES.find((x) => x.value === range)!;
  // active in the selected range (0003); without it, the fixed 24 h figure
  const activeValue = activity ? activity.active : ov?.active_24h;
  const activeLabel = activity ? r.active : RANGES[0].active;

  return (
    <>
      <div className="a-kpis a-kpis--5">
        <Kpi icon={<IconUsers />} value={num(ov?.total_players)} label="שחקנים ייחודיים" />
        <Kpi icon={<IconPlay />} value={num(ov?.players_started)} label="התחילו לשחק" />
        <Kpi icon={<IconTrophy />} value={num(ov?.players_completed)} label="השלמת משחק" />
        <Kpi icon={<IconLayers />} value={num(ov?.total_level_completions)} label="השלמת שלבים" />
        <Kpi icon={<IconPulse />} value={num(activeValue)} label={activeLabel} />
      </div>

      <div className="a-row a-row--levels">
        <Card>
          <header className="a-card__head">
            <h2 className="a-h2">התקדמות השחקנים לפי שלב</h2>
            <span className="a-muted a-small">{levels.length} שלבים</span>
          </header>
          <LevelBars rows={levels} />
        </Card>
        <Card>
          <header className="a-card__head">
            <h2 className="a-h2">מכשירים ופלטפורמות</h2>
          </header>
          {devices === null ? (
            <p className="a-note">
              נתוני מכשירים עדיין לא זמינים: יש להריץ את <code>supabase/migrations/0002_player_device.sql</code> ב-SQL Editor.
            </p>
          ) : devices.total === 0 ? (
            <p className="a-note">אין עדיין נתוני מכשירים (נאספים מהביקור הבא של כל שחקן).</p>
          ) : (
            <Donut total={devices.total} list={devices.list} />
          )}
        </Card>
      </div>

      <div className="a-row a-row--half">
        <Card>
          <header className="a-card__head">
            <h2 className="a-h2">שחקנים אחרונים</h2>
            <a className="a-link" href="#players">
              לכל השחקנים <IconArrowLeft size={16} />
            </a>
          </header>
          <div className="a-scroll">
            <table className="a-table a-table--compact">
              <thead>
                <tr>
                  <th>מזהה שחקן</th>
                  <th>פעילות אחרונה</th>
                  <th className="a-c">שלב</th>
                  <th className="a-c">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.user_id}>
                    <td className="a-strong">{p.display_name}</td>
                    <td className="a-num">
                      <DateTime iso={p.last_seen_at} />
                    </td>
                    <td className="a-c a-num">{p.current_level || '–'}</td>
                    <td className="a-c">
                      <StatusBadge s={status(p)} />
                    </td>
                  </tr>
                ))}
                {!recent.length && (
                  <tr>
                    <td colSpan={4} className="a-empty">
                      {loading ? 'טוען…' : 'אין עדיין שחקנים'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="a-card--fill">
          <header className="a-card__head">
            <h2 className="a-h2">פעילות שחקנים לאורך זמן</h2>
          </header>
          {activity ? (
            <AreaChart activity={activity} />
          ) : data.activityMissing ? (
            <p className="a-note">
              הגרף יוצג אחרי הרצת <code>supabase/migrations/0003_admin_activity.sql</code> ב-SQL Editor.
            </p>
          ) : (
            <p className="a-note">טוען…</p>
          )}
        </Card>
      </div>
    </>
  );
}
