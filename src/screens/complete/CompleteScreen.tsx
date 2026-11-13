import type React from 'react';
import { asset } from '../../app/asset';
import { copy } from '../../copy/he';
import './complete.css';

/** Game palette (UI + art accents): square "pixel fireworks". */
const PALETTE = ['#fecd11', '#f4a6c8', '#7b5ea7', '#2a063d', '#000000', '#ec8f02', '#9fd3c7'];

const BURST = 28; // squares bursting out from the trophy
const ORBIT = 6; // squares that bounce gently around the headline, then settle out

/**
 * Final screen after the last level, built to the supplied reference
 * (art/complete/complete-reference.png): trophy, headline, line, button.
 * The celebration starts once the screen is revealed (`revealed`) and settles
 * to exactly the static reference layout. "Play again" restarts the game.
 */
export function CompleteScreen({ revealed, onPlayAgain }: { revealed: boolean; onPlayAgain: () => void }) {
  return (
    <section className={`complete${revealed ? ' complete--go' : ''}`}>
      <div className="complete__group">
        <div className="complete__fx" aria-hidden="true">
          {Array.from({ length: BURST }, (_, i) => {
            const a = i * 2.39996; // golden angle: even, organic spread
            const d = 120 + ((i * 47) % 110);
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
        <img className="complete__trophy" src={asset('assets/complete/trophy.webp')} alt="" draggable={false} />
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
