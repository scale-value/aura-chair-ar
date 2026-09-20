const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.usdz': 'model/vnd.usdz+zip',
  '.hdr': 'image/vnd.radiance',
  '.ico': 'image/x-icon'
};

const handler = (req, res) => {
  // Global CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  if (reqPath.startsWith('/')) reqPath = reqPath.slice(1);

  // Check multiple possible roots in Vercel lambda environment
  const candidates = [
    path.resolve(process.cwd(), reqPath),
    path.resolve(__dirname, reqPath),
    path.resolve(__dirname, '..', reqPath)
  ];

  let targetFile = null;
  for (const c of candidates) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) {
        targetFile = c;
        break;
      }
    } catch (e) {}
  }

  if (!targetFile) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('404 Not Found: ' + reqPath);
    return;
  }

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stats = fs.statSync(targetFile);

  // Support range requests for large GLB models
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
    const chunksize = (end - start) + 1;
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', chunksize);
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(targetFile, { start, end }).pipe(res);
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    fs.createReadStream(targetFile).pipe(res);
  }
};

module.exports = handler;

if (require.main === module) {
  const http = require('http');
  const server = http.createServer(handler);
  server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
}
