#!/usr/bin/env node
/**
 * verify-data-math.js — H2DEV Cross-Tab Lineage & Mathematical Invariant Verification Suite
 * 
 * Formal Quality Gate (Milestone 1):
 *   M1: Niche Cardinality & Sub-Niche Inventory (40 Canonical Niches H01..H40 + 178 Sub-Niches)
 *   M2: Universal Video Grounding (333/333 Lessons linked to Niches with 508 links)
 *   M3: Channel <-> Niche Bidirectional Symmetry (1,082 Channels + 156 Raw Channels)
 *   M4: Document Zero-Orphan Invariant (580/580 Documents with complete Lineage Metadata)
 *   M5: Reup Source Grounding & Lineage (52/52 Sources anchored to Video SKUs & Niches)
 *   M6: SQLite Master DB Schema & Cross-Tab Lineage View (0 FK Violations, 0 Ghost Niches)
 *
 * Exit Code: 0 on 100% PASS, 1 on any failure.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const _origEmitWarning = process.emitWarning;
process.emitWarning = function (w, ...rest) {
  if (String((w && w.message) || w).includes('SQLite is an experimental')) return;
  return _origEmitWarning.call(process, w, ...rest);
};
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

console.log('================================================================================');
console.log('   H2DEV CROSS-TAB LINEAGE & MATHEMATICAL INVARIANT VERIFICATION SUITE (M1)   ');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assertCheck(id, description, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${id} — ${description}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${id} — ${description}`);
    if (details) console.error(`         ↳ Details: ${details}`);
  }
}

// -----------------------------------------------------------------------------
// LOAD DATASETS
// -----------------------------------------------------------------------------
const { computeCounts } = require('./lib/counts');
const C = computeCounts();
const ngachXanh = readJson('data-tabs/ngach-xanh.json');
const kenhMau = readJson('data-tabs/kenh-mau.json');
const rawKenhMau = readJson('data-tabs/raw-kenh-mau.json');
const rawRecords = Array.isArray(rawKenhMau.records) ? rawKenhMau.records : rawKenhMau;
const videosH2 = readJson('data-tabs/videos.json');
const videosHuan = readJson('data/videos_huan.json');
const videosDgmd = readJson('data/videos_dgmd.json');
const allVideos = [...videosH2, ...videosHuan, ...videosDgmd];
const documents = readJson('data-tabs/tai-lieu-full.json');
const reupSources = readJson('data-tabs/nguon-reup.json');

const masterDbPath = path.join(ROOT, 'data', 'h2dev_master.db');
if (!fs.existsSync(masterDbPath)) {
  console.error(`ERROR: Master database not found at ${masterDbPath}`);
  process.exit(1);
}
const db = new DatabaseSync(masterDbPath);

// -----------------------------------------------------------------------------
// METRIC 1: CANONICAL NICHE CARDINALITY & SUB-NICHES
// -----------------------------------------------------------------------------
console.log('--- METRIC 1: CANONICAL NICHE CARDINALITY & SUB-NICHES ---');
const canonicalNiches = ngachXanh.ngachXanh || [];
const validNicheCodes = new Set(Array.from({ length: 40 }, (_, i) => `H${String(i + 1).padStart(2, '0')}`));

assertCheck(
  'M1.1',
  'Exactly 40 Canonical Niches H01..H40 in ngach-xanh.json',
  canonicalNiches.length === 40 && canonicalNiches.every((n, i) => n.code === `H${String(i + 1).padStart(2, '0')}`),
  `Found ${canonicalNiches.length} niches`
);

let countSub120 = 0;
let countSub2026 = 0;
const sub2026Codes = new Set();
canonicalNiches.forEach(n => {
  countSub120 += (n.subNiches120 || []).length;
  (n.subNiches2026 || []).forEach(sn => {
    countSub2026++;
    if (sn.subCode) sub2026Codes.add(sn.subCode);
  });
});

assertCheck(
  'M1.2',
  'All 32 Strategic Micro-Niches (SUB-01..SUB-32) Present in subNiches2026',
  countSub2026 === 32 && Array.from({ length: 32 }, (_, i) => `SUB-${String(i + 1).padStart(2, '0')}`).every(c => sub2026Codes.has(c)),
  `Found ${countSub2026} subNiches2026 items (distinct codes: ${sub2026Codes.size})`
);

assertCheck(
  'M1.3',
  'Total Sub-Niches in ngach-xanh.json (146 classic + 32 modern = 178)',
  countSub120 + countSub2026 === 178,
  `Classic: ${countSub120}, Modern: ${countSub2026}, Total: ${countSub120 + countSub2026}`
);

// -----------------------------------------------------------------------------
// METRIC 2: UNIVERSAL VIDEO GROUNDING
// -----------------------------------------------------------------------------
console.log(`\n--- METRIC 2: UNIVERSAL VIDEO GROUNDING (${C.totalSystemVideos} LESSONS) ---`);
const allVideoSkus = new Set(allVideos.map(v => v.sku));

assertCheck(
  'M2.1',
  `Video Repository Integrity: exactly ${C.totalSystemVideos} lessons (${C.videos} H2DEV + ${C.videosHuan} HUAN + ${C.videosDgmd} DGMD)`,
  allVideos.length === C.totalSystemVideos && allVideoSkus.size === C.totalSystemVideos,
  `Found ${allVideos.length} videos, distinct SKUs: ${allVideoSkus.size}`
);

const nicheSkusMap = new Map();
canonicalNiches.forEach(n => {
  (n.skus || []).forEach(s => {
    const sku = typeof s === 'string' ? s : s.sku;
    if (sku) {
      if (!nicheSkusMap.has(sku)) nicheSkusMap.set(sku, new Set());
      nicheSkusMap.get(sku).add(n.code);
    }
  });
});
(ngachXanh.ngachMetaKho || []).forEach((m, idx) => {
  const mCode = m.code || (`META-0${idx + 1}`);
  (m.skus || []).forEach(s => {
    const sku = typeof s === 'string' ? s : s.sku;
    if (sku) {
      if (!nicheSkusMap.has(sku)) nicheSkusMap.set(sku, new Set());
      nicheSkusMap.get(sku).add(mCode);
    }
  });
});

const ungroundedVideos = [...allVideoSkus].filter(sku => !nicheSkusMap.has(sku));
assertCheck(
  'M2.2',
  `100% Video Grounding: ${C.totalSystemVideos}/${C.totalSystemVideos} videos anchored to Canonical Niches or Meta Groups`,
  ungroundedVideos.length === 0,
  `Ungrounded SKUs (${ungroundedVideos.length}): ${ungroundedVideos.slice(0, 5).join(', ')}`
);

let totalLessonNicheLinks = 0;
nicheSkusMap.forEach(set => totalLessonNicheLinks += set.size);
assertCheck(
  'M2.3',
  `Multi-Niche Synergy Links >= 500 across ${C.totalSystemVideos} lessons`,
  totalLessonNicheLinks >= 500,
  `Total lesson-niche links: ${totalLessonNicheLinks}`
);

// -----------------------------------------------------------------------------
// METRIC 3: CHANNEL <-> NICHE BIDIRECTIONAL SYMMETRY (1,082 + 156 CHANNELS)
// -----------------------------------------------------------------------------
console.log('\n--- METRIC 3: CHANNEL <-> NICHE BIDIRECTIONAL SYMMETRY ---');
assertCheck(
  'M3.1',
  'Competitor Channel SSoT Count: exactly 1,076 channels in kenh-mau.json',
  kenhMau.length === 1076,
  `Found ${kenhMau.length} channels`
);

const invalidChannelNicheCodes = kenhMau.filter(c => !c.nicheCode || !validNicheCodes.has(c.nicheCode));
assertCheck(
  'M3.2',
  '100% of 1,076 channels in kenh-mau.json have valid nicheCode (H01..H40)',
  invalidChannelNicheCodes.length === 0,
  `Invalid nicheCode count: ${invalidChannelNicheCodes.length}`
);

// Niche listing handles map
const nicheListingMap = new Map();
canonicalNiches.forEach(n => {
  const handles = [
    ...(n.mauSach || []),
    ...(n.mauPhu || []),
    ...(n.mauBan || []),
    ...(n.kenhMoRong2026 || [])
  ];
  handles.forEach(h => {
    if (h) {
      const lh = h.toLowerCase();
      if (!nicheListingMap.has(lh)) nicheListingMap.set(lh, new Set());
      nicheListingMap.get(lh).add(n.code);
    }
  });
});

const asymmetricChannels = [];
kenhMau.forEach(c => {
  const h = (c.handle || '').toLowerCase();
  const assigned = c.nicheCode;
  const listings = nicheListingMap.get(h);
  if (!listings || !listings.has(assigned)) {
    asymmetricChannels.push({ handle: c.handle, assigned, listings: listings ? [...listings] : [] });
  }
});

assertCheck(
  'M3.3',
  'Zero Channel Asymmetry: 100% of 1,076 channels symmetric with ngach-xanh.json',
  asymmetricChannels.length === 0,
  `Asymmetric channels count: ${asymmetricChannels.length} (Sample: ${JSON.stringify(asymmetricChannels.slice(0, 3))})`
);

const invalidRawCodes = rawRecords.filter(r => !r.nicheCode || !validNicheCodes.has(r.nicheCode));
assertCheck(
  'M3.4',
  'Canonical Raw Channels: 100% of 156 records have valid nicheCode (H01..H40)',
  rawRecords.length === 156 && invalidRawCodes.length === 0,
  `Total raw: ${rawRecords.length}, invalid nicheCode count: ${invalidRawCodes.length}`
);

// -----------------------------------------------------------------------------
// METRIC 4: DOCUMENT ZERO-ORPHAN INVARIANT (580 DOCUMENTS)
// -----------------------------------------------------------------------------
console.log('\n--- METRIC 4: DOCUMENT ZERO-ORPHAN INVARIANT (580 DOCUMENTS) ---');
assertCheck(
  'M4.1',
  `Document Repository SSoT Count: exactly ${C.documents} documents in tai-lieu-full.json`,
  documents.length === C.documents,
  `Found ${documents.length} documents`
);

const missingDocMetadata = documents.filter(d => !d.docCode || !d.scopeType || !d.systemTrack || !d.nicheCode);
assertCheck(
  'M4.2',
  `100% of ${C.documents} documents have docCode, scopeType, systemTrack, and nicheCode`,
  missingDocMetadata.length === 0,
  `Missing metadata count: ${missingDocMetadata.length}`
);

const unanchoredDocs = documents.filter(d => {
  if (d.scopeType === 'LESSON') {
    return !d.sku || !allVideoSkus.has(d.sku);
  }
  const hasSystemTrack = d.systemTrack && ['H2DEV-CORE', 'META-OPS', 'HUAN', 'DGMD', 'H2DEV', 'PIPELINE'].includes(d.systemTrack);
  const hasNiche = d.nicheCode && (validNicheCodes.has(d.nicheCode) || d.nicheCode === 'META-OPS' || d.nicheCode === 'META');
  return !hasSystemTrack && !hasNiche;
});

assertCheck(
  'M4.3',
  'Universal Document Lineage: zero orphaned documents (100% anchored, LESSONs strictly bound to valid SKUs)',
  unanchoredDocs.length === 0,
  `Orphaned documents count: ${unanchoredDocs.length}`
);

// -----------------------------------------------------------------------------
// METRIC 5: REUP SOURCE GROUNDING & LINEAGE (52 SOURCES)
// -----------------------------------------------------------------------------
console.log('\n--- METRIC 5: REUP SOURCE GROUNDING & LINEAGE (52 SOURCES) ---');
assertCheck(
  'M5.1',
  'Reup Source SSoT Count: exactly 52 sources in nguon-reup.json',
  reupSources.length === 52,
  `Found ${reupSources.length} sources`
);

const ungroundedReup = reupSources.filter(r => !r.sku || !allVideoSkus.has(r.sku));
assertCheck(
  'M5.2',
  '100% of 52 reup sources anchored to valid Video SKUs',
  ungroundedReup.length === 0,
  `Ungrounded reup count: ${ungroundedReup.length}`
);

const reupMissingNiche = reupSources.filter(r => !r.nicheCode || !validNicheCodes.has(r.nicheCode));
assertCheck(
  'M5.3',
  '100% of 52 reup sources assigned to valid nicheCode (H01..H40)',
  reupMissingNiche.length === 0,
  `Reup sources missing nicheCode: ${reupMissingNiche.length}`
);

// -----------------------------------------------------------------------------
// METRIC 6: SQLITE MASTER DB SCHEMA & CROSS-TAB LINEAGE VIEW
// -----------------------------------------------------------------------------
console.log('\n--- METRIC 6: SQLITE MASTER DB SCHEMA & CROSS-TAB LINEAGE VIEW ---');

const fkViolations = db.prepare('PRAGMA foreign_key_check').all();
assertCheck(
  'M6.1',
  'SQLite Foreign Key Integrity: PRAGMA foreign_key_check = 0 violations',
  fkViolations.length === 0,
  `Violations (${fkViolations.length}): ${JSON.stringify(fkViolations.slice(0, 3))}`
);

const dbNiches = db.prepare('SELECT COUNT(*) AS c FROM niches').get().c;
const dbGhostNiches = db.prepare("SELECT COUNT(*) AS c FROM niches WHERE niche_id NOT LIKE 'H%'").get().c;
assertCheck(
  'M6.2',
  'Master DB Niches: exactly 40 Canonical Niches (H01..H40) and 0 Ghost Niches',
  dbNiches === 40 && dbGhostNiches === 0,
  `Total niches: ${dbNiches}, ghost niches: ${dbGhostNiches}`
);

const dbSubNiches = db.prepare('SELECT COUNT(*) AS c FROM sub_niches').get().c;
assertCheck(
  'M6.3',
  'Master DB Sub-Niches: exactly 178 rows in sub_niches table',
  dbSubNiches === 178,
  `Found ${dbSubNiches} sub-niches in DB`
);

const dbLessons = db.prepare('SELECT COUNT(*) AS c FROM lessons').get().c;
assertCheck(
  'M6.4',
  `Master DB Lessons: exactly ${C.totalSystemVideos} rows in lessons table`,
  dbLessons === C.totalSystemVideos,
  `Found ${dbLessons} lessons in DB`
);

const dbLessonNiches = db.prepare('SELECT COUNT(*) AS c FROM lesson_niches').get().c;
assertCheck(
  'M6.5',
  'Master DB Lesson-Niches: at least 500 links in lesson_niches table',
  dbLessonNiches >= 500,
  `Found ${dbLessonNiches} lesson_niches links in DB`
);

const dbTimestamps = db.prepare('SELECT COUNT(*) AS c FROM lesson_timestamps').get().c;
assertCheck(
  'M6.6',
  'Master DB Lesson Timestamps: at least 2,456 timestamps in lesson_timestamps table',
  dbTimestamps >= 2456,
  `Found ${dbTimestamps} timestamps in DB`
);

const dbTranscripts = db.prepare('SELECT COUNT(*) AS c FROM lesson_transcripts').get().c;
assertCheck(
  'M6.6b',
  `Master DB Lesson Transcripts: exactly ${C.totalSystemVideos} unified transcripts in lesson_transcripts table`,
  dbTranscripts === C.totalSystemVideos,
  `Found ${dbTranscripts} transcripts in DB`
);

const dbChannels = db.prepare('SELECT COUNT(*) AS c FROM competitor_channels').get().c;
assertCheck(
  'M6.7',
  `Master DB Channels: at least ${C.channels} channels in competitor_channels table`,
  dbChannels >= C.channels,
  `Found ${dbChannels} channels in DB`
);

const dbDocs = db.prepare('SELECT COUNT(*) AS c FROM documents').get().c;
assertCheck(
  'M6.8',
  `Master DB Documents: exactly ${C.documents} rows in documents table`,
  dbDocs === C.documents,
  `Found ${dbDocs} documents in DB`
);

const dbReup = db.prepare('SELECT COUNT(*) AS c FROM reup_sources').get().c;
assertCheck(
  'M6.9',
  'Master DB Reup Sources: exactly 52 rows in reup_sources table',
  dbReup === 52,
  `Found ${dbReup} reup sources in DB`
);

// Verify cross-tab lineage view
let viewTuples = 0;
try {
  const row = db.prepare('SELECT COUNT(*) AS c FROM v_cross_tab_lineage').get();
  viewTuples = row.c;
} catch (e) {
  viewTuples = -1;
}

assertCheck(
  'M6.10',
  'Master DB v_cross_tab_lineage View Active & Populated (>= 2,200 Lineage Tuples)',
  viewTuples >= 2200,
  `View tuples count: ${viewTuples}`
);

// -----------------------------------------------------------------------------
// METRIC 7: SQLITE 3-DB & FTS5 DEEP SEARCH INVARIANTS
// -----------------------------------------------------------------------------
console.log('\n--- [METRIC 7: SQLITE 3-DB & FTS5 DEEP SEARCH INVARIANTS] ---');

const lessonCols = db.prepare('PRAGMA table_info(lessons)').all().map(c => c.name);
const requiredLessonCols = ['track', 'module_id', 'module_title', 'published_at', 'ingested_at'];
const missingLessonCols = requiredLessonCols.filter(c => !lessonCols.includes(c));
const trackRows = db.prepare('SELECT track, COUNT(*) AS c FROM lessons GROUP BY track').all();
const trackMap = Object.fromEntries(trackRows.map(r => [r.track, r.c]));
assertCheck(
  'M7.1',
  `Master DB lessons schema has [${requiredLessonCols.join(', ')}] & exact 3-track counts (${C.videos}+${C.videosHuan}+${C.videosDgmd}=${C.totalSystemVideos})`,
  missingLessonCols.length === 0 &&
    trackMap.h2dev === C.videos &&
    trackMap.huan === C.videosHuan &&
    trackMap.dgmd === C.videosDgmd,
  `Missing cols: [${missingLessonCols.join(', ')}], tracks: ${JSON.stringify(trackMap)}`
);

const ftsTypeRows = db.prepare('SELECT entity_type, COUNT(*) AS c FROM search_fts GROUP BY entity_type').all();
const ftsTypeMap = Object.fromEntries(ftsTypeRows.map(r => [r.entity_type, r.c]));
const expectedFtsTypes = ['NICHE', 'SUBNICHE', 'META', 'LESSON', 'TIMESTAMP', 'CHANNEL', 'TRANSCRIPT', 'SOP', 'REUP', 'POLICY', 'CHECKLIST'];
const missingFtsTypes = expectedFtsTypes.filter(t => !ftsTypeMap[t] || ftsTypeMap[t] <= 0);
const totalFtsRows = ftsTypeRows.reduce((s, r) => s + r.c, 0);
const expectedSubNicheCount = countSub120 + countSub2026;
const expectedMetaCount = (ngachXanh.ngachMetaKho || []).length;
assertCheck(
  'M7.2',
  `Master DB search_fts covers all 11 entity types (${expectedFtsTypes.join(', ')}) with >= 6,000 indexed rows`,
  missingFtsTypes.length === 0 &&
    ftsTypeMap.SUBNICHE === expectedSubNicheCount &&
    ftsTypeMap.META === expectedMetaCount &&
    ftsTypeMap.TIMESTAMP >= 2500 &&
    ftsTypeMap.SOP === C.documents &&
    totalFtsRows >= 6000,
  `Total FTS rows: ${totalFtsRows}, types: ${JSON.stringify(ftsTypeMap)}`
);

const masterDal = require('./master_dal');
masterDal.searchFts('DOC_1', 1); // Warm up connection, PRAGMAs, and O(1) enrichment maps before latency measurement
const t0Fts = performance.now();
const hitsDiacritic = masterDal.searchFts('đông y', 10);
const hitsUnaccented = masterDal.searchFts('dong y', 10);
const hitsSku = masterDal.searchFts('VIDEO-0419c4', 10);
const hitsSubniche = masterDal.searchFts('SUB-01', 10, 'SUBNICHE');
const hitsLocalSub = masterDal.searchFts('SN-H01-001', 10, 'SUBNICHE');
const hitsMeta = masterDal.searchFts('META-01', 10, 'META');
const hitsTimestamp = masterDal.searchFts('0419c4', 10, 'TIMESTAMP');
const hitsSopBody = masterDal.searchFts('Master Prompt', 10, 'SOP');
const hitsRaw145 = masterDal.searchFts('RAW-145', 5);
const hitsHandle = masterDal.searchFts('@suckhoedongy99', 5);
const avgFtsMs = (performance.now() - t0Fts) / 10;
const allHaveTargetUrl = [...hitsDiacritic, ...hitsSku, ...hitsSubniche, ...hitsMeta, ...hitsTimestamp, ...hitsSopBody, ...hitsRaw145]
  .every(r => typeof r.targetUrl === 'string' && r.targetUrl.startsWith('/'));
assertCheck(
  'M7.3',
  'Master DAL searchFts() supports d/đ folding, hyphenated SKUs/RAW-xxx/@handle, local SN-Hxx-001, SUBNICHE, META, TIMESTAMP, SOP body & 100% targetUrl (< 5ms avg)',
  hitsDiacritic.length > 0 &&
    hitsUnaccented.length > 0 &&
    hitsDiacritic[0].entity_id === hitsUnaccented[0].entity_id &&
    hitsSku.length > 0 &&
    hitsSubniche.length > 0 &&
    hitsLocalSub.length > 0 &&
    hitsLocalSub[0].niche_code === 'H01' &&
    hitsMeta.length > 0 &&
    hitsTimestamp.length > 0 &&
    hitsSopBody.length > 0 &&
    hitsRaw145[0]?.entity_type === 'CHANNEL' &&
    hitsRaw145[0]?.raw_id === 'RAW-145' &&
    hitsHandle[0]?.entity_type === 'CHANNEL' &&
    allHaveTargetUrl &&
    avgFtsMs < 5,
  `Hits: diacritic=${hitsDiacritic.length}, unaccent=${hitsUnaccented.length}, sku=${hitsSku.length}, sub=${hitsSubniche.length}, localSub=${hitsLocalSub[0]?.entity_id}, raw145Top=${hitsRaw145[0]?.raw_id}, targetUrlOk=${allHaveTargetUrl}, avg=${avgFtsMs.toFixed(2)}ms`
);

const kgQuery = require('./kg_query');
kgQuery.searchIntelligenceDb('history', 1); // Warm up intelligence DB & KG DB connections
kgQuery.searchGraphInDb('H01', { limit: 1 }, false);
kgQuery.traceNodeInDb('SUB-01', false);
const t0Kg = performance.now();
const intelRes = kgQuery.searchIntelligenceDb('history', 5);
const intelDongY = kgQuery.searchIntelligenceDb('dong y', 5);
const kgSearchRes = kgQuery.searchGraphInDb('H01', { limit: 5 }, false);
const kgH30Res = kgQuery.searchGraphInDb('H30', { limit: 5 }, false);
const kgVideoRes = kgQuery.searchGraphInDb('VIDEO-0419c4', { limit: 5 }, false);
const kgDongYRes = kgQuery.searchGraphInDb('dong y', { limit: 5 }, false);
const kgDoc54Res = kgQuery.searchGraphInDb('DOC_54', { limit: 5 }, false);
const kgTraceSub01 = kgQuery.traceNodeInDb('SUB-01', false);
const kgTraceMeta01 = kgQuery.traceNodeInDb('META-01', false);
const avgKgMs = (performance.now() - t0Kg) / 9;
assertCheck(
  'M7.4',
  '3-DB Unification: Knowledge Graph FTS5 (kg_fts) & Intelligence DB FTS5 respond < 5ms with DOC_54->sop:DOC-054, SUB-01/META-01 resolution & canonical top-1 ranking',
  Array.isArray(intelRes) &&
    intelRes.length > 0 &&
    Array.isArray(intelDongY) &&
    intelDongY.length > 0 &&
    kgSearchRes?.results?.[0]?.type === 'niche' &&
    kgH30Res?.results?.[0]?.type === 'niche' &&
    kgVideoRes?.results?.[0]?.id === 'video:VIDEO-0419c4' &&
    kgDongYRes?.results?.length > 0 &&
    kgDoc54Res?.results?.[0]?.id === 'sop:DOC-054' &&
    Boolean(kgTraceSub01?.targetNode?.id) &&
    kgTraceMeta01?.targetNode?.id === 'track:h2dev' &&
    avgKgMs < 5,
  `intelHits=${intelRes?.length || 0}, intelDongY=${intelDongY?.length || 0}, H01Top=${kgSearchRes?.results?.[0]?.id}, DOC54Top=${kgDoc54Res?.results?.[0]?.id}, traceSub01=${kgTraceSub01?.targetNode?.id}, avg=${avgKgMs.toFixed(2)}ms`
);

// M7.5: 3-DB Physical Integrity, Zero Foreign Key Violations & Zero Freelist Fragmentation
const dbFiles = ['h2dev_master.db', 'h2dev_knowledge_graph.db', 'intelligence.db'];
const dbHealthReport = [];
let allDbHealthy = true;
for (const f of dbFiles) {
  const fPath = path.join(ROOT, 'data', f);
  const checkDb = new DatabaseSync(fPath, { readOnly: true });
  const integRow = checkDb.prepare('PRAGMA integrity_check').get();
  const integ = integRow ? Object.values(integRow)[0] : 'error';
  const fkErrs = checkDb.prepare('PRAGMA foreign_key_check').all().length;
  const freeRow = checkDb.prepare('PRAGMA freelist_count').get();
  const freelist = freeRow ? Object.values(freeRow)[0] : -1;
  checkDb.close();
  if (integ !== 'ok' || fkErrs !== 0 || freelist !== 0) allDbHealthy = false;
  dbHealthReport.push(`${f}(integ=${integ},fk=${fkErrs},free=${freelist})`);
}
assertCheck(
  'M7.5',
  'All 3 SQLite DBs (h2dev_master.db, h2dev_knowledge_graph.db, intelligence.db) have integrity_check=ok, fk_errors=0, freelist_count=0',
  allDbHealthy,
  dbHealthReport.join(' | ')
);

kgQuery.closeKgDb();
db.close();

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n================================================================================');
console.log(` VERIFICATION SUMMARY: ${passedTests}/${totalTests} CHECKS PASSED, ${failedTests} FAILED `);
console.log('================================================================================');

if (failedTests === 0) {
  console.log('\n>>> [FINAL VERDICT: 100% MATHEMATICAL LINEAGE INVARIANTS SATISFIED (PASS)] <<<\n');
  process.exit(0);
} else {
  console.error(`\n>>> [FINAL VERDICT: ${failedTests} INVARIANTS VIOLATED (FAIL)] <<<\n`);
  process.exit(1);
}
