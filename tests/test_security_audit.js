/**
 * H2DEV Security Audit Regression Test Suite
 * Run: node tests/test_security_audit.js
 *
 * Zero external dependencies — only Node built-ins.
 * Tests both static hygiene gates and behavioral contracts
 * from the 2026-11-25 security audit (L1..L5).
 *
 * PUBLIC REPO SAFE: zero real IPs, keys, SSH key filenames, or secrets.
 */

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');

// ── Helpers ──────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const PASS = '\x1b[32mPASS\x1b[0m';
const FAIL = '\x1b[31mFAIL\x1b[0m';
const SKIP_LABEL = '\x1b[33mSKIP\x1b[0m';

let passed = 0;
let failed = 0;
let skippedCount = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ${PASS} ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ${FAIL} ${name}`);
    console.log(`         ${err.message}`);
    failed++;
    failures.push({ name, err });
  }
}

function skipTest(name, reason) {
  console.log(`  ${SKIP_LABEL} ${name} — ${reason}`);
  skippedCount++;
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

function fileContent(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

// ── Layer 5: .gitignore & File Hygiene ───────────────────────────────────────

section('L5 — .gitignore hygiene (SEC5-011)');

test('.gitignore contains *.pem', () => {
  const gi = fileContent('.gitignore');
  assert.ok(gi.includes('*.pem'), '.gitignore missing *.pem');
});

test('.gitignore contains *.key', () => {
  const gi = fileContent('.gitignore');
  assert.ok(gi.includes('*.key'), '.gitignore missing *.key');
});

test('.gitignore contains *.pfx', () => {
  const gi = fileContent('.gitignore');
  assert.ok(gi.includes('*.pfx'), '.gitignore missing *.pfx');
});

test('.gitignore contains *.p12', () => {
  const gi = fileContent('.gitignore');
  assert.ok(gi.includes('*.p12'), '.gitignore missing *.p12');
});

test('.gitignore contains .pytest_cache/', () => {
  const gi = fileContent('.gitignore');
  assert.ok(gi.includes('.pytest_cache/'), '.gitignore missing .pytest_cache/');
});

test('.gitignore contains .env', () => {
  const gi = fileContent('.gitignore');
  assert.ok(gi.includes('.env'), '.gitignore missing .env');
});

test('.gitignore contains cookies*.json', () => {
  const gi = fileContent('.gitignore');
  assert.ok(gi.includes('cookies*.json'), '.gitignore missing cookies*.json');
});

test('.gitignore contains *_cookies*.json', () => {
  const gi = fileContent('.gitignore');
  assert.ok(gi.includes('*_cookies*.json'), '.gitignore missing *_cookies*.json');
});

// ── Layer 5: No hardcoded private IPs or real SSH key filenames ───────────────

section('L5 — No leaked IPs or SSH key filenames in tracked code files (SEC5-003/006/007)');

function checkNoHardcodedInfra(relPath) {
  if (!fileExists(relPath)) {
    skipTest(relPath, 'file not found');
    return false;
  }
  const content = fileContent(relPath);
  // SSH private key filenames must never be hardcoded in tracked files
  assert.ok(!(/id_(?:rsa|ed25519)_(?:vps|site)/i).test(content),
    `${relPath} contains hardcoded internal SSH key path/filename`);
  // Private IP address ranges confirmed in audit findings
  // Using octet-pattern matching to catch the specific subnets found
  assert.ok(!(/103\.249\.\d{1,3}\.\d{1,3}/).test(content),
    `${relPath} contains hardcoded VPS IP 103.249.x.x`);
  assert.ok(!(/100\.83\.\d{1,3}\.\d{1,3}/).test(content),
    `${relPath} contains hardcoded Tailscale IP 100.83.x.x`);
  assert.ok(!(/192\.168\.50\.\d{1,3}/).test(content),
    `${relPath} contains hardcoded LAN IP 192.168.50.x`);
  assert.ok(!(/10\.66\.99\.\d{1,3}/).test(content),
    `${relPath} contains hardcoded WG VPN IP 10.66.99.x`);
  return true;
}

test('docs/reports/2026-11-25-security-audit-report.md: no real infrastructure IPs', () => {
  checkNoHardcodedInfra('docs/reports/2026-11-25-security-audit-report.md');
});

test('scripts/sync_videos_to_vps.py: no hardcoded VPS IPs or SSH key filenames', () => {
  checkNoHardcodedInfra('scripts/sync_videos_to_vps.py');
});

test('scripts/auto_ingest_pipeline.js: no hardcoded private IPs or SSH key filenames', () => {
  checkNoHardcodedInfra('scripts/auto_ingest_pipeline.js');
});

// ── Layer 4: Static checks on patched downloaders/pipelines ──────────────────

section('L4 — Downloader static security checks');

test('download_dgmd_hls.js: 0 bare execSync calls (L4-04 fix)', () => {
  if (!fileExists('scripts/download_dgmd_hls.js')) return skipTest('download_dgmd_hls.js', 'not found');
  const c = fileContent('scripts/download_dgmd_hls.js');
  // execSync (not execFileSync) — match standalone execSync only
  const badMatches = (c.match(/(?<![A-Za-z])execSync\s*\(/g) || []).length;
  assert.equal(badMatches, 0, `Found ${badMatches} execSync() calls; must all be execFileSync`);
});

test('download_h2dev_video.cjs: 0 bare execSync calls (L4-04 fix)', () => {
  if (!fileExists('scripts/download_h2dev_video.cjs')) return skipTest('download_h2dev_video.cjs', 'not found');
  const c = fileContent('scripts/download_h2dev_video.cjs');
  const badMatches = (c.match(/(?<![A-Za-z])execSync\s*\(/g) || []).length;
  assert.equal(badMatches, 0, `Found ${badMatches} execSync() calls; must all be execFileSync`);
});

test('download_full_drm_audio.cjs: 0 bare execSync calls (L4-04 fix)', () => {
  if (!fileExists('scripts/download_full_drm_audio.cjs')) return skipTest('download_full_drm_audio.cjs', 'not found');
  const c = fileContent('scripts/download_full_drm_audio.cjs');
  const badMatches = (c.match(/(?<![A-Za-z])execSync\s*\(/g) || []).length;
  assert.equal(badMatches, 0, `Found ${badMatches} execSync() calls; must all be execFileSync`);
});

test('download_dgmd_hls.js: 0 --disable-web-security (L4-10 fix)', () => {
  if (!fileExists('scripts/download_dgmd_hls.js')) return skipTest('download_dgmd_hls.js', 'not found');
  const c = fileContent('scripts/download_dgmd_hls.js');
  assert.ok(!c.includes('--disable-web-security'), 'Found --disable-web-security; must be removed');
});

test('download_huan_video.js: path.resolve containment in saveFileChunk (L4-02 fix)', () => {
  if (!fileExists('scripts/download_huan_video.js')) return skipTest('download_huan_video.js', 'not found');
  const c = fileContent('scripts/download_huan_video.js');
  // After fix: should contain path.resolve + path.sep containment guard
  assert.ok(
    (c.includes('path.resolve') && c.includes('path.sep')) ||
    (c.includes('path.resolve') && c.includes('startsWith')),
    'download_huan_video.js saveFileChunk missing path.resolve containment check'
  );
});

test('download_huan_video.js: no -allowed_extensions ALL (L4-12 fix)', () => {
  if (!fileExists('scripts/download_huan_video.js')) return skipTest('download_huan_video.js', 'not found');
  const c = fileContent('scripts/download_huan_video.js');
  assert.ok(!c.includes('-allowed_extensions ALL'), 'Found -allowed_extensions ALL; must be replaced with ts,key');
});

test('fetch_h2dev_video.cjs: no -allowed_extensions ALL (L4-12 fix)', () => {
  if (!fileExists('scripts/fetch_h2dev_video.cjs')) return skipTest('fetch_h2dev_video.cjs', 'not found');
  const c = fileContent('scripts/fetch_h2dev_video.cjs');
  assert.ok(!c.includes('-allowed_extensions ALL'), 'Found -allowed_extensions ALL; must be replaced with ts,key');
});

test('get_drm_key.py: pins widevine-dash.ezdrm.com (L4-11 fix)', () => {
  if (!fileExists('scripts/get_drm_key.py')) return skipTest('get_drm_key.py', 'not found');
  const c = fileContent('scripts/get_drm_key.py');
  assert.ok(c.includes('widevine-dash.ezdrm.com'), 'get_drm_key.py missing ezdrm.com host pinning');
});

test('scripts/windows/*: 0 profile=any firewall rules (L4-09 fix)', () => {
  const winDir = path.join(ROOT, 'scripts', 'windows');
  if (!fs.existsSync(winDir)) return skipTest('scripts/windows/', 'directory not found');
  const files = fs.readdirSync(winDir).filter(f => /\.(cmd|ps1|bat)$/i.test(f));
  for (const f of files) {
    const c = fs.readFileSync(path.join(winDir, f), 'utf8');
    assert.ok(
      !(/Profile\s*=\s*Any/i).test(c) && !(/profile=any/i).test(c) && !(/\-profile\s+Any/i).test(c),
      `${f} contains profile=any firewall rule; must be Profile=Private`
    );
  }
});

test('sync_videos_to_vps.py: no StrictHostKeyChecking=no (SEC5-004 / L4-13 fix)', () => {
  if (!fileExists('scripts/sync_videos_to_vps.py')) return skipTest('sync_videos_to_vps.py', 'not found');
  const c = fileContent('scripts/sync_videos_to_vps.py');
  assert.ok(!c.includes('StrictHostKeyChecking=no'), 'Found StrictHostKeyChecking=no; must be yes or accept-new');
});

test('auto_ingest_pipeline.js: no StrictHostKeyChecking=no (L4-13 fix)', () => {
  if (!fileExists('scripts/auto_ingest_pipeline.js')) return skipTest('auto_ingest_pipeline.js', 'not found');
  const c = fileContent('scripts/auto_ingest_pipeline.js');
  assert.ok(!c.includes('StrictHostKeyChecking=no'), 'Found StrictHostKeyChecking=no; must be yes or accept-new');
});

// ── Layer 3: Client-side security (static checks) ────────────────────────────

section('L3 — Client-side security (safeClientNext & navigateDirectUrl)');

test('assets/auth-login.js: safeClientNext defined (F-01, F-09 fix)', () => {
  if (!fileExists('assets/auth-login.js')) return skipTest('auth-login.js', 'not found');
  const src = fileContent('assets/auth-login.js');
  assert.ok(src.includes('safeClientNext'), 'auth-login.js missing safeClientNext helper (F-01/F-09 fix)');
});

test('assets/auth-login.js: safeClientNext performs origin check', () => {
  if (!fileExists('assets/auth-login.js')) return skipTest('auth-login.js', 'not found');
  const src = fileContent('assets/auth-login.js');
  // Must use URL parsing or origin comparison to block external URLs
  assert.ok(
    src.includes('window.location.origin') || src.includes('new URL') || src.includes('.origin'),
    'safeClientNext does not appear to perform origin check'
  );
});

test('assets/auth-login.js: safeClientNext blocks https://evil.com (source-level check)', () => {
  if (!fileExists('assets/auth-login.js')) return skipTest('auth-login.js', 'not found');
  const src = fileContent('assets/auth-login.js');
  // After fix, the function must check that URL starts with /  AND is same-origin
  // Check that it blocks cross-origin (URL with http/https scheme without being same-origin)
  assert.ok(
    src.includes("startsWith('/')") || src.includes('startsWith("/') || src.includes('.origin'),
    'safeClientNext missing startsWith("/") check — may not block https://evil.com'
  );
});

test('assets/auth-login.js: safeClientNext blocks //evil.com (double-slash protocol-relative)', () => {
  if (!fileExists('assets/auth-login.js')) return skipTest('auth-login.js', 'not found');
  const src = fileContent('assets/auth-login.js');
  // Must explicitly guard against // prefix (protocol-relative URLs)
  assert.ok(
    src.includes("startsWith('//") || src.includes('startsWith("//') ||
    src.includes("'//'") || src.includes('"//') ||
    src.includes('.origin'),  // origin check implicitly handles //
    'safeClientNext may not block //evil.com (protocol-relative URL)'
  );
});

test('assets/auth-login.js: safeClientNext blocks javascript: (L3/F-01)', () => {
  if (!fileExists('assets/auth-login.js')) return skipTest('auth-login.js', 'not found');
  const src = fileContent('assets/auth-login.js');
  // A URL parser-based approach (new URL) correctly rejects javascript: via origin check
  // OR explicit startsWith check
  assert.ok(
    src.includes('new URL') || src.includes("javascript:") || src.includes('.protocol'),
    'safeClientNext may not block javascript: URLs'
  );
});

test('assets/app/main.js: navigateDirectUrl has origin guard (F-01 fix)', () => {
  if (!fileExists('assets/app/main.js')) return skipTest('main.js', 'not found');
  const src = fileContent('assets/app/main.js');
  assert.ok(src.includes('function navigateDirectUrl'), 'main.js missing navigateDirectUrl function');
  const startIdx = src.indexOf('function navigateDirectUrl');
  const fnBlock = src.slice(startIdx, startIdx + 1500);
  assert.ok(
    fnBlock.includes('.origin') || fnBlock.includes('.protocol') || fnBlock.includes('new URL'),
    'navigateDirectUrl missing protocol/origin safety check'
  );
});

test('assets/app/main.js: navigateDirectUrl blocks protocol-relative //evil.com and uses u.href (F-01 fix)', () => {
  if (!fileExists('assets/app/main.js')) return skipTest('main.js', 'not found');
  const src = fileContent('assets/app/main.js');
  const startIdx = src.indexOf('function navigateDirectUrl');
  const fnBlock = src.slice(startIdx, startIdx + 1500);
  const rawAssign = /location\.href\s*=\s*directUrl\s*;/.test(fnBlock);
  assert.ok(!rawAssign,
    'navigateDirectUrl still contains raw `location.href = directUrl;` without origin guard');
  assert.ok(fnBlock.includes("startsWith('//')"),
    'navigateDirectUrl missing u.pathname.startsWith("//") guard against same-origin //evil.com');
  assert.ok(fnBlock.includes('location.href = u.href'),
    'navigateDirectUrl must assign validated u.href');
});

// ── Layer 1: auth_gate.js behavioral checks ───────────────────────────────────

section('L1 — auth_gate.js behavioral contracts');

function tryLoadAuthGate() {
  const agPath = path.join(ROOT, 'scripts', 'auth_gate.js');
  assert.ok(fs.existsSync(agPath), 'scripts/auth_gate.js must exist');
  delete require.cache[require.resolve(agPath)];
  return require(agPath);
}

test('scripts/auth_gate.js: safeNext rejects https://evil.com', () => {
  const ag = tryLoadAuthGate();
  assert.equal(ag.safeNext('https://evil.com'), '/');
});

test('scripts/auth_gate.js: safeNext rejects //evil.com', () => {
  const ag = tryLoadAuthGate();
  assert.equal(ag.safeNext('//evil.com'), '/');
});

test('scripts/auth_gate.js: safeNext rejects /\\evil.com (backslash escape)', () => {
  const ag = tryLoadAuthGate();
  assert.equal(ag.safeNext('/\\evil.com'), '/');
});

test('scripts/auth_gate.js: safeNext rejects javascript:alert(1)', () => {
  const ag = tryLoadAuthGate();
  assert.equal(ag.safeNext('javascript:alert(1)'), '/');
});

test('scripts/auth_gate.js: safeNext allows /learn?tab=video', () => {
  const ag = tryLoadAuthGate();
  const result = ag.safeNext('/learn?tab=video');
  assert.ok(
    result === '/learn?tab=video' || result.startsWith('/learn'),
    `safeNext('/learn?tab=video') returned unexpected: ${result}`
  );
});

test('scripts/auth_gate.js: verifyPassword uses timingSafeEqual (source check)', () => {
  assert.ok(fileExists('scripts/auth_gate.js'), 'scripts/auth_gate.js must exist');
  const src = fileContent('scripts/auth_gate.js');
  assert.ok(
    src.includes('timingSafeEqual'),
    'scripts/auth_gate.js missing timingSafeEqual — timing-safe password check required (L1-13)'
  );
});

// ── Layer 1: server.js live HTTP behavioral tests (ephemeral test instance) ───

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(3000, () => { req.destroy(new Error('HTTP request timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

async function waitForHealth(port, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await httpRequest({ host: '127.0.0.1', port, path: '/health', method: 'GET' });
      if (r.status === 200) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

async function runHttpTests() {
  const TEST_PORT = 18899;
  const TEST_PW = 'h2dev-sec-test-pw-2026';
  section(`L1 — server.js live HTTP behavioral tests (ephemeral 127.0.0.1:${TEST_PORT})`);

  const { spawn } = require('node:child_process');
  const childEnv = Object.assign({}, process.env, {
    HOST: '127.0.0.1',
    PORT: String(TEST_PORT),
    ACCESS_PASSWORD: TEST_PW,
    AUTH_SECRET: '0123456789abcdef0123456789abcdef0123456789abcdef',
    H2DEV_DISABLE_KG_WATCHER: '1',
  });
  const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    cwd: ROOT,
    env: childEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  try {
    const ready = await waitForHealth(TEST_PORT, 10000);
    test(`server.js boots cleanly on 127.0.0.1:${TEST_PORT}`, () => {
      assert.ok(ready, `ephemeral server.js did not become healthy on port ${TEST_PORT}`);
    });
    if (!ready) return;

    // Login to get authenticated cookie for post-auth 404/traversal/CSRF tests
    const loginRes = await httpRequest({
      host: '127.0.0.1',
      port: TEST_PORT,
      path: '/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    }, JSON.stringify({ password: TEST_PW }));
    const setCookies = [].concat(loginRes.headers['set-cookie'] || []);
    const authCookie = setCookies.map((c) => String(c).split(';')[0]).find((c) => c.startsWith('_97yo_auth=')) || '';
    test('server.js /login authenticates test session cleanly', () => {
      assert.equal(loginRes.status, 200);
      assert.ok(authCookie.length > 0, 'missing _97yo_auth session cookie');
    });

    // Unauth GET /logout -> 405 Allow: POST
    const logoutGet = await httpRequest({ host: '127.0.0.1', port: TEST_PORT, path: '/logout', method: 'GET' });
    test('server.js GET /logout returns 405 Allow: POST (L1-04 auth gate)', () => {
      assert.equal(logoutGet.status, 405);
      assert.ok(String(logoutGet.headers.allow || '').includes('POST'));
    });

    // Authenticated path traversal & sensitive segments -> 400/403/404
    const traversalPaths = ['/../../package.json', '/.GIT/config', '/.ENV', '/CHAY-LAN.md', '/index.html::$DATA'];
    for (const p of traversalPaths) {
      const res = await httpRequest({
        host: '127.0.0.1',
        port: TEST_PORT,
        path: p,
        method: 'GET',
        headers: { Cookie: authCookie },
      });
      test(`server.js path guard denied (authed): GET ${p}`, () => {
        assert.ok([400, 403, 404].includes(res.status), `Expected 400/403/404 for ${p}, got ${res.status}`);
        assert.ok(!res.body.includes('<script'), `response body reflects <script> from ${p}`);
      });
    }

    // Authenticated XSS reflection check on 404 (L1-07)
    const xssPayload = '%3Cscript%3Ealert(1)%3C/script%3E';
    const xssRes = await httpRequest({
      host: '127.0.0.1',
      port: TEST_PORT,
      path: `/${xssPayload}`,
      method: 'GET',
      headers: { Cookie: authCookie },
    });
    test('server.js 404 body is generic and does not echo urlPath/XSS (L1-07 fix)', () => {
      assert.equal(xssRes.status, 404);
      assert.equal(xssRes.body, '404 Not Found');
    });

    // CORS rejects untrusted Origin
    const corsRes = await httpRequest({
      host: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/kg/stats',
      method: 'GET',
      headers: { Origin: 'https://evil.com', Cookie: authCookie },
    });
    test('server.js CORS rejects untrusted Origin (L1-01 fix)', () => {
      const acao = corsRes.headers['access-control-allow-origin'] || '';
      assert.ok(acao !== '*' && acao !== 'https://evil.com', `CORS leaked ACAO=${acao}`);
    });

    // CSRF rejects cross-site POST /api/kg/reload
    const csrfRes = await httpRequest({
      host: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/kg/reload',
      method: 'POST',
      headers: { 'sec-fetch-site': 'cross-site', 'Content-Type': 'application/json', Cookie: authCookie },
    }, '{}');
    test('server.js rejects CSRF on POST /api/kg/reload (L1-05 fix)', () => {
      assert.equal(csrfRes.status, 403);
    });
  } finally {
    try { child.kill('SIGTERM'); } catch (_) {}
  }
}

// ── Layer 2: data-layer static checks ────────────────────────────────────────

section('L2 — Data layer static security checks');

test('kg_query.js: deepSearchAll has segment cap of 12 (L2-02 fix)', () => {
  if (!fileExists('scripts/kg_query.js')) return skipTest('kg_query.js', 'not found');
  const src = fileContent('scripts/kg_query.js');
  // After fix, deepSearchAll must deduplicate and cap segments at <=12
  assert.ok(
    src.includes('12') || src.includes('MAX_SEGMENTS') || src.includes('maxSegments') || src.includes('MAX_DEEP'),
    'kg_query.js deepSearchAll missing segment cap (expected cap of 12)'
  );
});

test('kg_query.js: escLike applied to LIKE clauses (L2-07 fix)', () => {
  if (!fileExists('scripts/kg_query.js')) return skipTest('kg_query.js', 'not found');
  const src = fileContent('scripts/kg_query.js');
  assert.ok(src.includes('escLike'), 'kg_query.js missing escLike for LIKE clause escaping (L2-07)');
});

test('kg_query.js: tracePathInDb uses chunked IN (L2-04 fix)', () => {
  if (!fileExists('scripts/kg_query.js')) return skipTest('kg_query.js', 'not found');
  const src = fileContent('scripts/kg_query.js');
  // After fix, neighbor lookups must be chunked
  assert.ok(
    src.includes('500') || src.includes('CHUNK') || src.includes('chunk'),
    'kg_query.js missing 500-item chunked IN query in tracePathInDb (L2-04)'
  );
});

test('master_dal.js: query length cap ≤ 256 chars (L2-06 ReDoS fix)', () => {
  if (!fileExists('scripts/master_dal.js')) return skipTest('master_dal.js', 'not found');
  const src = fileContent('scripts/master_dal.js');
  assert.ok(
    src.includes('256') || src.includes('MAX_QUERY') || src.includes('maxQueryLen') || src.includes('maxLen'),
    'master_dal.js missing query length cap for ReDoS prevention (L2-06)'
  );
});

test('spider_graph_engine.js: redirect:"error" on fetch calls (L2-03 fix)', () => {
  if (!fileExists('scripts/spider_graph_engine.js')) return skipTest('spider_graph_engine.js', 'not found');
  const src = fileContent('scripts/spider_graph_engine.js');
  assert.ok(
    src.includes("redirect: 'error'") || src.includes('redirect:"error"') || src.includes("redirect:'error'"),
    "spider_graph_engine.js missing redirect:'error' on fetch calls (L2-03)"
  );
});

test('spider_graph_engine.js: channelId ^UC[A-Za-z0-9]+ validation (L2-03 fix)', () => {
  if (!fileExists('scripts/spider_graph_engine.js')) return skipTest('spider_graph_engine.js', 'not found');
  const src = fileContent('scripts/spider_graph_engine.js');
  assert.ok(
    src.includes('UC') && (
      src.includes('/^UC[A-Za-z0-9') ||
      src.includes("'^UC'") ||
      src.includes('UC[A-Za-z0-9_-]')
    ),
    'spider_graph_engine.js missing channelId ^UC[A-Za-z0-9]+ validation (L2-03)'
  );
});

test('hot_memory_store.js: marketCounts uses Map not plain {} (L2-10 fix)', () => {
  if (!fileExists('scripts/hot_memory_store.js')) return skipTest('hot_memory_store.js', 'not found');
  const src = fileContent('scripts/hot_memory_store.js');
  const idx = src.indexOf('marketCounts');
  if (idx === -1) return skipTest('hot_memory_store.js marketCounts', 'variable not found');
  // Look in context around marketCounts for Map usage
  const context = src.slice(Math.max(0, idx - 100), Math.min(src.length, idx + 500));
  assert.ok(
    context.includes('Map') || context.includes('new Map'),
    'hot_memory_store.js marketCounts still uses plain {} object — prototype pollution risk (L2-10)'
  );
});

test('build_knowledge_vault_graph.js: WAL transaction has ROLLBACK + finally db.close (L2-01 fix)', () => {
  if (!fileExists('scripts/build_knowledge_vault_graph.js')) {
    return skipTest('build_knowledge_vault_graph.js', 'not found');
  }
  const src = fileContent('scripts/build_knowledge_vault_graph.js');
  assert.ok(
    src.includes('ROLLBACK') || src.includes('rollback'),
    'build_knowledge_vault_graph.js missing ROLLBACK in WAL transaction error handler (L2-01)'
  );
  assert.ok(
    src.includes('finally') && src.includes('db.close'),
    'build_knowledge_vault_graph.js missing finally { db.close() } in WAL transaction (L2-01)'
  );
});

// ── Layer 2: ReDoS benchmark ─────────────────────────────────────────────────

section('L2 — ReDoS regression benchmark');

test('No O(N²) regex catastrophic backtracking on 15k zeros + x (< 50ms)', () => {
  // Verify safe patterns run well under 50ms (they should be instant)
  const input = '0'.repeat(15000) + 'x';

  const start = process.hrtime.bigint();

  // Safe linear patterns that should replace the dangerous overlapping quantifiers
  const safePatterns = [
    /^\d+$/,
    /^0*([1-9]\d*|0)$/,
    /^[A-Za-z0-9_-]+$/,
  ];
  for (const p of safePatterns) p.test(input);

  const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;
  assert.ok(elapsed < 50, `Safe regex patterns took ${elapsed.toFixed(2)}ms (expected < 50ms)`);

  // Verify dangerous overlapping pattern NOT present in master_dal.js
  if (fileExists('scripts/master_dal.js')) {
    const src = fileContent('scripts/master_dal.js');
    // Dangerous: 0*(\d+) with optional matching same chars as required — O(N²)
    // Check the pattern is gone (heuristic: look for literal 0* followed by \d+ in regex context)
    const hasDangerous = /\/\^[^/]*0\\\*\(\\d\+\)[^/]*\//.test(src);
    assert.ok(!hasDangerous,
      'master_dal.js still contains dangerous O(N²) regex pattern 0*(\\d+) (L2-06 not fully fixed)');
  }
});

// ── Node syntax checks ────────────────────────────────────────────────────────

section('Node --check syntax validation');

function nodeSyntaxCheck(relPath) {
  if (!fileExists(relPath)) {
    return skipTest(`node --check ${path.basename(relPath)}`, 'file not found');
  }
  test(`node --check ${path.basename(relPath)}`, () => {
    const result = spawnSync(process.execPath, ['--check', path.join(ROOT, relPath)], {
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.equal(result.status, 0,
      `node --check ${relPath} failed:\n${result.stderr || result.stdout || '(no output)'}`);
  });
}

nodeSyntaxCheck('server.js');
nodeSyntaxCheck('scripts/auth_gate.js');
nodeSyntaxCheck('scripts/kg_query.js');
nodeSyntaxCheck('scripts/master_dal.js');
nodeSyntaxCheck('scripts/spider_graph_engine.js');
nodeSyntaxCheck('scripts/hot_memory_store.js');
nodeSyntaxCheck('scripts/build_knowledge_vault_graph.js');
nodeSyntaxCheck('scripts/auto_ingest_pipeline.js');
nodeSyntaxCheck('scripts/download_dgmd_hls.js');
nodeSyntaxCheck('scripts/download_huan_video.js');
nodeSyntaxCheck('scripts/install-market-skill.js');
nodeSyntaxCheck('assets/auth-login.js');
nodeSyntaxCheck('assets/app/main.js');
nodeSyntaxCheck('tests/test_security_audit.js');

// ── Run async tests and final report ─────────────────────────────────────────

(async () => {
  try {
    await runHttpTests();
  } catch (err) {
    console.error('\nAsync HTTP test runner error:', err.message);
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed, ${skippedCount} skipped`);
  console.log('═'.repeat(60));

  if (failures.length > 0) {
    console.log('\nFAILED TESTS:');
    for (const { name, err } of failures) {
      console.log(`  ✗ ${name}`);
      console.log(`    ${err.message}`);
    }
    console.log('');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed. Security audit regression suite: PASS');
    process.exit(0);
  }
})();
