'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const COOKIE_NAME = '_97yo_auth';
const AUTH_LOGIN_VER = '20261126-uifix110';
const TTL_SEC = 30 * 24 * 60 * 60; // 30 days
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILS = 5;
const MAX_FAIL_MAP_SIZE = 2048;
const MAX_BODY_BYTES = 8192;

let envLoaded = false;
function loadEnvOnce() {
  if (envLoaded) return;
  envLoaded = true;
  try {
    if (fs.existsSync(ENV_PATH) && typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(ENV_PATH);
    }
  } catch (_) {}
}
loadEnvOnce();

let ephemeralSecret = '';
function getAccessPassword() {
  return String(process.env.ACCESS_PASSWORD || '');
}
function isEnabled() {
  return getAccessPassword().length > 0;
}
function getTokenVersion() {
  return String(process.env.AUTH_TOKEN_VERSION || '1').trim() || '1';
}
function getAuthSecret() {
  const s = String(process.env.AUTH_SECRET || '');
  if (s.length >= 32) return s;
  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomBytes(32).toString('hex');
  }
  return ephemeralSecret;
}

const failMap = new Map();

function pruneFailMap(now) {
  if (failMap.size > 1024) {
    for (const [ip, rec] of failMap.entries()) {
      if (!rec || now - rec.firstAt > WINDOW_MS) {
        failMap.delete(ip);
      }
    }
  }
  while (failMap.size >= MAX_FAIL_MAP_SIZE) {
    const oldestIp = failMap.keys().next().value;
    if (oldestIp === undefined) break;
    failMap.delete(oldestIp);
  }
}

function isLoopbackIp(ip) {
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

function clientIp(req) {
  const remote = (req && req.socket && req.socket.remoteAddress) ? String(req.socket.remoteAddress) : '';
  if (isLoopbackIp(remote) && req && req.headers) {
    const cf = req.headers['cf-connecting-ip'];
    if (typeof cf === 'string' && cf.trim()) return cf.trim();
    const real = req.headers['x-real-ip'];
    if (typeof real === 'string' && real.trim()) return real.trim();
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) {
      const first = xff.split(',')[0].trim();
      if (first) return first;
    }
  }
  return remote || 'unknown';
}

function isRateLimited(ip, now = Date.now()) {
  const rec = failMap.get(ip);
  if (!rec) return { limited: false, retryAfterSec: 0 };
  if (now - rec.firstAt > WINDOW_MS) {
    failMap.delete(ip);
    return { limited: false, retryAfterSec: 0 };
  }
  if (rec.count >= MAX_FAILS) {
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - rec.firstAt)) / 1000));
    return { limited: true, retryAfterSec };
  }
  return { limited: false, retryAfterSec: 0 };
}

function recordFail(ip, now = Date.now()) {
  const existing = failMap.get(ip);
  if (!existing || now - existing.firstAt > WINDOW_MS) {
    if (existing) failMap.delete(ip);
    pruneFailMap(now);
    failMap.set(ip, { count: 1, firstAt: now });
  } else {
    failMap.delete(ip);
    failMap.set(ip, { count: existing.count + 1, firstAt: existing.firstAt });
  }
}

function clearFail(ip) {
  failMap.delete(ip);
}

function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function safeNext(raw) {
  if (typeof raw !== 'string') return '/';
  const val = raw.trim();
  if (!val || val.length > 512) return '/';
  if (/[\x00-\x1f\x7f\\]/.test(val)) return '/';
  if (!val.startsWith('/') || val.startsWith('//') || val.startsWith('/\\')) return '/';
  try {
    const u = new URL(val, 'http://localhost');
    if (u.origin !== 'http://localhost') return '/';
    const p = u.pathname;
    if (!p.startsWith('/') || p.startsWith('//')) return '/';
    if (/^\/(?:login|logout)(?:\/|$)/i.test(p)) return '/';
    if (/^\/api(?:\/|$)/i.test(p)) return '/';
    return u.pathname + u.search + u.hash;
  } catch (_) {
    return '/';
  }
}

function signToken(tsSec) {
  const ver = getTokenVersion();
  const payload = `${ver}.${tsSec}`;
  const hmac = crypto.createHmac('sha256', getAuthSecret()).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

function parseCookies(req) {
  const out = {};
  const raw = req && req.headers ? req.headers.cookie : '';
  if (typeof raw !== 'string' || !raw) return out;
  const parts = raw.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k && !Object.prototype.hasOwnProperty.call(out, k)) {
      out[k] = v;
    }
  }
  return out;
}

function verifyToken(token, nowSec = Math.floor(Date.now() / 1000)) {
  if (typeof token !== 'string') return false;
  const trimmed = token.trim();
  const curVer = getTokenVersion();
  const m3 = /^([^.\s]{1,32})\.(\d{1,12})\.([0-9a-f]{64})$/i.exec(trimmed);
  if (m3) {
    const [, ver, tsStr, sigHex] = m3;
    if (ver !== curVer) return false;
    const ts = parseInt(tsStr, 10);
    if (!Number.isFinite(ts)) return false;
    const age = nowSec - ts;
    if (age < 0 || age > TTL_SEC) return false;
    const expected = crypto.createHmac('sha256', getAuthSecret()).update(`${ver}.${tsStr}`).digest('hex');
    const gotBuf = Buffer.from(sigHex.toLowerCase(), 'utf8');
    const expBuf = Buffer.from(expected.toLowerCase(), 'utf8');
    if (gotBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(gotBuf, expBuf);
  }
  const m2 = /^(\d{1,12})\.([0-9a-f]{64})$/i.exec(trimmed);
  if (m2 && curVer === '1') {
    const ts = parseInt(m2[1], 10);
    if (!Number.isFinite(ts)) return false;
    const age = nowSec - ts;
    if (age < 0 || age > TTL_SEC) return false;
    const expected = crypto.createHmac('sha256', getAuthSecret()).update(m2[1]).digest('hex');
    const gotBuf = Buffer.from(m2[2].toLowerCase(), 'utf8');
    const expBuf = Buffer.from(expected.toLowerCase(), 'utf8');
    if (gotBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(gotBuf, expBuf);
  }
  return false;
}

function isAuthenticated(req) {
  const cookies = parseCookies(req);
  return verifyToken(cookies[COOKIE_NAME]);
}

function verifyPassword(inputPw) {
  const target = getAccessPassword();
  if (!target || typeof inputPw !== 'string') return false;
  const h1 = crypto.createHash('sha256').update(inputPw, 'utf8').digest();
  const h2 = crypto.createHash('sha256').update(target, 'utf8').digest();
  return crypto.timingSafeEqual(h1, h2);
}

function isHttpsRequest(req) {
  const xfp = req && req.headers ? String(req.headers['x-forwarded-proto'] || '') : '';
  const proto = xfp.split(',')[0].trim().toLowerCase();
  if (proto === 'https') return true;
  return Boolean(req && req.socket && req.socket.encrypted);
}

function buildAuthCookieHeader(value, maxAgeSec, req) {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${maxAgeSec}`,
    'SameSite=Lax'
  ];
  if (isHttpsRequest(req)) parts.push('Secure');
  return parts.join('; ');
}

function loginPage(next, error) {
  const cleanNext = safeNext(next || '/');
  const cleanErr = String(error || '');
  return `<!DOCTYPE html>
<html lang="vi" data-theme="dark" style="color-scheme: dark;">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>Đăng nhập — 97yo-dev Studio</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #050505; color: #f4f4f5; font-family: Inter, system-ui, -apple-system, sans-serif;
    padding: 20px;
  }
  .card {
    width: 100%; max-width: 390px; background: #0f0f0f; border: 1px solid #222;
    border-radius: 16px; padding: 28px 24px; box-shadow: 0 24px 48px rgba(0,0,0,0.65);
  }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
  @keyframes dotPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 12px rgba(226,2,58,0.8); }
    50% { transform: scale(1.22); box-shadow: 0 0 18px rgba(226,2,58,1); }
  }
  .dot {
    width: 12px; height: 12px; border-radius: 50%; background: #E2023A;
    box-shadow: 0 0 12px rgba(226,2,58,0.8); animation: dotPulse 2s ease-in-out infinite;
  }
  .title { font-size: 18px; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
  .sub { font-size: 13px; color: #9ca3af; margin: 0 0 20px 0; line-height: 1.5; }
  label { display: block; font-size: 12px; font-weight: 600; color: #d1d5db; margin-bottom: 6px; }
  .pw-wrap { position: relative; margin-bottom: 14px; }
  input[type="password"], input[type="text"] {
    width: 100%; padding: 11px 44px 11px 12px; border-radius: 10px; border: 1px solid #222;
    background: #050505; color: #fff; font-size: 14px; outline: none; transition: border-color 120ms ease;
  }
  input:focus { border-color: #E2023A; }
  .eye-btn {
    position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
    background: transparent; border: 0; color: #9ca3af; cursor: pointer;
    padding: 6px 8px; border-radius: 8px; font-size: 12px; font-weight: 600;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .eye-btn:hover { color: #fff; background: rgba(255,255,255,0.06); }
  @keyframes authShake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-4px); }
    50% { transform: translateX(4px); }
    80% { transform: translateX(-2px); }
  }
  .card.is-shaking { animation: authShake 260ms ease; }
  .err {
    margin-bottom: 14px; padding: 10px 12px; border-radius: 10px; font-size: 13px;
    background: rgba(226,2,58,0.12); border: 1px solid rgba(226,2,58,0.45); color: #fda4af;
  }
  .err[hidden] { display: none; }
  .submit-btn {
    width: 100%; padding: 11px 16px; border: 0; border-radius: 10px; cursor: pointer;
    background: #E2023A; color: #fff; font-size: 14px; font-weight: 700;
    transition: background-color 120ms ease, transform 120ms ease;
  }
  .submit-btn:hover { background: #c90233; }
  .submit-btn:active { transform: scale(0.98); }
  .submit-btn:disabled { opacity: 0.6; cursor: wait; }
  @media (prefers-reduced-motion: reduce) {
    .dot, .card.is-shaking { animation: none !important; }
    .submit-btn, input { transition: none !important; }
  }
</style>
</head>
<body>
  <main class="card" id="loginCard">
    <div class="brand">
      <span class="dot" aria-hidden="true"></span>
      <h1 class="title">97yo-dev Studio</h1>
    </div>
    <p class="sub">Khu vực nội bộ. Nhập mật khẩu truy cập để tiếp tục.</p>
    <form id="loginForm" method="POST" action="/login" data-next="${escHtml(cleanNext)}" data-err="${escHtml(cleanErr)}">
      <input type="hidden" name="redirect" id="redir" value="${escHtml(cleanNext)}">
      <label for="pw">Mật khẩu truy cập</label>
      <div class="pw-wrap">
        <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus>
        <button id="eye" type="button" class="eye-btn" aria-label="Hiện mật khẩu" aria-pressed="false"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></button>
      </div>
      <div id="errBox" class="err" role="alert"${cleanErr ? '' : ' hidden'}>${escHtml(cleanErr)}</div>
      <button id="submitBtn" type="submit" class="submit-btn">Đăng nhập</button>
    </form>
  </main>
  <script src="/assets/auth-login.js?v=${AUTH_LOGIN_VER}" defer></script>
</body>
</html>`;
}

function readBody(req, maxBytes = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;
    req.on('data', (chunk) => {
      if (settled) return;
      total += chunk.length;
      if (total > maxBytes) {
        settled = true;
        const err = new Error('Payload Too Large');
        err.statusCode = 413;
        reject(err);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

function parseFormBody(raw) {
  const out = {};
  if (!raw) return out;
  for (const pair of raw.split('&')) {
    if (!pair) continue;
    const i = pair.indexOf('=');
    const rawKey = i > 0 ? pair.slice(0, i) : pair;
    const rawVal = i >= 0 ? pair.slice(i + 1) : '';
    const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
    const val = decodeURIComponent(rawVal.replace(/\+/g, ' '));
    out[key] = val;
  }
  return out;
}

const STATIC_EXT_RE = /\.(?:js|mjs|css|json|mp4|webm|mp3|wav|png|jpg|jpeg|svg|webp|gif|ico|woff|woff2|ttf|pdf|srt|vtt|txt|md|csv|tsv|zip|xlsx|docx|pptx)$/i;

function shouldReturn401Plain(apiPath, req) {
  const low = String(apiPath || '').toLowerCase();
  if (
    low === '/sw.js' ||
    low === '/assets/app/sw.js' ||
    low.startsWith('/api/') ||
    low.startsWith('/video/') ||
    low.startsWith('/data/') ||
    low.startsWith('/data-tabs/') ||
    low.startsWith('/live/')
  ) {
    return true;
  }
  if (STATIC_EXT_RE.test(low)) return true;
  const accept = String((req && req.headers && req.headers.accept) || '').toLowerCase();
  if (!accept.includes('text/html')) return true;
  return false;
}

function wantsJsonResponse(req) {
  const ct = String((req && req.headers && req.headers['content-type']) || '').toLowerCase();
  const accept = String((req && req.headers && req.headers.accept) || '').toLowerCase();
  return ct.includes('application/json') || accept.includes('application/json');
}

function sendLoginHtml(res, status, html, withSecure, getCorsHeaders, req, extra = {}) {
  const hdrs = withSecure({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, private',
    'X-Auth-Required': '1',
    'X-Robots-Tag': 'noindex',
    ...getCorsHeaders(req),
    ...extra
  });
  res.writeHead(status, hdrs);
  res.end(req.method === 'HEAD' ? undefined : html);
}

function handle(req, res, ctx) {
  const { apiPath, isHead, withSecure, sendJson, getCorsHeaders } = ctx;
  const enabled = isEnabled();

  if (apiPath === '/api/auth/status' && (req.method === 'GET' || isHead)) {
    const authed = enabled ? isAuthenticated(req) : true;
    sendJson(req, res, 200, { enabled, authenticated: authed }, isHead, { 'Cache-Control': 'no-store' });
    return true;
  }

  if (!enabled) return false;

  if (apiPath === '/assets/auth-login.js' && (req.method === 'GET' || isHead)) {
    return false; // Let server.js serve static file cleanly
  }

  if (apiPath === '/logout' || apiPath === '/logout/') {
    if (req.method !== 'POST') {
      sendJson(req, res, 405, { error: 'Method Not Allowed' }, isHead, {
        'Allow': 'POST',
        'Cache-Control': 'no-store'
      });
      return true;
    }
    const clearCookie = buildAuthCookieHeader('', 0, req);
    if (req.method === 'POST' && wantsJsonResponse(req)) {
      sendJson(req, res, 200, { ok: true, redirect: '/login' }, false, {
        'Set-Cookie': clearCookie,
        'Cache-Control': 'no-store, private'
      });
      return true;
    }
    res.writeHead(302, withSecure({
      'Location': '/login',
      'Set-Cookie': clearCookie,
      'Cache-Control': 'no-store, private',
      ...getCorsHeaders(req)
    }));
    res.end(isHead ? undefined : 'Redirecting to /login');
    return true;
  }

  if (apiPath === '/login' || apiPath === '/login/') {
    let queryNext = '/';
    try {
      const u = new URL(req.url || '/login', 'http://localhost');
      queryNext = safeNext(u.searchParams.get('next') || u.searchParams.get('redirect') || '/');
    } catch (_) {}

    if (req.method === 'GET' || isHead) {
      if (isAuthenticated(req)) {
        res.writeHead(302, withSecure({
          'Location': queryNext,
          'Cache-Control': 'no-store, private',
          ...getCorsHeaders(req)
        }));
        res.end(isHead ? undefined : '');
        return true;
      }
      sendLoginHtml(res, 200, loginPage(queryNext, ''), withSecure, getCorsHeaders, req);
      return true;
    }

    if (req.method === 'POST') {
      const ip = clientIp(req);
      const rl = isRateLimited(ip);
      const jsonMode = wantsJsonResponse(req);
      if (rl.limited) {
        const msg = `Quá nhiều lần thử sai. Vui lòng thử lại sau ${Math.ceil(rl.retryAfterSec / 60)} phút.`;
        if (jsonMode) {
          sendJson(req, res, 429, { ok: false, error: msg }, false, {
            'Retry-After': String(rl.retryAfterSec),
            'Cache-Control': 'no-store'
          });
        } else {
          sendLoginHtml(res, 429, loginPage(queryNext, msg), withSecure, getCorsHeaders, req, {
            'Retry-After': String(rl.retryAfterSec)
          });
        }
        return true;
      }

      readBody(req).then((raw) => {
        let fields;
        const ct = String(req.headers['content-type'] || '').toLowerCase();
        try {
          if (ct.includes('application/json')) {
            const parsed = JSON.parse(raw || '{}');
            fields = (parsed && typeof parsed === 'object') ? parsed : {};
          } else {
            fields = parseFormBody(raw);
          }
        } catch (parseErr) {
          if (jsonMode) {
            sendJson(req, res, 400, { ok: false, error: 'Malformed request body' }, false, { 'Cache-Control': 'no-store' });
          } else {
            sendLoginHtml(res, 400, loginPage(queryNext, 'Yêu cầu không hợp lệ.'), withSecure, getCorsHeaders, req);
          }
          return;
        }

        const nextTarget = safeNext(fields.redirect || fields.next || queryNext);
        const password = typeof fields.password === 'string' ? fields.password : '';

        if (!verifyPassword(password)) {
          recordFail(ip);
          const after = isRateLimited(ip);
          const status = after.limited ? 429 : 401;
          const msg = after.limited
            ? `Quá nhiều lần thử sai. Vui lòng thử lại sau ${Math.ceil(after.retryAfterSec / 60)} phút.`
            : 'Mật khẩu không đúng.';
          const extra = after.limited ? { 'Retry-After': String(after.retryAfterSec) } : {};
          if (jsonMode) {
            sendJson(req, res, status, { ok: false, error: msg }, false, { 'Cache-Control': 'no-store', ...extra });
          } else {
            sendLoginHtml(res, status, loginPage(nextTarget, msg), withSecure, getCorsHeaders, req, extra);
          }
          return;
        }

        clearFail(ip);
        const token = signToken(Math.floor(Date.now() / 1000));
        const cookieHdr = buildAuthCookieHeader(token, TTL_SEC, req);
        if (jsonMode) {
          sendJson(req, res, 200, { ok: true, redirect: nextTarget }, false, {
            'Set-Cookie': cookieHdr,
            'Cache-Control': 'no-store, private'
          });
        } else {
          res.writeHead(302, withSecure({
            'Location': nextTarget,
            'Set-Cookie': cookieHdr,
            'Cache-Control': 'no-store, private',
            ...getCorsHeaders(req)
          }));
          res.end('');
        }
      }).catch((err) => {
        if (res.writableEnded || res.destroyed) return;
        const code = err && err.statusCode === 413 ? 413 : 400;
        if (jsonMode) {
          sendJson(req, res, code, { ok: false, error: code === 413 ? 'Payload Too Large' : 'Bad Request' }, false);
        } else {
          res.writeHead(code, withSecure({ 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }));
          res.end(code === 413 ? 'Payload Too Large' : 'Bad Request');
        }
      });
      return true;
    }

    sendJson(req, res, 405, { error: 'Method Not Allowed' }, isHead, { 'Allow': 'GET, HEAD, POST, OPTIONS' });
    return true;
  }

  if (isAuthenticated(req)) {
    return false;
  }

  if (shouldReturn401Plain(apiPath, req)) {
    if (String(apiPath || '').toLowerCase().startsWith('/api/')) {
      sendJson(req, res, 401, { error: 'Unauthorized' }, isHead, {
        'Cache-Control': 'no-store',
        'X-Auth-Required': '1'
      });
    } else {
      res.writeHead(401, withSecure({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Auth-Required': '1',
        ...getCorsHeaders(req)
      }));
      res.end(isHead ? undefined : 'Unauthorized');
    }
    return true;
  }

  const nextTarget = safeNext(req.url || '/');
  sendLoginHtml(res, 401, loginPage(nextTarget, ''), withSecure, getCorsHeaders, req);
  return true;
}

module.exports = {
  COOKIE_NAME,
  AUTH_LOGIN_VER,
  MAX_FAIL_MAP_SIZE,
  isEnabled,
  getTokenVersion,
  isAuthenticated,
  safeNext,
  signToken,
  verifyToken,
  verifyPassword,
  clientIp,
  isRateLimited,
  recordFail,
  clearFail,
  getFailMapSize: () => failMap.size,
  loginPage,
  handle
};
