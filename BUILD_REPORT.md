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

## Initialization Permission Stabilization

Date: 2026-05-21

Reported issue:

```txt
The published app stayed on "Inicializando archivo..."
FirebaseError: Missing or insufficient permissions.
```

Root cause found:

- The auth initialization callback could throw before `setBooting(false)` ran. Any Firestore permission error during session restore left the app permanently in the loading state.
- `getUserProjects()` used a `collectionGroup("members")` query. That query is fragile under production Firestore rules because rules must prove every possible document in the collection group is readable.
- The saved-posts forum loader used an open `forumPosts` read. If private posts exist, that query can be rejected because the rule only allows public posts or posts authored by the current user.

Corrections applied:

- `client/src/App.jsx`
  - Added controlled initialization error state.
  - Wrapped auth/session initialization in `try/catch/finally`.
  - Added a visible recovery panel with Reintentar, Cerrar sesión, and Limpiar datos locales.
  - `lastProjectId` is now removed if the project is missing or no longer readable, then the app returns to forum/home instead of hanging.
- `client/src/services/authService.js`
  - `subscribeToAuthState()` now awaits async callbacks and reports initialization errors.
  - `getUserBundle()` logs safe initialization failures for `users/{uid}` and `userSettings/{uid}`.
  - Missing user/settings docs are created with safe defaults when rules allow it.
- `client/src/services/projectService.js`
  - Replaced the collection-group membership query with a safer owner query:

```txt
projects where ownerId == current uid
```

  - This avoids the production permission-denied during startup.
  - Temporary limitation: collaborator projects are not loaded into the sidebar by this query yet. A future pass should add a dedicated `userProjectMemberships/{uid}/projects/{projectId}` index or another rules-compatible membership lookup.
- `client/src/services/forumService.js`
  - Saved-post and feed queries now filter public posts explicitly before ordering.
  - Forum load failures log `[ROA Init] Failed loading forum`.
- `firestore.rules`
  - Project reads now allow the owner directly via `resource.data.ownerId == request.auth.uid`, in addition to public/member access.

Safe logs added:

```txt
[ROA Init] Failed loading user profile
[ROA Init] Failed loading settings
[ROA Init] Failed loading projects
[ROA Init] Failed loading forum
[ROA Init] Initialization failed
```

Verification:

```txt
npm run build: passed
Local Vite HTTP check: 200
Browser startup at http://127.0.0.1:5173/: passed
Stuck on "Inicializando archivo...": no
Visible init error on clean startup: no
Critical console errors on clean startup: none observed
```

Build warning remains non-blocking:

```txt
Some chunks are larger than 500 kB after minification.
```

Blocked/not fully re-tested:

- UI login/reload with an active browser Firebase session could not be completed through the Codex browser because its input automation failed with the known virtual clipboard limitation.
- The project query now loads owned projects only. Collaborator-project loading needs a rules-safe index strategy before being restored.

Deploy note:

- The updated `firestore.rules` must be deployed to Firebase for the published GitHub Pages app to receive the permission fix.
- After deploying rules and frontend changes, retest:
  - refresh with an active session;
  - refresh after clearing `lastProjectId`;
  - enter forum;
  - open an owned project;
  - verify no infinite loading state appears.

## Visual Redesign And Icon Pass

Date: 2026-05-21

Reference target:

- Space background, compact yellow topbar, dark-blue left rail, large FORUM button, project cards in the sidebar, ROA Forum/Community panel, yellow-bordered cards and centered configuration modal.

Changes applied:

- Added a centralized icon component:

```txt
client/src/components/ui/AppIcon.jsx
```

- Moved the available icon pack into the Vite public path:

```txt
client/public/assets/Icons/
```

This keeps icon URLs compatible with GitHub Pages through `import.meta.env.BASE_URL`.

- Replaced visible emoji-style UI icons in:
  - topbar settings/social/search;
  - sidebar forum/create/project entries;
  - project dashboard modules;
  - forum like/comment/save buttons;
  - document list/toolbar;
  - gallery cards/upload action;
  - settings logout/close action;
  - Data File actions.

- Added `client/src/styles/themes.css`.
  - `themeColor`: `gold`, `purple`, `blue`, `cyan`, `red`, `green`.
  - `visualMode`: `dark`, `light`.
  - `reducedMotion`: document-level reduced transition handling.

- `App.jsx` now applies:

```txt
document.documentElement.dataset.themeColor
document.documentElement.dataset.visualMode
document.documentElement.dataset.reducedMotion
```

- `Configuracion > Video` now exposes real controls for:
  - Tema de color;
  - Modo visual oscuro/claro;
  - Calidad visual;
  - Reducir animaciones.

- Redesign/polish pass started for:
  - topbar proportions and icons;
  - sidebar project buttons;
  - settings modal layout;
  - project dashboard cards;
  - forum post actions;
  - document list/editor;
  - data-file editor with field type picker and section rename/delete;
  - gallery card metadata display.

Functional work completed in this pass:

- Documents:
  - added title editing in the editor;
  - added document deletion;
  - kept Firestore save path through `documentService.updateDocument`.

- Archivos de Datos:
  - added visible field type picker when creating fields;
  - added section rename;
  - added field deletion;
  - improved rendering for `short_text`, `long_text`, `number`, `checkbox`, `list`, `select`, `date`, `url`, `image`, `tag`, and `relation`.

Verification:

```txt
npm run build: passed
Local Vite HTTP check: 200
Browser startup at http://127.0.0.1:5173/: passed
Critical console errors on clean startup: none observed
```

Known limitations:

- UI login/form automation is still limited by the Codex browser input issue, so full manual Firebase flows should be retested in a normal browser after deploy.
- The Vite/Firebase bundle-size warning remains non-blocking.
- Collaborator projects are still intentionally not restored in the sidebar until a rules-safe membership index is implemented.
