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
const geminiManifest = readJson('data/video_analysis_manifest.json') || {};
const geminiPublic = readJson('data/video_analysis_public.json') || {};
const geminiBatches = readJson('data/video_analysis_batches.json') || {};
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

const EXPECTED_VIDEOS = 132;
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
  if (video.mp4 && !exists(`video/${video.sku}/${video.sku}.mp4`)) errors.push(`${video.sku}: missing local MP4`);
  if (video.mp4 && exists(`video/${video.sku}/${video.sku}.mp4`) && fs.statSync(path.join(ROOT, `video/${video.sku}/${video.sku}.mp4`)).size === 0) {
    warnings.push(`${video.sku}: mp4 is 0 bytes — download failed, not playable`);
  }
  if (!video.mp4) warnings.push(`${video.sku}: no local MP4 (not downloaded yet)`);
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
if (channels.length !== 165) warnings.push(`channel count is ${channels.length}, expected 165 (161 + 4 kênh đối thủ mới từ VIDEO-73d98a: @涙のひと駅, @사연만남1짱, @simbot2, @元気な老後-t5d)`);
if (scripts.length !== 45) warnings.push(`legacy kich-ban.json records are ${scripts.length}, expected 45 local-file extract`);
if (docsMerged.length < 57) warnings.push(`live tai-lieu-full.json records are ${docsMerged.length}, expected at least 57 (catalog) + nội bộ`);
if (resources.length !== 27) warnings.push(`resource records are ${resources.length}, expected 27`);
const geminiRows = array(geminiManifest.videos);
if (geminiRows.length !== EXPECTED_VIDEOS) errors.push(`Gemini analysis manifest must contain ${EXPECTED_VIDEOS} records; got ${geminiRows.length}`);
const geminiSkus = uniqueSkus(geminiRows, 'video_analysis_manifest.json');
const geminiBySku = new Map(geminiRows.map(row => [row.sku, row]));
if (geminiManifest.schema_version !== 'h2dev.gemini.manifest.v1') errors.push('data/video_analysis_manifest.json: invalid schema_version');
if (geminiManifest.summary && geminiManifest.summary.videos !== geminiRows.length) errors.push('video_analysis_manifest.json: summary.videos mismatch');
if (geminiManifest.summary && geminiManifest.summary.analysis_done !== geminiRows.filter(row => ['validated_pending_review', 'approved'].includes(row.analysis_status)).length) errors.push('video_analysis_manifest.json: summary.analysis_done mismatch');
const batchItems = array(geminiBatches.batches).flatMap(batch => array(batch && batch.items));
const batchSkus = batchItems.map(item => item && item.sku).filter(Boolean);
if (geminiBatches.schema_version !== 'h2dev.gemini.batch-manifest.v1') errors.push('data/video_analysis_batches.json: invalid schema_version');
if (batchItems.length !== EXPECTED_VIDEOS || new Set(batchSkus).size !== EXPECTED_VIDEOS || !batchSkus.every(sku => geminiSkus.has(sku))) {
  errors.push(`Gemini batch manifest must contain each of ${EXPECTED_VIDEOS} catalog SKUs exactly once`);
}
for (const sku of fullSkus) {
  if (!geminiSkus.has(sku)) errors.push(`video_analysis_manifest.json missing ${sku}`);
}
for (const row of geminiRows) {
  if (!row || typeof row.sku !== 'string') errors.push('video_analysis_manifest.json: invalid row');
  if (!['not_started', 'validated_pending_review', 'approved', 'blocked'].includes(row.analysis_status)) errors.push(`${row.sku}: invalid Gemini analysis_status`);
  if (typeof row.coverage_percent !== 'number' || row.coverage_percent < 0 || row.coverage_percent > 100) errors.push(`${row.sku}: invalid Gemini coverage_percent`);
  if (typeof row.file_ok !== 'boolean' || typeof row.audio_ok !== 'boolean') errors.push(`${row.sku}: invalid Gemini media flags`);
  if (!Number.isInteger(row.source_size_bytes) || row.source_size_bytes < 0) errors.push(`${row.sku}: invalid Gemini source_size_bytes`);
  if (!['unverified', 'pending_claim_verification', 'verified', 'rejected'].includes(row.accuracy_status)) errors.push(`${row.sku}: invalid Gemini accuracy_status`);
  if (!['not_reviewed', 'pending_review', 'approved_for_ui'].includes(row.review_status)) errors.push(`${row.sku}: invalid Gemini review_status`);
}
if (geminiPublic.schema_version !== 'h2dev.gemini.public.v1' || !geminiPublic.videos || typeof geminiPublic.videos !== 'object') {
  errors.push('data/video_analysis_public.json: invalid public schema');
}
for (const sku of Object.keys(geminiPublic.videos || {})) {
  if (!geminiSkus.has(sku)) errors.push(`video_analysis_public.json has unknown ${sku}`);
  const row = geminiPublic.videos[sku];
  if (!['validated_pending_review', 'approved'].includes(row.status)) errors.push(`${sku}: invalid public analysis status`);
  if (typeof row.coverage_percent !== 'number' || row.coverage_percent < 0 || row.coverage_percent > 100) errors.push(`${sku}: invalid public coverage_percent`);
  if ('raw_file' in row) errors.push(`${sku}: public analysis must not expose raw_file`);
  if (row.raw_sha256 && !/^[a-f0-9]{64}$/i.test(row.raw_sha256)) errors.push(`${sku}: invalid public raw_sha256`);
  if (geminiBySku.get(sku)?.analysis_status !== row.status) errors.push(`${sku}: public/manifest status drift`);
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
