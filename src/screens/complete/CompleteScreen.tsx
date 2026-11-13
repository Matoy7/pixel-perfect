import { copy } from '../../copy/he';
import './complete.css';

/** After the last available level. Play again restarts from Level 1. */
export function CompleteScreen({ onPlayAgain }: { onPlayAgain: () => void }) {
  return (
    <section className="complete">
      <div className="complete__card">
        <p className="complete__title">{copy.complete.title}</p>
        <p className="complete__text">{copy.complete.text}</p>
        <button type="button" className="complete__again" onClick={onPlayAgain}>
          {copy.complete.playAgain}
        </button>
      </div>
    </section>
  );
}
