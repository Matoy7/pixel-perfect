import { boxToPercent as toPercent, type Box, type Size } from '../../ui/geometry';

// Geometry of the welcome artwork, in source-image pixels.
// Boxes come from scripts/extract_welcome.py.
export const WELCOME_CANVAS = { width: 972, height: 1619 } as const;

/** Small black pixel shape next to the title (animated). */
export const TITLE_PIXEL_BOX = { x: 697, y: 586, width: 39, height: 39 } as const;

/** Start button: source 515x199, placed centred on the desk below the keyboard. */
export const START_BUTTON_BOX = { x: 256, y: 1405, width: 461, height: 178 } as const;

/** Coffee mug (portfolio easter egg) and the pixel-art </> printed on it. */
export const MUG_BOX = { x: 98, y: 1023, width: 162, height: 180 } as const;
export const MUG_SYMBOL_BOX = { x: 161, y: 1098, width: 80, height: 56 } as const;

export const PORTFOLIO_URL = 'https://yotameliraz.co.il';

/** Source-pixel box → CSS percentages of the welcome canvas. */
export function boxToPercent(box: Box, canvas: Size = WELCOME_CANVAS) {
  return toPercent(box, canvas);
}
