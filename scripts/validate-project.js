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

// Nguon so lieu chuan: data/counts-manifest.json (ban chot, commit git).
// Sinh/cap nhat bang: node scripts/sync-counts.js
// validate so SANH manifest (ky vong) voi data live -> phat hien drift.
const countsManifest = readJson('data/counts-manifest.json') || {};
const C = countsManifest.counts || {};
const { computeCounts } = require('./lib/counts');
const liveCounts = computeCounts();

// Guard drift: neu data live khac manifest => can chay sync-counts.js.
for (const key of Object.keys(C)) {
  if (liveCounts[key] !== C[key]) {
    errors.push(`counts drift: ${key} live=${liveCounts[key]} manifest=${C[key]} — chay: node scripts/sync-counts.js`);
  }
}

const EXPECTED_VIDEOS = C.videos;
const EXPECTED_DOCUMENTS = C.documents;
const EXPECTED_CHANNELS = C.channels;
const EXPECTED_LIVE_CHANNELS = C.liveChannels;
const EXPECTED_DEAD_CHANNELS = C.deadChannels;
const EXPECTED_CANONICAL_RAW = C.canonicalRaw;
if (EXPECTED_VIDEOS === undefined) {
  errors.push('data/counts-manifest.json thieu so lieu — chay: node scripts/sync-counts.js');
}

// Nguon tai lieu token chuan: design-system/token-manifest.json (ban chot, commit git),
// SINH TU CSS THAT bang: node scripts/sync-tokens.js
// Ly do (SCAR-024, tai pham 3 lan): tokens.json viet tay chi ghi 28 token trong khi CSS
// that co 98 => "danh sach trong tai lieu KHONG phai tap day du". Guard nay ep tai lieu
// phai luon khop ma nguon, neu lech -> FAIL va buoc chay lai sync-tokens.
{
  const { buildManifest } = require('./lib/token-manifest');
  const tokenManifestPath = 'design-system/token-manifest.json';
  const docPath = 'docs/design-system/TOKEN-REFERENCE.md';
  if (!exists(tokenManifestPath)) {
    errors.push(`thieu ${tokenManifestPath} — chay: node scripts/sync-tokens.js`);
  } else if (!exists(docPath)) {
    errors.push(`thieu ${docPath} — chay: node scripts/sync-tokens.js`);
  } else {
    const liveTokens = buildManifest();
    const recorded = JSON.parse(fs.readFileSync(path.join(ROOT, tokenManifestPath), 'utf8'));
    if (liveTokens.totalTokens !== recorded.totalTokens) {
      errors.push(`token drift: CSS that co ${liveTokens.totalTokens} token, manifest ghi ${recorded.totalTokens} — chay: node scripts/sync-tokens.js`);
    } else {
      const liveKeys = Object.keys(liveTokens.tokens).sort();
      const recKeys = Object.keys(recorded.tokens || {}).sort();
      const missing = liveKeys.filter(k => !recKeys.includes(k));
      const extra = recKeys.filter(k => !liveKeys.includes(k));
      if (missing.length) errors.push(`token drift: manifest THIEU ${missing.length} token (${missing.slice(0, 5).join(', ')}...) — chay: node scripts/sync-tokens.js`);
      if (extra.length) errors.push(`token drift: manifest THUA ${extra.length} token (${extra.slice(0, 5).join(', ')}...) — chay: node scripts/sync-tokens.js`);
      // Doi chieu GIA TRI: khong duoc de tai lieu ghi sai gia tri (ca that: --topbar-bg)
      let valDrift = 0;
      for (const k of liveKeys) {
        if (recorded.tokens[k] && recorded.tokens[k].value !== liveTokens.tokens[k].value) {
          if (valDrift < 5) errors.push(`token drift: ${k} manifest="${recorded.tokens[k].value}" CSS="${liveTokens.tokens[k].value}" — chay: node scripts/sync-tokens.js`);
          valDrift++;
        }
      }
      if (valDrift > 5) errors.push(`token drift: ... va ${valDrift - 5} token nua lech gia tri — chay: node scripts/sync-tokens.js`);
    }
  }
}
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
const thumbSkus = new Set(thumbs.map(n => n.replace(/\.[^.]+$/, '')));
if (thumbSkus.size !== EXPECTED_VIDEOS) warnings.push(`thumbnail SKU count is ${thumbSkus.size}, expected ${EXPECTED_VIDEOS} (files=${thumbs.length})`);
if (channels.length !== EXPECTED_CHANNELS) errors.push(`Expected ${EXPECTED_CHANNELS} channel records; got ${channels.length}`);

// G5-gap: raw-kenh-mau summary phai khop aggregate tinh tu records
try {
  const rawKenPath = path.join(ROOT, 'data-tabs', 'raw-kenh-mau.json');
  if (fs.existsSync(rawKenPath)) {
    const rawKen = JSON.parse(fs.readFileSync(rawKenPath, 'utf8'));
    const recs = Array.isArray(rawKen) ? rawKen : (rawKen.records || []);
    const sum = (!Array.isArray(rawKen) && rawKen.summary) || {};
    let subs = 0, views = 0, vidiq = 0;
    for (const x of recs) {
      const ch = x.channel || {};
      subs += Number(ch.subscribers) || 0;
      views += Number(ch.views) || 0;
      if (x.vidiqVerification && x.vidiqVerification.status === 'VERIFIED') vidiq += 1;
    }
    if (sum.totalAggregatedSubscribers != null && Number(sum.totalAggregatedSubscribers) !== subs) {
      errors.push(`raw-kenh summary subs ${sum.totalAggregatedSubscribers} != computed ${subs}`);
    }
    if (sum.totalAggregatedViews != null && Number(sum.totalAggregatedViews) !== views) {
      errors.push(`raw-kenh summary views ${sum.totalAggregatedViews} != computed ${views}`);
    }
    if (sum.vidiqVerified != null && Number(sum.vidiqVerified) !== vidiq) {
      errors.push(`raw-kenh summary vidiqVerified ${sum.vidiqVerified} != computed ${vidiq}`);
    }
  }
} catch (e) {
  warnings.push('raw-kenh summary guard error: ' + e.message);
}
if (scripts.length !== C.kichBan) warnings.push(`legacy kich-ban.json records are ${scripts.length}, expected ${C.kichBan} local-file extract`);
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
  // SUA 2026-09-30: luat cu "TERMINATED thi khong co folderName" gia dinh kenh bi go TRUOC khi crawl.
  // Do N/N 29/09: RAW-143/145/152 crawl deep TRUOC khi bi go (yt-dlp 404 ngay 29/09), thu muc
  // data/raw-channels-deep/<folderName> VAN TON TAI (2 file moi thu muc) va main.js dung folderName de mo
  // dossier -> xoa folderName = mat duong dan toi bang chung lich su (vi pham NO_DELETE).
  // Luat dung: TERMINATED duoc giu folderName LICH SU, nhung folderName PHAI tro toi thu muc co that.
  if (lc && lc.state === 'TERMINATED_BY_YOUTUBE' && record.deepIntelligence && record.deepIntelligence.folderName) {
    const deepDir = path.join(ROOT, 'data', 'raw-channels-deep', record.deepIntelligence.folderName);
    if (!fs.existsSync(deepDir) || !fs.statSync(deepDir).isDirectory()) {
      errors.push(`data-tabs/raw-kenh-mau.json: ${record.id} TERMINATED co folderName nhung thu muc data/raw-channels-deep/${record.deepIntelligence.folderName} khong ton tai`);
    }
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
  const videoDenom = new RegExp(`/${EXPECTED_VIDEOS}\\s+video\\b`, 'i');
  if (/(?:^|\/)\d+\s+video\b/i.test(evidence) && !videoDenom.test(evidence) && meta?.historicalSnapshot !== true) {
    errors.push(`data-tabs/ngach-xanh.json: ngachMetaKho[${index}].evidence must use current /${EXPECTED_VIDEOS} video denominator`);
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
if (videoAcceptance.schema_version !== 'h2dev.video-acceptance.v1' || !videoAcceptance.pilot || !['not_started', 'in_progress', 'complete', 'blocked', 'paused'].includes(videoAcceptance.pilot.status)) {
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

// Guard: chan tai phat loi "CSS build cu / thieu class" (KE-HOACH-SUA-CHUA-TOAN-DIEN mục B8).
// Doi chieu class dung trong HTML voi dung cac file CSS ma trang nap that.
try {
  let result;
  try {
    const uiCheck = require('child_process').execFileSync(
      process.execPath, [path.join(__dirname, 'check-ui-classes.js'), '--json'],
      { cwd: ROOT, encoding: 'utf8' }
    );
    result = JSON.parse(uiCheck);
  } catch (spawnError) {
    // Fallback in-process khi spawnSync gap EBUSY hoac bi khoa tien trinh tren Windows
    const checker = require('./check-ui-classes.js');
    if (typeof checker.runCheck === 'function') {
      result = checker.runCheck({ jsonMode: true, silent: true });
    } else {
      throw spawnError;
    }
  }
  if (result.totalMissing > 0) {
    for (const r of result.report) {
      if (r.kind === 'missing-classes') {
        errors.push(`${r.page}: ${r.count} class thieu CSS that (${r.classes.slice(0, 6).join(', ')}${r.classes.length > 6 ? ', ...' : ''})`);
      }
      if (r.kind === 'missing-css-file') {
        errors.push(`${r.page}: thieu file CSS duoc nap (${r.detail})`);
      }
    }
  }
} catch (uiError) {
  // exitCode 1 = co class thieu (da parse o stdout); loi khac = checker hong
  const out = (uiError.stdout || '').trim();
  try {
    const result = JSON.parse(out);
    for (const r of result.report) {
      if (r.kind === 'missing-classes') {
        errors.push(`${r.page}: ${r.count} class thieu CSS that (${r.classes.slice(0, 6).join(', ')}${r.classes.length > 6 ? ', ...' : ''})`);
      } else if (r.kind === 'missing-css-file') {
        errors.push(`${r.page}: thieu file CSS duoc nap (${r.detail})`);
      }
    }
  } catch (parseError) {
    errors.push(`Khong chay duoc check-ui-classes.js: ${parseError.message}`);
  }
}

// Guard link trang cố định trong JS: href="/xxx.html" phải trỏ tới file có thật (vd. nút /watch-f59aa7.html từng 404).
{
  const jsDir = path.join(ROOT, 'assets', 'app');
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : (e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
  const dead = [];
  for (const file of walk(jsDir)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/href=["'](\/[A-Za-z0-9_-]+\.html)(?:[?#"'])/g)) {
      if (!exists(m[1].slice(1))) dead.push(`${path.relative(ROOT, file)} → ${m[1]}`);
    }
  }
  if (dead.length) errors.push(`JS trỏ tới trang HTML không tồn tại: ${[...new Set(dead)].join('; ')}`);
}

// Guard phân loại kênh mẫu: mọi kênh phải có niche + markets (kênh nhập sau hay thiếu → lọc/thống kê sai).
{
  const noClass = channels.filter(c => !c.niche || !Array.isArray(c.markets) || !c.markets.length).map(c => c.handle);
  if (noClass.length) errors.push(`kenh-mau.json: ${noClass.length} kênh thiếu niche/markets: ${noClass.slice(0, 5).join(', ')}${noClass.length > 5 ? ', …' : ''} — gán niche/markets kèm phanLoaiNguon (xem scripts/apply-kenh-mau-phanloai.js)`);
}

// Guard bám transcript: edit_sop/avoid_flags/sop_steps/key_takeaways/tools_mentioned/channels_mentioned phải có số,
// @handle, tên công cụ nằm trong transcript hoặc tài liệu kèm của chính video (scripts/check-grounding.py --live).
{
  const cp = require('child_process');
  const r = cp.spawnSync('py', ['-3', path.join('scripts', 'check-grounding.py'), '--live'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.error || r.status === null) {
    console.warn('[validate] bỏ qua guard bám transcript: không chạy được Python (' + (r.error ? r.error.message : 'status null') + ')');
  } else if (r.status !== 0) {
    const lines = String(r.stdout || '').split('\n').filter(Boolean);
    errors.push(`video_insights.json: ${lines[lines.length - 1]} — ví dụ: ${lines.slice(0, 3).join(' | ').slice(0, 300)} (chạy py -3 scripts/check-grounding.py --live)`);
  }
}

// Guard cặp khóa hoa/thường trong video_insights.json: player-main.js tra theo thứ tự
// resolvedSku → sku → lower → upper nên hai bản lệch nhau = người xem thấy bản cũ.
{
  const insights = readJson('data/video_insights.json') || {};
  const drifted = [];
  for (const key of Object.keys(insights)) {
    const m = /^VIDEO-([0-9A-F]{6})$/.exec(key);
    if (!m) continue;
    const twin = `VIDEO-${m[1].toLowerCase()}`;
    if (!insights[twin]) continue;
    const a = Object.assign({}, insights[key]);
    const b = Object.assign({}, insights[twin]);
    delete a.sku; delete b.sku;
    if (JSON.stringify(a) !== JSON.stringify(b)) drifted.push(key);
  }
  if (drifted.length) errors.push(`video_insights.json: cặp khóa hoa/thường lệch nội dung: ${drifted.join(', ')} — chép bản chữ hoa sang chữ thường`);
}

// Guard tài liệu hướng dẫn trỏ tới script không tồn tại (script bị xoá mà hướng dẫn còn ghi).
{
  const docFiles = [];
  const hub = path.join(ROOT, 'knowledge-hub', 'docs');
  if (fs.existsSync(hub)) fs.readdirSync(hub).filter(f => f.endsWith('.md')).forEach(f => docFiles.push(path.join(hub, f)));
  docFiles.push(path.join(ROOT, 'AGENTS.md'));
  for (const file of docFiles) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const seen = new Set();
    for (const m of text.matchAll(/\bnode\s+(scripts\/[A-Za-z0-9_./-]+\.(?:js|cjs))/g)) {
      if (seen.has(m[1])) continue;
      seen.add(m[1]);
      if (!exists(m[1])) errors.push(`${path.relative(ROOT, file)}: lệnh "node ${m[1]}" trỏ tới script không tồn tại`);
    }
  }
}

// Guard file data trỏ tới phải được git theo dõi: file có local nhưng chưa vào git thì deploy xong sẽ 404
// (vd. assets/docs/VIDEO-xxx/description.txt). Bỏ qua khi không có git.
if (fs.existsSync(path.join(ROOT, '.git'))) {
  try {
    const tracked = new Set(require('child_process').execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }).split('\n').map(s => s.trim()).filter(Boolean));
    const refs = new Set();
    for (const f of fs.readdirSync(tabDir).filter(n => n.endsWith('.json'))) {
      const text = fs.readFileSync(path.join(tabDir, f), 'utf8');
      for (const m of text.matchAll(/["'](\/?(?:assets\/docs|docs|assets\/thumbs)\/[^"'?#]+\.[A-Za-z0-9]+)["']/g)) refs.add(m[1].replace(/^\//, ''));
    }
    const untracked = [...refs].filter(r => { let p = r; try { p = decodeURIComponent(r); } catch (e) { /* giữ nguyên */ } return exists(p) && !tracked.has(p) && !tracked.has(r); });
    if (untracked.length) errors.push(`data-tabs trỏ tới ${untracked.length} file có local nhưng CHƯA vào git (deploy sẽ 404): ${untracked.slice(0, 5).join(', ')}${untracked.length > 5 ? ', …' : ''} — git add các file này`);
  } catch (gitError) {
    warnings.push(`Không chạy được guard file chưa track: ${gitError.message}`);
  }
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
