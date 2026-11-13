const cache = new Map<string, Promise<void>>();

/** Fetch *and decode* images so they never appear half-loaded. Idempotent. */
export function preloadImages(srcs: string[]): Promise<void> {
  return Promise.all(
    srcs.map((src) => {
      let p = cache.get(src);
      if (!p) {
        const img = new Image();
        img.src = src;
        p = img.decode().catch(() => {
          /* a failed decode must not block; the browser retries on render */
        });
        cache.set(src, p);
      }
      return p;
    }),
  ).then(() => undefined);
}
