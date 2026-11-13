/**
 * Player progress, persisted in localStorage. Every read/write is guarded:
 * storage can be unavailable (private mode, blocked) and the game must still run.
 */
const KEY = 'pixel-perfect:progress:v1';

export type Progress = {
  /** Story intro watched (or skipped) at least once. (Recorded only; the story plays on every PLAY.) */
  storySeen: boolean;
  /** Number of numbered levels completed (the tutorial never counts). Next level = this index. */
  levelsCompleted: number;
};

const DEFAULTS: Progress = { storySeen: false, levelsCompleted: 0 };

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
