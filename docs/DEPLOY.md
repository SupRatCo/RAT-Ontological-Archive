# Deploy

## Render Backend

Render settings:

```txt
Root Directory: server
Build Command: npm install
Start Command: npm start
```

Required environment variables:

```txt
NODE_ENV=production
PORT=3000
DATABASE_URL=...
JWT_SECRET=...
CORS_ORIGINS=https://supratco.github.io,http://localhost:5173
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=roa-media
STORAGE_PROVIDER=supabase
MAX_UPLOAD_MB=50
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.

## Supabase

Use Supabase PostgreSQL for `DATABASE_URL`.

Create a public or policy-controlled storage bucket named by `SUPABASE_STORAGE_BUCKET`. The current API uses public URLs for uploaded media metadata.

## Frontend

For GitHub Pages, build the Vite client with:

```txt
VITE_API_URL=https://your-render-api.onrender.com
GITHUB_PAGES=true
```

The Vite config sets the base path to `/RAT-Ontological-Archive/` when `GITHUB_PAGES=true`.

This repository includes `.github/workflows/static.yml`, which builds `client/` and uploads only `client/dist`. It no longer uploads the repository root, so the legacy root `index.html` is not the Pages artifact when the workflow runs.

Recommended GitHub variable:

```txt
VITE_API_URL=https://rat-ontological-api.onrender.com
```

If that variable is not set, the workflow falls back to `https://rat-ontological-api.onrender.com`.

## Legacy Root Frontend

The old static frontend still exists at repository root:

```txt
index.html
css/
js/
assets/
img/
```

Recommendation: keep it temporarily until the Vite frontend is confirmed online, then move those files to `legacy/static-app/` or remove them in a dedicated cleanup commit. Do not let GitHub Pages deploy the root app anymore.

## Production Warning

Render local disk is not used for permanent media in this rebuild. Files must live in Supabase Storage or another external storage provider.
