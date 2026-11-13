import { asset } from '../app/asset';
import type { Box, Size } from '../ui/geometry';

/**
 * A puzzle scene: one illustration with one hidden black pixel.
 * Used by the tutorial and (later) by every numbered level.
 */
export type PuzzleConfig = {
  id: string;
  canvas: Size;
  /** Illustration shown while searching. */
  image: string;
  /** Same illustration without the pixel: revealed when the pixel bursts. */
  imageClean: string;
  extTop: string;
  extBottom: string;
  /** The pixel, source px. Rendered as a crisp #000 square overlay. */
  pixel: Box;
  /** Soften the art's top/bottom edges into the edge strips (art cut at its edges). */
  feather?: boolean;
};

/** Tutorial: the licorice jar. Not a numbered level; never saved to progress. */
export const TUTORIAL: PuzzleConfig = {
  id: 'tutorial',
  canvas: { width: 1086, height: 1448 },
  image: asset('assets/tutorial/jar.webp'),
  imageClean: asset('assets/tutorial/jar-clean.webp'),
  extTop: asset('assets/tutorial/jar-ext-top.webp'),
  extBottom: asset('assets/tutorial/jar-ext-bottom.webp'),
  // art square: 561,793 124x117 (centre 623,851.5) → a true square over it
  pixel: { x: 562.5, y: 791, width: 121, height: 121 },
  feather: true,
};

export const puzzleAssets = (c: PuzzleConfig) => [c.image, c.imageClean, c.extTop, c.extBottom];
