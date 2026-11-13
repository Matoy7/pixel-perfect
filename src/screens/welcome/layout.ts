// Geometry of the welcome artwork, in source-image pixels.
// Boxes come from scripts/extract_welcome.py.
export const WELCOME_CANVAS = { width: 972, height: 1619 } as const;

/** Small black pixel shape next to the title (animated). */
export const TITLE_PIXEL_BOX = { x: 697, y: 586, width: 39, height: 39 } as const;

/** Start button: source 515x199, placed centred on the desk below the keyboard. */
export const START_BUTTON_BOX = { x: 256, y: 1405, width: 461, height: 178 } as const;

/** Coffee mug (portfolio easter egg) and the pixel heart printed on it. */
export const MUG_BOX = { x: 98, y: 1023, width: 162, height: 180 } as const;
export const MUG_HEART_BOX = { x: 175, y: 1102, width: 52, height: 48 } as const;

export const PORTFOLIO_URL = 'https://yotameliraz.co.il';

type Box ={ x: number; y: number; width: number; height: number };

/** Source-pixel box → CSS percentages of the canvas, so it scales with the art. */
export function boxToPercent(box: Box, canvas: { width: number; height: number } = WELCOME_CANVAS) {
  return {
    left: `${(box.x / canvas.width) * 100}%`,
    top: `${(box.y / canvas.height) * 100}%`,
    width: `${(box.width / canvas.width) * 100}%`,
    height: `${(box.height / canvas.height) * 100}%`,
  };
}
