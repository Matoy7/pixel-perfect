import { copy } from '../../copy/he';
import './tutorial-placeholder.css';

/**
 * TEMPORARY stand-in for the interactive tutorial (next screen to be built from
 * the supplied art). Exists only so the story has somewhere to land.
 */
export function TutorialPlaceholder({ onBack }: { onBack: () => void }) {
  return (
    <section className="tutorial-ph">
      <p className="tutorial-ph__title">{copy.tutorialPlaceholder.title}</p>
      <button type="button" className="tutorial-ph__back" onClick={onBack}>
        {copy.tutorialPlaceholder.back}
      </button>
    </section>
  );
}
