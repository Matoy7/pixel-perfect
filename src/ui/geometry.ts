export type Size = { width: number; height: number };
export type Box = { x: number; y: number; width: number; height: number };

/** Source-pixel box → CSS percentages of the canvas, so overlays scale with the art. */
export function boxToPercent(box: Box, canvas: Size) {
  return {
    left: `${(box.x / canvas.width) * 100}%`,
    top: `${(box.y / canvas.height) * 100}%`,
    width: `${(box.width / canvas.width) * 100}%`,
    height: `${(box.height / canvas.height) * 100}%`,
  };
}
