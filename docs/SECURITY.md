# Security

## Authentication

Firebase Authentication handles email/password accounts and session persistence.

## Firestore

Rules are defined in `firestore.rules`.

Current rules enforce:

- users can edit only their own profile/settings;
- usernames are readable and reserved once;
- private projects require membership;
- project writing requires owner/editor membership;
- forum posts are readable by authenticated users when public;
- users can edit/delete only their own posts/comments;
- likes and saved posts are scoped to each user's UID;
- notifications are readable by the recipient.

Review and deploy rules before production use.

## Cloudinary

Cloudinary uses unsigned uploads from the browser. Only `cloud_name` and unsigned preset are exposed. Never expose API secret in Vite or GitHub Pages.

Physical deletion from Cloudinary is intentionally not implemented in the browser. The app deletes Firestore metadata only.

## Local Storage

Allowed:

- UI preferences;
- language/theme;
- last active project id.

Not allowed:

- projects;
- documents;
- media;
- base64;
- forum data;
- Firebase service credentials.
