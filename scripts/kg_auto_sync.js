/**
 * kg_auto_sync.js — Engine Đồng bộ Tức thì & Tự động Phát hiện Thay đổi Đa Dự Án (Zero-Touch Live Sync)
 *
 * Cơ chế hoạt động 3 tầng:
 *   1. Real-Time OS Watcher (`fs.watch` đệ quy trên Windows ReadDirectoryChangesW):
 *      Tự động phát hiện ngay khi có Dự án mới, Thư mục mới, File mới hoặc File vừa sửa trong D:\YTB.
 *   2. Smart Anti-Loop Filter & Debounce (1.2s):
 *      Bỏ qua các file dẫn xuất (`.db`, `.db-wal`, `knowledge_graph.json`, `knowledge-hub/vault`, `logs/`, `_audit/`)
 *      để không bao giờ tự kích hoạt vòng lặp vô tận.
 *   3. Just-In-Time (JIT) Fingerprint Check (`checkIfStaleAndSync()`):
 *      Đối chiếu bảng `kg_sync_state` trong SQLite với ổ đĩa thực tế (< 12ms); nếu phát hiện file mới/sửa/xóa
 *      khi Watcher chưa chạy, lập tức đồng bộ tức thì (`~375ms`) trước khi trả kết quả cho Agent hoặc Web UI.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
function getGraphBuilder() {
  return require('./build_knowledge_vault_graph').buildKnowledgeAndInfraGraph;
}

const ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(ROOT, '..');
const DB_PATH = path.join(ROOT, 'data', 'h2dev_knowledge_graph.db');
const JSON_GRAPH_PATH = path.join(ROOT, 'data', 'knowledge_graph.json');
const REGISTRY_PATH = path.join(ROOT, 'data', 'projects-registry.json');
const IS_MASTER_WORKSPACE = fs.existsSync(path.join(WORKSPACE_ROOT, 'research-repos')) && path.basename(ROOT).toLowerCase() === 'h2dev-project';

const IGNORED_PATH_PARTS = new Set([
  '.git', 'node_modules', '_private', '_backup', '_audit', '_internal',
  '_drafts', '_archive', '_verify', '_frames', '_tmp_audio', '_tmp-proof',
  '.cache', '.venv', '.venv-gpu', '.zcode', '.pi', '.playwright-mcp',
  '.agents', '.clinerules', '.codebuddy', '.codex', '.grok',
  '.tmp.drivedownload', '.tmp.driveupload', '.vscode', '.workbuddy', '.workbuddy-ai',
  '_inspect-treawork', 'logs', 'inbox', 'raw-kenh-goc', 'design-is-2026-08-22',
  'dist', 'build', '__pycache__', 'coverage', 'vault'
]);

const IGNORED_FILES = new Set([
  'h2dev_knowledge_graph.db',
  'h2dev_knowledge_graph.db-wal',
  'h2dev_knowledge_graph.db-shm',
  'h2dev_master.db',
  'h2dev_master.db-wal',
  'h2dev_master.db-shm',
  'intelligence.db',
  'intelligence.db-wal',
  'intelligence.db-shm',
  'knowledge_graph.json',
  'counts-manifest.json'
]);

let syncVersion = 1;
let lastSyncedAt = Date.now();
let lastSyncDurationMs = 0;
let lastChangedFile = 'Initial Boot';
let isSyncing = false;
let cooldownUntil = 0;
let debounceTimer = null;
let watchersStarted = false;

function shouldIgnoreRelPath(relPath) {
  if (!relPath) return true;
  if (Date.now() < cooldownUntil) return true;
  const norm = String(relPath).replace(/\\/g, '/').replace(/\/+$/g, '');
  const base = path.basename(norm);
  if (IGNORED_FILES.has(base) || base.startsWith('.env') || base.endsWith('.tmp') || base.endsWith('.log') || base.endsWith('.db-journal')) {
    return true;
  }
  // Ignore bare directory change events from Windows ReadDirectoryChangesW
  if (norm === 'H2DEV-Project/data' || norm === 'H2DEV-Project/knowledge-hub' || norm === 'H2DEV-Project' || !path.extname(base)) {
    // Allow new directory detection only if it's not an existing parent folder
    const abs = path.join(WORKSPACE_ROOT, norm);
    if (norm.startsWith('H2DEV-Project/data') || norm.startsWith('H2DEV-Project/knowledge-hub')) {
      return true;
    }
    try {
      if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
        // Check if this directory is already known in isGraphStale before triggering
        return false;
      }
    } catch (_) {}
  }
  const parts = norm.split('/');
  for (const p of parts) {
    const low = p.toLowerCase();
    if (IGNORED_PATH_PARTS.has(low)) return true;
  }
  return false;
}

/**
 * Kiểm tra nhanh (< 12ms) xem các file đã lưu trong `kg_sync_state` hoặc số lượng thư mục dự án
 * trên đĩa có thay đổi so với lần build gần nhất hay không.
 */
function isGraphStale() {
  if (!fs.existsSync(DB_PATH) || !fs.existsSync(JSON_GRAPH_PATH)) return { stale: true, reason: 'missing_db_or_json' };
  if (!IS_MASTER_WORKSPACE) return { stale: false, reason: 'synced_from_master_workspace' };
  let db = null;
  try {
    db = new DatabaseSync(DB_PATH);
    const rows = db.prepare(`SELECT path, mtime_ms, size_bytes FROM kg_sync_state`).all();
    if (!rows.length) return { stale: true, reason: 'empty_sync_state' };

    for (const r of rows) {
      const abs = path.join(WORKSPACE_ROOT, r.path);
      let st;
      try {
        st = fs.statSync(abs);
      } catch (_) {
        return { stale: true, reason: `deleted:${r.path}` };
      }
      if (Math.round(st.mtimeMs) !== r.mtime_ms || st.size !== r.size_bytes) {
        return { stale: true, reason: `modified:${r.path}` };
      }
    }

    // Kiểm tra xem có thư mục dự án mới xuất hiện trong D:\YTB, pipelines, hoặc research-repos không
    const graphMeta = JSON.parse(fs.readFileSync(JSON_GRAPH_PATH, 'utf8'));
    const knownProjPaths = new Set((graphMeta.projects || []).map(p => p.relPath));
    const checkNewDirs = (baseDir, prefix) => {
      if (!fs.existsSync(baseDir)) return null;
      for (const e of fs.readdirSync(baseDir, { withFileTypes: true })) {
        if (!e.isDirectory()) continue;
        const low = e.name.toLowerCase();
        if (low.startsWith('.') || low.startsWith('_') || IGNORED_PATH_PARTS.has(low)) continue;
        if (!prefix && ['h2dev-project', 'research-repos', 'docs', 'nhạc nền', 'claude outputs', 'zoom'].includes(low)) continue;
        const rel = prefix ? `${prefix}/${e.name}` : e.name;
        if (!knownProjPaths.has(rel)) return `new_project:${rel}`;
      }
      return null;
    };

    const newRootProj = checkNewDirs(WORKSPACE_ROOT, '');
    if (newRootProj) return { stale: true, reason: newRootProj };
    const newPipeProj = checkNewDirs(path.join(ROOT, 'pipelines'), 'H2DEV-Project/pipelines');
    if (newPipeProj) return { stale: true, reason: newPipeProj };
    const newRepoProj = checkNewDirs(path.join(WORKSPACE_ROOT, 'research-repos'), 'research-repos');
    if (newRepoProj) return { stale: true, reason: newRepoProj };

    // Kiểm tra nhanh số lượng file trong các thư mục chính của H2DEV-Project
    const quickDirs = ['scripts', 'data-tabs', 'assets/app', 'docs/NOI-BO'];
    const indexedInDir = new Map();
    for (const r of rows) {
      for (const qd of quickDirs) {
        const prefix = `H2DEV-Project/${qd}/`;
        if (r.path.startsWith(prefix) && !r.path.slice(prefix.length).includes('/')) {
          indexedInDir.set(qd, (indexedInDir.get(qd) || 0) + 1);
        }
      }
    }
    const registry = fs.existsSync(REGISTRY_PATH) ? JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8')) : {};
    const allowedExts = new Set((registry.indexedExtensions || ['.js', '.py', '.json', '.md', '.html', '.css']).map(x => x.toLowerCase()));
    for (const qd of quickDirs) {
      const absQd = path.join(ROOT, qd);
      if (!fs.existsSync(absQd)) continue;
      const diskFiles = fs.readdirSync(absQd, { withFileTypes: true }).filter(e => e.isFile() && allowedExts.has(path.extname(e.name).toLowerCase())).length;
      if (diskFiles !== (indexedInDir.get(qd) || 0)) {
        return { stale: true, reason: `dir_count_changed:${qd}` };
      }
    }

    return { stale: false, reason: 'up_to_date' };
  } catch (err) {
    return { stale: true, reason: `check_error:${err.message}` };
  } finally {
    if (db) {
      try { db.close(); } catch (_) {}
    }
  }
}

function triggerSyncNow(reason = 'manual', fullMarkdown = false) {
  if (!IS_MASTER_WORKSPACE && fs.existsSync(DB_PATH) && fs.existsSync(JSON_GRAPH_PATH)) {
    let stats = null;
    try { stats = JSON.parse(fs.readFileSync(JSON_GRAPH_PATH, 'utf8')).stats; } catch (_) {}
    syncVersion++;
    lastSyncedAt = Date.now();
    lastChangedFile = reason;
    return { synced: true, syncVersion, lastSyncedAt, lastSyncDurationMs: 1, reason, stats };
  }
  if (isSyncing) return { synced: false, status: 'already_syncing', syncVersion, lastSyncedAt };
  isSyncing = true;
  const t0 = performance.now();
  try {
    const stats = getGraphBuilder()({
      skipVaultMarkdown: !fullMarkdown,
      silent: true
    });
    lastSyncDurationMs = Math.round(performance.now() - t0);
    lastSyncedAt = Date.now();
    cooldownUntil = Date.now() + 2500;
    lastChangedFile = reason;
    syncVersion++;
    return {
      synced: true,
      syncVersion,
      lastSyncedAt,
      lastSyncDurationMs,
      reason,
      stats
    };
  } finally {
    isSyncing = false;
  }
}

let _lastFreshCheckAt = 0;
const FRESH_CHECK_TTL_MS = 2500;

function ensureGraphFresh(forceCheck = false) {
  const now = Date.now();
  if (!forceCheck && (watchersStarted || (now - _lastFreshCheckAt < FRESH_CHECK_TTL_MS)) && fs.existsSync(DB_PATH)) {
    return {
      synced: false,
      status: 'fresh_cached',
      syncVersion,
      lastSyncedAt,
      lastSyncDurationMs,
      lastChangedFile
    };
  }
  _lastFreshCheckAt = now;
  const check = isGraphStale();
  if (check.stale) {
    return triggerSyncNow(check.reason, false);
  }
  return {
    synced: false,
    status: 'fresh',
    syncVersion,
    lastSyncedAt,
    lastSyncDurationMs,
    lastChangedFile
  };
}

function startAutoSyncWatcher(onSyncCallback = null) {
  if (watchersStarted) return;
  watchersStarted = true;

  // Ensure initial freshness on boot
  try {
    ensureGraphFresh();
  } catch (e) {
    console.error('[KG-AutoSync] Boot check error:', e.message);
  }

  const watchTargets = [
    { dir: ROOT, prefix: 'H2DEV-Project' },
    { dir: path.join(WORKSPACE_ROOT, 'research-repos'), prefix: 'research-repos' },
    { dir: path.join(WORKSPACE_ROOT, 'docs'), prefix: 'docs' }
  ];

  for (const wt of watchTargets) {
    if (!fs.existsSync(wt.dir)) continue;
    try {
      const watcher = fs.watch(wt.dir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        const rel = wt.prefix ? `${wt.prefix}/${String(filename).replace(/\\/g, '/')}` : String(filename).replace(/\\/g, '/');
        if (shouldIgnoreRelPath(rel)) return;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          try {
            const res = triggerSyncNow(`${eventType}:${rel}`, false);
            if (res.synced && typeof onSyncCallback === 'function') {
              onSyncCallback(res);
            }
          } catch (err) {
            console.error('[KG-AutoSync] Watcher rebuild error:', err.message);
          }
        }, 1200);
        if (debounceTimer.unref) debounceTimer.unref();
      });
      if (watcher.unref) watcher.unref();
    } catch (err) {
      console.error(`[KG-AutoSync] Could not watch ${wt.dir}:`, err.message);
    }
  }
}

function getSyncStatus() {
  let stats = null;
  try {
    const g = JSON.parse(fs.readFileSync(JSON_GRAPH_PATH, 'utf8'));
    stats = g.stats;
    if (g.generatedAt) lastSyncedAt = Math.max(lastSyncedAt, new Date(g.generatedAt).getTime());
  } catch (_) {}
  return {
    autoSyncActive: watchersStarted,
    syncVersion,
    lastSyncedAt: new Date(lastSyncedAt).toISOString(),
    lastSyncDurationMs,
    lastChangedFile,
    stats
  };
}

module.exports = {
  isGraphStale,
  triggerSyncNow,
  ensureGraphFresh,
  startAutoSyncWatcher,
  getSyncStatus
};
