# Local Setup

The active app is `client/`.

## Install

```bash
cd client
npm install
npm run dev
```

## Environment

Copy:

```bash
cp client/.env.example client/.env
```

Fill Firebase and Cloudinary values. The app no longer needs a local Express API, database URL, or server health endpoint.

## Required Services

- Firebase Authentication: enable Email/Password.
- Cloud Firestore: create database and apply `firestore.rules`.
- Cloudinary: create unsigned upload preset, recommended `roa_unsigned`.

## Legacy

The previous static frontend and Express/PostgreSQL backend live under `legacy/`. They are kept for reference only and are not required for the Firebase app.
