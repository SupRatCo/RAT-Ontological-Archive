# BUILD REPORT

Date: 2026-05-20

## What Was Created

- New `client/` React + Vite frontend.
- New `server/` Express API foundation using PostgreSQL.
- PostgreSQL schema in `server/db/schema.sql`.
- Migration script in `server/db/migrate.js`.
- Supabase Storage service in `server/services/storage.service.js`.
- JWT auth foundation with bcryptjs password hashing.
- Backend routes for auth, users, projects, collaborators, documents, data files, tags, media, forum, notifications, and settings.
- Frontend API layer in `client/src/api/apiClient.js`; no new fetch calls are outside that layer.
- RAT mockup-based visual shell: yellow topbar, dark sidebar, space background, panel system, forum layout, settings modal.
- Documentation under `docs/`.

## Stabilization Audit Status

This is not a finished app yet. It is a functional rebuild foundation with several partial screens.

### Complete Enough to Treat as Foundation

- `client/` exists as a React/Vite app and builds successfully.
- `server/` starts as an Express API and exposes `/api/health`.
- `server/db/schema.sql` defines the intended PostgreSQL production schema.
- `server/db/migrate.js` can apply the schema when `DATABASE_URL` exists.
- `client/src/api/apiClient.js` centralizes frontend HTTP requests.
- No direct `fetch()` calls were found outside `apiClient.js`.
- `localStorage` use is limited to token, UI preferences, and last project id.
- `.github/workflows/static.yml` now builds `client/` and deploys `client/dist` to GitHub Pages.

### Partial but Connected

- Login/register UI calls the backend auth endpoints.
- Project create/list/open UI calls backend project endpoints.
- Docs list/create/save calls backend document endpoints, but creation still uses `prompt()` and the editor is a minimal contenteditable foundation.
- Data Files list/create/open calls backend endpoints, but create section/field still uses `prompt()` and field editing is basic.
- Gallery list/upload calls backend media endpoints, but upload requires real Supabase env vars.
- Forum feed/create/like/save calls backend forum endpoints, but post details and comment UI are not fully wired into navigation.
- Settings can update basic settings/profile and test server status, but several panels are foundations only.

### Placeholder or Incomplete UI

- `client/src/components/social/FriendsModal.jsx`: explicitly says the social system is prepared; only user search is lightly wired.
- `client/src/components/social/CollaboratorInviteModal.jsx`: placeholder text; not connected into project screens yet.
- `client/src/components/settings/AudioSettings.jsx`: says sounds are prepared for later.
- `client/src/components/settings/SettingsModal.jsx`: Seguridad tab is informational only.
- `client/src/pages/DocumentPage.jsx`: document creation uses `prompt()` instead of final modal.
- `client/src/pages/DataFilePage.jsx`: data file, section, and field creation use `prompt()` instead of final modals.
- `client/src/components/forum/ForumFeed.jsx`: `onOpen` and `onComment` are currently empty handlers in post cards.
- `client/src/pages/ProjectPage.jsx`: returns `null` if no project; acceptable guard, but not a designed empty state.
- `client/src/components/projects/ProjectSettings.jsx`: placeholder panel.
- `client/src/components/projects/ProjectMembers.jsx`: display-only list; invite/change-role UI is not wired.
- Full i18n is not implemented, only the settings selector foundation exists.

## Implemented Functional Foundation

- Register/login/session restore via backend.
- Project creation/listing/opening.
- Document list/create/edit/save foundation.
- Data File list/create/open with dynamic sections and fields.
- Media upload endpoint wired to Supabase Storage.
- Forum feed, normal post creation, likes, saved posts, and comments API foundation.
- User profile update foundation.
- Server diagnostics via health/settings endpoints.

## What Remains Pending

- Full production deployment test with real Supabase PostgreSQL and Storage variables.
- Complete rich text editor replacement for browser `execCommand`.
- Full UI for editing/deleting every document, data field, tag, collaborator, notification, and project setting.
- Complete social/friends workflow UI beyond the prepared modal and API.
- Full i18n dictionaries.
- Full notification creation hooks for every event.
- Automated test suite.
- Full visual browser QA across all flows and breakpoints.

## Not Tested Here

- Real Supabase Storage upload, because no real Supabase service role key is present in the repo.
- Real PostgreSQL persistence, because `DATABASE_URL` is not configured in this local environment.
- Multiuser live forum flow against deployed Render/Supabase.

## Verification Performed

- `npm install` completed in `server/`.
- `npm install` completed in `client/`.
- `npm run build` completed in `client/`.
- `node --check` passed for server JavaScript files.
- The backend starts without crashing in this environment.
- `GET /api/health` responds with `ok:false` and the exact missing production variables when PostgreSQL/Supabase env vars are absent. This is expected until real secrets are configured.
- `npm run dev` in `client/` served `http://127.0.0.1:5173`.
- Browser verification loaded the Vite frontend login screen without critical console errors.
- `rg` confirmed no network calls outside `client/src/api/apiClient.js`.

## Current Health Result Without Production Env

```json
{
  "ok": false,
  "name": "RAT Ontological Archive",
  "mode": "express-postgres",
  "database": "missing",
  "storage": "missing",
  "missing": [
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_STORAGE_BUCKET"
  ]
}
```

This is the correct degraded state for the current local environment. Real auth/project/forum/upload flows cannot be honestly verified until those variables exist.

## Local Environment Note

This machine is currently using Node `v24.15.0`, so `npm install` prints an `EBADENGINE` warning for the server because the backend is intentionally pinned to Node `20.x` for Render compatibility. The install still completed here; Render should use Node 20.

## How to Run

Backend:

```bash
cd server
npm install
cp .env.example .env
npm run migrate
npm start
```

Frontend:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

## Required Production Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `VITE_API_URL`

## Known Risks

- The old root static app still exists in `index.html`, `css/`, and `js/`. The new rebuild lives in `client/`; deployment should point to the Vite build output.
- Legacy SQLite data and local uploads are physically present but no longer part of the new production path.
- The lightweight HTML sanitizer is intentionally conservative but should be replaced with a hardened sanitizer before a large public launch.

## Legacy Frontend Recommendation

The old root frontend should not be deployed anymore. Recommended sequence:

1. Keep root `index.html`, `css/`, `js/`, `assets/`, and `img/` temporarily so the current live site is not accidentally destroyed before the Vite deploy is confirmed.
2. Use the updated GitHub Pages workflow, which deploys only `client/dist`.
3. After the Vite deployment is confirmed online, move the old static app to `legacy/static-app/` or remove it in a dedicated cleanup commit.

## Frontend Deploy Strategy

Preferred options:

- Vercel/Netlify: point the project root to `client/`, build command `npm run build`, output `dist`, env `VITE_API_URL`.
- GitHub Pages: use `.github/workflows/static.yml`, which runs `npm ci` in `client/`, builds with `GITHUB_PAGES=true`, and uploads `client/dist`.

For GitHub Pages, configure repository variable:

```txt
VITE_API_URL=https://rat-ontological-api.onrender.com
```

The workflow has a fallback to that same URL if the variable is not set.

## Next Stabilization Steps Before Calling This Functional

1. Configure real `DATABASE_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`.
2. Run `npm run migrate` in `server/`.
3. Re-run real flows: register, login, create project, create document, create data file, upload image, create post, comment, like, logout/login, reload persistence.
4. Replace `prompt()` flows with proper modals.
5. Wire forum post open/comment UI.
6. Wire project collaborators UI.
7. Decide final fate of root legacy frontend after Vite deploy is confirmed.
