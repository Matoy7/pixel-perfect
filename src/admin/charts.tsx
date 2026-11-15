/** Plain SVG / HTML charts (no chart library). Single purple hue, numbers visible, hover tooltips. */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { pct, num, type LevelProgress, type Family, FAMILY_LABEL, timeText, dateText } from './data';

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

/** Shades by size: the biggest platform is the darkest; "אחר" is always grey. */
const SHADES = ['#6232dc', '#a77ff9', '#cbb2fc', '#e3d6fe'];
const OTHER = '#e6e4ef';
export const donutColors = (list: { family: Family }[]) => {
  let k = 0;
  return list.map((s) => (s.family === 'other' ? OTHER : SHADES[Math.min(k++, SHADES.length - 1)]));
};

export function Donut({ total, list }: { total: number; list: { family: Family; n: number }[] }) {
  const [hover, setHover] = useState<Family | null>(null);
  const SIZE = 198;
  const W = 37;
  const R = SIZE / 2 - W / 2;
  const C = 2 * Math.PI * R;
  const gap = list.length > 1 ? 1.6 : 0; // white hairline between segments
  const colors = donutColors(list);
  let acc = 0;
  const segs = list.map((s, i) => {
    const len = (s.n / total) * C;
    const seg = { ...s, start: acc, len, color: colors[i] };
    acc += len;
    return seg;
  });
  const hv = list.find((s) => s.family === hover);
  return (
    <div className="o-donut" dir="ltr">
      <div className="o-donut__chart">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} role="img" aria-label={`${total} מכשירים`}>
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {segs.map((s) => (
              <circle
                key={s.family}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={W}
                strokeDasharray={`${Math.max(0.1, s.len - gap)} ${C}`}
                strokeDashoffset={-s.start}
                opacity={hover && hover !== s.family ? 0.55 : 1}
                onPointerEnter={() => setHover(s.family)}
                onPointerLeave={() => setHover(null)}
                style={{ transition: 'opacity .15s' }}
              />
            ))}
          </g>
        </svg>
        <div className="o-donut__center" dir="rtl">
          <b>{num(hv ? hv.n : total)}</b>
          <span>{hv ? FAMILY_LABEL[hv.family] : 'מכשירים'}</span>
        </div>
      </div>
      <ul className="o-legend">
        {segs.map((s) => (
          <li
            key={s.family}
            className={hover === s.family ? 'is-hover' : ''}
            onPointerEnter={() => setHover(s.family)}
            onPointerLeave={() => setHover(null)}
          >
            <i style={{ background: s.color }} />
            <span className="o-legend__name">{FAMILY_LABEL[s.family]}</span>
            <b className="o-legend__n">{num(s.n)}</b>
            <span className="o-legend__pct">({pct(s.n / total)})</span>
          </li>
        ))}
      </ul>
    </div>
  );
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


// ---------------------------------------------------------------------------
// Hero sparkline (white on purple)
// ---------------------------------------------------------------------------

export function Sparkline({ points, unit }: { points: number[]; unit: 'hour' | 'day' }) {
  const [ref, { w: W, h: H }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const n = points.length;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const padT = 2; // the end dot may overflow the box (svg overflow is visible)
  const padR = 0;
  const x = (i: number) => (n > 1 ? (i / (n - 1)) * (W - padR) : 0);
  const y = (v: number) => (max === min ? H * 0.55 : padT + (1 - (v - min) / (max - min)) * (H - padT));
  const pts = points.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = smooth(pts);
  const area = n ? `${line} L${pts[n - 1][0]},${H} L${pts[0][0]},${H} Z` : '';
  const hi = hover ?? n - 1;
  const step = unit === 'hour' ? 3600e3 : 86400e3;
  const at = new Date(Date.now() - (n - 1 - hi) * step).toISOString();
  return (
    <div className="o-spark" ref={ref}>
      {W > 0 && n > 0 && (
        <svg
          width={W}
          height={H}
          role="img"
          aria-label="גידול במספר השחקנים"
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const i = Math.round(((e.clientX - r.left) / (W - padR)) * (n - 1));
            setHover(Math.max(0, Math.min(n - 1, i)));
          }}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="o-spark-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.26" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.12" />
            </linearGradient>
            <filter id="o-spark-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <path d={area} fill="url(#o-spark-fill)" />
          <path d={line} fill="none" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" />
          {hover !== null && <line x1={x(hi)} x2={x(hi)} y1={y(points[hi])} y2={H} stroke="#fff" strokeOpacity=".5" strokeDasharray="3 3" />}
          <circle cx={x(hi)} cy={y(points[hi])} r="9" fill="#fff" opacity=".45" filter="url(#o-spark-glow)" />
          <circle cx={x(hi)} cy={y(points[hi])} r="7.5" fill="#fff" />
        </svg>
      )}
      {hover !== null && W > 0 && (
        <Tip x={Math.min(W - 70, Math.max(70, x(hi)))} y={y(points[hi]) - 6}>
          <b>{num(points[hi])} שחקנים</b>
          <span dir="ltr">{unit === 'hour' ? `${timeText(at)}, ${dateText(at)}` : dateText(at)}</span>
        </Tip>
      )}
    </div>
  );
}
