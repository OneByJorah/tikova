// tikova demo server — serves the theme's static preview + /healthz.
// No database, no osTicket: this is a read-only showcase of the theme files
// shipped in this repo (preview/ + theme/). The real product installs into an
// osTicket 1.18.x upload directory via install.sh / deploy.sh.

const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8080;
const brand =
  process.env.PROJECT_NAME && process.env.PROJECT_NAME !== 'Project Name'
    ? process.env.PROJECT_NAME
    : 'tikova';

const ROOT = __dirname;

// Exact URL -> file mappings (served at the repo root so the preview's
// relative "../theme/..." references resolve naturally).
const ROUTES = {
  '/': 'preview/index.html',
  '/index.html': 'preview/index.html',
  '/staff-preview.html': 'preview/staff-preview.html',
};

// Directory mounts: URL prefix -> directory relative to ROOT.
const MOUNTS = {
  '/theme/': 'theme/',
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8' });
  res.end(body);
}

function resolveFile(urlPath) {
  if (ROUTES[urlPath]) return path.join(ROOT, ROUTES[urlPath]);
  for (const [prefix, dir] of Object.entries(MOUNTS)) {
    if (!urlPath.startsWith(prefix)) continue;
    const rel = urlPath.slice(prefix.length);
    const abs = path.resolve(ROOT, dir, rel);
    // Containment check: never serve outside the mounted directory.
    if (!abs.startsWith(path.resolve(ROOT, dir) + path.sep)) return null;
    return abs;
  }
  return null;
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

  if (urlPath === '/healthz') {
    send(res, 200, 'ok');
    return;
  }

  const file = resolveFile(urlPath);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    send(res, 404, 'not found');
    return;
  }

  const ext = path.extname(file).toLowerCase();
  let body = fs.readFileSync(file);
  if (ext === '.html') body = body.toString('utf8').split('tikova').join(brand);
  send(res, 200, body, TYPES[ext] || 'application/octet-stream');
});

server.listen(port, () => {
  console.log(`tikova demo preview on http://127.0.0.1:${port} (brand: ${brand})`);
});
