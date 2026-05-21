# Build Report

## Local Firebase + Cloudinary Test

Date: 2026-05-20

## Configuration Check

`client/.env` exists locally. Values were checked without printing secrets.

```txt
VITE_FIREBASE_API_KEY: configured
VITE_FIREBASE_AUTH_DOMAIN: configured
VITE_FIREBASE_PROJECT_ID: configured
VITE_FIREBASE_STORAGE_BUCKET: configured
VITE_FIREBASE_MESSAGING_SENDER_ID: configured
VITE_FIREBASE_APP_ID: configured
VITE_FIREBASE_MEASUREMENT_ID: configured
VITE_CLOUDINARY_CLOUD_NAME: configured
VITE_CLOUDINARY_UPLOAD_PRESET: configured
```

## Legacy Dependency Check

Confirmed in the active client:

- No `apiClient` usage.
- No `VITE_API_URL` usage.
- No `/api/health` dependency.
- No `DATABASE_URL` requirement.
- No Render API dependency.
- No PostgreSQL/Supabase runtime dependency.

The old static frontend and Express/PostgreSQL backend remain in `legacy/` only.

## Install And Build

```txt
npm run build: passed
npm run dev: passed
Local URL: http://127.0.0.1:5173/
```

Build warning:

```txt
Some chunks are larger than 500 kB after minification.
```

Status: non-blocking. This is expected because Firebase adds bundle weight. Future optimization should code-split Firebase-heavy flows.

## Browser Load Check

Browser verification at `http://127.0.0.1:5173/`:

- App loads.
- Login/register screen appears.
- No critical console errors.
- No visible `DATABASE_URL is not configured`.
- No visible `VITE_API_URL` error.
- No Firebase configuration error after real `.env` was present.

## Firebase Auth

Test account:

```txt
username: roatest
email: roa.test.local@example.com
```

Result:

- Firebase Auth user already existed.
- Login with the test password passed.
- Re-login passed.
- Logout is client-side session discard/signOut behavior; REST verification confirms the session can be dropped and re-created.

Status: works.

Note: UI typing automation in the Codex browser was blocked by the browser plugin clipboard/input limitation, not by the app. Auth was verified through Firebase Auth REST using the same configured project.

## Firestore

Verified with Firebase Auth `idToken`, so Firestore rules were enforced.

Created or confirmed:

```txt
users/{uid}: works
usernames/roatest: already existed, readable
userSettings/{uid}: works
projects/{projectId}: works
projects/{projectId}/members/{uid}: works
projects/{projectId}/documents/{documentId}: works
projects/{projectId}/dataFiles/{dataFileId}: works
projects/{projectId}/dataFiles/{dataFileId}/sections/{sectionId}: works
projects/{projectId}/dataFiles/{dataFileId}/sections/{sectionId}/fields/{fieldId}: works
forumPosts/{postId}: works
forumPosts/{postId}/likes/{uid}: works
forumPosts/{postId}/comments/{commentId}: works
forumPosts/{postId}/savedBy/{uid}: works
projects/{projectId}/media/{mediaId}: works
```

Forum counters in the created test post:

```txt
likesCount: 1
commentsCount: 1
savesCount: 1
```

Status: works.

Rules note:

- Attempting to overwrite an existing `usernames/roatest` document returned `Missing or insufficient permissions`.
- This is expected and desirable: username reservations should not be overwritten.
- The test then treated it as an existing reservation and continued.

## Cloudinary

Verified:

- Cloudinary unsigned image upload passed.
- Upload returned a secure URL.
- Upload returned a public ID.
- `users/{uid}.avatarUrl` was updated in Firestore.
- Gallery metadata was written to `projects/{projectId}/media/{mediaId}`.

Status: works.

No Cloudinary API secret was used or requested.

## localStorage

Initial browser check showed no heavy data in localStorage.

Allowed localStorage use remains:

- small UI preferences;
- last active project id.

No project/document/media/forum cache was observed during the tested load.

## Status Matrix

```txt
✅ Firebase config: works
✅ Auth: works
✅ Firestore: works
✅ Projects: works
✅ Documents: works
✅ Archivos de Datos: works
✅ Forum posts: works
✅ Likes: works
✅ Comments: works
✅ Saved posts: works
✅ Cloudinary upload: works
✅ Avatar URL update: works
✅ Gallery metadata: works
✅ Build: works
✅ Dev server: works
✅ Legacy backend dependency removed: works
⚠️ UI form automation: browser tool input limitation, not app failure
⚠️ Bundle size: warning, non-blocking
⚠️ GitHub Pages readiness: code ready, repository variables still need to match local `.env`
```

## Next Steps

1. Configure the same Firebase/Cloudinary values as GitHub repository variables for Pages.
2. Manually verify the browser UI flows with normal typing:
   - register/login;
   - create project;
   - create document;
   - create Data File;
   - create post, like, comment, save;
   - upload avatar and gallery image.
3. Consider splitting Firebase code into lazy chunks to remove the Vite bundle warning.
4. Keep `client/.env` local only. Do not commit it.
