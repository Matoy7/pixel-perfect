import type React from 'react';
import { boxToPercent } from '../../ui/geometry';
import { STORY_CANVAS } from './scenes';
import { CHARS, CLOUD, LOBES, PUFFS } from './fightCloud';
import './fight-cloud.css';

const pos = ([x, y, width, height]: readonly [number, number, number, number]) =>
  boxToPercent({ x, y, width, height }, STORY_CANVAS);

/**
 * Live dust cloud for the fight shot. Rendered over scene-4-bg (cloud removed):
 *   cloud body  – irregular breathing
 *   lobes       – edge sections bulging/wobbling on their own rhythms
 *   puffs       – the three small side clouds bobbing
 *   characters  – cat, paws, yarn, yellow marks: static, on top
 * Only the cloud moves; at rest the layers rebuild the original art exactly.
 */
export function FightCloud() {
  const [ox, oy] = CLOUD.origin;
  const [cx, cy, cw, ch] = CLOUD.box;
  return (
    <div className="fight" aria-hidden="true">
      <img
        className="fight__cloud"
        src={CLOUD.src}
        alt=""
        style={{
          ...pos(CLOUD.box),
          transformOrigin: `${((ox - cx) / cw) * 100}% ${((oy - cy) / ch) * 100}%`,
        }}
      />
      {LOBES.map((l, i) => (
        <img
          key={l.src}
          className={`fight__lobe fight__lobe--${i % 2 ? 'b' : 'a'}`}
          src={l.src}
          alt=""
          style={
            {
              ...pos(l.box),
              '--nx': l.normal[0],
              '--ny': l.normal[1],
              '--amp': l.amp,
              '--rot': `${l.rot}deg`,
              animationDuration: `${l.dur}ms`,
              animationDelay: `${l.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
      {PUFFS.map((p) => (
        <img
          key={p.src}
          className="fight__puff"
          src={p.src}
          alt=""
          style={
            {
              ...pos(p.box),
              '--dir': p.dir,
              animationDuration: `${p.dur}ms`,
              animationDelay: `${p.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
      <img className="fight__chars" src={CHARS.src} alt="" style={pos(CHARS.box)} />
    </div>
  );
}
