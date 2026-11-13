import { useState } from 'react';
import type React from 'react';
import { START_BUTTON_BOX, WELCOME_CANVAS, boxToPercent } from './layout';
import { asset } from '../../app/asset';
import { TitlePixel } from './TitlePixel';
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
    <main
      className="welcome"
      style={
        {
          '--art-w': WELCOME_CANVAS.width,
          '--art-h': WELCOME_CANVAS.height,
        } as React.CSSProperties
      }
    >
      <div
        className="welcome__ext"
        aria-hidden="true"
        style={{ backgroundImage: `url(${asset('assets/welcome/welcome-ext-top.webp')})` }}
      />
      <div className="welcome__stage">
        <img className="welcome__art" src={bg} alt="" draggable={false} />
        <TitlePixel />
        <h1 className="visually-hidden">PIXEL PERFECT</h1>
        <button
          type="button"
          className={`start-button${pressed ? ' is-pressed' : ''}`}
          style={boxToPercent(START_BUTTON_BOX)}
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
