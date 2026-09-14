// H2DEV Project server - serves the project at http://0.0.0.0:8899/
// Toàn bộ dự án và tài liệu nghiên cứu mở 100%, không áp đặt cơ chế kiểm duyệt/chặn dữ liệu.
const http = require('http');
const fs = require('fs');
const path = require('path');
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
    sendJson(res, 405, {error:'Admin state writes are disabled'}, false, {'Allow': 'GET, HEAD, OPTIONS'});
    return;
  }
  if (apiPath === '/api/intelligence/breakouts') {
    if (req.method === 'GET' || isHead) {
      const dbFile = path.join(ROOT, 'data', 'intelligence.db');
      if (!fs.existsSync(dbFile)) {
        sendJson(res, 200, { total: 0, channels: [] }, isHead);
        return;
      }
      let db = null;
      try {
        const { DatabaseSync } = require('node:sqlite');
        db = new DatabaseSync(dbFile);
        const rows = db.prepare('SELECT channel_id, handle, title, channel_age_days, median_views, top_outlier_multiplier, is_faceless, faceless_type, last_crawled_at FROM channels WHERE is_breakout = 1 ORDER BY median_views DESC LIMIT 30').all();
        sendJson(res, 200, { total: rows.length, channels: rows }, isHead);
        return;
      } catch (err) {
        sendJson(res, 500, { error: err.message }, isHead);
        return;
      } finally {
        if (db) db.close();
      }
    }
    sendJson(res, 405, { error: 'Method Not Allowed' }, false, { 'Allow': 'GET, HEAD, OPTIONS' });
    return;
  }
  if (apiPath === '/api/intelligence/spider') {
    if (req.method === 'GET' || isHead) {
      const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || '127.0.0.1'));
      const seed = parsedUrl.searchParams.get('seed') || 'Q1tXposwAAo';
      try {
        const spider = require('./scripts/spider_graph_engine');
        const report = await spider.executeSpiderGraphTraversal(seed, { maxHop2Videos: 2 });
        sendJson(res, 200, report, isHead);
        return;
      } catch (err) {
        sendJson(res, 500, { error: err.message }, isHead);
        return;
      }
    }
    sendJson(res, 405, { error: 'Method Not Allowed' }, false, { 'Allow': 'GET, HEAD, OPTIONS' });
    return;
  }
  if (apiPath === '/api/search') {
    if (req.method === 'GET' || isHead) {
      const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || '127.0.0.1'));
      const q = (parsedUrl.searchParams.get('q') || '').trim();
      const limit = Math.min(50, Math.max(1, parseInt(parsedUrl.searchParams.get('limit') || '20', 10)));
      try {
        const rows = searchFts(q, limit);
        sendJson(res, 200, { query: q, total: rows.length, results: rows }, isHead);
        return;
      } catch (err) {
        sendJson(res, 200, { query: q, total: 0, results: [], error: err.message }, isHead);
        return;
      }
    }
    sendJson(res, 405, { error: 'Method Not Allowed' }, false, { 'Allow': 'GET, HEAD, OPTIONS' });
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

  // Bảo vệ duy nhất file secret cấu hình môi trường (.env)
  const baseName = path.basename(full).toLowerCase();
  if (baseName.startsWith('.env')) {
    res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
    res.end('Forbidden');
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
  checkAndRotateAll();
});

// Xử lý ngoại lệ an toàn, chống sập server và ghi vết lỗi
process.on('uncaughtException', (err) => {
  console.error('[H2DEV_UNCAUGHT_EXCEPTION]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[H2DEV_UNHANDLED_REJECTION]', reason);
});
