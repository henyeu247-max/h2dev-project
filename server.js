// H2DEV Project server - serves the project at http://0.0.0.0:8899/
// Toàn bộ dự án và tài liệu nghiên cứu mở 100%, không áp đặt cơ chế kiểm duyệt/chặn dữ liệu.
const _origEmitWarningServer = process.emitWarning;
process.emitWarning = function (w, ...rest) {
  if (String((w && w.message) || w).includes('SQLite is an experimental')) return;
  return _origEmitWarningServer.call(process, w, ...rest);
};
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('node:zlib');
const { initLogRotation, checkAndRotateAll } = require('./scripts/logrotate');
const { searchFts, mutateDatabase, query, queryOne } = require('./scripts/master_dal');
const { startAutoSyncWatcher, getSyncStatus, triggerSyncNow, ensureGraphFresh } = require('./scripts/kg_auto_sync');
const { traceNodeInDb, searchGraphInDb, listProjectsFromDb } = require('./scripts/kg_query');
const hotStore = require('./scripts/hot_memory_store');

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
const LIVE_EMBED_CSP = SECURE_HEADERS['Content-Security-Policy']
  .replace("script-src 'self'", "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.mona-cloud.com https://video.mona-cloud.com https://cdnjs.cloudflare.com")
  .replace("base-uri 'self'", "base-uri 'self' https://*.mona-cloud.com https://video.mona-cloud.com");
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
  '.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.plugin':'application/octet-stream',
};

const COMPRESSIBLE_EXTS = new Set([
  '.html', '.css', '.js', '.json', '.svg', '.csv', '.tsv', '.txt', '.srt', '.vtt', '.md'
]);

// In-memory RAM cache 2 tầng:
// 1. PINNED_CORE_CACHE: ghim cố định các file lõi (HTML, CSS, JS, data-tabs/*.json, overview_summary, music_stats) khi mtimeMs & size không đổi (tối đa 64 entries)
// 2. DYNAMIC_LRU_CACHE: tối đa 256 entries VÀ ngân sách bộ nhớ tối đa 64 MB (cập nhật thứ tự LRU khi get) cho video/*/transcript.json, video/*/insight.json, v.v.
const PINNED_CORE_CACHE = new Map();
const DYNAMIC_LRU_CACHE = new Map();
const INFLIGHT_GZIP = new Map();
const MAX_PINNED_ENTRIES = 64;
const MAX_PINNED_BYTES = 32 * 1024 * 1024;
const MAX_DYNAMIC_LRU_ENTRIES = 256;
const MAX_DYNAMIC_LRU_BYTES = 64 * 1024 * 1024;
let pinnedCacheBytes = 0;
let dynamicLruBytes = 0;

function normalizeCacheKey(fullPath) {
  const norm = path.resolve(fullPath).replace(/\\/g, '/');
  return process.platform === 'win32' ? norm.toLowerCase() : norm;
}

function isPinnedCoreFile(fullPath) {
  const rel = path.relative(ROOT, fullPath).replace(/\\/g, '/');
  if (rel === 'index.html' || rel === 'learn.html' || rel === 'player.html' || rel === 'graph.html') return true;
  if (rel === 'assets/tailwind.css' || rel === 'assets/styles.css') return true;
  if (/^assets\/(?:app\/)?[^/]+\.css$/i.test(rel)) return true;
  if (/^assets\/(?:app\/(?:tabs\/)?[^/]+|[^/]+)\.js$/i.test(rel)) return true;
  if (/^data-tabs\/[^/]+\.json$/i.test(rel)) return true;
  if (rel === 'data/overview_summary.json' || rel === 'data/music_stats.json') return true;
  return false;
}

function getGzipCache(fullPath, currentMtimeMs, currentSize) {
  const key = normalizeCacheKey(fullPath);
  const pinned = PINNED_CORE_CACHE.get(key);
  if (pinned) {
    if (pinned.mtimeMs === currentMtimeMs && pinned.size === currentSize) {
      PINNED_CORE_CACHE.delete(key);
      PINNED_CORE_CACHE.set(key, pinned);
      return pinned;
    }
    pinnedCacheBytes = Math.max(0, pinnedCacheBytes - (pinned.buffer ? pinned.buffer.length : 0));
    PINNED_CORE_CACHE.delete(key);
  }
  const dyn = DYNAMIC_LRU_CACHE.get(key);
  if (dyn) {
    if (dyn.mtimeMs === currentMtimeMs && dyn.size === currentSize) {
      DYNAMIC_LRU_CACHE.delete(key);
      DYNAMIC_LRU_CACHE.set(key, dyn);
      return dyn;
    }
    dynamicLruBytes = Math.max(0, dynamicLruBytes - (dyn.buffer ? dyn.buffer.length : 0));
    DYNAMIC_LRU_CACHE.delete(key);
  }
  return null;
}

function setGzipCache(fullPath, entry) {
  const key = normalizeCacheKey(fullPath);
  const bufLen = entry && entry.buffer ? entry.buffer.length : 0;
  const stored = Object.assign({ fullPath }, entry);
  if (isPinnedCoreFile(fullPath) && bufLen <= MAX_PINNED_BYTES) {
    if (PINNED_CORE_CACHE.has(key)) {
      const prev = PINNED_CORE_CACHE.get(key);
      pinnedCacheBytes = Math.max(0, pinnedCacheBytes - (prev && prev.buffer ? prev.buffer.length : 0));
      PINNED_CORE_CACHE.delete(key);
    }
    while (PINNED_CORE_CACHE.size >= MAX_PINNED_ENTRIES || (pinnedCacheBytes + bufLen > MAX_PINNED_BYTES && PINNED_CORE_CACHE.size > 0)) {
      const oldestPinned = PINNED_CORE_CACHE.keys().next().value;
      if (oldestPinned === undefined) break;
      const oldEntry = PINNED_CORE_CACHE.get(oldestPinned);
      pinnedCacheBytes = Math.max(0, pinnedCacheBytes - (oldEntry && oldEntry.buffer ? oldEntry.buffer.length : 0));
      PINNED_CORE_CACHE.delete(oldestPinned);
    }
    PINNED_CORE_CACHE.set(key, stored);
    pinnedCacheBytes += bufLen;
    return;
  }
  if (bufLen > MAX_DYNAMIC_LRU_BYTES) return;
  if (DYNAMIC_LRU_CACHE.has(key)) {
    const prev = DYNAMIC_LRU_CACHE.get(key);
    dynamicLruBytes = Math.max(0, dynamicLruBytes - (prev && prev.buffer ? prev.buffer.length : 0));
    DYNAMIC_LRU_CACHE.delete(key);
  }
  while (DYNAMIC_LRU_CACHE.size >= MAX_DYNAMIC_LRU_ENTRIES || (dynamicLruBytes + bufLen > MAX_DYNAMIC_LRU_BYTES && DYNAMIC_LRU_CACHE.size > 0)) {
    const oldestKey = DYNAMIC_LRU_CACHE.keys().next().value;
    if (oldestKey === undefined) break;
    const oldEntry = DYNAMIC_LRU_CACHE.get(oldestKey);
    dynamicLruBytes = Math.max(0, dynamicLruBytes - (oldEntry && oldEntry.buffer ? oldEntry.buffer.length : 0));
    DYNAMIC_LRU_CACHE.delete(oldestKey);
  }
  DYNAMIC_LRU_CACHE.set(key, stored);
  dynamicLruBytes += bufLen;
}

function refreshCachesOnDataSync() {
  DGMD_EMBED_CACHE.clear();
  try {
    hotStore.reloadHotStore();
  } catch (err) {
    console.error('[HotStore] reload error:', err && err.message ? err.message : err);
  }
  for (const [key, cached] of PINNED_CORE_CACHE.entries()) {
    try {
      const st = fs.statSync(cached.fullPath || key);
      if (st.mtimeMs !== cached.mtimeMs || st.size !== cached.size) {
        pinnedCacheBytes = Math.max(0, pinnedCacheBytes - (cached.buffer ? cached.buffer.length : 0));
        PINNED_CORE_CACHE.delete(key);
      }
    } catch (_) {
      pinnedCacheBytes = Math.max(0, pinnedCacheBytes - (cached.buffer ? cached.buffer.length : 0));
      PINNED_CORE_CACHE.delete(key);
    }
  }
  for (const [key, cached] of DYNAMIC_LRU_CACHE.entries()) {
    if (String(key).endsWith('.json')) {
      try {
        const st = fs.statSync(cached.fullPath || key);
        if (st.mtimeMs !== cached.mtimeMs || st.size !== cached.size) {
          dynamicLruBytes = Math.max(0, dynamicLruBytes - (cached.buffer ? cached.buffer.length : 0));
          DYNAMIC_LRU_CACHE.delete(key);
        }
      } catch (_) {
        dynamicLruBytes = Math.max(0, dynamicLruBytes - (cached.buffer ? cached.buffer.length : 0));
        DYNAMIC_LRU_CACHE.delete(key);
      }
    }
  }
}

// So sánh ETag chuẩn RFC 9110 hỗ trợ dấu phẩy, wildcard '*' và hậu tố Cloudflare -gzip
function matchEtag(clientHeader, serverEtag) {
  if (!clientHeader || !serverEtag) return false;
  if (clientHeader.trim() === '*') return true;
  const cleanServer = serverEtag.replace(/^W\//, '').replace(/"/g, '').trim().replace(/-gzip$/i, '');
  const clientList = clientHeader.split(',').map(s => s.replace(/^W\//, '').replace(/"/g, '').trim().replace(/-gzip$/i, ''));
  return clientList.some(c => c === cleanServer || c === '*');
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
      stream.on('error', () => { stream.destroy(); res.destroy(); });
      res.on('close', () => { try { stream.destroy(); } catch (_) {} });
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
      // Fast path: In-memory Gzip buffer cache cho files < 5MB (trả về trong 0.1ms) kèm In-Flight Dedupe chống Cache Stampede
      if (total < 5 * 1024 * 1024) {
        const cached = getGzipCache(full, st.mtimeMs, st.size);
        if (cached) {
          headers['Content-Length'] = cached.buffer.length;
          res.writeHead(200, headers);
          if (isHead) { res.end(); return; }
          res.end(cached.buffer);
          return;
        }
        const inflightKey = `${normalizeCacheKey(full)}:${st.mtimeMs}:${st.size}`;
        let p = INFLIGHT_GZIP.get(inflightKey);
        if (!p) {
          p = new Promise((resolve, reject) => {
            fs.readFile(full, (readErr, rawBuf) => {
              if (readErr) return reject(readErr);
              zlib.gzip(rawBuf, { level: 6 }, (gzErr, gzBuf) => {
                if (gzErr) return reject(gzErr);
                setGzipCache(full, { mtimeMs: st.mtimeMs, size: st.size, buffer: gzBuf });
                resolve(gzBuf);
              });
            });
          });
          INFLIGHT_GZIP.set(inflightKey, p);
          p.finally(() => INFLIGHT_GZIP.delete(inflightKey)).catch(() => {});
        }
        p.then((gzBuf) => {
          if (res.headersSent) return;
          headers['Content-Length'] = gzBuf.length;
          res.writeHead(200, headers);
          if (isHead) { res.end(); return; }
          res.end(gzBuf);
        }).catch(() => {
          if (!res.headersSent) { res.writeHead(500); res.end('Gzip/Read Error'); }
        });
        return;
      }
      res.writeHead(200, headers);
      if (isHead) { res.end(); return; }
      const rawStream = fs.createReadStream(full);
      const gz = zlib.createGzip({ level: 6 });
      const onStreamError = () => { rawStream.destroy(); gz.destroy(); res.destroy(); };
      rawStream.on('error', onStreamError);
      gz.on('error', onStreamError);
      res.on('close', () => { try { rawStream.destroy(); gz.destroy(); } catch (_) {} });
      rawStream.pipe(gz).pipe(res);
    } else {
      headers['Accept-Ranges'] = 'bytes';
      headers['Content-Length'] = total;
      res.writeHead(200, headers);
      if (isHead) { res.end(); return; }
      const stream = fs.createReadStream(full);
      stream.on('error', () => { stream.destroy(); res.destroy(); });
      res.on('close', () => { try { stream.destroy(); } catch (_) {} });
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
  const canGzip = !isHead && acceptEncoding.includes('gzip');

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
    zlib.gzip(buf, { level: 6 }, (err, gzipped) => {
      if (res.destroyed || res.writableEnded) return;
      if (!err) headers['Content-Encoding'] = 'gzip';
      const payload = err ? buf : gzipped;
      headers['Content-Length'] = payload.length;
      res.writeHead(status, headers);
      res.end(payload);
    });
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
    return fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
      headers: {
        'Referer': originUrl || 'https://daigiamangdep.com/learn/study/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8'
      }
    }).then((res) => {
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        const nextUrl = new URL(res.headers.get('location'), url).toString();
        return get(nextUrl, redirectsLeft - 1);
      }
      if (res.status !== 200) {
        throw new Error(`Mona Cloud phản hồi mã lỗi ${res.status}`);
      }
      return res.text().then((html) => {
        if (!/<(?:!doctype\s+html|html|head|body)\b/i.test(html)) {
          throw new Error('Mona Cloud returned invalid HTML');
        }
        return html;
      });
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
          refreshCachesOnDataSync();
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
        refreshCachesOnDataSync();
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
  if (apiPath === '/api/overview-summary') {
    if (req.method === 'GET' || isHead) {
      try {
        sendJson(req, res, 200, hotStore.getOverviewSummary(), isHead);
      } catch (err) {
        sendJson(req, res, 500, { error: err.message }, isHead);
      }
      return;
    }
    sendJson(req, res, 405, { error: 'Method Not Allowed' }, false, { 'Allow': 'GET, HEAD, OPTIONS' });
    return;
  }
  if (apiPath === '/api/player/bootstrap') {
    if (req.method === 'GET' || isHead) {
      const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || '127.0.0.1'));
      const sku = (parsedUrl.searchParams.get('sku') || '').trim();
      if (!sku) {
        sendJson(req, res, 400, { error: 'Missing sku parameter' }, isHead);
        return;
      }
      const bootstrap = hotStore.getPlayerBootstrap(sku);
      if (!bootstrap) {
        sendJson(req, res, 404, { error: 'SKU not found', sku }, isHead);
        return;
      }
      sendJson(req, res, 200, bootstrap, isHead);
      return;
    }
    sendJson(req, res, 405, { error: 'Method Not Allowed' }, false, { 'Allow': 'GET, HEAD, OPTIONS' });
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
        const item = hotStore.getDgmdItemBySku(sku);
        if (!item || !item.file) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(isHead ? undefined : 'Video not found in DGMD catalog');
          return;
        }

        const now = Date.now();
        const cacheKey = 'embed:' + item.sku.toUpperCase();
        const cached = DGMD_EMBED_CACHE.get(cacheKey);
        if (cached && (now - cached.ts < 10 * 60 * 1000)) {
          res.writeHead(200, withSecure({
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
            'X-Frame-Options': 'SAMEORIGIN'
          }));
          res.end(isHead ? undefined : cached.html);
          return;
        }

        const html = await fetchMonaEmbedHtml(item.file, item.origin);
        DGMD_EMBED_CACHE.set(cacheKey, { html, ts: now });

        res.writeHead(200, withSecure({
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Frame-Options': 'SAMEORIGIN'
        }));
        res.end(isHead ? undefined : html);
        return;
      } catch (err) {
        res.writeHead(502, withSecure({ 'Content-Type': 'text/plain; charset=utf-8' }));
        res.end(isHead ? undefined : `Proxy error: ${err.message}`);
        return;
      }
    }
    sendJson(req, res, 405, { error: 'Method Not Allowed' }, false, { 'Allow': 'GET, HEAD, OPTIONS' });
    return;
  }
  if (apiPath === '/api/intelligence/breakouts') {
    if (req.method === 'GET' || isHead) {
      try {
        const kgQuery = require('./scripts/kg_query');
        if (typeof kgQuery.queryIntelligenceBreakouts === 'function') {
          sendJson(req, res, 200, kgQuery.queryIntelligenceBreakouts(30), isHead);
          return;
        }
      } catch (_) {}
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
            const kenhHandles = hotStore.getKenhHandleSet();
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
            const { list: jsonList, byNameMap } = hotStore.getTaiLieuIndexMap();
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
                else if (byNameMap && byNameMap.has(String(d.name))) ji = byNameMap.get(String(d.name));
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
  if (apiPath.startsWith('/live/')) {
    if (req.method === 'GET' || isHead) {
      const sku = apiPath.replace('/live/', '').trim();
      if (/^VIDEO-[A-Za-z0-9]+$/i.test(sku)) {
        try {
          const cacheKey = 'live:' + sku.toUpperCase();
          const now = Date.now();
          const cached = DGMD_EMBED_CACHE.get(cacheKey);
          if (cached && (now - cached.ts < 10 * 60 * 1000)) {
            res.writeHead(200, withSecure({
              'Content-Type': 'text/html; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Content-Security-Policy': LIVE_EMBED_CSP
            }));
            res.end(isHead ? undefined : cached.html);
            return;
          }

          const { getLivePlayerUrl } = require('./scripts/live_player_resolver');
          const liveInfo = await getLivePlayerUrl(sku);
          const liveUrl = (typeof liveInfo === 'object' && liveInfo) ? liveInfo.url : liveInfo;
          const ref = (typeof liveInfo === 'object' && liveInfo) ? liveInfo.referer : 'https://h2dev.vn/';
          if (liveUrl) {
            const monaRes = await fetch(liveUrl, {
              signal: AbortSignal.timeout(5000),
              headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131',
                'Referer': ref
              }
            });
            if (monaRes.status !== 200) throw new Error(`Mona Cloud response ${monaRes.status}`);
            let html = await monaRes.text();
            if (!/<(?:!doctype\s+html|html|head|body)\b/i.test(html)) {
              throw new Error('Mona Cloud returned invalid HTML');
            }
            const liveInjection = '<base href="https://video.mona-cloud.com/"><meta name="referrer" content="no-referrer">';
            if (html.includes('<head>')) {
              html = html.replace('<head>', '<head>' + liveInjection);
            } else {
              html = liveInjection + html;
            }
            DGMD_EMBED_CACHE.set(cacheKey, { html, ts: now });
            res.writeHead(200, withSecure({
              'Content-Type': 'text/html; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Content-Security-Policy': LIVE_EMBED_CSP
            }));
            res.end(isHead ? undefined : html);
            return;
          } else {
            res.writeHead(404, withSecure({ 'Content-Type': 'text/plain; charset=utf-8' }));
            res.end(isHead ? undefined : `Không tìm thấy luồng phát trực tiếp cho SKU ${sku}`);
            return;
          }
        } catch (err) {
          res.writeHead(502, withSecure({ 'Content-Type': 'text/plain; charset=utf-8' }));
          res.end(isHead ? undefined : `Lỗi kết nối máy chủ nguồn: ${err.message}`);
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
      // --- 1.3. Validate SKU: chi cho phep SKU co that trong catalog (O(1) RAM lookup) ---
      const isValidSku = hotStore.isValidSku(sku);
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
  } else if (/^\/(?:tatca|video|ngach|ngachxanh|tai-lieu|nhac|nguonreup|kenh-mau|rawkenh|chienluoc|sodo)\/?$/i.test(urlPath)) {
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
        sendJson(req, res, 200, hotStore.getNicheRadarResponse(), isHead);
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
  if (firstSeg === 'scripts') {
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
    refreshCachesOnDataSync();
  });
});

// Xử lý ngoại lệ an toàn, chống sập server và ghi vết lỗi
process.on('uncaughtException', (err) => {
  console.error('[H2DEV_UNCAUGHT_EXCEPTION]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[H2DEV_UNHANDLED_REJECTION]', reason);
});
