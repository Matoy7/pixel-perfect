import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabase, supabaseConfigured } from '../analytics/supabase';
import { Brand, Dashboard } from './Dashboard';

/**
 * Admin entry. Security is enforced by the database, not by this page:
 * the admin signs in with email + password (a real Supabase user), and every
 * analytics read is allowed only when public.is_admin() is true for that user
 * (listed in public.admins, never anonymous). This page only decides what to show.
 */
type State =
  | { kind: 'loading' }
  | { kind: 'unconfigured' }
  | { kind: 'signedOut' }
  | { kind: 'notAdmin'; email: string }
  | { kind: 'admin'; email: string };

export function AdminApp() {
  const [sb, setSb] = useState<SupabaseClient | null>(null);
  const [state, setState] = useState<State>({ kind: 'loading' });

  const check = async (client: SupabaseClient) => {
    const { data } = await client.auth.getSession();
    const user = data.session?.user;
    if (!user || user.is_anonymous) return setState({ kind: 'signedOut' });
    const { data: ok } = await client.rpc('is_admin');
    setState(ok ? { kind: 'admin', email: user.email ?? '' } : { kind: 'notAdmin', email: user.email ?? '' });
  };

  useEffect(() => {
    if (!supabaseConfigured) return setState({ kind: 'unconfigured' });
    // separate storage key: never touches the game's anonymous player session
    createSupabase('pixel-perfect:admin').then((client) => {
      setSb(client);
      if (client) void check(client);
    });
  }, []);

  const signOut = async () => {
    await sb?.auth.signOut();
    setState({ kind: 'signedOut' });
  };

  if (state.kind === 'loading') return <main className="a-auth a-muted">טוען…</main>;
  if (state.kind === 'unconfigured')
    return (
      <main className="a-auth">
        <div className="a-card a-login">
          <Brand />
          <p className="a-muted">Supabase עדיין לא מחובר לאתר (חסרים VITE_SUPABASE_URL ו-VITE_SUPABASE_PUBLISHABLE_KEY).</p>
        </div>
      </main>
    );
  if (state.kind === 'signedOut') return <Login sb={sb!} onSignedIn={() => check(sb!)} />;
  if (state.kind === 'notAdmin')
    return (
      <main className="a-auth">
        <div className="a-card a-login">
          <Brand />
          <h1 className="a-h2">אין הרשאת ניהול</h1>
          <p className="a-muted">
            <span dir="ltr">{state.email}</span> מחובר, אבל אינו מוגדר כמנהל.
          </p>
          <button className="a-btn" onClick={signOut}>
            התנתקות
          </button>
        </div>
      </main>
    );
  return <Dashboard sb={sb!} email={state.email} onSignOut={signOut} />;
}

function Login({ sb, onSignedIn }: { sb: SupabaseClient; onSignedIn: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <main className="a-auth">
      <form
        className="a-card a-login"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!email || !password) return setError('יש למלא אימייל וסיסמה');
          setBusy(true);
          setError('');
          const { error } = await sb.auth.signInWithPassword({ email, password });
          setBusy(false);
          if (error) setError('הכניסה נכשלה. בדקו את האימייל והסיסמה.');
          else onSignedIn();
        }}
      >
        <Brand />
        <h1 className="a-h2">כניסת מנהל</h1>
        <label className="a-field">
          <span>אימייל</span>
          <input type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="a-field">
          <span>סיסמה</span>
          <input
            type="password"
            dir="ltr"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="a-error">{error}</p>}
        <button className="a-btn" type="submit" disabled={busy}>
          {busy ? 'מתחבר…' : 'כניסה'}
        </button>
      </form>
    </main>
  );
}
