require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { pool, hasDatabaseUrl } = require("./pool");

async function migrate() {
  if (!hasDatabaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }

  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  await pool.query(schema);
  console.log("Database schema applied successfully.");
}

if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .catch((error) => {
      console.error("Migration failed:", error.message);
      if (process.env.NODE_ENV !== "production") console.error(error);
      process.exitCode = 1;
    });
}

module.exports = { migrate };
