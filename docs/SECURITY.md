# Security

## Authentication

- Passwords are hashed with `bcryptjs`.
- JWT tokens are signed with `JWT_SECRET`.
- Production must set a stable strong `JWT_SECRET`.
- The frontend stores only the JWT token and small preferences.

## Authorization

Project access is checked in the backend:

- `owner`: all project actions.
- `editor`: create and edit project content.
- `viewer`: read allowed content.

The UI may hide buttons, but that is not a security boundary.

## Uploads

- Uploads use memory storage in Express and are pushed to Supabase Storage.
- Allowed MIME types: PNG, JPG, WEBP, GIF, MP4, WEBM, OGG.
- `MAX_UPLOAD_MB` limits file size.
- The Supabase service role key must never be sent to the frontend.

## HTML Content

Documents and forum posts store sanitized HTML. The sanitizer removes scripts, inline event handlers, and `javascript:` URLs. For production hardening, consider replacing this lightweight sanitizer with a battle-tested server-side HTML sanitizer.

## CORS

Set `CORS_ORIGINS` to the exact frontend origins, for example:

```txt
https://supratco.github.io,http://localhost:5173
```

CORS origins do not include URL paths.

## Rate Limits

Auth and write-heavy endpoints use basic rate limiting. Add stricter production limits if the app becomes public.
