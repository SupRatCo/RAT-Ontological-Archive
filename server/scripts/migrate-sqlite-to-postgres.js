const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const { Pool } = require("pg");

const sqlitePath = process.env.SQLITE_PATH
  ? path.resolve(process.env.SQLITE_PATH)
  : path.join(__dirname, "..", "data", "database.sqlite");

const tables = [
  "users",
  "projects",
  "project_members",
  "sections",
  "files",
  "file_fields",
  "tags",
  "file_tags",
  "media",
  "media_tags",
  "notifications",
  "access_requests",
  "forum_posts",
  "forum_comments",
  "forum_votes",
  "settings"
];

const jsonColumns = new Set(["settings_json", "dashboard_json", "data_json", "metadata_json", "meta_json", "tags_json", "saved_by_json", "value"]);
const booleanColumns = new Set(["favorite", "read"]);

function sqliteAll(db, sql) {
  return new Promise((resolve, reject) => db.all(sql, (error, rows) => error ? reject(error) : resolve(rows)));
}

function normalizeValue(column, value) {
  if (value == null) return value;
  if (booleanColumns.has(column)) return value === true || value === 1 || value === "1";
  if (jsonColumns.has(column)) {
    try { return JSON.parse(value); } catch (_error) { return value; }
  }
  return value;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required. Point it to your Supabase/PostgreSQL database.");
  }
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`SQLite database not found: ${sqlitePath}`);
  }

  const sqlite = new sqlite3.Database(sqlitePath);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
  });

  try {
    for (const table of tables) {
      const rows = await sqliteAll(sqlite, `SELECT * FROM ${table}`);
      if (!rows.length) {
        console.log(`${table}: 0 rows`);
        continue;
      }
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
      const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      for (const row of rows) {
        await pool.query(sql, columns.map((column) => normalizeValue(column, row[column])));
      }
      console.log(`${table}: migrated ${rows.length} rows`);
    }
  } finally {
    sqlite.close();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
