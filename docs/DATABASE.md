# Database

RAT Ontological Archive uses PostgreSQL.

## Schema

Run:

```bash
cd server
npm run migrate
```

Schema file:

```txt
server/db/schema.sql
```

## Core Tables

- `users`: login identity.
- `user_profiles`: public and editable profile data.
- `user_settings`: language, theme, visual quality, preferences.
- `projects`: narrative universes.
- `project_members`: owner/editor/viewer access.
- `project_invites`: collaborator invitations.
- `friendships`: social graph foundation.
- `documents`: WYSIWYG document content.
- `data_files`: flexible structured lore files.
- `data_file_sections`: custom data file sections.
- `data_file_fields`: custom fields per section.
- `tags`, `file_tags`: project tagging.
- `media`, `media_tags`: Supabase Storage metadata.
- `forum_posts`, `forum_comments`, `forum_likes`, `saved_posts`: community forum.
- `notifications`: user notifications.

## Important Constraints

- `forum_likes` has `UNIQUE(post_id, user_id)` to prevent duplicate likes.
- `project_members` has `UNIQUE(project_id, user_id)`.
- Project roles are constrained to `owner`, `editor`, `viewer`.
- Visibility values are constrained for projects, documents, data files, and posts.

## Indexes

Indexes are included for projects, project members, documents, data files, media, forum posts, comments, likes, and notifications.
