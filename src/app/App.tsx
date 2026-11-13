import { useEffect, useReducer, useRef, useState } from 'react';
import { WelcomeScreen } from '../screens/welcome/WelcomeScreen';
import { StoryScreen, preloadStory } from '../screens/story/StoryScreen';
import { TutorialScreen } from '../screens/tutorial/TutorialScreen';
import { HANDOFF_FADE_MS } from '../screens/tutorial/handoff';
import { LevelScreen } from '../screens/level/LevelScreen';
import { CompleteScreen } from '../screens/complete/CompleteScreen';
import { PixelGate, type GateOrigin } from '../ui/PixelGate';
import { flowReducer, type FlowAction } from '../game/flow';
import { clearLegacyProgress } from '../game/progress';
import { LEVELS, TUTORIAL, puzzleAssets } from '../game/levels';
import { preloadImages } from '../ui/preload';
import { track } from '../analytics/track';

export function App() {
  const [state, dispatch] = useReducer(flowReducer, undefined, () => ({
    screen: { name: 'welcome' as const },
    levelCount: LEVELS.length,
  }));
  /** Story stays mounted on top of the tutorial while it fades (pixel hand-off). */
  const [storyFading, setStoryFading] = useState(false);

  useEffect(clearLegacyProgress, []);

  // ---- anonymous analytics (never blocks the game; tutorial is not a level) ----
  useEffect(() => track('visit'), []);
  useEffect(() => {
    if (state.screen.name === 'level') track('level_started', state.screen.index + 1);
  }, [state.screen]);
  const onLevelSolved = (index: number) => {
    track('level_completed', index + 1);
    if (index === LEVELS.length - 1) track('game_completed');
  };

  /** Level-to-level transition through the found pixel (see PixelGate). */
  const [gate, setGate] = useState<{ origin: GateOrigin; phase: 'cover' | 'reveal' } | null>(null);
  const gateAction = useRef<FlowAction | null>(null);

  const passThroughPixel = async (rect: DOMRect, action: FlowAction, nextAssets: string[]) => {
    if (gateAction.current) return; // already on the way
    gateAction.current = action;
    await preloadImages(nextAssets); // next art decoded before the dive: no blank frames
    setGate({ origin: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, size: rect.width }, phase: 'cover' });
  };
  const onGateCovered = () => {
    dispatch(gateAction.current!); // swap the screen under the black
    gateAction.current = null;
    // let the next screen paint once before revealing it
    requestAnimationFrame(() => requestAnimationFrame(() => setGate((g) => g && { ...g, phase: 'reveal' })));
  };

  // preload one step ahead: story while on the welcome screen, tutorial during the story
  const { screen } = state;
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    if (screen.name === 'welcome') idle(() => void preloadStory());
    if (screen.name === 'story') idle(() => void preloadImages(puzzleAssets(TUTORIAL)));
    if (screen.name === 'tutorial' || screen.name === 'level') {
      const next = screen.name === 'level' ? screen.index + 1 : 0;
      if (LEVELS[next]) idle(() => void preloadImages(puzzleAssets(LEVELS[next])));
    }
  }, [screen]);

  const onStoryDone = (how: 'end' | 'skip') => {
    if (how === 'end') {
      setStoryFading(true);
      window.setTimeout(() => setStoryFading(false), HANDOFF_FADE_MS);
    }
    dispatch({ type: 'STORY_DONE', skipped: how === 'skip' });
  };

  const showStory = screen.name === 'story' || storyFading;
  // children keep fixed positions so the story is not remounted when the
  // screen switches to the tutorial underneath it
  return (
    <div className="app">
      {screen.name === 'welcome' && <WelcomeScreen
          onStart={() => {
            track('game_started');
            dispatch({ type: 'PLAY' });
          }}
        />}
      {screen.name === 'tutorial' && (
        <TutorialScreen
          fromStory={screen.fromStory}
          onDone={(rect) => passThroughPixel(rect, { type: 'TUTORIAL_DONE' }, puzzleAssets(LEVELS[0]))}
        />
      )}
      {screen.name === 'level' && (
        // key: a fresh puzzle for each level
        <LevelScreen
          key={screen.index}
          index={screen.index}
          revealed={gate === null}
          onSolved={() => onLevelSolved(screen.index)}
          onDone={(rect) => {
            const next = LEVELS[screen.index + 1];
            passThroughPixel(rect, { type: 'LEVEL_DONE', index: screen.index }, next ? puzzleAssets(next) : []);
          }}
        />
      )}
      {screen.name === 'complete' && <CompleteScreen revealed={gate === null} onPlayAgain={() => dispatch({ type: 'RESTART' })} />}
      {gate && (
        <PixelGate
          key={gate.phase}
          phase={gate.phase}
          origin={gate.origin}
          onCovered={onGateCovered}
          onRevealed={() => setGate(null)}
        />
      )}
      {showStory && (
        <div
          className={`app__layer${storyFading ? ' app__layer--fading' : ''}`}
          style={{ ['--fade' as string]: `${HANDOFF_FADE_MS}ms` }}
        >
          <StoryScreen onDone={onStoryDone} />
        </div>
      )}
    </div>
  );
}
