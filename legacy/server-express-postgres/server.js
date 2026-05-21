require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const { migrate } = require("./db/migrate");
const { hasDatabaseUrl } = require("./db/pool");
const storageService = require("./services/storage.service");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const PORT = Number(process.env.PORT || 3000);
const app = express();

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  process.exit(1);
});

console.log("Starting RAT Ontological Archive API...");
console.log("Node version:", process.version);
console.log("Environment:", process.env.NODE_ENV || "development");
console.log("PORT:", PORT);
console.log("Working directory:", process.cwd());
console.log("Database configured:", hasDatabaseUrl);
console.log("Storage configured:", storageService.isConfigured());

const defaultOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", "https://supratco.github.io"];
const allowedOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
    console.warn("CORS blocked origin:", origin);
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
};

app.disable("x-powered-by");
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (_req, res) => {
  const missing = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.SUPABASE_STORAGE_BUCKET) missing.push("SUPABASE_STORAGE_BUCKET");
  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) missing.push("JWT_SECRET");

  res.status(missing.length ? 503 : 200).json({
    ok: missing.length === 0,
    name: "RAT Ontological Archive",
    mode: "express-postgres",
    database: process.env.DATABASE_URL ? "postgres" : "missing",
    storage: storageService.isConfigured() ? storageService.provider : "missing",
    missing
  });
});

app.get("/api/cors-test", (req, res) => {
  res.json({
    ok: true,
    data: {
      origin: req.headers.origin || null,
      message: "CORS test passed"
    }
  });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/projects", require("./routes/projects.routes"));
app.use("/api/collaborators", require("./routes/collaborators.routes"));
app.use("/api/documents", require("./routes/documents.routes"));
app.use("/api/data-files", require("./routes/dataFiles.routes"));
app.use("/api/tags", require("./routes/tags.routes"));
app.use("/api/media", require("./routes/media.routes"));
app.use("/api/forum", require("./routes/forum.routes"));
app.use("/api/notifications", require("./routes/notifications.routes"));
app.use("/api/settings", require("./routes/settings.routes"));

if (process.env.SERVE_CLIENT === "true") {
  const clientDist = path.resolve(__dirname, "../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  if (hasDatabaseUrl && process.env.AUTO_MIGRATE !== "false") {
    await migrate();
  } else if (!hasDatabaseUrl) {
    console.warn("DATABASE_URL is missing. API will start, but database-backed routes will return 503.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RAT Ontological Archive API running on port ${PORT}`);
    console.log("Health endpoint: /api/health");
  });
}

start().catch((error) => {
  console.error("Could not start server:", error);
  process.exit(1);
});
