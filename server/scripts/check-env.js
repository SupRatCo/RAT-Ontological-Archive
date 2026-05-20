require("dotenv").config();

const required = ["DATABASE_URL", "JWT_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error("Missing required production env vars:", missing.join(", "));
  process.exitCode = 1;
} else {
  console.log("Required production env vars are present.");
}
