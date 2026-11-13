import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabase } from './supabase';

/**
 * Anonymous player analytics. Fire-and-forget: nothing here ever blocks or
 * breaks gameplay — if Supabase is not configured, unreachable, or refuses,
 * calls are dropped (with a console warning).
 *
 * Identity: one anonymous Supabase Auth user per browser. The session is
 * persisted, so refreshes / later visits reuse the same player; clearing site
 * data or another device = a new player.
 */
export type TrackEvent = 'visit' | 'game_started' | 'level_started' | 'level_completed' | 'game_completed';

let ready: Promise<SupabaseClient | null> | null = null;

function player(): Promise<SupabaseClient | null> {
  ready ??= (async () => {
    const sb = await createSupabase('pixel-perfect:player');
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    if (!data.session) {
      const { error } = await sb.auth.signInAnonymously();
      if (error) throw error;
    }
    return sb;
  })().catch((e) => {
    console.warn('[analytics] disabled for this visit:', e?.message ?? e);
    return null;
  });
  return ready;
}

// events are sent one after another so their order is kept
let queue: Promise<void> = Promise.resolve();

/** Record an event. `level` = numbered level (1-based); the tutorial is never sent. */
export function track(event: TrackEvent, level?: number): void {
  queue = queue
    .then(async () => {
      const sb = await player();
      if (!sb) return;
      const { error } = await sb.rpc('track_event', { p_event: event, p_level: level ?? null });
      if (error) console.warn('[analytics]', event, error.message);
    })
    .catch(() => {});
}
