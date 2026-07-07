const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

function readEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return {};
  return fs.readFileSync(envPath, "utf8").split(/\r?\n/).reduce((env, line) => {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (!match) return env;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    return env;
  }, {});
}

const files = [
  "app.js",
  "styles.css",
  "manifest.webmanifest",
  "icon.svg",
  "sw.js"
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(from, to) {
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

function copyDir(from, to) {
  ensureDir(to);
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(source, target);
    } else {
      copyFile(source, target);
    }
  }
}

fs.rmSync(dist, { recursive: true, force: true });
ensureDir(dist);

for (const file of files) {
  copyFile(path.join(root, file), path.join(dist, file));
}

copyDir(path.join(root, "assets"), path.join(dist, "assets"));

const supabaseUmd = path.join(root, "node_modules", "@supabase", "supabase-js", "dist", "umd", "supabase.js");
copyFile(supabaseUmd, path.join(dist, "vendor", "supabase.js"));

const threeModule = path.join(root, "node_modules", "three", "build", "three.module.js");
copyFile(threeModule, path.join(dist, "vendor", "three.module.js"));

const visionBundle = path.join(root, "node_modules", "@mediapipe", "tasks-vision", "vision_bundle.mjs");
copyFile(visionBundle, path.join(dist, "vendor", "vision_bundle.mjs"));
copyDir(
  path.join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm"),
  path.join(dist, "vendor", "mediapipe", "wasm")
);

const html = fs
  .readFileSync(path.join(root, "index.html"), "utf8")
  .replace("./node_modules/@supabase/supabase-js/dist/umd/supabase.js", "./vendor/supabase.js");
fs.writeFileSync(path.join(dist, "index.html"), html);

const env = readEnv();
fs.writeFileSync(
  path.join(dist, "config.js"),
  `window.__DIARY_ENV__ = ${JSON.stringify({
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL || "",
    VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || ""
  })};\n`
);

console.log(`Prepared Capacitor web assets in ${dist}`);
