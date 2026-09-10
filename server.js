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
    };
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
function writeAdminState(state){
  fs.mkdirSync(path.dirname(ADMIN_STATE), {recursive:true});
  fs.writeFileSync(ADMIN_STATE, JSON.stringify(state, null, 2), 'utf8');
}
function sendJson(res, status, value){
  const body=JSON.stringify(value);
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-store'});
  res.end(body);
}
function readBody(req){
  return new Promise((resolve,reject)=>{
    let body='';
    req.on('data', chunk=>{ body+=chunk; if(body.length>5*1024*1024) reject(new Error('payload too large')); });
    req.on('end', ()=>{ try { resolve(body ? JSON.parse(body) : {}); } catch(e){ reject(e); } });
    req.on('error', reject);
  });
}
const server = http.createServer(async (req,res)=>{
  if(req.method === 'OPTIONS'){
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    });
    res.end();
    return;
  }
  const isHead = (req.method === 'HEAD');
  const apiPath = req.url.split('?')[0];
  if (apiPath === '/api/admin-state') {
    if (req.method === 'GET') { sendJson(res, 200, readAdminState()); return; }
    if (req.method === 'PUT' || req.method === 'POST') {
      try {
        const incoming = await readBody(req);
        const current = readAdminState();
        const next = {
          role: 'admin', version: 1, updatedAt: Date.now(),
          watched: incoming.watched && typeof incoming.watched === 'object' ? incoming.watched : current.watched,
          favorites: Array.isArray(incoming.favorites) ? incoming.favorites : current.favorites,
          recent: incoming.recent && typeof incoming.recent === 'object' ? incoming.recent : current.recent
        };
        writeAdminState(next); sendJson(res, 200, next);
      } catch (e) { sendJson(res, 400, {error: e.message}); }
      return;
    }
    sendJson(res, 405, {error:'Method Not Allowed'}); return;
  }
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (error) {
    res.writeHead(400, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
    res.end('400 Bad Request: malformed URL encoding');
    return;
  }
  if(urlPath === '/') urlPath = '/index.html';
  let full = path.resolve(ROOT, '.'+urlPath);
  const relative = path.relative(ROOT, full);
  if(relative === '..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative)){
    res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
    res.end('Forbidden');
    return;
  }
  const BLOCKED = new Set(['_backup', '_private', '_audit', 'node_modules', 'inbox', '_verify', '.git', '_archive', 'raw-kenh-goc', 'DESIGN-IS-2026-08-22', '_drafts', 'raw-niches']);
  const parts = relative.split(path.sep);
  const base = parts[parts.length - 1] || '';
  if (parts.some(p => BLOCKED.has(p)) || /^\.env($|\.)/i.test(base) || /mcp-keys/i.test(base)) {
    res.writeHead(403, {'Content-Type':'text/plain; charset=utf-8', 'Access-Control-Allow-Origin':'*'});
    res.end('Forbidden');
    return;
  }
  fs.stat(full, (err, st)=>{
    if(!err && st.isDirectory()){
      const idx = path.join(full, 'index.html');
      fs.stat(idx, (e2,s2)=>{
        if(!e2 && s2.isFile()) sendFile(res, idx, MIME['.html'], req.headers.range, isHead);
        else { res.writeHead(200,{'Content-Type':'text/html; charset=utf-8', 'Access-Control-Allow-Origin':'*'}); res.end('<h3>Index of '+urlPath+'</h3>'); }
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
        else { res.writeHead(404,{'Content-Type':'text/plain', 'Access-Control-Allow-Origin':'*'}); res.end('404: '+urlPath); }
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
