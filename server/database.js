const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(__dirname, process.env.DATABASE_PATH)
  : path.join(__dirname, "data", "database.sqlite");

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) reject(error);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });
}

async function init() {
  await run("PRAGMA foreign_keys = ON");
  await run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    settings_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  await run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    visibility TEXT DEFAULT 'private',
    dashboard_json TEXT DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(project_id, user_id),
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    parent_id TEXT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    visibility TEXT DEFAULT 'inherit',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    section_id TEXT,
    type TEXT DEFAULT 'text',
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    data_json TEXT DEFAULT '{}',
    visibility TEXT DEFAULT 'inherit',
    favorite INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Borrador',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS file_fields (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    internal_section_id TEXT NOT NULL,
    internal_section_name TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    value TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#ffd800',
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'Personalizada',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS file_tags (
    file_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY(file_id, tag_id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    file_path TEXT NOT NULL,
    type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    metadata_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS media_tags (
    media_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY(media_id, tag_id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT DEFAULT '',
    type TEXT DEFAULT 'system',
    read INTEGER DEFAULT 0,
    meta_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS access_requests (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message TEXT DEFAULT '',
    status TEXT DEFAULT 'pendiente',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(project_id, user_id, status)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS forum_posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    source_file_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_snapshot TEXT,
    summary TEXT DEFAULT '',
    tags_json TEXT DEFAULT '[]',
    visibility TEXT DEFAULT 'public',
    cover_media_id TEXT,
    saved_by_json TEXT DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS forum_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(post_id) REFERENCES forum_posts(id) ON DELETE CASCADE
  )`);
  await run(`CREATE TABLE IF NOT EXISTS forum_votes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    vote_type TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, target_type, target_id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  await ensureColumn("forum_posts", "source_file_id", "TEXT");
  await ensureColumn("forum_posts", "content_snapshot", "TEXT");
  await run("CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at)");
  await run("CREATE INDEX IF NOT EXISTS idx_forum_posts_visibility ON forum_posts(visibility)");
  await run("CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_forum_comments_parent ON forum_comments(parent_comment_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_forum_votes_target ON forum_votes(target_type, target_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_forum_votes_user ON forum_votes(user_id)");
}

async function ensureColumn(table, column, definition) {
  const columns = await all(`PRAGMA table_info(${table})`);
  if (!columns.some((item) => item.name === column)) {
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

module.exports = { db, init, run, get, all };
