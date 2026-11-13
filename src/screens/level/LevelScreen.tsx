import { useState } from 'react';
import { PuzzleScene } from '../../puzzle/PuzzleScene';
import { PuzzleHint, SuccessCard } from '../../puzzle/PuzzleUi';
import { LEVELS } from '../../game/levels';
import { copy } from '../../copy/he';
import './level.css';

type Props = {
  index: number;
  /** Pixel found and the player tapped continue. */
  onDone: () => void;
};

export function LevelScreen({ index, onDone }: Props) {
  const [found, setFound] = useState(false);
  const n = index + 1;
  const last = index === LEVELS.length - 1;
  return (
    <section className="level" aria-label={copy.level.label(n)}>
      <PuzzleScene config={LEVELS[index]} onFound={() => setFound(true)} />
      <PuzzleHint text={copy.level.hint(n)} hidden={found} />
      {found && (
        <SuccessCard
          title={copy.level.successTitle}
          text={copy.level.successText(n)}
          action={last ? copy.level.finish : copy.level.next(n + 1)}
          onAction={onDone}
        />
      )}
    </section>
  );
}
