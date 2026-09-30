const http = require('http');
const fs = require('fs');
const path = require('path');
const { authenticateAndFetchHtml } = require('./src/scraper');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let cleanUrl = req.url.split('?')[0];

  // ==========================================
  // 1. API Route: POST /api/sync-portal
  // ==========================================
  if (req.method === 'POST' && (cleanUrl === '/api/sync-portal' || cleanUrl === '/api/sync-portal/')) {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
      // Protect against memory exhaustion / large payloads
      if (body.length > 1e6) {
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { username, password, useMock } = payload;

        // Security: Log only metadata; credentials are kept exclusively in transient memory
        console.log(`[API /api/sync-portal] Processing sync request (User: "${username ? username.substring(0, 3) + '***' : 'none'}", useMock: ${!!useMock})`);

        if (!useMock && (!username || !password)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'error',
            message: 'Both Username and Password are required to sync with ISBAT ERP.'
          }));
          return;
        }

        // Call Sprint 1 scraper bridge
        const result = await authenticateAndFetchHtml(username, password, {
          mock: !!useMock,
          headless: true,
          timeout: 25000
        });

        if (result && result.status === 'success') {
          console.log(`[API /api/sync-portal] ✓ Successfully synced portal data for: ${result.student ? result.student.name : 'Student'}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } else {
          const failureMsg = result && result.message
            ? result.message
            : 'Invalid ISBAT username or password. Please verify your credentials.';

          console.warn(`[API /api/sync-portal] ✗ Sync rejected: ${failureMsg}`);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'error',
            message: failureMsg
          }));
        }

      } catch (err) {
        console.error('[API /api/sync-portal Error]:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'error',
          message: 'Server error while contacting ISBAT portal: ' + err.message
        }));
      }
    });

    return;
  }

  // ==========================================
  // 2. Static File Serving
  // ==========================================
  if (cleanUrl === '/') cleanUrl = '/index.html';

  const safePath = path.normalize(cleanUrl).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`CourseMate Server (API + Frontend) running at: http://localhost:${PORT}`);
});
