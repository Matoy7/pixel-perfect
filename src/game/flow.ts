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
  | { name: 'level'; index: number }
  | { name: 'complete' };

export type FlowState = { screen: Screen; progress: Progress; levelCount: number };

export type FlowAction =
  | { type: 'PLAY' } // start button on the welcome screen
  | { type: 'STORY_DONE'; skipped: boolean } // story finished (hand-off) or skipped
  | { type: 'TUTORIAL_DONE' } // → next uncompleted level (tutorial is never saved)
  | { type: 'LEVEL_DONE'; index: number } // saved immediately
  | { type: 'PLAY_AGAIN' }; // completion → Level 1

/** Next uncompleted level, or completion when all available levels are done. */
const nextScreen = (completed: number, count: number): Screen =>
  completed < count ? { name: 'level', index: completed } : { name: 'complete' };

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'PLAY':
      return { ...state, screen: { name: 'story' } };
    case 'STORY_DONE':
      return {
        ...state,
        screen: { name: 'tutorial', fromStory: !action.skipped },
        progress: { ...state.progress, storySeen: true },
      };
    case 'TUTORIAL_DONE':
      return { ...state, screen: nextScreen(state.progress.levelsCompleted, state.levelCount) };
    case 'LEVEL_DONE': {
      const levelsCompleted = Math.max(state.progress.levelsCompleted, action.index + 1);
      const screen: Screen =
        action.index + 1 < state.levelCount ? { name: 'level', index: action.index + 1 } : { name: 'complete' };
      return { ...state, screen, progress: { ...state.progress, levelsCompleted } };
    }
    case 'PLAY_AGAIN':
      return { ...state, screen: { name: 'level', index: 0 } };
  }
}
