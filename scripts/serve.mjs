/**
 * Static file server for local preview.
 *
 * The site is zero-build: the source tree IS the deploy artifact. But ES
 * modules do not load over `file://`, so previewing still needs an origin.
 * Node built-ins only — no dependency, no network install, works offline.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.env.PORT) || 5180;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    // Strip the leading slash, then normalize — `normalize` collapses any
    // `..` segments, so the resolve below cannot escape ROOT.
    let rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if (rel === "") rel = "index.html";
    const target = resolve(ROOT, normalize(rel));
    if (!target.startsWith(ROOT)) {
      res.writeHead(403).end("403 Forbidden");
      return;
    }

    let file = target;
    const info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = join(file, "index.html");

    const body = await readFile(file);
    res.writeHead(200, {
      "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
      // Local preview: never serve a stale file while iterating.
      "Cache-Control": "no-cache",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`ERRNOLINK // serving ${ROOT}`);
  console.log(`  http://localhost:${PORT}`);
});
