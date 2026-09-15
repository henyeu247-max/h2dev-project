// H2DEV Project server - serves the project at http://0.0.0.0:8899/
// Toàn bộ dự án và tài liệu nghiên cứu mở 100%, không áp đặt cơ chế kiểm duyệt/chặn dữ liệu.
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('node:zlib');
const { initLogRotation, checkAndRotateAll } = require('./scripts/logrotate');
const { searchFts, mutateDatabase, query, queryOne } = require('./scripts/master_dal');

// Khởi tạo cơ chế Log Auto-Rotation (tự nén .gz khi log > 10MB, quét dọn file mồ côi)
initLogRotation(30 * 60 * 1000); // Quét định kỳ mỗi 30 phút

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

const COMPRESSIBLE_EXTS = new Set([
  '.html', '.css', '.js', '.json', '.svg', '.csv', '.tsv', '.txt', '.md'
]);

function sendFile(req, res, full, mime, rangeHeader, isHead = false){
  fs.stat(full, (err, st)=>{
    if(err || !st.isFile()){
      res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(full).toLowerCase();
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
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Content-Disposition': 'inline',
    };
    if (mime === 'application/json' || full.endsWith('.json') || full.endsWith('.html')) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }

    if(status===206){
      // Video/Audio Range requests: ALWAYS uncompressed, exact byte boundaries
      headers['Accept-Ranges'] = 'bytes';
      headers['Content-Length'] = (end-start+1);
      headers['Content-Range'] = 'bytes '+start+'-'+end+'/'+total;
      res.writeHead(status, headers);
      if(isHead){ res.end(); return; }
      const stream = fs.createReadStream(full, {start, end});
      stream.on('error', () => { if (!res.headersSent) res.destroy(); });
      stream.pipe(res);
      return;
    }

    // Standard 200 GET: Check if client accepts Gzip and file is compressible text/data
    const acceptEncoding = req && req.headers ? (req.headers['accept-encoding'] || '') : '';
    const canGzip = !rangeHeader && COMPRESSIBLE_EXTS.has(ext) && acceptEncoding.includes('gzip');

    headers['Vary'] = 'Accept-Encoding';

    if (canGzip) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      if (isHead) { res.end(); return; }
      const rawStream = fs.createReadStream(full);
      const gz = zlib.createGzip({ level: 6 });
      rawStream.on('error', () => { if (!res.headersSent) res.destroy(); });
      gz.on('error', () => { if (!res.headersSent) res.destroy(); });
      rawStream.pipe(gz).pipe(res);
    } else {
      headers['Accept-Ranges'] = 'bytes';
      headers['Content-Length'] = total;
      res.writeHead(200, headers);
      if (isHead) { res.end(); return; }
      const stream = fs.createReadStream(full);
      stream.on('error', () => { if (!res.headersSent) res.destroy(); });
      stream.pipe(res);
    }
  });
}

const ADMIN_STATE = path.join(ROOT, 'data', 'admin-state.json');
function readAdminState(){
  try { return JSON.parse(fs.readFileSync(ADMIN_STATE, 'utf8')); }
  catch (e) { return {role:'admin', version:1, updatedAt:0, watched:{}, favorites:[], recent:null}; }
}

function sendJson(req, res, status, value, isHead = false, extraHeaders = {}){
  const body = JSON.stringify(value);
  const acceptEncoding = req && req.headers ? (req.headers['accept-encoding'] || '') : '';
  const canGzip = acceptEncoding.includes('gzip');

  const headers = {
    'Content-Type':'application/json; charset=utf-8',
    'Access-Control-Allow-Origin':'*',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'Vary': 'Accept-Encoding',
    ...extraHeaders,
  };

  if (canGzip) {
    const buf = Buffer.from(body);
    const gzipped = zlib.gzipSync(buf, { level: 6 });
    headers['Content-Encoding'] = 'gzip';
    headers['Content-Length'] = gzipped.length;
    res.writeHead(status, headers);
    if (isHead) { res.end(); return; }
    res.end(gzipped);
  } else {
    headers['Content-Length'] = Buffer.byteLength(body);
    res.writeHead(status, headers);
    if (isHead) { res.end(); return; }
    res.end(body);
  }
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
      sendJson(req, res, 200, readAdminState(), isHead, {'Allow': 'GET, HEAD, OPTIONS'});
      return;
    }
    sendJson(req, res, 405, {error:'Admin state writes are disabled'}, false, {'Allow': 'GET, HEAD, OPTIONS'});
    return;
  }
  if (apiPath === '/api/intelligence/breakouts') {
    if (req.method === 'GET' || isHead) {
      const dbFile = path.join(ROOT, 'data', 'intelligence.db');
      if (!fs.existsSync(dbFile)) {
        sendJson(req, res, 200, { total: 0, channels: [] }, isHead);
        return;
      }
      let db = null;
      try {
        const { DatabaseSync } = require('node:sqlite');
        db = new DatabaseSync(dbFile);
        const rows = db.prepare('SELECT channel_id, handle, title, channel_age_days, median_views, top_outlier_multiplier, is_faceless, faceless_type, last_crawled_at FROM channels WHERE is_breakout = 1 ORDER BY median_views DESC LIMIT 30').all();
        sendJson(req, res, 200, { total: rows.length, channels: rows }, isHead);
        return;
      } catch (err) {
        sendJson(req, res, 500, { error: err.message }, isHead);
        return;
      } finally {
        if (db) db.close();
      }
    }
    sendJson(req, res, 405, { error: 'Method Not Allowed' }, false, { 'Allow': 'GET, HEAD, OPTIONS' });
    return;
  }
  if (apiPath === '/api/intelligence/spider') {
    if (req.method === 'GET' || isHead) {
      const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || '127.0.0.1'));
      const seed = parsedUrl.searchParams.get('seed') || 'Q1tXposwAAo';
      try {
        const spider = require('./scripts/spider_graph_engine');
        const report = await spider.executeSpiderGraphTraversal(seed, { maxHop2Videos: 2 });
        sendJson(req, res, 200, report, isHead);
        return;
      } catch (err) {
        sendJson(req, res, 500, { error: err.message }, isHead);
        return;
      }
    }
    sendJson(req, res, 405, { error: 'Method Not Allowed' }, false, { 'Allow': 'GET, HEAD, OPTIONS' });
    return;
  }
  if (apiPath === '/api/search') {
    if (req.method === 'GET' || isHead) {
      const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || '127.0.0.1'));
      const q = (parsedUrl.searchParams.get('q') || '').trim();
      const limit = Math.min(50, Math.max(1, parseInt(parsedUrl.searchParams.get('limit') || '20', 10)));
      try {
        const rows = searchFts(q, limit);
        sendJson(req, res, 200, { query: q, total: rows.length, results: rows }, isHead);
        return;
      } catch (err) {
        sendJson(req, res, 200, { query: q, total: 0, results: [], error: err.message }, isHead);
        return;
      }
    }
    sendJson(req, res, 405, { error: 'Method Not Allowed' }, false, { 'Allow': 'GET, HEAD, OPTIONS' });
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
  } catch (err) {
    res.writeHead(400, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end('400 Bad Request: Malformed URI');
    return;
  }
  if(urlPath === '/' || urlPath === '') urlPath = '/index.html';

  // Routing các trang giao diện chính
  if (/^\/lotrinh(?:\/(.*))?$/i.test(urlPath)) {
    const match = urlPath.match(/^\/lotrinh(?:\/(.*))?$/i);
    const sku = match && match[1] ? match[1].replace(/\/+$/, '') : '';
    if (sku) {
      urlPath = '/player.html';
    } else {
      urlPath = '/learn.html';
    }
  } else if (/^\/(?:tongquan|video|ngachxanh|kichban|nguonreup|kenh|rawkenh|chienluoc)\/?$/i.test(urlPath)) {
    urlPath = '/index.html';
  }

  let full = path.resolve(ROOT, '.'+urlPath);
  const relative = path.relative(ROOT, full);

  // Bảo vệ cơ bản: Chống path traversal vượt ra ngoài thư mục dự án ROOT
  if(relative === '..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative)){
    res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
    res.end('Forbidden');
    return;
  }

  // Bảo vệ file secret cấu hình môi trường (.env)
  const baseName = path.basename(full).toLowerCase();
  if (baseName.startsWith('.env')) {
    res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
    res.end('Forbidden');
    return;
  }

  // Bảo vệ thư mục chứa SECRET/CONFIG (KHÔNG chặn data học liệu/video/transcript).
  // Lưu ý: đây là bảo vệ BÍ MẬT (API key, backup .env, git history), không phải che giấu
  // dữ liệu theo Rule 1.7. Các thư mục dữ liệu (data/, data-tabs/, docs/, assets/, video/)
  // vẫn mở 100%.
  // Danh sách dưới đây khớp tuyên bố TREE.md (mục "web bị chặn / 403") + bổ sung 16/09/2026.
  // LƯU Ý: tất cả entry viết CHỮ THƯỜNG — so khớp bằng toLowerCase() vì Windows
  // filesystem không phân biệt hoa/thường (tránh bypass kiểu /.GIT/config hay /_PRIVATE/).
  const SENSITIVE_SEGMENTS = new Set([
    '.git',         // CRITICAL 16/09: toàn bộ lịch sử git từng bị tải qua HTTP (kể cả commit chứa key cũ)
    'node_modules', // dependency tree — không phục vụ web
    '_private',     // chứa mcp-keys-h2dev.md (danh mục key)
    '_backup',      // chứa .env.bak và bản backup key plaintext
    '_audit',       // raw phân tích nội bộ (AGENTS.md yêu cầu chặn)
    '_internal',    // tài liệu nội bộ nháp
    '_drafts',      // bản nháp chưa duyệt
    '_archive',     // rác đã dời khỏi web serve (NO_DELETE)
    '_verify',      // scratch verify nội bộ
    '_frames',      // frame trích từ video (file con từng tải được)
    '_tmp_audio',   // audio tạm của pipeline
    '.cache',       // cache runtime (checkpoint, thumbnail tải về)
    '.venv-gpu',    // môi trường Python GPU — không phục vụ web
    '.zcode',       // cấu hình agent nội bộ
    'logs',         // log server/watchdog — có thể chứa path & thông tin vận hành
    'inbox',        // vùng thả file mới (TREE.md: web bị chặn)
    'raw-kenh-goc', // ảnh raw canonical bản gốc (TREE.md: web bị CHẶN 403)
    'design-is-2026-08-22', // audit UI nội bộ (TREE.md: web bị CHẶN 403)
    'raw kênh mẫu tìm kiếm', // historical only (TREE.md: chặn từ 31/08)
  ]);
  const relSegs = relative.split(path.sep);
  if (relSegs.some(seg => SENSITIVE_SEGMENTS.has(seg.toLowerCase()))) {
    res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
    res.end('Forbidden');
    return;
  }
  // Bảo vệ file database/secret binary ở thư mục data (không lộ dump toàn bộ DB qua web tĩnh).
  // Bao gồm cả các file phụ trợ của SQLite: -wal, -shm, -journal.
  if (/\.(db|sqlite|sqlite3)(-(wal|shm|journal))?$/i.test(baseName) || /^mcp-keys/i.test(baseName)) {
    res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
    res.end('Forbidden');
    return;
  }

  fs.stat(full, (err, st)=>{
    if(!err && st.isDirectory()){
      const idx = path.join(full, 'index.html');
      fs.stat(idx, (e2,s2)=>{
        if(!e2 && s2.isFile()) sendFile(req, res, idx, MIME['.html'], req.headers.range, isHead);
        else { res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*', 'X-Content-Type-Options':'nosniff'}); res.end('404 Not Found'); }
      });
      return;
    }
    if(!err && st.isFile()){
      const mime = MIME[path.extname(full).toLowerCase()] || 'application/octet-stream';
      sendFile(req, res, full, mime, req.headers.range, isHead);
      return;
    }
    if(!path.extname(full)){
      const idx = path.join(full, 'index.html');
      fs.stat(idx, (e2,s2)=>{
        if(!e2 && s2.isFile()) sendFile(req, res, idx, MIME['.html'], req.headers.range, isHead);
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
  checkAndRotateAll();
});

// Xử lý ngoại lệ an toàn, chống sập server và ghi vết lỗi
process.on('uncaughtException', (err) => {
  console.error('[H2DEV_UNCAUGHT_EXCEPTION]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[H2DEV_UNHANDLED_REJECTION]', reason);
});
