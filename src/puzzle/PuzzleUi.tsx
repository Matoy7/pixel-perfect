import './puzzle-ui.css';

/** Bottom-centre instruction pill; appears after `delayMs`, hides once found. */
export function PuzzleHint({ text, hidden, delayMs = 0 }: { text: string; hidden: boolean; delayMs?: number }) {
  return (
    <p className={`pz-hint${hidden ? ' pz-hint--hidden' : ''}`} style={{ animationDelay: `${delayMs}ms` }}>
      {text}
    </p>
  );
}

/** Success card shown after the pixel burst. */
export function SuccessCard({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text?: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="pz-card" role="status">
      <p className="pz-card__title">{title}</p>
      {text && <p className="pz-card__text">{text}</p>}
      <button type="button" className="pz-card__action" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}
