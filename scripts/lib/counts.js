// H2DEV Project - SINGLE SOURCE OF COUNT TRUTH (counts.js)
// ---------------------------------------------------------------------------
// Muc dich: KHONG hardcode so lieu (136/152/165/156...) rai rac khap du an.
// Moi script/doc/UI can so lieu thi DOC tu day. Them 1 video/kenh/tai lieu
// -> chi data doi, moi noi tu dong khop (sau khi chay scripts/sync-counts.js).
//
// Nguon chan ly: doc truc tiep data-tabs/*.json + data/catalog*.json.
// Khong doc DB (DB la projection dan xuat, co the stale hon JSON live).
// ---------------------------------------------------------------------------
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch (_) {
    return null;
  }
}

function len(value) {
  return Array.isArray(value) ? value.length : 0;
}

// Dem entry trong thu muc (an toan — tra 0 neu khong ton tai).
function countEntries(rel, { onlyDirs = false, onlyFiles = false, filter = null } = {}) {
  try {
    const full = path.join(ROOT, rel);
    return fs.readdirSync(full).filter((f) => {
      if (filter && !filter(f)) return false;
      let st;
      try { st = fs.statSync(path.join(full, f)); } catch (_) { return false; }
      if (onlyDirs && !st.isDirectory()) return false;
      if (onlyFiles && !st.isDirectory()) return true;
      if (onlyFiles) return false;
      return true;
    }).length;
  } catch (_) {
    return 0;
  }
}

const MEDIA_RE = /\.(mp4|webm|mkv|mov)$/i;
const IMG_RE = /\.(jpg|jpeg|png|webp|gif)$/i;

// Dem file media trong video/<sku>/<file> (1 cap) + tong dung luong byte.
function scanVideoDir() {
  let files = 0;
  let bytes = 0;
  try {
    const base = path.join(ROOT, 'video');
    for (const d of fs.readdirSync(base)) {
      const sub = path.join(base, d);
      let st;
      try { st = fs.statSync(sub); } catch (_) { continue; }
      if (!st.isDirectory()) continue;
      for (const f of fs.readdirSync(sub)) {
        if (!MEDIA_RE.test(f)) continue;
        try {
          files += 1;
          bytes += fs.statSync(path.join(sub, f)).size;
        } catch (_) { /* ignore */ }
      }
    }
  } catch (_) { /* ignore */ }
  return { files, bytes };
}

// Tinh toan TOAN BO so lieu song tu data. Khong hardcode bat ky so nao.
function computeCounts() {
  const videos = readJson('data-tabs/videos.json');
  const documents = readJson('data-tabs/tai-lieu-full.json');
  const channels = readJson('data-tabs/kenh-mau.json');
  const kichBan = readJson('data-tabs/kich-ban.json');
  const nguonReup = readJson('data-tabs/nguon-reup.json');
  const ngachXanh = readJson('data-tabs/ngach-xanh.json') || {};
  const rawCanonical = readJson('data-tabs/raw-kenh-mau.json') || {};

  const channelList = Array.isArray(channels) ? channels : [];
  const deadChannels = channelList.filter(c => c && c.dead === true).length;
  const liveChannels = channelList.filter(c => c && c.dead !== true).length;

  const rawRecords = Array.isArray(rawCanonical)
    ? rawCanonical
    : (Array.isArray(rawCanonical.records) ? rawCanonical.records : []);
  const rawUniqueChannels = new Set(
    rawRecords
      .map(r => r && r.channel && (r.channel.channelId || r.channel.id))
      .filter(Boolean)
  ).size;

  const nicheList = Array.isArray(ngachXanh.ngachXanh) ? ngachXanh.ngachXanh : [];
  // LUU Y: field `xanh` da kieu (boolean + string). Dem phai dung === true,
  // KHONG dung truthy (chuoi "CHUA DU BANG CHUNG" cung truthy).
  const nichesGreenTrue = nicheList.filter(n => n && n.xanh === true).length;

  // Tach bai VIDEO-* va phien ZOOM-* (tong videos = ca hai).
  const videoList = Array.isArray(videos) ? videos : [];
  const videoLessons = videoList.filter(v => v && /^VIDEO/i.test(String(v.sku || ''))).length;
  const zoomSessions = videoList.filter(v => v && /^ZOOM/i.test(String(v.sku || ''))).length;

  // Module lo trinh (data/modules.json co the la array hoac {modules:[...]}).
  const modulesFile = readJson('data/modules.json') || [];
  const modulesRaw = Array.isArray(modulesFile) ? modulesFile : (Array.isArray(modulesFile.modules) ? modulesFile.modules : []);
  let modulesItems = 0;
  let modulesWithBadge = 0;
  for (const m of modulesRaw) {
    const items = Array.isArray(m && m.items) ? m.items : [];
    for (const it of items) {
      modulesItems += 1;
      const badge = it && typeof it === 'object' ? it.badge : null;
      if (badge) modulesWithBadge += 1;
    }
  }

  const media = scanVideoDir();

  return {
    videos: len(videos),
    videoLessons,
    zoomSessions,
    videoFree: videoList.filter(v => v && v.free === true).length,
    videoPro: videoList.filter(v => v && v.free === false).length,
    documents: len(documents),
    channels: len(channelList),
    liveChannels,
    deadChannels,
    canonicalRaw: rawRecords.length,
    canonicalRawUniqueChannels: rawUniqueChannels,
    kichBan: len(kichBan),
    nguonReup: len(nguonReup),
    niches: nicheList.length,
    nichesGreenTrue,
    // --- Tai san tren dia (do truc tiep, chong lech docs) ---
    catalogRecords: len(readJson('data/catalog.json')),
    catalogFullRecords: len(readJson('data/catalog_full.json')),
    modules: len(modulesRaw),
    modulesItems: modulesItems,
    modulesWithBadge: modulesWithBadge,
    videoDirs: countEntries('video', { onlyDirs: true }),
    mediaFiles: media.files,
    mediaBytes: media.bytes,
    docsTotalDirs: countEntries('docs', { onlyDirs: true }),
    docsVideoDirs: countEntries('docs', { onlyDirs: true, filter: f => /^VIDEO-/.test(f) }),
    docsZoomDirs: countEntries('docs', { onlyDirs: true, filter: f => /^ZOOM-/.test(f) }),
    thumbFiles: countEntries('assets/thumbs', { onlyFiles: true }),
    rawChannelImages: (() => {
      const p = path.join(ROOT, 'raw-kenh-goc');
      if (!fs.existsSync(p)) {
        // Tren server deploy VPS (thu muc raw-kenh-goc bi gitignore), giu nguyen gia tri tu manifest da commit
        try {
          const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/counts-manifest.json'), 'utf8'));
          return m.counts.rawChannelImages || 135;
        } catch (_) { return 135; }
      }
      return countEntries('raw-kenh-goc', { filter: f => IMG_RE.test(f) });
    })(),
    rawRecordsWithoutImage: rawRecords.filter(r => r && !r.fileName).length,
    rawDeepProfiles: countEntries('data/raw-channels-deep', { onlyDirs: true }),
    sopDocs: countEntries('assets/docs/tai-lieu', { onlyFiles: true }),
    masterPrompts: countEntries('docs/NOI-BO/prompt', { onlyFiles: true }),
  };
}

// Manifest day du: counts + nhan (label) de doc tu dong vao docs/UI.
function buildManifest() {
  const counts = computeCounts();
  const generatedAt = new Date().toISOString();
  return {
    schema: 'h2dev.counts-manifest.v1',
    generatedAt,
    counts,
  };
}

// Doc manifest da luu (neu co); neu khong co thi tinh live.
function readManifest() {
  const m = readJson('data/counts-manifest.json');
  if (m && m.counts) return m;
  return buildManifest();
}

module.exports = { ROOT, computeCounts, buildManifest, readManifest };

if (require.main === module) {
  const m = buildManifest();
  console.log(JSON.stringify(m, null, 2));
}
