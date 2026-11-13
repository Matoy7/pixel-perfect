import type { Box } from '../ui/geometry';

/** Minimum touch target around the pixel, in CSS px on screen. */
export const MIN_HIT_CSS = 32;

/**
 * Was a tap a hit? Pure geometry, all in source-image px.
 * `cssPerSourcePx` is the current on-screen scale (fit × zoom), so the
 * minimum touch target stays 32 CSS px at any zoom level.
 */
export function isHit(tap: { x: number; y: number }, pixel: Box, cssPerSourcePx: number): boolean {
  const minSrc = MIN_HIT_CSS / cssPerSourcePx;
  const padX = Math.max(0, (minSrc - pixel.width) / 2);
  const padY = Math.max(0, (minSrc - pixel.height) / 2);
  return (
    tap.x >= pixel.x - padX &&
    tap.x <= pixel.x + pixel.width + padX &&
    tap.y >= pixel.y - padY &&
    tap.y <= pixel.y + pixel.height + padY
  );
}

/** Client (screen) point → source-image px, using the stage's on-screen rect (includes zoom). */
export function clientToSource(
  client: { x: number; y: number },
  stageRect: DOMRect,
  canvasWidth: number,
) {
  const k = stageRect.width / canvasWidth;
  return { x: (client.x - stageRect.left) / k, y: (client.y - stageRect.top) / k, k };
}
