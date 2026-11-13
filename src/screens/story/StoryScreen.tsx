import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type React from 'react';
import { ExtendedArt } from '../../ui/ExtendedArt';
import { copy } from '../../copy/he';
import { OUTRO_FADE_MS, SCENES, STORY_CANVAS, sceneArt, type CameraCtx, type Scene } from './scenes';
import { CLOCK_ASSETS, ClockHands } from './ClockHands';
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
  ...CLOCK_ASSETS,
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

  // Camera: keyframes are resolved against the live layout, so zooms land
  // exactly on their target (clock, monitor screen) on every screen size.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const cam = cameraRef.current;
    if (!stage || !cam) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const s = stage.getBoundingClientRect();
    const c = cam.getBoundingClientRect();
    const k = s.width / STORY_CANVAS.width;
    const q = { x: c.width / 2, y: c.height / 2 }; // screen centre (camera space)
    const at = (x: number, y: number, sc: number) =>
      `translate(${q.x - sc * x}px, ${q.y - sc * y}px) scale(${sc})`;
    const ctx: CameraCtx = {
      center: (sc) => at(q.x, q.y, sc),
      focus: (p, sc) => at(s.left - c.left + p.x * k, s.top - c.top + p.y * k, sc),
    };
    const keys = scene.camera(ctx);
    const total = keys[keys.length - 1].t || 1;
    const anim = cam.animate(
      keys.map((key) => ({
        offset: key.t / total,
        transform: key.transform,
        easing: key.easing ?? 'linear',
      })),
      { duration: total, fill: 'both' },
    );
    return () => anim.cancel();
  }, [scene]);

  return (
    <div
      className={`shot${entering ? ' shot--entering' : ''}`}
      style={{ '--fade': `${scene.fadeIn}ms` } as React.CSSProperties}
    >
      <div className={`shot__jitter${scene.jitter ? ' shot__jitter--on' : ''}`}>
        <div ref={cameraRef} className="shot__camera">
          <ExtendedArt
            ref={stageRef}
            src={scene.id === 4 ? FIGHT_BG : art.src}
            extTop={art.extTop}
            extBottom={art.extBottom}
            canvas={STORY_CANVAS}
          >
            {scene.id === 1 && <ClockHands />}
            {scene.id === 4 && <FightCloud />}
          </ExtendedArt>
        </div>
      </div>
    </div>
  );
}
