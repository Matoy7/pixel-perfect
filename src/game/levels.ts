import { asset } from '../app/asset';
import type { Box, Size } from '../ui/geometry';

/** Visible size of a level's pixel: exactly 8×8 CSS px on every device (at fit). */
export const LEVEL_PIXEL_CSS = 8;
/** The one pixel colour, everywhere in the game (no per-level override). */
export const PIXEL_COLOR = '#000000';

/**
 * Where the pixel is and how big it is drawn:
 *  - 'box': a source-px box (the tutorial's jar square is drawn large in the art)
 *  - 'css': centred on a source-px point, LEVEL_PIXEL_CSS wide on screen at fit
 *           (it then scales with the art when the player zooms)
 */
export type PixelSpec =
  | { kind: 'box'; box: Box }
  | { kind: 'css'; center: { x: number; y: number }; size: number };

/**
 * A puzzle scene: one illustration with one hidden black pixel.
 * Used by the tutorial and every numbered level.
 */
export type PuzzleConfig = {
  id: string;
  canvas: Size;
  /** Illustration shown while searching. */
  image: string;
  /** Illustration without the pixel: revealed when the pixel bursts. */
  imageClean: string;
  extTop: string;
  extBottom: string;
  pixel: PixelSpec;
  /** Soften the art's top/bottom edges into the edge strips (art cut at its edges). */
  feather?: boolean;
};

/**
 * Tutorial: the licorice jar. Not a numbered level.
 * The ONE intended exception to the 8×8 rule: its pixel is the large square drawn
 * in the jar art (same #000 colour). Every numbered level uses LEVEL_PIXEL_CSS.
 */
export const TUTORIAL: PuzzleConfig = {
  id: 'tutorial',
  canvas: { width: 1086, height: 1448 },
  image: asset('assets/tutorial/jar.webp'),
  imageClean: asset('assets/tutorial/jar-clean.webp'),
  extTop: asset('assets/tutorial/jar-ext-top.webp'),
  extBottom: asset('assets/tutorial/jar-ext-bottom.webp'),
  // art square: 561,793 124x117 (centre 623,851.5) → a true square over it
  pixel: { kind: 'box', box: { x: 562.5, y: 791, width: 121, height: 121 } },
  feather: true,
};

/** Level art is clean (no pixel baked in): the game draws the pixel. */
const level = (n: number, canvas: Size, center: { x: number; y: number }): PuzzleConfig => {
  const img = asset(`assets/levels/level-${n}.webp`);
  return {
    id: `level-${n}`,
    canvas,
    image: img,
    imageClean: img,
    extTop: asset(`assets/levels/level-${n}-ext-top.webp`),
    extBottom: asset(`assets/levels/level-${n}-ext-bottom.webp`),
    pixel: { kind: 'css', center, size: LEVEL_PIXEL_CSS },
    feather: true,
  };
};

/**
 * Numbered levels, in play order (array position = level number).
 * level(n, …): n is the ART id (art/levels/level-n.png), not the play position.
 * Adding a level = one entry here + its art.
 */
export const LEVELS: PuzzleConfig[] = [
  // Level 1 – the supermarket: on the phone of the man in the yellow shirt
  level(1, { width: 1087, height: 1447 }, { x: 164, y: 668 }),
  // Level 2 – the office: meeting-room board, the smallest bar of the chart
  level(2, { width: 1086, height: 1448 }, { x: 892, y: 226 }),
  // Level 3 – the safari penguin exhibit (art level-6): the black square inside the rhino on the
  // Safari sign, right side (art square x 959–981, y 689–709)
  level(6, { width: 1086, height: 1448 }, { x: 970, y: 699 }),
  // Level 4 – the post office (art level-7): the black box on the red shelving, right edge, next to
  // its white label (box front x 1019–1062, y 398–440; label x 1027–1041)
  level(7, { width: 1086, height: 1448 }, { x: 1054, y: 419 }),
  // Level 5 – the construction site (art level-4): the dark opening behind the bricklayer (yellow
  // hard hat, orange vest) on the left, 3rd floor up (opening x 316–365, y 655–722)
  level(4, { width: 1086, height: 1448 }, { x: 341, y: 683 }),
  // Level 6 – the amusement park (art level-5): centre of the busker's speaker grille,
  // bottom left (grille x 194–227, y 1121–1153)
  level(5, { width: 1086, height: 1448 }, { x: 210.5, y: 1137 }),
  // Level 7 – the airport (art level-3): one of the control tower's front windows (window x 363–385, y 86–115)
  level(3, { width: 1086, height: 1448 }, { x: 374, y: 100.5 }),
];

export const puzzleAssets = (c: PuzzleConfig) => [...new Set([c.image, c.imageClean, c.extTop, c.extBottom])];

/** The pixel's box in source px, given the on-screen scale at fit (CSS px per source px). */
export function pixelBox(spec: PixelSpec, cssPerSourcePxAtFit: number): Box {
  if (spec.kind === 'box') return spec.box;
  const s = spec.size / cssPerSourcePxAtFit;
  return { x: spec.center.x - s / 2, y: spec.center.y - s / 2, width: s, height: s };
}
