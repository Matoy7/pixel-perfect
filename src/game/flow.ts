/**
 * Screen flow. The order is fixed and every visit starts from the beginning
 * (nothing is saved between visits):
 *   welcome → story → tutorial → Level 1 → Level 2 → … → completion → (play again) welcome
 */
export type Screen =
  | { name: 'welcome' }
  | { name: 'story' }
  | { name: 'tutorial'; fromStory: boolean }
  | { name: 'level'; index: number }
  | { name: 'complete' };

export type FlowState = { screen: Screen; levelCount: number };

export type FlowAction =
  | { type: 'PLAY' } // start button on the welcome screen
  | { type: 'STORY_DONE'; skipped: boolean } // story finished (hand-off) or skipped
  | { type: 'TUTORIAL_DONE' } // → Level 1
  | { type: 'LEVEL_DONE'; index: number } // → next level, or completion after the last
  | { type: 'RESTART' }; // completion → welcome (nothing is saved, nothing to reset)

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'PLAY':
      return { ...state, screen: { name: 'story' } };
    case 'STORY_DONE':
      return { ...state, screen: { name: 'tutorial', fromStory: !action.skipped } };
    case 'TUTORIAL_DONE':
      return { ...state, screen: { name: 'level', index: 0 } };
    case 'LEVEL_DONE':
      return {
        ...state,
        screen:
          action.index + 1 < state.levelCount ? { name: 'level', index: action.index + 1 } : { name: 'complete' },
      };
    case 'RESTART':
      return { ...state, screen: { name: 'welcome' } };
  }
}
