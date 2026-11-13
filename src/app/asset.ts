declare const __ASSET_HASHES__: Record<string, string>;

/**
 * Resolve a file in /public against the deploy base (/pixel-perfect/ on GitHub
 * Pages), versioned by its content hash (see vite.config.ts) so updated art is
 * never served from an old cache.
 */
export const asset = (path: string) => {
  const v = __ASSET_HASHES__[path];
  return `${import.meta.env.BASE_URL}${path}${v ? `?v=${v}` : ''}`;
};
