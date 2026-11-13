/**
 * Screen flow. The order is fixed:
 *   welcome → story (every time) → tutorial → levels → back to welcome
 * Pure reducer: no side effects (persisting progress happens in App).
 */
import type { Progress } from './progress';

export type Screen =
  | { name: 'welcome' }
  | { name: 'story' }
  | { name: 'tutorial'; fromStory: boolean }
  | { name: 'level'; index: number };

export type FlowState = { screen: Screen; progress: Progress; levelCount: number };

export type FlowAction =
  | { type: 'PLAY' } // start button on the welcome screen
  | { type: 'STORY_DONE'; skipped: boolean } // story finished (hand-off) or skipped
  | { type: 'TUTORIAL_DONE' } // → next uncompleted level (tutorial is never saved)
  | { type: 'LEVEL_DONE'; index: number }; // saved immediately

/** Next uncompleted level; when all available levels are done, start again from Level 1. */
const nextScreen = (completed: number, count: number): Screen => ({
  name: 'level',
  index: completed < count ? completed : 0,
});

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
      // after the last available level: back to the welcome screen
      const screen: Screen =
        action.index + 1 < state.levelCount ? { name: 'level', index: action.index + 1 } : { name: 'welcome' };
      return { ...state, screen, progress: { ...state.progress, levelsCompleted } };
    }
  }
}
