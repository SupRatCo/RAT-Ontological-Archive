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
- Visual browser QA after installing frontend dependencies and starting the dev server.

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
