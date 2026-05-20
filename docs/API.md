# API

All routes are under `/api`.

Responses:

```json
{ "ok": true, "data": {} }
```

Errors:

```json
{ "ok": false, "error": "Message" }
```

## Health

- `GET /api/health`
- `GET /api/cors-test`

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Users

- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/users/me/avatar`
- `POST /api/users/me/banner`
- `GET /api/users/search?q=`
- `GET /api/users/:userId/public`

## Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`

## Collaborators

- `GET /api/collaborators/friends`
- `POST /api/collaborators/friends/:userId`
- `PATCH /api/collaborators/friends/:friendshipId`
- `GET /api/collaborators/projects/:projectId/members`
- `POST /api/collaborators/projects/:projectId/invites`
- `PATCH /api/collaborators/invites/:inviteId`

## Documents

- `GET /api/documents/project/:projectId`
- `POST /api/documents/project/:projectId`
- `GET /api/documents/:id`
- `PATCH /api/documents/:id`
- `DELETE /api/documents/:id`

## Data Files

- `GET /api/data-files/project/:projectId`
- `POST /api/data-files/project/:projectId`
- `GET /api/data-files/:id`
- `PATCH /api/data-files/:id`
- `DELETE /api/data-files/:id`
- `POST /api/data-files/:id/sections`
- `PATCH /api/data-files/sections/:sectionId`
- `DELETE /api/data-files/sections/:sectionId`
- `POST /api/data-files/sections/:sectionId/fields`
- `PATCH /api/data-files/fields/:fieldId`
- `DELETE /api/data-files/fields/:fieldId`

## Media

- `GET /api/media/project/:projectId`
- `POST /api/media/project/:projectId`
- `DELETE /api/media/:mediaId`

## Forum

- `GET /api/forum/posts`
- `POST /api/forum/posts`
- `GET /api/forum/posts/:postId`
- `POST /api/forum/posts/:postId/like`
- `DELETE /api/forum/posts/:postId/like`
- `POST /api/forum/posts/:postId/save`
- `DELETE /api/forum/posts/:postId/save`
- `GET /api/forum/posts/:postId/comments`
- `POST /api/forum/posts/:postId/comments`
- `DELETE /api/forum/comments/:commentId`

## Settings

- `GET /api/settings`
- `PATCH /api/settings`
- `GET /api/settings/diagnostics`
