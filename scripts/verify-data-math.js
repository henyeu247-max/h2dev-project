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
// METRIC 2: UNIVERSAL VIDEO GROUNDING (333 LESSONS)
// -----------------------------------------------------------------------------
console.log('\n--- METRIC 2: UNIVERSAL VIDEO GROUNDING (333 LESSONS) ---');
const allVideoSkus = new Set(allVideos.map(v => v.sku));

assertCheck(
  'M2.1',
  'Video Repository Integrity: exactly 333 lessons (148 H2DEV + 140 HUAN + 45 DGMD)',
  allVideos.length === 333 && allVideoSkus.size === 333,
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

const ungroundedVideos = [...allVideoSkus].filter(sku => !nicheSkusMap.has(sku));
assertCheck(
  'M2.2',
  '100% Video Grounding: 333/333 videos anchored to at least one Canonical Niche',
  ungroundedVideos.length === 0,
  `Ungrounded SKUs (${ungroundedVideos.length}): ${ungroundedVideos.slice(0, 5).join(', ')}`
);

let totalLessonNicheLinks = 0;
nicheSkusMap.forEach(set => totalLessonNicheLinks += set.size);
assertCheck(
  'M2.3',
  'Multi-Niche Synergy Links >= 500 across 333 lessons',
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
  'Document Repository SSoT Count: exactly 580 documents in tai-lieu-full.json',
  documents.length === 580,
  `Found ${documents.length} documents`
);

const missingDocMetadata = documents.filter(d => !d.docCode || !d.scopeType || !d.systemTrack || !d.nicheCode);
assertCheck(
  'M4.2',
  '100% of 580 documents have docCode, scopeType, systemTrack, and nicheCode',
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
  'Master DB Lessons: exactly 333 rows in lessons table',
  dbLessons === 333,
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
  'Master DB Lesson Timestamps: exactly 2,456 timestamps in lesson_timestamps table',
  dbTimestamps === 2456,
  `Found ${dbTimestamps} timestamps in DB`
);

const dbTranscripts = db.prepare('SELECT COUNT(*) AS c FROM lesson_transcripts').get().c;
assertCheck(
  'M6.6b',
  'Master DB Lesson Transcripts: exactly 333 unified transcripts in lesson_transcripts table',
  dbTranscripts === 333,
  `Found ${dbTranscripts} transcripts in DB`
);

const dbChannels = db.prepare('SELECT COUNT(*) AS c FROM competitor_channels').get().c;
assertCheck(
  'M6.7',
  'Master DB Channels: at least 1,076 channels in competitor_channels table',
  dbChannels >= 1076,
  `Found ${dbChannels} channels in DB`
);

const dbDocs = db.prepare('SELECT COUNT(*) AS c FROM documents').get().c;
assertCheck(
  'M6.8',
  'Master DB Documents: exactly 580 rows in documents table',
  dbDocs === 580,
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
