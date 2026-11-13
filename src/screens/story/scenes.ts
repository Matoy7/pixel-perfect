import { asset } from '../../app/asset';
import { TUTORIAL, pixelBox } from '../../game/levels';
import { stageLayout } from '../../ui/stageLayout';
import { HANDOFF_SCALE, HANDOFF_ZOOM_MS } from '../tutorial/handoff';

/** All story art is 942x1670 (≈9:16). */
export const STORY_CANVAS = { width: 942, height: 1670 } as const;

type Pt = { x: number; y: number };

/** Clock centre (same spot in scenes 1 and 2), source px. */
export const CLOCK_CENTER: Pt = { x: 155.5, y: 549 };
/** Centre of the monitor's screen in scene 5 (where the black pixel is). */
export const SCREEN_CENTER: Pt = { x: 463, y: 879 };
/** The black pixel on the monitor in scene 5 (source px); drawn as a crisp #000 square. */
export const STORY_PIXEL = { x: 463, y: 826, width: 13, height: 13 } as const;

/** Each picture is held for 2.5s. */
export const HOLD_MS = 2500;

// Clock close-up between scene 1 and 2
export const CLOCK_ZOOM = 3; // close-up scale
export const CLOCK_ZOOM_MS = 900; // camera travel into / out of the clock
export const CLOCK_SPIN_MS = 1300; // hands go 9:00 → 10:00
export const CLOCK_HOLD_MS = 1600; // time spent in the close-up (incl. spin)

// Final long zoom into the computer screen
export const SCREEN_ZOOM = 2.35; // the screen fills the phone width
export const SCREEN_SETTLE_MS = 500;
export const SCREEN_ZOOM_MS = 2800;
export const SCREEN_END_HOLD_MS = 700;

/**
 * Camera language, resolved against the live layout in Shot:
 *   center(s)     – scale s about the screen centre (Ken Burns)
 *   focus(p, s)   – bring source point p to the screen centre at scale s
 */
/** Camera state: translate(tx, ty) scale(s), transform-origin 0 0. */
export type Cam = { tx: number; ty: number; s: number };

export type CameraCtx = {
  center: (s: number) => Cam;
  /** bring source point p to screen point `target` (default: screen centre) at scale s */
  focus: (p: Pt, s: number, target?: Pt) => Cam;
  /** source point → camera/screen px at rest */
  point: (p: Pt) => Pt;
  /** screen centre and size, CSS px per source px at rest */
  q: Pt;
  viewport: { width: number; height: number };
  k: number;
};
export type CameraKey = { t: number; cam: Cam; easing?: string };

export type Scene = {
  id: number;
  duration: number;
  /** Crossfade-in time from the previous shot (ms). */
  fadeIn: number;
  camera: (c: CameraCtx) => CameraKey[];
  /** Tiny hand-placed frame shift as the shot lands (stop-motion feel). */
  jitter: boolean;
};

const EASE = 'cubic-bezier(0.45, 0, 0.25, 1)';
/** Even, unhurried move for the long final zoom (ease-in-out sine). */
const LONG_EASE = 'cubic-bezier(0.37, 0, 0.63, 1)';

export const SCENES: Scene[] = [
  {
    // peaceful moment → slow push into the clock (hands spin 9:00 → 10:00)
    id: 1,
    duration: HOLD_MS + CLOCK_ZOOM_MS + CLOCK_HOLD_MS,
    fadeIn: 300,
    jitter: false,
    camera: (c) => [
      { t: 0, cam: c.center(1) },
      { t: HOLD_MS, cam: c.center(1.03), easing: EASE },
      { t: HOLD_MS + CLOCK_ZOOM_MS, cam: c.focus(CLOCK_CENTER, CLOCK_ZOOM) },
      { t: HOLD_MS + CLOCK_ZOOM_MS + CLOCK_HOLD_MS, cam: c.focus(CLOCK_CENTER, CLOCK_ZOOM) },
    ],
  },
  {
    // opens on its own clock (10:00) and pulls back: Pigmi spots the yarn
    id: 2,
    duration: CLOCK_ZOOM_MS + HOLD_MS,
    fadeIn: 250,
    jitter: false,
    camera: (c) => [
      { t: 0, cam: c.focus(CLOCK_CENTER, CLOCK_ZOOM), easing: EASE },
      { t: CLOCK_ZOOM_MS, cam: c.center(1) },
      { t: CLOCK_ZOOM_MS + HOLD_MS, cam: c.center(1.025) },
    ],
  },
  {
    // close-up: wide eyes
    id: 3,
    duration: HOLD_MS,
    fadeIn: 220,
    jitter: true,
    camera: (c) => [
      { t: 0, cam: c.center(1.04) },
      { t: HOLD_MS, cam: c.center(1) },
    ],
  },
  {
    // the fight: camera still, only the cloud lives
    id: 4,
    duration: HOLD_MS,
    fadeIn: 120,
    jitter: true,
    camera: (c) => [
      { t: 0, cam: c.center(1) },
      { t: HOLD_MS, cam: c.center(1) },
    ],
  },
  {
    // "פיגמי! מה עשית?!" → long zoom into the computer screen, then on
    // through the pixel into the tutorial (see tutorial/handoff.ts)
    id: 5,
    duration: SCREEN_SETTLE_MS + SCREEN_ZOOM_MS + SCREEN_END_HOLD_MS + HANDOFF_ZOOM_MS,
    fadeIn: 260,
    jitter: true,
    camera: (c) => [
      { t: 0, cam: c.center(1) },
      { t: SCREEN_SETTLE_MS, cam: c.center(1), easing: LONG_EASE },
      { t: SCREEN_SETTLE_MS + SCREEN_ZOOM_MS, cam: c.focus(SCREEN_CENTER, SCREEN_ZOOM) },
      ...handoffKeys(c, SCREEN_SETTLE_MS + SCREEN_ZOOM_MS + SCREEN_END_HOLD_MS),
    ],
  },
];


/**
 * Zoom through the story pixel: keep the pixel under the camera while scaling
 * it up (geometric steps = steady zoom feel) and carry it to the exact screen
 * spot / size the jar's pixel will have when the tutorial takes over.
 */
function handoffKeys(c: CameraCtx, t0: number): CameraKey[] {
  const jar = stageLayout(TUTORIAL.canvas, c.viewport);
  const jp = pixelBox(TUTORIAL.pixel, jar.k);
  const target = jar.toScreen(jp.x + jp.width / 2, jp.y + jp.height / 2);
  const p = { x: STORY_PIXEL.x + STORY_PIXEL.width / 2, y: STORY_PIXEL.y + STORY_PIXEL.height / 2 };
  const sStart = SCREEN_ZOOM;
  const sEnd = (jp.width * jar.k * HANDOFF_SCALE) / (STORY_PIXEL.width * c.k);
  // where the pixel is on screen at the end of the screen zoom
  const pc = c.point(p);
  const sc = c.point(SCREEN_CENTER);
  const q0 = { x: c.q.x + sStart * (pc.x - sc.x), y: c.q.y + sStart * (pc.y - sc.y) };
  const N = 12;
  const keys: CameraKey[] = [{ t: t0, cam: c.focus(p, sStart, q0) }];
  for (let i = 1; i <= N; i++) {
    const f = i / N;
    const e = f * f * (3 - 2 * f); // smoothstep
    const s = sStart * Math.pow(sEnd / sStart, e);
    const q = { x: q0.x + (target.x - q0.x) * e, y: q0.y + (target.y - q0.y) * e };
    keys.push({ t: t0 + HANDOFF_ZOOM_MS * f, cam: c.focus(p, s, q) });
  }
  return keys;
}

export const sceneArt = (id: number) => ({
  src: asset(`assets/story/scene-${id}.webp`),
  extTop: asset(`assets/story/scene-${id}-ext-top.webp`),
  extBottom: asset(`assets/story/scene-${id}-ext-bottom.webp`),
});
