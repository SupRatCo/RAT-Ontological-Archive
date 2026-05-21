# RAT Ontological Archive Rebuild Spec

RAT Ontological Archive is an online-first creative archive and community for writers, worldbuilders, artists, and narrative designers.

## Architecture

```txt
React/Vite -> Firebase Auth -> Cloud Firestore -> Cloudinary
```

The app lives in `client/`. Legacy code lives in `legacy/`.

## Visual Direction

The rebuild keeps the RAT mockup direction:

- static space background;
- yellow topbar;
- dark blue sidebar;
- project tiles;
- ROA Community forum panels;
- compact buttons;
- reduced animation.
- icons from `client/public/assets/IconsNew/` via `AppIcon.jsx`;
- configurable accent color and dark/light visual mode.

The zip prototype `Interfaz RAT Ontological Archive.zip` is treated as visual reference only. Its TypeScript screens and mock arrays should not replace the functional JSX screens. When porting design from the prototype, preserve the real service-backed data flow:

```txt
components -> services -> Firebase Auth / Cloud Firestore / Cloudinary
```

Do not introduce static prototype data into production screens.

## Data Ownership

Firestore is the source of truth for users, projects, documents, data files, forum content, and media metadata.

Cloudinary stores binary media. localStorage is limited to small UI preferences and last project id.

## Main Features

- Firebase Auth registration/login/logout.
- Profiles in Firestore.
- Projects with members.
- Documents.
- Flexible Data Files with sections and fields.
- Gallery uploads through Cloudinary.
- Forum split into `Comunidad` and `Proyectos`.
- Forum posts, project publications, comments, likes, and saves.
- Settings diagnostics for Firebase/Firestore/Cloudinary.

## Forum Model

Community posts use:

```txt
type: "community"
sourceType: "normal"
```

Published projects use:

```txt
type: "project"
sourceType: "project"
sourceProjectId
```

All forum posts live in `forumPosts/{postId}` and use subcollections for comments, likes and saved state.

## Deployment

GitHub Pages is the primary deployment target. Firebase Hosting is configured as optional.

## Pending Hardening

- More complete collaborator permission UI.
- Admin Cloudinary cleanup path for physical deletion.
- Stronger moderation tools.
- More granular Firestore rules after real multiuser testing.
- Manual authenticated UI retest after every large visual migration.
