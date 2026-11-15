/** Plain SVG / HTML charts (no chart library). Single purple hue, numbers visible, hover tooltips. */
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { pct, num, type LevelProgress, type Family, FAMILY_LABEL, timeText, dateText, type Activity } from './data';

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(read);
    ro.observe(el);
    read();
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

function Tip({ x, y, children, below = false }: { x: number; y: number; children: ReactNode; below?: boolean }) {
  return (
    <div className={`a-tip${below ? ' a-tip--below' : ''}`} style={{ left: x, top: y }} role="tooltip">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// התקדמות השחקנים לפי שלב
// ---------------------------------------------------------------------------

export function LevelBars({ rows }: { rows: LevelProgress[] }) {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const h = hover && rows[hover.i];
  return (
    <div className="a-lvl" ref={box} onPointerLeave={() => setHover(null)}>
      {rows.map((r, i) => (
        <div
          key={r.level}
          className={`a-lvl__row${hover?.i === i ? ' is-hover' : ''}`}
          onPointerMove={(e) => {
            const b = box.current!.getBoundingClientRect();
            setHover({ i, x: e.clientX - b.left, y: e.currentTarget.offsetTop });
          }}
          aria-label={`שלב ${r.level}: ${pct(r.reached)} מהשחקנים הגיעו`}
        >
          <span className="a-lvl__name">שלב {r.level}</span>
          <span className="a-lvl__track">
            <span className="a-lvl__fill" style={{ width: `${r.reached * 100}%` }} />
          </span>
          <span className="a-lvl__pct">{pct(r.reached)}</span>
        </div>
      ))}
      {h && hover && (
        <Tip x={hover.x} y={hover.y}>
          <b>
            שלב {h.level} · {h.place}
          </b>
          <span>
            הגיעו לשלב: {num(h.started)} ({pct(h.reached)})
          </span>
          <span>סיימו: {num(h.completed)}</span>
          <span>השלמה: {h.rate === null ? '–' : pct(h.rate)}</span>
          {h.drop !== null && <span>נשירה לשלב הבא: {pct(h.drop)}</span>}
        </Tip>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// מכשירים ופלטפורמות
// ---------------------------------------------------------------------------

export const FAMILY_COLOR: Record<Family, string> = {
  ios: '#6a3fe6',
  windows: '#8c6cf0',
  android: '#ae97f5',
  mac: '#d3c7fa',
  other: '#dfe2ea',
};

export function Donut({ total, list }: { total: number; list: { family: Family; n: number }[] }) {
  const [hover, setHover] = useState<Family | null>(null);
  const R = 58;
  const W = 22;
  const C = 2 * Math.PI * R;
  const gap = list.length > 1 ? 2.5 : 0; // surface gap between segments (px along the ring)
  let acc = 0;
  const segs = list.map((s) => {
    const len = (s.n / total) * C;
    const seg = { ...s, start: acc, len };
    acc += len;
    return seg;
  });
  const hv = list.find((s) => s.family === hover);
  return (
    <div className="a-donut">
      <ul className="a-legend">
        {list.map((s) => (
          <li
            key={s.family}
            className={hover === s.family ? 'is-hover' : ''}
            onPointerEnter={() => setHover(s.family)}
            onPointerLeave={() => setHover(null)}
          >
            <span className="a-legend__count" dir="ltr">
              {num(s.n)} <span className="a-muted">({pct(s.n / total)})</span>
            </span>
            <span className="a-legend__name" dir="ltr">
              <i style={{ background: FAMILY_COLOR[s.family] }} />
              {FAMILY_LABEL[s.family]}
            </span>
          </li>
        ))}
      </ul>
      <div className="a-donut__chart">
        <svg viewBox="0 0 150 150" width="150" height="150" role="img" aria-label={`${total} מכשירים`}>
          <g transform="rotate(-90 75 75)">
            {segs.map((s) => (
              <circle
                key={s.family}
                cx="75"
                cy="75"
                r={R}
                fill="none"
                stroke={FAMILY_COLOR[s.family]}
                strokeWidth={hover === s.family ? W + 4 : W}
                strokeDasharray={`${Math.max(0.1, s.len - gap)} ${C}`}
                strokeDashoffset={-s.start}
                onPointerEnter={() => setHover(s.family)}
                onPointerLeave={() => setHover(null)}
                style={{ transition: 'stroke-width .15s' }}
              />
            ))}
          </g>
        </svg>
        <div className="a-donut__center">
          {hv ? (
            <>
              <b>{num(hv.n)}</b>
              <span>{FAMILY_LABEL[hv.family]}</span>
            </>
          ) : (
            <>
              <b>{num(total)}</b>
              <span>מכשירים</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// פעילות שחקנים לאורך זמן
// ---------------------------------------------------------------------------

/** 0, 50, 100… — round step that gives ~4 intervals */
function niceMax(max: number) {
  if (max <= 4) return { top: 4, step: 1 };
  const raw = max / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw)!;
  return { top: Math.ceil(max / step) * step, step };
}

/** monotone cubic path (no overshoot below 0) */
function smooth(pts: [number, number][]) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
  const n = pts.length;
  const d: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  let path = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = (x1 - x0) / 3;
    path += ` C${x0 + h},${y0 + m[i] * h} ${x1 - h},${y1 - m[i + 1] * h} ${x1},${y1}`;
  }
  return path;
}

export function AreaChart({ activity }: { activity: Activity }) {
  const [ref, { w: width, h: boxH }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const s = activity.series;
  const H = Math.max(160, Math.min(320, boxH)); // fills the card, which matches its row neighbour
  const padL = 34;
  const padR = 14;
  const padT = 14;
  const padB = 26;
  const W = Math.max(240, width);
  const { top, step } = useMemo(() => niceMax(Math.max(0, ...s.map((p) => p.players))), [s]);
  const x = (i: number) => padL + (s.length > 1 ? (i / (s.length - 1)) * (W - padL - padR) : 0);
  const y = (v: number) => padT + (1 - v / top) * (H - padT - padB);
  const pts = s.map((p, i) => [x(i), y(p.players)] as [number, number]);
  const line = smooth(pts);
  const area = pts.length ? `${line} L${pts[pts.length - 1][0]},${y(0)} L${pts[0][0]},${y(0)} Z` : '';
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);

  // x labels: every 3 hours / every day (7) / every 5 days (30)
  const every = activity.unit === 'hour' ? 3 : s.length > 10 ? 5 : 1;
  const label = (t: string) => (activity.unit === 'hour' ? timeText(t) : dateText(t).slice(0, 5));
  const labelled = s.map((_, i) => i).filter((i) => (s.length - 1 - i) % every === 0);

  // highlighted point: hovered, else the latest
  const hi = hover ?? s.length - 1;
  const hp = s[hi];
  const when = (t: string) => {
    if (activity.unit === 'day') return dateText(t);
    const end = new Date(new Date(t).getTime() + 3600e3).toISOString();
    return `${timeText(t)}–${timeText(end)}`;
  };

  return (
    <div className="a-area" ref={ref} dir="ltr">
      {width > 0 && (
        <svg
          width={W}
          height={H}
          role="img"
          aria-label="שחקנים פעילים לאורך זמן"
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const px = e.clientX - r.left;
            const i = Math.round(((px - padL) / (W - padL - padR)) * (s.length - 1));
            setHover(Math.max(0, Math.min(s.length - 1, i)));
          }}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="a-area-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#7047eb" stopOpacity="0.28" />
              <stop offset="1" stopColor="#7047eb" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="a-area__grid" />
              <text x={padL - 10} y={y(t)} className="a-area__ytick" textAnchor="end" dominantBaseline="middle">
                {t}
              </text>
            </g>
          ))}
          {labelled.map((i) => (
            <text key={i} x={x(i)} y={H - 6} className="a-area__xtick" textAnchor="middle">
              {label(s[i].t)}
            </text>
          ))}
          <path d={area} fill="url(#a-area-fill)" />
          <path d={line} className="a-area__line" />
          {hp && (
            <>
              {hover !== null && <line x1={x(hi)} x2={x(hi)} y1={padT} y2={y(0)} className="a-area__cross" />}
              <circle cx={x(hi)} cy={y(hp.players)} r="5" className="a-area__dot" />
            </>
          )}
        </svg>
      )}
      {hp && width > 0 && (
        <div
          className={`a-area__pill${hover !== null ? ' is-hover' : ''}`}
          style={{ left: Math.min(W - 40, Math.max(40, x(hi))), top: y(hp.players) - 12 }}
          dir="rtl"
        >
          {hover !== null ? (
            <>
              <b>{num(hp.players)}</b> שחקנים · <span dir="ltr">{when(hp.t)}</span>
            </>
          ) : (
            num(hp.players)
          )}
        </div>
      )}
    </div>
  );
}
