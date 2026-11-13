import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type React from 'react';
import { ExtendedArt } from '../../ui/ExtendedArt';
import { copy } from '../../copy/he';
import { DISCOVERY_PIXEL, OUTRO_FADE_MS, SCENES, STORY_CANVAS, sceneArt, type Scene } from './scenes';
import { FIGHT_ASSETS, FIGHT_BG } from './fightCloud';
import { FightCloud } from './FightCloud';
import './story.css';

// ---------------------------------------------------------------------------
// Preloading: every image is fetched *and decoded* before the first frame, so
// no shot ever appears half-loaded. Started early from the welcome screen.
// ---------------------------------------------------------------------------
const STORY_ASSETS = [
  ...SCENES.flatMap((s) => {
    const a = sceneArt(s.id);
    return s.id === 4 ? [a.extTop, a.extBottom] : [a.src, a.extTop, a.extBottom];
  }),
  ...FIGHT_ASSETS,
];

let preload: Promise<void> | null = null;
export function preloadStory(): Promise<void> {
  preload ??= Promise.all(
    STORY_ASSETS.map(async (src) => {
      const img = new Image();
      img.src = src;
      try {
        await img.decode();
      } catch {
        /* a failed decode must not block the story; the browser retries on render */
      }
    }),
  ).then(() => undefined);
  return preload;
}

// ---------------------------------------------------------------------------

type Props = {
  /** Story finished or skipped. */
  onDone: () => void;
};

export function StoryScreen({ onDone }: Props) {
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    let alive = true;
    preloadStory().then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  // timeline: each shot holds for its duration, then the next fades in over it
  useEffect(() => {
    if (!ready) return;
    const scene = SCENES[index];
    const t = window.setTimeout(() => {
      if (index === SCENES.length - 1) {
        setLeaving(true);
        window.setTimeout(finish, OUTRO_FADE_MS);
      } else {
        setPrev(index);
        setIndex(index + 1);
      }
    }, scene.duration);
    return () => window.clearTimeout(t);
  }, [ready, index]); // finish is stable for our purposes (guarded by doneRef)

  // drop the previous shot once the new one has fully faded in
  useEffect(() => {
    if (prev === null) return;
    const t = window.setTimeout(() => setPrev(null), SCENES[index].fadeIn + 50);
    return () => window.clearTimeout(t);
  }, [prev, index]);

  return (
    <section
      className={`story${leaving ? ' story--leaving' : ''}`}
      aria-label={copy.story.label}
      style={{ '--outro': `${OUTRO_FADE_MS}ms` } as React.CSSProperties}
    >
      {ready && (
        <>
          {prev !== null && <Shot key={SCENES[prev].id} scene={SCENES[prev]} entering={false} />}
          <Shot key={SCENES[index].id} scene={SCENES[index]} entering />
        </>
      )}
      <button type="button" className="story__skip" onClick={finish}>
        {copy.story.skip}
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------

function Shot({ scene, entering }: { scene: Scene; entering: boolean }) {
  const art = sceneArt(scene.id);
  const stageRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);

  // The discovery push centres on the pixel: put the camera's transform origin
  // exactly on it (stage position + pixel position inside the art).
  useLayoutEffect(() => {
    if (scene.camera !== 'discover') return;
    const stage = stageRef.current;
    const cam = cameraRef.current;
    if (!stage || !cam) return;
    const place = () => {
      const s = stage.getBoundingClientRect();
      const c = cam.getBoundingClientRect();
      const k = s.width / STORY_CANVAS.width;
      const px = s.left - c.left + (DISCOVERY_PIXEL.x + DISCOVERY_PIXEL.size / 2) * k;
      const py = s.top - c.top + (DISCOVERY_PIXEL.y + DISCOVERY_PIXEL.size / 2) * k;
      cam.style.transformOrigin = `${px}px ${py}px`;
    };
    place();
  }, [scene.camera]);

  return (
    <div
      className={`shot${entering ? ' shot--entering' : ''}`}
      style={
        {
          '--fade': `${scene.fadeIn}ms`,
          '--dur': `${scene.duration + 400}ms`,
        } as React.CSSProperties
      }
    >
      <div className={`shot__jitter${scene.jitter ? ' shot__jitter--on' : ''}`}>
        <div ref={cameraRef} className={`shot__camera shot__camera--${scene.camera}`}>
          <ExtendedArt
            ref={stageRef}
            src={scene.id === 4 ? FIGHT_BG : art.src}
            extTop={art.extTop}
            extBottom={art.extBottom}
            canvas={STORY_CANVAS}
          >
            {scene.id === 4 && <FightCloud />}
          </ExtendedArt>
        </div>
      </div>
    </div>
  );
}
