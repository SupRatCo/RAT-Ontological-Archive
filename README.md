# RAT Ontological Archive

RAT Ontological Archive is a retro-futuristic local web app for writers, worldbuilders, artists and narrative designers. It organizes projects, sections, text files, characters, worlds, organizations, tags, media, permissions and a main community/forum feed.

## Deployment Model

RAT Ontological Archive can run with a static frontend and an external backend:

- GitHub Pages: hosts only the frontend.
- Render, Railway, Fly.io or a VPS: hosts the Node/Express backend.
- PostgreSQL providers such as Supabase, Neon or Railway Postgres: recommended database for multi-user production.

The current frontend is kept in the project root for GitHub Pages compatibility. A matching `client/js/config.js` file is also included as a clean reference if the project is later moved into a dedicated `client/` folder.

## Frontend API Configuration

The frontend reads its API base URL from:

```txt
js/config.js
```

Current development/prod switch:

```js
(function () {
  const isLocalHost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname) || window.location.protocol === "file:";
  window.ROA_CONFIG = Object.assign({
    LOCAL_API_URL: "http://localhost:3000",
    PRODUCTION_API_URL: "",
    API_URL: isLocalHost ? "http://localhost:3000" : ""
  }, window.ROA_CONFIG || {});
})();
```

For GitHub Pages, edit `js/config.js` and set the online backend URL. The backend must use HTTPS because GitHub Pages is served over HTTPS:

```js
(function () {
  const isLocalHost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname) || window.location.protocol === "file:";
  const onlineBackend = "https://mi-backend.onrender.com";
  window.ROA_CONFIG = Object.assign({
    LOCAL_API_URL: "http://localhost:3000",
    PRODUCTION_API_URL: onlineBackend,
    API_URL: isLocalHost ? "http://localhost:3000" : onlineBackend
  }, window.ROA_CONFIG || {});
})();
```

All frontend API calls go through `js/api.js`, which calls:

```txt
${API_URL}/api/...
```

This prevents GitHub Pages from accidentally calling `https://supratco.github.io/api/...`.

If `API_URL` is empty on GitHub Pages, the app shows a server unavailable screen/login warning and blocks fake local login/register. That is intentional: the hosted frontend needs a real backend for shared users, documents, forum posts, likes, comments and uploads.

## Run With Local Server

From the project folder:

```bash
cd server
npm install
npm start
```

Then open:

```txt
http://localhost:3000
```

The server serves the frontend and exposes the API under `/api`.

If dependencies are not installed, `node server.js` can start a limited JSON fallback server for local development, but the intended production/local mode is Express + SQLite.

For a quick health check:

```txt
http://localhost:3000/api/health
```

The fallback server returns `mode: "fallback-json"` and stores temporary development data in `server/data/fallback-db.json`.

## Render Troubleshooting

Recommended Render settings for the backend service:

```txt
Root Directory: server
Build Command: npm install
Start Command: npm start
Runtime: Node 20 LTS
```

If Render shows only this and exits:

```txt
==> Running 'npm start'
> node server.js
==> Exited with status 1
```

Check the startup logs printed by `server/server.js`. The server now logs:

- Node version,
- environment,
- `PORT`,
- working directory,
- server directory,
- frontend/static root,
- SQLite database path,
- uploads path,
- route registration,
- SQLite initialization result.

It also captures global startup failures with:

- `UNCAUGHT EXCEPTION:`,
- `UNHANDLED REJECTION:`,
- `Could not initialize SQLite database:`.

Common Render causes:

- `Root Directory` is not set to `server`.
- Node is still 24.x instead of 20.x.
- Build cache reused old native `sqlite3` artifacts. Use `Manual Deploy > Clear build cache & deploy`.
- `sqlite3` native binary was cached from an incompatible Linux image. The backend currently pins `sqlite3` to `5.1.7` to avoid the Render `GLIBC_2.38 not found` failure.
- `DATABASE_PATH` points to a directory that does not exist or is not writable.
- SQLite is running on ephemeral disk without a persistent volume.
- Uploads are stored in `server/uploads`, which is also ephemeral unless a persistent disk is attached.

Render provides the port through `process.env.PORT`; the backend listens on `0.0.0.0` with that value. Do not hardcode a fixed port in Render.

If `sqlite3@5.1.7` still fails on Render, force a native rebuild in Render:

```txt
Build Command: npm install --build-from-source=sqlite3
```

Or set this environment variable:

```txt
npm_config_build_from_source=true
```

After changing any Node/sqlite setting, use `Manual Deploy > Clear build cache & deploy`, not a normal deploy.

## Performance Mode

Open Settings > Rendimiento to reduce visual load on slower machines.

Available controls:

- Modo rendimiento: reduces glow, shadows, blur and animated background work.
- Calidad visual: Alta, Media, Baja and Ultra baja.
- Fondo: Animado, Estatico or Color plano.
- Toggles for reduced motion, glows, large shadows, transitions, particles and UI sounds.

These preferences are saved with the current user and applied as global body classes such as `performance-mode`, `quality-low`, `quality-ultra-low`, `reduced-motion`, `no-glow`, `no-particles` and `flat-background`.

The app also respects the browser/system `prefers-reduced-motion` setting.

## Server Stack

- Node.js
- Express
- SQLite
- Multer for image/video/avatar uploads
- bcrypt for local passwords
- JSON Web Tokens for sessions
- CORS

Production runtime:

- Recommended Node runtime: `20.x`.
- Current SQLite package: `sqlite3` `5.1.7`.
- `server/package.json` pins Render/Railway-compatible runtime selection with:

```json
"engines": {
  "node": "20.x"
}
```

Do not deploy the backend on Node 24 for now. Render has shown `GLIBC_2.38 not found required by sqlite3` with native `sqlite3` builds. The backend currently pins `sqlite3` to `5.1.7`, which is the Render-compatible target being used for this SQLite deployment.

After changing Render from Node 24 to Node 20, run:

```txt
Manual Deploy > Clear build cache & deploy
```

This forces Render to rebuild native dependencies like `sqlite3` for the Node 20 environment instead of reusing an incompatible cached build.

Current dependency baseline:

- `bcrypt` `^6.0.0`
- `sqlite3` `5.1.7`

Local note: downgrading `sqlite3` to `5.1.7` can reintroduce audit warnings through older transitive build dependencies. Do not run `npm audit fix --force` blindly, because it may upgrade native SQLite packages back into the Render-incompatible path. For a stronger production setup, migrate the backend database layer to PostgreSQL.

The backend allows requests from:

```txt
https://supratco.github.io
http://localhost:3000
http://127.0.0.1:3000
```

You can override allowed origins in hosting with:

```txt
CORS_ORIGINS=https://supratco.github.io,https://tu-dominio.com
```

Important: CORS uses origins only, not paths. For `https://supratco.github.io/RAT-Ontological-Archive/`, the allowed origin is:

```txt
https://supratco.github.io
```

The SQLite database is created at:

```txt
server/data/database.sqlite
```

Main tables include users, projects, project_members, sections, files, file_fields, tags, media, notifications, access_requests, forum_posts, forum_comments and forum_votes.

Forum tables use indexes on post creation date, visibility, author, comments and votes. Likes are stored server-side with one vote per user/target, so counters persist after reload and are shared across accounts.

Important production note: SQLite is fine for local use, prototypes and small deployments with a persistent disk. For serious multi-user production, use PostgreSQL/Supabase/Neon/Railway Postgres. A PostgreSQL adapter is not currently implemented.

Uploads are stored under:

```txt
server/uploads/
```

On hosting with ephemeral storage, uploaded avatars/images/videos can disappear after a deploy or restart. Use a persistent volume or move media to Supabase Storage, Cloudinary, S3/R2 or a similar service.

## Online Deployment Checklist

Use this checklist when deploying the real web version with GitHub Pages plus an external backend.

1. Deploy the backend from `server/` to Render, Railway, Fly.io or a VPS.
2. Set backend environment variables:
   - `JWT_SECRET`: long random secret.
   - `CORS_ORIGINS=https://supratco.github.io`
   - `PORT`: usually provided by the host.
   - `DATABASE_PATH`: optional SQLite path if using a persistent disk.
3. Make sure the backend URL is HTTPS, for example `https://mi-backend.onrender.com`.
4. Configure the backend service to use Node 20 LTS, not Node 24.
5. On Render, use `Manual Deploy > Clear build cache & deploy` after changing the Node version.
6. Open `https://mi-backend.onrender.com/api/health` and confirm it returns JSON with `ok: true`.
7. If using SQLite, attach a persistent disk and point the database to it. Without persistent storage, `server/data/database.sqlite` can be reset by redeploys/restarts depending on the host.
8. If using uploads, attach persistent storage for `server/uploads/`. Without it, avatars, banners, images and videos can disappear after deploys/restarts.
9. Edit `js/config.js` and set `onlineBackend`/`API_URL` to the deployed backend URL.
10. Commit and push the frontend to GitHub Pages.
11. Open `https://supratco.github.io/RAT-Ontological-Archive/`.
12. In Settings > Server, press `Probar conexion`.
13. Test real flows from GitHub Pages:
    - register/login,
    - create a project,
    - create and save a document,
    - publish a forum post,
    - comment and like from a second user,
    - upload an avatar/image/video.

This repository cannot prove the online deployment is working until a real backend URL is provided and reachable from this environment. The local code is prepared for it, but the final online verification must be done against the deployed backend.

## Frontend Structure

The existing frontend remains in the project root so GitHub Pages can serve `index.html` directly.

Important modules:

- `js/config.js`: frontend API URL configuration.
- `js/api.js`: centralized API calls.
- `js/state.js`: global state, pending changes, autosave and save status.
- `js/editor.js`: WYSIWYG Docs editor tools.
- `js/dynamicFields.js`: internal sections and custom fields.
- `js/forum.js`: main forum/menu feed.
- `js/contextMenu.js`: right-click contextual menus for projects, files, modules and forum posts.
- `js/i18n.js`: lightweight language dictionaries.

## Main Features

- Local user registration, login and logout.
- Editable profile with avatar.
- Public/private projects and simulated roles: owner, editor and reader.
- Access requests and notifications.
- Project dashboards with base and custom modules.
- Documents with a visual WYSIWYG Docs editor.
- Editor toolbar: save, publish, undo/redo, bold, italic, underline, strike, titles, lists, quotes, separator, alignment, internal links, normal links, image insertion, emojis, font selector, size selector, color, highlight, clear content, on-screen keyboard and speech-to-text.
- Documents can be published to the forum as snapshots.
- Autosave every 60 seconds and unsaved-change warnings.
- Dynamic internal sections and custom fields for all file types.
- Gallery for images and videos.
- Character image matching by shared tags.
- Minimized/expanded sidebar.
- Main forum opened by clicking the RAT Ontological Archive logo.
- Forum posts, document posts, comments, direct replies, toggle likes, saved posts, filters, search and public profiles.
- Profile customization with avatar, banner, bio, links and accent color.
- Settings split into tabs: General, Account, Appearance, Audio, Video, Language, Data, Projects, Accessibility and Server.
- Settings include Rendimiento and Server diagnostics.
- Language selector for Spanish LATAM, Spanish Spain, English and Portuguese.

## Server Diagnostics

Open Settings > Server and press `Probar conexion`.

The panel shows:

- current backend URL,
- connected/disconnected state,
- approximate latency,
- server mode,
- recent API errors captured by `js/api.js`.

If the backend is off or `API_URL` is wrong, the app should show a clear message instead of only `Failed to Fetch`.

## Audit Report

A full audit log is available in:

```txt
AUDIT_REPORT.md
```

It lists verified flows, corrected bugs, remaining production limitations and hosting requirements.

## Test Multi-User Forum

To verify that the forum is shared through the backend:

1. Start the backend.
2. Create User A and publish a public post.
3. Log out and create/log in as User B.
4. Open the forum. User B should see User A's post.
5. User B comments and likes it.
6. Log back in as User A. The comment and like count should still be visible.

The feed uses `/api/forum/posts` with pagination and the `Cargar mas` button. Comments and likes are stored on the server, not as global forum data in localStorage.

Private posts, private files and private sections are now checked by the backend, not only hidden in the UI.

## Text Editor Notes

Speech-to-text uses the browser Web Speech API. If the browser does not support it, the app shows a friendly warning and continues working.

Images inserted into text come from the project gallery. In server mode, media uploads are stored under `server/uploads`.

## Local Cache And Upload Sessions

When `API_URL` is configured, the backend is the source of truth for users, projects, files, gallery media, forum posts, comments and likes. Browser `localStorage` is used only for the auth token, small UI preferences, current user/project ids and lightweight project indexes. It should not store base64 images, videos or full project payloads in server mode.

If old browser data causes quota errors, open `Configuracion > Datos` and use `Limpiar cache local`. This preserves the server token when possible and rewrites `rat_ontological_archive_data_v1` as a lightweight cache.

Uploads use `Authorization: Bearer <token>` through `js/api.js`. For `FormData` uploads, do not set `Content-Type` manually; the browser must add the multipart boundary. If uploads return `401`, log in again and confirm Render has a stable `JWT_SECRET` environment variable so tokens survive backend restarts.

Save behavior:

- Manual save waits for the server before showing `Guardado`.
- Autosave runs every 60 seconds when a file has pending changes.
- Internal sections and custom fields are persisted with the file payload.
- On reload/login, projects are rehydrated with files, sections, tags and gallery records from the API when server mode is available.

## Direct File Mode

Opening `index.html` directly can still work for local development if `js/config.js` points to a running backend such as `http://localhost:3000`. Server mode is recommended for real persistence, uploads and forum workflows.
