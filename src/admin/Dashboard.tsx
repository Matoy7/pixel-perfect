import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SleepingCat } from './Cat';
import { Overview } from './Overview';
import { Players } from './Players';
import { Dropdown } from './ui';
import { IconCalendar, IconGamepad, IconGrid, IconLogout, IconRefresh, IconUser, IconUsers } from './icons';
import { RANGES, num, timeText, useAdminData, type Range } from './data';

type Page = 'overview' | 'players';
const pageFromHash = (): Page => (location.hash === '#players' ? 'players' : 'overview');

const NAV: { page: Page; label: string; icon: ReactNode }[] = [
  { page: 'overview', label: 'סקירה כללית', icon: <IconGrid /> },
  { page: 'players', label: 'שחקנים', icon: <IconUsers /> },
];

export function Brand() {
  return (
    <div className="a-brand">
      <span className="a-brand__logo">
        <IconGamepad size={24} />
      </span>
      <span className="a-brand__text">
        <b dir="ltr">PIXEL PERFECT</b>
        <span>ניהול המשחק</span>
      </span>
    </div>
  );
}

export function Dashboard({ sb, email, onSignOut }: { sb: SupabaseClient; email: string; onSignOut: () => void }) {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [range, setRange] = useState<Range>(24);
  const { data, error, loading, loadedAt, reload } = useAdminData(sb, range);

  useEffect(() => {
    const on = () => {
      setPage(pageFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const controls = (
    <>
      <button
        type="button"
        className={`a-icon-btn${loading ? ' is-busy' : ''}`}
        onClick={() => void reload()}
        disabled={loading}
        aria-label="רענון נתונים"
        title={loadedAt ? `רענון · עודכן ב-${timeText(loadedAt.toISOString())}` : 'רענון'}
      >
        <IconRefresh />
      </button>
      <Account email={email} onSignOut={onSignOut} />
    </>
  );

  return (
    <div className="a-shell">
      <aside className="a-side">
        <Brand />
        <nav className="a-nav" aria-label="ניווט">
          {NAV.map((n) => (
            <a key={n.page} href={n.page === 'overview' ? '#' : '#players'} className="a-nav__item" aria-current={page === n.page ? 'page' : undefined}>
              {n.icon}
              <span>{n.label}</span>
            </a>
          ))}
        </nav>
        <SleepingCat />
      </aside>

      <main className="a-main">
        <header className="a-head">
          <div className="a-head__titles">
            <h1 className="a-h1">{page === 'overview' ? 'סקירה כללית' : 'שחקנים'}</h1>
            <p className="a-sub">
              {page === 'overview' ? (
                <>
                  תמונת מצב של המשחק <span dir="ltr">PIXEL PERFECT</span>
                </>
              ) : (
                `כל השחקנים במשחק (${num(data.overview?.total_players ?? data.players.length)})`
              )}
            </p>
          </div>
          <div className="a-head__controls">
            {page === 'overview' && (
              <Dropdown label="טווח זמן" value={range} options={RANGES} onChange={setRange} className="a-dd--range" menuAlign="end">
                <IconCalendar size={18} />
                <span>{RANGES.find((r) => r.value === range)!.label}</span>
              </Dropdown>
            )}
            {controls}
          </div>
        </header>

        {error && <p className="a-error">שגיאה בטעינת הנתונים: {error}</p>}

        {page === 'overview' ? <Overview data={data} range={range} loading={loading} /> : <Players data={data} loading={loading} />}
      </main>
    </div>
  );
}

function Account({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  return (
    <div className="a-account" ref={ref}>
      <button type="button" className="a-icon-btn" aria-label="חשבון" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <IconUser />
      </button>
      {open && (
        <div className="a-menu" role="menu">
          <div className="a-menu__who">
            <span className="a-muted a-small">מחובר כמנהל</span>
            <span dir="ltr">{email}</span>
          </div>
          <button type="button" role="menuitem" onClick={onSignOut}>
            <IconLogout size={18} /> התנתקות
          </button>
        </div>
      )}
    </div>
  );
}
