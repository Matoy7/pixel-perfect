/**
 * Player progress, persisted in localStorage. Every read/write is guarded:
 * storage can be unavailable (private mode, blocked) and the game must still run.
 */
const KEY = 'pixel-perfect:progress:v1';

export type Progress = {
  /** Story intro watched (or skipped) at least once. */
  storySeen: boolean;
};

const DEFAULTS: Progress = { storySeen: false };

export function loadProgress(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Progress>) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveProgress(p: Progress): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable: progress lives for this session only */
  }
}
