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

  return {
    videos: len(videos),
    videoLessons,
    zoomSessions,
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
