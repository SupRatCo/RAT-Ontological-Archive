# Deploy

## Primary Hosting: GitHub Pages

The workflow `.github/workflows/static.yml` builds `client/` and publishes `client/dist`.

Configure GitHub repository variables:

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

Recommended Cloudinary values:

```txt
VITE_CLOUDINARY_CLOUD_NAME=daxbclh7a
VITE_CLOUDINARY_UPLOAD_PRESET=roa_unsigned
```

## Firebase

Enable Email/Password Auth and Cloud Firestore.

Deploy rules and indexes with Firebase CLI if available:

```bash
firebase deploy --only firestore
```

Firebase Hosting is optional. `firebase.json` points to `client/dist`.

## Cloudinary

Create an unsigned upload preset. Do not expose Cloudinary API secret in the frontend.

## Legacy Backend

The Express/PostgreSQL backend is now in `legacy/server-express-postgres/`. It is not required for the main Firebase app.
