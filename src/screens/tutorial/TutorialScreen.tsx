import { useState } from 'react';
import { PuzzleScene } from '../../puzzle/PuzzleScene';
import { PuzzleHint, SuccessCard } from '../../puzzle/PuzzleUi';
import { TUTORIAL } from '../../game/levels';
import { copy } from '../../copy/he';
import { HANDOFF_FADE_MS, HANDOFF_SCALE, TUTORIAL_INTRO_MS } from './handoff';
import './tutorial.css';

type Props = {
  /** Arrived through the story's pixel: start zoomed in and pull back. */
  fromStory: boolean;
  /** Continue to Level 1, through the found pixel (its on-screen rect). */
  onDone: (pixelRect: DOMRect) => void;
};

/** Practice round on the shared puzzle engine (not a numbered level). */
export function TutorialScreen({ fromStory, onDone }: Props) {
  const [found, setFound] = useState<DOMRect | null>(null);
  return (
    <section className="tutorial" aria-label={copy.tutorial.label}>
      <PuzzleScene
        config={TUTORIAL}
        intro={fromStory ? { scale: HANDOFF_SCALE, ms: TUTORIAL_INTRO_MS, holdMs: HANDOFF_FADE_MS } : undefined}
        onFound={setFound}
      />
      <PuzzleHint
        text={copy.tutorial.instruction}
        hidden={!!found}
        delayMs={fromStory ? HANDOFF_FADE_MS + TUTORIAL_INTRO_MS : 0}
      />
      {found && <SuccessCard title={copy.found.title} action={copy.found.next} onAction={() => onDone(found)} />}
    </section>
  );
}
