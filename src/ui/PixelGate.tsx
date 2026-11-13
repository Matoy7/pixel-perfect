import { useLayoutEffect, useRef } from 'react';
import './pixel-gate.css';

/**
 * Signature transition between puzzles: the discovered pixel becomes a gateway.
 *
 *  'cover'  – a crisp black square starts exactly on the found pixel (its
 *             on-screen rect, so zoom / fit / screen size are all accounted
 *             for), pulses once, then scales up until it covers the screen.
 *             → onCovered(): the parent swaps the screen underneath.
 *  'reveal' – the black screen breaks into a grid of square "pixels" that
 *             switch off outward from the same origin, revealing the next art.
 *             → onRevealed()
 */
export type GateOrigin = { x: number; y: number; size: number };

type Props = {
  phase: 'cover' | 'reveal';
  origin: GateOrigin;
  onCovered: () => void;
  onRevealed: () => void;
};

const PULSE_MS = 220;
const COVER_MS = 620;
const CELLS_ACROSS = 9;
const REVEAL_SPREAD_MS = 420;
const CELL_FADE_MS = 200;

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function PixelGate({ phase, origin, onCovered, onRevealed }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const squareRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // ---- cover: pulse, then expand from the pixel ---------------------------
  useLayoutEffect(() => {
    if (phase !== 'cover') return;
    const el = squareRef.current!;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // half-size needed to cover the viewport from this centre
    const half = Math.max(origin.x, vw - origin.x, origin.y, vh - origin.y) + 2;
    const sEnd = (2 * half) / origin.size;
    if (reduced()) {
      el.style.transform = `scale(${sEnd})`;
      const a = rootRef.current!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: 'both' });
      a.finished.then(onCovered).catch(() => {});
      return () => a.cancel();
    }
    // geometric steps: a constant-feeling "camera dive" into the pixel
    const N = 12;
    const frames: Keyframe[] = [
      { transform: 'scale(1)', offset: 0 },
      { transform: 'scale(1.35)', offset: (PULSE_MS * 0.5) / (PULSE_MS + COVER_MS) },
      { transform: 'scale(1)', offset: PULSE_MS / (PULSE_MS + COVER_MS) },
    ];
    for (let i = 1; i <= N; i++) {
      const f = i / N;
      frames.push({
        transform: `scale(${Math.pow(sEnd, f)})`,
        offset: (PULSE_MS + COVER_MS * (f * f * (3 - 2 * f))) / (PULSE_MS + COVER_MS),
      });
    }
    const a = el.animate(frames, { duration: PULSE_MS + COVER_MS, fill: 'both', easing: 'linear' });
    a.finished.then(onCovered).catch(() => {});
    return () => a.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ---- reveal: square cells switch off outward from the origin ------------
  useLayoutEffect(() => {
    if (phase !== 'reveal') return;
    const grid = gridRef.current!;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cell = Math.ceil(vw / CELLS_ACROSS);
    const cols = Math.ceil(vw / cell);
    const rows = Math.ceil(vh / cell);
    const maxD = Math.hypot(Math.max(origin.x, vw - origin.x), Math.max(origin.y, vh - origin.y));
    const anims: Animation[] = [];
    const frag = document.createDocumentFragment();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const d = document.createElement('div');
        d.className = 'gate__cell';
        d.style.left = `${c * cell}px`;
        d.style.top = `${r * cell}px`;
        d.style.width = `${cell + 1}px`; // 1px overlap: no seams between cells
        d.style.height = `${cell + 1}px`;
        frag.appendChild(d);
        const dist = Math.hypot(c * cell + cell / 2 - origin.x, r * cell + cell / 2 - origin.y) / maxD;
        // deterministic jitter so the edge reads as pixels, not a circle
        const jitter = (((r * 7 + c * 13) % 10) / 10) * 90;
        const delay = reduced() ? 0 : dist * REVEAL_SPREAD_MS + jitter;
        anims.push(
          d.animate([{ opacity: 1 }, { opacity: 0 }], {
            delay,
            duration: reduced() ? 250 : CELL_FADE_MS,
            easing: 'ease-out',
            fill: 'both',
          }),
        );
      }
    }
    grid.appendChild(frag);
    let alive = true;
    Promise.all(anims.map((a) => a.finished))
      .then(() => alive && onRevealed())
      .catch(() => {});
    return () => {
      alive = false;
      anims.forEach((a) => a.cancel());
      grid.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div ref={rootRef} className={`gate gate--${phase}`} aria-hidden="true">
      {phase === 'cover' && (
        <div
          ref={squareRef}
          className="gate__square"
          style={{
            left: origin.x - origin.size / 2,
            top: origin.y - origin.size / 2,
            width: origin.size,
            height: origin.size,
          }}
        />
      )}
      <div ref={gridRef} className="gate__grid" />
    </div>
  );
}
