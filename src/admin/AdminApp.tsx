import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabase, supabaseConfigured } from '../analytics/supabase';
import { Dashboard } from './Dashboard';

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

  if (state.kind === 'loading') return <main className="adm adm--center">טוען…</main>;
  if (state.kind === 'unconfigured')
    return (
      <main className="adm adm--center">
        <div className="adm-card adm-login">
          <h1 className="adm-title">PIXEL PERFECT · ניהול</h1>
          <p className="adm-muted">Supabase עדיין לא מחובר לאתר (חסרים VITE_SUPABASE_URL ו-VITE_SUPABASE_PUBLISHABLE_KEY).</p>
        </div>
      </main>
    );
  if (state.kind === 'signedOut') return <Login sb={sb!} onSignedIn={() => check(sb!)} />;
  if (state.kind === 'notAdmin')
    return (
      <main className="adm adm--center">
        <div className="adm-card adm-login">
          <h1 className="adm-title">אין הרשאת ניהול</h1>
          <p className="adm-muted">{state.email} מחובר, אבל אינו מוגדר כמנהל.</p>
          <button className="adm-btn" onClick={signOut}>
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
    <main className="adm adm--center">
      <form
        className="adm-card adm-login"
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
        <h1 className="adm-title">PIXEL PERFECT · ניהול</h1>
        <label className="adm-field">
          <span>אימייל</span>
          <input type="email" dir="ltr" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="adm-field">
          <span>סיסמה</span>
          <input
            type="password"
            dir="ltr"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="adm-error">{error}</p>}
        <button className="adm-btn" type="submit" disabled={busy}>
          {busy ? 'מתחבר…' : 'כניסה'}
        </button>
      </form>
    </main>
  );
}
