import { useState } from 'react';
import { PuzzleScene } from '../../puzzle/PuzzleScene';
import { TUTORIAL } from '../../game/levels';
import { copy } from '../../copy/he';
import { HANDOFF_FADE_MS, HANDOFF_SCALE, TUTORIAL_INTRO_MS } from './handoff';
import './tutorial.css';

type Props = {
  /** Arrived through the story's pixel: start zoomed in and pull back. */
  fromStory: boolean;
  /** Continue to Level 1. The tutorial never touches saved level progress. */
  onDone: () => void;
};

/** Practice round on the shared puzzle engine (not a numbered level). */
export function TutorialScreen({ fromStory, onDone }: Props) {
  const [found, setFound] = useState(false);
  return (
    <section
      className={`tutorial${found ? ' tutorial--found' : ''}`}
      aria-label={copy.tutorial.label}
      style={{ ['--intro' as string]: fromStory ? `${HANDOFF_FADE_MS + TUTORIAL_INTRO_MS}ms` : '0ms' }}
    >
      <PuzzleScene
        config={TUTORIAL}
        intro={fromStory ? { scale: HANDOFF_SCALE, ms: TUTORIAL_INTRO_MS, holdMs: HANDOFF_FADE_MS } : undefined}
        onFound={() => setFound(true)}
      />
      <p className="tutorial__instruction">{copy.tutorial.instruction}</p>
      {found && (
        <div className="tutorial__card" role="status">
          <p className="tutorial__card-title">{copy.tutorial.successTitle}</p>
          <p className="tutorial__card-text">{copy.tutorial.successText}</p>
          <button type="button" className="tutorial__continue" onClick={onDone}>
            {copy.tutorial.continue}
          </button>
        </div>
      )}
    </section>
  );
}
