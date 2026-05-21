const { Pool } = require("pg");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("DATABASE_URL is not configured. PostgreSQL requests will fail until it is set.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

async function query(text, params) {
  if (!databaseUrl) {
    const error = new Error("DATABASE_URL is not configured.");
    error.statusCode = 503;
    throw error;
  }
  return pool.query(text, params);
}

async function transaction(callback) {
  if (!databaseUrl) {
    const error = new Error("DATABASE_URL is not configured.");
    error.statusCode = 503;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  transaction,
  hasDatabaseUrl: Boolean(databaseUrl)
};
