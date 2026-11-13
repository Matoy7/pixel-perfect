import type React from 'react';
import { copy } from '../../copy/he';
import './complete.css';

/** Game palette (UI + art accents): square "pixel fireworks". */
const PALETTE = ['#ffd21f', '#f4a6c8', '#7b5ea7', '#3a2a52', '#000000', '#f59e42', '#9fd3c7'];

const BURST = 28; // squares bursting out from the centre
const ORBIT = 6; // squares that bounce gently around the headline, then settle out

/**
 * Final screen after the last level. The celebration starts once the screen is
 * revealed (`revealed`), so none of it plays hidden under the transition.
 * "Play again" restarts from the beginning.
 */
export function CompleteScreen({ revealed, onPlayAgain }: { revealed: boolean; onPlayAgain: () => void }) {
  return (
    <section className={`complete${revealed ? ' complete--go' : ''}`}>
      <div className="complete__fx" aria-hidden="true">
        {Array.from({ length: BURST }, (_, i) => {
          const a = i * 2.39996; // golden angle: even, organic spread
          const d = 120 + ((i * 47) % 110); // px travelled
          return (
            <span
              key={i}
              className="complete__px"
              style={
                {
                  '--dx': `${Math.cos(a) * d}px`,
                  '--dy': `${Math.sin(a) * d * 1.25}px`,
                  '--size': `${6 + ((i * 5) % 4) * 3}px`,
                  '--c': PALETTE[i % PALETTE.length],
                  '--delay': `${(i % 4) * 40}ms`,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>
      <div className="complete__content">
        <div className="complete__head">
          {Array.from({ length: ORBIT }, (_, i) => (
            <span
              key={i}
              className="complete__bob"
              aria-hidden="true"
              style={
                {
                  '--x': `${[-8, 104, 18, 90, -14, 108][i]}%`,
                  '--y': `${[-30, -22, 112, 120, 40, 52][i]}%`,
                  '--c': PALETTE[(i * 3) % PALETTE.length],
                  '--delay': `${250 + i * 70}ms`,
                } as React.CSSProperties
              }
            />
          ))}
          <h1 className="complete__title">{copy.complete.title}</h1>
        </div>
        <p className="complete__text">{copy.complete.text}</p>
        <button type="button" className="complete__again" onClick={onPlayAgain}>
          {copy.complete.playAgain}
        </button>
      </div>
    </section>
  );
}
