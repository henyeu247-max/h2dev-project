// H2DEV Project server - serves the project at http://127.0.0.1:8899/
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname; // D:/YTB/H2DEV-Project
const PORT = process.env.PORT || 8899;
const HOST = process.env.HOST || '0.0.0.0'; // 0.0.0.0 = mở LAN/Tailscale; 127.0.0.1 = chỉ local

const MIME = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.mp4':'video/mp4',
  '.webm':'video/webm',
  '.mp3':'audio/mpeg',
  '.wav':'audio/wav',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.png':'image/png',
  '.svg':'image/svg+xml',
  '.webp':'image/webp',
  '.csv':'text/csv; charset=utf-8',
  '.tsv':'text/tab-separated-values; charset=utf-8',
  '.txt':'text/plain; charset=utf-8',
  '.md':'text/markdown; charset=utf-8',
  '.zip':'application/zip',
  '.ico':'image/x-icon',
  '.pdf':'application/pdf',
  '.woff':'font/woff',
  '.woff2':'font/woff2',
  '.ttf':'font/ttf',
  '.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function sendFile(res, full, mime, rangeHeader, isHead = false){
  fs.stat(full, (err, st)=>{
    if(err || !st.isFile()){
      res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
      res.end('404 Not Found');
      return;
    }
    const total = st.size;
    let start=0, end=total-1, status=200;
    if(rangeHeader){
      const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
      if(m){
        const rs=m[1], re=m[2];
        if(rs==='' && re!==''){ start=Math.max(0,total-parseInt(re,10)); end=total-1; }
        else if(rs!==''){ start=parseInt(rs,10); end=(re!==''?parseInt(re,10):total-1); }
        if(start>end || start>=total || end<0){
          res.writeHead(416, {'Content-Range':'bytes */'+total, 'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
          res.end('Range Not Satisfiable');
          return;
        }
        end=Math.min(end,total-1);
        status=206;
      } else {
        res.writeHead(416, {'Content-Range':'bytes */'+total, 'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
        res.end('Range Not Satisfiable');
        return;
      }
    }
    const headers = {
      'Content-Type': mime,
      'Accept-Ranges':'bytes',
      'Content-Length': (end-start+1),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Content-Disposition': 'inline',
    };
    if (mime === 'application/json' || full.endsWith('.json') || full.endsWith('.html')) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }
    if(status===206) headers['Content-Range']='bytes '+start+'-'+end+'/'+total;
    res.writeHead(status, headers);
    if(isHead){
      res.end();
      return;
    }
    fs.createReadStream(full, {start, end}).pipe(res);
  });
}

const ADMIN_STATE = path.join(ROOT, 'data', 'admin-state.json');
function readAdminState(){
  try { return JSON.parse(fs.readFileSync(ADMIN_STATE, 'utf8')); }
  catch (e) { return {role:'admin', version:1, updatedAt:0, watched:{}, favorites:[], recent:null}; }
}
function sendJson(res, status, value, isHead = false, extraHeaders = {}){
  const body=JSON.stringify(value);
  res.writeHead(status, {
    'Content-Type':'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin':'*',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    ...extraHeaders,
  });
  if (isHead) { res.end(); return; }
  res.end(body);
}

// Only the UI, catalog projections, public assets and local media are public.
// Internal workspaces must never become reachable just because a new directory
// was added below the project root.  Prefix entries ending in * are case-
// insensitive segment prefixes (for example docs/ZOOM-*).
const BLOCKED_SEGMENTS = new Set([
  '_backup', '_private', '_audit', '_internal', '_archive', '_drafts',
  'node_modules', 'inbox', '_verify', '.git', 'scripts', 'knowledge-hub',
  'pipelines', 'raw-kenh-goc', 'raw kênh mẫu tìm kiếm', 'raw-niches', 'design-is-2026-08-22',
]);
const BLOCKED_PREFIXES = [
  ['data', 'raw-channels-deep'],
  ['data', 'registry'],
];
const BLOCKED_FILE_NAMES = new Set([
  'server.log', 'server-lan.log', 'server-lan.err.log', 'h2dev-tray.log',
]);
const BLOCKED_RUNTIME_FILES = new Set([
  'server.js', 'package.json', 'package-lock.json', 'npm-shrinkwrap.json',
  'tailwind.config.js', 'webpack.config.js', 'vite.config.js',
  'rollup.config.js', 'tsconfig.json', '.babelrc', 'dockerfile',
  'agents.md', 'changelog.md', 'tree.md', '00_readme.md', 'chay-lan.md',
  '.gitignore', 'manifest_full.csv',
]);
const BLOCKED_FILE_PATTERN = /(?:^screenshot[-_]|^test_modal_rect\.|\.(?:log|bak|tmp|part|partial|pyc))$/i;
const BLOCKED_SCRIPT_EXTENSION = /\.(?:cmd|ps1|vbs|bat|sh)$/i;
const BLOCKED_ENV_FILE = /^\.env(?:$|[._-]|rc$)/i;
const NESTED_ARCHIVE_SEGMENT = /^_?(?:backups?|archives?|superseded)(?:$|[-_])/i;

function matchesBlockedPrefix(parts, prefix) {
  if (parts.length < prefix.length) return false;
  return prefix.every((expected, index) => {
    const actual = parts[index];
    if (expected.endsWith('*')) return actual.startsWith(expected.slice(0, -1));
    return actual === expected;
  });
}

function hasNestedDataArchive(parts) {
  const dataIndex = parts.indexOf('data');
  if (dataIndex < 0) return false;
  return parts.slice(dataIndex + 1).some((part) => NESTED_ARCHIVE_SEGMENT.test(part));
}

function isSensitiveFileName(name) {
  const lower = String(name || '').toLowerCase();
  return BLOCKED_FILE_NAMES.has(lower)
    || BLOCKED_RUNTIME_FILES.has(lower)
    || BLOCKED_FILE_PATTERN.test(name)
    || BLOCKED_SCRIPT_EXTENSION.test(name)
    || BLOCKED_ENV_FILE.test(name)
    || /mcp-keys/i.test(name);
}

function isBlockedRelativePath(relative) {
  const parts = relative.split(path.sep).filter(Boolean).map((part) => part.toLowerCase());
  if (parts.some((part) => BLOCKED_SEGMENTS.has(part))) return true;
  if (BLOCKED_PREFIXES.some((prefix) => matchesBlockedPrefix(parts, prefix))) return true;
  if (hasNestedDataArchive(parts)) return true;
  const base = parts[parts.length - 1] || '';
  return isSensitiveFileName(base);
}

// `catalog_full.json` historically contains signed/token-bearing video_link
// values.  The player only needs the catalog metadata and the local `mp4`
// path; redact sensitive links at the HTTP boundary without changing the
// canonical file on disk.
const SENSITIVE_QUERY_KEY = /(?:^|[?&])(?:token|access_token|api[_-]?key|signature|sig|expires|expiry|auth|credential|secret)=/i;
function sanitizePublicCatalogValue(value, key = '') {
  if (Array.isArray(value)) return value.map((item) => sanitizePublicCatalogValue(item, key));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      out[childKey] = sanitizePublicCatalogValue(childValue, childKey);
    }
    return out;
  }
  if (typeof value === 'string' && (/video[_-]?link/i.test(key) || SENSITIVE_QUERY_KEY.test(value))) return '';
  return value;
}

function readPublicCatalog() {
  const fullCatalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog_full.json'), 'utf8'));
  return sanitizePublicCatalogValue(fullCatalog);
}

const server = http.createServer(async (req,res)=>{
  if(req.method === 'OPTIONS'){
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end();
    return;
  }
  const isHead = (req.method === 'HEAD');
  const apiPath = req.url.split('?')[0];
  if (apiPath === '/api/admin-state') {
    if (req.method === 'GET' || isHead) {
      sendJson(res, 200, readAdminState(), isHead, {'Allow': 'GET, HEAD, OPTIONS'});
      return;
    }
    // Cross-device writes used to be unauthenticated.  Keep the read path for
    // the existing UI, but disable writes until a separately designed auth
    // boundary exists; do not invent or embed a shared secret here.
    sendJson(res, 405, {error:'Admin state writes are disabled'}, false, {'Allow': 'GET, HEAD, OPTIONS'});
    return;
  }
  if (req.method !== 'GET' && !isHead) {
    res.writeHead(405, {
      'Allow': 'GET, HEAD, OPTIONS',
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end('Method Not Allowed');
    return;
  }
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (error) {
    res.writeHead(400, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
    res.end('400 Bad Request: malformed URL encoding');
    return;
  }
  // Windows alternate data streams (for example .env::$DATA) must not be
  // allowed to reach path.resolve or the filesystem.  Check after decoding so
  // both literal and percent-encoded colons are rejected.
  const urlSegments = urlPath.split('/');
  if (urlSegments.some((segment) => segment.includes(':') || segment.includes('\0'))) {
    res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*', 'X-Content-Type-Options':'nosniff'});
    res.end('Forbidden');
    return;
  }
  if(urlPath === '/') urlPath = '/index.html';

  // Virtual semantic SPA clean routing
  const lotrinhMatch = urlPath.match(/^\/(?:lotrinh|video)(?:\/([a-zA-Z0-9_.-]+))?\/?$/i);
  if (lotrinhMatch) {
    const skuSegment = lotrinhMatch[1];
    if (skuSegment && !skuSegment.includes('.')) {
      urlPath = '/player.html';
    } else if (!skuSegment) {
      urlPath = /^\/lotrinh\/?$/i.test(urlPath) ? '/learn.html' : '/index.html';
    }
  } else if (/^\/(?:tongquan|video|ngachxanh|kichban|nguonreup|kenh|rawkenh|chienluoc)\/?$/i.test(urlPath)) {
    urlPath = '/index.html';
  }

  let full = path.resolve(ROOT, '.'+urlPath);
  const relative = path.relative(ROOT, full);
  if(relative === '..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative)){
    res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
    res.end('Forbidden');
    return;
  }
  if (isBlockedRelativePath(relative)) {
    res.writeHead(403, {
      'Content-Type':'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin':'*',
      'X-Content-Type-Options':'nosniff',
    });
    res.end('Forbidden');
    return;
  }
  // Resolve existing symlinks/junctions before serving.  A public-looking
  // alias must not bypass the blocked private/raw path policy.
  try {
    const resolvedFull = fs.realpathSync.native(full);
    const resolvedRelative = path.relative(ROOT, resolvedFull);
    if (resolvedRelative === '..' || resolvedRelative.startsWith('..'+path.sep) || path.isAbsolute(resolvedRelative) || isBlockedRelativePath(resolvedRelative)) {
      res.writeHead(403, {
        'Content-Type':'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin':'*',
        'X-Content-Type-Options':'nosniff',
      });
      res.end('Forbidden');
      return;
    }
    full = resolvedFull;
  } catch (error) {
    // Missing paths are handled by the normal 404 branch below.  Other
    // resolution failures fail closed rather than exposing an alias.
    if (error && error.code && error.code !== 'ENOENT' && error.code !== 'ENOTDIR') {
      res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*', 'X-Content-Type-Options':'nosniff'});
      res.end('Forbidden');
      return;
    }
  }
  const publicCatalogRelative = path.join('data', 'catalog_full.json').toLowerCase();
  const resolvedRelative = path.relative(ROOT, full).toLowerCase();
  const isPublicCatalog = relative.toLowerCase() === publicCatalogRelative || resolvedRelative === publicCatalogRelative;
  if (isPublicCatalog) {
    try {
      sendJson(res, 200, readPublicCatalog(), isHead);
    } catch (error) {
      sendJson(res, 500, {error: 'Public catalog unavailable'}, isHead);
    }
    return;
  }
  fs.stat(full, (err, st)=>{
    if(!err && st.isDirectory()){
      const idx = path.join(full, 'index.html');
      fs.stat(idx, (e2,s2)=>{
        if(!e2 && s2.isFile()) sendFile(res, idx, MIME['.html'], req.headers.range, isHead);
        else { res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*', 'X-Content-Type-Options':'nosniff'}); res.end('404 Not Found'); }
      });
      return;
    }
    if(!err && st.isFile()){
      const mime = MIME[path.extname(full).toLowerCase()] || 'application/octet-stream';
      sendFile(res, full, mime, req.headers.range, isHead);
      return;
    }
    if(!path.extname(full)){
      const idx = path.join(full, 'index.html');
      fs.stat(idx, (e2,s2)=>{
        if(!e2 && s2.isFile()) sendFile(res, idx, MIME['.html'], req.headers.range, isHead);
        else { res.writeHead(404,{'Content-Type':'text/plain', 'Access-Control-Allow-Origin':'*', 'X-Content-Type-Options':'nosniff'}); res.end('404: '+urlPath); }
      });
      return;
    }
    res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
    res.end('404 Not Found: '+urlPath);
  });
});

server.listen(PORT, HOST, ()=>{
  console.log('H2DEV Project running at http://'+HOST+':'+PORT+'/');
  console.log('Root: '+ROOT);
});

// watch-test-20260815
