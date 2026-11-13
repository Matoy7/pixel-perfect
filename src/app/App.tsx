import { useEffect, useReducer, useState } from 'react';
import { WelcomeScreen } from '../screens/welcome/WelcomeScreen';
import { StoryScreen, preloadStory } from '../screens/story/StoryScreen';
import { TutorialScreen } from '../screens/tutorial/TutorialScreen';
import { HANDOFF_FADE_MS } from '../screens/tutorial/handoff';
import { LevelPlaceholder } from '../screens/level/LevelPlaceholder';
import { flowReducer } from '../game/flow';
import { loadProgress, saveProgress } from '../game/progress';
import { TUTORIAL, puzzleAssets } from '../game/levels';
import { preloadImages } from '../ui/preload';

export function App() {
  const [state, dispatch] = useReducer(flowReducer, undefined, () => ({
    screen: { name: 'welcome' as const },
    progress: loadProgress(),
  }));
  /** Story stays mounted on top of the tutorial while it fades (pixel hand-off). */
  const [storyFading, setStoryFading] = useState(false);

  useEffect(() => saveProgress(state.progress), [state.progress]);

  // preload one step ahead: story while on the welcome screen, tutorial during the story
  const { screen } = state;
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    if (screen.name === 'welcome') idle(() => void preloadStory());
    if (screen.name === 'story') idle(() => void preloadImages(puzzleAssets(TUTORIAL)));
  }, [screen.name]);

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
      {screen.name === 'welcome' && <WelcomeScreen onStart={() => dispatch({ type: 'PLAY' })} />}
      {screen.name === 'tutorial' && (
        <TutorialScreen fromStory={screen.fromStory} onDone={() => dispatch({ type: 'TUTORIAL_DONE' })} />
      )}
      {screen.name === 'level' && <LevelPlaceholder onBack={() => dispatch({ type: 'BACK_TO_WELCOME' })} />}
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
