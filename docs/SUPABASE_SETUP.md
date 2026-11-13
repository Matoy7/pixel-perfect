# Supabase setup – player analytics & admin dashboard

The game tracks players anonymously in Supabase and shows the results on a
protected dashboard at **https://matoy7.github.io/pixel-perfect/admin.html**.
Until the steps below are done, the game runs exactly as before and tracks nothing.

## 1. Create the project
1. https://supabase.com → **New project** (any name, e.g. `pixel-perfect`; pick a region near your players, e.g. Frankfurt).
2. Save the database password somewhere safe (not needed by the game).

## 2. Turn on anonymous sign-ins
**Authentication → Sign In / Providers → Anonymous sign-ins → enable → Save.**

Recommended: the anonymous sign-up rate limit (default 30 per hour per IP) is fine
for normal play; consider enabling CAPTCHA later if you see abuse.

## 3. Create the database
**SQL Editor → New query** → paste the whole of
`supabase/migrations/0001_player_analytics.sql` → **Run**. It creates:

| Object | Purpose |
|---|---|
| `players` | one row per anonymous player: display name, first / last seen, games started, furthest level, levels completed, game completed |
| `player_events` | history: `game_started` (every play), and the **first** `level_started` / `level_completed` per level and the first `game_completed` (refreshes / replays never duplicate them) |
| `admins` | who may see the dashboard (invisible to everyone else) |
| `track_event()` | the only way a player can write: validates the event, records it for **that player only**, updates their totals |
| `admin_overview()`, `admin_level_stats()` | dashboard numbers; refuse non-admins |

Row Level Security is on for all three tables: a player can read only their own
rows and cannot write any table directly; admins can read everything.

## 4. Create your admin login
1. **Authentication → Users → Add user → Create new user** – your email + a strong
   password, tick **Auto Confirm User**.
2. Copy the new user's **UID**, then in the **SQL Editor** run:
   ```sql
   insert into public.admins (user_id) values ('PASTE-THE-UID-HERE');
   ```
Only users in this table (and never anonymous users) can open the dashboard.
Being signed in is not enough; the database checks the table on every request.

## 5. Connect the site
**Project Settings → API Keys** → copy the **Project URL** and the
**Publishable key** (`sb_publishable_…`). If you only see the legacy tab, the
`anon` key works too. **Never use the secret / service_role key here.**

In GitHub: **Matoy7/pixel-perfect → Settings → Secrets and variables → Actions →
Variables tab → New repository variable**, add both:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |

Then re-run the deploy (**Actions → Deploy to GitHub Pages → Run workflow**) or push any change.

For local development, copy `.env.example` to `.env.local` with the same values.

## What gets tracked
| When | Event |
|---|---|
| page opened | `visit` (creates the player on first visit; updates last activity) |
| PLAY pressed | `game_started` |
| a numbered level appears | `level_started` (level number) |
| its pixel is found | `level_completed` (level number) |
| the last level's pixel is found | `game_completed` |

The tutorial is never tracked. No names, emails or personal data are collected;
display names like "Player 4821" are generated and are not unique.

**Identity is per browser.** The same browser is recognised on later visits;
clearing site data, private browsing or another device = a new anonymous player.

If Supabase is down or misconfigured, the game keeps working; events are just dropped.
