# RAT Ontological Archive Rebuild Spec

RAT Ontological Archive is a production-first web platform for writers, worldbuilders, narrative designers, artists, and creative communities. This rebuild replaces the accumulated local-first legacy stack with a clear client/server architecture.

## Stack

- Frontend: React + Vite.
- Backend: Node.js + Express.
- Database: PostgreSQL, intended for Supabase PostgreSQL.
- Storage: Supabase Storage.
- Auth: JWT + bcryptjs.
- Deploy: static frontend on GitHub Pages, Vercel, or Netlify; API on Render.

## Architecture

```txt
Client React/Vite -> Express API -> PostgreSQL + Supabase Storage
```

The browser stores only small session/UI values: JWT token, UI preferences, language, and last active project id. Projects, documents, data files, media, forum posts, comments, likes, profiles, and permissions live in PostgreSQL or Supabase Storage.

## Folder Structure

- `client/`: React/Vite app.
- `client/src/api/`: only allowed frontend API layer.
- `client/src/components/`: UI, layout, auth, projects, documents, data files, gallery, forum, profile, settings, social.
- `client/src/pages/`: route-like page components.
- `client/src/styles/`: visual system based on the RAT mockups.
- `server/`: Express API.
- `server/db/`: PostgreSQL pool, schema, migration script.
- `server/routes/`: versioned API routes under `/api`.
- `server/services/`: business logic.
- `server/middleware/`: auth, permissions, uploads, validation, rate limits, errors.
- `docs/`: setup, deploy, database, API, and security notes.

## Visual Design

The base interface follows the provided mockups:

- static space background;
- yellow topbar;
- dark blue sidebar;
- large FORUM button;
- project rail;
- dark panels with yellow borders;
- compact controls;
- reduced animations by default.

## Data Model

The schema includes:

- `users`, `user_profiles`, `user_settings`;
- `projects`, `project_members`, `project_invites`, `friendships`;
- `documents`;
- `data_files`, `data_file_sections`, `data_file_fields`;
- `tags`, `file_tags`;
- `media`, `media_tags`;
- `forum_posts`, `forum_comments`, `forum_likes`, `saved_posts`;
- `notifications`.

## API Groups

- `/api/health`
- `/api/auth`
- `/api/users`
- `/api/projects`
- `/api/collaborators`
- `/api/documents`
- `/api/data-files`
- `/api/tags`
- `/api/media`
- `/api/forum`
- `/api/notifications`
- `/api/settings`

All responses use:

```json
{ "ok": true, "data": {} }
```

Errors use:

```json
{ "ok": false, "error": "Clear message" }
```

## Roles and Permissions

Project roles:

- `owner`: full control.
- `editor`: create and edit content.
- `viewer`: read allowed content.

The backend validates project permissions. UI visibility is not considered security.

## Environment

Backend needs:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`

Frontend needs:

- `VITE_API_URL`

## Completed Foundation

- Clean Express/PostgreSQL API scaffold.
- PostgreSQL schema and migration.
- JWT auth registration/login/session.
- Project CRUD foundation.
- Documents CRUD foundation with HTML sanitization.
- Flexible Data File foundation.
- Supabase Storage service.
- Forum posts, comments, likes, saved posts foundation.
- React/Vite frontend foundation.
- Mockup-based visual layout.

## Pending

- Full route-level UI navigation beyond the single-page internal state.
- Complete rich text editor commands beyond browser `execCommand`.
- Full collaborator management UI.
- Full notification creation for every event.
- Complete i18n dictionaries.
- Automated test suite.
- Production deployment verification with real Supabase credentials.
