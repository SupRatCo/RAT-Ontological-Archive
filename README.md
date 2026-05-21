# RAT Ontological Archive

RAT Ontological Archive is a web platform for writers, worldbuilders, narrative designers, and creative communities.

The current app is the React/Vite rebuild in `client/`.

```txt
React/Vite frontend -> Firebase Auth -> Cloud Firestore -> Cloudinary
```

The old static app and Express/PostgreSQL backend were moved to `legacy/` and are not required for the main app.

## Stack

- Frontend: React + Vite.
- Auth: Firebase Authentication.
- Database: Cloud Firestore.
- Media: Cloudinary unsigned uploads.
- Hosting: GitHub Pages first, Firebase Hosting optional.
- Legacy: `legacy/server-express-postgres/` and `legacy/static-app/`.

## Current UI Direction

The active frontend follows the RAT mockups directly:

- dark space background;
- strong yellow topbar;
- compact dark-blue sidebar;
- yellow FORUM button and project rail;
- dark panels with yellow/blue borders;
- centered settings modal;
- ROA Forum split into `Comunidad` and `Proyectos`.

Primary UI icons are loaded from:

```txt
client/public/assets/IconsNew/
```

through `client/src/components/ui/AppIcon.jsx`, using Vite `BASE_URL` so GitHub Pages paths stay valid.

## Forum

The forum supports two publication types:

- `Comunidad`: normal community posts.
- `Proyectos`: project publications created from a project dashboard or the forum project section.

Posts support opening a detail view, comments, likes and saved state through Firestore subcollections.

## Local Setup

```bash
cd client
npm install
npm run dev
```

Create `client/.env` from `client/.env.example`.

Required frontend variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=rat-ontological-archive.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rat-ontological-archive
VITE_FIREBASE_STORAGE_BUCKET=rat-ontological-archive.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

VITE_CLOUDINARY_CLOUD_NAME=daxbclh7a
VITE_CLOUDINARY_UPLOAD_PRESET=roa_unsigned
```

Firebase web config values are safe to expose in Vite. Do not put Firebase service account keys or Cloudinary API secrets in the frontend.

## Firebase

Enable:

- Firebase Authentication with Email/Password.
- Cloud Firestore.

Deploy or paste the rules from `firestore.rules` and indexes from `firestore.indexes.json`.

## Cloudinary

Create an unsigned upload preset, recommended name:

```txt
roa_unsigned
```

Firebase Storage is not used in this version. Images, videos, avatars, banners, covers, and gallery media upload to Cloudinary; Firestore stores only metadata.

Unsigned uploads cannot securely delete physical Cloudinary assets from the browser. The app deletes Firestore metadata; physical cleanup should be handled later by an admin workflow or backend function.

## Deploy

GitHub Pages builds `client/` through `.github/workflows/static.yml`.

Configure repository variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

Firebase Hosting is prepared with `firebase.json`, but GitHub Pages remains the primary hosting target.

## Current Functional Surface

- Register/login/logout through Firebase Auth.
- User profiles in Firestore.
- Projects and project members in Firestore.
- Documents in Firestore.
- Flexible Data Files with sections and fields in Firestore.
- Forum posts, likes, saves, and comments in Firestore.
- Gallery media uploads to Cloudinary with metadata in Firestore.
- Settings diagnostics show Firebase/Firestore/Cloudinary instead of server health.

See `BUILD_REPORT.md` for verified status and known limitations.

## Visual Prototype Integration

The visual prototype from `Interfaz RAT Ontological Archive.zip` was inspected and folded into the real app as design guidance, not as a replacement. Its TypeScript mock screens use static data, so the real `client/` components keep calling Firebase/Firestore/Cloudinary services while adopting the prototype's visual structure: yellow topbar, dark project rail, ROA forum panels, stronger dashboard cards, centered settings modal, and compact archive-style controls.

Primary icons are loaded from `client/public/assets/IconsNew/` through `client/src/components/ui/AppIcon.jsx`, using `import.meta.env.BASE_URL` so GitHub Pages asset paths remain valid under `/RAT-Ontological-Archive/`.
