import { useState } from 'react';
import { START_BUTTON_BOX, WELCOME_CANVAS, boxToPercent } from './layout';
import { asset } from '../../app/asset';
import { TitlePixel } from './TitlePixel';
import { CoffeeMug } from './CoffeeMug';
import { copy } from '../../copy/he';
import { ExtendedArt } from '../../ui/ExtendedArt';
import './welcome.css';

type Props = {
  onStart: () => void;
  /** Returning players: offer to watch the story again (null = first visit). */
  onReplayStory: (() => void) | null;
};

const PRESS_RELEASE_MS = 140; // let the press animation read before leaving the screen

export function WelcomeScreen({ onStart, onReplayStory }: Props) {
  const [pressed, setPressed] = useState(false);
  const bg = asset('assets/welcome/welcome-bg.webp');

  const release = (activate: boolean) => {
    setPressed(false);
    if (activate) window.setTimeout(onStart, PRESS_RELEASE_MS);
  };

  return (
    <main className="welcome">
      <ExtendedArt
        src={bg}
        extTop={asset('assets/welcome/welcome-ext-top.webp')}
        extBottom={asset('assets/welcome/welcome-ext-bottom.webp')}
        canvas={WELCOME_CANVAS}
        featherTop
      >
        <TitlePixel />
        <CoffeeMug />
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
      </ExtendedArt>
      {onReplayStory && (
        <button type="button" className="welcome__replay" onClick={onReplayStory}>
          {copy.welcome.replayStory}
        </button>
      )}
    </main>
  );
}
