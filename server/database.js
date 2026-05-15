const path = require("path");
const fs = require("fs");

const usePostgres = Boolean(process.env.DATABASE_URL);
const jsonColumns = new Set(["settings_json", "dashboard_json", "data_json", "metadata_json", "meta_json", "tags_json", "saved_by_json"]);

const dbPath = usePostgres
  ? "postgresql:DATABASE_URL"
  : (process.env.DATABASE_PATH
    ? path.resolve(__dirname, process.env.DATABASE_PATH)
    : path.join(__dirname, "data", "database.sqlite"));

let sqliteDb = null;
let pgPool = null;

function normalizeRow(row) {
  if (!row || !usePostgres) return row;
  const clean = Object.assign({}, row);
  Object.keys(clean).forEach((key) => {
    if (jsonColumns.has(key) && clean[key] != null && typeof clean[key] !== "string") {
      clean[key] = JSON.stringify(clean[key]);
    }
  });
  return clean;
}

function toPostgresSql(sql) {
  let index = 0;
  const postgresSql = sql
    .replace(/p\.saved_by_json LIKE/g, "p.saved_by_json::text LIKE")
    .replace(/COALESCE\(p\.tags_json, ''\)/g, "COALESCE(p.tags_json::text, '')");
  return postgresSql.replace(/\?/g, () => `$${++index}`);
}

function createSqlite() {
  const sqlite3 = require("sqlite3").verbose();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  sqliteDb = new sqlite3.Database(dbPath);
}

function createPostgres() {
  const { Pool } = require("pg");
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
  });
}

if (usePostgres) createPostgres();
else createSqlite();

function run(sql, params = []) {
  if (usePostgres) {
    return pgPool.query(toPostgresSql(sql), params).then((result) => ({
      id: null,
      changes: result.rowCount || 0
    }));
  }
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (error) {
      if (error) reject(error);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  if (usePostgres) {
    return pgPool.query(toPostgresSql(sql), params).then((result) => normalizeRow(result.rows[0]));
  }
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (error, row) => {
      if (error) reject(error);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  if (usePostgres) {
    return pgPool.query(toPostgresSql(sql), params).then((result) => result.rows.map(normalizeRow));
  }
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });
}

async function init() {
  if (usePostgres) {
    await initPostgres();
    return;
  }
  await initSqlite();
}

async function initSqlite() {
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
    storage_provider TEXT DEFAULT 'local',
    storage_key TEXT,
    public_url TEXT,
    size INTEGER DEFAULT 0,
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
  await ensureColumn("media", "storage_provider", "TEXT DEFAULT 'local'");
  await ensureColumn("media", "storage_key", "TEXT");
  await ensureColumn("media", "public_url", "TEXT");
  await ensureColumn("media", "size", "INTEGER DEFAULT 0");
  await createCommonIndexes();
}

async function initPostgres() {
  await pgPool.query(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    settings_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    visibility TEXT DEFAULT 'private',
    dashboard_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    UNIQUE(project_id, user_id)
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id TEXT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    visibility TEXT DEFAULT 'inherit',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    section_id TEXT,
    type TEXT DEFAULT 'text',
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    data_json JSONB DEFAULT '{}'::jsonb,
    visibility TEXT DEFAULT 'inherit',
    favorite BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'Borrador',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS file_fields (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    internal_section_id TEXT NOT NULL,
    internal_section_name TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    value JSONB DEFAULT '""'::jsonb,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#ffd800',
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'Personalizada',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS file_tags (
    file_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY(file_id, tag_id)
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by TEXT NOT NULL,
    file_path TEXT NOT NULL,
    type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    metadata_json JSONB DEFAULT '{}'::jsonb,
    storage_provider TEXT DEFAULT 'local',
    storage_key TEXT,
    public_url TEXT,
    size BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS media_tags (
    media_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY(media_id, tag_id)
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT DEFAULT '',
    type TEXT DEFAULT 'system',
    read BOOLEAN DEFAULT false,
    meta_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS access_requests (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message TEXT DEFAULT '',
    status TEXT DEFAULT 'pendiente',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    UNIQUE(project_id, user_id, status)
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS forum_posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT,
    source_file_id TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_snapshot TEXT,
    summary TEXT DEFAULT '',
    tags_json JSONB DEFAULT '[]'::jsonb,
    visibility TEXT DEFAULT 'public',
    cover_media_id TEXT,
    saved_by_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS forum_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS forum_votes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    vote_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    UNIQUE(user_id, target_type, target_id)
  )`);
  await pgPool.query(`CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`);
  await createCommonIndexes();
}

async function createCommonIndexes() {
  await run("CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at)");
  await run("CREATE INDEX IF NOT EXISTS idx_forum_posts_visibility ON forum_posts(visibility)");
  await run("CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON forum_posts(user_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON forum_comments(post_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_forum_comments_parent ON forum_comments(parent_comment_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_forum_votes_target ON forum_votes(target_type, target_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_forum_votes_user ON forum_votes(user_id)");
  await run("CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_likes_unique ON forum_votes(target_id, user_id) WHERE target_type = 'post'");
  await run("CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_project_members_project_user ON project_members(project_id, user_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_sections_project_id ON sections(project_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_files_section ON files(section_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_tags_project ON tags(project_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_media_project_id ON media(project_id)");
  await run("CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at)");
  await run("CREATE INDEX IF NOT EXISTS idx_access_requests_project_user ON access_requests(project_id, user_id)");
}

async function ensureColumn(table, column, definition) {
  const columns = await all(`PRAGMA table_info(${table})`);
  if (!columns.some((item) => item.name === column)) {
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

module.exports = { db: usePostgres ? pgPool : sqliteDb, dbPath, mode: usePostgres ? "postgres" : "sqlite", init, run, get, all };
