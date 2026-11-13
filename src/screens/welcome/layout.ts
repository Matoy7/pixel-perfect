// Geometry of the welcome artwork, in source-image pixels.
// Button box comes from scripts/extract_welcome.py.
export const WELCOME_CANVAS = { width: 1086, height: 1448 } as const;

export const START_BUTTON_BOX = { x: 283, y: 1129, width: 515, height: 199 } as const;

/** Source-pixel box → CSS percentages of the canvas, so it scales with the art. */
export function boxToPercent(
  box: { x: number; y: number; width: number; height: number },
  canvas: { width: number; height: number },
) {
  return {
    left: `${(box.x / canvas.width) * 100}%`,
    top: `${(box.y / canvas.height) * 100}%`,
    width: `${(box.width / canvas.width) * 100}%`,
    height: `${(box.height / canvas.height) * 100}%`,
  };
}
