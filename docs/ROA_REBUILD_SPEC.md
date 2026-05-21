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
- Forum posts, comments, likes, and saves.
- Settings diagnostics for Firebase/Firestore/Cloudinary.

## Deployment

GitHub Pages is the primary deployment target. Firebase Hosting is configured as optional.

## Pending Hardening

- More complete collaborator permission UI.
- Admin Cloudinary cleanup path for physical deletion.
- Stronger moderation tools.
- More granular Firestore rules after real multiuser testing.
