import { asset } from '../../app/asset';

/** All story art is 942x1670 (≈9:16). */
export const STORY_CANVAS = { width: 942, height: 1670 } as const;

/** Black pixel on the monitor in scene 5 (source px). The final push centres here. */
export const DISCOVERY_PIXEL = { x: 463, y: 826, size: 13 } as const;

/**
 * Camera move applied to the whole shot (art + edge strips):
 *  - zoomIn / zoomOut / panLeft: very subtle Ken Burns over the shot
 *  - still:    no move (the fight: only the cloud lives)
 *  - discover: settle on Yotam, then a slow 4% push centred on the monitor pixel
 *              (4% is the most that keeps the yellow caption fully on screen)
 */
export type Camera = 'zoomIn' | 'zoomOut' | 'panLeft' | 'still' | 'discover';

export type Scene = {
  id: number;
  /** How long the shot is on screen (ms), measured from the start of its fade-in. */
  duration: number;
  /** Crossfade-in time from the previous shot (ms). */
  fadeIn: number;
  camera: Camera;
  /** Tiny hand-placed frame shift as the shot lands (stop-motion feel). */
  jitter: boolean;
};

/**
 * ~6.25s + 0.3s fade-out. Uneven durations = hand-edited rhythm; the cut into the fight
 * is quicker, Yotam's reaction settles, the pixel discovery holds.
 */
export const SCENES: Scene[] = [
  { id: 1, duration: 1450, fadeIn: 300, camera: 'zoomIn', jitter: false }, // peaceful moment
  { id: 2, duration: 850, fadeIn: 260, camera: 'panLeft', jitter: true }, // Pigmi spots the yarn
  { id: 3, duration: 700, fadeIn: 220, camera: 'zoomOut', jitter: true }, // close-up: wide eyes
  { id: 4, duration: 1200, fadeIn: 120, camera: 'still', jitter: true }, // the fight (live cloud)
  { id: 5, duration: 2050, fadeIn: 260, camera: 'discover', jitter: true }, // "פיגמי! מה עשית?!" → the pixel
];

export const OUTRO_FADE_MS = 300;

export const sceneArt = (id: number) => ({
  src: asset(`assets/story/scene-${id}.webp`),
  extTop: asset(`assets/story/scene-${id}-ext-top.webp`),
  extBottom: asset(`assets/story/scene-${id}-ext-bottom.webp`),
});
