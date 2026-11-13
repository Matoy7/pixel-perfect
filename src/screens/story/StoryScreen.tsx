import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type React from 'react';
import { ExtendedArt } from '../../ui/ExtendedArt';
import { copy } from '../../copy/he';
import { SCENES, STORY_CANVAS, STORY_PIXEL, sceneArt, type CameraCtx, type Scene } from './scenes';
import { preloadImages } from '../../ui/preload';
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

export const preloadStory = () => preloadImages(STORY_ASSETS);

// ---------------------------------------------------------------------------

type Props = {
  /**
   * Story finished (its last frame is zoomed into the pixel, lined up with
   * the tutorial: the parent fades it out over the tutorial) or skipped.
   */
  onDone: (how: 'end' | 'skip') => void;
};

export function StoryScreen({ onDone }: Props) {
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const doneRef = useRef(false);

  const finish = (how: 'end' | 'skip') => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(how);
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
        finish('end'); // last frame stays up; the parent cross-fades to the tutorial
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
    <section className="story" aria-label={copy.story.label}>
      {ready && (
        <>
          {prev !== null && <Shot key={SCENES[prev].id} scene={SCENES[prev]} entering={false} />}
          <Shot key={SCENES[index].id} scene={SCENES[index]} entering />
        </>
      )}
      <button type="button" className="story__skip" onClick={() => finish('skip')}>
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
  const pixelRef = useRef<HTMLDivElement>(null);

  // Camera: keyframes are resolved against the live layout, so zooms land
  // exactly on their target (clock, monitor screen, pixel) on every screen size.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const cam = cameraRef.current;
    if (!stage || !cam) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const s = stage.getBoundingClientRect();
    const c = cam.getBoundingClientRect();
    const k = s.width / STORY_CANVAS.width;
    const q = { x: c.width / 2, y: c.height / 2 }; // screen centre (camera space)
    const point = (p: { x: number; y: number }) => ({ x: s.left - c.left + p.x * k, y: s.top - c.top + p.y * k });
    const ctx: CameraCtx = {
      center: (sc) => ({ tx: q.x - sc * q.x, ty: q.y - sc * q.y, s: sc }),
      focus: (p, sc, target = q) => {
        const pt = point(p);
        return { tx: target.x - sc * pt.x, ty: target.y - sc * pt.y, s: sc };
      },
      point,
      q,
      viewport: { width: c.width, height: c.height },
      k,
    };
    const keys = reduced ? [{ t: 0, cam: ctx.center(1) }, { t: 1, cam: ctx.center(1) }] : scene.camera(ctx);
    const total = keys[keys.length - 1].t || 1;
    const timing = { duration: total, fill: 'both' as const };
    const anims = [
      cam.animate(
        keys.map((key) => ({
          offset: key.t / total,
          transform: `translate(${key.cam.tx}px, ${key.cam.ty}px) scale(${key.cam.s})`,
          easing: key.easing ?? 'linear',
        })),
        timing,
      ),
    ];
    // The monitor pixel lives outside the zooming layer and is *sized* (not
    // scaled) by the same keyframes: redrawn every frame, it stays a razor-sharp
    // square at any zoom, exactly in step with the art.
    const px = pixelRef.current;
    if (px) {
      const p0 = point(STORY_PIXEL);
      const w = STORY_PIXEL.width * k;
      anims.push(
        px.animate(
          keys.map((key) => ({
            offset: key.t / total,
            left: `${key.cam.tx + key.cam.s * p0.x}px`,
            top: `${key.cam.ty + key.cam.s * p0.y}px`,
            width: `${key.cam.s * w}px`,
            height: `${key.cam.s * w}px`,
            easing: key.easing ?? 'linear',
          })),
          timing,
        ),
      );
    }
    return () => anims.forEach((a) => a.cancel());
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
        {scene.id === 5 && <div ref={pixelRef} className="story__pixel" />}
      </div>
    </div>
  );
}
