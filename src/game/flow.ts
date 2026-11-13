/**
 * Screen flow. The order is fixed:
 *   welcome → story (first visit only) → tutorial → levels → completion
 * Pure reducer: no side effects (persisting progress happens in App).
 */
import type { Progress } from './progress';

export type Screen = { name: 'welcome' } | { name: 'story' } | { name: 'tutorial' };

export type FlowState = { screen: Screen; progress: Progress };

export type FlowAction =
  | { type: 'PLAY' } // start button on the welcome screen
  | { type: 'REPLAY_STORY' } // returning player chose to watch the story again
  | { type: 'STORY_DONE' } // story finished or skipped
  | { type: 'BACK_TO_WELCOME' };

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'PLAY':
      return {
        ...state,
        screen: state.progress.storySeen ? { name: 'tutorial' } : { name: 'story' },
      };
    case 'REPLAY_STORY':
      return { ...state, screen: { name: 'story' } };
    case 'STORY_DONE':
      return { screen: { name: 'tutorial' }, progress: { ...state.progress, storySeen: true } };
    case 'BACK_TO_WELCOME':
      return { ...state, screen: { name: 'welcome' } };
  }
}
