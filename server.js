const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'services.json');
const isProduction = process.env.NODE_ENV === 'production';
const staticDir = isProduction
  ? path.join(__dirname, 'dist')
  : path.join(__dirname, 'src');

// MIME types
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function ensureDataFile() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  }
}

function readServices() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading services:', err);
    return [];
  }
}

function writeServices(services) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(services, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing services:', err);
    return false;
  }
}

function parseJsonBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  req.on('end', () => {
    try {
      callback(body ? JSON.parse(body) : {});
    } catch (err) {
      callback(null, err);
    }
  });
}

function sendJson(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function serveFile(res, filePath, acceptEncoding) {
  // Try compressed versions first
  if (acceptEncoding.includes('br')) {
    const brPath = filePath + '.br';
    if (fs.existsSync(brPath)) {
      const stat = fs.statSync(brPath);
      res.writeHead(200, {
        'Content-Encoding': 'br',
        'Content-Type': getMimeType(filePath),
        'Content-Length': stat.size,
        'Vary': 'Accept-Encoding'
      });
      fs.createReadStream(brPath).pipe(res);
      return;
    }
  }

  if (acceptEncoding.includes('gzip')) {
    const gzPath = filePath + '.gz';
    if (fs.existsSync(gzPath)) {
      const stat = fs.statSync(gzPath);
      res.writeHead(200, {
        'Content-Encoding': 'gzip',
        'Content-Type': getMimeType(filePath),
        'Content-Length': stat.size,
        'Vary': 'Accept-Encoding'
      });
      fs.createReadStream(gzPath).pipe(res);
      return;
    }
  }

  // Serve uncompressed
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': getMimeType(filePath),
      'Content-Length': stat.size
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Not found
  const notFoundMime = getMimeType(filePath);
  if (notFoundMime.startsWith('text/html')) {
    res.writeHead(404, { 'Content-Type': notFoundMime });
    res.end(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>404 Not Found</title></head>' +
      '<body><h1>404 Not Found</h1><p>The requested resource was not found on this server.</p></body></html>'
    );
  } else if (notFoundMime === 'application/json') {
    res.writeHead(404, { 'Content-Type': notFoundMime });
    res.end(JSON.stringify({ error: 'Not found' }));
  } else {
    res.writeHead(404, { 'Content-Type': notFoundMime });
    res.end('Not found');
  }
}

ensureDataFile();

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const acceptEncoding = req.headers['accept-encoding'] || '';

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Routes
  if (pathname === '/api/services') {
    if (method === 'GET') {
      const services = readServices();
      sendJson(res, services);
    } else if (method === 'POST') {
      parseJsonBody(req, (data, err) => {
        if (err) {
          sendJson(res, { error: 'Invalid JSON' }, 400);
          return;
        }
        const { name, category, url: serviceUrl, icon } = data;
        if (!name || !serviceUrl) {
          sendJson(res, { error: 'Name and URL are required' }, 400);
          return;
        }
        const services = readServices();
        const newService = {
          id: Date.now(),
          name,
          category: category || '',
          url: serviceUrl,
          icon: icon || '📦'
        };
        services.push(newService);
        if (writeServices(services)) {
          sendJson(res, newService, 201);
        } else {
          sendJson(res, { error: 'Failed to save service' }, 500);
        }
      });
    }
    return;
  }

  // API service by ID
  const idMatch = pathname.match(/^\/api\/services\/(\d+)$/);
  if (idMatch) {
    const id = parseInt(idMatch[1]);
    if (method === 'GET') {
      const services = readServices();
      const service = services.find(s => s.id === id);
      if (!service) {
        sendJson(res, { error: 'Service not found' }, 404);
        return;
      }
      sendJson(res, service);
    } else if (method === 'PUT') {
      parseJsonBody(req, (data, err) => {
        if (err) {
          sendJson(res, { error: 'Invalid JSON' }, 400);
          return;
        }
        const { name, category, url: serviceUrl, icon } = data;
        if (!name || !serviceUrl) {
          sendJson(res, { error: 'Name and URL are required' }, 400);
          return;
        }
        const services = readServices();
        const idx = services.findIndex(s => s.id === id);
        if (idx === -1) {
          sendJson(res, { error: 'Service not found' }, 404);
          return;
        }
        services[idx] = {
          ...services[idx],
          name,
          category: category || '',
          url: serviceUrl,
          icon: icon || '📦'
        };
        if (writeServices(services)) {
          sendJson(res, services[idx]);
        } else {
          sendJson(res, { error: 'Failed to update service' }, 500);
        }
      });
    } else if (method === 'DELETE') {
      const services = readServices();
      const filtered = services.filter(s => s.id !== id);
      if (filtered.length === services.length) {
        sendJson(res, { error: 'Service not found' }, 404);
        return;
      }
      if (writeServices(filtered)) {
        sendJson(res, { success: true });
      } else {
        sendJson(res, { error: 'Failed to delete service' }, 500);
      }
    }
    return;
  }

  // Static file serving
  let filePath = pathname === '/'
    ? path.join(staticDir, 'index.html')
    : path.join(staticDir, pathname);

  serveFile(res, filePath, acceptEncoding);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Dashed server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
});

