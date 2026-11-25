'use strict';
/**
 * ensure_video_faststart.cjs
 * Quét toàn bộ D:\YTB\H2DEV-Project\video\<SKU>\<SKU>.mp4, kiểm tra thứ tự atom MP4
 * (ftyp, moov, mdat) bằng cách đọc header 16-byte ở cấp top-level.
 *
 * - Bỏ qua các file đã đạt chuẩn MOOV_FIRST (moov đứng trước mdat).
 * - Khi chạy định kỳ (Task Scheduler / --watch, không có --all): bỏ qua các file vừa
 *   được ghi/sửa trong vòng 10 giây gần nhất để tránh đụng file đang tải dở.
 * - Khi phát hiện file MDAT_FIRST:
 *   1. Remux sang file tạm tại os.tmpdir() trên ổ C:\ (để GoogleDriveFS.exe trên D:\YTB
 *      không nhìn thấy hoặc tải lên file .tmp.mp4 đang ghi dở):
 *      ffmpeg -nostdin -hide_banner -loglevel error -y -i "<input>" -map 0 -c copy -movflags +faststart "<os.tmpdir()>/<SKU>_faststart.mp4"
 *   2. Kiểm định file xuất ra: tồn tại, dung lượng > 99% dung lượng gốc, và đạt MOOV_FIRST
 *      (moovOffset >= 0 && mdatOffset > moovOffset).
 *   3. Ghi đè tại chỗ bằng fs.copyFileSync(tempOut, inputPath) rồi fs.unlinkSync(tempOut)
 *      để giữ nguyên NTFS file ID (local_stable_id) cho GoogleDriveFS.exe.
 */

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const VIDEO_ROOT = path.join(ROOT, 'video');
const DEFAULT_FFMPEG = 'D:/Linly-Dubbing/bin/ffmpeg.exe';
const FFMPEG = process.env.FFMPEG || (fs.existsSync(DEFAULT_FFMPEG) ? DEFAULT_FFMPEG : 'ffmpeg');

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const explicitSkuList = [];
for (let i = 0; i < rawArgs.length; i++) {
  const a = rawArgs[i];
  if (a === '--sku' && i + 1 < rawArgs.length) {
    explicitSkuList.push(...rawArgs[++i].split(',').map(s => s.trim()).filter(Boolean));
  } else if (a.startsWith('--sku=')) {
    explicitSkuList.push(...a.slice(6).split(',').map(s => s.trim()).filter(Boolean));
  } else if (!a.startsWith('--') && /^(VIDEO|ZOOM)-[A-Za-z0-9_-]+$/i.test(a)) {
    explicitSkuList.push(a.trim());
  }
}
const EXPLICIT_SKUS = explicitSkuList.map(a => a.toUpperCase());
const EXPLICIT_SKU_SET = new Set(EXPLICIT_SKUS);
const WATCH_MODE = args.has('--watch');
const PROCESS_ALL = (args.has('--all') || args.has('--apply') || EXPLICIT_SKU_SET.size > 0) && !WATCH_MODE;
const CHECK_ONLY = (args.has('--check') || args.has('--dry-run')) && !args.has('--apply');
const MIN_AGE_MS = PROCESS_ALL ? 0 : 10 * 1000;
const LOCK_USER = process.env.USERNAME || process.env.USER || '';
const LOCK_HASH = crypto.createHash('sha256').update(`${ROOT}|${LOCK_USER}`).digest('hex').slice(0, 16);
const LOCK_DIR = path.join(os.tmpdir(), `h2dev_faststart_${LOCK_HASH}`);
const LOCK_FILE = path.join(LOCK_DIR, 'faststart.lock');
const CACHE_FILE = path.join(ROOT, '.cache', 'faststart-checked.json');

function loadFaststartCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) || {};
    }
  } catch (_) {}
  return {};
}

function saveFaststartCache(cacheObj) {
  if (CHECK_ONLY) return;
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheObj, null, 2), 'utf8');
  } catch (_) {}
}

function tryCreateLockExclusive() {
  fs.mkdirSync(LOCK_DIR, { recursive: true, mode: 0o700 });
  const fd = fs.openSync(LOCK_FILE, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY, 0o600);
  try {
    fs.writeFileSync(fd, String(process.pid), 'utf8');
  } finally {
    fs.closeSync(fd);
  }
}

function acquireLock() {
  if (CHECK_ONLY || EXPLICIT_SKU_SET.size > 0) return true;
  try {
    try {
      tryCreateLockExclusive();
      return true;
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
    const stat = fs.lstatSync(LOCK_FILE);
    if (stat.isSymbolicLink()) {
      throw new Error(`Refusing symlink lock file: ${LOCK_FILE}`);
    }
    const ageMs = Date.now() - stat.mtimeMs;
    const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim(), 10);
    let alive = false;
    if (Number.isFinite(pid) && pid > 0) {
      try {
        process.kill(pid, 0);
        alive = true;
      } catch (_) {
        alive = false;
      }
    }
    if (alive && ageMs < 60 * 60 * 1000) {
      console.log(`[FaststartGuard] Another instance (PID ${pid}) is running. Exiting.`);
      return false;
    }
    try { fs.unlinkSync(LOCK_FILE); } catch (_) {}
    try {
      tryCreateLockExclusive();
      return true;
    } catch (retryErr) {
      if (retryErr.code === 'EEXIST') {
        console.log('[FaststartGuard] Another instance acquired lock concurrently. Exiting.');
        return false;
      }
      throw retryErr;
    }
  } catch (_) {
    return true;
  }
}

function releaseLock() {
  if (CHECK_ONLY) return;
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const pid = parseInt(fs.readFileSync(LOCK_FILE, 'utf8').trim(), 10);
      if (pid === process.pid) {
        fs.unlinkSync(LOCK_FILE);
      }
    }
  } catch (_) {}
}

function inspectMp4Atoms(filePath) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const stat = fs.fstatSync(fd);
    const fileSize = stat.size;
    const buf = Buffer.alloc(16);
    let offset = 0;
    let ftypOffset = -1;
    let moovOffset = -1;
    let mdatOffset = -1;
    const atoms = [];

    while (offset + 8 <= fileSize) {
      const toRead = Math.min(16, fileSize - offset);
      const bytesRead = fs.readSync(fd, buf, 0, toRead, offset);
      if (bytesRead < 8) break;

      const size32 = buf.readUInt32BE(0);
      const type = buf.toString('ascii', 4, 8);
      let atomSize = size32;
      if (size32 === 1) {
        if (bytesRead < 16) break;
        atomSize = Number(buf.readBigUInt64BE(8));
      } else if (size32 === 0) {
        atomSize = fileSize - offset;
      }

      if (!Number.isFinite(atomSize) || atomSize < 8) break;

      atoms.push({ type, offset, size: atomSize });
      if (type === 'ftyp' && ftypOffset < 0) ftypOffset = offset;
      if (type === 'moov' && moovOffset < 0) moovOffset = offset;
      if (type === 'mdat' && mdatOffset < 0) mdatOffset = offset;

      offset += atomSize;
    }

    let status = 'UNKNOWN';
    if (moovOffset >= 0 && mdatOffset >= 0) {
      status = moovOffset < mdatOffset ? 'MOOV_FIRST' : 'MDAT_FIRST';
    } else if (moovOffset >= 0) {
      status = 'MOOV_ONLY';
    } else if (mdatOffset >= 0) {
      status = 'MDAT_ONLY';
    }

    return {
      fileSize,
      mtimeMs: stat.mtimeMs,
      ftypOffset,
      moovOffset,
      mdatOffset,
      status,
      atoms,
    };
  } finally {
    fs.closeSync(fd);
  }
}

function hasWebmMedia(skuDir, sku) {
  try {
    const expectedWebm = path.join(skuDir, `${sku}.webm`);
    if (fs.existsSync(expectedWebm) && fs.statSync(expectedWebm).isFile()) return true;
    for (const f of fs.readdirSync(skuDir)) {
      if (f.toLowerCase().endsWith('.webm') && fs.statSync(path.join(skuDir, f)).isFile()) return true;
    }
  } catch (_) {}
  return false;
}

function collectSkuMp4Files(filterSet = null, webmOut = null) {
  if (!fs.existsSync(VIDEO_ROOT)) return [];
  const entries = fs.readdirSync(VIDEO_ROOT, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const sku = entry.name;
    if (filterSet && filterSet.size > 0 && !filterSet.has(sku.toUpperCase())) continue;
    const skuDir = path.join(VIDEO_ROOT, sku);
    const expectedMp4 = path.join(skuDir, `${sku}.mp4`);
    if (fs.existsSync(expectedMp4)) {
      try {
        const st = fs.statSync(expectedMp4);
        if (st.isFile()) {
          results.push({ sku, filePath: expectedMp4 });
        }
      } catch (_) {}
    } else {
      // Fallback: check any <name>.mp4 inside video/<SKU>/
      let foundMp4 = false;
      try {
        const files = fs.readdirSync(skuDir);
        for (const f of files) {
          if (f.toLowerCase().endsWith('.mp4') && !f.toLowerCase().endsWith('.tmp.mp4')) {
            const full = path.join(skuDir, f);
            const st = fs.statSync(full);
            if (st.isFile()) {
              results.push({ sku, filePath: full });
              foundMp4 = true;
            }
          }
        }
      } catch (_) {}
      if (!foundMp4 && webmOut && hasWebmMedia(skuDir, sku)) {
        webmOut.push(sku);
      }
    }
  }
  results.sort((a, b) => a.sku.localeCompare(b.sku));
  return results;
}

function remuxFaststart({ sku, filePath }, info) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'h2dev-faststart-'));
  const tempOut = path.join(tempDir, `${sku}_faststart.mp4`);

  const ffArgs = [
    '-nostdin',
    '-hide_banner',
    '-loglevel', 'error',
    '-y',
    '-i', filePath,
    '-map', '0',
    '-c', 'copy',
    '-movflags', '+faststart',
    tempOut,
  ];

  const t0 = Date.now();
  try {
    const res = spawnSync(FFMPEG, ffArgs, {
      encoding: 'utf8',
      timeout: 30 * 60 * 1000,
      windowsHide: true,
    });

    if (res.error || res.status !== 0) {
      const errMsg = res.error ? res.error.message : (res.stderr || `exit ${res.status}`).trim();
      throw new Error(`FFmpeg failed for ${sku}: ${errMsg}`);
    }

    if (!fs.existsSync(tempOut)) {
      throw new Error(`Temp output missing for ${sku}: ${tempOut}`);
    }

    const outInfo = inspectMp4Atoms(tempOut);
    const ratio = info.fileSize > 0 ? (outInfo.fileSize / info.fileSize) : 0;
    if (ratio <= 0.99) {
      throw new Error(`Output size check failed for ${sku}: ${(ratio * 100).toFixed(2)}% of original (${outInfo.fileSize} vs ${info.fileSize})`);
    }

    if (!(outInfo.moovOffset >= 0 && outInfo.mdatOffset > outInfo.moovOffset)) {
      throw new Error(`Output atom order check failed for ${sku}: status=${outInfo.status} (moov=${outInfo.moovOffset}, mdat=${outInfo.mdatOffset})`);
    }

    // Copy in-place over original file to preserve NTFS file ID (local_stable_id in GoogleDriveFS)
    fs.copyFileSync(tempOut, filePath);
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
  }

  const finalInfo = inspectMp4Atoms(filePath);
  if (finalInfo.status !== 'MOOV_FIRST') {
    throw new Error(`Post-copy verification failed for ${sku}: status=${finalInfo.status}`);
  }

  const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
  return {
    sku,
    oldSize: info.fileSize,
    newSize: finalInfo.fileSize,
    moovOffset: finalInfo.moovOffset,
    mdatOffset: finalInfo.mdatOffset,
    elapsedSec,
  };
}

function main() {
  if (!acquireLock()) {
    process.exit(0);
  }

  try {
    const skippedWebmSkus = [];
    const mp4Files = collectSkuMp4Files(EXPLICIT_SKU_SET, skippedWebmSkus);
    let moovFirstCount = 0;
    let mdatFirstCount = 0;
    let skippedRecentCount = 0;
    let convertedCount = 0;
    let unknownCount = 0;
    const errors = [];
    const mdatFirstList = [];

    if (EXPLICIT_SKU_SET.size > 0) {
      const foundUpper = new Set(mp4Files.map(x => x.sku.toUpperCase()));
      const webmUpper = new Set(skippedWebmSkus.map(s => s.toUpperCase()));
      for (const reqSku of EXPLICIT_SKU_SET) {
        if (!foundUpper.has(reqSku) && !webmUpper.has(reqSku)) {
          errors.push({ sku: reqSku, error: `MP4 file not found under video/${reqSku}/` });
        }
      }
    }

    const faststartCache = loadFaststartCache();
    let cacheDirty = false;

    for (const item of mp4Files) {
      let stat;
      try {
        stat = fs.statSync(item.filePath);
      } catch (err) {
        errors.push({ sku: item.sku, error: `Stat error: ${err.message}` });
        continue;
      }

      const ageMs = Date.now() - stat.mtimeMs;
      const isRecent = MIN_AGE_MS > 0 && ageMs < MIN_AGE_MS;
      const mtimeRounded = Math.round(stat.mtimeMs);
      const cached = faststartCache[item.sku];
      if (!PROCESS_ALL && cached && cached.status === 'MOOV_FIRST' && cached.fileSize === stat.size && cached.mtimeMs === mtimeRounded) {
        moovFirstCount++;
        continue;
      }

      let info;
      try {
        info = inspectMp4Atoms(item.filePath);
      } catch (err) {
        if (isRecent) {
          skippedRecentCount++;
          console.log(`[SKIP-RECENT] ${item.sku} modified ${(ageMs / 1000).toFixed(1)}s ago (< 10s, read busy)`);
          continue;
        }
        errors.push({ sku: item.sku, error: `Read error: ${err.message}` });
        continue;
      }

      if (info.status === 'MOOV_FIRST') {
        moovFirstCount++;
        if (!cached || cached.fileSize !== stat.size || cached.mtimeMs !== mtimeRounded) {
          faststartCache[item.sku] = { fileSize: stat.size, mtimeMs: mtimeRounded, status: 'MOOV_FIRST' };
          cacheDirty = true;
        }
        continue;
      }

      if (isRecent) {
        if (info.status === 'MDAT_FIRST') mdatFirstCount++;
        skippedRecentCount++;
        console.log(`[SKIP-RECENT] ${item.sku} modified ${(ageMs / 1000).toFixed(1)}s ago (< 10s, status=${info.status})`);
        continue;
      }

      if (info.status === 'MDAT_FIRST') {
        mdatFirstCount++;
        mdatFirstList.push({ item, info });
      } else {
        unknownCount++;
        errors.push({ sku: item.sku, error: `Unexpected atom status=${info.status} (moov=${info.moovOffset}, mdat=${info.mdatOffset})` });
      }
    }

    if (!CHECK_ONLY && mdatFirstList.length > 0) {
      console.log(`[FaststartGuard] Found ${mdatFirstList.length} MDAT_FIRST file(s) to convert (out of ${mp4Files.length} total MP4s)...`);
      for (const { item, info } of mdatFirstList) {
        try {
          if (MIN_AGE_MS > 0) {
            const curStat = fs.statSync(item.filePath);
            const curAgeMs = Date.now() - curStat.mtimeMs;
            if (curAgeMs < MIN_AGE_MS) {
              skippedRecentCount++;
              console.log(`[SKIP-RECENT] ${item.sku} modified ${(curAgeMs / 1000).toFixed(1)}s ago (< 10s)`);
              continue;
            }
          }
          try {
            fs.accessSync(item.filePath, fs.constants.W_OK);
          } catch (wErr) {
            throw new Error(`Target file is not writable (read-only mount or symlink): ${wErr.message}`);
          }
          console.log(`[CONVERTING] ${item.sku} (${(info.fileSize / 1048576).toFixed(2)} MiB, moov=${info.moovOffset}, mdat=${info.mdatOffset})...`);
          const res = remuxFaststart(item, info);
          convertedCount++;
          moovFirstCount++;
          mdatFirstCount--;
          try {
            const afterStat = fs.statSync(item.filePath);
            faststartCache[item.sku] = { fileSize: afterStat.size, mtimeMs: Math.round(afterStat.mtimeMs), status: 'MOOV_FIRST' };
            cacheDirty = true;
          } catch (_) {}
          console.log(`[DONE] ${res.sku} -> MOOV_FIRST (moov=${res.moovOffset}, mdat=${res.mdatOffset}, ${(res.newSize / 1048576).toFixed(2)} MiB, ${res.elapsedSec}s)`);
        } catch (err) {
          console.error(`[ERROR] ${item.sku}: ${err.message}`);
          errors.push({ sku: item.sku, error: err.message });
        }
      }
    }

    if (cacheDirty) {
      saveFaststartCache(faststartCache);
    }

    const summary = {
      totalMp4: mp4Files.length,
      skippedWebm: skippedWebmSkus.length,
      moovFirst: moovFirstCount,
      mdatFirstRemaining: mdatFirstCount,
      converted: convertedCount,
      skippedRecent: skippedRecentCount,
      unknown: unknownCount,
      errors: errors.length,
    };

    console.log('[FaststartGuard] Summary:', JSON.stringify(summary));
    if (errors.length > 0) {
      for (const e of errors) {
        console.error(`  - ${e.sku}: ${e.error}`);
      }
      process.exitCode = 1;
    } else if (CHECK_ONLY && mdatFirstCount > 0) {
      process.exitCode = 1;
    }
  } finally {
    releaseLock();
  }
}

if (require.main === module) {
  main();
}

module.exports = { inspectMp4Atoms, collectSkuMp4Files };
