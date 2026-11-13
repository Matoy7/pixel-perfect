import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type React from 'react';
import { ExtendedArt } from '../ui/ExtendedArt';
import { boxToPercent } from '../ui/geometry';
import { clientToSource, isHit } from '../game/hitTest';
import { PIXEL_COLOR, pixelBox, type PuzzleConfig } from '../game/levels';
import './puzzle.css';

const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;
const TAP_SLOP = 10; // px of movement that turns a tap into a pan
const TAP_MAX_MS = 400;
const DOUBLE_TAP_MS = 320;
const BURST_MS = 650; // success animation length before onFound fires
const FRAGMENTS = 10;

type View = { s: number; tx: number; ty: number };
type Pt = { x: number; y: number };

type Props = {
  config: PuzzleConfig;
  /**
   * Arrive zoomed in on the pixel at this scale and pull back to the full
   * scene (the hand-off from the story). Input is ignored until it settles.
   */
  intro?: { scale: number; ms: number; holdMs?: number };
  /**
   * Correct pixel tapped and the burst has played. `pixelRect` = where the
   * pixel was on screen (incl. zoom): the origin of the level transition.
   */
  onFound: (pixelRect: DOMRect) => void;
};

/**
 * The shared puzzle engine (tutorial + levels):
 * fit-to-screen art, pinch / double-tap zoom and pan, tap-vs-gesture
 * detection, hit testing in source-image px (min 32 CSS px target),
 * miss ripple, and the pixel burst on success.
 */
export function PuzzleScene({ config, intro, onFound }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pixelRef = useRef<HTMLDivElement>(null);
  const view = useRef<View>({ s: 1, tx: 0, ty: 0 });
  const interactive = useRef(!intro);
  const [found, setFound] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // ---- view transform ----------------------------------------------------
  const size = () => {
    const r = viewportRef.current!.getBoundingClientRect();
    return { w: r.width, h: r.height, left: r.left, top: r.top };
  };
  const clamp = (v: View): View => {
    const { w, h } = size();
    const s = Math.min(MAX_ZOOM, Math.max(1, v.s));
    return {
      s,
      tx: Math.min(0, Math.max(w * (1 - s), v.tx)),
      ty: Math.min(0, Math.max(h * (1 - s), v.ty)),
    };
  };
  const apply = (v: View, animateMs = 0) => {
    view.current = v;
    const el = zoomRef.current!;
    el.style.transition = animateMs ? `transform ${animateMs}ms cubic-bezier(0.3, 0.7, 0.4, 1)` : '';
    el.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.s})`;
  };
  /** Scale to s keeping viewport point p (viewport coords) fixed. */
  const zoomAbout = (from: View, p: Pt, s: number): View => {
    const cx = (p.x - from.tx) / from.s;
    const cy = (p.y - from.ty) / from.s;
    return { s, tx: p.x - cx * s, ty: p.y - cy * s };
  };

  // ---- intro: arrive zoomed on the pixel, pull back -----------------------
  useLayoutEffect(() => {
    if (!intro) return;
    const stage = stageRef.current!.getBoundingClientRect();
    const vp = size();
    const k = stage.width / config.canvas.width;
    const box = pixelBox(config.pixel, k);
    const p = {
      x: stage.left - vp.left + (box.x + box.width / 2) * k,
      y: stage.top - vp.top + (box.y + box.height / 2) * k,
    };
    // geometric scale steps → constant-feeling zoom speed
    const N = 10;
    const frames = Array.from({ length: N + 1 }, (_, i) => {
      const s = Math.pow(intro.scale, 1 - i / N);
      return { transform: `translate(${p.x - s * p.x}px, ${p.y - s * p.y}px) scale(${s})` };
    });
    apply({ s: 1, tx: 0, ty: 0 });
    const anim = zoomRef.current!.animate(frames, {
      delay: intro.holdMs ?? 0, // held zoomed-in while the previous screen fades over it
      duration: intro.ms,
      easing: 'cubic-bezier(0.25, 0.6, 0.3, 1)',
      fill: 'backwards',
    });
    anim.finished.then(() => (interactive.current = true)).catch(() => {});
    return () => anim.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- success ------------------------------------------------------------
  useEffect(() => {
    if (!found) return;
    const rect = pixelRef.current!.getBoundingClientRect(); // container: unaffected by the burst
    const t = window.setTimeout(() => onFound(rect), BURST_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found]);

  // ---- gestures -------------------------------------------------------------
  const pointers = useRef(new Map<number, Pt>());
  const gesture = useRef<{
    start: Pt;
    t0: number;
    moved: boolean;
    multi: boolean;
    base: View; // view when the current pan/pinch began
    pinch?: { dist: number; mid: Pt };
  } | null>(null);
  const lastMiss = useRef<{ t: number; x: number; y: number } | null>(null);

  const local = (e: React.PointerEvent): Pt => {
    const { left, top } = size();
    return { x: e.clientX - left, y: e.clientY - top };
  };
  const pinchInfo = () => {
    const [a, b] = [...pointers.current.values()];
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    if (pointers.current.size === 1) {
      gesture.current = { start: p, t0: performance.now(), moved: false, multi: false, base: view.current };
    } else if (pointers.current.size === 2 && gesture.current) {
      gesture.current.multi = true;
      gesture.current.base = view.current;
      gesture.current.pinch = pinchInfo();
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (!interactive.current || found) return;

    if (pointers.current.size >= 2 && g.pinch) {
      const now = pinchInfo();
      const s = Math.min(MAX_ZOOM, Math.max(1, (g.base.s * now.dist) / g.pinch.dist));
      // the content point under the starting midpoint follows the fingers
      const cx = (g.pinch.mid.x - g.base.tx) / g.base.s;
      const cy = (g.pinch.mid.y - g.base.ty) / g.base.s;
      apply(clamp({ s, tx: now.mid.x - cx * s, ty: now.mid.y - cy * s }));
      return;
    }
    const dx = p.x - g.start.x;
    const dy = p.y - g.start.y;
    if (!g.moved && Math.hypot(dx, dy) > TAP_SLOP) g.moved = true;
    if (g.moved && view.current.s > 1) {
      apply(clamp({ s: g.base.s, tx: g.base.tx + dx, ty: g.base.ty + dy }));
    }
  };

  const endPointer = (e: React.PointerEvent, cancelled: boolean) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (!g) return;
    if (pointers.current.size === 1) {
      // pinch → one finger left: continue as a pan from here, never a tap
      const [rest] = [...pointers.current.values()];
      gesture.current = { start: rest, t0: g.t0, moved: true, multi: true, base: view.current };
      return;
    }
    if (pointers.current.size === 0) {
      gesture.current = null;
      const isTap = !cancelled && !g.moved && !g.multi && performance.now() - g.t0 < TAP_MAX_MS;
      if (isTap) handleTap(p, e.clientX, e.clientY);
    }
  };

  const handleTap = (p: Pt, clientX: number, clientY: number) => {
    if (!interactive.current || found) return;
    const stage = stageRef.current!.getBoundingClientRect();
    const src = clientToSource({ x: clientX, y: clientY }, stage, config.canvas.width);
    const atFit = src.k / view.current.s; // CSS px per source px with no zoom
    if (isHit(src, pixelBox(config.pixel, atFit), src.k)) {
      setFound(true);
      return;
    }
    // miss: gentle ripple, no penalty. A second miss-tap nearby = double-tap zoom.
    const now = performance.now();
    const prev = lastMiss.current;
    if (prev && now - prev.t < DOUBLE_TAP_MS && Math.hypot(prev.x - p.x, prev.y - p.y) < 30) {
      lastMiss.current = null;
      const target = view.current.s < 1.5 ? DOUBLE_TAP_ZOOM : 1;
      apply(clamp(zoomAbout(view.current, p, target)), 280);
      return;
    }
    lastMiss.current = { t: now, x: p.x, y: p.y };
    const id = now;
    setRipples((r) => [...r, { id, x: p.x, y: p.y }]);
    window.setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 520);
  };

  // ---- render ---------------------------------------------------------------
  // 'box': source-px box in canvas %. 'css': centred point, fixed CSS size
  // (inside the stage, so at fit it is exactly that size and it zooms with the art)
  const pixelPos: React.CSSProperties =
    config.pixel.kind === 'box'
      ? boxToPercent(config.pixel.box, config.canvas)
      : {
          left: `calc(${(config.pixel.center.x / config.canvas.width) * 100}% - ${config.pixel.size / 2}px)`,
          top: `calc(${(config.pixel.center.y / config.canvas.height) * 100}% - ${config.pixel.size / 2}px)`,
          width: config.pixel.size,
          height: config.pixel.size,
        };
  return (
    <div
      ref={viewportRef}
      className={`puzzle${found ? ' puzzle--found' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => endPointer(e, false)}
      onPointerCancel={(e) => endPointer(e, true)}
    >
      <div ref={zoomRef} className="puzzle__zoom">
        <ExtendedArt
          ref={stageRef}
          src={config.image}
          extTop={config.extTop}
          extBottom={config.extBottom}
          canvas={config.canvas}
          featherTop={config.feather}
          featherBottom={config.feather}
        >
          {/* revealed under the burst: the art without its pixel */}
          <img className="puzzle__clean" src={config.imageClean} alt="" draggable={false} />
          <div ref={pixelRef} className="puzzle__pixel" style={{ ...pixelPos, ['--pixel-color' as string]: PIXEL_COLOR }}>
            <div className="puzzle__pixel-core" />
            {found &&
              Array.from({ length: FRAGMENTS }, (_, i) => {
                const a = i * 2.39996 + 0.4; // golden angle: even, organic spread
                const d = 95 + ((i * 37) % 70); // % of the pixel size
                return (
                  <span
                    key={i}
                    className="puzzle__frag"
                    style={
                      {
                        '--dx': `${Math.cos(a) * d}cqw`,
                        '--dy': `${Math.sin(a) * d}cqw`,
                        '--rot': `${((i * 53) % 90) - 45}deg`,
                        '--size': `${22 + ((i * 7) % 3) * 6}cqw`,
                      } as React.CSSProperties
                    }
                  />
                );
              })}
          </div>
        </ExtendedArt>
      </div>
      <div className="puzzle__dim" />
      {ripples.map((r) => (
        <span key={r.id} className="puzzle__ripple" style={{ left: r.x, top: r.y }} />
      ))}
    </div>
  );
}
