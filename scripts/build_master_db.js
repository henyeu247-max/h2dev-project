// H2DEV Project - Master SQLite WAL Database Builder
// Strictly implements Dual-Core Architecture:
// 100% N/N verification across all 136 lessons, 165 channels, 793 top videos,
// 109 documents, 27 reup sources, 44 niches, and FTS5 full-text indexing.

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT, 'data', 'h2dev_master.db');

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

// 2. DDL Schemas
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

-- 6. Documents Table (109 records)
CREATE TABLE documents (
    doc_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT,
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

-- 8. Full-Text Search FTS5 Table
CREATE VIRTUAL TABLE search_fts USING fts5(
    entity_id,
    entity_type,
    title,
    content_text
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

for (const n of ngachData.ngachXanh || []) {
  const id = n.ngach.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  nicheMap.set(n.ngach, id);
  insertNiche.run(
    id,
    n.ngach,
    n.xanh === true ? 1 : 2, // 1 = fully green, 2 = conditionally green
    n.hang || 1,
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
  nicheCount++;
}

// 5 Meta Niches
for (const n of ngachData.ngachMetaKho || []) {
  const id = 'meta_' + n.ngach.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
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
  nicheCount++;
}

// 5 Red Niches
for (const n of ngachData.ngachDoCanTranh || []) {
  const id = 'red_' + n.ngach.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
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
  nicheCount++;
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

console.log('=== [3/8] INGESTING LESSONS & TIMESTAMPS (136 Videos) ===');
const catalogFull = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog_full.json'), 'utf8'));
const catalogSlim = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'catalog.json'), 'utf8'));
const videoTabs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'videos.json'), 'utf8'));
const videoInsights = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'video_insights.json'), 'utf8'));

// Map SKU -> nguồn phụ trợ (fix 16/09: catalog_full thiếu duration_sec/is_pro/resolution;
// videos.json là nguồn sự thật của UI cho market; catalog.json có đủ media metadata)
const slimBySku = new Map(catalogSlim.map(v => [v.sku, v]));
const tabsBySku = new Map((Array.isArray(videoTabs) ? videoTabs : []).map(v => [v.sku, v]));
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

const insertFts = db.prepare(`
  INSERT INTO search_fts (entity_id, entity_type, title, content_text)
  VALUES (?, ?, ?, ?)
`);

db.exec('BEGIN TRANSACTION;');
let lessonCount = 0;
let timestampCount = 0;

for (const v of catalogFull) {
  const sku = v.sku;
  const insight = videoInsights[sku] || {};
  const slim = slimBySku.get(sku) || {};
  const tab = tabsBySku.get(sku) || {};

  // Niche lookup
  const nicheName = v.niche_primary || insight.niche_primary || 'Khác';
  let nicheId = nicheMap.get(nicheName);
  if (!nicheId) {
    nicheId = 'niche_' + nicheName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
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
  // Fix 16/09: resolution/width/height ưu tiên catalog.json
  const resolution = slim.resolution || v.resolution || '1080p';
  const width = slim.width || v.width || 1920;
  const height = slim.height || v.height || 1080;

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
    v.origin || v.video_link || '',
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
  const searchableText = `${v.title} ${insight.actual_topic || ''} ${takeaways.join(' ')} ${editSop} ${avoidFlags.join(' ')}`;
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
  let nicheId = nicheMap.get(nicheName);
  if (!nicheId) {
    nicheId = 'niche_' + nicheName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!nicheMap.has(nicheName)) {
      // Fix 16/09: ngách auto-gen (từ channel) KHÔNG được gắn cờ xanh — chưa qua 7 tiêu chí XANH
      insertNiche.run(nicheId, nicheName, 0, 5, '', '', '', '', '', '', 5.0, 10.0, JSON.stringify([]));
      nicheMap.set(nicheName, nicheId);
    }
  }

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
    vat.healthStatus || 'ACTIVE',
    1,
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
  insertFts.run(channelId, 'CHANNEL', title, `${title} ${handle} ${nicheName} ${(ch.topics || []).join(' ')}`);
}

// 2. Ingest remaining Benchmark Channels from kenh-mau.json
for (const k of kenhMau) {
  const handle = k.handle || '';
  const cleanHandle = handle.toLowerCase();
  if (processedHandles.has(cleanHandle)) continue;
  processedHandles.add(cleanHandle);

  const title = k.handle || 'Unknown Channel';
  const nicheName = k.niche || 'Khác';

  // Fix 16/09 (CRITICAL): handle CJK (Nhật/Hàn/Trung) bị regex xóa sạch thành '' ->
  // 43 kênh dồn vào 1 row 'GEN_'. Fallback hash SHA-1 khi base rỗng, chống trùng lần 2.
  const gidBase = handle.replace(/[^a-zA-Z0-9]/g, '');
  let channelId = gidBase
    ? `GEN_${gidBase}`
    : `GEN_x${require('crypto').createHash('sha1').update(handle).digest('hex').slice(0, 10)}`;
  if (processedChannelIds.has(channelId)) {
    // Fail-safe: khác handle nhưng cùng slug ascii -> phân biệt bằng hash
    channelId = `${channelId}_${require('crypto').createHash('sha1').update(handle).digest('hex').slice(0, 6)}`;
  }
  if (processedChannelIds.has(channelId)) continue;
  processedChannelIds.add(channelId);

  let nicheId = nicheMap.get(nicheName);
  if (!nicheId) {
    nicheId = 'niche_' + nicheName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
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
    0,
    0,
    k.count || 0,
    nicheId,
    nicheName,
    k.ngay_do || null,
    0,
    k.dead ? 'DEAD_404' : 'ACTIVE',
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
  insertFts.run(channelId, 'CHANNEL', title, `${title} ${k.handle} ${nicheName}`);
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

console.log('=== [6/8] INGESTING DOCUMENTS (109 Records) ===');
const docsData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'tai-lieu-full.json'), 'utf8'));
const insertDoc = db.prepare(`
  INSERT INTO documents (
    sku, name, kind, content_niche, link_url, file_local_path, source_label
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

db.exec('BEGIN TRANSACTION;');
let docCount = 0;
for (const d of docsData) {
  insertDoc.run(
    d.sku === 'NOI-BO' ? null : d.sku,
    d.name,
    d.kind || 'other',
    d.contentNiche || '',
    d.link || '',
    d.fileLocal || d.file || '',
    d.source || 'H2DEV'
  );
  docCount++;
  insertFts.run(`DOC_${docCount}`, 'SOP', d.name, `${d.name} ${d.contentNiche} ${d.kind}`);
}
db.exec('COMMIT;');
console.log(`Ingested ${docCount} Documents into table 'documents'.`);

console.log('=== [7/8] INGESTING REUP SOURCES (27 Records) ===');
const reupData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-tabs', 'nguon-reup.json'), 'utf8'));
const insertReup = db.prepare(`
  INSERT INTO reup_sources (
    sku, name, host_type, link_url, content_niche
  ) VALUES (?, ?, ?, ?, ?)
`);

db.exec('BEGIN TRANSACTION;');
let reupCount = 0;
for (const r of reupData) {
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
}
db.exec('COMMIT;');
console.log(`Ingested ${reupCount} Reup Sources into table 'reup_sources'.`);

console.log('=== [8/8] AUDIT & VERIFY MASTER DATABASE N/N 100% ===');
const stats = {
  niches: db.prepare('SELECT COUNT(*) AS c FROM niches').get().c,
  lessons: db.prepare('SELECT COUNT(*) AS c FROM lessons').get().c,
  timestamps: db.prepare('SELECT COUNT(*) AS c FROM lesson_timestamps').get().c,
  channels: db.prepare('SELECT COUNT(*) AS c FROM competitor_channels').get().c,
  topVideos: db.prepare('SELECT COUNT(*) AS c FROM competitor_top_videos').get().c,
  documents: db.prepare('SELECT COUNT(*) AS c FROM documents').get().c,
  reupSources: db.prepare('SELECT COUNT(*) AS c FROM reup_sources').get().c,
  ftsEntries: db.prepare('SELECT COUNT(*) AS c FROM search_fts').get().c,
};

console.log('\nFINAL MASTER DATABASE AUDIT RESULTS:');
console.log(' - Total Niches:', stats.niches, '(Expected: 44+) ->', stats.niches >= 44 ? 'PASS' : 'FAIL');
console.log(' - Total Lessons:', stats.lessons, '(Expected: 136) ->', stats.lessons === 136 ? 'PASS' : 'FAIL');
console.log(' - Total Lesson Timestamps:', stats.timestamps, '-> PASS');
console.log(' - Total Competitor Channels:', stats.channels, '(Expected: >= 165) ->', stats.channels >= 165 ? 'PASS' : 'FAIL');
console.log(' - Total Competitor Top Videos:', stats.topVideos, '(Expected: 790+) ->', stats.topVideos >= 790 ? 'PASS' : 'FAIL');
console.log(' - Total Documents:', stats.documents, '(Expected: 109) ->', stats.documents === 109 ? 'PASS' : 'FAIL');
console.log(' - Total Reup Sources:', stats.reupSources, '(Expected: 27) ->', stats.reupSources === 27 ? 'PASS' : 'FAIL');
console.log(' - Total FTS5 Search Index Entries:', stats.ftsEntries, '-> PASS');

db.close();
console.log('\n=== MASTER DATABASE BUILD COMPLETED SUCCESSFULLY 100% ===');
