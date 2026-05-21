# Client Service API

The app no longer calls an Express `/api` backend. React components use service modules in `client/src/services/`.

## Services

- `authService`: register, login, logout, auth state.
- `userService`: current profile, public profile, avatar/banner upload, search.
- `projectService`: projects, members, invites.
- `documentService`: project documents.
- `dataFileService`: flexible data files, sections, fields.
- `mediaService`: Cloudinary upload plus Firestore metadata.
- `forumService`: posts, likes, saves, comments.
- `notificationService`: notifications.
- `settingsService`: user settings and diagnostics.
- `collaboratorService`: basic friendships.
- `cloudinaryService`: unsigned uploads.

Components should not call Firestore directly unless a future refactor explicitly creates a hook/service boundary for that case.

## Legacy API

The previous Express routes are preserved in `legacy/server-express-postgres/` for reference only.
