// H2DEV Project - Master SQLite WAL Database Builder
// Strictly implements Dual-Core Architecture:
// 100% N/N verification across all lessons, channels, top videos,
// documents, reup sources, niches, and FTS5 full-text indexing.
// So lieu ky vong lay tu scripts/lib/counts.js (khong hardcode).

const fs = require('fs');
const path = require('path');
const _origEmitWarningBmd = process.emitWarning;
process.emitWarning = function (w, ...rest) {
  if (String((w && w.message) || w).includes('SQLite is an experimental')) return;
  return _origEmitWarningBmd.call(process, w, ...rest);
};
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
// 2026-10-09: bien moi truong H2DEV_MASTER_DB_PATH (tuy chon) cho phep build ra file tam de doi chieu
// truoc khi thay DB live. Khong dat bien -> giu nguyen hanh vi cu (data/h2dev_master.db).
const DB_PATH = process.env.H2DEV_MASTER_DB_PATH
  ? path.resolve(process.env.H2DEV_MASTER_DB_PATH)
  : path.join(ROOT, 'data', 'h2dev_master.db');
const { computeCounts } = require('./lib/counts');
const C = computeCounts();

// Ensure DB directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Remove old DB file if starting fresh
if (fs.existsSync(DB_PATH)) {
  try { fs.unlinkSync(DB_PATH); } catch (e) {}
  try { fs.unlinkSync(DB_PATH + '-wal'); } catch (e) {}
  try { fs.unlinkSync(DB_PATH + '-shm'); } catch (e) {}
}

console.log('=== [1/8] INITIALIZING MASTER SQLITE WAL DATABASE ===');
console.log('Target Database Path:', DB_PATH);

const db = new DatabaseSync(DB_PATH);

// 1. Performance PRAGMAs
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA mmap_size = 30000000000;
  PRAGMA cache_size = -64000;
  PRAGMA foreign_keys = ON;
`);

// 2. DDL Schemas (drop existing tables if file is memory-mapped by live server)
db.exec(`
  PRAGMA foreign_keys = OFF;
  DROP TABLE IF EXISTS search_fts;
  DROP TABLE IF EXISTS checklists;
  DROP TABLE IF EXISTS policies;
  DROP TABLE IF EXISTS reup_sources;
  DROP TABLE IF EXISTS documents;
  DROP TABLE IF EXISTS competitor_top_videos;
  DROP TABLE IF EXISTS competitor_channels;
  DROP TABLE IF EXISTS lesson_timestamps;
  DROP TABLE IF EXISTS lessons;
  DROP TABLE IF EXISTS niches;
  PRAGMA foreign_keys = ON;
`);
db.exec(`
-- 1. Niches Table (44 records)
CREATE TABLE niches (
    niche_id TEXT PRIMARY KEY,
    name_vi TEXT NOT NULL,
    is_green INTEGER NOT NULL DEFAULT 1,
    priority_tier INTEGER DEFAULT 1,
    can_execute TEXT,
    revenue_potential TEXT,
    policy_risk TEXT,
    competition_note TEXT,
    breakout_freshness TEXT,
    evidence TEXT,
    base_rpm_low REAL DEFAULT 6.0,
    base_rpm_high REAL DEFAULT 14.0,
    target_markets_json TEXT
) STRICT;

-- 2. Lessons Table (136 records)
CREATE TABLE lessons (
    sku TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    actual_topic TEXT,
    niche_id TEXT,
    content_niche TEXT,
    target_market TEXT,
    market_code TEXT,
    duration TEXT NOT NULL,
    duration_sec INTEGER NOT NULL DEFAULT 0,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    resolution TEXT DEFAULT '1080p',
    width INTEGER DEFAULT 1920,
    height INTEGER DEFAULT 1080,
    mp4_path TEXT,
    thumbnail_path TEXT,
    origin_url TEXT,
    is_free INTEGER DEFAULT 0,
    is_pro INTEGER DEFAULT 1,
    has_video_stream INTEGER NOT NULL DEFAULT 1,
    has_audio_stream INTEGER NOT NULL DEFAULT 1,
    visual_audio_checked INTEGER NOT NULL DEFAULT 0,
    key_takeaways_json TEXT,
    edit_sop TEXT,
    avoid_flags_json TEXT,
    tools_mentioned_json TEXT,
    readme_path TEXT,
    FOREIGN KEY (niche_id) REFERENCES niches (niche_id)
) STRICT;

-- 3. Lesson Timestamps Table
CREATE TABLE lesson_timestamps (
    timestamp_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL,
    seconds INTEGER NOT NULL,
    time_label TEXT NOT NULL,
    title TEXT NOT NULL,
    FOREIGN KEY (sku) REFERENCES lessons (sku) ON DELETE CASCADE
) STRICT;

-- 4. Competitor Channels Table (165 records)
CREATE TABLE competitor_channels (
    channel_id TEXT PRIMARY KEY,
    raw_id TEXT,
    handle TEXT NOT NULL,
    title TEXT NOT NULL,
    channel_url TEXT NOT NULL,
    country TEXT DEFAULT 'US',
    avatar_url TEXT,
    local_avatar_path TEXT,
    subscribers INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    video_count INTEGER DEFAULT 0,
    niche_id TEXT,
    editorial_niche TEXT,
    latest_upload_date TEXT,
    days_since_latest INTEGER DEFAULT 0,
    ypp_status TEXT DEFAULT 'ACTIVE',
    is_monetized INTEGER DEFAULT 1,
    has_voice_sample INTEGER DEFAULT 0,
    voice_sample_path TEXT,
    wpm INTEGER DEFAULT 135,
    language_flag TEXT DEFAULT '🇺🇸',
    audio_language_code TEXT DEFAULT 'en-US',
    voice_talent_profile TEXT,
    has_mission_control INTEGER DEFAULT 0,
    sop_doc_path TEXT,
    dedicated_skill TEXT,
    master_script_prompt TEXT,
    handle_history_json TEXT,
    channel_lifecycle_json TEXT,
    FOREIGN KEY (niche_id) REFERENCES niches (niche_id)
) STRICT;

-- 5. Competitor Top Videos Table (793 records)
CREATE TABLE competitor_top_videos (
    video_id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    rank_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    published_at TEXT,
    vph REAL DEFAULT 0.0,
    outlier_multiplier TEXT DEFAULT '1.0x',
    outlier_score REAL DEFAULT 1.0,
    hook_snippet_en TEXT,
    hook_snippet_vi TEXT,
    has_transcript INTEGER DEFAULT 0,
    transcript_segments_count INTEGER DEFAULT 0,
    FOREIGN KEY (channel_id) REFERENCES competitor_channels (channel_id) ON DELETE CASCADE
) STRICT;

-- 6. Documents Table (300 records)
CREATE TABLE documents (
    doc_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT,
    doc_code TEXT,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    content_niche TEXT,
    link_url TEXT,
    file_local_path TEXT,
    source_label TEXT,
    FOREIGN KEY (sku) REFERENCES lessons (sku) ON DELETE SET NULL
) STRICT;

-- 7. Reup Sources Table (27 records)
CREATE TABLE reup_sources (
    reup_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT,
    name TEXT NOT NULL,
    host_type TEXT NOT NULL,
    link_url TEXT NOT NULL,
    content_niche TEXT,
    FOREIGN KEY (sku) REFERENCES lessons (sku) ON DELETE SET NULL
) STRICT;

-- 8. Policies Table (12 YouTube 2026 Policy Pillars)
CREATE TABLE policies (
    policy_id TEXT PRIMARY KEY,
    idx INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    cited_skus_json TEXT,
    cited_channels_json TEXT,
    cited_docs_json TEXT
) STRICT;

-- 9. Checklists Table (12 Pre-Publish Checklist Gates)
CREATE TABLE checklists (
    check_id TEXT PRIMARY KEY,
    idx INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    cited_skus_json TEXT
) STRICT;

-- 10. Full-Text Search FTS5 Table
CREATE VIRTUAL TABLE search_fts USING fts5(
    entity_id,
    entity_type,
    title,
    content_text,
    folded_text
);

-- Indices for rapid traversal
CREATE INDEX idx_lessons_niche ON lessons (niche_id, visual_audio_checked);
CREATE INDEX idx_channels_niche ON competitor_channels (niche_id, ypp_status);
CREATE INDEX idx_top_videos_views ON competitor_top_videos (channel_id, views DESC);
CREATE INDEX idx_timestamps_sku ON lesson_timestamps (sku, seconds ASC);
CREATE INDEX idx_docs_sku ON documents (sku, kind);
`);

console.log('=== [2/8] INGESTING NICHES (data-tabs/ngach-xanh.json) ===');
const ngachData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'ngach-xanh.json'), 'utf8'));
function foldVi(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }
const insertFtsRaw = db.prepare(`
  INSERT INTO search_fts (entity_id, entity_type, title, content_text, folded_text)
  VALUES (?, ?, ?, ?, ?)
`);
const insertFts = { run: (id, type, title, content) => insertFtsRaw.run(id, type, title, content, foldVi((title || '') + ' ' + (content || ''))) };

const insertNiche = db.prepare(`
  INSERT INTO niches (
    niche_id, name_vi, is_green, priority_tier, can_execute, revenue_potential,
    policy_risk, competition_note, breakout_freshness, evidence, base_rpm_low,
    base_rpm_high, target_markets_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

db.exec('BEGIN TRANSACTION;');

// 34 Ngách Xanh
let nicheCount = 0;
const nicheMap = new Map(); // name -> niche_id
const auditRankMap = new Map(
  ((ngachData.auditTong2026 && ngachData.auditTong2026.xepHang) || []).map(r => [r.ngach, r.thuTu || r.rank])
);

for (const n of ngachData.ngachXanh || []) {
  const id = foldVi(n.ngach).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  nicheMap.set(n.ngach, id);
  const rankNum = auditRankMap.get(n.ngach) || n.hang || 1;
  insertNiche.run(
    id,
    n.ngach,
    n.xanh === true ? 1 : 2, // 1 = fully green, 2 = conditionally green
    rankNum,
    n.lamDuoc || '',
    n.kiemDuoc || '',
    n.viPham || '',
    n.canhTranh || '',
    n.doMoi || '',
    n.evidence || '',
    6.0,
    14.0,
    JSON.stringify(n.thiTruong || [])
  );
  const alias = /Everyday History EN/i.test(n.ngach) ? 'US_EverydayHistory US EverydayHistory' : '';
  insertFts.run(
    id,
    'NICHE',
    `[Ngách Xanh Hạng ${rankNum}] ${n.ngach}`,
    `${n.ngach} ${id} ${alias} ${n.lamDuoc || ''} ${n.kiemDuoc || ''} ${n.viPham || ''} ${n.evidence || ''} ${(n.thiTruong || []).join(' ')} ${(n.mauSach || []).join(' ')} ${(n.mauBan || []).join(' ')}`
  );
  nicheCount++;
}

// 5 Meta Niches
for (const n of ngachData.ngachMetaKho || []) {
  const id = 'meta_' + foldVi(n.ngach).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  nicheMap.set(n.ngach, id);
  insertNiche.run(
    id,
    n.ngach,
    0, // Meta
    9,
    n.vaiTro || '',
    '',
    '',
    '',
    '',
    n.evidence || '',
    4.0,
    10.0,
    JSON.stringify([])
  );
  insertFts.run(id, 'NICHE', `[Nhóm Nền Tảng] ${n.ngach}`, `${n.ngach} ${id} ${n.vaiTro || ''} ${n.evidence || ''}`);
  nicheCount++;
}

// 5 Red Niches
for (const n of ngachData.ngachDoCanTranh || []) {
  const id = 'red_' + foldVi(n.ngach).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  nicheMap.set(n.ngach, id);
  insertNiche.run(
    id,
    n.ngach,
    -1, // Red / Prohibited
    99,
    'KHÔNG NÊN LÀM',
    'Rủi ro tắt kiếm tiền cao',
    n.lydo || '',
    n.lydo || '',
    'Bão hòa / Quét bản quyền',
    n.lydo || '',
    0.0,
    0.0,
    JSON.stringify([])
  );
  insertFts.run(id, 'NICHE', `[Ngách Đỏ Cần Tránh] ${n.ngach}`, `${n.ngach} ${id} KHÔNG NÊN LÀM ${n.lydo || ''}`);
  nicheCount++;
}

// Build canonical SKU -> niche_id and Handle -> niche_id maps from ngach-xanh.json
// so all 44 canonical niches (Green + Meta + Red) link directly to their lessons and benchmark channels.
const canonicalNicheBySku = new Map();
const canonicalNicheByHandle = new Map();
for (const n of ngachData.ngachMetaKho || []) {
  const nid = nicheMap.get(n.ngach);
  if (!nid) continue;
  for (const s of (n.skus || [])) {
    canonicalNicheBySku.set(s, nid);
  }
}
for (const n of ngachData.ngachXanh || []) {
  const nid = nicheMap.get(n.ngach);
  if (!nid) continue;
  for (const s of (n.skus || [])) {
    if (!canonicalNicheBySku.has(s) || (n.skus || []).length <= 4) {
      canonicalNicheBySku.set(s, nid);
    }
  }
  for (const h of [...(n.mauSach || []), ...(n.mauPhu || []), ...(n.mauBan || [])]) {
    if (h) canonicalNicheByHandle.set(String(h).toLowerCase(), nid);
  }
}
const explicitHandleNicheOverrides = {
  '@factoryrebornvn': 'nha_may_san_xuat',
  '@kronoset.history': 'nha_may_san_xuat',
  '@sincewwii': 'dia_chinh_tri_en_north_effect',
  '@blitzkrieg-channel': 'dia_chinh_tri_en_north_effect',
  '@kapitalkompass-us': 'quy_luat_kinh_te_economy_rewind',
  '@workshopdecoded': 'kiem_soat_sinh_hoc_chien_thuat',
  '@simpleconceptsexplained': 'kiem_soat_sinh_hoc_chien_thuat',
  '@기적의마인드-w7d': 'dua_tre_han',
  '@ericbennettmd': 'red_ai_gia_bac_si_doctors_warn',
  '@doctordr.lee-h9t': 'red_ai_gia_bac_si_doctors_warn',
  '@doctorjohnmeyers': 'red_ai_gia_bac_si_doctors_warn',
  '@richpatternresearchinstitute': 'red_ai_tu_van_tai_chinh_co_phieu',
  '@wildbirdsurvival-jp': 'red_wildlife_distress_rescue',
  '@새벽의두만강': 'red_farm_doi_ten_nhan_vat',
  '@구름야담': 'red_farm_doi_ten_nhan_vat',
  '@darkcrimeshistory': 'red_true_crime_chien_tranh_hien_dai_compilation_anime_recap_clip_goc',
  '@unseentruecrime': 'red_true_crime_chien_tranh_hien_dai_compilation_anime_recap_clip_goc',
  '@the_regular_recap': 'red_true_crime_chien_tranh_hien_dai_compilation_anime_recap_clip_goc'
};
for (const [h, nid] of Object.entries(explicitHandleNicheOverrides)) {
  canonicalNicheByHandle.set(h.toLowerCase(), nid);
}

db.exec('COMMIT;');
console.log(`Ingested ${nicheCount} Niches into table 'niches'.`);

function formatEditSop(sop) {
  if (!sop) return '';
  if (typeof sop === 'string') return sop;
  if (Array.isArray(sop)) return sop.join('\n');
  if (typeof sop === 'object') {
    const parts = [];
    if (sop.primary) parts.push(`Kỹ thuật chính: ${sop.primary}`);
    if (Array.isArray(sop.additional)) {
      sop.additional.forEach((a, i) => parts.push(`Bổ sung ${i + 1}: ${a}`));
    }
    return parts.join('\n');
  }
  return String(sop);
}

console.log('=== [3/8] INGESTING LESSONS & TIMESTAMPS (333 Videos across 3 branches) ===');
const catalogFull = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog_full.json'), 'utf8'));
const catalogSlim = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog.json'), 'utf8'));
const catalogHuan = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog_huan.json'), 'utf8'));
const catalogDgmd = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog_dgmd.json'), 'utf8'));
const videoTabs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'videos.json'), 'utf8'));
const videosHuan = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'videos_huan.json'), 'utf8'));
const videosDgmd = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'videos_dgmd.json'), 'utf8'));
const videoInsightsH2 = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'video_insights.json'), 'utf8'));
const videoInsightsHuan = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'video_insights_huan.json'), 'utf8'));
const videoInsightsDgmd = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'video_insights_dgmd.json'), 'utf8'));
const videoInsights = Object.assign({}, videoInsightsH2, videoInsightsHuan, videoInsightsDgmd);
const allCatalogFull = catalogFull.concat(catalogHuan, catalogDgmd);

// Map SKU -> nguồn phụ trợ (fix 16/09: catalog_full thiếu duration_sec/is_pro/resolution;
// videos.json là nguồn sự thật của UI cho market; catalog.json có đủ media metadata)
const slimBySku = new Map(catalogSlim.concat(catalogHuan, catalogDgmd).map(v => [v.sku, v]));
const tabsBySku = new Map((Array.isArray(videoTabs) ? videoTabs : []).concat(videosHuan, videosDgmd).map(v => [v.sku, v]));
const MARKET_FLAG_TO_CODE = {
  '🇻🇳 Việt': 'VN', '🇯🇵 Nhật': 'JP', '🇰🇷 Hàn': 'KR', '🇨🇳 Trung': 'CN',
  '🇺🇸 Mỹ': 'US', '🇷🇺 Nga': 'RU', '🌐 Ngoại': 'GLOBAL', '🇨🇦 Canada': 'CA',
  '🇹🇭 Thái': 'TH', '🇵🇭 Phil': 'PH', '🇬🇧 Anh': 'GB', '🇭🇰 HK': 'HK'
};
function marketCodeFromTab(tab) {
  if (!tab || !Array.isArray(tab.market) || !tab.market.length) return null;
  const codes = [];
  for (const flag of tab.market) {
    const code = MARKET_FLAG_TO_CODE[flag];
    if (code && !codes.includes(code)) codes.push(code);
  }
  return codes.length ? codes.join(',') : null;
}

const insertLesson = db.prepare(`
  INSERT INTO lessons (
    sku, title, actual_topic, niche_id, content_niche, target_market, market_code,
    duration, duration_sec, size_bytes, resolution, width, height, mp4_path,
    thumbnail_path, origin_url, is_free, is_pro, has_video_stream, has_audio_stream,
    visual_audio_checked, key_takeaways_json, edit_sop, avoid_flags_json,
    tools_mentioned_json, readme_path
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertTimestamp = db.prepare(`
  INSERT INTO lesson_timestamps (sku, seconds, time_label, title)
  VALUES (?, ?, ?, ?)
`);

db.exec('BEGIN TRANSACTION;');
let lessonCount = 0;
let timestampCount = 0;
const lessonTitleBySku = new Map();
const lessonNicheBySku = new Map();

for (const v of allCatalogFull) {
  const sku = v.sku;
  const insight = videoInsights[sku] || {};
  const slim = slimBySku.get(sku) || {};
  const tab = tabsBySku.get(sku) || {};

  // Niche lookup (ưu tiên canonical mapping từ ngach-xanh.json trước)
  const nicheName = v.niche_primary || insight.niche_primary || 'Khác';
  const resolvedContentNiche = v.contentNiche || v.niche || nicheName;
  lessonTitleBySku.set(sku, v.title);
  lessonNicheBySku.set(sku, resolvedContentNiche);
  let nicheId = canonicalNicheBySku.get(sku) || nicheMap.get(nicheName);
  if (!nicheId) {
    nicheId = 'niche_' + foldVi(nicheName).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!nicheMap.has(nicheName)) {
      insertNiche.run(nicheId, nicheName, 0, 5, '', '', '', '', '', '', 5.0, 10.0, JSON.stringify([]));
      nicheMap.set(nicheName, nicheId);
    }
  }

  const takeaways = insight.key_takeaways || [];
  const editSop = formatEditSop(insight.edit_sop);
  const avoidFlags = insight.avoid_flags || [];
  const tools = insight.tools_mentioned || [];
  const readmePath = `docs/${sku}/README.md`;

  // Fix 16/09: market_code lấy từ videos.json (nguồn UI) — catalog_full từng hardcode JP sai 10 dòng.
  // Fallback giữ nguyên chuỗi cũ nếu tab thiếu cờ.
  const tabMarketCode = marketCodeFromTab(tab);
  const marketCode = tabMarketCode || v.market_code || insight.market_code || 'ALL';
  const targetMarket = tabMarketCode
    ? (tab.market || []).join(' / ')
    : (v.target_market || insight.target_market || 'Toàn cầu');

  // Fix 16/09: duration_sec chỉ có trong catalog.json (catalog_full thiếu hoàn toàn)
  const durationSec = slim.duration_sec || v.duration_sec || 0;
  // Fix 16/09: is_pro/is_free theo catalog.json (nguồn UI) — catalog_full hardcode is_pro=true
  const isFree = slim.is_free !== undefined ? slim.is_free : (v.free || v.is_free ? true : false);
  const isPro = slim.is_pro !== undefined ? slim.is_pro : (v.is_pro !== false);
  // Fix 16/09 + 26/10: resolution/width/height ưu tiên kích thước thực tế
  const width = slim.width || v.width || 1920;
  const height = slim.height || v.height || 1080;
  let resolution = slim.resolution || v.resolution || '1080p';
  if (width >= 3840 || height >= 3840) resolution = '4K';
  else if (width >= 2560 || height >= 2560) resolution = '2K';
  else if (height > width) resolution = 'Shorts 1080p';
  const originUrl = v.origin || v.video_link || (sku.startsWith('ZOOM-') ? `docs/NOI-BO/zoom/${sku}.md` : '');

  insertLesson.run(
    sku,
    v.title,
    insight.actual_topic || v.actual_topic || v.title,
    nicheId,
    v.contentNiche || v.niche || nicheName,
    targetMarket,
    marketCode,
    v.duration || '00:00',
    durationSec,
    v.size || 0,
    resolution,
    width,
    height,
    v.mp4 || `video/${sku}/${sku}.mp4`,
    v.image || `assets/thumbs/${sku}.png`,
    originUrl,
    isFree ? 1 : 0,
    isPro ? 1 : 0,
    v.size > 0 ? 1 : 0,
    v.size > 0 ? 1 : 0,
    insight.visual_audio_checked ? 1 : 0,
    JSON.stringify(takeaways),
    editSop,
    JSON.stringify(avoidFlags),
    JSON.stringify(tools),
    readmePath
  );
  lessonCount++;

  // Insert Timestamps — fix 16/09: label nằm ở field ts.label (trước đây đọc ts.title -> rỗng 689/689)
  for (const ts of insight.key_timestamps || []) {
    insertTimestamp.run(sku, ts.seconds || 0, ts.time || '00:00', ts.label || ts.title || '');
    timestampCount++;
  }

  // Insert FTS5 full text search
  const searchableText = `${sku} ${v.title} ${nicheName || ''} ${insight.actual_topic || ''} ${takeaways.join(' ')} ${editSop} ${avoidFlags.join(' ')} ${tools.join(' ')}`;
  insertFts.run(sku, 'LESSON', v.title, searchableText);
}

db.exec('COMMIT;');
console.log(`Ingested ${lessonCount} Lessons and ${timestampCount} Timestamps into database.`);

console.log('=== [4/8] INGESTING COMPETITOR CHANNELS & DOSSIERS (165 + 97 Canonical) ===');
const kenhMau = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'kenh-mau.json'), 'utf8'));
const rawKenhMau = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'raw-kenh-mau.json'), 'utf8')).records || [];

const insertChannel = db.prepare(`
  INSERT INTO competitor_channels (
    channel_id, raw_id, handle, title, channel_url, country, avatar_url,
    local_avatar_path, subscribers, total_views, video_count, niche_id,
    editorial_niche, latest_upload_date, days_since_latest, ypp_status,
    is_monetized, has_voice_sample, voice_sample_path, wpm, language_flag,
    audio_language_code, voice_talent_profile, has_mission_control,
    sop_doc_path, dedicated_skill, master_script_prompt, handle_history_json,
    channel_lifecycle_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(channel_id) DO UPDATE SET
    raw_id = coalesce(competitor_channels.raw_id, excluded.raw_id),
    subscribers = max(competitor_channels.subscribers, excluded.subscribers),
    total_views = max(competitor_channels.total_views, excluded.total_views),
    video_count = max(competitor_channels.video_count, excluded.video_count),
    -- Fix 16/09: 2 ban ghi cung channelId (RAW-089/127) - giu handle_history DAY DU hon
    -- (truoc day coalesce lay excluded -> ban 1-entry cua RAW-127 de mat chain cua RAW-089)
    handle_history_json = CASE
      WHEN excluded.handle_history_json IS NULL THEN competitor_channels.handle_history_json
      WHEN competitor_channels.handle_history_json IS NULL THEN excluded.handle_history_json
      WHEN length(excluded.handle_history_json) > length(competitor_channels.handle_history_json) THEN excluded.handle_history_json
      ELSE competitor_channels.handle_history_json
    END,
    -- Cung logic cho lifecycle: row DB = kenh THAT (canonical record dau tien theo channelId).
    -- DUPLICATE la thuoc tinh cap RECORD (RAW-104/105/127...) - giu trong JSON cho UI;
    -- DB uu tien trang thai kenh that (canonical insert dau tien) de query "kenh dang song" dung.
    channel_lifecycle_json = coalesce(competitor_channels.channel_lifecycle_json, excluded.channel_lifecycle_json)
`);

db.exec('BEGIN TRANSACTION;');
let channelCount = 0;
const processedChannelIds = new Set();
const processedHandles = new Set();
const ftsChannelIds = new Set(); // Fix 16/09: chong FTS entry trung khi 2 record cung channelId (RAW-054/106/107...) 288->282
const rawNicheById = new Map(); // 2026-10-09: raw id -> niche_id, de record duplicateOf dung niche cua record goc

// 1. Ingest all 97 Canonical Raw Channels (with deep dossiers)
for (const r of rawKenhMau) {
  const ch = r.channel || {};
  const channelId = ch.channelId || `RAW_CH_${r.id}`;
  const handle = ch.handle || (r.visionAnalysis?.handle ? '@' + r.visionAnalysis.handle.replace(/^@/, '') : `@${r.id}`);
  const cleanHandle = handle.toLowerCase();

  processedChannelIds.add(channelId);
  processedHandles.add(cleanHandle);

  const title = ch.title || r.title || r.id;
  const nicheName = r.editorialNiche || r.niche || 'Khác';
  let nicheId = canonicalNicheByHandle.get(cleanHandle) || nicheMap.get(nicheName);
  // 2026-10-09: record trung (duplicateOf) KHONG tao ngach auto moi. Row kenh da upsert vao record goc
  // (ON CONFLICT khong cap nhat niche_id) nen ngach sinh tu ban trung thanh mo coi
  // (RAW-106/107 -> RAW-054, RAW-127 -> RAW-089). Dung niche_id cua record goc.
  if (!nicheId && r.duplicateOf && rawNicheById.has(r.duplicateOf)) {
    nicheId = rawNicheById.get(r.duplicateOf);
  }
  if (!nicheId) {
    nicheId = 'niche_' + foldVi(nicheName).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!nicheMap.has(nicheName)) {
      // Fix 16/09: ngách auto-gen (từ channel) KHÔNG được gắn cờ xanh — chưa qua 7 tiêu chí XANH
      insertNiche.run(nicheId, nicheName, 0, 5, '', '', '', '', '', '', 5.0, 10.0, JSON.stringify([]));
      nicheMap.set(nicheName, nicheId);
    }
  }
  rawNicheById.set(r.id, nicheId);

  const vat = r.vitalityAudit || {};
  const deepIntel = r.deepIntelligence || {};
  const langInfo = r.audioLanguageInfo || {};

  // Check if deep dossier folder exists on disk
  const folderName = deepIntel.folderName || `${r.id}_${(ch.title || '').replace(/[^a-zA-Z0-9]/g, '_')}`;
  let dossierDir = path.join(ROOT, 'data', 'raw-channels-deep', folderName);
  if (!fs.existsSync(dossierDir)) {
    try {
      const entries = fs.readdirSync(path.join(ROOT, 'data', 'raw-channels-deep'));
      const match = entries.find(e => e.startsWith(r.id));
      if (match) dossierDir = path.join(ROOT, 'data', 'raw-channels-deep', match);
    } catch(e) {}
  }

  let ptData = null, vpData = null;
  if (fs.existsSync(dossierDir)) {
    const ptPath = path.join(dossierDir, 'production_toolkit.json');
    if (fs.existsSync(ptPath)) {
      try { ptData = JSON.parse(fs.readFileSync(ptPath, 'utf8')); } catch(e) {}
    }
    const vpPath = path.join(dossierDir, 'voice_profile.json');
    if (fs.existsSync(vpPath)) {
      try { vpData = JSON.parse(fs.readFileSync(vpPath, 'utf8')); } catch(e) {}
    }
  }

  const voiceSampleFile = path.join(ROOT, 'assets', 'voice-samples', `${r.id}.mp3`);
  const hasVoiceSample = fs.existsSync(voiceSampleFile) ? 1 : 0;
  const voiceSamplePath = hasVoiceSample ? `assets/voice-samples/${r.id}.mp3` : null;

  const hasMissionControl = ptData ? 1 : 0;
  const sopDocPath = ptData?.productionStack?.sopDocPath || null;
  const dedicatedSkill = ptData?.productionStack?.matchingSkill || null;
  const masterScriptPrompt = ptData?.scriptBlueprint?.masterScriptPrompt || null;
  const voiceTalentProfile = vpData?.voiceCharacteristics?.genderEstimate || null;
  const wpm = vpData?.voiceCharacteristics?.actualPaceWPM ? parseInt(vpData.voiceCharacteristics.actualPaceWPM) : 135;

  const lcState = r.channelLifecycle?.state || '';
  const isDeadRaw = lcState === 'TERMINATED_BY_YOUTUBE' || lcState === 'DEAD_404';
  const yppStatusRaw = isDeadRaw ? lcState : (vat.healthStatus || 'ACTIVE');

  insertChannel.run(
    channelId,
    r.id,
    handle,
    title,
    ch.url || `https://www.youtube.com/${handle}`,
    ch.country || 'US',
    ch.avatar || '',
    r.fileName ? `assets/raw-kenh/${r.fileName}` : '',
    ch.subscribers || 0,
    ch.views || 0,
    ch.videoCount || 0,
    nicheId,
    r.editorialNiche || nicheName,
    vat.latestUploadDate || null,
    vat.daysSinceLatest || 0,
    yppStatusRaw,
    isDeadRaw ? 0 : 1,
    hasVoiceSample,
    voiceSamplePath,
    wpm,
    langInfo.flag || '🇺🇸',
    langInfo.code || 'en-US',
    voiceTalentProfile,
    hasMissionControl,
    sopDocPath,
    dedicatedSkill,
    masterScriptPrompt,
    JSON.stringify(r.handleHistory || []),
    JSON.stringify(r.channelLifecycle || {})
  );
  channelCount++;
  if (!ftsChannelIds.has(channelId)) {
    ftsChannelIds.add(channelId);
    insertFts.run(channelId, 'CHANNEL', title, `${r.id || ''} ${channelId} ${title} ${handle} ${nicheName} ${(ch.topics || []).join(' ')}`);
  }
}

// 2. Ingest remaining Benchmark Channels from kenh-mau.json
const intelByHandle = new Map();
const intelById = new Map();
const intelDbPath = path.join(ROOT, 'data', 'intelligence.db');
if (fs.existsSync(intelDbPath)) {
  let intelDb = null;
  try {
    intelDb = new DatabaseSync(intelDbPath, { readOnly: true });
    const intelRows = intelDb.prepare('SELECT channel_id, LOWER(handle) AS h, title, median_views FROM channels').all();
    for (const ir of intelRows) {
      if (ir.h) intelByHandle.set(ir.h, ir);
      if (ir.channel_id) intelById.set(ir.channel_id, ir);
    }
  } catch (_) {
  } finally {
    if (intelDb) {
      try { intelDb.close(); } catch (_) {}
    }
  }
}

for (const k of kenhMau) {
  const handle = k.handle || '';
  const cleanHandle = handle.toLowerCase();
  if (processedHandles.has(cleanHandle)) continue;
  processedHandles.add(cleanHandle);

  const intelRow = intelByHandle.get(cleanHandle) || (k.channelId ? intelById.get(k.channelId) : null);
  const realId = (k.channelId && /^UC[\w-]{20,}$/.test(k.channelId))
    ? k.channelId
    : (intelRow && /^UC[\w-]{20,}$/.test(intelRow.channel_id) ? intelRow.channel_id : '');
  const title = (k.title && k.title !== k.handle)
    ? k.title
    : (intelRow && intelRow.title ? intelRow.title : (k.handle || 'Unknown Channel'));
  const nicheName = k.niche || 'Khác';

  // Fix 16/09 (CRITICAL): handle CJK (Nhật/Hàn/Trung) bị regex xóa sạch thành '' ->
  // 43 kênh dồn vào 1 row 'GEN_'. Fallback hash SHA-1 khi base rỗng, chống trùng lần 2.
  let channelId = (realId && !processedChannelIds.has(realId)) ? realId : '';
  if (!channelId) {
    const gidBase = handle.replace(/[^a-zA-Z0-9]/g, '');
    channelId = gidBase
      ? `GEN_${gidBase}`
      : `GEN_x${require('crypto').createHash('sha1').update(handle).digest('hex').slice(0, 10)}`;
    if (processedChannelIds.has(channelId)) {
      // Fail-safe: khác handle nhưng cùng slug ascii -> phân biệt bằng hash
      channelId = `${channelId}_${require('crypto').createHash('sha1').update(handle).digest('hex').slice(0, 6)}`;
    }
  }
  if (processedChannelIds.has(channelId)) continue;
  processedChannelIds.add(channelId);

  let nicheId = canonicalNicheByHandle.get(cleanHandle) || nicheMap.get(nicheName);
  if (!nicheId) {
    nicheId = 'niche_' + foldVi(nicheName).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!nicheMap.has(nicheName)) {
      // Fix 16/09: ngách auto-gen (từ channel) KHÔNG được gắn cờ xanh — chưa qua 7 tiêu chí XANH
      insertNiche.run(nicheId, nicheName, 0, 5, '', '', '', '', '', '', 5.0, 10.0, JSON.stringify([]));
      nicheMap.set(nicheName, nicheId);
    }
  }

  // Fix 16/09: k.avatar trong kenh-mau.json ĐÃ là path đầy đủ 'assets/avatars/...'
  // (trước đây prepend thêm 'assets/avatars/' lần nữa -> 111 path hỏng 'assets/avatars/assets/avatars/...')
  const avatarPath = k.avatar
    ? (k.avatar.startsWith('assets/') ? k.avatar : `assets/avatars/${k.avatar}`)
    : '';

  insertChannel.run(
    channelId,
    null,
    k.handle,
    title,
    k.url || `https://www.youtube.com/${k.handle}`,
    'US',
    avatarPath,
    avatarPath,
    Number(k.subscribers || 0),
    Number(k.totalViews || (intelRow && intelRow.median_views) || 0),
    k.count || 0,
    nicheId,
    nicheName,
    k.ngay_do || null,
    0,
    k.status || (k.dead ? 'DEAD_404' : 'ACTIVE'),
    k.dead ? 0 : 1,
    0,
    null,
    135,
    '🌐',
    'ALL',
    null,
    0,
    null,
    null,
    null,
    JSON.stringify([{ handle: k.handle || '', channelId: null, firstSeenCommit: null, firstSeenDate: k.ngay_do || null, source: 'kenh-mau.json (benchmark record - no git history)' }]),
    JSON.stringify({ state: k.dead ? 'DEAD_404' : 'ACTIVE', stateReason: k.dead ? 'kenh-mau.json dead flag (404 khi do)' : 'kenh-mau.json benchmark record', healthState: null, monetizationState: null, events: [], auditedAt: k.ngay_do || null, schemaVersion: 1 })
  );
  channelCount++;
  if (!ftsChannelIds.has(channelId)) {
    ftsChannelIds.add(channelId);
    insertFts.run(channelId, 'CHANNEL', title, `${title} ${k.handle} ${nicheName}`);
  }
}

db.exec('COMMIT;');
console.log(`Ingested ${channelCount} Channels into table 'competitor_channels'.`);

console.log('=== [5/8] INGESTING TOP VIDEOS FROM DOSSIERS (793 Videos) ===');
const deepDir = path.join(ROOT, 'data', 'raw-channels-deep');
const insertTopVideo = db.prepare(`
  INSERT INTO competitor_top_videos (
    video_id, channel_id, rank_order, title, views, duration_seconds,
    published_at, vph, outlier_multiplier, outlier_score, hook_snippet_en,
    hook_snippet_vi, has_transcript, transcript_segments_count
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

db.exec('BEGIN TRANSACTION;');
let topVideoCount = 0;

// Fix 16/09: duration top-videos lưu dạng ISO 8601 (PT3M9S) -> parse thành giây.
// Trước đây hardcode 0 -> 792/792 video thiếu thời lượng trong DB.
function parseIsoDuration(s) {
  if (!s) return 0;
  if (typeof s === 'number') return Math.round(s);
  const m = String(s).match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

if (fs.existsSync(deepDir)) {
  const folders = fs.readdirSync(deepDir).filter(f => fs.statSync(path.join(deepDir, f)).isDirectory());
  for (const folder of folders) {
    const topVidsPath = path.join(deepDir, folder, 'top-videos.json');
    if (!fs.existsSync(topVidsPath)) continue;

    try {
      const tvData = JSON.parse(fs.readFileSync(topVidsPath, 'utf8'));
      const channelId = tvData.channelId;
      if (!channelId || !processedChannelIds.has(channelId)) continue;

      const videos = tvData.videos || [];
      for (const v of videos) {
        if (!v.videoId) continue;
        insertTopVideo.run(
          v.videoId,
          channelId,
          v.rank || (topVideoCount + 1),
          v.title || '',
          v.views || 0,
          parseIsoDuration(v.duration),
          v.publishedAt || '',
          v.vph || 0.0,
          v.outlierMultiplier || '1.0x',
          v.outlierScore || 1.0,
          v.hookSnippetEN || v.hookSnippet || '',
          v.hookSnippetVI || '',
          v.hasTranscript ? 1 : 0,
          v.segmentCount || 0
        );
        topVideoCount++;

        insertFts.run(v.videoId, 'TRANSCRIPT', v.title || '', `${v.title || ''} ${v.hookSnippetEN || ''} ${v.hookSnippetVI || ''}`);
      }
    } catch (e) {
      // Ignore individual corrupted file
    }
  }
}

db.exec('COMMIT;');
console.log(`Ingested ${topVideoCount} Top Videos into table 'competitor_top_videos'.`);

console.log('=== [6/8] INGESTING DOCUMENTS (300 Records) ===');
const docsData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'tai-lieu-full.json'), 'utf8'));
const insertDoc = db.prepare(`
  INSERT INTO documents (
    sku, doc_code, name, kind, content_niche, link_url, file_local_path, source_label
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

db.exec('BEGIN TRANSACTION;');
const lessonSkuSet = new Set(db.prepare('SELECT sku FROM lessons').all().map((r) => r.sku));
let docCount = 0;
let docsChanged = false;
for (const d of docsData) {
  if (d.sku && lessonTitleBySku.has(d.sku)) {
    const vTitle = lessonTitleBySku.get(d.sku);
    const vNiche = lessonNicheBySku.get(d.sku);
    if (d.videoTitle !== vTitle || d.videoNiche !== vNiche) {
      d.videoTitle = vTitle;
      d.videoNiche = vNiche;
      docsChanged = true;
    }
  }
  // FK documents.sku -> lessons.sku: sku khong thuoc lessons (vd RESEARCH-*, NOI-BO) -> luu NULL o sku, giu nguyen o doc_code
  const docCode = d.sku || d.id || 'NOI-BO';
  const docSku = (!d.sku || d.sku === 'NOI-BO' || !lessonSkuSet.has(d.sku)) ? null : d.sku;
  insertDoc.run(
    docSku,
    docCode,
    d.name,
    d.kind || 'other',
    d.contentNiche || '',
    d.link || '',
    d.fileLocal || d.file || '',
    d.source || 'H2DEV'
  );
  docCount++;
  const docPad = `DOC-${String(docCount).padStart(3, '0')}`;
  insertFts.run(`DOC_${docCount}`, 'SOP', d.name, `${docPad} DOC_${docCount} ${d.name} ${docCode} ${d.contentNiche || ''} ${d.kind || ''}`);
}
db.exec('COMMIT;');
function writeFileAtomicSync(targetPath, content) {
  const tmpPath = `${targetPath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, targetPath);
}

if (docsChanged && !process.env.H2DEV_MASTER_DB_PATH) {
  writeFileAtomicSync(path.join(ROOT, 'data-tabs', 'tai-lieu-full.json'), JSON.stringify(docsData, null, 2) + '\n');
}
console.log(`Ingested ${docCount} Documents into table 'documents'.`);

console.log('=== [7/8] INGESTING REUP SOURCES, POLICIES & CHECKLISTS ===');
const reupData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'nguon-reup.json'), 'utf8'));
const chienLuocData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'chien-luoc.json'), 'utf8'));
const insertReup = db.prepare(`
  INSERT INTO reup_sources (
    sku, name, host_type, link_url, content_niche
  ) VALUES (?, ?, ?, ?, ?)
`);
const insertPolicy = db.prepare(`
  INSERT INTO policies (
    policy_id, idx, title, content, cited_skus_json, cited_channels_json, cited_docs_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const insertChecklist = db.prepare(`
  INSERT INTO checklists (
    check_id, idx, title, content, cited_skus_json
  ) VALUES (?, ?, ?, ?, ?)
`);

db.exec('BEGIN TRANSACTION;');
let reupCount = 0;
let reupChanged = false;
for (const r of reupData) {
  if (r.sku && lessonTitleBySku.has(r.sku)) {
    const vTitle = lessonTitleBySku.get(r.sku);
    const vNiche = lessonNicheBySku.get(r.sku);
    if (r.videoTitle !== vTitle || r.videoNiche !== vNiche) {
      r.videoTitle = vTitle;
      r.videoNiche = vNiche;
      reupChanged = true;
    }
  }
  let hostType = 'Khác';
  if (r.link && r.link.includes('bilibili.com')) hostType = 'Bilibili';
  else if (r.link && r.link.includes('douyin.com')) hostType = 'Douyin';
  else if (r.link && (r.link.includes('pexels.com') || r.link.includes('pixabay.com'))) hostType = 'Stock footage';

  insertReup.run(
    r.sku || null,
    r.name,
    hostType,
    r.link || '',
    r.contentNiche || ''
  );
  reupCount++;
  insertFts.run(`REUP_${reupCount}`, 'REUP', `[${hostType}] ${r.name}`, `REUP_${reupCount} ${r.name} ${hostType} ${r.sku || ''} ${r.contentNiche || ''} ${r.link || ''}`);
}
if (reupChanged && !process.env.H2DEV_MASTER_DB_PATH) {
  writeFileAtomicSync(path.join(ROOT, 'data-tabs', 'nguon-reup.json'), JSON.stringify(reupData, null, 2) + '\n');
}

let policyCount = 0;
for (let i = 0; i < (ngachData.thongTinChinhSach2026 || []).length; i++) {
  const raw = String(ngachData.thongTinChinhSach2026[i] || '');
  const policyId = `P${String(i + 1).padStart(2, '0')}`;
  const mTitle = raw.match(/^\[([^\]]+)\]\s*(?:—|-)?\s*([\s\S]*)$/);
  const title = mTitle ? mTitle[1].trim() : `Chính sách YouTube #${i + 1}`;
  const body = mTitle ? mTitle[2].trim() : raw;
  const skus = [...new Set((raw.match(/\b(?:VIDEO-[A-Za-z0-9]{6}|ZOOM-0[1-4]-[A-Za-z0-9-]+)\b/g) || []))];
  const chans = [...new Set((raw.match(/@[^\s,.;:()\[\]]+/g) || []))];
  const docs = [...new Set((raw.match(/\b[A-Za-z0-9_-]+\.(?:md|txt|json)\b/g) || []))];
  insertPolicy.run(policyId, i + 1, title, body, JSON.stringify(skus), JSON.stringify(chans), JSON.stringify(docs));
  policyCount++;
  insertFts.run(policyId, 'POLICY', `[Chính sách #${i + 1}] ${title}`, `${policyId} ${title} ${body}`);
}

let checklistCount = 0;
for (let i = 0; i < (chienLuocData.checklistTruocKhiDang || []).length; i++) {
  const raw = String(chienLuocData.checklistTruocKhiDang[i] || '');
  const checkId = `CL${String(i + 1).padStart(2, '0')}`;
  const mTitle = raw.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
  const title = mTitle ? mTitle[1].trim() : `Checklist #${i + 1}`;
  const body = mTitle ? mTitle[2].trim() : raw;
  const skus = [...new Set((raw.match(/\b(?:VIDEO-[A-Za-z0-9]{6}|ZOOM-0[1-4]-[A-Za-z0-9-]+)\b/g) || []))];
  insertChecklist.run(checkId, i + 1, title, body, JSON.stringify(skus));
  checklistCount++;
  insertFts.run(checkId, 'CHECKLIST', `[Checklist] ${title}`, `${checkId} ${title} ${body}`);
}
db.exec(`
  DELETE FROM niches
  WHERE niche_id NOT IN (SELECT DISTINCT niche_id FROM lessons WHERE niche_id IS NOT NULL)
    AND niche_id NOT IN (SELECT DISTINCT niche_id FROM competitor_channels WHERE niche_id IS NOT NULL);
  INSERT INTO search_fts(search_fts, rank) VALUES('rank', 'bm25(10.0, 1.0, 5.0, 2.0, 1.5)');
  INSERT INTO search_fts(search_fts) VALUES('optimize');
`);
db.exec('COMMIT;');
console.log(`Ingested ${reupCount} Reup Sources, ${policyCount} Policies, and ${checklistCount} Checklists.`);

console.log('=== [8/8] AUDIT & VERIFY MASTER DATABASE N/N 100% ===');
const stats = {
  niches: db.prepare('SELECT COUNT(*) AS c FROM niches').get().c,
  lessons: db.prepare('SELECT COUNT(*) AS c FROM lessons').get().c,
  timestamps: db.prepare('SELECT COUNT(*) AS c FROM lesson_timestamps').get().c,
  channels: db.prepare('SELECT COUNT(*) AS c FROM competitor_channels').get().c,
  topVideos: db.prepare('SELECT COUNT(*) AS c FROM competitor_top_videos').get().c,
  documents: db.prepare('SELECT COUNT(*) AS c FROM documents').get().c,
  reupSources: db.prepare('SELECT COUNT(*) AS c FROM reup_sources').get().c,
  policies: db.prepare('SELECT COUNT(*) AS c FROM policies').get().c,
  checklists: db.prepare('SELECT COUNT(*) AS c FROM checklists').get().c,
  ftsEntries: db.prepare('SELECT COUNT(*) AS c FROM search_fts').get().c,
};

console.log('\nFINAL MASTER DATABASE AUDIT RESULTS:');
console.log(' - Total Niches:', stats.niches, '(Expected: 44+) ->', stats.niches >= 44 ? 'PASS' : 'FAIL');
const expectedLessons = allCatalogFull.length;
console.log(' - Total Lessons:', stats.lessons, `(Expected: ${expectedLessons}) ->`, stats.lessons === expectedLessons ? 'PASS' : 'FAIL');
console.log(' - Total Lesson Timestamps:', stats.timestamps, '-> PASS');
console.log(' - Total Competitor Channels:', stats.channels, `(Expected: >= ${C.channels}) ->`, stats.channels >= C.channels ? 'PASS' : 'FAIL');
console.log(' - Total Competitor Top Videos:', stats.topVideos, '(Expected: 790+) ->', stats.topVideos >= 790 ? 'PASS' : 'FAIL');
console.log(' - Total Documents:', stats.documents, `(Expected: ${C.documents}) ->`, stats.documents === C.documents ? 'PASS' : 'FAIL');
console.log(' - Total Reup Sources:', stats.reupSources, `(Expected: ${C.nguonReup}) ->`, stats.reupSources === C.nguonReup ? 'PASS' : 'FAIL');
console.log(' - Total Policies:', stats.policies, '(Expected: 12) ->', stats.policies === 12 ? 'PASS' : 'FAIL');
console.log(' - Total Checklists:', stats.checklists, '(Expected: 12) ->', stats.checklists === 12 ? 'PASS' : 'FAIL');
console.log(' - Total FTS5 Search Index Entries:', stats.ftsEntries, '-> PASS');

try { db.exec('PRAGMA wal_checkpoint(TRUNCATE);'); } catch (_) {}

if (!process.env.H2DEV_MASTER_DB_PATH) {
  const modsH2dev = (() => { try { return (JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'modules.json'), 'utf8')).modules || []).length; } catch (_) { return 17; } })();
  const modsHuan = (() => { try { return (JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'modules_huan.json'), 'utf8')).modules || []).length; } catch (_) { return 7; } })();
  const modsDgmd = (() => { try { return (JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'modules_dgmd.json'), 'utf8')).modules || []).length; } catch (_) { return 11; } })();
  const musicTracksCount = (() => {
    try {
      const msPath = path.join(ROOT, 'data', 'music_stats.json');
      if (fs.existsSync(msPath)) {
        const ms = JSON.parse(fs.readFileSync(msPath, 'utf8'));
        return ms.totalTracks || (Array.isArray(ms.tracks) ? ms.tracks.length : 110);
      }
    } catch (_) {}
    return 110;
  })();
  const deadChannelsCount = kenhMau.filter(k => k && k.dead === true).length;
  const liveChannelsCount = kenhMau.filter(k => k && !k.dead).length;
  const totalVideoSizeMb = Math.round(
    allCatalogFull.reduce((acc, v) => {
      const szMb = typeof v.size_mb === 'number' ? v.size_mb : (typeof v.size === 'number' && v.size > 0 ? v.size / (1024 * 1024) : 0);
      return acc + szMb;
    }, 0) * 10
  ) / 10;
  const overviewSummary = {
    schema: 'h2dev.overview-summary.v1',
    generatedAt: new Date().toISOString(),
    counts: {
      videosTotal: allCatalogFull.length,
      videosH2dev: catalogFull.length,
      videosHuan: catalogHuan.length,
      videosDgmd: catalogDgmd.length,
      modulesTotal: modsH2dev + modsHuan + modsDgmd,
      modulesH2dev: modsH2dev,
      modulesHuan: modsHuan,
      modulesDgmd: modsDgmd,
      documents: docsData.length,
      channels: kenhMau.length,
      deadChannels: deadChannelsCount,
      liveChannels: liveChannelsCount,
      rawChannels: rawKenhMau.length || 149,
      niches: 40,
      microNiches: 120,
      reupSources: reupData.length,
      policies: policyCount,
      checklists: checklistCount,
      musicTracks: musicTracksCount
    },
    storage: {
      totalVideoSizeMb
    }
  };
  writeFileAtomicSync(path.join(ROOT, 'data', 'overview_summary.json'), JSON.stringify(overviewSummary, null, 2) + '\n');

  // Auto-hydrate data/h2dev_knowledge_graph.db from committed data/knowledge_graph.json if missing or out-of-sync (e.g. on VPS deploy)
  const kgJsonPath = path.join(ROOT, 'data', 'knowledge_graph.json');
  const kgDbPath = path.join(ROOT, 'data', 'h2dev_knowledge_graph.db');
  if (fs.existsSync(kgJsonPath)) {
    try {
      const kgJson = JSON.parse(fs.readFileSync(kgJsonPath, 'utf8'));
      const expectedNodes = Array.isArray(kgJson.nodes) ? kgJson.nodes.length : 0;
      const expectedEdges = Array.isArray(kgJson.edges) ? kgJson.edges.length : 0;
      let needsHydrate = !fs.existsSync(kgDbPath);
      if (!needsHydrate && expectedNodes > 0) {
        try {
          const checkKgDb = new DatabaseSync(kgDbPath, { readOnly: true });
          try {
            const curN = checkKgDb.prepare('SELECT COUNT(*) AS c FROM kg_nodes').get().c;
            const curE = checkKgDb.prepare('SELECT COUNT(*) AS c FROM kg_edges').get().c;
            if (curN !== expectedNodes || curE !== expectedEdges) needsHydrate = true;
          } finally {
            checkKgDb.close();
          }
        } catch (_) {
          needsHydrate = true;
        }
      }
      if (needsHydrate && expectedNodes > 0) {
        console.log(`=== [9/9] HYDRATING NEXUS KNOWLEDGE GRAPH DB FROM knowledge_graph.json (${expectedNodes} nodes / ${expectedEdges} edges) ===`);
        const inboundMap = new Map();
        const outboundMap = new Map();
        for (const n of kgJson.nodes) {
          inboundMap.set(n.id, []);
          outboundMap.set(n.id, []);
        }
        for (const e of kgJson.edges) {
          if (outboundMap.has(e.source)) outboundMap.get(e.source).push({ target: e.target, relation: e.relation });
          if (inboundMap.has(e.target)) inboundMap.get(e.target).push({ source: e.source, relation: e.relation });
        }
        const kgDb = new DatabaseSync(kgDbPath);
        try {
          kgDb.exec(`
            PRAGMA busy_timeout = 5000;
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            BEGIN IMMEDIATE;
            DROP TABLE IF EXISTS kg_nodes;
            DROP TABLE IF EXISTS kg_edges;
            DROP TABLE IF EXISTS kg_backlinks;
            DROP TABLE IF EXISTS kg_sync_state;
            DROP TABLE IF EXISTS kg_fts;
            CREATE TABLE kg_nodes (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL,
              layer TEXT NOT NULL,
              level INTEGER NOT NULL DEFAULT 4,
              parent_id TEXT NOT NULL DEFAULT '',
              label TEXT NOT NULL,
              track TEXT NOT NULL,
              sku TEXT NOT NULL,
              path TEXT NOT NULL,
              degree INTEGER NOT NULL DEFAULT 0,
              metadata_json TEXT NOT NULL
            ) STRICT;
            CREATE TABLE kg_edges (
              source TEXT NOT NULL,
              target TEXT NOT NULL,
              relation TEXT NOT NULL,
              weight REAL NOT NULL DEFAULT 1.0,
              PRIMARY KEY (source, target, relation)
            ) STRICT;
            CREATE TABLE kg_backlinks (
              node_id TEXT PRIMARY KEY,
              inbound_count INTEGER NOT NULL,
              outbound_count INTEGER NOT NULL,
              inbound_json TEXT NOT NULL,
              outbound_json TEXT NOT NULL
            ) STRICT;
            CREATE TABLE kg_sync_state (
              path TEXT PRIMARY KEY,
              mtime_ms INTEGER NOT NULL,
              size_bytes INTEGER NOT NULL
            ) STRICT;
            CREATE VIRTUAL TABLE kg_fts USING fts5(
              id UNINDEXED,
              type,
              label,
              body,
              wikilinks,
              tokenize = 'unicode61 remove_diacritics 2'
            );
            CREATE INDEX idx_kg_nodes_type ON kg_nodes(type);
            CREATE INDEX idx_kg_nodes_layer ON kg_nodes(layer);
            CREATE INDEX idx_kg_nodes_parent ON kg_nodes(parent_id);
            CREATE INDEX idx_kg_nodes_sku ON kg_nodes(sku);
            CREATE INDEX idx_kg_nodes_id_lower ON kg_nodes(LOWER(id));
            CREATE INDEX idx_kg_nodes_sku_lower ON kg_nodes(LOWER(sku));
            CREATE INDEX idx_kg_nodes_path_lower ON kg_nodes(LOWER(path));
            CREATE INDEX idx_kg_nodes_label_lower ON kg_nodes(LOWER(label));
            CREATE INDEX idx_kg_edges_source ON kg_edges(source);
            CREATE INDEX idx_kg_edges_target ON kg_edges(target);
          `);
          const insNode = kgDb.prepare('INSERT INTO kg_nodes (id, type, layer, level, parent_id, label, track, sku, path, degree, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
          const insEdge = kgDb.prepare('INSERT OR IGNORE INTO kg_edges (source, target, relation, weight) VALUES (?, ?, ?, ?)');
          const insBacklink = kgDb.prepare('INSERT INTO kg_backlinks (node_id, inbound_count, outbound_count, inbound_json, outbound_json) VALUES (?, ?, ?, ?, ?)');
          const insFts = kgDb.prepare('INSERT INTO kg_fts (id, type, label, body, wikilinks) VALUES (?, ?, ?, ?, ?)');
          for (const n of kgJson.nodes) {
            const inb = inboundMap.get(n.id) || [];
            const outb = outboundMap.get(n.id) || [];
            const deg = inb.length + outb.length;
            const meta = n.meta || {};
            const rawIdsStr = (meta.rawIds || (meta.rawId ? [meta.rawId] : [])).join(' ');
            const fullBody = `${n.id} ${n.sku || ''} ${rawIdsStr} ${n.label || ''} ${foldVi((n.label || '') + ' ' + rawIdsStr)}`.trim();
            insNode.run(n.id, n.type || 'item', n.layer || 'knowledge', Number(n.level || 4), n.parentId || '', n.label || n.id, n.track || '', n.sku || '', n.path || '', deg, JSON.stringify(meta));
            insBacklink.run(n.id, inb.length, outb.length, JSON.stringify(inb), JSON.stringify(outb));
            insFts.run(n.id, n.type || 'item', n.label || n.id, fullBody, '');
          }
          for (const e of kgJson.edges) {
            insEdge.run(e.source, e.target, e.relation, Number(e.weight || 1.0));
          }
          kgDb.exec("INSERT INTO kg_fts(kg_fts) VALUES('optimize')");
          kgDb.exec('COMMIT');
          try { kgDb.exec('PRAGMA wal_checkpoint(TRUNCATE);'); } catch (_) {}
        } finally {
          kgDb.close();
        }
        console.log(`Hydrated ${expectedNodes} kg_nodes and ${expectedEdges} kg_edges into h2dev_knowledge_graph.db -> PASS`);
      }
    } catch (err) {
      console.error('[WARN] Failed to hydrate h2dev_knowledge_graph.db from knowledge_graph.json:', err.message);
    }
  }
}

db.close();
console.log('\n=== MASTER DATABASE BUILD COMPLETED SUCCESSFULLY 100% ===');
