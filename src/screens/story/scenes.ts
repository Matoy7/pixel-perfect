import { asset } from '../../app/asset';

/** All story art is 942x1670 (≈9:16). */
export const STORY_CANVAS = { width: 942, height: 1670 } as const;

type Pt = { x: number; y: number };

/** Clock centre (same spot in scenes 1 and 2), source px. */
export const CLOCK_CENTER: Pt = { x: 155.5, y: 549 };
/** Centre of the monitor's screen in scene 5 (where the black pixel is). */
export const SCREEN_CENTER: Pt = { x: 463, y: 879 };

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
export type CameraCtx = {
  center: (s: number) => string;
  focus: (p: Pt, s: number) => string;
};
export type CameraKey = { t: number; transform: string; easing?: string };

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
      { t: 0, transform: c.center(1) },
      { t: HOLD_MS, transform: c.center(1.03), easing: EASE },
      { t: HOLD_MS + CLOCK_ZOOM_MS, transform: c.focus(CLOCK_CENTER, CLOCK_ZOOM) },
      { t: HOLD_MS + CLOCK_ZOOM_MS + CLOCK_HOLD_MS, transform: c.focus(CLOCK_CENTER, CLOCK_ZOOM) },
    ],
  },
  {
    // opens on its own clock (10:00) and pulls back: Pigmi spots the yarn
    id: 2,
    duration: CLOCK_ZOOM_MS + HOLD_MS,
    fadeIn: 250,
    jitter: false,
    camera: (c) => [
      { t: 0, transform: c.focus(CLOCK_CENTER, CLOCK_ZOOM), easing: EASE },
      { t: CLOCK_ZOOM_MS, transform: c.center(1) },
      { t: CLOCK_ZOOM_MS + HOLD_MS, transform: c.center(1.025) },
    ],
  },
  {
    // close-up: wide eyes
    id: 3,
    duration: HOLD_MS,
    fadeIn: 220,
    jitter: true,
    camera: (c) => [
      { t: 0, transform: c.center(1.04) },
      { t: HOLD_MS, transform: c.center(1) },
    ],
  },
  {
    // the fight: camera still, only the cloud lives
    id: 4,
    duration: HOLD_MS,
    fadeIn: 120,
    jitter: true,
    camera: (c) => [
      { t: 0, transform: c.center(1) },
      { t: HOLD_MS, transform: c.center(1) },
    ],
  },
  {
    // "פיגמי! מה עשית?!" → long zoom into the computer screen and the pixel
    id: 5,
    duration: SCREEN_SETTLE_MS + SCREEN_ZOOM_MS + SCREEN_END_HOLD_MS,
    fadeIn: 260,
    jitter: true,
    camera: (c) => [
      { t: 0, transform: c.center(1) },
      { t: SCREEN_SETTLE_MS, transform: c.center(1), easing: LONG_EASE },
      { t: SCREEN_SETTLE_MS + SCREEN_ZOOM_MS, transform: c.focus(SCREEN_CENTER, SCREEN_ZOOM) },
      {
        t: SCREEN_SETTLE_MS + SCREEN_ZOOM_MS + SCREEN_END_HOLD_MS,
        transform: c.focus(SCREEN_CENTER, SCREEN_ZOOM),
      },
    ],
  },
];

export const OUTRO_FADE_MS = 300;

export const sceneArt = (id: number) => ({
  src: asset(`assets/story/scene-${id}.webp`),
  extTop: asset(`assets/story/scene-${id}-ext-top.webp`),
  extBottom: asset(`assets/story/scene-${id}-ext-bottom.webp`),
});
