/**
 * The game saves nothing between visits: every player starts from the
 * beginning. This removes progress older versions stored on the device.
 */
export function clearLegacyProgress(): void {
  try {
    window.localStorage.removeItem('pixel-perfect:progress:v1');
  } catch {
    /* storage unavailable: nothing to clear */
  }
}
