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

## Production Warning

Render local disk is not used for permanent media in this rebuild. Files must live in Supabase Storage or another external storage provider.
