import { WelcomeScreen } from '../screens/welcome/WelcomeScreen';

export function App() {
  return (
    <div className="app">
      {/* Story screen is next in the agreed flow; navigation is wired once it exists. */}
      <WelcomeScreen onStart={() => {}} />
    </div>
  );
}
