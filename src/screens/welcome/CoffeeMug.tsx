import { useRef } from 'react';
import { MUG_BOX, MUG_HEART_BOX, PORTFOLIO_URL, boxToPercent } from './layout';
import { asset } from '../../app/asset';
import { copy } from '../../copy/he';
import './coffee-mug.css';

/** Heart box relative to the mug box. */
const heartInMug = boxToPercent(
  { ...MUG_HEART_BOX, x: MUG_HEART_BOX.x - MUG_BOX.x, y: MUG_HEART_BOX.y - MUG_BOX.y },
  MUG_BOX,
);

/**
 * Coffee mug easter egg: the pixel heart beats continuously; hovering lifts the
 * mug (hover-capable devices only); a tap/click plays a press + heart pulse and
 * opens the portfolio in a new tab.
 *
 * It is a real <a target="_blank"> so the browser opens the tab natively on
 * every device (no popup-blocker issues). The press animation starts on
 * pointerdown, so it is visible before the new tab takes over.
 */
export function CoffeeMug() {
  const pressRef = useRef<HTMLSpanElement>(null);
  const pulseRef = useRef<HTMLSpanElement>(null);

  const playPress = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    pressRef.current?.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(0.94)', offset: 0.35 },
        { transform: 'scale(1)' },
      ],
      { duration: 320, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)' },
    );
    pulseRef.current?.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.15)', offset: 0.4 }, { transform: 'scale(1)' }],
      { duration: 360, easing: 'ease-in-out' },
    );
  };

  return (
    <a
      className="mug"
      href={PORTFOLIO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={copy.welcome.portfolio}
      style={boxToPercent(MUG_BOX)}
      draggable={false}
      onPointerDown={playPress}
      onKeyDown={(e) => {
        if (e.key === 'Enter') playPress();
      }}
    >
      <span className="mug__lift">
        <span className="mug__press" ref={pressRef}>
          <img className="mug__img" src={asset('assets/welcome/mug.webp')} alt="" draggable={false} />
          <span className="mug__heart" style={heartInMug}>
            <span className="mug__heart-pulse" ref={pulseRef}>
              <img
                className="mug__heart-beat"
                src={asset('assets/welcome/mug-heart.svg')}
                alt=""
                draggable={false}
              />
            </span>
          </span>
        </span>
      </span>
    </a>
  );
}
