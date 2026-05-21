# Build Report

## Migration Completed

- Moved the old root static frontend to `legacy/static-app/`.
- Moved the Express/PostgreSQL backend to `legacy/server-express-postgres/`.
- Installed Firebase in `client/`.
- Added Firebase initialization under `client/src/firebase/`.
- Replaced the old HTTP API layer with Firebase/Cloudinary services under `client/src/services/`.
- Removed `client/src/api/`.
- Updated settings diagnostics to show Firebase Auth, Cloud Firestore, Cloudinary, Firebase Storage disabled, and Express backend legacy/no required.
- Added Cloudinary unsigned upload flow for gallery media, avatars, and banners.
- Added Firestore services for users, projects, documents, data files, media metadata, forum posts, comments, likes, saves, notifications, tags, and basic friendships.
- Added `firestore.rules`, `firestore.indexes.json`, `firebase.json`, and `.firebaserc`.
- Updated GitHub Pages workflow to build `client/` with Firebase and Cloudinary Vite variables.
- Updated documentation for the Firebase + Cloudinary architecture.

## No Longer Required

- Render as primary backend.
- PostgreSQL as primary database.
- Supabase Storage.
- `DATABASE_URL`.
- `VITE_API_URL`.
- `/api/health` for app startup.

## Required Variables

Set these in `client/.env` locally and GitHub repository variables for Pages:

```txt
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_UPLOAD_PRESET
```

Known project values:

```txt
VITE_FIREBASE_AUTH_DOMAIN=rat-ontological-archive.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rat-ontological-archive
VITE_FIREBASE_STORAGE_BUCKET=rat-ontological-archive.firebasestorage.app
VITE_CLOUDINARY_CLOUD_NAME=daxbclh7a
VITE_CLOUDINARY_UPLOAD_PRESET=roa_unsigned
```

## Verified Locally

- `npm install firebase` completed in `client/`.
- `npm run build` completed successfully in `client/`.
- Static build no longer requires `DATABASE_URL`, Supabase, Render, or `/api/health`.

## Not Fully Tested Here

The following require real Firebase and Cloudinary env vars plus deployed Firestore rules:

- Register/login with Firebase Auth.
- Creating Firestore user/profile documents.
- Creating projects/documents/data files.
- Forum posts, likes, comments, and saved posts.
- Cloudinary uploads.
- Firestore metadata persistence.
- Multiuser permissions.

## Known Limitations

- Login is email + password for this migration. Username login is not implemented yet.
- Cloudinary unsigned upload cannot safely delete physical assets from the browser; the app deletes Firestore metadata only.
- Firestore rules are a production-minded baseline, but should be reviewed after real multiuser testing.
- Some UI flows remain lightweight foundations from the rebuild, especially advanced collaborators, tags UI, and notification UI.
- Firebase bundle size triggers a Vite chunk-size warning; it does not block the build.

## Next Steps

1. Create `client/.env` with real Firebase web app values and Cloudinary preset.
2. Enable Firebase Auth Email/Password.
3. Create Cloud Firestore database.
4. Deploy or paste `firestore.rules` and `firestore.indexes.json`.
5. Create Cloudinary unsigned preset `roa_unsigned`.
6. Run `cd client && npm run dev`.
7. Test register, login, project creation, document creation, Data File editing, post creation, likes/comments/saves, and media upload.
