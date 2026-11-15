# Handoff: redesign the PIXEL PERFECT admin dashboard

You are continuing work on **PIXEL PERFECT**, Yotam Eliraz's mobile-only Hebrew
(RTL) browser puzzle game. Your job in this session: **design and build the admin
management dashboard** (`admin.html`). Everything you need is below — read it all
before changing anything.

---

## 1. Working agreement (how Yotam works — follow exactly)

- **Repo:** `https://github.com/Matoy7/pixel-perfect` (branch `main`).
  You have permission to pull and **push directly to `main` after every change,
  without asking**. Always `git pull` before starting and before each push.
- **Commit identity / message:** commit as `Claude <noreply@anthropic.com>`;
  end every commit message with the attribution lines your session's system
  reminder gives you (Co-Authored-By / session link).
- **Every push deploys** via GitHub Actions to GitHub Pages (~40 s). After each
  push, **verify the deploy from the run log** — do not claim success without it:
  ```bash
  gh run list -R Matoy7/pixel-perfect -L 1
  id=$(gh run list -R Matoy7/pixel-perfect -L 1 --json databaseId --jq '.[0].databaseId')
  gh run view $id -R Matoy7/pixel-perfect --log | grep -E "Publishable key|baked|admin.html: OK|Reported success|##\[error\]"
  ```
  Expected lines: `Publishable key: OK`, `index.html + admin.html: OK`,
  `Supabase URL baked into the build: OK`, `Reported success!`.
- **At the end of every session, deliver the full repo as a zip** (not just changed files),
  excluding `node_modules`, `dist`, `.git`, `*.tsbuildinfo`, `__pycache__`.
- Yotam writes terse instructions (often with typos). He is a product designer:
  **no unsolicited redesigns of the game**, root-cause fixes over patches,
  pixel-perfect fidelity when he supplies a reference image.
- Verify UI in a real browser before reporting (Playwright + Chromium are available
  in the sandbox; render at phone and desktop sizes and look at the screenshots).
- You cannot open `github.io` or the Supabase project from the sandbox, and you
  cannot read/write GitHub repository variables (403). Ask Yotam for anything
  that needs those.

## 2. Live URLs

- Game: https://matoy7.github.io/pixel-perfect/
- **Admin dashboard: https://matoy7.github.io/pixel-perfect/admin.html**
- Actions: https://github.com/Matoy7/pixel-perfect/actions

## 3. Stack & build

- React 19 + Vite 7 + TypeScript, **plain CSS** (no Tailwind, no UI/chart libraries —
  keep it that way unless Yotam asks). `@supabase/supabase-js` 2.x.
- Vite **multi-page**: `index.html` (game) and `admin.html` (dashboard), configured
  in `vite.config.ts` (`build.rollupOptions.input`). `base: '/pixel-perfect/'`.
- `vite.config.ts` also adds content-hash cache-busting for files in `public/assets`
  (`asset()` in `src/app/asset.ts` appends `?v=<hash>`). Use `asset()` for any
  image you put under `public/assets`.
- Commands: `npm ci`, `npm run build` (runs `tsc -b` then `vite build`), `npm run dev`.
- Supabase config comes from build-time env (never hard-code):
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — set as **GitHub Actions
  repository variables** (already configured by Yotam) and passed in
  `.github/workflows/deploy.yml`. For local dev: `.env.local` (see `.env.example`).
  **Never use or commit a secret / service_role key.** The workflow rejects them.
- Local testing without the real backend: build with placeholder env
  (`VITE_SUPABASE_URL=https://test-project.supabase.co VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test npx vite build --outDir /tmp/dist-sb`),
  serve with `npx vite preview --outDir /tmp/dist-sb --port 4174`, and mock the
  Supabase endpoints with Playwright `context.route('https://test-project.supabase.co/**', …)`
  (login `POST /auth/v1/token`, `POST /rest/v1/rpc/<fn>`, `GET /rest/v1/players…`).

## 4. Current admin code (what you are redesigning)

| File | Role |
|---|---|
| `admin.html` | entry page (`lang="he" dir="rtl"`, `noindex`) |
| `src/admin/main.tsx` | mounts `<AdminApp/>` |
| `src/admin/AdminApp.tsx` | auth gate: loading / not configured / login (email+password) / not admin / dashboard |
| `src/admin/Dashboard.tsx` | the dashboard: overview tiles, levels table with bars, devices card, players table (sort by last activity / current level), refresh + sign-out |
| `src/admin/admin.css` | dashboard styles (self-contained; loads the game font) |
| `src/analytics/supabase.ts` | `createSupabase(storageKey)` — lazy client; **admin uses storageKey `pixel-perfect:admin`**, the game uses `pixel-perfect:player` (never mix: they must not overwrite each other's session) |

Data the dashboard currently loads (all in `Dashboard.tsx` `load()`):
- `rpc('admin_overview')` → `{ total_players, players_started, players_completed, total_level_completions, active_24h }`
- `rpc('admin_level_stats')` → rows `{ level_id, players_started, players_completed }`
- `from('players').select('*').order(sort).limit(500)`
- `rpc('admin_device_stats')` → rows `{ device_type, device_os, device_model, players }`
  (if this errors, migration 0002 hasn't been run: show the "run 0002" note, don't break)

Removed on purpose (Yotam asked): the "פעילות אחרונה" (recent activity) panel. Don't bring it back unless asked.

**Redesign of 15 Nov 2026 (current).** SaaS-style dashboard from Yotam's two-screen reference:
right sidebar (logo, exactly two nav items: סקירה כללית / שחקנים, sleeping-cat SVG), hash routing
(`#players`). Files: `Dashboard.tsx` (shell, header, account menu, refresh), `Overview.tsx`
(5 KPIs, level-progress bars, device donut, recent players, activity area chart),
`Players.tsx` (3 KPIs, search, 5 filter dropdowns + chips, sortable table, selection → CSV export,
pagination; cards on phones), `charts.tsx`, `ui.tsx` (Dropdown, Kpi, StatusBadge), `icons.tsx`,
`Cat.tsx`, `data.tsx` (loading hook, derived values, formatting).
Data adds `rpc('admin_activity', { p_hours, p_tz })` (migration 0003) and loads **all** players
(paged by 1000). Status: הושלם = game completed; פעיל = seen in last 24 h; בתהליך = reached a level;
לא התחיל. Level bar % = players who reached the level ÷ players who started level 1
(tooltip: place, started, completed, completion rate, drop-off).

## 5. Backend (Supabase) — already set up, do not recreate

Migrations in `supabase/migrations/` (Yotam runs them manually in Supabase → SQL Editor):
- `0001_player_analytics.sql` — **applied**.
- `0002_player_device.sql` — given to Yotam; confirm with him whether it's applied
  (the dashboard handles both cases).
- `0003_admin_activity.sql` — `admin_activity()` for the date range + activity chart; given to
  Yotam on 15 Nov 2026 (dashboard shows a note until it is run).

**Do not create duplicate tables or re-run/rewrite existing migrations.** If the new
design needs new data, add a new numbered migration (`0003_…sql`), make it
re-runnable (`if not exists`, `create or replace`), test it, and tell Yotam to run it.

Schema:
- `players` — `user_id uuid pk → auth.users`, `display_name` ("Player 4821", not unique),
  `first_seen_at`, `last_seen_at`, `games_started`, `current_level` (= furthest level
  reached), `completed_levels_count`, `game_completed`, `game_completed_at`,
  `created_at`, `updated_at`; (0002) `device_type` ('mobile'|'tablet'|'desktop'),
  `device_os`, `device_browser`, `device_model`, `device_updated_at`.
- `player_events` — `id`, `user_id`, `event_type` ('game_started' every play;
  'level_started' / 'level_completed' / 'game_completed' **first time only**, enforced
  by a unique index), `level_id` (1-based play position), `created_at`.
- `admins` — `user_id`. Invisible to clients.

Security model (keep it):
- RLS on all tables. Players read only their own rows; **no client writes** to tables —
  only `track_event()` / `set_device()` (SECURITY DEFINER, validated, own row only).
- `is_admin()` = listed in `admins` **and not anonymous**. Admins can SELECT
  `players` / `player_events`; `admin_*` functions raise for non-admins.
- Admin auth is a real Supabase email+password user (no hidden URL / client flag).
  New admin RPCs must follow the same pattern: `security definer`,
  `set search_path = ''`, `if not public.is_admin() then raise … '42501'`,
  `revoke … from public, anon; grant execute … to authenticated`.
- Test new SQL locally: Postgres 16 is in the sandbox (`/usr/lib/postgresql/16/bin`).
  Stub Supabase with roles `anon`/`authenticated`, schema `auth` with `auth.users`,
  `auth.uid()` from `current_setting('request.jwt.claim.sub')` and `auth.jwt()` from
  `current_setting('request.jwt.claims')`; run 0001 + 0002, then your migration, then
  test as player / anonymous-admin / real admin.

## 6. Game facts the dashboard reports on

- Flow: welcome → story → tutorial (jar; **never tracked**, not a level) → 7 levels → completion.
- The game does **not** save progress between visits (Yotam's choice): every visit
  restarts. So "current level" in analytics = furthest level ever reached.
- Players are anonymous Supabase users, one per browser (persisted session).
- Level order (play position → place; `src/game/levels.ts`, names in `src/copy/he.ts` `level.places`):
  1 AM:PM · המכולת השכונתית · 2 המשרד · צוות הפיתוח · 3 הספארי · תצוגת הפינגווינים ·
  4 דואר ישראל · הסניף השכונתי · 5 רחוב יפה · אתר הבנייה · 6 הלונה פארק · יום כיף ·
  7 נתב״ג · נמל התעופה בן גוריון.
  Level stats are stored by **play position**; the order was changed on 14 Nov 2026,
  so older events for positions 3–7 refer to the previous order (3 = park/airport etc.).
  Import `LEVELS` / `copy.level.places` instead of hard-coding names.

## 7. Design language

**Since the 15 Nov 2026 redesign the dashboard uses its own SaaS tokens (Yotam's brief):**
bg `#F8F9FC`, primary `#7047EB`, ink `#172033`, secondary text `#64748B`, borders `#E8EAF0`,
radius 12–16 px, very soft shadows, font **Heebo** (variable, self-hosted in `src/assets/fonts`).
The list below is the game's language (historical for the dashboard):

- Hebrew UI, `dir="rtl"`. Font: **Secular One** only (one weight, 400; `font-synthesis: none`),
  file `src/assets/fonts/SecularOne-Regular.woff2` (already `@font-face`'d in `admin.css`).
- Colours: page lavender `#ead9f2` (completion screen uses `#f2e6fa`), ink dark purple
  `#3a2a52` / `#2a063d`, muted purple `#7a6a94`, accent purple `#7b5ea7`, pale track
  `#e3d6f0`, white cards radius ~22 px with soft purple shadow,
  primary button yellow `#ffd21f`/`#fecd11` with orange bottom edge `#e2a20b`/`#ec8f02`.
- Motif: the black square pixel (`#000`), square fragments, pixel grids.
- Charts: plain HTML/SVG, single-hue where possible, numbers always visible,
  hover tooltips, no chart libraries. Must work on phone and desktop.
- If Yotam supplies a design reference image, match it pixel-perfectly (render at the
  reference size, measure element boxes, overlay to compare).

## 8. Repo map (other areas — don't modify unless the task needs it)

`src/app/App.tsx` (flow + transitions + analytics calls), `src/game/` (levels, flow,
hit test), `src/puzzle/` (shared puzzle engine), `src/screens/*` (welcome, story,
tutorial, level, complete), `src/analytics/track.ts` + `device.ts` (game-side tracking),
`scripts/*.py` (art pipeline), `docs/SUPABASE_SETUP.md` (setup guide — update it if
you add migrations).

## 9. Start of session checklist

1. `git clone https://github.com/Matoy7/pixel-perfect && cd pixel-perfect && npm ci`
2. Read `src/admin/*`, `supabase/migrations/*`, `docs/SUPABASE_SETUP.md`.
3. `npm run build` to confirm a clean build.
4. Ask Yotam for his dashboard design (reference image / requirements) before
   redesigning, and whether migration 0002 has been run.
5. After each change: build → browser check (mocked Supabase) → commit → push → verify
   the deploy log. End of session: send the full-repo zip.
