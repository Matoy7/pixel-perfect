/**
 * Screen flow. The order is fixed:
 *   welcome → story (every time) → tutorial → levels → completion
 * Pure reducer: no side effects (persisting progress happens in App).
 */
import type { Progress } from './progress';

export type Screen =
  | { name: 'welcome' }
  | { name: 'story' }
  | { name: 'tutorial'; fromStory: boolean }
  | { name: 'level'; index: number };

export type FlowState = { screen: Screen; progress: Progress };

export type FlowAction =
  | { type: 'PLAY' } // start button on the welcome screen
  | { type: 'STORY_DONE'; skipped: boolean } // story finished (hand-off) or skipped
  | { type: 'TUTORIAL_DONE' } // continue → Level 1 (tutorial is never saved as progress)
  | { type: 'BACK_TO_WELCOME' };

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'PLAY':
      return { ...state, screen: { name: 'story' } };
    case 'STORY_DONE':
      return {
        screen: { name: 'tutorial', fromStory: !action.skipped },
        progress: { ...state.progress, storySeen: true },
      };
    case 'TUTORIAL_DONE':
      return { ...state, screen: { name: 'level', index: 0 } };
    case 'BACK_TO_WELCOME':
      return { ...state, screen: { name: 'welcome' } };
  }
}
