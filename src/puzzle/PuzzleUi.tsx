import './puzzle-ui.css';

import { useEffect, useState } from 'react';

/** Bottom-centre instruction, plain text on the art; appears after `delayMs`, hides once found. */
export function PuzzleHint({ text, hidden, delayMs = 0 }: { text: string; hidden: boolean; delayMs?: number }) {
  return (
    <p className={`pz-hint${hidden ? ' pz-hint--hidden' : ''}`} style={{ animationDelay: `${delayMs}ms` }}>
      {text}
    </p>
  );
}

const ID_HOLD_MS = 2500;
const ID_FADE_MS = 700;

/**
 * Level identification card: shown once `show` turns true (the level is fully
 * revealed), held 2.5s, faded out over 700ms (opacity only), then removed.
 */
export function LevelIdCard({
  show,
  place,
  number,
  onGone,
}: {
  show: boolean;
  place: string;
  number: string;
  /** Fired once the card has faded out and been removed. */
  onGone?: () => void;
}) {
  const [phase, setPhase] = useState<'wait' | 'on' | 'out' | 'gone'>('wait');
  useEffect(() => {
    if (!show || phase !== 'wait') return;
    setPhase('on');
    const t1 = window.setTimeout(() => setPhase('out'), ID_HOLD_MS);
    const t2 = window.setTimeout(() => {
      setPhase('gone');
      onGone?.();
    }, ID_HOLD_MS + ID_FADE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);
  if (phase === 'wait' || phase === 'gone') return null;
  return (
    <div
      className={`pz-id${phase === 'out' ? ' pz-id--out' : ''}`}
      style={{ ['--id-fade' as string]: `${ID_FADE_MS}ms` }}
      aria-live="polite"
    >
      <p className="pz-id__place">{place}</p>
      <p className="pz-id__number">{number}</p>
    </div>
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
