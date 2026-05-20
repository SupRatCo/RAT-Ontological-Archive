# RAT Ontological Archive

RAT Ontological Archive is a production-first creative archive for writers, worldbuilders, narrative designers, artists, and communities.

This rebuild is a clean architecture reset:

```txt
React/Vite frontend -> Express API -> PostgreSQL + Supabase Storage
```

No important app data is stored in `localStorage`. The browser keeps only the JWT token and small UI preferences.

## Stack

- Frontend: React + Vite.
- Backend: Node.js + Express.
- Database: PostgreSQL, recommended through Supabase.
- Storage: Supabase Storage.
- Auth: JWT + bcryptjs.
- Deploy: GitHub Pages/Vercel/Netlify for frontend, Render for backend.

## Run Backend

```bash
cd server
npm install
cp .env.example .env
npm run migrate
npm start
```

Health endpoint:

```txt
http://localhost:3000/api/health
```

## Run Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open:

```txt
http://localhost:5173
```

## Required Backend Env Vars

```txt
NODE_ENV=production
DATABASE_URL=...
JWT_SECRET=...
CORS_ORIGINS=https://supratco.github.io,http://localhost:5173
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=roa-media
STORAGE_PROVIDER=supabase
MAX_UPLOAD_MB=50
```

## Required Frontend Env Vars

```txt
VITE_API_URL=https://your-render-api.onrender.com
VITE_APP_NAME=RAT Ontological Archive
```

## Main Features in This Rebuild Foundation

- JWT auth with register/login/session restore.
- User profiles.
- Project CRUD with owner/editor/viewer roles.
- Documents with WYSIWYG foundation and autosave-ready editor.
- Flexible Data Files with custom sections and fields.
- Supabase Storage upload service.
- Gallery metadata in PostgreSQL.
- Forum posts, likes, saved posts, comments.
- Settings modal with General, Cuenta, Video, Audio, Datos, Proyectos, Seguridad.
- Mockup-based visual shell: yellow topbar, dark sidebar, space background, dark panels, yellow borders.

## Documentation

- [Rebuild Spec](docs/ROA_REBUILD_SPEC.md)
- [Setup](docs/SETUP.md)
- [Deploy](docs/DEPLOY.md)
- [Database](docs/DATABASE.md)
- [API](docs/API.md)
- [Security](docs/SECURITY.md)
- [Build Report](BUILD_REPORT.md)

## Production Notes

SQLite and Render local uploads are not production storage. Use PostgreSQL and Supabase Storage. Do not put Supabase service keys in the frontend.
