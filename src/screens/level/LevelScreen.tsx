import { useState } from 'react';
import { PuzzleScene } from '../../puzzle/PuzzleScene';
import { LevelIdCard, SuccessCard } from '../../puzzle/PuzzleUi';
import { LEVELS } from '../../game/levels';
import { copy } from '../../copy/he';
import './level.css';

type Props = {
  index: number;
  /** The level is fully on screen (transition finished): show its id card. */
  revealed: boolean;
  /** Pixel found (level completed): fires immediately, before the success card. */
  onSolved: () => void;
  /** Pixel found and the player tapped continue (with the pixel's on-screen rect). */
  onDone: (pixelRect: DOMRect) => void;
};

export function LevelScreen({ index, revealed, onSolved, onDone }: Props) {
  const [found, setFound] = useState<DOMRect | null>(null);
  const n = index + 1;
  return (
    <section className="level" aria-label={copy.level.label(n)}>
      <PuzzleScene
        config={LEVELS[index]}
        onFound={(rect) => {
          setFound(rect);
          onSolved();
        }}
      />
      {!found && (
        <LevelIdCard show={revealed} place={copy.level.places[index] ?? ''} number={copy.level.number(n)} />
      )}
      {found && <SuccessCard title={copy.found.title} action={copy.found.next} onAction={() => onDone(found)} />}
    </section>
  );
}
