import { useEffect, useMemo, useState } from 'react';
import {
  IconAndroid,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconMonitor,
  IconPhone,
  IconPulse,
  IconSearch,
  IconSort,
  IconTablet,
  IconTrophy,
  IconUsers,
  IconX,
} from './icons';
import { Card, Dropdown, Kpi, StatusBadge, type Option } from './ui';
import {
  DateTime,
  FAMILY_LABEL,
  STATUS_LABEL,
  dateText,
  dateTimeText,
  deviceText,
  family,
  num,
  status,
  type AdminData,
  type Family,
  type Player,
  type Status,
} from './data';
import { LEVELS } from '../game/levels';

type SortKey = 'name' | 'joined' | 'seen' | 'level' | 'device' | 'status';
type Sort = { key: SortKey; dir: 'asc' | 'desc' };
type Filters = {
  status: Status | '';
  level: number | -1;
  completed: '' | 'yes' | 'no';
  device: Family | 'unknown' | '';
  seen: '' | '24' | '168' | '720' | 'old';
};
const NO_FILTERS: Filters = { status: '', level: -1, completed: '', device: '', seen: '' };

const STATUS_ORDER: Status[] = ['active', 'progress', 'done', 'new'];
const SEEN_LABEL: Record<Exclude<Filters['seen'], ''>, string> = {
  '24': '24 שעות אחרונות',
  '168': '7 ימים אחרונים',
  '720': '30 ימים אחרונים',
  old: 'לפני יותר מ-30 יום',
};

function DeviceCell({ p }: { p: Player }) {
  const f = family(p.device_os);
  if (!f) return <span className="a-muted">–</span>;
  const Icon = f === 'android' ? IconAndroid : p.device_type === 'desktop' ? IconMonitor : p.device_type === 'tablet' ? IconTablet : IconPhone;
  return (
    <span className="a-device" title={deviceText(p)}>
      <Icon size={18} />
      <span dir="ltr">{FAMILY_LABEL[f]}</span>
    </span>
  );
}

function pages(page: number, last: number): (number | '…')[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', last];
  if (page >= last - 3) return [1, '…', last - 4, last - 3, last - 2, last - 1, last];
  return [1, '…', page - 1, page, page + 1, '…', last];
}

function csv(rows: Player[]) {
  const head = ['מזהה שחקן', 'user_id', 'תאריך הצטרפות', 'פעילות אחרונה', 'שלב נוכחי', 'שלבים שהושלמו', 'השלמת משחק', 'מכשיר', 'סטטוס'];
  const q = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = rows.map((p) =>
    [
      p.display_name,
      p.user_id,
      dateTimeText(p.first_seen_at),
      dateTimeText(p.last_seen_at),
      p.current_level,
      p.completed_levels_count,
      p.game_completed ? 'כן' : 'לא',
      deviceText(p),
      STATUS_LABEL[status(p)],
    ]
      .map(q)
      .join(','),
  );
  const blob = new Blob(['﻿' + [head.map(q).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `pixel-perfect-players-${dateText(new Date().toISOString()).replace(/\./g, '-')}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function Players({ data, loading }: { data: AdminData; loading: boolean }) {
  const { overview: ov, players } = data;
  const [q, setQ] = useState('');
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const [sort, setSort] = useState<Sort>({ key: 'seen', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const now = Date.now();

  const levelCount = Math.max(LEVELS.length, ...players.map((p) => p.current_level));
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((x) => ({ ...x, [k]: v }));

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const hour = 3600e3;
    const rows = players.filter((p) => {
      if (needle && !p.display_name.toLowerCase().includes(needle) && !p.user_id.startsWith(needle)) return false;
      if (f.status && status(p, now) !== f.status) return false;
      if (f.level !== -1 && p.current_level !== f.level) return false;
      if (f.completed && p.game_completed !== (f.completed === 'yes')) return false;
      if (f.device) {
        const fam = family(p.device_os);
        if (f.device === 'unknown' ? fam !== null : fam !== f.device) return false;
      }
      if (f.seen) {
        const age = now - new Date(p.last_seen_at).getTime();
        if (f.seen === 'old' ? age < 720 * hour : age >= Number(f.seen) * hour) return false;
      }
      return true;
    });
    const key = (p: Player): string | number => {
      switch (sort.key) {
        case 'name':
          return p.display_name;
        case 'joined':
          return p.first_seen_at;
        case 'seen':
          return p.last_seen_at;
        case 'level':
          return p.current_level;
        case 'device':
          return family(p.device_os) ? FAMILY_LABEL[family(p.device_os)!] : '￿';
        case 'status':
          return STATUS_ORDER.indexOf(status(p, now));
      }
    };
    const dir = sort.dir === 'asc' ? 1 : -1;
    return rows.sort((a, b) => {
      const ka = key(a);
      const kb = key(b);
      const c = typeof ka === 'number' ? ka - (kb as number) : String(ka).localeCompare(String(kb), 'he', { numeric: true });
      return c * dir || b.last_seen_at.localeCompare(a.last_seen_at);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, q, f, sort]);

  const last = Math.max(1, Math.ceil(filtered.length / per));
  useEffect(() => setPage(1), [q, f, sort, per]);
  useEffect(() => setPage((p) => Math.min(p, last)), [last]);
  const view = filtered.slice((page - 1) * per, page * per);
  const from = filtered.length ? (page - 1) * per + 1 : 0;
  const to = Math.min(filtered.length, page * per);

  const allOnPage = view.length > 0 && view.every((p) => selected.has(p.user_id));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const togglePage = () =>
    setSelected((s) => {
      const n = new Set(s);
      for (const p of view) {
        if (allOnPage) n.delete(p.user_id);
        else n.add(p.user_id);
      }
      return n;
    });

  const th = (key: SortKey, label: string, className = '') => {
    const on = sort.key === key;
    return (
      <th className={className} aria-sort={on ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button
          type="button"
          className={`a-th${on ? ' is-on' : ''}`}
          onClick={() =>
            setSort(on ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' || key === 'device' || key === 'status' ? 'asc' : 'desc' })
          }
        >
          {label}
          <IconSort size={14} dir={on ? sort.dir : null} />
        </button>
      </th>
    );
  };

  // filter dropdowns
  const all = { value: '', label: 'הכל' } as const;
  const statusOpts: Option<Filters['status']>[] = [all, ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s] }))];
  const levelOpts: Option<number>[] = [
    { value: -1, label: 'הכל' },
    { value: 0, label: 'טרם התחיל' },
    ...Array.from({ length: levelCount }, (_, i) => ({ value: i + 1, label: `שלב ${i + 1}` })),
  ];
  const completedOpts: Option<Filters['completed']>[] = [all, { value: 'yes', label: 'כן' }, { value: 'no', label: 'לא' }];
  const deviceOpts: Option<Filters['device']>[] = [
    all,
    ...(['ios', 'android', 'windows', 'mac', 'other'] as Family[]).map((x) => ({ value: x, label: FAMILY_LABEL[x] })),
    { value: 'unknown', label: 'לא ידוע' },
  ];
  const seenOpts: Option<Filters['seen']>[] = [all, ...(Object.keys(SEEN_LABEL) as (keyof typeof SEEN_LABEL)[]).map((k) => ({ value: k, label: SEEN_LABEL[k] }))];

  const chips: { key: keyof Filters; text: string }[] = [];
  if (f.status) chips.push({ key: 'status', text: `סטטוס: ${STATUS_LABEL[f.status]}` });
  if (f.level !== -1) chips.push({ key: 'level', text: `שלב נוכחי: ${f.level || 'טרם התחיל'}` });
  if (f.completed) chips.push({ key: 'completed', text: `השלמת משחק: ${f.completed === 'yes' ? 'כן' : 'לא'}` });
  if (f.device) chips.push({ key: 'device', text: `מכשיר: ${f.device === 'unknown' ? 'לא ידוע' : FAMILY_LABEL[f.device]}` });
  if (f.seen) chips.push({ key: 'seen', text: `פעילות: ${SEEN_LABEL[f.seen]}` });

  const filterBtn = (name: string, on: boolean) => <span className={on ? 'a-dd__on' : ''}>{name}</span>;

  return (
    <>
      <div className="a-kpis a-kpis--3">
        <Kpi icon={<IconUsers />} value={num(ov?.total_players)} label='סה"כ שחקנים' />
        <Kpi icon={<IconPulse />} value={num(ov?.active_24h)} label="פעילים" title="ב-24 השעות האחרונות" />
        <Kpi icon={<IconTrophy />} value={num(ov?.players_completed)} label="השלמת משחק" />
      </div>

      <Card className="a-players">
        <div className={`a-filters${chips.length > 1 ? ' a-filters--many' : ''}`}>
          <label className="a-search">
            <IconSearch size={18} />
            <input type="search" placeholder="חיפוש שחקן..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="חיפוש שחקן" />
          </label>
          <Dropdown label="סטטוס" value={f.status} options={statusOpts} onChange={(v) => set('status', v)}>
            {filterBtn('סטטוס', !!f.status)}
          </Dropdown>
          <Dropdown label="שלב נוכחי" value={f.level} options={levelOpts} onChange={(v) => set('level', v)}>
            {filterBtn('שלב נוכחי', f.level !== -1)}
          </Dropdown>
          <Dropdown label="השלמת משחק" value={f.completed} options={completedOpts} onChange={(v) => set('completed', v)}>
            {filterBtn('השלמת משחק', !!f.completed)}
          </Dropdown>
          <Dropdown label="מכשיר" value={f.device} options={deviceOpts} onChange={(v) => set('device', v)}>
            {filterBtn('מכשיר', !!f.device)}
          </Dropdown>
          <Dropdown label="תאריך פעילות אחרונה" value={f.seen} options={seenOpts} onChange={(v) => set('seen', v)}>
            {filterBtn('תאריך פעילות אחרונה', !!f.seen)}
          </Dropdown>
          {chips.length > 0 && (
            <div className="a-chips">
              <span className="a-muted a-small">מסננים:</span>
              {chips.map((c) => (
                <button key={c.key} type="button" className="a-chip" onClick={() => set(c.key, NO_FILTERS[c.key])} aria-label={`הסרת ${c.text}`}>
                  {c.text}
                  <IconX size={12} />
                </button>
              ))}
              <button type="button" className="a-clear" onClick={() => setF(NO_FILTERS)}>
                ניקוי מסננים <IconX size={14} />
              </button>
            </div>
          )}
        </div>

        {selected.size > 0 && (
          <div className="a-selbar">
            <span>{num(selected.size)} נבחרו</span>
            <button type="button" className="a-btn a-btn--ghost" onClick={() => csv(players.filter((p) => selected.has(p.user_id)))}>
              <IconDownload size={16} /> ייצוא CSV
            </button>
            <button type="button" className="a-btn a-btn--text" onClick={() => setSelected(new Set())}>
              ביטול בחירה
            </button>
          </div>
        )}

        <div className="a-scroll">
          <table className="a-table a-table--players">
            <thead>
              <tr>
                <th className="a-check">
                  <input type="checkbox" checked={allOnPage} onChange={togglePage} aria-label="בחירת כל השורות בעמוד" />
                </th>
                {th('name', 'מזהה שחקן')}
                {th('joined', 'תאריך הצטרפות')}
                {th('seen', 'פעילות אחרונה')}
                {th('level', 'שלב נוכחי', 'a-c')}
                <th className="a-c">השלמת משחק</th>
                {th('device', 'מכשיר')}
                {th('status', 'סטטוס', 'a-c')}
              </tr>
            </thead>
            <tbody>
              {view.map((p) => (
                <tr key={p.user_id} className={selected.has(p.user_id) ? 'is-selected' : ''}>
                  <td className="a-check">
                    <input type="checkbox" checked={selected.has(p.user_id)} onChange={() => toggle(p.user_id)} aria-label={`בחירת ${p.display_name}`} />
                  </td>
                  <td className="a-strong a-name" title={p.user_id}>
                    {p.display_name}
                  </td>
                  <td className="a-num" data-label="תאריך הצטרפות">
                    {dateText(p.first_seen_at)}
                  </td>
                  <td className="a-num" data-label="פעילות אחרונה">
                    <DateTime iso={p.last_seen_at} />
                  </td>
                  <td className="a-c a-num" data-label="שלב נוכחי" title={`${p.completed_levels_count} שלבים הושלמו`}>
                    {p.current_level || '–'}
                  </td>
                  <td className="a-c" data-label="השלמת משחק">
                    {p.game_completed ? 'כן' : 'לא'}
                  </td>
                  <td data-label="מכשיר">
                    <DeviceCell p={p} />
                  </td>
                  <td className="a-c a-status">
                    <StatusBadge s={status(p, now)} />
                  </td>
                </tr>
              ))}
              {!view.length && (
                <tr>
                  <td colSpan={8} className="a-empty">
                    {loading ? 'טוען…' : players.length ? 'אין שחקנים שמתאימים למסננים' : 'אין עדיין שחקנים'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="a-pager">
          <span className="a-muted a-small a-pager__info">
            מציג {num(from)}–{num(to)} מתוך {num(filtered.length)} שחקנים
          </span>
          <nav className="a-pager__pages" aria-label="עמודים">
            <button type="button" className="a-page a-page--arrow" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="העמוד הקודם">
              <IconChevronRight size={18} />
            </button>
            {pages(page, last).map((x, i) =>
              x === '…' ? (
                <span key={`e${i}`} className="a-page a-page--gap">
                  …
                </span>
              ) : (
                <button key={x} type="button" className="a-page" aria-current={x === page ? 'page' : undefined} onClick={() => setPage(x)}>
                  {x}
                </button>
              ),
            )}
            <button type="button" className="a-page a-page--arrow" disabled={page === last} onClick={() => setPage(page + 1)} aria-label="העמוד הבא">
              <IconChevronLeft size={18} />
            </button>
          </nav>
          <span className="a-pager__per">
            <span className="a-muted a-small">שורות בעמוד</span>
            <Dropdown
              label="שורות בעמוד"
              value={per}
              options={[10, 25, 50, 100].map((n) => ({ value: n, label: String(n) }))}
              onChange={setPer}
              className="a-dd--small"
              menuAlign="end"
            />
          </span>
        </footer>
      </Card>
    </>
  );
}
