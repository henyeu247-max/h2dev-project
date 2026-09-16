const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const errors = [];
const warnings = [];

function readJson(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    errors.push(`${relativePath}: ${error.message}`);
    return null;
  }
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

const tabDir = path.join(ROOT, 'data-tabs');
const liveTabFiles = fs.existsSync(tabDir)
  ? fs.readdirSync(tabDir).filter(name => name.endsWith('.json') && !name.includes('.bak')).sort()
  : [];
const EXPECTED_TABS = ['chien-luoc.json', 'dong-bo-ngoai.json', 'kenh-mau.json', 'kich-ban.json', 'ngach-xanh.json', 'nguon-reup.json', 'raw-kenh-mau.json', 'tai-lieu-full.json', 'videos.json'];
if (liveTabFiles.join('|') !== EXPECTED_TABS.join('|')) {
  warnings.push(`data-tabs live files = [${liveTabFiles.join(', ')}]; expected exactly 9: ${EXPECTED_TABS.join(', ')}`);
}

const catalog = readJson('data/catalog.json') || [];
const catalogFull = readJson('data/catalog_full.json') || [];
const videos = readJson('data-tabs/videos.json') || [];
const channels = readJson('data-tabs/kenh-mau.json') || [];
const scripts = readJson('data-tabs/kich-ban.json') || [];
const docsMerged = readJson('data-tabs/tai-lieu-full.json') || [];
const resources = readJson('data-tabs/nguon-reup.json') || [];
const ngachXanh = readJson('data-tabs/ngach-xanh.json') || {};
const chienLuoc = readJson('data-tabs/chien-luoc.json') || {};
const rawCanonical = readJson('data-tabs/raw-kenh-mau.json') || {};
const videoAcceptance = readJson('data/video_acceptance.json') || {};

function uniqueSkus(records, name) {
  const skus = records.map(item => item && item.sku).filter(Boolean);
  const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index);
  if (duplicates.length) errors.push(`${name}: duplicate SKU ${[...new Set(duplicates)].join(', ')}`);
  return new Set(skus);
}

const catalogSkus = uniqueSkus(catalog, 'catalog.json');
const fullSkus = uniqueSkus(catalogFull, 'catalog_full.json');
const videoSkus = uniqueSkus(videos, 'videos.json');

const EXPECTED_VIDEOS = 136;
const EXPECTED_DOCUMENTS = 109;
const EXPECTED_CHANNELS = 165;
const EXPECTED_LIVE_CHANNELS = 152;
const EXPECTED_DEAD_CHANNELS = 13;
const EXPECTED_CANONICAL_RAW = 156;
if (catalog.length !== EXPECTED_VIDEOS || catalogFull.length !== EXPECTED_VIDEOS || videos.length !== EXPECTED_VIDEOS) {
  errors.push(`Expected ${EXPECTED_VIDEOS} video records; got catalog=${catalog.length}, full=${catalogFull.length}, tabs=${videos.length}`);
}
for (const sku of fullSkus) {
  if (!videoSkus.has(sku)) errors.push(`videos.json missing ${sku}`);
  if (!catalogSkus.has(sku)) errors.push(`catalog.json missing ${sku}`);
}
for (const video of videos) {
  if (!Array.isArray(video.docs)) errors.push(`${video.sku}: docs must be an array`);
  if (!Array.isArray(video.channels)) errors.push(`${video.sku}: channels must be an array`);
  if (!Array.isArray(video.market)) errors.push(`${video.sku}: market must be an array`);
  // Media file: prefer declared extension, fall back to .mp4 (legacy) and .webm (Zoom sessions)
  const mediaRel = video.mp4 || (video.local ? `video/${video.sku}/${video.sku}.mp4` : '');
  if (mediaRel) {
    const altRel = mediaRel.replace(/\.(mp4|webm)$/i, '');
    const candidates = [`${altRel}.mp4`, `${altRel}.webm`];
    const found = candidates.find(rel => exists(rel));
    if (!found) {
      errors.push(`${video.sku}: missing local media (${candidates.join(' | ')})`);
    } else if (fs.statSync(path.join(ROOT, found)).size === 0) {
      warnings.push(`${video.sku}: media is 0 bytes — download failed, not playable`);
    }
  } else {
    warnings.push(`${video.sku}: no local media (not downloaded yet)`);
  }
  if (video.image && !/^https?:\/\//i.test(video.image) && !exists(video.image)) {
    errors.push(`${video.sku}: missing thumbnail ${video.image}`);
  }
}

const videoDirs = fs.existsSync(path.join(ROOT, 'video'))
  ? fs.readdirSync(path.join(ROOT, 'video')).filter(name => fs.statSync(path.join(ROOT, 'video', name)).isDirectory())
  : [];
const thumbs = fs.existsSync(path.join(ROOT, 'assets', 'thumbs'))
  ? fs.readdirSync(path.join(ROOT, 'assets', 'thumbs')).filter(name => name !== 'placeholder.svg')
  : [];
if (videoDirs.length !== EXPECTED_VIDEOS) warnings.push(`video directory count is ${videoDirs.length}, expected ${EXPECTED_VIDEOS}`);
if (thumbs.length !== EXPECTED_VIDEOS) warnings.push(`thumbnail count is ${thumbs.length}, expected ${EXPECTED_VIDEOS}`);
if (channels.length !== EXPECTED_CHANNELS) errors.push(`Expected ${EXPECTED_CHANNELS} channel records; got ${channels.length}`);
if (scripts.length !== 45) warnings.push(`legacy kich-ban.json records are ${scripts.length}, expected 45 local-file extract`);
if (docsMerged.length !== EXPECTED_DOCUMENTS) errors.push(`Expected ${EXPECTED_DOCUMENTS} live document records; got ${docsMerged.length}`);

const deadChannels = channels.filter(channel => channel && channel.dead === true).length;
const liveChannels = channels.filter(channel => channel && channel.dead !== true).length;
if (deadChannels !== EXPECTED_DEAD_CHANNELS) errors.push(`Expected ${EXPECTED_DEAD_CHANNELS} dead channels; got ${deadChannels}`);
if (liveChannels !== EXPECTED_LIVE_CHANNELS) errors.push(`Expected ${EXPECTED_LIVE_CHANNELS} live channels; got ${liveChannels}`);

const rawRecords = Array.isArray(rawCanonical) ? rawCanonical : array(rawCanonical.records);
const rawIds = rawRecords.map(record => record && record.id).filter(Boolean);
if (rawRecords.length !== EXPECTED_CANONICAL_RAW) errors.push(`Expected ${EXPECTED_CANONICAL_RAW} canonical raw records; got ${rawRecords.length}`);
if (rawCanonical.totalRecords !== undefined && rawCanonical.totalRecords !== rawRecords.length) {
  errors.push(`data-tabs/raw-kenh-mau.json: totalRecords=${rawCanonical.totalRecords} but records=${rawRecords.length}`);
}
if (rawIds.length !== rawRecords.length || new Set(rawIds).size !== rawIds.length) {
  errors.push('data-tabs/raw-kenh-mau.json: canonical raw IDs must be present and unique');
}
// Guard 16/09: moi record phai co handleHistory >= 1 entry voi handle khop entry cuoi.
// Muc dich: chong tai dien lop loi "handle bi doi/ bi chiem ma khong ghi lai lich su" (phat hien 16/09).
const LIFECYCLE_STATES = new Set(['ACTIVE', 'RENAMED', 'HANDLE_HIJACKED', 'DUPLICATE', 'DEAD_404', 'TERMINATED_BY_YOUTUBE']);
for (const record of rawRecords) {
  const hist = Array.isArray(record.handleHistory) ? record.handleHistory : null;
  if (!hist || hist.length === 0) {
    errors.push(`data-tabs/raw-kenh-mau.json: ${record.id} missing handleHistory`);
  } else {
    const last = hist[hist.length - 1];
    const currentHandle = (record.channel && record.channel.handle) || '';
    if (last.handle !== currentHandle) {
      errors.push(`data-tabs/raw-kenh-mau.json: ${record.id} handleHistory last entry "${last.handle}" != channel.handle "${currentHandle}"`);
    }
    for (let i = 1; i < hist.length; i += 1) {
      if (hist[i].handle === hist[i - 1].handle) {
        errors.push(`data-tabs/raw-kenh-mau.json: ${record.id} handleHistory has duplicate consecutive entry "${hist[i].handle}"`);
      }
    }
  }
  // Guard channelLifecycle: state phai thuoc enum 6 trang thai chuan (6.1).
  const lc = record.channelLifecycle;
  if (!lc || !lc.state) {
    errors.push(`data-tabs/raw-kenh-mau.json: ${record.id} missing channelLifecycle.state`);
  } else if (!LIFECYCLE_STATES.has(lc.state)) {
    errors.push(`data-tabs/raw-kenh-mau.json: ${record.id} channelLifecycle.state "${lc.state}" not in enum (${[...LIFECYCLE_STATES].join(', ')})`);
  }
  // Nhat quan cheo: co duplicateOf thi state phai DUPLICATE; TERMINATED thi khong co folderName.
  if (record.duplicateOf && lc && lc.state && lc.state !== 'DUPLICATE') {
    errors.push(`data-tabs/raw-kenh-mau.json: ${record.id} co duplicateOf=${record.duplicateOf} nhung channelLifecycle.state=${lc.state}`);
  }
  if (lc && lc.state === 'TERMINATED_BY_YOUTUBE' && record.deepIntelligence && record.deepIntelligence.folderName) {
    errors.push(`data-tabs/raw-kenh-mau.json: ${record.id} TERMINATED nhung van con folderName`);
  }
}

const scope = ngachXanh.phamViKho || {};
const liveScope = {
  video: EXPECTED_VIDEOS,
  taiLieu: EXPECTED_DOCUMENTS,
  kenhMau: EXPECTED_CHANNELS,
  kenhDeadTrongFile: EXPECTED_DEAD_CHANNELS,
  kenhLiveTrongFile: EXPECTED_LIVE_CHANNELS,
  kenhDaDoSong: EXPECTED_CHANNELS,
  kenhLiveChuaDo: 0,
};
for (const [field, expected] of Object.entries(liveScope)) {
  if (scope[field] !== expected) errors.push(`data-tabs/ngach-xanh.json: phamViKho.${field}=${scope[field]} expected ${expected}`);
}

// Current meta evidence uses the live 136-record learning denominator. Keep
// historical snapshots opt-in so stale current counts cannot silently return.
for (const [index, meta] of array(ngachXanh.ngachMetaKho).entries()) {
  const evidence = typeof meta?.evidence === 'string' ? meta.evidence : '';
  if (/(?:^|\/)\d+\s+video\b/i.test(evidence) && !/\/136\s+video\b/i.test(evidence) && meta?.historicalSnapshot !== true) {
    errors.push(`data-tabs/ngach-xanh.json: ngachMetaKho[${index}].evidence must use current /136 video denominator`);
  }
}

// Only the active tree entry is checked here; historical audit prose may keep
// its original path when it is explicitly labelled historical.
const treeText = fs.readFileSync(path.join(ROOT, 'TREE.md'), 'utf8');
if (!/^\s*├──\s+raw-kenh-goc\\/m.test(treeText) || /^\s*├──\s+Raw Kênh Mẫu Tìm Kiếm\\/m.test(treeText)) {
  errors.push('TREE.md: active raw path must be raw-kenh-goc (old path is historical only)');
}

// These are current control/display surfaces. Historical reports are intentionally
// excluded so dated provenance such as 131/129/95 remains readable.
const liveControlText = [
  ['data-tabs/chien-luoc.json', JSON.stringify(chienLuoc)],
  ['index.html', fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')],
];
const staleCurrentTokens = [
  '131 video catalog',
  '131 kênh mẫu',
  'tai-lieu-full.json (96 card)',
  '161 kênh mẫu',
  'nguồn sự thật 131 SKU',
  'Bảng điểm phải = 131/131',
  '131/131 video sẵn sàng',
  '109 bài Pro',
  '0/131',
];
for (const [surface, text] of liveControlText) {
  for (const token of staleCurrentTokens) {
    if (text.includes(token)) errors.push(`${surface}: stale current count text "${token}"`);
  }
}
if (videoAcceptance.schema_version !== 'h2dev.video-acceptance.v1' || !videoAcceptance.pilot || !['not_started', 'in_progress', 'complete', 'blocked'].includes(videoAcceptance.pilot.status)) {
  errors.push('data/video_acceptance.json: pilot acceptance must remain explicit and structured');
}
if (!['pending', 'complete'].includes(videoAcceptance.pilot?.outputs?.mp4)) errors.push('data/video_acceptance.json: invalid mp4 status');
const noiBoDocs = docsMerged.filter(item => item && (item.source === 'noi-bo' || (item.sku === 'NOI-BO')));
if (!noiBoDocs.length) warnings.push('tai-lieu-full.json missing nội-bộ rows after 2026-08-18 sync');
for (const item of docsMerged) {
  if (item && item.file && !/^https?:\/\//i.test(item.file) && !exists(item.file)) {
    warnings.push(`tai-lieu missing file ${item.file} (${item.name})`);
  }
  if (item && item.fileLocal && !exists(item.fileLocal)) {
    warnings.push(`tai-lieu missing fileLocal ${item.fileLocal} (${item.name})`);
  }
}

const docsOnDisk = fs.existsSync(path.join(ROOT, 'docs'))
  ? fs.readdirSync(path.join(ROOT, 'docs'), { recursive: true }).filter(name => !name.endsWith(path.sep)).length
  : 0;
if (docsOnDisk < 45) warnings.push(`docs file count is ${docsOnDisk}; expected at least the original 45 extract files`);

// Guard: chan inline event handler chua du lieu dong (nguyen nhan lam nut Xem Video chet
// khi tieu de co dau nhay don). Chi tiet: scripts/guard-no-inline-onclick.js
try {
  const inlineGuard = require('./guard-no-inline-onclick.js');
  inlineGuard.scan().forEach((offender) => {
    errors.push(`index.html:${offender.line} inline handler chua du lieu dong (${offender.snippet})`);
  });
} catch (guardError) {
  errors.push(`Khong chay duoc guard-no-inline-onclick.js: ${guardError.message}`);
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} error(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  if (warnings.length) {
    console.error('Warnings:');
    warnings.forEach(warning => console.error(`- ${warning}`));
  }
  process.exitCode = 1;
} else {
  console.log('Validation passed.');
  console.log(`Videos: ${videos.length}; channels: ${channels.length}; kich-ban: ${scripts.length}; tai-lieu-full: ${docsMerged.length}; thumbnails: ${thumbs.length}; video directories: ${videoDirs.length}`);
  if (warnings.length) {
    console.log('Warnings:');
    warnings.forEach(warning => console.log(`- ${warning}`));
  }
}
