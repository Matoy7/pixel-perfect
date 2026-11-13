import { copy } from '../../copy/he';
import './level-placeholder.css';

/** TEMPORARY stand-in for Level 1 (built from its art next, on PuzzleScene). */
export function LevelPlaceholder({ onBack }: { onBack: () => void }) {
  return (
    <section className="level-ph">
      <p className="level-ph__title">{copy.levelPlaceholder.title}</p>
      <button type="button" className="level-ph__back" onClick={onBack}>
        {copy.levelPlaceholder.back}
      </button>
    </section>
  );
}
