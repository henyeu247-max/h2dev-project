// H2DEV Project - Log Auto-Rotation & Management System
// Rules:
// 1. All logs strictly directed to D:\YTB\H2DEV-Project\logs\
// 2. Auto-rotates and gzip compresses when any log file exceeds 10 MB (10,485,760 bytes)
// 3. Retains up to MAX_BACKUPS (default: 5) compressed archives per log
// 4. Scans roots to prevent loose orphan .log files in D:\YTB or project root

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(PROJECT_ROOT, '..');
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');
const ARCHIVE_DIR = path.join(WORKSPACE_ROOT, '_archive', 'logs-automated');

const MAX_LOG_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_BACKUPS = 5;

// Ensure logs directory exists
function ensureDirectories() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

// Format timestamp YYYYMMDD-HHmmss
function getTimestampString() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${y}${m}${d}-${hh}${mm}${ss}`;
}

// Compress and rotate single log file
function rotateFile(filePath, maxSize = MAX_LOG_SIZE_BYTES, force = false) {
  try {
    if (!fs.existsSync(filePath)) return { rotated: false, reason: 'not_found' };

    const st = fs.statSync(filePath);
    if (!st.isFile()) return { rotated: false, reason: 'not_a_file' };

    if (!force && st.size < maxSize) {
      return { rotated: false, reason: 'below_threshold', size: st.size };
    }

    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath);
    const timestamp = getTimestampString();
    const rotatedGzName = `${baseName}.${timestamp}.gz`;
    const rotatedGzPath = path.join(dir, rotatedGzName);

    // Read uncompressed content and compress to .gz
    const content = fs.readFileSync(filePath);
    const compressed = zlib.gzipSync(content);
    fs.writeFileSync(rotatedGzPath, compressed);

    // Truncate active log file back to 0 bytes safely
    fs.truncateSync(filePath, 0);

    // Enforce retention policy: keep newest MAX_BACKUPS archives
    cleanupOldBackups(dir, baseName, MAX_BACKUPS);

    return {
      rotated: true,
      originalSize: st.size,
      compressedSize: compressed.length,
      archive: rotatedGzName
    };
  } catch (err) {
    return { rotated: false, error: err.message };
  }
}

// Remove old backups exceeding retention limit
function cleanupOldBackups(dir, baseName, maxBackups) {
  try {
    const files = fs.readdirSync(dir);
    const pattern = new RegExp(`^${escapeRegex(baseName)}\\.\\d{8}-\\d{6}\\.gz$`);
    const matching = files
      .filter(f => pattern.test(f))
      .map(f => {
        const full = path.join(dir, f);
        const st = fs.statSync(full);
        return { name: f, full, mtime: st.mtime.getTime() };
      })
      .sort((a, b) => b.mtime - a.mtime); // Newest first

    if (matching.length > maxBackups) {
      const toDelete = matching.slice(maxBackups);
      for (const item of toDelete) {
        try {
          fs.unlinkSync(item.full);
        } catch (e) {
          // ignore unlink error
        }
      }
    }
  } catch (err) {
    // ignore directory scan error
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Scan roots for loose orphan .log files and move them into logs/
function sweepLooseLogFiles() {
  ensureDirectories();
  const swept = [];

  // Check project root D:\YTB\H2DEV-Project
  try {
    const projFiles = fs.readdirSync(PROJECT_ROOT);
    for (const f of projFiles) {
      if (f.endsWith('.log')) {
        const src = path.join(PROJECT_ROOT, f);
        const dest = path.join(LOGS_DIR, f);
        try {
          if (fs.statSync(src).isFile()) {
            // Append or move
            if (fs.existsSync(dest)) {
              const content = fs.readFileSync(src);
              fs.appendFileSync(dest, content);
              fs.unlinkSync(src);
            } else {
              fs.renameSync(src, dest);
            }
            swept.push({ source: src, destination: dest });
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  // Check workspace root D:\YTB (move to archive if found)
  try {
    const wsFiles = fs.readdirSync(WORKSPACE_ROOT);
    for (const f of wsFiles) {
      if (f.endsWith('.log')) {
        const src = path.join(WORKSPACE_ROOT, f);
        if (!fs.existsSync(ARCHIVE_DIR)) {
          fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
        }
        const dest = path.join(ARCHIVE_DIR, f);
        try {
          if (fs.statSync(src).isFile()) {
            fs.renameSync(src, dest);
            swept.push({ source: src, destination: dest });
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  return swept;
}

// Rotate all log files in logs/
function checkAndRotateAll(maxSize = MAX_LOG_SIZE_BYTES, force = false) {
  ensureDirectories();
  const swept = sweepLooseLogFiles();
  const results = [];

  try {
    const files = fs.readdirSync(LOGS_DIR);
    for (const file of files) {
      if (file.endsWith('.log')) {
        const fullPath = path.join(LOGS_DIR, file);
        const res = rotateFile(fullPath, maxSize, force);
        results.push({ file, ...res });
      }
    }
  } catch (err) {
    results.push({ error: err.message });
  }

  return { swept, results };
}

// Background scheduler for server.js
let intervalTimer = null;
function initLogRotation(intervalMs = 30 * 60 * 1000) { // Default 30 minutes
  ensureDirectories();
  // Initial check on boot
  checkAndRotateAll();

  if (intervalTimer) clearInterval(intervalTimer);
  intervalTimer = setInterval(() => {
    checkAndRotateAll();
  }, intervalMs);

  // Do not hold Node process alive if everything else exits
  if (intervalTimer && intervalTimer.unref) {
    intervalTimer.unref();
  }
}

// CLI Execution
if (require.main === module) {
  const force = process.argv.includes('--force');
  console.log('=== H2DEV LOG ROTATION AUDIT & EXECUTION ===');
  console.log('Logs Directory:', LOGS_DIR);
  console.log('Threshold:', (MAX_LOG_SIZE_BYTES / (1024 * 1024)).toFixed(1) + ' MB');
  console.log('Force Mode:', force);

  const report = checkAndRotateAll(MAX_LOG_SIZE_BYTES, force);
  if (report.swept && report.swept.length > 0) {
    console.log('[Sweep] Moved orphan log files:');
    report.swept.forEach(s => console.log(`  ${s.source} -> ${s.destination}`));
  } else {
    console.log('[Sweep] No orphan log files in root directories.');
  }

  console.log('[Rotation Results]');
  report.results.forEach(r => {
    if (r.rotated) {
      console.log(`  [ROTATED] ${r.file}: ${(r.originalSize / 1024).toFixed(1)} KB -> ${r.archive} (${(r.compressedSize / 1024).toFixed(1)} KB)`);
    } else if (r.error) {
      console.log(`  [ERROR] ${r.file}: ${r.error}`);
    } else {
      console.log(`  [OK] ${r.file}: ${(r.size / 1024).toFixed(1)} KB (below ${(MAX_LOG_SIZE_BYTES / (1024 * 1024)).toFixed(1)} MB threshold)`);
    }
  });
  console.log('=== AUDIT COMPLETED ===');
}

module.exports = {
  LOGS_DIR,
  MAX_LOG_SIZE_BYTES,
  MAX_BACKUPS,
  rotateFile,
  checkAndRotateAll,
  sweepLooseLogFiles,
  initLogRotation
};
