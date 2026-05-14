# RAT Ontological Archive

RAT Ontological Archive is a retro-futuristic local web app for writers, worldbuilders, artists and narrative designers. It organizes projects, sections, text files, characters, worlds, organizations, tags, media, permissions and a main community/forum feed.

## Run With Server

From the project folder:

```bash
cd ROApp/server
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

## Server Stack

- Node.js
- Express
- SQLite
- Multer for image/video/avatar uploads
- bcrypt for local passwords
- JSON Web Tokens for sessions
- CORS

The SQLite database is created at:

```txt
ROApp/server/data/database.sqlite
```

Main tables include users, projects, project_members, sections, files, file_fields, tags, media, notifications, access_requests, forum_posts, forum_comments and forum_votes.

## Frontend

The existing frontend remains in the project root so `index.html` can still be opened directly as a fallback. When opened through `http://localhost:3000`, it uses `js/api.js` for server persistence.

Important modules:

- `js/api.js`: centralized API calls.
- `js/state.js`: global state, pending changes, autosave and save status.
- `js/editor.js`: advanced text editor tools.
- `js/dynamicFields.js`: internal sections and custom fields.
- `js/forum.js`: main forum/menu feed.

## Main Features

- Local user registration, login and logout.
- Editable profile with avatar.
- Public/private projects and simulated roles: owner, editor and reader.
- Access requests and notifications.
- Project dashboards with base and custom modules.
- Text files with Markdown/wiki preview.
- Editor toolbar: bold, italic, underline, strike, title, subtitle, lists, quotes, separator, internal links, normal links, image insertion, emojis, font selector, size selector, clear text, on-screen keyboard and speech-to-text.
- Autosave every 60 seconds and unsaved-change warnings.
- Dynamic internal sections and custom fields for all file types.
- Gallery for images and videos.
- Character image matching by shared tags.
- Minimized/expanded sidebar.
- Main forum opened by clicking the RAT Ontological Archive logo.
- Forum posts, comments, replies, votes, saved posts, filters, search and public profiles.

## Text Editor Notes

Speech-to-text uses the browser Web Speech API. If the browser does not support it, the app shows a friendly warning and continues working.

Images inserted into text come from the project gallery. In server mode, media uploads are stored under `server/uploads`.

Save behavior:

- Manual save waits for the server before showing `Guardado`.
- Autosave runs every 60 seconds when a file has pending changes.
- Internal sections and custom fields are persisted with the file payload.
- On reload/login, projects are rehydrated with files, sections, tags and gallery records from the API when server mode is available.

## Direct File Mode

Opening `index.html` directly still works for offline fallback using localStorage. Server mode is recommended for real persistence, uploads and forum workflows.
