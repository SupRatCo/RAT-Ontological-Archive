const path = require("path");
const fs = require("fs");

const port = Number(process.env.PORT || 3000);
const clientRoot = path.resolve(__dirname, "..");

function hasPackage(name) {
  try { require.resolve(name); return true; } catch (_error) { return false; }
}

if (hasPackage("express") && hasPackage("sqlite3")) {
  const express = require("express");
  const cors = require("cors");
  const { init } = require("./database");

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "8mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  app.use("/api/auth", require("./routes/auth.routes"));
  app.use("/api/users", require("./routes/users.routes"));
  app.use("/api/projects", require("./routes/projects.routes"));
  app.use("/api/sections", require("./routes/sections.routes"));
  app.use("/api/files", require("./routes/files.routes"));
  app.use("/api/tags", require("./routes/tags.routes"));
  app.use("/api/media", require("./routes/media.routes"));
  app.use("/api/notifications", require("./routes/notifications.routes").router);
  app.use("/api/forum", require("./routes/forum.routes"));
  app.use("/api/access", require("./routes/access.routes"));

  app.get("/api/health", (_req, res) => res.json({ ok: true, mode: "express-sqlite", name: "RAT Ontological Archive" }));
  app.use(express.static(clientRoot));
  app.get("*", (_req, res) => res.sendFile(path.join(clientRoot, "index.html")));
  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: error.message || "Server error" });
  });

  init().then(() => {
    app.listen(port, () => console.log(`RAT Ontological Archive running at http://localhost:${port}`));
  }).catch((error) => {
    console.error("Could not initialize database", error);
    process.exit(1);
  });
} else {
  startFallbackServer();
}

function startFallbackServer() {
  const http = require("http");
  const crypto = require("crypto");
  const dataPath = path.join(__dirname, "data", "fallback-db.json");
  const mime = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogg": "video/ogg"
  };

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function now() {
    return new Date().toISOString();
  }

  function load() {
    if (!fs.existsSync(dataPath)) return { users: [], projects: [], sections: [], tags: [], files: [], posts: [], comments: [], media: [], notifications: [], tokens: {} };
    return JSON.parse(fs.readFileSync(dataPath, "utf8"));
  }

  function save(db) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
  }

  function send(res, status, data) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

  function parseBody(req) {
    return new Promise((resolve) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve(raw ? JSON.parse(raw) : {}); } catch (_error) { resolve({}); }
      });
    });
  }

  function auth(req, db) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const id = db.tokens[token];
    return db.users.find((user) => user.id === id) || null;
  }

  function hash(value) {
    return crypto.createHash("sha256").update(value || "").digest("hex");
  }

  async function handleApi(req, res) {
    const db = load();
    const url = new URL(req.url, `http://localhost:${port}`);
    const body = req.method === "GET" ? {} : await parseBody(req);
    const user = auth(req, db);

    if (url.pathname === "/api/health") return send(res, 200, { ok: true, mode: "fallback-json", name: "RAT Ontological Archive" });
    if (url.pathname === "/api/auth/register" && req.method === "POST") {
      if (db.users.some((item) => item.username.toLowerCase() === String(body.username).toLowerCase())) return send(res, 409, { error: "Username already exists" });
      const created = { id: uid("user"), username: body.username, password_hash: hash(body.password), avatar_url: "", settings: {}, createdAt: now(), updatedAt: now() };
      const token = uid("token");
      db.users.push(created); db.tokens[token] = created.id; save(db);
      return send(res, 200, { token, user: created });
    }
    if (url.pathname === "/api/auth/login" && req.method === "POST") {
      const found = db.users.find((item) => item.username.toLowerCase() === String(body.username).toLowerCase() && item.password_hash === hash(body.password));
      if (!found) return send(res, 401, { error: "Invalid credentials" });
      const token = uid("token"); db.tokens[token] = found.id; save(db);
      return send(res, 200, { token, user: found });
    }
    if (url.pathname === "/api/auth/me" && req.method === "GET") return user ? send(res, 200, { user }) : send(res, 401, { error: "Missing token" });
    if (url.pathname === "/api/auth/logout") return send(res, 200, { ok: true });

    if (!user && !url.pathname.startsWith("/api/forum/posts")) return send(res, 401, { error: "Missing token" });

    if (url.pathname === "/api/projects" && req.method === "GET") {
      return send(res, 200, { projects: db.projects.filter((project) => project.visibility === "public" || project.ownerId === user.id || (project.readers || []).includes(user.id) || (project.editors || []).includes(user.id)) });
    }
    if (url.pathname === "/api/projects" && req.method === "POST") {
      const project = { id: uid("project"), ownerId: user.id, name: body.name, description: body.description || "", visibility: body.visibility || "private", editors: [user.id], readers: [], dashboardModules: body.dashboardModules || [], createdAt: now(), updatedAt: now() };
      db.projects.push(project); save(db); return send(res, 200, { project });
    }
    const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (projectMatch && req.method === "DELETE") {
      const project = db.projects.find((item) => item.id === projectMatch[1]);
      if (!project) return send(res, 404, { error: "Project not found" });
      if (project.ownerId !== user.id) return send(res, 403, { error: "Only owner can delete project" });
      db.projects = db.projects.filter((item) => item.id !== project.id);
      db.sections = (db.sections || []).filter((section) => section.projectId !== project.id);
      db.tags = (db.tags || []).filter((tag) => tag.projectId !== project.id);
      db.files = db.files.filter((file) => file.projectId !== project.id);
      db.media = db.media.filter((media) => media.projectId !== project.id);
      save(db); return send(res, 200, { ok: true });
    }
    if (projectMatch && req.method === "PATCH") {
      const project = db.projects.find((item) => item.id === projectMatch[1]);
      if (!project) return send(res, 404, { error: "Project not found" });
      if (project.ownerId !== user.id && !(project.editors || []).includes(user.id)) return send(res, 403, { error: "Missing editor permission" });
      Object.assign(project, body, { updatedAt: now() }); save(db); return send(res, 200, { project });
    }

    const sectionProjectMatch = url.pathname.match(/^\/api\/sections\/project\/([^/]+)$/);
    if (sectionProjectMatch && req.method === "GET") return send(res, 200, { sections: (db.sections || []).filter((section) => section.projectId === sectionProjectMatch[1]) });
    if (sectionProjectMatch && req.method === "POST") {
      const project = db.projects.find((item) => item.id === sectionProjectMatch[1]);
      if (!project || (project.ownerId !== user.id && !(project.editors || []).includes(user.id))) return send(res, 403, { error: "Missing editor permission" });
      const section = Object.assign({ id: uid("section"), projectId: sectionProjectMatch[1], createdAt: now(), updatedAt: now() }, body);
      db.sections = db.sections || [];
      db.sections.push(section); save(db); return send(res, 200, { section });
    }
    const sectionMatch = url.pathname.match(/^\/api\/sections\/([^/]+)$/);
    if (sectionMatch && req.method === "PATCH") {
      const section = (db.sections || []).find((item) => item.id === sectionMatch[1]);
      if (!section) return send(res, 404, { error: "Section not found" });
      const project = db.projects.find((item) => item.id === section.projectId);
      if (!project || (project.ownerId !== user.id && !(project.editors || []).includes(user.id))) return send(res, 403, { error: "Missing editor permission" });
      Object.assign(section, body, { updatedAt: now() }); save(db); return send(res, 200, { section });
    }
    if (sectionMatch && req.method === "DELETE") {
      const section = (db.sections || []).find((item) => item.id === sectionMatch[1]);
      if (!section) return send(res, 404, { error: "Section not found" });
      const project = db.projects.find((item) => item.id === section.projectId);
      if (!project || (project.ownerId !== user.id && !(project.editors || []).includes(user.id))) return send(res, 403, { error: "Missing editor permission" });
      db.sections = db.sections.filter((item) => item.id !== section.id); save(db); return send(res, 200, { ok: true });
    }

    const tagProjectMatch = url.pathname.match(/^\/api\/tags\/project\/([^/]+)$/);
    if (tagProjectMatch && req.method === "GET") return send(res, 200, { tags: (db.tags || []).filter((tag) => tag.projectId === tagProjectMatch[1]) });
    if (tagProjectMatch && req.method === "POST") {
      const project = db.projects.find((item) => item.id === tagProjectMatch[1]);
      if (!project || (project.ownerId !== user.id && !(project.editors || []).includes(user.id))) return send(res, 403, { error: "Missing editor permission" });
      const tag = Object.assign({ id: uid("tag"), projectId: tagProjectMatch[1], createdAt: now(), updatedAt: now() }, body);
      db.tags = db.tags || [];
      db.tags.push(tag); save(db); return send(res, 200, { tag });
    }
    const tagMatch = url.pathname.match(/^\/api\/tags\/([^/]+)$/);
    if (tagMatch && req.method === "PATCH") {
      const tag = (db.tags || []).find((item) => item.id === tagMatch[1]);
      if (!tag) return send(res, 404, { error: "Tag not found" });
      const project = db.projects.find((item) => item.id === tag.projectId);
      if (!project || (project.ownerId !== user.id && !(project.editors || []).includes(user.id))) return send(res, 403, { error: "Missing editor permission" });
      Object.assign(tag, body, { updatedAt: now() }); save(db); return send(res, 200, { tag });
    }
    if (tagMatch && req.method === "DELETE") {
      const tag = (db.tags || []).find((item) => item.id === tagMatch[1]);
      if (!tag) return send(res, 404, { error: "Tag not found" });
      const project = db.projects.find((item) => item.id === tag.projectId);
      if (!project || (project.ownerId !== user.id && !(project.editors || []).includes(user.id))) return send(res, 403, { error: "Missing editor permission" });
      db.tags = db.tags.filter((item) => item.id !== tag.id); save(db); return send(res, 200, { ok: true });
    }

    const mediaProjectMatch = url.pathname.match(/^\/api\/media\/project\/([^/]+)$/);
    if (mediaProjectMatch && req.method === "GET") return send(res, 200, { media: (db.media || []).filter((item) => item.projectId === mediaProjectMatch[1]) });

    const fileProjectMatch = url.pathname.match(/^\/api\/files\/project\/([^/]+)$/);
    if (fileProjectMatch && req.method === "GET") return send(res, 200, { files: db.files.filter((file) => file.projectId === fileProjectMatch[1]) });
    if (fileProjectMatch && req.method === "POST") {
      const file = Object.assign({ id: uid("file"), projectId: fileProjectMatch[1], createdAt: now(), updatedAt: now() }, body);
      db.files.push(file); save(db); return send(res, 200, { file });
    }
    const fileMatch = url.pathname.match(/^\/api\/files\/([^/]+)$/);
    if (fileMatch && req.method === "PATCH") {
      const file = db.files.find((item) => item.id === fileMatch[1]);
      Object.assign(file, body, { updatedAt: now() }); save(db); return send(res, 200, { file });
    }
    if (fileMatch && req.method === "DELETE") {
      db.files = db.files.filter((file) => file.id !== fileMatch[1]); save(db); return send(res, 200, { ok: true });
    }

    if (url.pathname === "/api/forum/posts" && req.method === "GET") return send(res, 200, { posts: db.posts.map((post) => Object.assign({}, post, { author: db.users.find((u) => u.id === post.userId), commentsCount: db.comments.filter((c) => c.postId === post.id).length })) });
    if (url.pathname === "/api/forum/posts" && req.method === "POST") {
      const post = Object.assign({ id: uid("post"), userId: user.id, upvotes: 0, commentsCount: 0, createdAt: now(), updatedAt: now() }, body);
      db.posts.unshift(post); save(db); return send(res, 200, { post });
    }
    const postMatch = url.pathname.match(/^\/api\/forum\/posts\/([^/]+)$/);
    if (postMatch && req.method === "GET") return send(res, 200, { post: db.posts.find((post) => post.id === postMatch[1]), comments: db.comments.filter((comment) => comment.postId === postMatch[1]) });
    const commentMatch = url.pathname.match(/^\/api\/forum\/posts\/([^/]+)\/comments$/);
    if (commentMatch && req.method === "POST") {
      const comment = { id: uid("comment"), postId: commentMatch[1], userId: user.id, username: user.username, content: body.content, parentCommentId: body.parentCommentId || null, createdAt: now(), updatedAt: now() };
      db.comments.push(comment); save(db); return send(res, 200, { comment });
    }
    if (url.pathname === "/api/forum/vote" && req.method === "POST") return send(res, 200, { ok: true });
    if (/^\/api\/forum\/posts\/[^/]+\/save$/.test(url.pathname)) return send(res, 200, { saved: true });

    send(res, 404, { error: "Not found" });
  }

  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/api/")) return handleApi(req, res).catch((error) => send(res, 500, { error: error.message }));
    const url = new URL(req.url, `http://localhost:${port}`);
    let filePath = path.normalize(path.join(clientRoot, url.pathname === "/" ? "index.html" : url.pathname));
    if (!filePath.startsWith(clientRoot)) return send(res, 403, { error: "Forbidden" });
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(clientRoot, "index.html");
    res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(port, () => {
    console.log(`RAT Ontological Archive fallback server at http://localhost:${port}`);
    console.log("Install npm dependencies to enable Express + SQLite mode.");
  });
}
