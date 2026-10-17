/**
 * Atelier Runway & Wardrobe Management System
 * HTTP Server with SQLite REST API & Static File Delivery
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { FashionShowDatabase, DB_FILE_PATH } = require('./db');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize SQLite Database
const db = new FashionShowDatabase(DB_FILE_PATH);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // 50MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

// Router for SQLite REST API
async function handleApiRequest(req, res, pathname) {
  const method = req.method.toUpperCase();

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  try {
    // GET /api/status - Check SQLite database status
    if (pathname === '/api/status' && method === 'GET') {
      const data = db.getAllData();
      return sendJson(res, 200, {
        status: 'ok',
        engine: 'SQLite',
        databaseFile: path.basename(db.dbPath),
        activeShowId: data.activeShowId,
        showsCount: data.shows.length
      });
    }

    // GET /api/data - Retrieve complete fashion show dataset from SQLite
    if (pathname === '/api/data' && method === 'GET') {
      const data = db.getAllData();
      return sendJson(res, 200, data);
    }

    // PUT or POST /api/data - Save entire dataset to SQLite
    if (pathname === '/api/data' && (method === 'PUT' || method === 'POST')) {
      const body = await parseJsonBody(req);
      const result = db.importData(body);
      return sendJson(res, 200, result);
    }

    // POST /api/migrate - Migrate legacy localStorage data to SQLite
    if (pathname === '/api/migrate' && method === 'POST') {
      const body = await parseJsonBody(req);
      const result = db.migrateFromLocalStorage(body);
      console.log(`[SQLite Migration] Migrated ${result.showsCount} shows from legacy localStorage to SQLite.`);
      return sendJson(res, 200, {
        success: true,
        migrated: true,
        showsCount: result.showsCount,
        message: 'Successfully migrated legacy data to SQLite database.'
      });
    }

    // POST /api/reset - Reset SQLite database to default initial demonstration data
    if (pathname === '/api/reset' && method === 'POST') {
      db.resetToDefault();
      const freshData = db.getAllData();
      return sendJson(res, 200, { success: true, data: freshData });
    }

    // POST /api/active-show - Set active show ID
    if (pathname === '/api/active-show' && method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.showId) {
        return sendJson(res, 400, { error: 'showId is required' });
      }
      db.setActiveShowId(body.showId);
      return sendJson(res, 200, { success: true, activeShowId: body.showId });
    }

    // POST /api/shows - Create a new fashion show
    if (pathname === '/api/shows' && method === 'POST') {
      const body = await parseJsonBody(req);
      const newShow = db.createShow(body);
      return sendJson(res, 201, newShow);
    }

    // Sub-routes for /api/shows/:id/...
    const showRouteMatch = pathname.match(/^\/api\/shows\/([^/]+)(.*)$/);
    if (showRouteMatch) {
      const showId = decodeURIComponent(showRouteMatch[1]);
      const subPath = showRouteMatch[2];

      // GET /api/shows/:id
      if (subPath === '' && method === 'GET') {
        const show = db.getShowById(showId);
        if (!show) return sendJson(res, 404, { error: 'Show not found' });
        return sendJson(res, 200, show);
      }

      // PUT /api/shows/:id
      if (subPath === '' && method === 'PUT') {
        const body = await parseJsonBody(req);
        const updated = db.updateShow(showId, body);
        if (!updated) return sendJson(res, 404, { error: 'Show not found' });
        return sendJson(res, 200, updated);
      }

      // DELETE /api/shows/:id
      if (subPath === '' && method === 'DELETE') {
        const remainingId = db.deleteShow(showId);
        return sendJson(res, 200, { success: true, activeShowId: remainingId });
      }

      // POST /api/shows/:id/duplicate
      if (subPath === '/duplicate' && method === 'POST') {
        const body = await parseJsonBody(req);
        const copy = db.duplicateShow(showId, body.name);
        if (!copy) return sendJson(res, 404, { error: 'Source show not found' });
        return sendJson(res, 201, copy);
      }

      // POST /api/shows/:id/models
      if (subPath === '/models' && method === 'POST') {
        const body = await parseJsonBody(req);
        const newModel = db.addModel(showId, body);
        return sendJson(res, 201, newModel);
      }

      // POST /api/shows/:id/models/reorder
      if (subPath === '/models/reorder' && method === 'POST') {
        const body = await parseJsonBody(req);
        db.reorderModels(showId, body.modelIdList || []);
        return sendJson(res, 200, { success: true });
      }

      // PUT or DELETE /api/shows/:id/models/:modelId
      const modelMatch = subPath.match(/^\/models\/([^/]+)$/);
      if (modelMatch) {
        const modelId = decodeURIComponent(modelMatch[1]);
        if (method === 'PUT') {
          const body = await parseJsonBody(req);
          const updated = db.updateModel(showId, modelId, body);
          return sendJson(res, 200, updated);
        }
        if (method === 'DELETE') {
          db.deleteModel(showId, modelId);
          return sendJson(res, 200, { success: true });
        }
      }

      // POST /api/shows/:id/items
      if (subPath === '/items' && method === 'POST') {
        const body = await parseJsonBody(req);
        const newItem = db.addItem(showId, body);
        return sendJson(res, 201, newItem);
      }

      // PUT or DELETE /api/shows/:id/items/:itemId
      const itemMatch = subPath.match(/^\/items\/([^/]+)$/);
      if (itemMatch) {
        const itemId = decodeURIComponent(itemMatch[1]);
        if (method === 'PUT') {
          const body = await parseJsonBody(req);
          const updated = db.updateItem(showId, itemId, body);
          return sendJson(res, 200, updated);
        }
        if (method === 'DELETE') {
          db.deleteItem(showId, itemId);
          return sendJson(res, 200, { success: true });
        }
      }

      // PUT or DELETE /api/shows/:id/assignments/:modelId/:appearanceIndex
      const assignMatch = subPath.match(/^\/assignments\/([^/]+)\/(\d+)$/);
      if (assignMatch) {
        const modelId = decodeURIComponent(assignMatch[1]);
        const appIndex = parseInt(assignMatch[2], 10);
        if (method === 'PUT') {
          const body = await parseJsonBody(req);
          const updated = db.setAssignment(showId, modelId, appIndex, body);
          return sendJson(res, 200, updated);
        }
        if (method === 'DELETE') {
          db.clearAssignment(showId, modelId, appIndex);
          return sendJson(res, 200, { success: true });
        }
      }

      // PUT /api/shows/:id/themes/:appearanceIndex
      const themeMatch = subPath.match(/^\/themes\/(\d+)$/);
      if (themeMatch) {
        const appIndex = parseInt(themeMatch[1], 10);
        if (method === 'PUT') {
          const body = await parseJsonBody(req);
          const updatedThemes = db.setAppearanceTheme(showId, appIndex, body.theme);
          return sendJson(res, 200, { success: true, appearanceThemes: updatedThemes });
        }
      }
    }

    return sendJson(res, 404, { error: `API route not found: ${method} ${pathname}` });
  } catch (err) {
    console.error(`[API Error] ${method} ${pathname}:`, err);
    return sendJson(res, 400, { error: err.message });
  }
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let reqPath = parsedUrl.pathname;

  // Route API requests to SQLite API handler
  if (reqPath.startsWith('/api/')) {
    return handleApiRequest(req, res, reqPath);
  }

  // Default to index.html for root path
  if (reqPath === '/') reqPath = '/index.html';

  const filePath = path.join(__dirname, reqPath);

  // Security check: Prevent path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(content);
    }
  });
});

const PID_FILE = path.join(__dirname, '.server.pid');

function cleanupPidFile() {
  try {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  } catch (e) {}
}

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    fs.writeFileSync(PID_FILE, String(process.pid));
    console.log(`Fashion Show Manager server running with SQLite at http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}/`);
    console.log(`SQLite database connected: ${db.dbPath}`);
  });

  process.on('SIGINT', () => { cleanupPidFile(); process.exit(0); });
  process.on('SIGTERM', () => { cleanupPidFile(); process.exit(0); });
  process.on('exit', () => { cleanupPidFile(); });
}

module.exports = { server, db };
