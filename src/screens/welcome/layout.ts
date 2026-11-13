// Geometry of the welcome artwork, in source-image pixels.
// Boxes come from scripts/extract_welcome.py.
export const WELCOME_CANVAS = { width: 972, height: 1619 } as const;

/** Small black pixel shape next to the title (animated). */
export const TITLE_PIXEL_BOX = { x: 697, y: 586, width: 39, height: 39 } as const;

/** Start button: source 515x199, placed centred on the desk below the keyboard. */
export const START_BUTTON_BOX = { x: 256, y: 1405, width: 461, height: 178 } as const;

type Box = { x: number; y: number; width: number; height: number };

/** Source-pixel box → CSS percentages of the canvas, so it scales with the art. */
export function boxToPercent(box: Box, canvas: { width: number; height: number } = WELCOME_CANVAS) {
  return {
    left: `${(box.x / canvas.width) * 100}%`,
    top: `${(box.y / canvas.height) * 100}%`,
    width: `${(box.width / canvas.width) * 100}%`,
    height: `${(box.height / canvas.height) * 100}%`,
  };
}
