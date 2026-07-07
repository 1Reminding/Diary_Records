const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT || 55173);
const host = process.env.HOST || "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mjs": "text/javascript; charset=utf-8"
};

function readEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  return lines.reduce((env, line) => {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (!match) return env;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    return env;
  }, {});
}

function safePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
  const resolved = path.resolve(root, pathname === "/" ? "index.html" : pathname.slice(1));
  return resolved.startsWith(root) ? resolved : null;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function proxyAceStep(req, res) {
  const env = readEnv();
  const targetBase = (env.ACE_STEP_BASE_URL || "").replace(/\/$/, "");
  if (!targetBase) {
    sendJson(res, 503, {
      error: "ACE_STEP_BASE_URL is not configured",
      hint: "Add ACE_STEP_BASE_URL=http://127.0.0.1:7860 to .env after starting ACE-Step with API enabled."
    });
    return;
  }

  const requestUrl = new URL(req.url, `http://${host}:${port}`);
  const targetPath = requestUrl.pathname.replace(/^\/api\/ace-step/, "") || "/";
  const targetUrl = `${targetBase}${targetPath}${requestUrl.search}`;
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await readRequestBody(req);
  const headers = {
    "Content-Type": req.headers["content-type"] || "application/json"
  };
  if (env.ACE_STEP_API_KEY) headers.Authorization = `Bearer ${env.ACE_STEP_API_KEY}`;

  try {
    console.log(`[ACE-Step proxy] ${req.method} ${targetPath} -> ${targetBase}`);
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body
    });
    console.log(`[ACE-Step proxy] ${upstream.status} ${targetPath}`);
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const data = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    res.end(data);
  } catch (error) {
    sendJson(res, 502, { error: error.message });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url.split("?")[0].startsWith("/api/ace-step")) {
    await proxyAceStep(req, res);
    return;
  }

  if (req.url.split("?")[0] === "/config.js") {
    const env = readEnv();
    const payload = {
      VITE_SUPABASE_URL: env.VITE_SUPABASE_URL || "",
      VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || ""
    };
    res.writeHead(200, {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(`window.__DIARY_ENV__ = ${JSON.stringify(payload)};`);
    return;
  }

  const filePath = safePath(req.url);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500);
      res.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    res.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`Diary Records running at http://${host}:${port}/index.html`);
});
