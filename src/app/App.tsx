import { useEffect, useReducer } from 'react';
import { WelcomeScreen } from '../screens/welcome/WelcomeScreen';
import { StoryScreen, preloadStory } from '../screens/story/StoryScreen';
import { TutorialPlaceholder } from '../screens/tutorial/TutorialPlaceholder';
import { flowReducer } from '../game/flow';
import { loadProgress, saveProgress } from '../game/progress';

export function App() {
  const [state, dispatch] = useReducer(flowReducer, undefined, () => ({
    screen: { name: 'welcome' as const },
    progress: loadProgress(),
  }));

  // persist progress whenever it changes
  useEffect(() => saveProgress(state.progress), [state.progress]);

  // the story comes right after PLAY: fetch + decode it while the player is
  // still on the welcome screen
  useEffect(() => {
    if (state.screen.name !== 'welcome') return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300));
    idle(() => void preloadStory());
  }, [state.screen.name]);

  const { screen } = state;
  return (
    <div className="app">
      {screen.name === 'welcome' && (
        <WelcomeScreen onStart={() => dispatch({ type: 'PLAY' })} />
      )}
      {screen.name === 'story' && <StoryScreen onDone={() => dispatch({ type: 'STORY_DONE' })} />}
      {screen.name === 'tutorial' && (
        <TutorialPlaceholder onBack={() => dispatch({ type: 'BACK_TO_WELCOME' })} />
      )}
    </div>
  );
}
