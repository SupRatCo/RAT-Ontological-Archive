# Database

RAT Ontological Archive now uses Cloud Firestore.

## Main Collections

- `users/{uid}`
- `usernames/{usernameLower}`
- `userSettings/{uid}`
- `projects/{projectId}`
- `projects/{projectId}/members/{uid}`
- `projects/{projectId}/documents/{documentId}`
- `projects/{projectId}/dataFiles/{dataFileId}`
- `projects/{projectId}/dataFiles/{dataFileId}/sections/{sectionId}`
- `projects/{projectId}/dataFiles/{dataFileId}/sections/{sectionId}/fields/{fieldId}`
- `projects/{projectId}/media/{mediaId}`
- `projects/{projectId}/tags/{tagId}`
- `forumPosts/{postId}`
- `forumPosts/{postId}/comments/{commentId}`
- `forumPosts/{postId}/likes/{uid}`
- `forumPosts/{postId}/savedBy/{uid}`
- `notifications/{uid}/items/{notificationId}`
- `friendships/{friendshipId}`
- `projectInvites/{inviteId}`

## Media

Firestore stores metadata only. Files live in Cloudinary.

## Rules And Indexes

Use:

- `firestore.rules`
- `firestore.indexes.json`

The old PostgreSQL schema is preserved only in `legacy/server-express-postgres/`.
