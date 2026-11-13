import { useState } from 'react';
import { START_BUTTON_BOX, WELCOME_CANVAS, boxToPercent } from './layout';
import { asset } from '../../app/asset';
import { copy } from '../../copy/he';
import './welcome.css';

type Props = {
  onStart: () => void;
};

const PRESS_RELEASE_MS = 140; // let the press animation read before leaving the screen

export function WelcomeScreen({ onStart }: Props) {
  const [pressed, setPressed] = useState(false);
  const bg = asset('assets/welcome/welcome-bg.webp');

  const release = (activate: boolean) => {
    setPressed(false);
    if (activate) window.setTimeout(onStart, PRESS_RELEASE_MS);
  };

  return (
    <main className="welcome">
      <div
        className="welcome__ext"
        aria-hidden="true"
        style={{ backgroundImage: `url(${asset('assets/welcome/welcome-ext-top.webp')})` }}
      />
      <div
        className="welcome__stage"
        style={{ aspectRatio: `${WELCOME_CANVAS.width} / ${WELCOME_CANVAS.height}` }}
      >
        <img className="welcome__art" src={bg} alt="" draggable={false} />
        <h1 className="visually-hidden">PIXEL PERFECT</h1>
        <button
          type="button"
          className={`start-button${pressed ? ' is-pressed' : ''}`}
          style={boxToPercent(START_BUTTON_BOX, WELCOME_CANVAS)}
          aria-label={copy.welcome.start}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setPressed(true);
          }}
          onPointerUp={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const inside =
              e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
            release(inside);
          }}
          onPointerCancel={() => release(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setPressed(true);
          }}
          onKeyUp={(e) => {
            if (e.key === 'Enter' || e.key === ' ') release(true);
          }}
        >
          <img
            className="start-button__img"
            src={asset('assets/welcome/start-button.webp')}
            alt=""
            draggable={false}
          />
        </button>
      </div>
      <div
        className="welcome__ext"
        aria-hidden="true"
        style={{ backgroundImage: `url(${asset('assets/welcome/welcome-ext-bottom.webp')})` }}
      />
    </main>
  );
}
