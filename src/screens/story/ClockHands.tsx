import { useEffect, useRef } from 'react';
import { asset } from '../../app/asset';
import { boxToPercent } from '../../ui/geometry';
import {
  CLOCK_CENTER,
  CLOCK_SPIN_MS,
  CLOCK_ZOOM_MS,
  HOLD_MS,
  STORY_CANVAS,
} from './scenes';

// Boxes (source px) from scripts/build_story.py — the real hands cut from scene 1.
const FACE = { x: 44, y: 437, width: 224, height: 224 };
const MINUTE = { x: 148, y: 457, width: 16, height: 92 }; // points to 12, pivot at its bottom
const HOUR = { x: 81, y: 541, width: 75, height: 16 }; // points to 9, pivot at its right end
const CAP = { x: 144, y: 537, width: 24, height: 24 };

const origin = (b: typeof FACE) =>
  `${((CLOCK_CENTER.x - b.x) / b.width) * 100}% ${((CLOCK_CENTER.y - b.y) / b.height) * 100}%`;

const pos = (b: typeof FACE) => boxToPercent(b, STORY_CANVAS);

/**
 * Scene 1 clock, rebuilt from its own art (hand-free face + the two hands) so
 * the time can pass 9:00 → 10:00 (scene 2's time) during the close-up.
 * Hidden until the camera has arrived on the clock; at 9:00 it is identical
 * to the art underneath.
 */
export function ClockHands() {
  const rootRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLImageElement>(null);
  const hourRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const arrive = HOLD_MS + CLOCK_ZOOM_MS;
    const spin = { delay: arrive + 150, duration: CLOCK_SPIN_MS, easing: 'cubic-bezier(0.5, 0, 0.3, 1)', fill: 'both' as const };
    const anims = [
      rootRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { delay: arrive - 150, duration: 150, fill: 'both' }),
      minuteRef.current?.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], spin),
      hourRef.current?.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(30deg)' }], spin),
    ];
    return () => anims.forEach((a) => a?.cancel());
  }, []);

  return (
    <div className="clock" ref={rootRef} aria-hidden="true">
      <img className="clock__part" src={asset('assets/story/clock-face.webp')} alt="" style={pos(FACE)} />
      <img
        ref={hourRef}
        className="clock__part"
        src={asset('assets/story/clock-hour.webp')}
        alt=""
        style={{ ...pos(HOUR), transformOrigin: origin(HOUR) }}
      />
      <img
        ref={minuteRef}
        className="clock__part"
        src={asset('assets/story/clock-minute.webp')}
        alt=""
        style={{ ...pos(MINUTE), transformOrigin: origin(MINUTE) }}
      />
      <img className="clock__part" src={asset('assets/story/clock-cap.webp')} alt="" style={pos(CAP)} />
    </div>
  );
}

export const CLOCK_ASSETS = ['clock-face', 'clock-hour', 'clock-minute', 'clock-cap'].map((n) =>
  asset(`assets/story/${n}.webp`),
);
