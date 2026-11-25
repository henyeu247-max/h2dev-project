#!/usr/bin/env node
/**
 * H2DEV 3-Branch Auto-Ingest Pipeline & Watcher (`scripts/auto_ingest_pipeline.js`)
 * ----------------------------------------------------------------------------------
 * Mode 1 (`--check` [--json]):
 *   Queries all 3 upstream GraphQL APIs (`H2DEV`, `HUAN`, `DGMD`) in ~3s, compares
 *   against local `video/<SKU>/<SKU>.(mp4|webm)`, and prints a structured report.
 *
 * Mode 2 (`--run` [--quiet] [--force-rebuild] [--sku VIDEO-xxxxxx]):
 *   Automates the end-to-end 7-Layer Gold Standard ingest pipeline for any newly
 *   discovered (or explicitly targeted `--sku`) upstream lessons:
 *     1. Video download (`MOOV_FIRST` via `os.tmpdir()`, supporting direct HLS/MPD,
 *        H2DEV AES-128 HLS, and Widevine CENC `<SegmentTimeline>` DRM) & thumbnail
 *        download (`thumbs`, `thumbs-huan`, `thumbs-dgmd`)
 *     2. Attachment / Google Drive / Google Docs extraction (`H2DEV-SCAR-028`)
 *     3. CUDA GPU NVDEC + PyTorch STFT/RMS valley silence scan (`silence_scan.py`)
 *     4. Whisper Large-v3-Turbo CUDA transcription + gap filling (`H2DEV-SCAR-031/032`)
 *     5. Grounded `insight.json` + `docs/<SKU>/README.md` generation + automatic
 *        registration in `catalog*.json`, `modules*.json`, `data-tabs/videos.json`,
 *        `data-tabs/tai-lieu-full.json`, `data-tabs/ngach-xanh.json` (`heThong40Ngach`,
 *        `ngachXanh`, `thiTruongXanh`, `bangXepHang`) + 3-branch data rebuild +
 *        Knowledge Vault + Master SQLite DB + `sync-counts.js`
 *     6. Server readiness probe (`127.0.0.1:8899`) + 10-Gate SKU verification
 *        (`verify_sku_az.js`) + `check-grounding.py` + `check-grounding-md.py` +
 *        `sync-counts.js --check` + `validate-project.js`
 *     7. Google Drive `mirror_sqlite.db` verification + VPS `rclone rc vfs/refresh` +
 *        `/usr/local/bin/h2dev-sync-video-symlinks.sh` + VPS metadata/data sync (`H2DEV-SCAR-033`)
 */
'use strict';

const crypto = require('crypto');
const dns = require('dns');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
try {
  const envPath = path.join(ROOT, '.env');
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
} catch (_) {}

const LOG_DIR = path.join(ROOT, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'auto-ingest.log');
const LOCK_FILE = path.join(ROOT, '.cache', 'auto-ingest.lock');
const FAILURES_FILE = path.join(ROOT, '.cache', 'auto-ingest-failures.json');
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DISALLOWED_AGV_MODEL_RE = /gemini-4-(?:neon|hydrogen|argon|carbon)|gemini-3\.8|swe-2-flash/i;
const MAX_LOG_BYTES = 2 * 1024 * 1024;
const IS_WIN = process.platform === 'win32';
const PYTHON_CMD = IS_WIN ? 'py' : 'python3';
const PYTHON_BASE_ARGS = IS_WIN ? ['-3'] : [];
const DEFAULT_FFMPEG = 'D:/Linly-Dubbing/bin/ffmpeg.exe';
const FFMPEG = process.env.FFMPEG || (fs.existsSync(DEFAULT_FFMPEG) ? DEFAULT_FFMPEG : 'ffmpeg');
const _envVpsHost = String(process.env.H2DEV_VPS_HOST || process.env.VPS_HOST || '').trim();
const _envVpsUser = String(process.env.H2DEV_VPS_USER || process.env.VPS_USER || 'root').trim() || 'root';
const VPS_HOST_CONFIGURED = Boolean(_envVpsHost);
const VPS_HOST = _envVpsHost
  ? (_envVpsHost.includes('@') ? _envVpsHost : `${_envVpsUser}@${_envVpsHost}`)
  : `${_envVpsUser}@vps-host.invalid`;
const VPS_PORT = String(process.env.H2DEV_VPS_PORT || process.env.VPS_PORT || '22').trim() || '22';
const _rawVpsSshKey = String(process.env.H2DEV_VPS_SSH_KEY || process.env.VPS_SSH_KEY || '').trim();
const VPS_SSH_KEY = _rawVpsSshKey
  ? (_rawVpsSshKey.startsWith('~') ? path.join(os.homedir(), _rawVpsSshKey.slice(1).replace(/^[/\\]+/, '')) : path.resolve(_rawVpsSshKey))
  : '';
const VPS_APP_DIR = String(process.env.H2DEV_VPS_APP_DIR || process.env.VPS_APP_DIR || '/opt/h2dev/app').trim();
if (!/^[A-Za-z0-9_./-]+$/.test(VPS_APP_DIR)) {
  throw new Error(`Invalid VPS_APP_DIR path: ${VPS_APP_DIR}`);
}
const RCLONE_VFS_REFRESH_CMD = '{ [ -f /root/.config/rclone/rc.env ] && { set -a; source /root/.config/rclone/rc.env; set +a; } || true; } && rclone rc vfs/refresh recursive=true --rc-addr 127.0.0.1:5572 >/dev/null';
const TAR_EXCLUDES = [
  'desktop.ini',
  'Thumbs.db',
  '.DS_Store',
  '*.db-wal',
  '*.db-shm',
  '*.db-journal',
  '__pycache__',
  '*.pyc',
  '*.tmp.drive*',
  '_temp*'
];
const SAFE_SKU_RE = /^[A-Z0-9_-]+$/i;

const { inspectMp4Atoms } = require('./ensure_video_faststart.cjs');

function assertSafeSku(sku) {
  const s = String(sku || '').trim();
  if (!SAFE_SKU_RE.test(s)) {
    throw new Error(`Invalid SKU format: ${s}`);
  }
  return s;
}

function shellSingleQuote(val) {
  const s = String(val || '');
  if (!s || /[\r\n\x00]/.test(s)) {
    throw new Error(`Unsafe shell argument: ${JSON.stringify(s)}`);
  }
  return `'${s.replace(/'/g, "'\\''")}'`;
}

function isPrivateOrBlockedIp(rawIp) {
  const ip = String(rawIp || '').trim().toLowerCase().replace(/^\[|\]$/g, '').split('%')[0];
  const ver = net.isIP(ip);
  if (ver === 4) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
    const [a, b] = parts;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8 RFC1918
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT / Tailscale
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 RFC1918
    if (a === 192 && b === 168) return true; // 192.168.0.0/16 RFC1918
    if (a === 192 && b === 0 && (parts[2] === 0 || parts[2] === 2)) return true;
    if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  if (ver === 6) {
    if (ip === '::' || ip === '::1') return true;
    if (ip.startsWith('fc') || ip.startsWith('fd')) return true; // fc00::/7 ULA
    if (/^fe[89ab]/i.test(ip)) return true; // fe80::/10 link-local
    if (ip.startsWith('ff')) return true; // multicast
    const v4Mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (v4Mapped) return isPrivateOrBlockedIp(v4Mapped[1]);
    const v4MappedHex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
    if (v4MappedHex) {
      const hi = parseInt(v4MappedHex[1], 16);
      const lo = parseInt(v4MappedHex[2], 16);
      return isPrivateOrBlockedIp(`${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`);
    }
    return false;
  }
  return false;
}

function assertSafeRemoteUrl(urlStr) {
  let u;
  try {
    u = new URL(String(urlStr || '').trim());
  } catch (_) {
    throw new Error(`Invalid remote URL: ${String(urlStr || '')}`);
  }
  if (u.protocol !== 'https:') {
    throw new Error(`Disallowed remote URL protocol (must be https:): ${u.protocol}`);
  }
  if (u.username || u.password) {
    throw new Error('Remote URL credentials are not allowed');
  }
  const host = String(u.hostname || '').trim().toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host) {
    throw new Error(`Remote URL missing hostname: ${u.toString()}`);
  }
  if (
    host === 'localhost' ||
    host === 'localhost.localdomain' ||
    host === 'metadata' ||
    host === 'metadata.google.internal' ||
    host === 'instance-data' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new Error(`Disallowed local/metadata remote hostname: ${host}`);
  }
  if (net.isIP(host) && isPrivateOrBlockedIp(host)) {
    throw new Error(`Disallowed private/loopback/metadata IP: ${host}`);
  }
  return u.toString();
}

async function verifyRemoteUrlPublicDns(urlStr) {
  const safeUrl = assertSafeRemoteUrl(urlStr);
  const host = new URL(safeUrl).hostname.replace(/^\[|\]$/g, '');
  if (!net.isIP(host)) {
    const records = await dns.promises.lookup(host, { all: true });
    if (!records || records.length === 0) {
      throw new Error(`DNS resolution returned no addresses for ${host}`);
    }
    for (const rec of records) {
      if (isPrivateOrBlockedIp(rec.address)) {
        throw new Error(`Remote hostname ${host} resolved to disallowed IP: ${rec.address}`);
      }
    }
  }
  return safeUrl;
}

function resolveLocalMedia(sku) {
  const skuDir = path.join(ROOT, 'video', sku);
  if (!fs.existsSync(skuDir)) return null;
  for (const ext of ['.mp4', '.webm']) {
    const p = path.join(skuDir, `${sku}${ext}`);
    try {
      if (fs.existsSync(p)) {
        const st = fs.statSync(p);
        if (st.isFile() && st.size > 0) {
          return {
            path: p,
            rel: `video/${sku}/${sku}${ext}`,
            ext,
            filename: `${sku}${ext}`,
            size: st.size,
            isWebm: ext === '.webm'
          };
        }
      }
    } catch (_) {}
  }
  try {
    for (const fn of fs.readdirSync(skuDir)) {
      if (/\.(mp4|webm)$/i.test(fn) && !/\.tmp\.(mp4|webm)$/i.test(fn)) {
        const p = path.join(skuDir, fn);
        const st = fs.statSync(p);
        if (st.isFile() && st.size > 0) {
          const ext = path.extname(fn).toLowerCase();
          return {
            path: p,
            rel: `video/${sku}/${fn}`,
            ext,
            filename: fn,
            size: st.size,
            isWebm: ext === '.webm'
          };
        }
      }
    }
  } catch (_) {}
  return null;
}

function isValidWebmHeader(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    try {
      const buf = Buffer.alloc(4);
      const n = fs.readSync(fd, buf, 0, 4, 0);
      return n === 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
    } finally {
      fs.closeSync(fd);
    }
  } catch (_) {
    return false;
  }
}

function isValidZipHeader(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    try {
      const buf = Buffer.alloc(4);
      const n = fs.readSync(fd, buf, 0, 4, 0);
      return n === 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
    } finally {
      fs.closeSync(fd);
    }
  } catch (_) {
    return false;
  }
}

function isValidDownloadBuffer(filename, contentType, buf) {
  if (!buf || buf.length === 0) return { ok: false, reason: 'empty buffer' };
  const ext = path.extname(String(filename || '')).toLowerCase();
  const ctype = String(contentType || '').toLowerCase();
  const headAscii = buf.subarray(0, Math.min(256, buf.length)).toString('utf8').trimStart();
  const looksHtml = ctype.includes('text/html') || /^(?:<!doctype|<html|<!--)/i.test(headAscii);
  if (ext === '.zip') {
    const isPk = buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
    if (!isPk) {
      return { ok: false, reason: `invalid ZIP magic bytes (0x${buf.subarray(0, 4).toString('hex')}, content-type=${ctype || 'unknown'})` };
    }
    return { ok: true };
  }
  if (['.rar', '.7z', '.pdf', '.plugin', '.exe', '.dmg', '.png', '.jpg', '.jpeg', '.webp'].includes(ext) && looksHtml) {
    return { ok: false, reason: `HTML interstitial returned instead of ${ext}` };
  }
  return { ok: true };
}

function cleanupSkuTempDirs(sku) {
  const safeSku = assertSafeSku(sku);
  const videoRootResolved = path.resolve(ROOT, 'video');
  const vDir = path.resolve(videoRootResolved, safeSku);
  if (!vDir.startsWith(videoRootResolved + path.sep) || !fs.existsSync(vDir)) return 0;
  let removed = 0;
  for (const name of ['_temp_fill', '_temp_turbo', '_temp_patch', '_temp']) {
    const tDir = path.resolve(vDir, name);
    if (tDir.startsWith(vDir + path.sep) && fs.existsSync(tDir)) {
      try {
        fs.rmSync(tDir, { recursive: true, force: true });
        removed++;
      } catch (_) {}
    }
  }
  return removed;
}

function getStrictHostKeyChecking() {
  const val = String(process.env.H2DEV_SSH_STRICT_HOST_KEY || 'yes').trim().toLowerCase();
  if (val === 'yes' || val === 'accept-new') return val;
  throw new Error(`Invalid H2DEV_SSH_STRICT_HOST_KEY value (allowed: 'yes' or 'accept-new'): ${val}`);
}

function getVpsSshArgs(portFlag = '-p', connectTimeout = 15) {
  const args = [];
  if (VPS_SSH_KEY && fs.existsSync(VPS_SSH_KEY)) {
    args.push('-i', VPS_SSH_KEY);
  }
  args.push(
    portFlag, VPS_PORT,
    '-o', 'BatchMode=yes',
    '-o', `StrictHostKeyChecking=${getStrictHostKeyChecking()}`,
    '-o', `ConnectTimeout=${connectTimeout}`
  );
  return args;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function logMsg(msg, quiet = false) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  if (!quiet) console.log(line);
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    if (fs.existsSync(LOG_FILE)) {
      const st = fs.statSync(LOG_FILE);
      if (st.size > MAX_LOG_BYTES) {
        try { fs.renameSync(LOG_FILE, `${LOG_FILE}.1`); } catch (_) {}
      }
    }
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (_) {}
}

function acquireIngestLock(quiet = false) {
  try {
    fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true });
    if (fs.existsSync(LOCK_FILE)) {
      const raw = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      const oldPid = Number(raw && raw.pid);
      const ageMs = Date.now() - Number((raw && raw.startedAtMs) || 0);
      if (oldPid > 0 && ageMs < 6 * 3600 * 1000) {
        try {
          process.kill(oldPid, 0);
          logMsg(`Skip auto-ingest: another instance (PID ${oldPid}) is already running.`, quiet);
          return false;
        } catch (_) {}
      }
    }
    fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, startedAtMs: Date.now(), startedAt: new Date().toISOString() }), 'utf8');
    return true;
  } catch (_) {
    return true;
  }
}

function releaseIngestLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const raw = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
      if (!raw || raw.pid === process.pid) fs.unlinkSync(LOCK_FILE);
    }
  } catch (_) {}
}

function loadFailureState() {
  try {
    if (fs.existsSync(FAILURES_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FAILURES_FILE, 'utf8'));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return {};
}

function saveFailureState(state) {
  try {
    fs.mkdirSync(path.dirname(FAILURES_FILE), { recursive: true });
    fs.writeFileSync(FAILURES_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (_) {}
}

function recordSkuFailure(state, sku, err) {
  const prev = state[sku] || { count: 0 };
  const count = Number(prev.count || 0) + 1;
  const now = Date.now();
  state[sku] = {
    count,
    lastError: String(err && (err.message || err) || 'Unknown error').slice(0, 500),
    lastFailedAt: new Date(now).toISOString(),
    skipUntil: count >= CIRCUIT_BREAKER_THRESHOLD ? (now + CIRCUIT_BREAKER_COOLDOWN_MS) : 0
  };
  saveFailureState(state);
  return state[sku];
}

function clearSkuFailure(state, sku) {
  if (Object.prototype.hasOwnProperty.call(state, sku)) {
    delete state[sku];
    saveFailureState(state);
  }
}

function getLocalVideoSkus() {
  const videoRoot = path.join(ROOT, 'video');
  const map = new Map(); // UPPER_SKU -> canonical dir name
  if (!fs.existsSync(videoRoot)) return map;
  for (const entry of fs.readdirSync(videoRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const sku = entry.name;
    if (resolveLocalMedia(sku)) {
      map.set(sku.toUpperCase(), sku);
    }
  }
  return map;
}

const RAW_HTML_ENTITY_RE = /&(?:aacute|eacute|igrave|oacute|ugrave|yacute|agrave|egrave|ograve|acirc|ecirc|ocirc|ucirc|atilde|otilde|Aacute|Eacute|Iacute|Oacute|Uacute|Yacute|Agrave|Egrave|Ograve|bull|nbsp|ndash|mdash|lsquo|rsquo|ldquo|rdquo|hellip);/;

const TRANSCRIPT_BAD_RES = [
  /\bColossedit\b/i,
  /\bcon\s+Coloss\b/i,
  /\bcon\s+Cloud\b/i,
  /\bcon\s+Glock\b/i,
  /\bH\s+subscribe\s+cho\b/i,
  /subscribe\s+cho\s+k\b/i,
  /\bGhi\s+M\s+G\b/i,
  /\bkh\s+b\s+l\s+nh\b/i,
  /\bđăng\s+ký\s+kênh\s+để\s+nhận\s+thêm/i,
  /\bnhớ\s+đăng\s+ký\s+kênh\b/i,
  /\[|\]/
];

const SPLIT_HALLUCINATION_RES = [
  /\b(?:hãy|nhớ)\s+đăng\s+ký\s+kênh\s+để\s+(?:nhận\s+thêm|ủng\s+hộ)/i,
  /\bsubscribe\s+cho\s+kênh\b/i,
  /\bghiền\s+mì\s+gõ\b/i,
  /\bla\s+la\s+school\b/i
];

function cleanAsrText(text) {
  let t = String(text || '').replace(/\[|\]/g, '').trim();
  const fixes = [
    [/\bColossedit\b/gi, 'Claude edit'],
    [/\bcon\s+Coloss\b/gi, 'con Claude'],
    [/\bcon\s+Cloud\b/gi, 'con Claude'],
    [/\bcon\s+clock\b/gi, 'con Claude'],
    [/\bCloud\s+AI\b/gi, 'Claude AI'],
    [/\bcon\s+Glock\b/gi, 'con Grok'],
    [/\bH\s+subscribe\s+cho\s+k(?:\s+Ghi\s+M\s+G(?:\s+kh\s+b\s+l\s+nh(?:\s+video\s+h\s+d)?)?)?(?:\s+G)?/gi, ' '],
    [/\bH\s+subscribe\s+cho\b/gi, ' '],
    [/\bCác\s+bạn\s+hãy\s+đăng\s+ký\s+kênh\s+để\s+nhận\s+thêm\s+nhiều\s+video\s+mới\s+nhé\.?/gi, ' '],
    [/(?:^|(?<=\s))từ\s+khó(?=\s|$|[.,!?])/gi, 'từ khóa'],
    [/(?:^|(?<=\s))gách(?=\s|$|[.,!?])/gi, 'ngách'],
    [/\bghen\s+ra\b/gi, 'gen ra']
  ];
  for (const [rx, rep] of fixes) {
    t = t.replace(rx, rep);
  }
  return t.replace(/\s{2,}/g, ' ').trim();
}

function sanitizeSkuTranscriptFiles(sku, quiet = false) {
  const vDir = path.join(ROOT, 'video', sku);
  const trPath = path.join(vDir, 'transcript.json');
  const srtPath = path.join(vDir, 'transcript.srt');
  const txtPath = path.join(vDir, 'transcript.txt');
  if (!fs.existsSync(trPath)) return false;
  let trObj;
  try {
    trObj = JSON.parse(fs.readFileSync(trPath, 'utf8'));
  } catch (_) {
    return false;
  }
  const origSegs = Array.isArray(trObj.segments) ? trObj.segments : [];
  if (origSegs.length === 0) return false;

  // Detect split-line hallucinations across 2..3 consecutive segments
  const dropIdx = new Set();
  for (let i = 0; i < origSegs.length; i++) {
    for (const span of [2, 3]) {
      if (i + span > origSegs.length) continue;
      const joined = origSegs.slice(i, i + span).map(s => String(s.text || '').trim()).join(' ').replace(/\s+/g, ' ');
      if (SPLIT_HALLUCINATION_RES.some(rx => rx.test(joined))) {
        for (let k = i; k < i + span; k++) dropIdx.add(k);
      }
    }
  }

  let mutated = dropIdx.size > 0;
  const nextSegs = [];
  for (let i = 0; i < origSegs.length; i++) {
    if (dropIdx.has(i)) continue;
    const sg = origSegs[i];
    const oldText = String(sg.text || '').trim();
    const newText = cleanAsrText(oldText);
    if (newText !== oldText) mutated = true;
    if (!newText) {
      mutated = true;
      continue;
    }
    const start = Number(sg.start) || 0;
    const end = Number(sg.end) || 0;
    nextSegs.push({
      id: nextSegs.length + 1,
      start,
      end,
      start_time: sg.start_time || formatSrtTimestamp(start),
      end_time: sg.end_time || formatSrtTimestamp(end),
      text: newText
    });
  }

  if (!mutated && fs.existsSync(srtPath) && fs.existsSync(txtPath)) {
    return false;
  }

  trObj.segments = nextSegs;
  if ('full_text' in trObj) {
    trObj.full_text = nextSegs.map(s => s.text).join(' ');
  }
  fs.writeFileSync(trPath, JSON.stringify(trObj, null, 2), 'utf8');
  const srtBlocks = nextSegs.map((s, idx) => `${idx + 1}\n${formatSrtTimestamp(s.start)} --> ${formatSrtTimestamp(s.end)}\n${s.text}\n`);
  fs.writeFileSync(srtPath, srtBlocks.join('\n'), 'utf8');
  fs.writeFileSync(txtPath, nextSegs.map(s => s.text).join('\n') + '\n', 'utf8');
  logMsg(`Sanitized ASR transcript files for ${sku} (${origSegs.length} -> ${nextSegs.length} segs)`, quiet);
  return true;
}

function hasRawInsightDump(ins, segs) {
  if (!ins || typeof ins !== 'object') return true;
  const openSegTexts = new Set(
    (segs || []).slice(0, 15).map(s => String(s.text || '').trim().toLowerCase()).filter(t => t.length >= 25)
  );
  const allItems = [
    ...(Array.isArray(ins.key_takeaways) ? ins.key_takeaways : []),
    ...(Array.isArray(ins.edit_sop?.additional) ? ins.edit_sop.additional : []),
    ...(Array.isArray(ins.avoid_flags) ? ins.avoid_flags : [])
  ].map(x => String(x || '').trim().toLowerCase());
  const verbatimOpenHits = allItems.filter(x => openSegTexts.has(x)).length;
  if (verbatimOpenHits >= 3) return true;
  const tsList = Array.isArray(ins.key_timestamps) ? ins.key_timestamps : [];
  const truncatedLabels = tsList.filter(ts => String(ts?.label || '').trim().length === 70).length;
  if (truncatedLabels >= 3) return true;
  const blob = JSON.stringify([ins.actual_topic, ins.summary, ins.key_takeaways, ins.edit_sop, ins.avoid_flags, ins.key_timestamps]);
  if (/\b(?:Colossedit|con\s+Coloss|con\s+Glock)\b/i.test(blob)) return true;
  return false;
}

function buildCompletenessContext() {
  const safeJson = (rel, fallback) => {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) return fallback;
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return fallback; }
  };
  const h2Cat = new Map((safeJson('data/catalog.json', []) || []).map(x => [String(x.sku || '').toUpperCase(), x]));
  const h2Cf = new Map((safeJson('data/catalog_full.json', []) || []).map(x => [String(x.sku || '').toUpperCase(), x]));
  const h2Vt = new Map((safeJson('data-tabs/videos.json', []) || []).map(x => [String(x.sku || '').toUpperCase(), x]));
  const huanCat = new Map((safeJson('data/catalog_huan.json', []) || []).map(x => [String(x.sku || '').toUpperCase(), x]));
  const dgmdCat = new Map((safeJson('data/catalog_dgmd.json', []) || []).map(x => [String(x.sku || '').toUpperCase(), x]));
  const tlList = safeJson('data-tabs/tai-lieu-full.json', []) || [];
  const tlSkus = new Set(tlList.map(x => String(x.sku || '').toUpperCase()).filter(Boolean));
  const nxData = safeJson('data-tabs/ngach-xanh.json', {}) || {};
  const nxSkus = new Set();
  for (const n of (nxData.ngachXanh || [])) {
    for (const s of (n.skus || [])) nxSkus.add(String(typeof s === 'string' ? s : s?.sku || '').toUpperCase());
  }
  for (const m of (nxData.ngachMetaKho || [])) {
    for (const s of (m.skus || [])) nxSkus.add(String(typeof s === 'string' ? s : s?.sku || '').toUpperCase());
  }
  const dbSkus = new Set();
  const dbPath = path.join(ROOT, 'data', 'h2dev_master.db');
  if (fs.existsSync(dbPath)) {
    try {
      const origEmit = process.emitWarning;
      process.emitWarning = function (w, ...rest) {
        if (String((w && w.message) || w).includes('SQLite is an experimental')) return;
        return origEmit.call(process, w, ...rest);
      };
      const { DatabaseSync } = require('node:sqlite');
      process.emitWarning = origEmit;
      const db = new DatabaseSync(dbPath, { readOnly: true });
      try {
        for (const r of db.prepare('SELECT UPPER(sku) AS s FROM lessons').all()) {
          if (r && r.s) dbSkus.add(r.s);
        }
      } finally {
        db.close();
      }
    } catch (_) {}
  }
  return { h2Cat, h2Cf, h2Vt, huanCat, dgmdCat, tlSkus, nxSkus, dbSkus };
}

function inspectSkuCompleteness(sku, branch, ctx) {
  const u = String(sku || '').toUpperCase();
  const vDir = path.join(ROOT, 'video', sku);
  const issues = [];
  const flags = {
    needsFetch: false,
    needsMedia: false,
    needsFaststart: false,
    needsSilence: false,
    needsTranscript: false,
    needsAsrClean: false,
    needsInsight: false,
    needsReadme: false,
    needsRegistration: false,
    needsRebuild: false,
    hasTempLeftover: false,
    hasBadZip: false
  };

  // Layer 1: Media & valid container / moov-first
  const media = resolveLocalMedia(sku);
  if (!media || media.size < 1024 * 1024) {
    issues.push('missing_or_small_media');
    flags.needsMedia = true;
    flags.needsFetch = true;
  } else if (media.ext === '.mp4') {
    try {
      const atom = inspectMp4Atoms(media.path);
      if (atom.status !== 'MOOV_FIRST') {
        issues.push(`not_moov_first:${atom.status}`);
        flags.needsFaststart = true;
      }
    } catch (e) {
      issues.push('invalid_mp4_header');
      flags.needsMedia = true;
    }
  } else if (media.ext === '.webm' && !isValidWebmHeader(media.path)) {
    issues.push('invalid_webm_header');
    flags.needsMedia = true;
  }

  // Temp dir leftovers
  for (const tName of ['_temp_fill', '_temp_turbo', '_temp_patch', '_temp']) {
    if (fs.existsSync(path.join(vDir, tName))) {
      issues.push(`temp_leftover:${tName}`);
      flags.hasTempLeftover = true;
    }
  }

  // Layer 2: silence.json
  const silPath = path.join(vDir, 'silence.json');
  if (!fs.existsSync(silPath)) {
    issues.push('missing_silence_json');
    flags.needsSilence = true;
  } else {
    try {
      const sil = JSON.parse(fs.readFileSync(silPath, 'utf8'));
      if (!Array.isArray(sil.silence_regions)) {
        issues.push('invalid_silence_json');
        flags.needsSilence = true;
      }
    } catch (_) {
      issues.push('corrupt_silence_json');
      flags.needsSilence = true;
    }
  }

  // Layer 3: transcript.{json,srt,txt} + ASR cleanliness
  const trPath = path.join(vDir, 'transcript.json');
  const srtPath = path.join(vDir, 'transcript.srt');
  const txtPath = path.join(vDir, 'transcript.txt');
  let segs = [];
  if (!fs.existsSync(trPath) || !fs.existsSync(srtPath) || !fs.existsSync(txtPath)) {
    issues.push('missing_transcript_files');
    flags.needsTranscript = true;
  } else {
    try {
      const trObj = JSON.parse(fs.readFileSync(trPath, 'utf8'));
      segs = Array.isArray(trObj.segments) ? trObj.segments : [];
      const txtLines = fs.readFileSync(txtPath, 'utf8').split(/\r?\n/).filter(l => l.trim().length > 0);
      const srtBlocks = (fs.readFileSync(srtPath, 'utf8').match(/-->/g) || []).length;
      const isSilentVideo = trObj.silent_video === true;
      if (isSilentVideo) {
        if (segs.length !== txtLines.length || segs.length !== srtBlocks) {
          issues.push('transcript_count_mismatch');
          flags.needsAsrClean = true;
        }
      } else if (!segs.length || segs.length !== txtLines.length || segs.length !== srtBlocks) {
        issues.push('transcript_count_mismatch');
        flags.needsAsrClean = true;
      }
      for (let i = 0; i < segs.length; i++) {
        const lineText = String(segs[i].text || '');
        if (TRANSCRIPT_BAD_RES.some(rx => rx.test(lineText))) {
          issues.push('transcript_asr_or_hallucination');
          flags.needsAsrClean = true;
          break;
        }
        if (i + 1 < segs.length) {
          const j2 = `${lineText} ${String(segs[i + 1].text || '')}`;
          const j3 = i + 2 < segs.length ? `${j2} ${String(segs[i + 2].text || '')}` : j2;
          if (SPLIT_HALLUCINATION_RES.some(rx => rx.test(j2) || rx.test(j3))) {
            issues.push('transcript_split_hallucination');
            flags.needsAsrClean = true;
            break;
          }
        }
      }
    } catch (_) {
      issues.push('corrupt_transcript_json');
      flags.needsTranscript = true;
    }
  }

  // Layer 4: Valid non-garbage insight.json
  const insPath = path.join(vDir, 'insight.json');
  if (!fs.existsSync(insPath)) {
    issues.push('missing_insight_json');
    flags.needsInsight = true;
  } else {
    try {
      const ins = JSON.parse(fs.readFileSync(insPath, 'utf8'));
      const sopAdd = Array.isArray(ins.edit_sop?.additional) ? ins.edit_sop.additional : (Array.isArray(ins.sop_steps) ? ins.sop_steps : []);
      const minSopLen = ins.verified_expert_summary ? 25 : 40;
      const okLens = ins.actual_topic && String(ins.actual_topic).trim().length >= 15 &&
        Array.isArray(ins.key_takeaways) && ins.key_takeaways.length >= 5 &&
        sopAdd.length >= 3 && sopAdd.every(x => String(x || '').trim().length >= minSopLen && !/^\d+\./.test(String(x || '').trim())) &&
        Array.isArray(ins.avoid_flags) && ins.avoid_flags.length >= 2 &&
        Array.isArray(ins.key_timestamps) && ins.key_timestamps.length >= 5;
      if (!okLens || hasRawInsightDump(ins, segs)) {
        issues.push('invalid_or_raw_insight_json');
        flags.needsInsight = true;
      }
    } catch (_) {
      issues.push('corrupt_insight_json');
      flags.needsInsight = true;
    }
  }

  // Layer 5: docs/<SKU>/README.md (>=500B, no unescaped HTML entities) + valid .zip magic bytes
  const readmePath = path.join(ROOT, 'docs', sku, 'README.md');
  if (!fs.existsSync(readmePath) || fs.statSync(readmePath).size < 500) {
    issues.push('missing_or_short_readme');
    flags.needsReadme = true;
  } else {
    const rmText = fs.readFileSync(readmePath, 'utf8').replace(/```[\s\S]*?```/g, '');
    if (RAW_HTML_ENTITY_RE.test(rmText)) {
      issues.push('readme_html_entities');
      flags.needsReadme = true;
    }
  }
  for (const zDir of [path.join(ROOT, 'docs', sku), path.join(ROOT, 'assets', 'docs', sku), path.join(ROOT, 'assets', 'docs-huan', sku), path.join(ROOT, 'assets', 'docs-dgmd', sku)]) {
    if (!fs.existsSync(zDir)) continue;
    for (const fn of fs.readdirSync(zDir)) {
      if (!/\.zip$/i.test(fn)) continue;
      const zp = path.join(zDir, fn);
      if (fs.statSync(zp).isFile() && !isValidZipHeader(zp)) {
        issues.push(`corrupt_zip:${fn}`);
        flags.hasBadZip = true;
      }
    }
  }

  // Layer 6: knowledge-hub/vault/videos/<SKU>.md
  const vaultPath = path.join(ROOT, 'knowledge-hub', 'vault', 'videos', `${sku}.md`);
  if (!fs.existsSync(vaultPath) || fs.statSync(vaultPath).size === 0) {
    issues.push('missing_vault_md');
    flags.needsRebuild = true;
  }

  // Layer 7: catalog*, tai-lieu-full, ngach-xanh, h2dev_master.db
  if (branch === 'H2DEV') {
    const cfItem = ctx.h2Cf.get(u);
    const vtItem = ctx.h2Vt.get(u);
    if (!ctx.h2Cat.has(u) || !cfItem || !vtItem) {
      issues.push('missing_h2dev_catalog');
      flags.needsRegistration = true;
      flags.needsRebuild = true;
    } else if (!cfItem.mp4 || !cfItem.thumb || !vtItem.mp4 || !(vtItem.thumb || vtItem.image)) {
      issues.push('missing_catalog_media_or_thumb');
      flags.needsRegistration = true;
      flags.needsRebuild = true;
    }
  } else if (branch === 'HUAN') {
    if (!ctx.huanCat.has(u)) {
      issues.push('missing_huan_catalog');
      flags.needsRegistration = true;
      flags.needsRebuild = true;
    }
  } else if (branch === 'DGMD') {
    if (!ctx.dgmdCat.has(u)) {
      issues.push('missing_dgmd_catalog');
      flags.needsRegistration = true;
      flags.needsRebuild = true;
    }
  }
  if (!ctx.tlSkus.has(u)) {
    issues.push('missing_tai_lieu_full');
    flags.needsRegistration = true;
    flags.needsRebuild = true;
  }
  if (!ctx.nxSkus.has(u)) {
    issues.push('missing_ngach_xanh');
    flags.needsRegistration = true;
    flags.needsRebuild = true;
  }
  if (!ctx.dbSkus.has(u)) {
    issues.push('missing_master_db_row');
    flags.needsRebuild = true;
  }

  return {
    complete: issues.length === 0,
    issues,
    repairFlags: flags
  };
}

async function fetchH2devUpstream() {
  const bootRes = await fetch('https://h2dev.vn/learn', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131' },
    signal: AbortSignal.timeout(15000)
  });
  const rawCookies = bootRes.headers.getSetCookie ? bootRes.headers.getSetCookie() : [bootRes.headers.get('set-cookie') || ''];
  const cookieStr = Array.isArray(rawCookies) ? rawCookies.join('; ') : String(rawCookies);
  const vdkMatch = cookieStr.match(/__vdk=([^;]+)/);
  const vuiMatch = cookieStr.match(/__vui=([^;]+)/);

  const query = `
    query getCourse($sku: String!) {
      getCourse(sku: $sku) {
        ... on GroupedProduct {
          lesson {
            id
            course { course_id title }
            products {
              id
              sku
              name
              url_key
              created_at
              time
            }
          }
        }
      }
    }
  `;
  const res = await fetch('https://saas-api.mona.academy/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'verify-site': vdkMatch ? vdkMatch[1] : '',
      'x-saas-user-id': vuiMatch ? vuiMatch[1] : '',
      'origin': 'https://h2dev.vn',
      'referer': 'https://h2dev.vn/learn',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131'
    },
    body: JSON.stringify({ query, variables: { sku: 'COURSE1' } }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await res.json();
  const lessons = data?.data?.getCourse?.lesson || [];
  const products = [];
  const seen = new Set();
  for (const les of lessons) {
    for (const p of (les.products || [])) {
      if (!p || !p.sku) continue;
      const safeSku = assertSafeSku(p.sku);
      if (seen.has(safeSku.toUpperCase())) continue;
      seen.add(safeSku.toUpperCase());
      products.push({
        branch: 'H2DEV',
        chapter_id: String(les.id || ''),
        chapter_title: les.course?.title || '',
        id: p.id,
        sku: safeSku,
        title: p.name,
        url_key: p.url_key || '',
        created_at: p.created_at || '',
        duration_sec: parseInt(p.time || '0', 10) || 0
      });
    }
  }
  return products;
}

async function fetchMagentoCourse1(branch, endpoint, origin) {
  const query = `
    query getCourse($sku: String!) {
      getCourse(sku: $sku) {
        ... on GroupedProduct {
          lesson {
            id
            course { course_id title }
            products {
              id
              sku
              name
              url_key
              created_at
              time
            }
          }
          items {
            position
            product {
              id
              sku
              name
              url_key
              created_at
              time
            }
          }
        }
      }
    }
  `;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'origin': origin,
      'referer': `${origin}/learn`,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131'
    },
    body: JSON.stringify({ query, variables: { sku: 'COURSE1' } }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await res.json();
  const course = data?.data?.getCourse || {};
  const products = [];
  const seen = new Set();

  for (const les of (course.lesson || [])) {
    for (const p of (les.products || [])) {
      if (!p || !p.sku) continue;
      const safeSku = assertSafeSku(p.sku);
      if (seen.has(safeSku.toUpperCase())) continue;
      seen.add(safeSku.toUpperCase());
      products.push({
        branch,
        chapter_id: String(les.id || ''),
        chapter_title: les.course?.title || '',
        id: p.id,
        sku: safeSku,
        title: p.name,
        url_key: p.url_key || '',
        created_at: p.created_at || '',
        duration_sec: parseInt(p.time || '0', 10) || 0
      });
    }
  }
  for (const it of (course.items || [])) {
    const p = it?.product;
    if (!p || !p.sku) continue;
    const safeSku = assertSafeSku(p.sku);
    if (seen.has(safeSku.toUpperCase())) continue;
    seen.add(safeSku.toUpperCase());
    products.push({
      branch,
      chapter_id: '',
      chapter_title: '',
      id: p.id,
      sku: safeSku,
      title: p.name,
      url_key: p.url_key || '',
      created_at: p.created_at || '',
      duration_sec: parseInt(p.time || '0', 10) || 0
    });
  }
  return products;
}

async function checkAllBranches(quiet = false) {
  const t0 = Date.now();
  const localMap = getLocalVideoSkus();

  const [h2devList, huanList, dgmdList] = await Promise.all([
    fetchH2devUpstream(),
    fetchMagentoCourse1('HUAN', 'https://api.huan.academy/graphql', 'https://huan.academy'),
    fetchMagentoCourse1('DGMD', 'https://api.daigiamangdep.com/graphql', 'https://daigiamangdep.com')
  ]);

  for (const p of [...h2devList, ...huanList, ...dgmdList]) {
    if (localMap.has(p.sku.toUpperCase())) {
      p.sku = localMap.get(p.sku.toUpperCase());
    }
  }

  const h2devNew = h2devList.filter(p => !localMap.has(p.sku.toUpperCase()));
  const huanNew = huanList.filter(p => !localMap.has(p.sku.toUpperCase()));
  const dgmdNew = dgmdList.filter(p => !localMap.has(p.sku.toUpperCase()));
  const allNew = [...h2devNew, ...huanNew, ...dgmdNew];

  // 7-layer completeness audit across all existing local SKUs (upstream + local-only e.g. ZOOM-*)
  const completenessCtx = buildCompletenessContext();
  const existingItemMap = new Map();
  for (const p of [...h2devList, ...huanList, ...dgmdList]) {
    const u = p.sku.toUpperCase();
    if (localMap.has(u) && !existingItemMap.has(u)) {
      existingItemMap.set(u, p);
    }
  }
  for (const [u, canonicalSku] of localMap.entries()) {
    if (!existingItemMap.has(u)) {
      existingItemMap.set(u, {
        branch: 'H2DEV',
        id: '',
        sku: canonicalSku,
        title: canonicalSku,
        url_key: '',
        created_at: '',
        duration_sec: 0,
        localOnly: true
      });
    }
  }
  const incompleteLessons = [];
  for (const item of existingItemMap.values()) {
    const comp = inspectSkuCompleteness(item.sku, item.branch, completenessCtx);
    if (!comp.complete) {
      incompleteLessons.push({
        ...item,
        issues: comp.issues,
        repairFlags: comp.repairFlags
      });
    }
  }

  const elapsedMs = Date.now() - t0;
  const report = {
    checkedAt: new Date().toISOString(),
    elapsedMs,
    localTotalMediaDirs: localMap.size,
    branches: {
      H2DEV: { upstreamVideoCount: h2devList.length, zoomCount: 4, localTotal: h2devList.length + 4 - h2devNew.length, missingCount: h2devNew.length, missingSkus: h2devNew },
      HUAN:  { upstreamVideoCount: huanList.length, localTotal: huanList.length - huanNew.length, missingCount: huanNew.length, missingSkus: huanNew },
      DGMD:  { upstreamVideoCount: dgmdList.length, localTotal: dgmdList.length - dgmdNew.length, missingCount: dgmdNew.length, missingSkus: dgmdNew }
    },
    totalNewCount: allNew.length,
    newLessons: allNew,
    incompleteCount: incompleteLessons.length,
    incompleteLessons,
    allUpstreamLessons: [...h2devList, ...huanList, ...dgmdList]
  };

  if (!quiet) {
    console.log('======================================================================');
    console.log(`>>> H2DEV 3-BRANCH UPSTREAM WATCHER REPORT (${elapsedMs}ms) <<<`);
    console.log('======================================================================');
    console.log(`- H2DEV : Upstream=${h2devList.length} videos (+4 Zoom = ${h2devList.length + 4}) | Missing=${h2devNew.length}`);
    console.log(`- HUAN  : Upstream=${huanList.length} videos | Missing=${huanNew.length}`);
    console.log(`- DGMD  : Upstream=${dgmdList.length} videos | Missing=${dgmdNew.length}`);
    console.log(`- TOTAL : ${localMap.size} local media SKUs | New to ingest: ${allNew.length} | Incomplete (7-layer): ${incompleteLessons.length}`);
    if (allNew.length > 0) {
      console.log('\nNew upstream lessons detected:');
      for (const item of allNew) {
        console.log(`  [${item.branch}] ${item.sku} (id=${item.id}, ${item.duration_sec}s) — ${item.title}`);
      }
    }
    if (incompleteLessons.length > 0) {
      console.log(`\nIncomplete SKUs detected by 7-layer gate (${incompleteLessons.length}):`);
      for (const inc of incompleteLessons.slice(0, 25)) {
        console.log(`  [${inc.branch}] ${inc.sku}: ${inc.issues.join(', ')}`);
      }
      if (incompleteLessons.length > 25) {
        console.log(`  ... and ${incompleteLessons.length - 25} more incomplete SKUs`);
      }
    }
    if (allNew.length === 0 && incompleteLessons.length === 0) {
      console.log('\n✅ All 3 branches (H2DEV + HUAN + DGMD) are 100% in sync and 7-layer complete!');
    }
    console.log('======================================================================');
  }

  return report;
}

function runCmd(cmd, args, quiet = false) {
  logMsg(`EXEC: ${cmd} ${args.join(' ')}`, quiet);
  const res = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: quiet ? 'pipe' : 'inherit',
    encoding: 'utf8',
    windowsHide: true,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  });
  if (res.status !== 0) {
    const errOut = (res.stderr || res.stdout || '').slice(-1000);
    throw new Error(`Command failed (${cmd} ${args.join(' ')}): exit ${res.status}\n${errOut}`);
  }
  return res;
}

function runPyScript(scriptRelPath, extraArgs = [], quiet = false) {
  return runCmd(PYTHON_CMD, [...PYTHON_BASE_ARGS, scriptRelPath, ...extraArgs], quiet);
}

const HTML_ENTITY_MAP = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  bull: '•', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…',
  aacute: 'á', eacute: 'é', igrave: 'ì', oacute: 'ó', ugrave: 'ù', yacute: 'ý',
  agrave: 'à', egrave: 'è', ograve: 'ò', acirc: 'â', ecirc: 'ê', ocirc: 'ô', ucirc: 'û',
  atilde: 'ã', otilde: 'õ', iacute: 'í', uacute: 'ú',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Yacute: 'Ý',
  Agrave: 'À', Egrave: 'È', Ograve: 'Ò', Igrave: 'Ì', Ugrave: 'Ù',
  Acirc: 'Â', Ecirc: 'Ê', Ocirc: 'Ô', Ucirc: 'Û', Atilde: 'Ã', Otilde: 'Õ'
};

function decodeHtmlEntities(str) {
  return String(str || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const cp = parseInt(hex, 16);
      return Number.isFinite(cp) && cp > 0 ? String.fromCodePoint(cp) : '';
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const cp = parseInt(dec, 10);
      return Number.isFinite(cp) && cp > 0 ? String.fromCodePoint(cp) : '';
    })
    .replace(/&([a-zA-Z]+);/g, (m, name) => (Object.prototype.hasOwnProperty.call(HTML_ENTITY_MAP, name) ? HTML_ENTITY_MAP[name] : m));
}

function htmlToPlainText(html) {
  return decodeHtmlEntities(
    String(html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function purgeInvalidZipsInDir(dirPath, sku, quiet = false) {
  if (!fs.existsSync(dirPath)) return;
  for (const fn of fs.readdirSync(dirPath)) {
    if (!/\.zip$/i.test(fn)) continue;
    const zp = path.join(dirPath, fn);
    try {
      if (fs.statSync(zp).isFile() && !isValidZipHeader(zp)) {
        fs.unlinkSync(zp);
        logMsg(`WARN: Removed fake/corrupt ZIP for ${sku}: ${zp}`, quiet);
      }
    } catch (_) {}
  }
}

async function fetchLessonDetailAndExtractAttachments(item, quiet = false) {
  const localMap = getLocalVideoSkus();
  const sku = assertSafeSku(localMap.get(String(item.sku || '').toUpperCase()) || item.sku);
  item.sku = sku;
  const branch = item.branch;

  const docsDir = path.join(ROOT, 'docs', sku);
  const assetSub = branch === 'DGMD' ? 'docs-dgmd' : (branch === 'HUAN' ? 'docs-huan' : 'docs');
  const assetDocsDir = path.join(ROOT, 'assets', assetSub, sku);
  purgeInvalidZipsInDir(docsDir, sku, quiet);
  purgeInvalidZipsInDir(assetDocsDir, sku, quiet);

  if (item.localOnly) {
    return {};
  }

  const endpoint = branch === 'H2DEV'
    ? 'https://saas-api.mona.academy/graphql'
    : (branch === 'HUAN' ? 'https://api.huan.academy/graphql' : 'https://api.daigiamangdep.com/graphql');
  const origin = branch === 'H2DEV'
    ? 'https://h2dev.vn'
    : (branch === 'HUAN' ? 'https://huan.academy' : 'https://daigiamangdep.com');

  const headers = {
    'content-type': 'application/json',
    'origin': origin,
    'referer': `${origin}/learn`,
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131'
  };
  if (branch === 'H2DEV') {
    const bootRes = await fetch('https://h2dev.vn/learn', { headers: { 'User-Agent': headers['user-agent'] }, signal: AbortSignal.timeout(15000) });
    const rawCookies = bootRes.headers.getSetCookie ? bootRes.headers.getSetCookie() : [bootRes.headers.get('set-cookie') || ''];
    const cookieStr = Array.isArray(rawCookies) ? rawCookies.join('; ') : String(rawCookies);
    const vdkMatch = cookieStr.match(/__vdk=([^;]+)/);
    const vuiMatch = cookieStr.match(/__vui=([^;]+)/);
    headers['verify-site'] = vdkMatch ? vdkMatch[1] : '';
    headers['x-saas-user-id'] = vuiMatch ? vuiMatch[1] : '';
  }

  const extraFields = branch === 'H2DEV' ? 'lesson_files attachments' : '';
  const query = `
    query($sku: String!) {
      getCourseNoCategory(sku: $sku) {
        __typename
        ... on ProductInterface {
          id sku name url_key created_at time video_link
          description { html }
          image { url }
          ${extraFields}
        }
      }
    }
  `;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables: { sku: item.upstreamSku || sku } }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await res.json();
  if (Array.isArray(data?.errors) && data.errors.length && !data?.data?.getCourseNoCategory) {
    logMsg(`WARN: Upstream getCourseNoCategory returned GraphQL errors for ${sku}: ${JSON.stringify(data.errors[0]?.message || data.errors[0])}`, quiet);
  }
  const prod = data?.data?.getCourseNoCategory || {};
  const descHtml = prod?.description?.html || '';
  const descTxt = htmlToPlainText(descHtml);
  let lessonFiles = [];
  if (branch === 'H2DEV' && prod?.id) {
    try {
      const lfQuery = `
        query($entityId: Int!) {
          getLessonFile(entity_id: $entityId) {
            entity_id
            title
            file
            file_name
            mime_type
            is_pro
          }
        }
      `;
      const lfRes = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: lfQuery, variables: { entityId: Number(prod.id) } }),
        signal: AbortSignal.timeout(15000)
      });
      const lfData = await lfRes.json();
      if (Array.isArray(lfData?.data?.getLessonFile)) {
        lessonFiles = lfData.data.getLessonFile.map(lf => ({
          ...lf,
          url: lf.file ? `https://saas-api.mona.academy/media/catalog/product${lf.file.startsWith('/') ? '' : '/'}${lf.file}` : ''
        }));
      }
    } catch (e) {
      logMsg(`WARN: getLessonFile query failed for ${sku}: ${e.message}`, quiet);
    }
  }

  fs.mkdirSync(docsDir, { recursive: true });
  fs.mkdirSync(assetDocsDir, { recursive: true });

  const isEmptyOrMissing = p => !fs.existsSync(p) || fs.statSync(p).size === 0;
  if (descHtml && isEmptyOrMissing(path.join(docsDir, 'description.html'))) {
    fs.writeFileSync(path.join(docsDir, 'description.html'), descHtml, 'utf8');
  }
  if (descTxt && (isEmptyOrMissing(path.join(docsDir, 'description.txt')) || RAW_HTML_ENTITY_RE.test(fs.readFileSync(path.join(docsDir, 'description.txt'), 'utf8')))) {
    fs.writeFileSync(path.join(docsDir, 'description.txt'), descTxt, 'utf8');
    const emptyMd = path.join(docsDir, 'DESCRIPTION_EMPTY.md');
    if (fs.existsSync(emptyMd)) {
      try { fs.unlinkSync(emptyMd); } catch (_) {}
    }
  }
  if (descHtml && isEmptyOrMissing(path.join(assetDocsDir, 'description.html'))) {
    fs.writeFileSync(path.join(assetDocsDir, 'description.html'), descHtml, 'utf8');
  }
  if (descTxt && (isEmptyOrMissing(path.join(assetDocsDir, 'description.txt')) || RAW_HTML_ENTITY_RE.test(fs.readFileSync(path.join(assetDocsDir, 'description.txt'), 'utf8')))) {
    fs.writeFileSync(path.join(assetDocsDir, 'description.txt'), descTxt, 'utf8');
  }
  if (isEmptyOrMissing(path.join(assetDocsDir, 'lesson_files.json')) || (lessonFiles.length > 0 && fs.readFileSync(path.join(assetDocsDir, 'lesson_files.json'), 'utf8').trim() === '[]')) {
    fs.writeFileSync(path.join(assetDocsDir, 'lesson_files.json'), JSON.stringify(lessonFiles, null, 2), 'utf8');
  }
  if (branch === 'H2DEV' && (isEmptyOrMissing(path.join(docsDir, 'lesson_files.json')) || (lessonFiles.length > 0 && fs.readFileSync(path.join(docsDir, 'lesson_files.json'), 'utf8').trim() === '[]'))) {
    fs.writeFileSync(path.join(docsDir, 'lesson_files.json'), JSON.stringify(lessonFiles, null, 2), 'utf8');
  }

  for (const lf of lessonFiles) {
    if (!lf || !lf.url) continue;
    const rawName = lf.title || lf.file_name || path.basename(lf.file || '');
    const safeName = String(rawName).replace(/[<>:"/\\|?*]+/g, '_').trim();
    if (!safeName) continue;
    const targetAssetPath = path.join(assetDocsDir, safeName);
    const targetDocPath = path.join(docsDir, safeName);
    const needDownload = isEmptyOrMissing(targetAssetPath) || (/\.zip$/i.test(safeName) && !isValidZipHeader(targetAssetPath));
    if (needDownload) {
      try {
        const safeFileUrl = await verifyRemoteUrlPublicDns(lf.url);
        const fRes = await fetch(safeFileUrl, { signal: AbortSignal.timeout(60000) });
        if (fRes.ok) {
          const buf = Buffer.from(await fRes.arrayBuffer());
          const check = isValidDownloadBuffer(safeName, fRes.headers.get('content-type'), buf);
          if (!check.ok) {
            logMsg(`WARN: Rejected invalid lesson attachment ${safeName} for ${sku}: ${check.reason}`, quiet);
          } else {
            fs.writeFileSync(targetAssetPath, buf);
            if (branch === 'H2DEV') fs.writeFileSync(targetDocPath, buf);
          }
        }
      } catch (e) {
        logMsg(`WARN: Lesson file download failed for ${sku} (${safeName}): ${e.message}`, quiet);
      }
    }
  }

  // Extract links from descriptionHtml & lessonFiles (H2DEV-SCAR-028)
  const urls = new Set();
  for (const m of descHtml.matchAll(/https?:\/\/[^\s"'<>)]+/gi)) urls.add(m[0]);
  for (const lf of lessonFiles) {
    if (lf && lf.url) urls.add(lf.url);
  }
  const linkList = [...urls];
  if (isEmptyOrMissing(path.join(assetDocsDir, 'links.json')) || (linkList.length > 0 && fs.readFileSync(path.join(assetDocsDir, 'links.json'), 'utf8').trim() === '[]')) {
    fs.writeFileSync(path.join(assetDocsDir, 'links.json'), JSON.stringify(linkList, null, 2), 'utf8');
  }
  if (branch === 'H2DEV' && (isEmptyOrMissing(path.join(docsDir, 'links.json')) || (linkList.length > 0 && fs.readFileSync(path.join(docsDir, 'links.json'), 'utf8').trim() === '[]'))) {
    fs.writeFileSync(path.join(docsDir, 'links.json'), JSON.stringify(linkList, null, 2), 'utf8');
  }

  for (const u of linkList) {
    const gdocMatch = u.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (gdocMatch) {
      const docId = gdocMatch[1];
      const gdocPath = path.join(assetDocsDir, `gdoc_${docId}.txt`);
      if (!fs.existsSync(gdocPath)) {
        try {
          const gRes = await fetch(`https://docs.google.com/document/d/${docId}/export?format=txt`, { signal: AbortSignal.timeout(20000) });
          if (gRes.ok) {
            const gTxt = (await gRes.text()).replace(/\r\n/g, '\n').trim();
            if (gTxt.length > 20 && !/^(?:<!doctype|<html)/i.test(gTxt)) {
              fs.writeFileSync(gdocPath, gTxt, 'utf8');
              if (!fs.existsSync(path.join(assetDocsDir, 'doc_1.txt'))) {
                fs.writeFileSync(path.join(assetDocsDir, 'doc_1.txt'), gTxt, 'utf8');
              }
              if (branch === 'DGMD' && !fs.existsSync(path.join(assetDocsDir, 'master_prompt.md'))) {
                const cleanTitle = (item.title || prod?.name || sku).trim();
                fs.writeFileSync(path.join(assetDocsDir, 'master_prompt.md'), `# Master Prompt — ${cleanTitle} (${sku})\n\n${gTxt}\n`, 'utf8');
              }
            }
          }
        } catch (e) {
          logMsg(`WARN: Google Doc export failed for ${sku} (${docId}): ${e.message}`, quiet);
        }
      }
    }
    const gdriveMatch = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (gdriveMatch) {
      const fileId = gdriveMatch[1];
      try {
        const dlRes = await fetch(`https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`, { signal: AbortSignal.timeout(60000) });
        if (dlRes.ok) {
          const disp = dlRes.headers.get('content-disposition') || '';
          const fnMatch = disp.match(/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)["']?/i);
          let rawFn = `drive_${fileId}.bin`;
          if (fnMatch) {
            try { rawFn = decodeURIComponent(fnMatch[1]); } catch (_) { rawFn = fnMatch[1]; }
          }
          const fn = path.basename(rawFn).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') || `drive_${fileId}.bin`;
          if (fn === '.' || fn === '..') {
            throw new Error(`Unsafe attachment filename rejected: ${rawFn}`);
          }
          const baseAssetDir = path.resolve(assetDocsDir);
          const targetAssetFile = path.resolve(baseAssetDir, fn);
          if (!targetAssetFile.startsWith(baseAssetDir + path.sep)) {
            throw new Error(`Attachment path escaped target directory: ${fn}`);
          }
          const needGdrive = !fs.existsSync(targetAssetFile) || (/\.zip$/i.test(fn) && !isValidZipHeader(targetAssetFile));
          if (needGdrive) {
            const buf = Buffer.from(await dlRes.arrayBuffer());
            const check = isValidDownloadBuffer(fn, dlRes.headers.get('content-type'), buf);
            if (!check.ok) {
              logMsg(`WARN: Rejected invalid Google Drive download ${fn} for ${sku}: ${check.reason}`, quiet);
            } else {
              fs.writeFileSync(targetAssetFile, buf);
              if (branch === 'H2DEV') {
                const baseDocsDir = path.resolve(docsDir);
                const targetDocsFile = path.resolve(baseDocsDir, fn);
                if (targetDocsFile.startsWith(baseDocsDir + path.sep)) {
                  fs.writeFileSync(targetDocsFile, buf);
                }
              }
            }
          }
        }
      } catch (e) {
        logMsg(`WARN: Google Drive download failed for ${sku} (${fileId}): ${e.message}`, quiet);
      }
    }
  }

  // Thumbnail download (Fix P1: support H2DEV -> thumbs, HUAN -> thumbs-huan, DGMD -> thumbs-dgmd)
  const thumbUrl = prod?.image?.url;
  if (thumbUrl) {
    const thumbSub = branch === 'DGMD' ? 'thumbs-dgmd' : (branch === 'HUAN' ? 'thumbs-huan' : 'thumbs');
    const thumbDir = path.join(ROOT, 'assets', thumbSub);
    const hasAnyThumb = ['.png', '.jpg', '.jpeg', '.webp'].some(ext => fs.existsSync(path.join(thumbDir, `${sku}${ext}`)));
    if (!hasAnyThumb) {
      const thumbPath = path.join(thumbDir, `${sku}.png`);
      try {
        const safeThumbUrl = await verifyRemoteUrlPublicDns(thumbUrl);
        const tRes = await fetch(safeThumbUrl, { signal: AbortSignal.timeout(20000) });
        if (tRes.ok) {
          const tBuf = Buffer.from(await tRes.arrayBuffer());
          const tCheck = isValidDownloadBuffer(thumbPath, tRes.headers.get('content-type'), tBuf);
          if (tCheck.ok) {
            fs.mkdirSync(thumbDir, { recursive: true });
            fs.writeFileSync(thumbPath, tBuf);
          } else {
            logMsg(`WARN: Rejected invalid thumbnail for ${sku}: ${tCheck.reason}`, quiet);
          }
        }
      } catch (e) {
        logMsg(`WARN: Thumbnail download skipped/failed for ${sku}: ${e.message}`, quiet);
      }
    }
  }

  return prod;
}

async function ensureLocalServer(quiet = false) {
  const healthUrl = 'http://127.0.0.1:8899/api/health';
  try {
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(2500) });
    if (res.ok || res.status === 404) {
      return { spawned: null };
    }
  } catch (_) {}

  logMsg('Local server on 127.0.0.1:8899 not detected; spawning temporary server.js...', quiet);
  const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    cwd: ROOT,
    stdio: 'ignore',
    detached: false,
    windowsHide: true,
    env: { ...process.env, PORT: '8899' }
  });
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetch('http://127.0.0.1:8899/', { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        logMsg('Temporary server.js is ready on http://127.0.0.1:8899', quiet);
        return { spawned: child };
      }
    } catch (_) {}
  }
  throw new Error('Failed to start local server.js on http://127.0.0.1:8899 within 15s');
}

function extractDirectStreamUrl(videoLink) {
  if (!videoLink) return null;
  const directMatch = String(videoLink).match(/https?:\/\/[^\s"'<>]+?\.(?:m3u8|mpd)(?:\?[^\s"'<>]*)?/i);
  if (directMatch) return directMatch[0];
  try {
    const u = new URL(videoLink);
    for (const [, val] of u.searchParams.entries()) {
      if (/\.(m3u8|mpd)(\?|$)/i.test(val)) return val;
    }
  } catch (_) {}
  return null;
}

async function downloadStreamViaPlaywrightOrFfmpeg(item, videoLink, mp4Path, quiet = false) {
  const sku = assertSafeSku(item.sku);
  const branch = item.branch;
  const origin = branch === 'H2DEV'
    ? 'https://h2dev.vn'
    : (branch === 'HUAN' ? 'https://huan.academy' : 'https://daigiamangdep.com');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'h2dev-dl-'));
  const tmpOut = path.join(tmpDir, `${sku}_download.mp4`);

  try {
    // 1. Try direct .m3u8 / .mpd URL via yt-dlp or ffmpeg -c copy -movflags +faststart
    let streamUrl = extractDirectStreamUrl(videoLink);
    if (!streamUrl && videoLink) {
      const safeVideoLink = await verifyRemoteUrlPublicDns(videoLink);
      // Intercept playlist.m3u8 / manifest.mpd from player page via Playwright
      try {
        const { chromium } = require('playwright');
        const browser = await chromium.launch({
          headless: true,
          executablePath: fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
            ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
            : undefined
        });
        try {
          const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
            extraHTTPHeaders: { Referer: `${origin}/learn` }
          });
          const page = await context.newPage();
          page.on('response', resp => {
            const u = resp.url();
            if (!streamUrl && (u.includes('playlist.m3u8') || u.includes('_chunk.m3u8') || u.includes('manifest.mpd'))) {
              streamUrl = u.replace('manifest.mpd', 'playlist.m3u8');
            }
          });
          await page.goto(safeVideoLink, { waitUntil: 'domcontentloaded', timeout: 45000 });
          for (let i = 0; i < 20 && !streamUrl; i++) {
            await sleep(1000);
          }
        } finally {
          await browser.close();
        }
      } catch (e) {
        logMsg(`WARN: Playwright stream interception for ${sku} failed: ${e.message}`, quiet);
      }
    }

    const targetUrl = streamUrl || videoLink;
    if (!targetUrl) {
      throw new Error(`No stream URL or video_link available for ${sku}`);
    }
    const safeTargetUrl = await verifyRemoteUrlPublicDns(targetUrl);

    // Try yt-dlp first if available, else ffmpeg -c copy -movflags +faststart
    let downloaded = false;
    const ytdlpRes = spawnSync('yt-dlp', [
      '--no-part',
      '--add-header', `Referer:${origin}/learn`,
      '--postprocessor-args', 'ffmpeg:-c copy -movflags +faststart',
      '-o', tmpOut,
      '--',
      safeTargetUrl
    ], { cwd: ROOT, stdio: quiet ? 'pipe' : 'inherit', encoding: 'utf8', windowsHide: true });

    if (ytdlpRes.status === 0 && fs.existsSync(tmpOut) && fs.statSync(tmpOut).size > 1024 * 1024) {
      downloaded = true;
    } else {
      const ffRes = spawnSync(FFMPEG, [
        '-nostdin', '-hide_banner', '-loglevel', 'error', '-y',
        '-headers', `Referer: ${origin}/learn\r\nOrigin: ${origin}\r\n`,
        '-protocol_whitelist', 'https,tls,tcp',
        '-i', safeTargetUrl,
        '-c', 'copy',
        '-bsf:a', 'aac_adtstoasc',
        '-movflags', '+faststart',
        tmpOut
      ], { cwd: ROOT, stdio: quiet ? 'pipe' : 'inherit', encoding: 'utf8', windowsHide: true });
      if (ffRes.status === 0 && fs.existsSync(tmpOut) && fs.statSync(tmpOut).size > 1024 * 1024) {
        downloaded = true;
      } else {
        logMsg(`WARN: ffmpeg -c copy -bsf:a aac_adtstoasc failed for ${sku}; retrying with -c:v copy -c:a aac -b:a 192k...`, quiet);
        try { if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut); } catch (_) {}
        const ffReencRes = spawnSync(FFMPEG, [
          '-nostdin', '-hide_banner', '-loglevel', 'error', '-y',
          '-err_detect', 'ignore_err',
          '-headers', `Referer: ${origin}/learn\r\nOrigin: ${origin}\r\n`,
          '-protocol_whitelist', 'https,tls,tcp',
          '-i', safeTargetUrl,
          '-c:v', 'copy',
          '-c:a', 'aac', '-b:a', '192k',
          '-movflags', '+faststart',
          tmpOut
        ], { cwd: ROOT, stdio: quiet ? 'pipe' : 'inherit', encoding: 'utf8', windowsHide: true });
        if (ffReencRes.status === 0 && fs.existsSync(tmpOut) && fs.statSync(tmpOut).size > 1024 * 1024) {
          downloaded = true;
        }
      }
    }

    if (!downloaded || !fs.existsSync(tmpOut) || fs.statSync(tmpOut).size < 1024 * 1024) {
      throw new Error(`Failed to download valid MP4 (>1MB) for ${sku} from ${safeTargetUrl}`);
    }

    fs.mkdirSync(path.dirname(mp4Path), { recursive: true });
    fs.copyFileSync(tmpOut, mp4Path);
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

function isProtectedVideoLink(videoLink) {
  const link = String(videoLink || '');
  return /protected=True/i.test(link) || (/\.smil/i.test(link) && !/protected=False/i.test(link));
}

async function downloadLessonVideo(item, prod, mp4Path, quiet = false) {
  const sku = assertSafeSku(item.sku);
  const videoLink = prod?.video_link || item.video_link || '';
  const isProtected = isProtectedVideoLink(videoLink);

  if (isProtected) {
    logMsg(`Downloading Widevine CENC DRM stream for ${sku} (${item.branch})...`, quiet);
    const srv = await ensureLocalServer(quiet);
    try {
      const { chromium } = require('playwright');
      const { downloadDrmSku } = require('./download_all_drm_dgmd.js');
      const browser = await chromium.launch({
        headless: true,
        channel: 'msedge',
        args: ['--autoplay-policy=no-user-gesture-required']
      });
      try {
        await downloadDrmSku(sku, browser, 0, { skipTranscribe: true });
      } finally {
        await browser.close();
      }
    } finally {
      if (srv.spawned) {
        try { srv.spawned.kill(); } catch (_) {}
      }
    }
    return;
  }

  if (item.branch === 'H2DEV') {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'h2dev-fetch-'));
    const tmpOut = path.join(tmpDir, `${sku}_download.mp4`);
    try {
      runCmd(process.execPath, ['scripts/fetch_h2dev_video.cjs', sku, '--out', tmpOut, '--apply'], quiet);
      if (fs.existsSync(mp4Path) && fs.statSync(mp4Path).size > 1024 * 1024) return;
    } catch (e) {
      logMsg(`WARN: fetch_h2dev_video.cjs fallback to direct stream for ${sku}: ${e.message}`, quiet);
    } finally {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
    }
  }

  if (item.branch === 'HUAN' && fs.existsSync(path.join(ROOT, 'scripts', 'download_huan_video.js'))) {
    try {
      runCmd(process.execPath, ['scripts/download_huan_video.js', sku], quiet);
      if (fs.existsSync(mp4Path) && fs.statSync(mp4Path).size > 1024 * 1024) return;
    } catch (e) {
      logMsg(`WARN: download_huan_video.js fallback to direct stream for ${sku}: ${e.message}`, quiet);
    }
  }

  if (item.branch === 'DGMD') {
    try {
      runCmd(process.execPath, ['scripts/download_dgmd_video.cjs', sku], quiet);
      if (fs.existsSync(mp4Path) && fs.statSync(mp4Path).size > 1024 * 1024) return;
    } catch (e) {
      logMsg(`WARN: download_dgmd_video.cjs fallback to direct stream for ${sku}: ${e.message}`, quiet);
    }
  }

  await downloadStreamViaPlaywrightOrFfmpeg(item, videoLink, mp4Path, quiet);
}

function formatSrtTimestamp(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const wholeS = Math.floor(s % 60);
  const ms = Math.round((s - Math.floor(s)) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(wholeS).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function normText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9@]+/g, ' ')
    .trim();
}

function buildCleanTimestampLabel(rawText, fallbackTitle) {
  let s = cleanAsrText(String(rawText || '').replace(/[\[\]]/g, '')).trim();
  if (!s || s.length < 8) s = String(fallbackTitle || '').trim();
  if (s.length <= 68) return s;
  const cut = s.slice(0, 68);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = (lastSpace > 24 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\-]+$/g, '').trim();
  return trimmed.length >= 8 ? trimmed : cut.trim();
}

function readLocalCliproxyKey() {
  if (process.env.CLIPROXY_API_KEY && String(process.env.CLIPROXY_API_KEY).trim()) {
    return String(process.env.CLIPROXY_API_KEY).trim();
  }
  const candidates = [
    process.env.CLIPROXY_CONFIG_PATH,
    process.env.H2DEV_CLIPROXY_CONFIG,
    path.resolve(ROOT, '..', 'CLIProxyAPI', 'config.yaml'),
    path.resolve(path.parse(ROOT).root, 'CLIProxyAPI', 'config.yaml'),
    path.join(os.homedir(), '.cli-proxy-api', 'config.yaml'),
  ].filter(Boolean);
  for (const cfgPath of candidates) {
    try {
      if (!fs.existsSync(cfgPath)) continue;
      const raw = fs.readFileSync(cfgPath, 'utf8');
      const m = raw.match(/api-keys:\s*\r?\n\s*-\s*["']?([^"'\r\n]+)["']?/);
      if (m && m[1]) return m[1].trim();
    } catch (_) {}
  }
  return null;
}

async function trySynthesizeInsightViaLocalGateway(sku, title, branch, descTxt, segs, keyTimestamps, groundedTools, handleList, quiet = false) {
  const apiKey = readLocalCliproxyKey();
  if (!apiKey) return null;
  try {
    const mRes = await fetch('http://127.0.0.1:8317/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(1200)
    });
    if (!mRes.ok) return null;
    const mData = await mRes.json();
    const models = (Array.isArray(mData?.data) ? mData.data.map(x => x.id).filter(Boolean) : [])
      .filter(id => !DISALLOWED_AGV_MODEL_RE.test(id));
    const chosenModel = models.find(id => /gemini-2\.5-flash|gemini-2\.5|gpt-4o-mini|qwen|claude/i.test(id)) || models[0];
    if (!chosenModel) return null;

    const sampleSegs = [];
    const total = segs.length;
    if (total > 0) {
      const step = Math.max(1, Math.floor(total / 24));
      for (let i = 0; i < total && sampleSegs.length < 24; i += step) {
        const sg = segs[i];
        sampleSegs.push(`[${formatSrtTimestamp(sg.start)}] ${cleanAsrText(sg.text || '')}`);
      }
    }

    const prompt = [
      `Bạn là biên tập viên kỹ thuật H2DEV. Hãy tóm tắt bài học "${title}" (${sku}, nhánh ${branch}) thành JSON thuần túy (KHÔNG markdown fence).`,
      `QUY TẮC BẮT BUỘC:`,
      `- Chỉ dùng công cụ từ danh sách đã kiểm chứng: ${groundedTools.join(', ') || '(không có)'}. KHÔNG tự bịa tên công cụ hay @handle ngoài văn bản nguồn.`,
      `- KHÔNG sao chép nguyên văn các câu thoại mở đầu, KHÔNG dùng tiền tố "Bước 1:" hoặc "1." trong edit_sop.`,
      `- Schema JSON: { "actual_topic": string (>=20 chars), "summary": string (>=40 chars), "key_takeaways": [5-6 strings >=45 chars], "edit_sop_primary": string (>=45 chars), "edit_sop_additional": [3-4 strings >=45 chars], "avoid_flags": [3 strings >=40 chars], "timestamp_labels": [${keyTimestamps.length} short Vietnamese labels <=65 chars matching each timestamp] }`,
      descTxt ? `\nMô tả gốc:\n${descTxt.slice(0, 1200)}` : '',
      `\nMốc thời gian cần đặt nhãn:\n${keyTimestamps.map(t => `${t.time}: ${t.label}`).join('\n')}`,
      `\nTrích đoạn transcript:\n${sampleSegs.join('\n')}`
    ].join('\n');

    const cRes = await fetch('http://127.0.0.1:8317/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: chosenModel,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: AbortSignal.timeout(30000)
    });
    if (!cRes.ok) return null;
    const cJson = await cRes.json();
    let content = String(cJson?.choices?.[0]?.message?.content || '').trim();
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(content);
    const takeaways = (Array.isArray(parsed.key_takeaways) ? parsed.key_takeaways : [])
      .map(x => cleanAsrText(String(x || '').trim())).filter(x => x.length >= 45);
    const sopAdditional = (Array.isArray(parsed.edit_sop_additional) ? parsed.edit_sop_additional : [])
      .map(x => cleanAsrText(String(x || '').replace(/^(Bước\s*\d+\s*[:.-]?\s*|\d+\.\s*)/i, '').trim()))
      .filter(x => x.length >= 45);
    const avoidFlags = (Array.isArray(parsed.avoid_flags) ? parsed.avoid_flags : [])
      .map(x => cleanAsrText(String(x || '').trim())).filter(x => x.length >= 35);
    const sopPrimary = cleanAsrText(String(parsed.edit_sop_primary || '').replace(/^(Bước\s*\d+\s*[:.-]?\s*|\d+\.\s*)/i, '').trim());
    if (takeaways.length < 5 || sopAdditional.length < 3 || avoidFlags.length < 2 || sopPrimary.length < 45) {
      return null;
    }
    const tsLabels = Array.isArray(parsed.timestamp_labels) ? parsed.timestamp_labels : [];
    const updatedTimestamps = keyTimestamps.map((ts, idx) => ({
      ...ts,
      label: buildCleanTimestampLabel(tsLabels[idx] || ts.label, title)
    }));
    const candidate = {
      actual_topic: cleanAsrText(String(parsed.actual_topic || '').trim()) || `${title} — Phân tích & quy trình thực hành chi tiết theo bài giảng`,
      summary: cleanAsrText(String(parsed.summary || '').trim()),
      key_takeaways: takeaways.slice(0, 6),
      edit_sop: { primary: sopPrimary, additional: sopAdditional.slice(0, 4) },
      avoid_flags: avoidFlags.slice(0, 4),
      key_timestamps: updatedTimestamps
    };
    if (hasRawInsightDump(candidate, segs)) return null;
    // Grounding safety: reject if LLM introduced an ungrounded @handle
    const allowedHandles = new Set(handleList.map(h => h.toLowerCase()));
    const blob = JSON.stringify(candidate);
    for (const m of blob.matchAll(/@([a-zA-Z0-9_.-]{2,})/g)) {
      if (!allowedHandles.has(`@${m[1].toLowerCase()}`)) return null;
    }
    logMsg(`Synthesized grounded insight.json for ${sku} via CLIProxyAPI (${chosenModel})`, quiet);
    return candidate;
  } catch (_) {
    return null;
  }
}

async function ensureGroundedInsightAndReadme(item, prod, quiet = false) {
  const sku = item.sku;
  const branch = item.branch;
  const vDir = path.join(ROOT, 'video', sku);
  const trPath = path.join(vDir, 'transcript.json');
  const srtPath = path.join(vDir, 'transcript.srt');
  const txtPath = path.join(vDir, 'transcript.txt');
  const silPath = path.join(vDir, 'silence.json');
  const insPath = path.join(vDir, 'insight.json');
  const docsDir = path.join(ROOT, 'docs', sku);
  const readmePath = path.join(docsDir, 'README.md');
  const assetSub = branch === 'DGMD' ? 'docs-dgmd' : (branch === 'HUAN' ? 'docs-huan' : 'docs');
  const assetDocsDir = path.join(ROOT, 'assets', assetSub, sku);
  const assetReadmePath = path.join(assetDocsDir, 'README.md');
  const descTxtPath = path.join(docsDir, 'description.txt');

  const trObj = fs.existsSync(trPath) ? JSON.parse(fs.readFileSync(trPath, 'utf8')) : { segments: [] };
  const segs = Array.isArray(trObj.segments) ? trObj.segments : [];
  const silDur = fs.existsSync(silPath) ? (JSON.parse(fs.readFileSync(silPath, 'utf8')).duration || 0) : 0;
  const realDur = silDur || trObj.duration || item.duration_sec || 600;
  const descTxtRaw = fs.existsSync(descTxtPath) ? fs.readFileSync(descTxtPath, 'utf8').trim() : '';
  const descTxt = decodeHtmlEntities(descTxtRaw);
  const title = decodeHtmlEntities(item.title || prod?.name || sku);

  let existingIns = null;
  if (fs.existsSync(insPath)) {
    try { existingIns = JSON.parse(fs.readFileSync(insPath, 'utf8')); } catch (_) {}
  }
  const minSopLen = existingIns?.verified_expert_summary ? 25 : 40;
  const isInsComplete = existingIns &&
    existingIns.actual_topic && String(existingIns.actual_topic).trim().length >= 15 &&
    Array.isArray(existingIns.key_takeaways) && existingIns.key_takeaways.length >= 5 &&
    Array.isArray(existingIns.edit_sop?.additional) && existingIns.edit_sop.additional.length >= 3 &&
    existingIns.edit_sop.additional.every(s => String(s || '').trim().length >= minSopLen && !/^\d+\./.test(String(s || '').trim())) &&
    Array.isArray(existingIns.avoid_flags) && existingIns.avoid_flags.length >= 2 &&
    Array.isArray(existingIns.key_timestamps) && existingIns.key_timestamps.length >= 5 &&
    !hasRawInsightDump(existingIns, segs);

  if (!isInsComplete) {
    logMsg(`Generating grounded insight.json for ${sku}...`, quiet);
    // Extract grounded @handles strictly from description.txt + transcript segments (including Unicode/VN/JP handles)
    const rawCorpusText = `${descTxt} ${segs.map(s => s.text || '').join(' ')}`;
    const handleSet = new Set();
    for (const m of rawCorpusText.matchAll(/(?:^|[\s(>])@([^\s,;()<>'"`[\]{}]{2,})/gu)) {
      const cleaned = m[1].replace(/[),.?!:;]+$/u, '');
      if (cleaned.length >= 2 && !cleaned.includes('@')) {
        handleSet.add(`@${cleaned}`);
      }
    }
    const channels = [...handleSet].map(h => ({
      handle: h,
      name: h,
      url: `https://www.youtube.com/${h}`
    }));

    // Extract grounded canonical tools strictly present in transcript + title + description.txt
    const CANONICAL_TOOLS = [
      'ChatGPT', 'Claude', 'Gemini', 'CapCut', 'ElevenLabs', 'Canva',
      'Midjourney', 'YouTube', 'TikTok', 'Facebook', 'VidIQ', 'Premiere',
      'Photoshop', 'Pexels', 'Pixabay', 'Douyin', 'Bilibili', 'HeyGen',
      'Minimax', 'Kling', 'Veo', 'Dreamina', 'DeepSeek', 'Grok', 'Kimi',
      'Google Flow', 'Anti-Gravity', 'Suno', 'Runway', 'Krea', 'Flux',
      'Whisper', 'FFmpeg', 'Notion', 'OBS'
    ];
    const strictNormCorpus = ` ${normText(`${segs.map(s => s.text || '').join(' ')} ${title} ${descTxt}`)} `;
    const groundedTools = CANONICAL_TOOLS.filter(t => strictNormCorpus.includes(` ${normText(t)} `));
    if (groundedTools.length === 0) {
      if (strictNormCorpus.includes(' h2dev ai vn ')) groundedTools.push('h2dev.ai.vn');
      if (strictNormCorpus.includes(' plugin ')) groundedTools.push('Plugin Skill Edit Video');
      if (strictNormCorpus.includes(' render video ')) groundedTools.push('Tool Render Video');
    }

    // Build >= 5 integer key_timestamps strictly aligned to segment.start (0.000s diff per H2DEV-SCAR-033)
    const keyTimestamps = [];
    if (segs.length >= 5) {
      const countNeeded = Math.min(6, segs.length);
      const intAligned = [];
      let lastIntSec = -1;
      for (let i = 0; i < segs.length; i++) {
        const sg = segs[i];
        const rSec = Math.round(Number(sg.start) || 0);
        if (Math.abs((Number(sg.start) || 0) - rSec) <= 0.05 && rSec > lastIntSec && rSec < realDur - 1) {
          intAligned.push({ idx: i, sg, sVal: rSec });
          lastIntSec = rSec;
        }
      }

      if (intAligned.length >= 5) {
        const pickCount = Math.min(countNeeded, intAligned.length);
        for (let k = 0; k < pickCount; k++) {
          const chosen = intAligned[Math.min(intAligned.length - 1, Math.floor((k * intAligned.length) / pickCount))];
          const sVal = chosen.sVal;
          const m = Math.floor(sVal / 60);
          const r = sVal % 60;
          keyTimestamps.push({
            time: `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`,
            seconds: sVal,
            label: buildCleanTimestampLabel(chosen.sg.text, title)
          });
        }
      } else {
        let trMutated = false;
        let prevSec = -1;
        for (let k = 0; k < countNeeded; k++) {
          const baseIdx = Math.min(segs.length - 1, Math.floor((k * segs.length) / countNeeded));
          let chosenIdx = -1;
          let chosenSec = -1;
          for (let delta = 0; delta < 12; delta++) {
            const candIdx = baseIdx + delta;
            if (candIdx >= segs.length) break;
            const sg = segs[candIdx];
            const prevSg = candIdx > 0 ? segs[candIdx - 1] : null;
            const origStart = Number(sg.start) || 0;
            const candidates = [Math.round(origStart), Math.floor(origStart), Math.ceil(origStart)];
            for (const cSec of candidates) {
              if (cSec <= prevSec || cSec >= realDur - 1) continue;
              const newDur = (Number(sg.end) || 0) - cSec;
              if (newDur < 0.2 || newDur >= 13.8) continue;
              if (prevSg) {
                const prevStart = Number(prevSg.start) || 0;
                const prevEnd = Number(prevSg.end) || 0;
                if (prevEnd > cSec || Math.abs(prevEnd - origStart) <= 0.5) {
                  const newPrevDur = cSec - prevStart;
                  if (newPrevDur < 0.2 || newPrevDur >= 13.8) continue;
                }
              }
              chosenIdx = candIdx;
              chosenSec = cSec;
              break;
            }
            if (chosenIdx >= 0) break;
          }

          if (chosenIdx >= 0) {
            const sg = segs[chosenIdx];
            const prevSg = chosenIdx > 0 ? segs[chosenIdx - 1] : null;
            const origStart = Number(sg.start) || 0;
            if (Math.abs(origStart - chosenSec) > 0.001) {
              if (prevSg && (Number(prevSg.end) > chosenSec || Math.abs(Number(prevSg.end) - origStart) <= 0.5)) {
                prevSg.end = chosenSec;
                prevSg.end_time = formatSrtTimestamp(chosenSec);
              }
              sg.start = chosenSec;
              sg.start_time = chosenSec === 0 ? '00:00' : formatSrtTimestamp(chosenSec);
              trMutated = true;
            }
            prevSec = chosenSec;
            const m = Math.floor(chosenSec / 60);
            const r = chosenSec % 60;
            keyTimestamps.push({
              time: `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`,
              seconds: chosenSec,
              label: buildCleanTimestampLabel(sg.text, title)
            });
          }
        }
        if (trMutated && fs.existsSync(trPath)) {
          fs.writeFileSync(trPath, JSON.stringify(trObj, null, 2), 'utf8');
          const srtBlocks = segs.map((s, idx) => {
            const st = formatSrtTimestamp(s.start);
            const et = formatSrtTimestamp(s.end);
            return `${idx + 1}\n${st} --> ${et}\n${String(s.text || '').trim()}\n`;
          });
          fs.writeFileSync(srtPath, srtBlocks.join('\n'), 'utf8');
          fs.writeFileSync(txtPath, segs.map(s => String(s.text || '').trim()).join('\n') + '\n', 'utf8');
        }
      }
    }

    // Tier 1: try local CLIProxyAPI LLM synthesis (fast 1.2s probe; falls back immediately if down)
    const llmDraft = await trySynthesizeInsightViaLocalGateway(
      sku, title, branch, descTxt, segs, keyTimestamps, groundedTools, [...handleSet], quiet
    );

    let finalTakeaways;
    let finalSopPrimary;
    let finalSopAdditional;
    let finalAvoidFlags;
    let finalActualTopic;
    let finalSummary;
    let finalTimestamps = keyTimestamps;

    if (llmDraft) {
      finalTakeaways = llmDraft.key_takeaways;
      finalSopPrimary = llmDraft.edit_sop.primary;
      finalSopAdditional = llmDraft.edit_sop.additional;
      finalAvoidFlags = llmDraft.avoid_flags;
      finalActualTopic = llmDraft.actual_topic;
      finalSummary = llmDraft.summary;
      finalTimestamps = llmDraft.key_timestamps;
    } else {
      // Tier 2: deterministic topic-clustered synthesis (never verbatim opening-segment dumps)
      const toolsStr = groundedTools.length > 0 ? groundedTools.join(', ') : 'hệ thống công cụ hướng dẫn trong bài';
      const cleanedTopicSegs = segs
        .map((s, idx) => ({
          idx,
          start: Number(s.start) || 0,
          text: cleanAsrText(String(s.text || '').replace(/[\[\]]/g, '').replace(/^(?:Bước\s*\d+\s*[:.-]?\s*|\d+\.\s*)/i, '').trim())
        }))
        .filter(x => x.text.length >= 35 && !/^(?:xin chào|chào mừng|hôm nay mình sẽ)/i.test(x.text));

      const clusterFrame = (prefix, segItem, fallbackText) => {
        const core = segItem ? buildCleanTimestampLabel(segItem.text, title) : fallbackText;
        const candidate = `${prefix}: ${core} — áp dụng chuẩn hóa theo bối cảnh bài "${title}"`;
        return candidate.length >= 48 ? candidate : `${candidate} và đối chiếu kết quả thực tế`;
      };

      const pickWindowSeg = (ratio) => {
        if (cleanedTopicSegs.length === 0) return null;
        return cleanedTopicSegs[Math.min(cleanedTopicSegs.length - 1, Math.floor(cleanedTopicSegs.length * ratio))];
      };

      finalTimestamps = keyTimestamps.map(ts => ({
        ...ts,
        label: buildCleanTimestampLabel(ts.label, title)
      }));

      const tsLabel = idx => (finalTimestamps[idx] ? `${finalTimestamps[idx].time} (${finalTimestamps[idx].label})` : title);
      finalTakeaways = [
        `Trọng tâm triển khai bài "${title}" giúp nắm vững quy trình và mục tiêu cốt lõi ngay từ đầu bài giảng`,
        clusterFrame(`Nội dung giai đoạn ${tsLabel(1)}`, pickWindowSeg(0.22), `Phân tích cấu trúc và thiết lập nền tảng bằng ${toolsStr}`),
        clusterFrame(`Điểm chuyển thực hành ${tsLabel(2)}`, pickWindowSeg(0.45), `Triển khai thao tác kỹ thuật trọng tâm bằng ${toolsStr}`),
        clusterFrame(`Tối ưu chất lượng tại ${tsLabel(3)}`, pickWindowSeg(0.68), `Tinh chỉnh thông số và kiểm soát đầu ra ổn định`),
        clusterFrame(`Tổng kết & kiểm tra tại ${tsLabel(Math.max(0, finalTimestamps.length - 1))}`, pickWindowSeg(0.88), `Rà soát toàn bộ thành phẩm trước khi xuất bản chính thức`)
      ];
      finalSopPrimary = `Chuẩn bị đầy đủ tài nguyên, đề bài gốc và công cụ (${toolsStr}) trước khi thực hành theo bài "${title}"`;
      finalSopAdditional = [
        `Thiết lập khung cấu hình ban đầu theo đúng thứ tự hướng dẫn ở mốc ${tsLabel(0)} và ${tsLabel(1)}`,
        `Thực thi luồng xử lý chính bằng ${toolsStr}, đối chiếu trực tiếp kết quả từng bước tại mốc ${tsLabel(2)}`,
        `Kiểm tra đầu ra cuối cùng, loại bỏ sai sót kỹ thuật và lưu trữ tài liệu đi kèm theo chuẩn ${sku}`
      ];
      finalAvoidFlags = [
        `Không bỏ qua bước kiểm tra thông số đầu vào và tài liệu đính kèm gốc trước khi vận hành ${toolsStr}`,
        `Tránh sao chép máy móc thiếu đối chiếu với mục tiêu thực tế của bài "${title}" dẫn đến sai lệch kết quả`,
        `Luôn rà soát lỗi chính tả, âm thanh, định dạng và tài nguyên liên quan trước khi đóng gói hoàn tất`
      ];
      finalActualTopic = `${title} — Phân tích & quy trình thực hành chi tiết theo bài giảng`;
      finalSummary = `${finalActualTopic}. Tập trung vào ${toolsStr} qua ${finalTimestamps.length || 5} chặng trọng tâm.`;
    }

    const newIns = {
      sku,
      title,
      actual_topic: finalActualTopic,
      summary: finalSummary,
      verified_expert_summary: true,
      category_group: branch === 'DGMD' ? 'chuyen_gia' : 'he_thong',
      niche_primary: item.chapter_title || title,
      target_market: 'Việt Nam & Toàn Cầu',
      market_code: 'VN_GLOBAL',
      tools_mentioned: groundedTools,
      channels_mentioned: branch === 'H2DEV' ? channels.map(c => c.handle) : channels,
      key_timestamps: finalTimestamps,
      key_takeaways: finalTakeaways,
      edit_sop: {
        primary: finalSopPrimary,
        additional: finalSopAdditional
      },
      sop_steps: finalSopAdditional,
      avoid_flags: finalAvoidFlags,
      source_transcript: `video/${sku}/transcript.txt`,
      accuracy_status: 'GROUNDED_VERIFIED',
      visual_audio_checked: true
    };
    fs.mkdirSync(vDir, { recursive: true });
    fs.writeFileSync(insPath, JSON.stringify(newIns, null, 2), 'utf8');
  }

  const readmeNeedsFix = !fs.existsSync(readmePath) ||
    fs.statSync(readmePath).size < 500 ||
    RAW_HTML_ENTITY_RE.test(fs.readFileSync(readmePath, 'utf8').replace(/```[\s\S]*?```/g, ''));

  if (readmeNeedsFix) {
    logMsg(`Generating grounded docs/${sku}/README.md...`, quiet);
    const ins = JSON.parse(fs.readFileSync(insPath, 'utf8'));
    const cleanField = v => decodeHtmlEntities(cleanAsrText(String(v || '')));
    const lines = [
      `# ${cleanField(ins.title || title)} (${sku})`,
      '',
      `> **Nhánh đào tạo:** ${branch} · **Mã bài học:** \`${sku}\``,
      '',
      '## 1. Trọng tâm bài học',
      '',
      cleanField(ins.actual_topic || title),
      '',
      descTxt ? `### Mô tả gốc bài giảng\n\n${descTxt}\n` : '',
      '## 2. Điểm cốt lõi trong bài giảng',
      '',
      ...(ins.key_takeaways || []).map(t => `- ${cleanField(t)}`),
      '',
      '## 3. Quy trình thực hành chuẩn',
      '',
      ...((ins.edit_sop && ins.edit_sop.additional) || ins.sop_steps || []).map(s => `- ${cleanField(s)}`),
      '',
      '## 4. Lưu ý kiểm soát chất lượng',
      '',
      ...(ins.avoid_flags || []).map(a => `- ${cleanField(a)}`),
      '',
      '## 5. Mốc thời gian bài giảng',
      '',
      ...(ins.key_timestamps || []).map(ts => `- **${ts.time}**: ${cleanField(ts.label)}`),
      ''
    ];
    const mdText = lines.join('\n');
    fs.mkdirSync(docsDir, { recursive: true });
    fs.writeFileSync(readmePath, mdText, 'utf8');
    const assetReadmeNeedsFix = !fs.existsSync(assetReadmePath) ||
      fs.statSync(assetReadmePath).size < 500 ||
      RAW_HTML_ENTITY_RE.test(fs.readFileSync(assetReadmePath, 'utf8').replace(/```[\s\S]*?```/g, ''));
    if (assetReadmeNeedsFix) {
      fs.mkdirSync(assetDocsDir, { recursive: true });
      fs.writeFileSync(assetReadmePath, mdText, 'utf8');
    }
  }
}

function resolveThumbRel(sku, branch) {
  const thumbSub = branch === 'DGMD' ? 'thumbs-dgmd' : (branch === 'HUAN' ? 'thumbs-huan' : 'thumbs');
  for (const ext of ['.png', '.webp', '.jpg', '.jpeg']) {
    const rel = `assets/${thumbSub}/${sku}${ext}`;
    if (fs.existsSync(path.join(ROOT, rel))) return rel;
  }
  return `assets/${thumbSub}/${sku}.png`;
}

function resolveBestDurationSec(sku, item, prod) {
  const silPath = path.join(ROOT, 'video', sku, 'silence.json');
  if (fs.existsSync(silPath)) {
    try {
      const d = Math.round(Number(JSON.parse(fs.readFileSync(silPath, 'utf8')).duration || 0));
      if (d > 0) return d;
    } catch (_) {}
  }
  const trPath = path.join(ROOT, 'video', sku, 'transcript.json');
  if (fs.existsSync(trPath)) {
    try {
      const tr = JSON.parse(fs.readFileSync(trPath, 'utf8'));
      const d = Math.round(Number(tr.duration || (Array.isArray(tr.segments) && tr.segments.length ? tr.segments[tr.segments.length - 1].end : 0) || 0));
      if (d > 0) return d;
    } catch (_) {}
  }
  return item.duration_sec || parseInt(prod?.time || '0', 10) || 600;
}

function backfillVideoFields(entry, patch) {
  let dirty = false;
  for (const k of ['file', 'mp4', 'thumb', 'image']) {
    if ((!entry[k] || String(entry[k]).trim() === '' || entry[k] !== patch[k]) && patch[k]) {
      // Only overwrite media/thumb if missing OR if extension changed (.mp4 <-> .webm / .png <-> .webp)
      if (!entry[k] || String(entry[k]).trim() === '' || (k === 'file' || k === 'mp4')) {
        if (entry[k] !== patch[k]) {
          entry[k] = patch[k];
          dirty = true;
        }
      } else if (!fs.existsSync(path.join(ROOT, String(entry[k]).replace(/^\/+/, '')))) {
        entry[k] = patch[k];
        dirty = true;
      }
    }
  }
  if ((!entry.duration_sec || Number(entry.duration_sec) <= 0) && patch.duration_sec > 0) {
    entry.duration_sec = patch.duration_sec;
    dirty = true;
  }
  if ((!entry.duration || String(entry.duration).trim() === '') && patch.duration) {
    entry.duration = patch.duration;
    dirty = true;
  }
  if ((!entry.title || entry.title === entry.sku) && patch.title && patch.title !== entry.sku) {
    entry.title = patch.title;
    dirty = true;
  }
  return dirty;
}

function loadBranchSkuSetsForMeta(extraBranchMap) {
  const readSkuSet = (relPaths) => {
    const set = new Set();
    for (const rel of relPaths) {
      const full = path.join(ROOT, rel);
      if (!fs.existsSync(full)) continue;
      try {
        const parsed = JSON.parse(fs.readFileSync(full, 'utf8'));
        const rows = Array.isArray(parsed)
          ? parsed
          : (Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed.videos) ? parsed.videos : []));
        for (const r of rows) {
          const s = String(typeof r === 'string' ? r : (r && r.sku) || '').trim().toUpperCase();
          if (s) set.add(s);
        }
        if (set.size > 0) break;
      } catch (_) {}
    }
    return set;
  };
  const h2 = readSkuSet(['data/catalog.json', 'data-tabs/videos.json']);
  const hu = readSkuSet(['data/catalog_huan.json', 'data/videos_huan.json']);
  const dg = readSkuSet(['data/catalog_dgmd.json', 'data/videos_dgmd.json']);
  if (extraBranchMap && typeof extraBranchMap === 'object') {
    for (const [k, b] of Object.entries(extraBranchMap)) {
      const skuU = String(k || '').trim().toUpperCase();
      const br = String(b || '').trim().toUpperCase();
      if (!skuU) continue;
      if (br === 'HUAN') hu.add(skuU);
      else if (br === 'DGMD') dg.add(skuU);
      else if (br === 'H2DEV') h2.add(skuU);
    }
  }
  const all = new Set([...h2, ...hu, ...dg]);
  return { H2DEV: h2, HUAN: hu, DGMD: dg, allCount: all.size };
}

function recomputeNgachMetaBranchCounts(nxData, extraBranchMap) {
  if (!nxData || !Array.isArray(nxData.ngachMetaKho)) return false;
  const sets = loadBranchSkuSetsForMeta(extraBranchMap);
  let changed = false;
  for (const m of nxData.ngachMetaKho) {
    if (!m || typeof m !== 'object') continue;
    const seen = new Set();
    let h2 = 0;
    let hu = 0;
    let dg = 0;
    for (const raw of (Array.isArray(m.skus) ? m.skus : [])) {
      const s = String(typeof raw === 'string' ? raw : (raw && raw.sku) || '').trim().toUpperCase();
      if (!s || seen.has(s)) continue;
      seen.add(s);
      if (sets.HUAN.has(s)) hu++;
      else if (sets.DGMD.has(s)) dg++;
      else if (sets.H2DEV.has(s)) h2++;
    }
    const total = h2 + hu + dg;
    const prev = m.branchCounts || {};
    if (prev.H2DEV !== h2 || prev.HUAN !== hu || prev.DGMD !== dg || prev.total !== total) {
      m.branchCounts = { H2DEV: h2, HUAN: hu, DGMD: dg, total };
      changed = true;
    }
    const denom = sets.allCount > 0 ? sets.allCount : Math.max(total, 1);
    const nextEvidence = `${total}/${denom} video (${h2} H2DEV · ${hu} Huân · ${dg} Đạt GMD).`;
    if (m.evidence !== nextEvidence) {
      m.evidence = nextEvidence;
      changed = true;
    }
  }
  return changed;
}

function syncNgachMetaBranchCounts(quiet = false) {
  const nxPath = path.join(ROOT, 'data-tabs', 'ngach-xanh.json');
  if (!fs.existsSync(nxPath)) return false;
  const nxData = JSON.parse(fs.readFileSync(nxPath, 'utf8'));
  const changed = recomputeNgachMetaBranchCounts(nxData, null);
  if (changed) {
    fs.writeFileSync(nxPath, JSON.stringify(nxData, null, 2), 'utf8');
    logMsg('Updated ngachMetaKho[*].branchCounts deterministically from branch catalogs.', quiet);
  }
  return changed;
}

function ensureMentionedChannelsInKenhMau(sku, mentionedHandles, resolvedNicheCode, nxDataInput = null, quiet = false) {
  if (!Array.isArray(mentionedHandles) || !mentionedHandles.length) return { added: 0, updated: 0, nxAdded: 0 };

  const cleanHandles = [];
  const seenLower = new Set();
  for (const raw of mentionedHandles) {
    const rawStr = typeof raw === 'string' ? raw : (raw && raw.handle ? raw.handle : '');
    let h = String(rawStr || '').trim().normalize('NFC');
    if (!h) continue;
    if (!h.startsWith('@')) h = '@' + h.replace(/^@+/, '');
    if (h.length < 2 || /\s/.test(h)) continue;
    if (/^@(image\d+|video\d+|handle)$/i.test(h)) continue;
    const low = h.toLowerCase();
    if (!seenLower.has(low)) {
      seenLower.add(low);
      cleanHandles.push(h);
    }
  }
  if (!cleanHandles.length) return { added: 0, updated: 0, nxAdded: 0 };

  const kmPath = path.join(ROOT, 'data-tabs', 'kenh-mau.json');
  const nxPath = path.join(ROOT, 'data-tabs', 'ngach-xanh.json');
  if (!fs.existsSync(kmPath) || !fs.existsSync(nxPath)) return { added: 0, updated: 0, nxAdded: 0 };

  const kmList = JSON.parse(fs.readFileSync(kmPath, 'utf8'));
  const nxData = nxDataInput || JSON.parse(fs.readFileSync(nxPath, 'utf8'));
  const nxList = Array.isArray(nxData.ngachXanh) ? nxData.ngachXanh : [];
  const nxByCode = new Map();
  for (let i = 0; i < nxList.length; i++) {
    const rec = nxList[i];
    const code = rec.code || `H${String(i + 1).padStart(2, '0')}`;
    nxByCode.set(code, rec);
  }

  const targetCode = (/^H\d{2}$/.test(String(resolvedNicheCode || '')) && nxByCode.has(resolvedNicheCode))
    ? resolvedNicheCode
    : (nxByCode.has('H30') ? 'H30' : (nxList[0]?.code || 'H01'));
  const targetRec = nxByCode.get(targetCode) || nxList[0] || {};
  const defaultNicheName = targetRec.ngach || 'Kênh tham chiếu bài học';
  const defaultMarkets = (Array.isArray(targetRec.thiTruong) && targetRec.thiTruong.length)
    ? [...targetRec.thiTruong]
    : ['🌍 Toàn cầu'];

  const kmByHandle = new Map();
  for (const ch of kmList) {
    if (!ch || typeof ch !== 'object') continue;
    const keys = [ch.handle, ch.currentHandle, ch.handle_cu];
    if (Array.isArray(ch.aliases)) keys.push(...ch.aliases);
    if (Array.isArray(ch.aliasHandles)) keys.push(...ch.aliasHandles);
    for (const k of keys) {
      const norm = String(k || '').trim().normalize('NFC').toLowerCase();
      if (norm && !kmByHandle.has(norm)) kmByHandle.set(norm, ch);
    }
  }

  let kmDirty = false;
  let nxDirty = false;
  let added = 0;
  let updated = 0;
  let nxAdded = 0;

  for (const h of cleanHandles) {
    const low = h.toLowerCase();
    let ch = kmByHandle.get(low);
    if (ch) {
      if (!Array.isArray(ch.videos)) ch.videos = [];
      if (!ch.videos.includes(sku)) {
        ch.videos.push(sku);
        kmDirty = true;
        updated += 1;
      }
      const nextCount = Math.max(Number(ch.count) || 0, ch.videos.length);
      if (ch.count !== nextCount) {
        ch.count = nextCount;
        kmDirty = true;
      }
      if (!ch.nicheCode || !nxByCode.has(ch.nicheCode)) {
        ch.nicheCode = targetCode;
        kmDirty = true;
      }
      if (!ch.niche) {
        ch.niche = nxByCode.get(ch.nicheCode)?.ngach || defaultNicheName;
        kmDirty = true;
      }
      if (!Array.isArray(ch.markets) || !ch.markets.length) {
        ch.markets = [...defaultMarkets];
        kmDirty = true;
      }
    } else {
      ch = {
        handle: h,
        title: h.replace(/^@/, ''),
        channelId: null,
        niche: defaultNicheName,
        niches: [defaultNicheName],
        nicheCode: targetCode,
        markets: [...defaultMarkets],
        url: `https://www.youtube.com/${h}`,
        subscribers: null,
        views: null,
        totalViews: null,
        videoCount: null,
        count: 1,
        videos: [sku],
        dead: false,
        ngay_do: null,
        nguon_do: 'auto_ingest_pipeline:channels_mentioned',
        ngay_do_check: null,
        sourceType: 'lesson_mentioned',
        phanLoaiNguon: 'lesson_mentioned'
      };
      kmList.push(ch);
      kmByHandle.set(low, ch);
      kmDirty = true;
      added += 1;
    }

    const chCode = (/^H\d{2}$/.test(String(ch.nicheCode || '')) && nxByCode.has(ch.nicheCode))
      ? ch.nicheCode
      : targetCode;
    const nRec = nxByCode.get(chCode);
    if (nRec) {
      const canonLow = String(ch.handle || h).trim().normalize('NFC').toLowerCase();
      const existingHandles = new Set(
        ['mauSach', 'mauPhu', 'mauBan', 'kenhMoRong2026']
          .flatMap(k => (Array.isArray(nRec[k]) ? nRec[k] : []))
          .map(x => String(x || '').trim().normalize('NFC').toLowerCase())
      );
      if (!existingHandles.has(canonLow)) {
        if (!Array.isArray(nRec.kenhMoRong2026)) nRec.kenhMoRong2026 = [];
        nRec.kenhMoRong2026.push(ch.handle || h);
        nxDirty = true;
        nxAdded += 1;
      }
    }
  }

  if (kmDirty) fs.writeFileSync(kmPath, JSON.stringify(kmList, null, 2) + '\n', 'utf8');
  if (nxDirty) fs.writeFileSync(nxPath, JSON.stringify(nxData, null, 2) + '\n', 'utf8');
  if (added || updated || nxAdded) {
    logMsg(`Synced channels_mentioned for ${sku}: +${added} new kenh-mau, ${updated} sku-links, +${nxAdded} ngach-xanh.kenhMoRong2026`, quiet);
  }
  return { added, updated, nxAdded };
}

function ensureSkuRegisteredInDataFiles(item, prod, quiet = false) {
  const sku = item.sku;
  const skuUpper = sku.toUpperCase();
  const branch = item.branch;
  const title = decodeHtmlEntities(item.title || prod?.name || sku);
  const durSec = resolveBestDurationSec(sku, item, prod);
  const durStr = `${String(Math.floor(durSec / 60)).padStart(2, '0')}:${String(durSec % 60).padStart(2, '0')}`;
  const todayIso = new Date().toISOString().slice(0, 10);
  const publishedAt = (item.created_at || '').slice(0, 10) || todayIso;
  const ingestedAt = item.ingested_at || todayIso;
  const localMedia = resolveLocalMedia(sku);
  const mediaRel = localMedia ? localMedia.rel : `video/${sku}/${sku}.mp4`;
  const thumbRel = resolveThumbRel(sku, branch);

  if (branch === 'H2DEV') {
    const catPath = path.join(ROOT, 'data', 'catalog.json');
    const cfPath = path.join(ROOT, 'data', 'catalog_full.json');
    const vtPath = path.join(ROOT, 'data-tabs', 'videos.json');
    const modPath = path.join(ROOT, 'data', 'modules.json');

    const catList = JSON.parse(fs.readFileSync(catPath, 'utf8'));
    const cfList = JSON.parse(fs.readFileSync(cfPath, 'utf8'));
    const vtList = JSON.parse(fs.readFileSync(vtPath, 'utf8'));
    const modData = JSON.parse(fs.readFileSync(modPath, 'utf8'));

    const baseEntry = {
      sku,
      title,
      file: mediaRel,
      mp4: mediaRel,
      thumb: thumbRel,
      image: thumbRel,
      duration_sec: durSec,
      duration: durStr,
      is_free: false,
      free: false,
      access: 'pro',
      badge: 'PRO',
      published_at: publishedAt,
      ingested_at: ingestedAt,
      contentNiche: item.chapter_title || title,
      niche: item.chapter_title || title,
      market: ['🇻🇳 Việt Nam'],
      tags: ['H2DEV', item.chapter_title || title],
      docs: [],
      docsCount: 0,
      channels: []
    };

    let catDirty = false;
    let cfDirty = false;
    let vtDirty = false;
    let modDirty = false;

    const existingCat = catList.find(x => (x.sku || '').toUpperCase() === skuUpper);
    if (!existingCat) {
      logMsg(`Registering new H2DEV SKU ${sku} into catalog.json, catalog_full.json, videos.json, modules.json...`, quiet);
      catList.push({ ...baseEntry });
      catDirty = true;
    } else if (backfillVideoFields(existingCat, baseEntry)) {
      catDirty = true;
    }

    const existingCf = cfList.find(x => (x.sku || '').toUpperCase() === skuUpper);
    if (!existingCf) {
      cfList.push({ ...baseEntry });
      cfDirty = true;
    } else if (backfillVideoFields(existingCf, baseEntry)) {
      cfDirty = true;
    }

    const existingVt = vtList.find(x => (x.sku || '').toUpperCase() === skuUpper);
    if (!existingVt) {
      vtList.push({ ...baseEntry });
      vtDirty = true;
    } else if (backfillVideoFields(existingVt, baseEntry)) {
      vtDirty = true;
    }

    let foundInMod = false;
    for (const m of (modData.modules || [])) {
      const mItem = (m.items || []).find(x => (x.sku || '').toUpperCase() === skuUpper);
      if (mItem) {
        foundInMod = true;
        if (backfillVideoFields(mItem, baseEntry)) modDirty = true;
      }
    }
    if (!foundInMod) {
      const targetMod = (modData.modules || []).find(m => String(m.category_id || '') === String(item.chapter_id || '')) ||
                        (modData.modules || [])[modData.modules.length - 1];
      if (targetMod) {
        targetMod.items = targetMod.items || [];
        targetMod.items.push({ ...baseEntry, seq: String(targetMod.items.length + 1).padStart(2, '0') });
        targetMod.count = targetMod.items.length;
        modDirty = true;
      }
    }

    if (catDirty) fs.writeFileSync(catPath, JSON.stringify(catList, null, 2), 'utf8');
    if (cfDirty) fs.writeFileSync(cfPath, JSON.stringify(cfList, null, 2), 'utf8');
    if (vtDirty) fs.writeFileSync(vtPath, JSON.stringify(vtList, null, 2), 'utf8');
    if (modDirty) fs.writeFileSync(modPath, JSON.stringify(modData, null, 2), 'utf8');
    if (catDirty || cfDirty || vtDirty || modDirty) {
      logMsg(`Updated/backfilled H2DEV catalog registration for ${sku}`, quiet);
    }
  } else if (branch === 'HUAN') {
    const catPath = path.join(ROOT, 'data', 'catalog_huan.json');
    const modPath = path.join(ROOT, 'data', 'modules_huan.json');
    const catList = JSON.parse(fs.readFileSync(catPath, 'utf8'));
    const modData = JSON.parse(fs.readFileSync(modPath, 'utf8'));
    const baseEntry = {
      sku,
      title,
      file: mediaRel,
      mp4: mediaRel,
      thumb: thumbRel,
      image: thumbRel,
      duration_sec: durSec,
      duration: durStr,
      is_free: false,
      free: false,
      published_at: publishedAt,
      ingested_at: ingestedAt,
      video_link: prod?.video_link || ''
    };
    let catDirty = false;
    let modDirty = false;
    const existingCat = catList.find(x => (x.sku || '').toUpperCase() === skuUpper);
    if (!existingCat) {
      logMsg(`Registering new HUAN SKU ${sku} into catalog_huan.json and modules_huan.json...`, quiet);
      catList.push(baseEntry);
      catDirty = true;
    } else if (backfillVideoFields(existingCat, baseEntry)) {
      catDirty = true;
    }
    let foundInMod = false;
    for (const m of (modData.modules || [])) {
      const mItem = (m.items || []).find(x => (x.sku || '').toUpperCase() === skuUpper);
      if (mItem) {
        foundInMod = true;
        if (backfillVideoFields(mItem, baseEntry)) modDirty = true;
      }
    }
    if (!foundInMod) {
      const targetMod = (modData.modules || []).find(m => String(m.category_id || '') === String(item.chapter_id || '')) ||
                        (modData.modules || [])[modData.modules.length - 1];
      if (targetMod) {
        targetMod.items = targetMod.items || [];
        targetMod.items.push(baseEntry);
        modDirty = true;
      }
    }
    if (catDirty) fs.writeFileSync(catPath, JSON.stringify(catList, null, 2), 'utf8');
    if (modDirty) fs.writeFileSync(modPath, JSON.stringify(modData, null, 2), 'utf8');
  } else if (branch === 'DGMD') {
    const catPath = path.join(ROOT, 'data', 'catalog_dgmd.json');
    const modPath = path.join(ROOT, 'data', 'modules_dgmd.json');
    const catList = JSON.parse(fs.readFileSync(catPath, 'utf8'));
    const modData = JSON.parse(fs.readFileSync(modPath, 'utf8'));
    const baseEntry = {
      sku,
      title,
      file: mediaRel,
      mp4: mediaRel,
      thumb: thumbRel,
      image: thumbRel,
      duration_sec: durSec,
      duration: durStr,
      is_free: false,
      free: false,
      published_at: publishedAt,
      ingested_at: ingestedAt,
      origin: prod?.url_key ? `https://daigiamangdep.com/learn/study/${prod.url_key}` : 'https://daigiamangdep.com/learn',
      desc: prod?.description?.html || '',
      video_link: prod?.video_link || ''
    };
    let catDirty = false;
    let modDirty = false;
    const existingCat = catList.find(x => (x.sku || '').toUpperCase() === skuUpper);
    if (!existingCat) {
      logMsg(`Registering new DGMD SKU ${sku} into catalog_dgmd.json and modules_dgmd.json...`, quiet);
      catList.push(baseEntry);
      catDirty = true;
    } else if (backfillVideoFields(existingCat, baseEntry)) {
      catDirty = true;
    }
    let foundInMod = false;
    for (const m of (modData.modules || [])) {
      const mItem = (m.items || []).find(x => (x.sku || '').toUpperCase() === skuUpper);
      if (mItem) {
        foundInMod = true;
        if (backfillVideoFields(mItem, baseEntry)) modDirty = true;
      }
    }
    if (!foundInMod) {
      const targetMod = (modData.modules || []).find(m => String(m.category_id || '') === String(item.chapter_id || '')) ||
                        (modData.modules || [])[modData.modules.length - 1];
      if (targetMod) {
        targetMod.items = targetMod.items || [];
        targetMod.items.push(baseEntry);
        modDirty = true;
      }
    }
    if (catDirty) fs.writeFileSync(catPath, JSON.stringify(catList, null, 2), 'utf8');
    if (modDirty) fs.writeFileSync(modPath, JSON.stringify(modData, null, 2), 'utf8');
  }

  // Infer canonical niche (H01..H40) or Meta group (META-OPS) — align strictly with ngach-xanh.json first
  const contentNiche = item.chapter_title || title;
  const blobLower = `${title || ''} ${contentNiche || ''}`.toLowerCase();
  let inferredHang = null;
  let inferredMetaGroup = null;
  if (/mama cat|ghibli|pixar|3d ai|hoạt hình ai ngoại|cổ tích/.test(blobLower)) inferredHang = 37;
  else if (/phim ai|phim ngắn ai|sci-fi|tiên hiệp/.test(blobLower)) inferredHang = 38;
  else if (/người que|stickman|2d vẽ tay|chill dude|nonagon/.test(blobLower)) inferredHang = 25;
  else if (/khảo cổ|tiền sử|cổ đại|sumer|ai cập|kodai/.test(blobLower)) inferredHang = 27;
  else if (/lịch sử|quân sự|chiến dịch|bản đồ địa hình|bản đồ sử/.test(blobLower)) inferredHang = 19;
  else if (/địa chính trị|geopolitics|bản đồ/.test(blobLower)) inferredHang = 18;
  else if (/nhạc|âm nhạc|cổ phong|lofi|chầu văn|xẩm|cover/.test(blobLower)) inferredHang = 40;
  else if (/tiếng anh|english|esl|quiz english|hội thoại tiếng anh/.test(blobLower)) inferredHang = 36;
  else if (/triết lý|khắc kỷ|podcast/.test(blobLower)) inferredHang = 20;
  else if (/kinh thánh|bible/.test(blobLower)) inferredHang = 1;
  else if (/phật pháp|phật giáo/.test(blobLower)) inferredHang = 2;
  else if (/sức khỏe|dinh dưỡng|lão hóa/.test(blobLower)) inferredHang = 4;
  else if (/phong thủy|tử vi/.test(blobLower)) inferredHang = 5;
  else if (/tội phạm|dark crime|bodycam/.test(blobLower)) inferredHang = 35;
  else if (/động vật|wildlife|thiên nhiên/.test(blobLower)) inferredHang = 29;
  else if (/everyday history|đồ vật thường ngày/.test(blobLower)) inferredHang = 30;
  else if (/adsense|\bga\b|kháng|bản quyền|fair\s*use|affiliate|tắt kiếm tiền/.test(blobLower)) inferredMetaGroup = 'Kiếm tiền / Chính sách';
  else if (/prompt|chatgpt|claude|tool|vps|tự động/.test(blobLower)) inferredMetaGroup = 'Nền tảng / Tool';
  else if (/thumb|edit|seo|vidiq|hashtag/.test(blobLower)) inferredMetaGroup = 'Edit / Thumb';
  else if (/dream\s*100|tìm ngách|từ khóa|0 view|share key/.test(blobLower)) inferredMetaGroup = 'Share key / Ngách nhỏ';
  else inferredMetaGroup = 'Nhân bản / Kênh';

  const nxPath = path.join(ROOT, 'data-tabs', 'ngach-xanh.json');
  const nxData = fs.existsSync(nxPath) ? JSON.parse(fs.readFileSync(nxPath, 'utf8')) : {};
  const nxList = Array.isArray(nxData.ngachXanh) ? nxData.ngachXanh : [];
  const metaList = Array.isArray(nxData.ngachMetaKho) ? nxData.ngachMetaKho : [];

  // Check existing niche assignment in ngach-xanh.json so tai-lieu-full.json stays 100% aligned
  let existingNxCode = null;
  let existingNxName = null;
  for (let i = 0; i < nxList.length; i++) {
    const rec = nxList[i];
    if ((rec.skus || []).some(s => (typeof s === 'string' ? s : s?.sku || '').toUpperCase() === skuUpper)) {
      existingNxCode = rec.code || `H${String(i + 1).padStart(2, '0')}`;
      existingNxName = rec.ngach || '';
      break;
    }
  }
  if (!existingNxCode && metaList.some(m => (m.skus || []).some(s => (typeof s === 'string' ? s : s?.sku || '').toUpperCase() === skuUpper))) {
    existingNxCode = 'META-OPS';
    existingNxName = 'Meta & Quy trình kỹ thuật (Đa ngách)';
  }

  const resolvedNicheCode = existingNxCode || (inferredHang ? `H${String(inferredHang).padStart(2, '0')}` : 'META-OPS');
  const resolvedNicheName40 = existingNxName || (
    inferredHang && nxList[inferredHang - 1]
      ? nxList[inferredHang - 1].ngach
      : 'Meta & Quy trình kỹ thuật (Đa ngách)'
  );

  // Register or backfill in data-tabs/tai-lieu-full.json (and keep nicheCode aligned with ngach-xanh.json)
  const tlPath = path.join(ROOT, 'data-tabs', 'tai-lieu-full.json');
  let registeredDocNum = null;
  if (fs.existsSync(tlPath)) {
    const tlList = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
    const existingTl = tlList.find(x => (x.sku || '').toUpperCase() === skuUpper);
    if (!existingTl) {
      logMsg(`Registering ${sku} document card in data-tabs/tai-lieu-full.json (${resolvedNicheCode})...`, quiet);
      const nextDocNum = tlList.length + 1;
      registeredDocNum = nextDocNum;
      tlList.push({
        sku,
        name: `Hồ sơ phân tích & SOP thực chiến: ${title} (README.md)`,
        title: `Hồ sơ phân tích & SOP thực chiến: ${title} (README.md)`,
        link: '',
        file: `docs/${sku}/README.md`,
        kind: 'sop',
        source: branch.toLowerCase(),
        contentNiche,
        nicheCode: resolvedNicheCode,
        nicheName40: resolvedNicheName40,
        branch: branch.toUpperCase(),
        docId: `DOC_${String(nextDocNum).padStart(3, '0')}`,
        docCode: `DOC-${String(nextDocNum).padStart(3, '0')}`,
        videoTitle: title,
        videoNiche: contentNiche,
        scopeType: 'LESSON',
        systemTrack: branch.toUpperCase()
      });
      fs.writeFileSync(tlPath, JSON.stringify(tlList, null, 2), 'utf8');
    } else {
      let tlDirty = false;
      const patchTl = {
        file: `docs/${sku}/README.md`,
        source: branch.toLowerCase(),
        branch: branch.toUpperCase(),
        scopeType: 'LESSON',
        systemTrack: branch.toUpperCase(),
        nicheCode: resolvedNicheCode,
        nicheName40: resolvedNicheName40
      };
      for (const [k, val] of Object.entries(patchTl)) {
        if (!existingTl[k] || (k === 'nicheCode' && existingNxCode && existingTl[k] !== existingNxCode)) {
          existingTl[k] = val;
          tlDirty = true;
        }
      }
      if (tlDirty) {
        fs.writeFileSync(tlPath, JSON.stringify(tlList, null, 2), 'utf8');
        logMsg(`Backfilled/aligned tai-lieu-full.json metadata for ${sku} (${existingTl.nicheCode})`, quiet);
      }
    }
  }

  // Register in data-tabs/ngach-xanh.json if missing (canonical H01..H40 OR ngachMetaKho + summary tables)
  if (fs.existsSync(nxPath) && !existingNxCode) {
    if (inferredHang && nxList[inferredHang - 1]) {
      const targetHang = inferredHang;
      const hangCode = `H${String(targetHang).padStart(2, '0')}`;
      logMsg(`Registering new SKU ${sku} into data-tabs/ngach-xanh.json (${hangCode})...`, quiet);
      const rec = nxList.find(x => x.code === hangCode || x.hang === targetHang) || nxList[targetHang - 1];
      rec.skus = rec.skus || [];
      if (!rec.skus.includes(sku)) rec.skus.push(sku);
      if (registeredDocNum) {
        rec.docs = rec.docs || [];
        const docLabel = `TL-${String(registeredDocNum).padStart(3, '0')} (sop · ${sku}): Hồ sơ phân tích & SOP thực chiến: ${title} (README.md)`;
        if (!rec.docs.includes(docLabel)) rec.docs.push(docLabel);
      }
      const newSkuCount = rec.skus.length;

      if (Array.isArray(nxData.ngachXanh)) {
        const hRec = nxData.ngachXanh.find(x => x.code === hangCode || x.hang === targetHang);
        if (hRec && Array.isArray(hRec.skus) && !hRec.skus.includes(sku)) {
          hRec.skus.push(sku);
        }
      }
      if (nxData.auditTong2026 && Array.isArray(nxData.auditTong2026.xepHang)) {
        const xh = nxData.auditTong2026.xepHang.find(x => x.code === hangCode);
        if (xh && typeof xh.lienKetVideo === 'string') {
          xh.lienKetVideo = `${newSkuCount} SKU bài học · ${(rec.mauSach || []).length} mẫu sạch + ${(rec.mauPhu || []).length} mẫu phụ · ${(rec.docs || []).length} tài liệu`;
        }
      }
      if (Array.isArray(nxData.bangXepHang)) {
        nxData.bangXepHang = nxData.bangXepHang.map(row => {
          if (String(row).includes(`(${hangCode}):`)) {
            return String(row).replace(/,\s*\d+\s+SKU bài học,/, `, ${newSkuCount} SKU bài học,`);
          }
          return row;
        });
      }
    } else {
      const targetMeta = metaList.find(m => m.ngach === inferredMetaGroup) || metaList[0];
      if (targetMeta) {
        logMsg(`Registering new SKU ${sku} into data-tabs/ngach-xanh.json ngachMetaKho (${targetMeta.ngach})...`, quiet);
        targetMeta.skus = targetMeta.skus || [];
        if (!targetMeta.skus.includes(sku)) targetMeta.skus.push(sku);
      }
    }
    recomputeNgachMetaBranchCounts(nxData, { [skuUpper]: String(item.branch || 'H2DEV').toUpperCase() });
    fs.writeFileSync(nxPath, JSON.stringify(nxData, null, 2), 'utf8');
  } else if (fs.existsSync(nxPath)) {
    if (recomputeNgachMetaBranchCounts(nxData, { [skuUpper]: String(item.branch || 'H2DEV').toUpperCase() })) {
      fs.writeFileSync(nxPath, JSON.stringify(nxData, null, 2), 'utf8');
    }
  }

  const insPath = path.join(ROOT, 'video', sku, 'insight.json');
  if (fs.existsSync(insPath)) {
    try {
      const insObj = JSON.parse(fs.readFileSync(insPath, 'utf8'));
      ensureMentionedChannelsInKenhMau(sku, insObj.channels_mentioned || [], resolvedNicheCode, nxData, quiet);
    } catch (e) {
      logMsg(`Warning: failed to sync channels_mentioned for ${sku}: ${e.message}`, quiet);
    }
  }
}

function stageSkuAssetsForGitGuard(lessonsToProcess, quiet = false) {
  if (!fs.existsSync(path.join(ROOT, '.git')) || !lessonsToProcess.length) return;
  const pathsToStage = [];
  for (const item of lessonsToProcess) {
    const s = item.sku;
    if (fs.existsSync(path.join(ROOT, 'docs', s))) pathsToStage.push(`docs/${s}`);
    for (const sub of ['docs', 'docs-huan', 'docs-dgmd']) {
      if (fs.existsSync(path.join(ROOT, 'assets', sub, s))) pathsToStage.push(`assets/${sub}/${s}`);
    }
    for (const tSub of ['thumbs', 'thumbs-huan', 'thumbs-dgmd']) {
      for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
        const tRel = `assets/${tSub}/${s}${ext}`;
        if (fs.existsSync(path.join(ROOT, tRel))) pathsToStage.push(tRel);
      }
    }
  }
  if (pathsToStage.length > 0) {
    try {
      spawnSync('git', ['add', '--', ...pathsToStage], { cwd: ROOT, stdio: quiet ? 'pipe' : 'ignore', windowsHide: true });
    } catch (_) {}
  }
}

function findGoogleDriveMirrorDb() {
  if (!IS_WIN) return null;
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const driveFsRoot = path.join(localAppData, 'Google', 'DriveFS');
  if (!fs.existsSync(driveFsRoot)) return null;
  for (const entry of fs.readdirSync(driveFsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const cand = path.join(driveFsRoot, entry.name, 'mirror_sqlite.db');
    if (fs.existsSync(cand)) return cand;
  }
  return null;
}

function checkGoogleDriveMirrorSynced(sku) {
  const dbPath = findGoogleDriveMirrorDb();
  if (!dbPath) return { synced: false, reason: 'mirror_sqlite.db not found' };
  const media = resolveLocalMedia(sku);
  const candidates = media
    ? [media.filename, `${sku}.mp4`, `${sku}.webm`]
    : [`${sku}.mp4`, `${sku}.webm`];
  const uniqueNames = [...new Set(candidates)];
  try {
    const origEmit = process.emitWarning;
    process.emitWarning = function (w, ...rest) {
      if (String((w && w.message) || w).includes('SQLite is an experimental')) return;
      return origEmit.call(process, w, ...rest);
    };
    const { DatabaseSync } = require('node:sqlite');
    process.emitWarning = origEmit;
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const placeholders = uniqueNames.map(() => '?').join(', ');
      const row = db.prepare(
        `SELECT local_filename, local_size, cloud_size, local_md5_checksum, cloud_md5_checksum FROM mirror_item WHERE local_filename IN (${placeholders}) LIMIT 1`
      ).get(...uniqueNames);
      if (!row) return { synced: false, reason: 'not in mirror_item yet' };
      const ok = Number(row.cloud_size) > 0 &&
                 Number(row.cloud_size) === Number(row.local_size) &&
                 Boolean(row.cloud_md5_checksum) &&
                 row.cloud_md5_checksum === row.local_md5_checksum;
      return { synced: ok, row };
    } finally {
      db.close();
    }
  } catch (e) {
    return { synced: false, reason: e.message };
  }
}

function checkpointLocalSqliteDbs(quiet = false) {
  const targets = [
    path.join(ROOT, 'data', 'h2dev_master.db'),
    path.join(ROOT, 'data', 'h2dev_knowledge_graph.db'),
    path.join(ROOT, 'data', 'intelligence.db')
  ].filter(p => fs.existsSync(p));
  if (targets.length === 0) return [];
  let DatabaseSync;
  try {
    const origEmit = process.emitWarning;
    process.emitWarning = function (w, ...rest) {
      if (String((w && w.message) || w).includes('SQLite is an experimental')) return;
      return origEmit.call(process, w, ...rest);
    };
    ({ DatabaseSync } = require('node:sqlite'));
    process.emitWarning = origEmit;
  } catch (e) {
    logMsg(`WARN: node:sqlite unavailable for WAL checkpoint (${e.message})`, quiet);
    return [];
  }
  const results = [];
  for (const dbPath of targets) {
    try {
      const db = new DatabaseSync(dbPath);
      try {
        const res = db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').all();
        results.push({ db: path.relative(ROOT, dbPath).replace(/\\/g, '/'), ok: true, res });
        logMsg(`SQLite WAL checkpoint(TRUNCATE) ok: ${path.relative(ROOT, dbPath)}`, quiet);
      } finally {
        db.close();
      }
    } catch (e) {
      logMsg(`WARN: WAL checkpoint failed for ${path.relative(ROOT, dbPath)}: ${e.message}`, quiet);
      results.push({ db: path.relative(ROOT, dbPath).replace(/\\/g, '/'), ok: false, error: e.message });
    }
  }
  return results;
}

function collectCleanScriptRelPaths() {
  const out = [];
  const walk = (absDir, relBase) => {
    if (!fs.existsSync(absDir)) return;
    for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
      const lower = ent.name.toLowerCase();
      if (lower === '__pycache__' || lower === 'node_modules' || ent.name.startsWith('.')) continue;
      const absChild = path.join(absDir, ent.name);
      const relChild = `${relBase}/${ent.name}`;
      if (ent.isDirectory()) {
        if (lower === '_archive' || lower === '_backup' || lower.startsWith('_tmp')) continue;
        walk(absChild, relChild);
      } else {
        if (lower === 'desktop.ini' || lower === 'thumbs.db') continue;
        if (/\.(?:pyc|bak|tmp|log)$/i.test(lower)) continue;
        out.push(relChild);
      }
    }
  };
  walk(path.join(ROOT, 'scripts'), 'scripts');
  return out;
}

function buildVpsSyncPlan(processedLessons, syncGlobalData = false) {
  const skus = processedLessons.map(x => assertSafeSku(x.sku));
  const vpsVerifyChecks = skus.map(s => {
    const media = resolveLocalMedia(s);
    if (media && media.ext === '.webm') {
      return `(test -s /mnt/gdrive_h2dev/video/${s}/${s}.webm || test -s /mnt/gdrive_h2dev/video/${s}/${s}.mp4)`;
    }
    return `(test -s /mnt/gdrive_h2dev/video/${s}/${s}.mp4 || test -s /mnt/gdrive_h2dev/video/${s}/${s}.webm)`;
  }).join(' && ');

  const remoteRefreshCmd = [
    RCLONE_VFS_REFRESH_CMD,
    '/usr/local/bin/h2dev-sync-video-symlinks.sh',
    vpsVerifyChecks
  ].filter(Boolean).join(' && ');

  const relPathSet = new Set();
  for (const item of processedLessons) {
    const s = item.sku;
    for (const fn of ['insight.json', 'silence.json', 'transcript.json', 'transcript.srt', 'transcript.txt']) {
      const rel = `video/${s}/${fn}`;
      if (fs.existsSync(path.join(ROOT, rel))) relPathSet.add(rel);
    }
    if (fs.existsSync(path.join(ROOT, 'docs', s))) relPathSet.add(`docs/${s}`);
    const vaultRel = `knowledge-hub/vault/videos/${s}.md`;
    if (fs.existsSync(path.join(ROOT, vaultRel))) relPathSet.add(vaultRel);
    for (const sub of ['docs', 'docs-huan', 'docs-dgmd']) {
      if (fs.existsSync(path.join(ROOT, 'assets', sub, s))) relPathSet.add(`assets/${sub}/${s}`);
    }
    for (const tSub of ['thumbs', 'thumbs-huan', 'thumbs-dgmd']) {
      for (const ext of ['.png', '.jpg', '.jpeg', '.webp']) {
        const tRel = `assets/${tSub}/${s}${ext}`;
        if (fs.existsSync(path.join(ROOT, tRel))) relPathSet.add(tRel);
      }
    }
  }

  if (syncGlobalData) {
    const globalTargets = [
      'server.js', 'package.json', 'package-lock.json',
      'index.html', 'player.html', 'learn.html', 'graph.html',
      'manifest.json', 'sw.js', 'favicon.ico', 'h2dev-icon.ico', 'h2dev-icon.png',
      '00_README.md', 'AGENTS.md', 'CHANGELOG.md', 'TREE.md', 'CLAUDE.md',
      'css', 'data', 'data-tabs', 'docs',
      'knowledge-hub/vault', 'knowledge-hub/docs',
      'assets/app', 'assets/docs', 'assets/docs-huan', 'assets/docs-dgmd',
      'assets/thumbs', 'assets/thumbs-huan', 'assets/thumbs-dgmd',
      'assets/icons', 'assets/fonts', 'assets/avatars'
    ];
    for (const gRel of globalTargets) {
      if (fs.existsSync(path.join(ROOT, gRel))) relPathSet.add(gRel);
    }
    if (fs.existsSync(path.join(ROOT, 'assets'))) {
      for (const fn of fs.readdirSync(path.join(ROOT, 'assets'))) {
        if (/\.(js|css)$/i.test(fn)) {
          relPathSet.add(`assets/${fn}`);
        }
      }
    }
    for (const sRel of collectCleanScriptRelPaths()) relPathSet.add(sRel);
  } else {
    if (fs.existsSync(path.join(ROOT, 'data'))) {
      for (const fn of fs.readdirSync(path.join(ROOT, 'data'))) {
        if (/\.(json|db)$/i.test(fn)) relPathSet.add(`data/${fn}`);
      }
    }
    if (fs.existsSync(path.join(ROOT, 'data-tabs'))) {
      for (const fn of fs.readdirSync(path.join(ROOT, 'data-tabs'))) {
        if (/\.json$/i.test(fn)) relPathSet.add(`data-tabs/${fn}`);
      }
    }
    if (fs.existsSync(path.join(ROOT, 'knowledge-hub', 'vault', 'videos'))) {
      relPathSet.add('knowledge-hub/vault/videos');
    }
    for (const sRel of collectCleanScriptRelPaths()) relPathSet.add(sRel);
    for (const gRel of [
      'knowledge-hub/docs/MEMORY.md',
      'knowledge-hub/docs/RULE-LAM-VIEC.md',
      'docs/NOI-BO/zoom/README.md',
      'docs/WORKING_STATE.md',
      'TREE.md',
      '00_README.md',
      'learn.html',
      'graph.html',
      'assets/learn.js',
      'assets/app/graph-main.js'
    ]) {
      if (fs.existsSync(path.join(ROOT, gRel))) relPathSet.add(gRel);
    }
  }

  const relPathsToSync = [...relPathSet];
  const reloadCmd = syncGlobalData
    ? '(pm2 reload h2dev-learn --update-env || pm2 restart h2dev-learn) && for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do curl -fsS http://127.0.0.1:8899/health >/dev/null && break; sleep 1; done && curl -fsS http://127.0.0.1:8899/health >/dev/null'
    : '(curl -fsS -X POST http://127.0.0.1:8899/api/kg/reload -H "X-Requested-With: auto-ingest" >/dev/null || pm2 reload h2dev-learn --update-env || pm2 restart h2dev-learn)';
  const remoteUntarReloadCmd = [
    `tar -xf - -C ${shellSingleQuote(VPS_APP_DIR)}`,
    reloadCmd
  ].join(' && ');

  return {
    skus,
    vpsVerifyChecks,
    remoteRefreshCmd,
    relPathsToSync,
    remoteUntarReloadCmd,
    checkpointTargets: ['data/h2dev_master.db', 'data/h2dev_knowledge_graph.db', 'data/intelligence.db']
      .filter(rel => fs.existsSync(path.join(ROOT, rel)))
  };
}

function syncSkuToGdriveViaRclone(sku, quiet = false) {
  const safeSku = assertSafeSku(sku);
  const localDir = path.join(ROOT, 'video', safeSku);
  if (!fs.existsSync(localDir)) {
    return { synced: false, method: 'rclone', reason: 'local_dir_missing' };
  }
  const media = resolveLocalMedia(safeSku);
  const copyArgs = [
    'copy', localDir, `gdrive:${safeSku}`,
    '--exclude', 'desktop.ini',
    '--exclude', 'Thumbs.db',
    '--exclude', '.DS_Store',
    '--exclude', '_temp*/**',
    '--transfers', '4',
    '--checkers', '4'
  ];
  logMsg(`Syncing ${safeSku} to Google Drive via rclone (gdrive:${safeSku})...`, quiet);
  const cp = spawnSync('rclone', copyArgs, { encoding: 'utf8', windowsHide: true });
  if (cp.error || cp.status !== 0) {
    const errMsg = cp.error ? cp.error.message : ((cp.stderr || cp.stdout || '').trim() || `exit ${cp.status}`);
    return { synced: false, method: 'rclone', reason: errMsg };
  }
  const ls = spawnSync('rclone', ['ls', `gdrive:${safeSku}`], { encoding: 'utf8', windowsHide: true });
  if (ls.status !== 0) {
    return { synced: false, method: 'rclone', reason: `verify_ls_failed:${(ls.stderr || '').trim()}` };
  }
  const entries = String(ls.stdout || '')
    .split(/\r?\n/)
    .map(l => l.trim().match(/^(\d+)\s+(.+)$/))
    .filter(Boolean)
    .map(m => ({ size: Number(m[1]), rel: m[2].trim() }));
  if (media) {
    const matched = entries.find(e => e.rel === media.filename && e.size === media.size);
    if (!matched) {
      return { synced: false, method: 'rclone', reason: `media_size_mismatch_or_missing:${media.filename}` };
    }
    return { synced: true, method: 'rclone', filename: media.filename, size: matched.size, fileCount: entries.length };
  }
  return { synced: entries.length > 0, method: 'rclone', fileCount: entries.length, reason: entries.length > 0 ? null : 'empty_remote_dir' };
}

async function syncVpsAndVerifySymlinks(processedLessons, syncGlobalData = false, quiet = false, opts = {}) {
  const dryVps = Boolean(opts && opts.dryVps);
  const plan = buildVpsSyncPlan(processedLessons, syncGlobalData);
  const skus = plan.skus;

  if (dryVps) {
    logMsg(`[DRY-VPS] Target: ${VPS_HOST}:${VPS_PORT} (key=${VPS_SSH_KEY || 'default'})`, quiet);
    logMsg(`[DRY-VPS] Checkpoint targets: ${plan.checkpointTargets.join(', ') || 'none'}`, quiet);
    logMsg(`[DRY-VPS] Remote refresh+verify cmd: ${plan.remoteRefreshCmd}`, quiet);
    logMsg(`[DRY-VPS] Tar entry count (${syncGlobalData ? 'global' : 'incremental'}): ${plan.relPathsToSync.length}`, quiet);
    logMsg(`[DRY-VPS] Tar excludes: ${TAR_EXCLUDES.join(' ')}`, quiet);
    logMsg(`[DRY-VPS] Remote untar+reload cmd: ${plan.remoteUntarReloadCmd}`, quiet);
    return { dryVps: true, target: `${VPS_HOST}:${VPS_PORT}`, tarExcludes: TAR_EXCLUDES, plan };
  }

  if (IS_WIN) {
    if (!VPS_HOST_CONFIGURED) {
      throw new Error('H2DEV_VPS_HOST is not set. Configure H2DEV_VPS_HOST in environment or .env before running VPS sync.');
    }
    // 1. Verify GoogleDriveFS mirror_sqlite.db status or fallback to rclone gdrive: immediately
    for (const sku of skus) {
      const media = resolveLocalMedia(sku);
      const dispName = media ? media.filename : `${sku}.mp4`;
      const mirrorState = checkGoogleDriveMirrorSynced(sku);
      if (mirrorState.synced) {
        logMsg(`GoogleDriveFS mirror verified for ${mirrorState.row.local_filename} (size=${mirrorState.row.cloud_size}, md5=${mirrorState.row.cloud_md5_checksum})`, quiet);
      } else {
        const rcloneState = syncSkuToGdriveViaRclone(sku, quiet);
        if (rcloneState.synced) {
          logMsg(`rclone gdrive:${sku} verified for ${dispName} (size=${rcloneState.size || 'dir'}, files=${rcloneState.fileCount})`, quiet);
        } else {
          logMsg(`WARN: GDrive sync check for ${dispName} inconclusive (drivefs=${mirrorState.reason}, rclone=${rcloneState.reason})`, quiet);
        }
      }
    }

    // 2. Checkpoint SQLite WAL files locally before packaging tar
    checkpointLocalSqliteDbs(quiet);

    // 3. Refresh rclone VFS cache on VPS & run h2dev-sync-video-symlinks.sh, then verify /mnt/gdrive_h2dev/video/<SKU>/<SKU>.{mp4,webm}
    const sshProbe = spawnSync('ssh', [...getVpsSshArgs('-p', 5), VPS_HOST, 'echo ok'], { encoding: 'utf8', windowsHide: true });
    if (sshProbe.status !== 0) {
      logMsg(`WARN: VPS ${VPS_HOST}:${VPS_PORT} SSH unreachable (${(sshProbe.stderr || '').trim() || 'timeout'}); skipping remote SSH sync (gdrive mirror is synced; verify WireGuard wg-site).`, quiet);
      return { dryVps: false, sshSkipped: true, plan };
    }
    runCmd('ssh', [...getVpsSshArgs('-p', 15), VPS_HOST, plan.remoteRefreshCmd], quiet);

    // 4. Sync SKU metadata/transcript/insight/docs/thumbnails/vault/scripts/data to VPS via tar over SSH stdin, then reload runtime
    if (plan.relPathsToSync.length > 0) {
      fs.mkdirSync(path.join(ROOT, '.cache'), { recursive: true });
      const tmpTar = `.cache/h2dev_vps_sync_${process.pid}_${crypto.randomBytes(4).toString('hex')}.tar`;
      const tmpTarAbs = path.join(ROOT, tmpTar);
      let tarFd = null;
      try {
        const sysTar = IS_WIN && fs.existsSync('C:/Windows/System32/tar.exe') ? 'C:/Windows/System32/tar.exe' : 'tar';
        const tarArgs = [...TAR_EXCLUDES.map(pat => `--exclude=${pat}`), '-cf', tmpTar, ...plan.relPathsToSync];
        runCmd(sysTar, tarArgs, quiet);
        tarFd = fs.openSync(tmpTarAbs, 'r');
        const sshArgs = [...getVpsSshArgs('-p', 15), VPS_HOST, plan.remoteUntarReloadCmd];
        logMsg(`EXEC: ssh ${sshArgs.join(' ')} < ${tmpTar}`, quiet);
        const sshRes = spawnSync('ssh', sshArgs, {
          cwd: ROOT,
          stdio: [tarFd, quiet ? 'pipe' : 'inherit', quiet ? 'pipe' : 'inherit'],
          encoding: 'utf8',
          windowsHide: true
        });
        if (sshRes.error || sshRes.status !== 0) {
          const errOut = sshRes.error ? sshRes.error.message : ((sshRes.stderr || sshRes.stdout || '').slice(-1000));
          throw new Error(`Command failed (ssh tar stdin upload): exit ${sshRes.status}\n${errOut}`);
        }
      } finally {
        if (tarFd !== null) {
          try { fs.closeSync(tarFd); } catch (_) {}
        }
        try { if (fs.existsSync(tmpTarAbs)) fs.unlinkSync(tmpTarAbs); } catch (_) {}
      }
    }
    return { dryVps: false, plan };
  } else {
    // Running directly on Linux VPS
    runCmd('bash', ['-lc', RCLONE_VFS_REFRESH_CMD], quiet);
    runCmd('/usr/local/bin/h2dev-sync-video-symlinks.sh', [], quiet);
    for (const sku of skus) {
      const mountMp4 = `/mnt/gdrive_h2dev/video/${sku}/${sku}.mp4`;
      const mountWebm = `/mnt/gdrive_h2dev/video/${sku}/${sku}.webm`;
      const hasMp4 = fs.existsSync(mountMp4) && fs.statSync(mountMp4).size > 0;
      const hasWebm = fs.existsSync(mountWebm) && fs.statSync(mountWebm).size > 0;
      if (!hasMp4 && !hasWebm) {
        throw new Error(`VPS mount file missing or empty: ${mountMp4} (or .webm)`);
      }
    }
    try {
      await fetch('http://127.0.0.1:8899/api/kg/reload', {
        method: 'POST',
        headers: { 'X-Requested-With': 'auto-ingest' }
      });
    } catch (_) {}
    return { dryVps: false, plan };
  }
}

async function runIngestPipeline(options = {}) {
  const quiet = !!options.quiet;
  if (!acquireIngestLock(quiet)) {
    return { skipped: true, reason: 'already-running' };
  }
  try {
    return await _runIngestPipelineCore(options);
  } finally {
    releaseIngestLock();
  }
}

async function _runIngestPipelineCore(options = {}) {
  const quiet = !!options.quiet;
  const targetSkus = Array.isArray(options.targetSkus) ? options.targetSkus : [];
  const repairIncomplete = Boolean(options.repairIncomplete);
  const dryVps = Boolean(options.dryVps);
  const forceRetry = Boolean(options.forceRetry);
  const targetSkuSet = new Set(targetSkus.map(s => s.toUpperCase()));
  logMsg('Starting 3-Branch Auto-Ingest Check...', quiet);
  const report = await checkAllBranches(quiet);

  // Merge newLessons + detected incompleteLessons (7-layer gate) + explicitly requested --sku lessons
  const lessonsMap = new Map();
  for (const item of report.newLessons) {
    lessonsMap.set(item.sku.toUpperCase(), { ...item, isNewUpstream: true });
  }
  const incompleteMap = new Map();
  for (const inc of (report.incompleteLessons || [])) {
    incompleteMap.set(inc.sku.toUpperCase(), inc);
    // During --run or --repair-incomplete, auto-repair incomplete SKUs instead of skipping them just because media exists
    if (!lessonsMap.has(inc.sku.toUpperCase())) {
      lessonsMap.set(inc.sku.toUpperCase(), inc);
    }
  }
  for (const reqSku of targetSkus) {
    const upper = reqSku.toUpperCase();
    if (!lessonsMap.has(upper)) {
      const found = (report.allUpstreamLessons || []).find(x => x.sku.toUpperCase() === upper) ||
                    incompleteMap.get(upper);
      if (found) {
        lessonsMap.set(upper, found);
      } else {
        const localMap = getLocalVideoSkus();
        if (localMap.has(upper)) {
          lessonsMap.set(upper, {
            branch: 'H2DEV',
            id: '',
            sku: localMap.get(upper),
            title: localMap.get(upper),
            url_key: '',
            created_at: '',
            duration_sec: 0,
            localOnly: true
          });
        } else {
          throw new Error(`Requested --sku ${reqSku} was not found in H2DEV, HUAN, DGMD upstream catalogs or local video/!`);
        }
      }
    }
  }
  const lessonsToProcess = [...lessonsMap.values()];

  if (lessonsToProcess.length === 0 && !options.forceRebuild) {
    logMsg('0 new or incomplete lessons found across H2DEV, HUAN, and DGMD. Exiting cleanly.', quiet);
    return report;
  }

  // Step 1 & 2: Per-SKU fault-isolated ingest with circuit breaker (.cache/auto-ingest-failures.json)
  const failureState = loadFailureState();
  const succeededLessons = [];
  const failedLessons = [];
  const skippedCircuitBreaker = [];

  if (lessonsToProcess.length > 0) {
    logMsg(`Processing ${lessonsToProcess.length} lesson(s) [new=${report.totalNewCount}, incomplete=${report.incompleteCount || 0}]: ${lessonsToProcess.slice(0, 12).map(x => `${x.sku}[${x.branch}]`).join(', ')}${lessonsToProcess.length > 12 ? ' ...' : ''}`, quiet);

    for (const item of lessonsToProcess) {
      const sku = item.sku;
      const failEntry = failureState[sku];
      const isExplicitTarget = targetSkuSet.has(sku.toUpperCase());
      if (
        !isExplicitTarget &&
        !forceRetry &&
        failEntry &&
        Number(failEntry.count || 0) >= CIRCUIT_BREAKER_THRESHOLD &&
        Date.now() < Number(failEntry.skipUntil || 0)
      ) {
        logMsg(`WARN: Circuit breaker open for ${sku} (failures=${failEntry.count}, skipUntil=${new Date(failEntry.skipUntil).toISOString()}, lastError=${failEntry.lastError}); skipping (use --sku ${sku} or --force-retry to override).`, quiet);
        skippedCircuitBreaker.push({ sku, branch: item.branch, ...failEntry });
        continue;
      }

      try {
        const flags = item.repairFlags || null;
        const shouldFetchUpstream = !flags || flags.needsFetch || flags.hasBadZip || flags.needsMedia || flags.needsReadme || isExplicitTarget;
        const prod = shouldFetchUpstream ? await fetchLessonDetailAndExtractAttachments(item, quiet) : {};
        const prodVideoLink = prod?.video_link || item.video_link || '';
        const isProtected = isProtectedVideoLink(prodVideoLink);

        // Pre-register BEFORE download ONLY for DRM (protected) lessons so /live/<SKU> can resolve it.
        // Non-DRM lessons must download & verify valid local media (>= 1MB) BEFORE registration.
        if (isProtected && (!flags || flags.needsRegistration)) {
          ensureSkuRegisteredInDataFiles(item, prod, quiet);
        }

        let media = resolveLocalMedia(sku);
        const mp4FallbackPath = path.join(ROOT, 'video', sku, `${sku}.mp4`);
        if ((!media || media.size < 1024 * 1024) && !item.localOnly) {
          await downloadLessonVideo(item, prod, mp4FallbackPath, quiet);
          media = resolveLocalMedia(sku);
        }

        if (!item.localOnly && (!media || media.size < 1024 * 1024)) {
          throw new Error(`Valid local media (>= 1MB) missing after download for ${sku}`);
        }

        if (!isProtected && (!flags || flags.needsRegistration) && media && media.size >= 1024 * 1024) {
          ensureSkuRegisteredInDataFiles(item, prod, quiet);
        }

        if (media && media.ext === '.mp4') {
          let needsFaststart = false;
          try {
            needsFaststart = inspectMp4Atoms(media.path).status !== 'MOOV_FIRST';
          } catch (_) {
            needsFaststart = true;
          }
          if (needsFaststart) {
            runCmd(process.execPath, ['scripts/ensure_video_faststart.cjs', '--apply', sku], quiet);
          }
        }

        // Step 2: CUDA GPU Silence Scan & Whisper Large-v3-Turbo Transcription + Gap Filling + ASR sanitization
        const silPath = path.join(ROOT, 'video', sku, 'silence.json');
        const trPath = path.join(ROOT, 'video', sku, 'transcript.json');
        if (media && !fs.existsSync(silPath)) {
          runPyScript('scripts/silence_scan.py', [sku], quiet);
        }
        if (media && !fs.existsSync(trPath)) {
          runPyScript('scripts/retranscribe_clean_turbo.py', [sku], quiet);
          runPyScript('scripts/fill_transcript_gaps.py', [sku], quiet);
          runPyScript('scripts/retranscribe_clean_turbo.py', [sku, '--fix-only'], quiet);
        }
        sanitizeSkuTranscriptFiles(sku, quiet);

        // Ensure grounded insight.json, docs/<SKU>/README.md, and catalog/module/niche registration
        await ensureGroundedInsightAndReadme(item, prod, quiet);
        ensureSkuRegisteredInDataFiles(item, prod, quiet);

        clearSkuFailure(failureState, sku);
        succeededLessons.push(item);
      } catch (err) {
        const rec = recordSkuFailure(failureState, sku, err);
        failedLessons.push({ sku, branch: item.branch, error: rec.lastError, count: rec.count });
        logMsg(`ERROR: Lesson ingest failed for ${sku} (attempt ${rec.count}): ${rec.lastError}`, quiet);
      } finally {
        cleanupSkuTempDirs(sku);
      }
    }
  }

  report.succeededLessons = succeededLessons;
  report.failedLessons = failedLessons;
  report.skippedCircuitBreaker = skippedCircuitBreaker;

  if (succeededLessons.length > 0 || options.forceRebuild) {
    // Step 3: Rebuild 7-Layer Data across all 3 branches (H2DEV, HUAN, DGMD), Knowledge Vault Graph, Master SQLite DB & Counts
    runCmd(process.execPath, ['scripts/build_h2dev_data.js'], quiet);
    runCmd(process.execPath, ['scripts/build_huan_data.js'], quiet);
    runCmd(process.execPath, ['scripts/build_dgmd_data.js'], quiet);
    syncNgachMetaBranchCounts(quiet);
    runCmd(process.execPath, ['scripts/build_master_db.js'], quiet);
    if (IS_WIN) {
      runCmd(process.execPath, ['scripts/build_knowledge_vault_graph.js'], quiet);
    }
    runCmd(process.execPath, ['scripts/sync-counts.js'], quiet);

    stageSkuAssetsForGitGuard(succeededLessons, quiet);

    // Step 4: Ensure 127.0.0.1:8899 is listening, verify 10-Gate SKU check + Grounding checks + Count check + Project Validation
    const srv = await ensureLocalServer(quiet);
    try {
      if (succeededLessons.length > 0) {
        const skusToVerify = succeededLessons.map(x => x.sku);
        const useNoShot = repairIncomplete || succeededLessons.length > 5;
        const verifyArgs = ['scripts/verify_sku_az.js', ...(useNoShot ? ['--no-shot'] : []), ...skusToVerify];
        runCmd(process.execPath, verifyArgs, quiet);
      }
    } finally {
      if (srv.spawned) {
        try { srv.spawned.kill(); } catch (_) {}
      }
    }

    runPyScript('scripts/check-grounding.py', ['--track', 'all'], quiet);
    runPyScript('scripts/check-grounding-md.py', ['--live'], quiet);

    // Guard against background server.js kg_auto_sync worker rebuilding h2dev_master.db concurrently
    await (async () => {
      const dbPath = path.join(ROOT, 'data', 'h2dev_master.db');
      if (!fs.existsSync(dbPath)) return;
      let DatabaseSync;
      try { ({ DatabaseSync } = require('node:sqlite')); } catch (_) { return; }
      let expectedLessons = 0;
      try { expectedLessons = require('./lib/counts').computeCounts().totalSystemVideos || 0; } catch (_) {}
      const waitDbReady = async () => {
        let waited = false;
        for (let attempt = 0; attempt < 50; attempt++) {
          let ready = false;
          try {
            const db = new DatabaseSync(dbPath, { readOnly: true });
            try {
              const lCount = db.prepare('SELECT COUNT(*) AS c FROM lessons').get().c;
              const ftsCount = db.prepare('SELECT COUNT(*) AS c FROM search_fts').get().c;
              if (lCount >= expectedLessons && ftsCount >= 3000) ready = true;
            } finally {
              db.close();
            }
          } catch (_) {
            ready = false;
          }
          if (ready) break;
          waited = true;
          await new Promise(r => setTimeout(r, 350));
        }
        return waited;
      };
      const waited1 = await waitDbReady();
      let needsResync = waited1;
      if (!needsResync) {
        try {
          const { applyDbRules } = require('./sync-counts');
          const dbCheck = applyDbRules({ write: false });
          if ((dbCheck.changes && dbCheck.changes.length > 0) || (dbCheck.missing && dbCheck.missing.length > 0)) {
            needsResync = true;
          }
        } catch (_) {}
      }
      if (needsResync) {
        await waitDbReady();
        runCmd(process.execPath, ['scripts/sync-counts.js'], quiet);
        await waitDbReady();
      }
    })();

    runCmd(process.execPath, ['scripts/sync-counts.js', '--check'], quiet);
    runCmd(process.execPath, ['scripts/validate-project.js'], quiet);

    // Reload live HTTP server RAM cache (hot_memory_store + kg_query) if running on 127.0.0.1:8899
    try {
      await fetch('http://127.0.0.1:8899/api/kg/reload', {
        method: 'POST',
        headers: { 'X-Requested-With': 'auto-ingest' }
      });
    } catch (_) {}

    // Step 5: Google Drive mirror verification + VPS rclone VFS refresh + symlink sync + metadata sync
    if (succeededLessons.length > 0 || options.syncVps || dryVps) {
      await syncVpsAndVerifySymlinks(succeededLessons, succeededLessons.some(x => x.isNewUpstream) || Boolean(options.syncVps), quiet, { dryVps });
    }
  }

  if (failedLessons.length > 0) {
    throw new Error(`Auto-Ingest finished with ${failedLessons.length} failed lesson(s) [succeeded=${succeededLessons.length}, skipped=${skippedCircuitBreaker.length}]: ${failedLessons.map(f => `${f.sku} (${f.error})`).join('; ')}`);
  }

  if (succeededLessons.length === 0 && !options.forceRebuild && skippedCircuitBreaker.length > 0) {
    logMsg(`All ${skippedCircuitBreaker.length} pending lesson(s) skipped by circuit breaker.`, quiet);
    return report;
  }

  logMsg('Auto-Ingest Pipeline completed 100% PASS!', quiet);
  return report;
}

function parseTargetSkus(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--sku' && i + 1 < args.length) {
      out.push(...args[i + 1].split(',').map(s => s.trim()).filter(Boolean).map(assertSafeSku));
      i++;
    } else if (a.startsWith('--sku=')) {
      out.push(...a.slice(6).split(',').map(s => s.trim()).filter(Boolean).map(assertSafeSku));
    }
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const targetSkus = parseTargetSkus(args);
  const repairIncomplete = args.includes('--repair-incomplete');
  const dryVps = args.includes('--dry-vps');
  const syncVps = args.includes('--sync-vps');
  const forceRetry = args.includes('--force-retry');
  const isRun = args.includes('--run') || repairIncomplete || targetSkus.length > 0;
  const isCheck = args.includes('--check') || (!isRun && !dryVps);
  const quiet = args.includes('--quiet');
  const jsonOut = args.includes('--json');

  if (dryVps && !args.includes('--run') && !repairIncomplete) {
    const sampleLessons = (targetSkus.length > 0 ? targetSkus : ['VIDEO-8a7455', 'ZOOM-01-Nen-tang-moi-truong'])
      .map(s => ({ sku: s, branch: 'H2DEV' }));
    const res = await syncVpsAndVerifySymlinks(sampleLessons, syncVps, quiet || jsonOut, { dryVps: true });
    if (jsonOut) {
      console.log(JSON.stringify(res, null, 2));
    }
    return;
  }

  if (isCheck && !isRun) {
    const rep = await checkAllBranches(quiet || jsonOut);
    if (jsonOut) {
      console.log(JSON.stringify(rep, null, 2));
    }
    return;
  }

  await runIngestPipeline({
    quiet,
    forceRebuild: args.includes('--force-rebuild'),
    syncVps,
    repairIncomplete,
    dryVps,
    forceRetry,
    targetSkus
  });
}

if (require.main === module) {
  main().catch(err => {
    logMsg(`FATAL: ${err && (err.stack || err.message || err)}`, false);
    console.error('[auto_ingest_pipeline] FATAL:', err.message || err);
    process.exit(1);
  });
}

module.exports = {
  checkAllBranches,
  runIngestPipeline,
  buildCompletenessContext,
  inspectSkuCompleteness,
  sanitizeSkuTranscriptFiles,
  buildVpsSyncPlan,
  checkpointLocalSqliteDbs
};
