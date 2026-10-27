// H2DEV Project server - serves the project at http://0.0.0.0:8899/
// Toàn bộ dự án và tài liệu nghiên cứu mở 100%, không áp đặt cơ chế kiểm duyệt/chặn dữ liệu.
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('node:zlib');
const { initLogRotation, checkAndRotateAll } = require('./scripts/logrotate');
const { searchFts, mutateDatabase, query, queryOne } = require('./scripts/master_dal');
const { startAutoSyncWatcher, getSyncStatus, triggerSyncNow, ensureGraphFresh } = require('./scripts/kg_auto_sync');
const { traceNodeInDb, searchGraphInDb, listProjectsFromDb } = require('./scripts/kg_query');

// G4: Security headers chung cho moi response
const SECURE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "script-src-attr 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://i.ytimg.com https://yt3.ggpht.com https://*.googleusercontent.com https://*.ggpht.com https://i9.ytimg.com https://api.daigiamangdep.com",
    "media-src 'self' blob: https://*.mona-cloud.com https://video.mona-cloud.com",
    "font-src 'self'",
    "connect-src 'self' https://*.mona-cloud.com https://video.mona-cloud.com",
    "frame-src 'self' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'"
  ].join('; ')
};
function withSecure(extra) {
  return Object.assign({}, SECURE_HEADERS, extra || {});
}

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
  '.srt':'text/plain; charset=utf-8',
  '.vtt':'text/vtt; charset=utf-8',
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
  '.html', '.css', '.js', '.json', '.svg', '.csv', '.tsv', '.txt', '.srt', '.vtt', '.md'
]);

// In-memory RAM cache cho file nén Gzip (khống chế tối đa 120 entries để an toàn bộ nhớ VPS)
const GZIP_CACHE = new Map();
const MAX_GZIP_CACHE_ENTRIES = 120;
function setGzipCache(key, entry) {
  if (GZIP_CACHE.size >= MAX_GZIP_CACHE_ENTRIES) {
    const oldestKey = GZIP_CACHE.keys().next().value;
    if (oldestKey) GZIP_CACHE.delete(oldestKey);
  }
  GZIP_CACHE.set(key, entry);
}

// So sánh ETag chuẩn RFC 9110 hỗ trợ dấu phẩy và hậu tố Cloudflare -gzip
function matchEtag(clientHeader, serverEtag) {
  if (!clientHeader || !serverEtag) return false;
  const cleanServer = serverEtag.replace(/^W\//, '').replace(/"/g, '').trim();
  const clientList = clientHeader.split(',').map(s => s.replace(/^W\//, '').replace(/"/g, '').trim());
  return clientList.some(c => c === cleanServer || c === cleanServer + '-gzip' || c === '*');
}

function sendFile(req, res, full, mime, rangeHeader, isHead = false){
  fs.stat(full, (err, st)=>{
    if(err || !st.isFile()){
      res.writeHead(404, withSecure({'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'}));
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
          res.writeHead(416, withSecure({'Content-Range':'bytes */'+total, 'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'}));
          res.end('Range Not Satisfiable');
          return;
        }
        end=Math.min(end,total-1);
        status=206;
      } else {
        res.writeHead(416, withSecure({'Content-Range':'bytes */'+total, 'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'}));
        res.end('Range Not Satisfiable');
        return;
      }
    }
    const headers = Object.assign(withSecure({
      'Content-Type': mime,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Content-Disposition': 'inline',
      'Vary': 'Accept-Encoding',
    }), SECURE_HEADERS);

    const etag = `W/"${st.mtimeMs.toString(36)}-${st.size.toString(36)}"`;
    headers['ETag'] = etag;

    /* UI-06 production fix (2026-09-28): cho phep SW script tai /assets/app/sw.js
       dang ky scope '/' — khong co header nay browser se giam scope xuong
       /assets/app/ va trang goc lai khong duoc control (offline chet). */
    const normFull = full.replace(/\\/g, '/');
    if (normFull.endsWith('/assets/app/sw.js') || normFull.endsWith('/sw.js')) {
      headers['Service-Worker-Allowed'] = '/';
    }

    // Cache-Control thông minh: Tăng tốc độ CDN & Trình duyệt
    if (full.endsWith('.html')) {
      headers['Cache-Control'] = 'no-cache, must-revalidate';
    } else if (full.includes('data-tabs') || (full.includes('data') && full.endsWith('.json'))) {
      // Data tabs và catalog: Cho phép Cloudflare Edge cache 120s, stale-while-revalidate 600s
      headers['Cache-Control'] = 'public, max-age=120, stale-while-revalidate=600';
    } else if (full.endsWith('.js') || full.endsWith('.css')) {
      /* H2DEV 2026-09-23 — TACH .js/.css RA KHOI NHOM ANH/FONT.
       *
       * VAN DE THAT (da do 3 duong di Local / nginx / Cloudflare, 2026-09-23):
       *   .js/.css bi gop chung voi .png/.jpg/.woff2 -> nhan 'max-age=86400'.
       *   Cloudflare tin file "tuoi 24h" nen KHONG hoi lai origin -> tra ban cu HIT.
       *   Ket qua: sau moi lan deploy = HTML moi + JS cu  => giao dien loi kho hieu.
       *   (nginx khong phai thu pham: goi truc tiep 127.0.0.1:8899 cung tra 86400 —
       *    chinh file nay moi la nguoi set header cuoi cung.)
       *
       * CACH SUA: .js/.css -> no-cache. Cloudflare VAN luu, nhung BAT BUOC hoi lai
       *   origin moi request; file khong doi -> ETag khop -> tra 304 (rat nhe).
       *   => deploy xong la thay ngay, khong can purge cache, khong ton bang thong.
       *
       * ANH/FONT giu max-age=86400: thumbnail & font hiem doi, cache lau giup web nhanh.
       * .jpeg/.gif/.ico duoc them vao day cho day du (da kiem ke thuc te: .jpeg co 77 file).
       */
      headers['Cache-Control'] = 'no-cache, must-revalidate';
    } else if (full.endsWith('.woff2') || full.endsWith('.woff') || full.endsWith('.ttf')
            || full.endsWith('.svg') || full.endsWith('.png')
            || full.endsWith('.jpg') || full.endsWith('.jpeg')
            || full.endsWith('.webp') || full.endsWith('.gif') || full.endsWith('.ico')) {
      headers['Cache-Control'] = 'public, max-age=86400, stale-while-revalidate=604800';
    } else if (mime === 'application/json') {
      headers['Cache-Control'] = 'no-cache, must-revalidate';
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

    // 304 Not Modified check (Hỗ trợ chuẩn RFC 9110 và Cloudflare -gzip)
    const ifNoneMatch = req && req.headers ? req.headers['if-none-match'] : null;
    if (matchEtag(ifNoneMatch, etag)) {
      res.writeHead(304, headers);
      res.end();
      return;
    }

    // Standard 200 GET: Check if client accepts Gzip and file is compressible text/data
    const acceptEncoding = req && req.headers ? (req.headers['accept-encoding'] || '') : '';
    const canGzip = COMPRESSIBLE_EXTS.has(ext) && acceptEncoding.includes('gzip');

    if (canGzip) {
      headers['Content-Encoding'] = 'gzip';
      // Fast path: In-memory Gzip buffer cache cho files < 5MB (trả về trong 0.1ms)
      if (total < 5 * 1024 * 1024) {
        const cached = GZIP_CACHE.get(full);
        if (cached && cached.mtimeMs === st.mtimeMs) {
          headers['Content-Length'] = cached.buffer.length;
          res.writeHead(200, headers);
          if (isHead) { res.end(); return; }
          res.end(cached.buffer);
          return;
        }
        fs.readFile(full, (readErr, rawBuf) => {
          if (readErr) {
            if (!res.headersSent) { res.writeHead(500); res.end('Read Error'); }
            return;
          }
          zlib.gzip(rawBuf, { level: 6 }, (gzErr, gzBuf) => {
            if (gzErr) {
              if (!res.headersSent) { res.writeHead(500); res.end('Gzip Error'); }
              return;
            }
            setGzipCache(full, { mtimeMs: st.mtimeMs, buffer: gzBuf });
            headers['Content-Length'] = gzBuf.length;
            res.writeHead(200, headers);
            if (isHead) { res.end(); return; }
            res.end(gzBuf);
          });
        });
        return;
      }
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
    'Vary': 'Accept-Encoding',
    ...SECURE_HEADERS,
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

// DGMD Mona Cloud embed proxy: cache RAM 10 phút, tự inject no-referrer để bypass hotlink CDN
const DGMD_EMBED_CACHE = new Map();
function fetchMonaEmbedHtml(videoLink, originUrl, maxRedirects = 5) {
  let targetUrl = videoLink;
  if (!targetUrl.includes('link=')) {
    targetUrl += (targetUrl.includes('?') ? '&' : '?') + 'link=https://video.mona-cloud.com/statics/mb9802.js?ver=2501141006';
  }

  function get(url, redirectsLeft) {
    if (redirectsLeft <= 0) {
      return Promise.reject(new Error('Quá nhiều lần redirect khi nạp video Mona Cloud'));
    }
    return new Promise((resolve, reject) => {
      const client = url.startsWith('http:') ? http : https;
      const req = client.get(url, {
        headers: {
          'Referer': originUrl || 'https://daigiamangdep.com/learn/study/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8'
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, url).toString();
          get(nextUrl, redirectsLeft - 1).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Mona Cloud phản hồi mã lỗi ${res.statusCode}`));
          return;
        }
        let body = '';
        res.on('data', (d) => { body += d; });
        res.on('end', () => resolve(body));
      });
      req.on('error', reject);
    });
  }

  return get(targetUrl, maxRedirects).then((html) => {
    // Inject <meta name="referrer" content="no-referrer"> để child requests (m3u8, .ts) không rò rỉ 127.0.0.1 ra Mona Cloud CDN
    // Kèm style ẩn banner cảnh báo nước ngoài (null) không cần thiết
    const injection = '\n<meta name="referrer" content="no-referrer">\n<style>div[style*="z-index: 1000"][style*="rgba(0, 0, 0, 0.3)"] { display: none !important; }</style>\n';
    if (html.includes('<head>')) {
      return html.replace('<head>', '<head>' + injection);
    }
    return injection + html;
  });
}

const server = http.createServer(async (req,res)=>{
  if(req.method === 'OPTIONS'){
    res.writeHead(204, withSecure({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    }));
    res.end();
    return;
  }
  const isHead = (req.method === 'HEAD');
  const apiPath = req.url.split('?')[0];
  if (apiPath === '/health' && (req.method === 'GET' || isHead)) {
    res.writeHead(200, withSecure({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }));
    res.end(isHead ? undefined : JSON.stringify({ ok: true }));
    return;
  }
  if (apiPath.startsWith('/api/kg/')) {
    const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || '127.0.0.1'));
    const kgSync = require('./scripts/kg_auto_sync');
    const kgQuery = require('./scripts/kg_query');
    try {
      if (apiPath === '/api/kg/status' && (req.method === 'GET' || isHead)) {
        if (parsedUrl.searchParams.get('check') === '1') {
          kgSync.ensureGraphFresh();
        }
        sendJson(req, res, 200, kgSync.getSyncStatus(), isHead);
        return;
      }
      if (apiPath === '/api/kg/stats' && (req.method === 'GET' || isHead)) {
        sendJson(req, res, 200, kgQuery.getGraphStatsFromDb(true), isHead);
        return;
      }
      if (apiPath === '/api/kg/reload' && (req.method === 'POST' || req.method === 'GET')) {
        try {
          delete require.cache[require.resolve('./scripts/kg_auto_sync')];
          delete require.cache[require.resolve('./scripts/build_knowledge_vault_graph')];
          delete require.cache[require.resolve('./scripts/kg_query')];
          GZIP_CACHE.clear();
        } catch (_) {}
        const wantRestart = parsedUrl.searchParams.get('restart') === '1';
        const remoteIp = req.socket && req.socket.remoteAddress || '';
        const isLoopback = remoteIp === '127.0.0.1' || remoteIp === '::1' || remoteIp === '::ffff:127.0.0.1';
        sendJson(req, res, 200, { reloaded: true, restarting: Boolean(wantRestart && isLoopback) }, false);
        if (wantRestart && isLoopback) {
          setTimeout(() => process.exit(0), 150);
        }
        return;
      }
      if (apiPath === '/api/kg/sync' && (req.method === 'POST' || req.method === 'GET')) {
        const reason = (parsedUrl.searchParams.get('reason') || 'web_ui_manual_sync').trim();
        const full = parsedUrl.searchParams.get('full') === '1';
        const result = kgSync.triggerSyncNow(reason, full);
        GZIP_CACHE.clear();
        sendJson(req, res, 200, result, false);
        return;
      }
      if (apiPath === '/api/kg/projects' && (req.method === 'GET' || isHead)) {
        sendJson(req, res, 200, kgQuery.listProjectsFromDb(true), isHead);
        return;
      }
      if (apiPath === '/api/kg/trace' && (req.method === 'GET' || isHead)) {
        const q = (parsedUrl.searchParams.get('q') || '').trim();
        if (!q) {
          sendJson(req, res, 400, { found: false, error: 'Missing q parameter' }, isHead);
          return;
        }
        const traceRes = kgQuery.traceNodeInDb(q, true);
        sendJson(req, res, traceRes.found ? 200 : 404, traceRes, isHead);
        return;
      }
      if (apiPath === '/api/kg/search' && (req.method === 'GET' || isHead)) {
        const q = (parsedUrl.searchParams.get('q') || '').trim();
        const type = (parsedUrl.searchParams.get('type') || '').trim();
        const layer = (parsedUrl.searchParams.get('layer') || '').trim();
        const track = (parsedUrl.searchParams.get('track') || '').trim();
        const rawLim = parseInt(parsedUrl.searchParams.get('limit') || '20', 10);
        const limit = Number.isFinite(rawLim) ? Math.min(50, Math.max(1, rawLim)) : 20;
        sendJson(req, res, 200, kgQuery.searchGraphInDb(q, { type, layer, track, limit }, true), isHead);
        return;
      }
      if (apiPath === '/api/kg/deep' && (req.method === 'GET' || isHead)) {
        const q = (parsedUrl.searchParams.get('q') || '').trim();
        const type = (parsedUrl.searchParams.get('type') || '').trim();
        const layer = (parsedUrl.searchParams.get('layer') || '').trim();
        const rawLim = parseInt(parsedUrl.searchParams.get('limit') || '10', 10);
        const limit = Number.isFinite(rawLim) ? Math.min(25, Math.max(1, rawLim)) : 10;
        sendJson(req, res, 200, kgQuery.deepSearchAll(q, { type, layer, limit }), isHead);
        return;
      }
      if (apiPath === '/api/kg/path' && (req.method === 'GET' || isHead)) {
        const fromQ = (parsedUrl.searchParams.get('from') || '').trim();
        const toQ = (parsedUrl.searchParams.get('to') || '').trim();
        if (!fromQ || !toQ) {
          sendJson(req, res, 400, { found: false, error: 'Missing from or to parameter' }, isHead);
          return;
        }
        const pathRes = kgQuery.tracePathInDb(fromQ, toQ, true);
        sendJson(req, res, pathRes.found ? 200 : 404, pathRes, isHead);
        return;
      }
    } catch (kgErr) {
      sendJson(req, res, 500, { error: kgErr.message }, isHead);
      return;
    }
  }
  if (apiPath === '/api/admin-state') {
    if (req.method === 'GET' || isHead) {
      // `writable:false` = CONG BO kha nang ghi de client KHONG thu PUT nua
      // (truoc day client thu PUT -> 405 moi lan luu -> console day loi 405 vo ich).
      const state = readAdminState();
      sendJson(req, res, 200, Object.assign({}, state, {writable:false}), isHead, {'Allow': 'GET, HEAD, OPTIONS'});
      return;
    }
    sendJson(req, res, 405, {error:'Admin state writes are disabled', readable:true, writable:false}, false, {'Allow': 'GET, HEAD, OPTIONS'});
    return;
  }
  if (apiPath === '/api/dgmd-embed') {
    if (req.method === 'GET' || isHead) {
      const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || '127.0.0.1'));
      const sku = (parsedUrl.searchParams.get('sku') || '').trim();
      if (!sku) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(isHead ? undefined : 'Missing sku parameter');
        return;
      }
      try {
        const catPath = path.join(ROOT, 'data', 'catalog_dgmd.json');
        if (!fs.existsSync(catPath)) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(isHead ? undefined : 'DGMD catalog not found');
          return;
        }
        const dgmdList = JSON.parse(fs.readFileSync(catPath, 'utf8'));
        const item = dgmdList.find(x => (x.sku || '').toLowerCase() === sku.toLowerCase());
        if (!item || !item.file) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(isHead ? undefined : 'Video not found in DGMD catalog');
          return;
        }

        const now = Date.now();
        const cached = DGMD_EMBED_CACHE.get(item.sku);
        if (cached && (now - cached.ts < 10 * 60 * 1000)) {
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
            'X-Frame-Options': 'SAMEORIGIN'
          });
          res.end(isHead ? undefined : cached.html);
          return;
        }

        const html = await fetchMonaEmbedHtml(item.file, item.origin);
        DGMD_EMBED_CACHE.set(item.sku, { html, ts: now });

        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Frame-Options': 'SAMEORIGIN'
        });
        res.end(isHead ? undefined : html);
        return;
      } catch (err) {
        res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(isHead ? undefined : `Proxy error: ${err.message}`);
        return;
      }
    }
    sendJson(req, res, 405, { error: 'Method Not Allowed' }, false, { 'Allow': 'GET, HEAD, OPTIONS' });
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
        // 2026-10-09: 'total' = so phan tu tra ve (toi da 30, giu nguyen cho client cu).
        // totalBreakouts = TONG so kenh is_breakout = 1 trong intelligence.db (khong gioi han).
        const totalBreakouts = db.prepare('SELECT COUNT(*) AS c FROM channels WHERE is_breakout = 1').get().c;
        sendJson(req, res, 200, { total: rows.length, totalBreakouts, channels: rows }, isHead);
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
  // Route nay goi mang va ghi DB: chi nhan POST kem header X-H2DEV-Action: spider.
  // Trang web khac khong gui duoc header nay (OPTIONS khong cho phep), nen khong kich hoat duoc bang GET hay form.
  if (apiPath === '/api/intelligence/spider') {
    if (req.method === 'POST' && req.headers['x-h2dev-action'] === 'spider') {
      const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || '127.0.0.1'));
      const seed = parsedUrl.searchParams.get('seed') || 'Q1tXposwAAo';
      try {
        const spider = require('./scripts/spider_graph_engine');
        const report = await spider.executeSpiderGraphTraversal(seed, { maxHop2Videos: 2 });
        sendJson(req, res, 200, report, false);
        return;
      } catch (err) {
        sendJson(req, res, 500, { error: err.message }, false);
        return;
      }
    }
    if (req.method === 'POST') {
      sendJson(req, res, 403, { error: 'Thieu header X-H2DEV-Action: spider' }, false);
      return;
    }
    sendJson(req, res, 405, { error: 'Method Not Allowed' }, false, { 'Allow': 'POST, OPTIONS' });
    return;
  }
  if (apiPath === '/api/search') {
    if (req.method === 'GET' || isHead) {
      const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || '127.0.0.1'));
      const q = (parsedUrl.searchParams.get('q') || '').trim();
      const rawLim = parseInt(parsedUrl.searchParams.get('limit') || '20', 10);
      const limit = Number.isFinite(rawLim) ? Math.min(50, Math.max(1, rawLim)) : 20;
      try {
        const rows = searchFts(q, limit);
        /* FIX (uifix87, siết lại ở uifix88) LỖI 2/F1 — bo sung DU LIEU DIEU HUONG cho tung entity_type
           cua search_fts. Truoc day frontend tu doan URL tu entity_id nen SOP/TRANSCRIPT roi vao href "#"
           (76% ket qua) va CHANNEL tro "/#kenh" (router khong doc hash). O day chi BO SUNG truong du lieu
           that (khong doi shape cu, khong doi searchFts cua master_dal):
             CHANNEL    + raw_id (co ho so Raw kenh) / kenh_handle (co trong data-tabs/kenh-mau.json)
             TRANSCRIPT + parent_channel_title + parent_raw_id (video thuoc kenh nao — de mo dung kenh)
             SOP        + doc_id (so nguyen khop documents.doc_id) + doc_index (vi tri 0-based trong
                          data-tabs/tai-lieu-full.json, vi tab Tai lieu render tu JSON chu khong tu DB)
           Do duoc tren TOAN BO search_fts (2251 dong, doc read-only, 2026-10-22):
             TRANSCRIPT 1421/1421 quy duoc ve kenh cha co raw_id
             CHANNEL    149 co raw_id + 237 co handle trong kenh-mau = 386/386 co dich that
             SOP        300/300 co DOC_n khop documents.doc_id va JSON index */
        try {
          const channelRows = rows.filter(r => String(r.entity_type).toUpperCase() === 'CHANNEL');
          const transcriptRows = rows.filter(r => String(r.entity_type).toUpperCase() === 'TRANSCRIPT');
          const sopRows = rows.filter(r => String(r.entity_type).toUpperCase() === 'SOP');
          const nicheRows = rows.filter(r => String(r.entity_type).toUpperCase() === 'NICHE');
          const reupRows = rows.filter(r => String(r.entity_type).toUpperCase() === 'REUP');
          for (const r of nicheRows) {
            r.niche_name = String(r.title || '').replace(/^\[[^\]]+\]\s*/, '').trim();
          }
          for (const r of reupRows) {
            r.reup_name = String(r.title || '').replace(/^\[[^\]]+\]\s*/, '').trim();
          }
          if (channelRows.length) {
            const ids = channelRows.map(r => String(r.entity_id));
            const ph = ids.map(() => '?').join(',');
            const ccs = query(`SELECT channel_id, raw_id, handle FROM competitor_channels WHERE channel_id IN (${ph})`, ids);
            const byId = new Map(ccs.map(c => [String(c.channel_id), c]));
            let kenhHandles = new Set();
            try {
              const kenhRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'kenh-mau.json'), 'utf8'));
              kenhHandles = new Set((Array.isArray(kenhRaw) ? kenhRaw : []).map(k => String(k && k.handle || '').toLowerCase()).filter(Boolean));
            } catch (e) { kenhHandles = new Set(); }
            for (const r of channelRows) {
              const c = byId.get(String(r.entity_id)) || {};
              r.raw_id = c.raw_id || '';
              const h = String(c.handle || '');
              /* handle phai khop TUYET DOI (khong phai chuoi con) de khong mo nham kenh. */
              r.kenh_handle = (h && kenhHandles.has(h.toLowerCase())) ? h : '';
            }
          }
          if (transcriptRows.length) {
            const ids = transcriptRows.map(r => String(r.entity_id));
            const ph = ids.map(() => '?').join(',');
            const parents = query(
              `SELECT tv.video_id AS video_id, cc.title AS channel_title, cc.raw_id AS raw_id
                 FROM competitor_top_videos tv
                 JOIN competitor_channels cc ON cc.channel_id = tv.channel_id
                WHERE tv.video_id IN (${ph})`, ids);
            const byVid = new Map(parents.map(p => [String(p.video_id), p]));
            for (const r of transcriptRows) {
              const p = byVid.get(String(r.entity_id)) || {};
              r.parent_channel_title = p.channel_title || '';
              r.parent_raw_id = p.raw_id || '';
            }
          }
          if (sopRows.length) {
            /* DOC_n -> doc_id: khop documents.doc_id (do that 300/300). doc_index = thu tu trong
               data-tabs/tai-lieu-full.json (tab Tai lieu render tu file nay; 300/300 trung vi tri). */
            const docIds = sopRows
              .map(r => Number(String(r.entity_id).replace(/^DOC_/, '')))
              .filter(n => Number.isFinite(n) && n > 0);
            let byDocId = new Map();
            if (docIds.length) {
              const ph = docIds.map(() => '?').join(',');
              const docRows = query(`SELECT doc_id, name FROM documents WHERE doc_id IN (${ph})`, docIds);
              byDocId = new Map(docRows.map(d => [Number(d.doc_id), d]));
            }
            let jsonList = null;
            try {
              const tlRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'tai-lieu-full.json'), 'utf8'));
              jsonList = Array.isArray(tlRaw) ? tlRaw : null;
            } catch (e) { jsonList = null; }
            for (const r of sopRows) {
              const n = Number(String(r.entity_id).replace(/^DOC_/, ''));
              const d = byDocId.get(n);
              r.doc_id = d ? n : 0;
              /* Vi tri trong JSON: uu tien vi tri trung ten (doc_id n -> phan tu n-1, do that 300/300
                 khop ten); neu lech thi tim theo ten (ten trung nhau -> lay muc dau tien, van 1 muc). */
              let ji = -1;
              if (jsonList && d) {
                const cand = jsonList[n - 1];
                if (cand && String(cand.name) === String(d.name)) ji = n - 1;
                else ji = jsonList.findIndex(x => x && String(x.name) === String(d.name));
              }
              r.doc_index = ji;
            }
          }
        } catch (enrichErr) {
          /* Bo sung loi KHONG duoc lam hong ket qua tim kiem: tra rows goc + co loi rieng.
             F3: client BAY GIO doc truong `error` nay va hien canh bao (khong con nuot loi);
             dong nao thieu du lieu dieu huong thi client khong render nut "Mo". */
          sendJson(req, res, 200, { query: q, total: rows.length, results: rows, error: 'enrich: ' + enrichErr.message }, isHead);
          return;
        }
        sendJson(req, res, 200, { query: q, total: rows.length, results: rows }, isHead);
        return;
      } catch (err) {
        /* FIX (uifix87) LỖI 3 — truoc day tra 200 + results:[] + error: loi ha tang bi bien thanh
           "khong co ket qua" o UI. Nay tra 503 (service khong san sang) de client phan biet. */
        sendJson(req, res, 503, { query: q, total: 0, results: [], error: err.message }, isHead);
        return;
      }
    }
    sendJson(req, res, 405, { error: 'Method Not Allowed' }, false, { 'Allow': 'GET, HEAD, OPTIONS' });
    return;
  }
  if (apiPath.startsWith('/live/') || apiPath === '/api/dgmd-embed') {
    if (req.method === 'GET' || isHead) {
      let sku = '';
      if (apiPath.startsWith('/live/')) {
        sku = apiPath.replace('/live/', '').trim();
      } else {
        try {
          const parsedUrl = new URL(req.url, 'http://127.0.0.1:8899');
          sku = (parsedUrl.searchParams.get('sku') || '').trim();
        } catch (e) {}
      }
      if (/^VIDEO-[A-Za-z0-9]+$/i.test(sku)) {
        try {
          const { getLivePlayerUrl } = require('./scripts/live_player_resolver');
          const liveInfo = await getLivePlayerUrl(sku);
          const liveUrl = (typeof liveInfo === 'object' && liveInfo) ? liveInfo.url : liveInfo;
          const ref = (typeof liveInfo === 'object' && liveInfo) ? liveInfo.referer : 'https://h2dev.vn/';
          if (liveUrl) {
            const monaRes = await fetch(liveUrl, {
              headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131',
                'Referer': ref
              }
            });
            let html = await monaRes.text();
            html = html.replace('<head>', '<head><base href="https://video.mona-cloud.com/">');
            res.writeHead(200, {
              'Content-Type': 'text/html; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            res.end(html);
            return;
          } else {
            res.writeHead(404, withSecure({ 'Content-Type': 'text/plain; charset=utf-8' }));
            res.end(`Không tìm thấy luồng phát trực tiếp cho SKU ${sku}`);
            return;
          }
        } catch (err) {
          res.writeHead(502, withSecure({ 'Content-Type': 'text/plain; charset=utf-8' }));
          res.end(`Lỗi kết nối máy chủ nguồn: ${err.message}`);
          return;
        }
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
      ...SECURE_HEADERS,
    });
    res.end('Method Not Allowed');
    return;
  }

  let urlPath;
  try {
    // RFC 7230 §5.3.2: client sau proxy (vd Firefox + system proxy, MITM) gui
    // ABSOLUTE-FORM ("GET http://host/path HTTP/1.1") thay vi origin-form.
    // Server PHAI chap nhan ca 2 dang — strip scheme+host, lay path.
    // Scar 29/09: Firefox qua system proxy gui absolute-form tu request thu 2
    // tren connection -> stat fail -> 404 toan bo asset -> app chet tren Firefox.
    let rawUrl = req.url;
    const absMatch = rawUrl.match(/^https?:\/\/[^/]+(\/.*)$/i);
    if (absMatch) rawUrl = absMatch[1];
    urlPath = decodeURIComponent(rawUrl.split('?')[0]);
    // Gap G14 (2026-10-14): byte NUL (/%00) lam fs.stat nem loi dong bo, ket noi bi dong khong co phan hoi. Tra 400 nhu URI sai dinh dang.
    if (urlPath.indexOf('\0') !== -1) throw new Error('NUL byte in path');
  } catch (err) {
    res.writeHead(400, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...SECURE_HEADERS,
    });
    res.end('400 Bad Request: Malformed URI');
    return;
  }
  if(urlPath === '/' || urlPath === '') urlPath = '/index.html';

  // ===== PHASE 1: URL ROUTING CHUAN (design-system/URL-ROUTING-SPEC.md) =====

  // --- 1.1. Redirect 301 cho route cu / alias -> canonical (/tongquan cung 301 ve /) ---
  const REDIRECTS = {
    '/tongquan': '/',
    '/kichban': '/tai-lieu',
    '/kenh': '/kenh-mau',
    '/raw': '/rawkenh'
  };
  const redirectKey = urlPath.replace(/\/+$/, '').toLowerCase() || '/';
  if (REDIRECTS[redirectKey] !== undefined) {
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.writeHead(301, withSecure({ 'Location': REDIRECTS[redirectKey] + qs, 'Content-Type': 'text/plain; charset=utf-8' }));
    res.end('301 Moved Permanently: ' + REDIRECTS[redirectKey]);
    return;
  }

  // --- 1.2. Whitelist trang giao dien (them /tatca /nhac /tai-lieu /kenh-mau) ---
  if (/^\/lotrinh(?:\/(.*))?$/i.test(urlPath)) {
    const match = urlPath.match(/^\/lotrinh(?:\/(.*))?$/i);
    const sku = match && match[1] ? match[1].replace(/\/+$/, '') : '';
    if (sku) {
      // --- 1.3. Validate SKU: chi cho phep SKU co that trong catalog ---
      // Nguon su that: data/catalog.json (140 bai) + data-tabs/videos.json (bai hoc + Zoom)
      let isValidSku = false;
      try {
        const catalogPath = path.join(ROOT, 'data', 'catalog.json');
        const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
        const list = Array.isArray(catalog) ? catalog : (catalog.videos || []);
        const decoded = decodeURIComponent(sku).toLowerCase();
        isValidSku = list.some(v => String(v && v.sku || '').toLowerCase() === decoded);
        if (!isValidSku) {
          const dgmdCatalogPath = path.join(ROOT, 'data', 'catalog_dgmd.json');
          if (fs.existsSync(dgmdCatalogPath)) {
            const dgmdCatalog = JSON.parse(fs.readFileSync(dgmdCatalogPath, 'utf8'));
            isValidSku = dgmdCatalog.some(v => String(v && v.sku || '').toLowerCase() === decoded);
          }
        }
        if (!isValidSku) {
          const huanCatalogPath = path.join(ROOT, 'data', 'catalog_huan.json');
          if (fs.existsSync(huanCatalogPath)) {
            const huanCatalog = JSON.parse(fs.readFileSync(huanCatalogPath, 'utf8'));
            isValidSku = huanCatalog.some(v => String(v && v.sku || '').toLowerCase() === decoded);
          }
        }
      } catch (e) { isValidSku = false; }
      if (!isValidSku) {
        res.writeHead(404, withSecure({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }));
        res.end('<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><title>404 — Không tìm thấy bài học</title>'
          + '<meta name="robots" content="noindex"></head><body style="background:#050505;color:#f0f0f0;font-family:Inter,sans-serif;padding:48px;text-align:center">'
          + '<h1 style="font-size:24px">404 — Không tìm thấy bài học</h1>'
          + '<p style="color:#a9a9a9">Mã bài học <code>' + sku.replace(/[<>&"]/g, '') + '</code> không tồn tại trong kho.</p>'
          + '<p><a href="/lotrinh" style="color:#ff8095">← Về danh mục lộ trình</a></p></body></html>');
        return;
      }
      urlPath = '/player.html';
    } else {
      urlPath = '/learn.html';
    }
  } else if (/^\/(?:tatca|video|ngachxanh|tai-lieu|nhac|nguonreup|kenh-mau|rawkenh|chienluoc|sodo)\/?$/i.test(urlPath)) {
    urlPath = '/index.html';
  } else if (/^\/graph\/?$/i.test(urlPath)) {
    urlPath = '/graph.html';
  } else if (urlPath.toLowerCase() === '/favicon.ico') {
    urlPath = '/h2dev-icon.ico';
  }

  let full = path.resolve(ROOT, '.'+urlPath);
  const relative = path.relative(ROOT, full);

  // Bảo vệ cơ bản: Chống path traversal vượt ra ngoài thư mục dự án ROOT
  if(relative === '..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative)){
    res.writeHead(403, withSecure({'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'}));
    res.end('Forbidden');
    return;
  }

  // Bảo vệ file secret cấu hình môi trường (.env)
  const baseName = path.basename(full).toLowerCase();
  if (baseName.startsWith('.env')) {
    res.writeHead(403, withSecure({'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'}));
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
  if (apiPath === '/api/niche-radar') {
    if (req.method === 'GET' || isHead) {
      try {
        const nxPath = path.join(ROOT, 'data-tabs', 'ngach-xanh.json');
        const nxRaw = JSON.parse(fs.readFileSync(nxPath, 'utf8'));
        const list = Array.isArray(nxRaw) ? nxRaw : (nxRaw.ngachXanh || []);
        const items = list.map((n) => {
          const clean = (n.mauSach || []).length;
          const ban = (n.mauBan || []).length;
          const skus = (n.skus || []).length;
          const hang = Number(n.hang) || 9;
          const rpmRaw = String(n.rpm || '');
          const rpmNum = parseFloat((rpmRaw.match(/[0-9]+(?:\.[0-9]+)?/) || [])[0] || '0');
          // SAI = Search Acquisition Index (demand / discoverability)
          let sai = 20;
          if (rpmNum > 0) sai += Math.min(30, rpmNum * 3);
          if (/\d+[.,]?\d*\s*K|\d+[.,]?\d*\s*M|keyword/i.test(n.evidence || '')) sai += 25;
          if (hang <= 2) sai += 15; else if (hang <= 5) sai += 8;
          if (n.xanh === true) sai += 10;
          sai = Math.max(0, Math.min(100, Math.round(sai)));
          // PRI = Production Readiness Index
          let pri = 10;
          pri += Math.min(30, clean * 8);
          pri += Math.min(20, skus * 10);
          /* FIX (uifix87) — truoc day: `if (n.lamDuoc && /C?/i.test(n.lamDuoc)) pri += 20;`
             Regex /C?/ bi hong UTF-8 (ky tu "Ó" thanh "?"), "C?" = "khong bat buoc co C"
             => LUON true => ca 34/34 ngach deu duoc +20 vo dieu kien, PRI mat y nghia.
             Gia tri that trong data-tabs/ngach-xanh.json bat dau bang:
               "CÓ — ..."     : lam duoc ngay            -> +20
               "CÓ ĐK — ..."  : lam duoc CO DIEU KIEN    -> +10
               "CÓ KỸ THUẬT ...", "KHÓ ...", "KHÔNG ...", "CHƯA ĐỦ ...", "TÁCH: ..." -> 0
             Vi sao "CÓ ĐK" = +10 (nua muc): van san xuat duoc nhung phai giu rang buoc
             (vd. "KHONG gia bac si", "KHONG farm quote") va chua co mau noi dung day du
             => rui ro cao hon "CÓ" thuan. Dung escape Unicode (\u00d3 = Ó, \u0110 = Đ,
             \u1ef8 = Ỹ) de regex khong hong lai khi encoding file doi. */
          const lamDuocRaw = String(n.lamDuoc || '').trim();
          const lamDuocCoDieuKien = /^C\u00d3\s*\u0110K\b/i.test(lamDuocRaw);
          const lamDuocThuan = !lamDuocCoDieuKien && /^C\u00d3(?!\s*K\u1ef8)/i.test(lamDuocRaw);
          if (lamDuocThuan) pri += 20;
          else if (lamDuocCoDieuKien) pri += 10;
          if (n.mauSach && n.mauSach.length) pri += 10;
          if (ban === 0) pri += 10;
          if (n.xanh === true) pri += 10;
          pri = Math.max(0, Math.min(100, Math.round(pri)));
          /* FIX (uifix87) — truoc day: `const comp = Number(n.canhTranh) || 50;`
             n.canhTranh la VAN BAN do thi (vd. "bible explained 18/08: overall 75.6 · volume 89.8
             · competition 13.3 — THẤP") => Number() = NaN => ca 34/34 ngach roi ve 50 (mac dinh
             ma khong ai biet). Nay trich so sau chu "competition" bang DUNG logic frontend
             assets/app/tabs/content.js#nxCompShort (/competition\s*[:=]?\s*(\d+...)/gi, lay lan
             xuat hien CUOI cung). Khong co so => 50 + compSource='default' de con truy vet. */
          const compText = String(n.canhTranh || '');
          const compMatches = [...compText.matchAll(/competition\s*[:=]?\s*(\d+(?:\.\d+)?)/gi)];
          const compNum = compMatches.length ? Number(compMatches[compMatches.length - 1][1]) : NaN;
          const compMeasured = Number.isFinite(compNum);
          const comp = compMeasured ? Math.max(0, Math.min(100, compNum)) : 50;
          // BOI-like: green ocean = high SAI, mid/low competition proxy
          const boi = Math.max(0, Math.min(100, Math.round((sai * 0.55) + (pri * 0.25) + ((100 - comp) * 0.2))));
          return {
            ngach: n.ngach,
            xanh: n.xanh,
            hang: n.hang,
            rpm: n.rpm,
            thiTruong: n.thiTruong,
            SAI: sai,
            PRI: pri,
            BOI: boi,
            comp: comp,
            compSource: compMeasured ? 'measured' : 'default',
            lamDuocTier: lamDuocThuan ? 'CO' : (lamDuocCoDieuKien ? 'CO_DK' : 'KHAC'),
            cleanSamples: clean,
            banSamples: ban,
            skus: skus,
            nenLam: !!n.nenLam
          };
        }).sort((a, b) => (b.BOI - a.BOI) || (b.SAI - a.SAI));
        sendJson(req, res, 200, {
          schema: 'h2dev.niche-radar.v1',
          metrics: {
            SAI: 'Search Acquisition Index 0-100 ? demand/discoverability (rpm, keyword evidence, hang, xanh)',
            PRI: 'Production Readiness Index 0-100 ? mauSach/skus/lamDuoc/clean samples',
            BOI: 'Blue Ocean composite = 0.55*SAI + 0.25*PRI + 0.20*(100-comp)'
          },
          total: items.length,
          items
        }, isHead);
      } catch (e) {
        sendJson(req, res, 500, { error: String(e.message || e) }, isHead);
      }
      return;
    }
    sendJson(req, res, 405, { error: 'Method Not Allowed' }, isHead);
    return;
  }

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
    res.writeHead(403, withSecure({'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'}));
    res.end('Forbidden');
    return;
  }
  // Bảo vệ file database/secret binary ở thư mục data (không lộ dump toàn bộ DB qua web tĩnh).
  // Bao gồm cả các file phụ trợ của SQLite: -wal, -shm, -journal.
  if (/\.(db|sqlite|sqlite3)(-(wal|shm|journal))?$/i.test(baseName) || /^mcp-keys/i.test(baseName)) {
    res.writeHead(403, withSecure({'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'}));
    res.end('Forbidden');
    return;
  }

  /* H2DEV 2026-09-23 — CHAN /scripts/ QUA WEB (va lo hong nginx ~\\.(js|css)$ vi mo ta 404).
   *
   * VAN DE THAT (do duoc, khong doan):
   *   nginx vhost co 2 location theo thu tu:
   *     (a) location ~ .*\\.(js|css)?$   -> add_header no-cache + etag, KHONG proxy_pass
   *     (b) location /                   -> proxy_pass Node
   *   Regex (a) co '?' nen khop CA '/scripts/gate-icons.js' lan '/assets/app/main.js'.
   *   Voi '/assets/...' thi location ^~ /assets/ (trong extension/proxy.conf) THANG location regex
   *   (dung luat nginx: prefix ^~ duoc uu tien truoc regex) => di dung Node.
   *   Nhung '/scripts/...' KHONG co location ^~ => roi vao (a), nginx phuc vu TRUC TIEP tu
   *   disk qua root `/www/wwwroot/h2dev-learn.tonymmo.com` => file that nam o /app/scripts/
   *   nen request ra 404 (khoa huong dan anh bao: push xong van thay 404).
   *
   * CACH SUA (2 lop, phong thu theo chieu sau):
   *   1. Node: chan '/scripts/' + cac duong dan noi bo, tra 404 NGAY tai day
   *      => du sau nay co ai sua nginx, script noi bo cung khong bao gio lo ra Internet.
   *   2. nginx: them block 'location ^~ /scripts/ { return 404; }' truoc regex
   *      => chan tai tang bien, khong ton 1 byte bang thong.
   *
   * Ly do chan: /scripts/ chua script van hanh (build DB, sync, guard, gate) — cong cu noi bo,
   * khong phai tai san web. Phuc vu ra ngoai = lo logic van hanh + tang be mat tan cong.
   * Ghi chu: '/design-system/' la TAI LIEU CHUAN duoc phep phuc vu (da verify 200 OK).
   */
  const firstSeg = relSegs[0] ? relSegs[0].toLowerCase() : '';
  if (firstSeg === 'scripts' && !apiPath.startsWith('/api/')) {
    res.writeHead(404, withSecure({'Content-Type':'text/plain; charset=utf-8', 'X-Content-Type-Options':'nosniff'}));
    res.end('404 Not Found');
    return;
  }

  fs.stat(full, (err, st)=>{
    if(!err && st.isDirectory()){
      const idx = path.join(full, 'index.html');
      fs.stat(idx, (e2,s2)=>{
        if(!e2 && s2.isFile()) sendFile(req, res, idx, MIME['.html'], req.headers.range, isHead);
        else { res.writeHead(404, withSecure({'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*', 'X-Content-Type-Options':'nosniff'})); res.end('404 Not Found'); }
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
        else { res.writeHead(404, withSecure({'Content-Type':'text/plain', 'Access-Control-Allow-Origin':'*', 'X-Content-Type-Options':'nosniff'})); res.end('404: '+urlPath); }
      });
      return;
    }
    res.writeHead(404, withSecure({'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'}));
    res.end('404 Not Found: '+urlPath);
  });
});

server.listen(PORT, HOST, ()=>{
  console.log('H2DEV Project running at http://'+HOST+':'+PORT+'/');
  console.log('Root: '+ROOT);
  checkAndRotateAll();
  startAutoSyncWatcher(() => {
    GZIP_CACHE.clear();
  });
});

// Xử lý ngoại lệ an toàn, chống sập server và ghi vết lỗi
process.on('uncaughtException', (err) => {
  console.error('[H2DEV_UNCAUGHT_EXCEPTION]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[H2DEV_UNHANDLED_REJECTION]', reason);
});
