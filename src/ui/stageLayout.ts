import type { Size } from './geometry';

/**
 * Where ExtendedArt places the art stage inside a viewport (same rules as
 * extended-art.css: fit to width, never taller than the viewport, centred).
 * Lets one screen predict another's layout before it is mounted (used to line
 * up the story → tutorial pixel hand-off).
 */
export function stageLayout(canvas: Size, viewport: Size) {
  const width = Math.min(viewport.width, (viewport.height * canvas.width) / canvas.height);
  const height = (width * canvas.height) / canvas.width;
  const left = (viewport.width - width) / 2;
  const top = (viewport.height - height) / 2;
  const k = width / canvas.width; // CSS px per source px
  return {
    left,
    top,
    width,
    height,
    k,
    toScreen: (x: number, y: number) => ({ x: left + x * k, y: top + y * k }),
  };
}
