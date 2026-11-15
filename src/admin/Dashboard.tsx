import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SleepingCat } from './Cat';
import { Overview } from './Overview';
import { Players } from './Players';
import { Dropdown } from './ui';
import { IconBell, IconCalendar, IconChevronRight, IconGamepadSolid, IconGrid, IconLogout, IconRefresh, IconTrophy, IconUser, IconUsers } from './icons';
import { RANGES, DateTime, num, timeText, useAdminData, type Player, type Range } from './data';

type Page = 'overview' | 'players';
const pageFromHash = (): Page => (location.hash === '#players' ? 'players' : 'overview');

const NAV: { page: Page; label: string; icon: ReactNode }[] = [
  { page: 'overview', label: 'סקירה כללית', icon: <IconGrid /> },
  { page: 'players', label: 'שחקנים', icon: <IconUsers /> },
];

const store = {
  get(k: string) {
    try {
      return localStorage.getItem(`pixel-perfect:admin:${k}`);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(`pixel-perfect:admin:${k}`, v);
    } catch {
      /* private mode: fine */
    }
  },
};

export function Brand() {
  return (
    <div className="a-brand">
      <span className="a-brand__logo">
        <IconGamepadSolid size={34} />
      </span>
      <span className="a-brand__text">
        <b dir="ltr">PIXEL PERFECT</b>
        <span>ניהול המשחק</span>
      </span>
    </div>
  );
}

/** Close a popover on outside click / Escape. */
function usePopover() {
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
  return { open, setOpen, ref };
}

export function Dashboard({ sb, email, onSignOut }: { sb: SupabaseClient; email: string; onSignOut: () => void }) {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [range, setRange] = useState<Range>(24);
  const [collapsed, setCollapsed] = useState(() => store.get('sidebar') === 'collapsed');
  const { data, error, loading, loadedAt, reload } = useAdminData(sb, range);

  useEffect(() => {
    const on = () => {
      setPage(pageFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const toggleSidebar = () =>
    setCollapsed((c) => {
      store.set('sidebar', c ? 'open' : 'collapsed');
      return !c;
    });

  return (
    <div className={`a-shell${collapsed ? ' is-collapsed' : ''}`}>
      <aside className="a-side">
        <Brand />
        <nav className="a-nav" aria-label="ניווט">
          {NAV.map((n) => (
            <a
              key={n.page}
              href={n.page === 'overview' ? '#' : '#players'}
              className="a-nav__item"
              aria-current={page === n.page ? 'page' : undefined}
              title={collapsed ? n.label : undefined}
            >
              {n.icon}
              <span>{n.label}</span>
            </a>
          ))}
        </nav>
        <SleepingCat />
      </aside>

      <main className="a-main">
        <header className="a-head">
          <button
            type="button"
            className="a-collapse"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'הרחבת התפריט' : 'כיווץ התפריט'}
            aria-expanded={!collapsed}
          >
            <IconChevronRight size={18} />
          </button>
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
                <IconCalendar size={22} className="a-dd__cal" />
                <span>{RANGES.find((r) => r.value === range)!.label}</span>
              </Dropdown>
            )}
            <Updates players={data.players} />
            <Account
              email={email}
              onSignOut={onSignOut}
              onRefresh={() => void reload()}
              loading={loading}
              loadedAt={loadedAt}
            />
          </div>
        </header>

        {error && <p className="a-error">שגיאה בטעינת הנתונים: {error}</p>}

        {page === 'overview' ? <Overview data={data} range={range} loading={loading} /> : <Players data={data} loading={loading} />}
      </main>
    </div>
  );
}

/** Bell: players who finished the game and new players, from the loaded data. */
function Updates({ players }: { players: Player[] }) {
  const { open, setOpen, ref } = usePopover();
  const [seen, setSeen] = useState(() => Number(store.get('updates-seen') ?? 0));
  const { done, fresh, latest } = useMemo(() => {
    const week = Date.now() - 7 * 86400e3;
    const day = Date.now() - 86400e3;
    const done = players
      .filter((p) => p.game_completed_at && new Date(p.game_completed_at).getTime() > week)
      .sort((a, b) => b.game_completed_at!.localeCompare(a.game_completed_at!));
    const fresh = players.filter((p) => new Date(p.first_seen_at).getTime() > day).length;
    const latest = done.length ? new Date(done[0].game_completed_at!).getTime() : 0;
    return { done, fresh, latest };
  }, [players]);
  const unseen = latest > seen;
  return (
    <div className="a-account" ref={ref}>
      <button
        type="button"
        className="a-icon-btn"
        aria-label={unseen ? 'עדכונים (חדשים)' : 'עדכונים'}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          if (latest) {
            setSeen(latest);
            store.set('updates-seen', String(latest));
          }
        }}
      >
        <IconBell size={24} />
        {unseen && <i className="a-icon-btn__dot" />}
      </button>
      {open && (
        <div className="a-menu a-menu--updates" role="dialog" aria-label="עדכונים">
          <div className="a-menu__title">עדכונים</div>
          <div className="a-menu__line">
            <IconUsers size={18} />
            <span>
              {num(fresh)} שחקנים חדשים ב-24 השעות האחרונות
            </span>
          </div>
          {done.slice(0, 6).map((p) => (
            <div key={p.user_id} className="a-menu__line">
              <IconTrophy size={18} />
              <span className="a-menu__text">
                <span>
                  <b>{p.display_name}</b> סיים/ה את המשחק
                </span>
                <span className="a-muted a-small">
                  <DateTime iso={p.game_completed_at!} />
                </span>
              </span>
            </div>
          ))}
          {!done.length && <div className="a-menu__line a-muted">אין סיומי משחק בשבוע האחרון</div>}
        </div>
      )}
    </div>
  );
}

function Account({
  email,
  onSignOut,
  onRefresh,
  loading,
  loadedAt,
}: {
  email: string;
  onSignOut: () => void;
  onRefresh: () => void;
  loading: boolean;
  loadedAt: Date | null;
}) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="a-account" ref={ref}>
      <button type="button" className="a-icon-btn" aria-label="חשבון" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <IconUser size={24} />
      </button>
      {open && (
        <div className="a-menu" role="menu">
          <div className="a-menu__who">
            <span className="a-muted a-small">מחובר כמנהל</span>
            <span dir="ltr">{email}</span>
          </div>
          <button type="button" role="menuitem" onClick={onRefresh} disabled={loading}>
            <IconRefresh size={18} className={loading ? 'a-spin' : ''} /> רענון נתונים
            {loadedAt && <span className="a-muted a-small a-menu__meta">עודכן {timeText(loadedAt.toISOString())}</span>}
          </button>
          <button type="button" role="menuitem" onClick={onSignOut}>
            <IconLogout size={18} /> התנתקות
          </button>
        </div>
      )}
    </div>
  );
}
