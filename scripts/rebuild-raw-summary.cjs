#!/usr/bin/env node
/**
 * rebuild-raw-summary.cjs
 * Rebuild khoi `summary` cua data-tabs/raw-kenh-mau.json tu `records` hien tai.
 *
 * Ly do: faceless-vision-batch.py chi ghi thumbnailVision, KHONG cap nhat `summary`
 * -> summary bi stale (totalRecords 83 trong khi records = 156).
 *
 * Dac diem:
 *  - PHAU THUAT: chi thay khoi "summary" (key cuoi cung), giu nguyen 100% phan con lai
 *    (bao gom CRLF va dinh dang so thuc nhu 5.0 / 1066.0) -> diff toi thieu.
 *  - Idempotent: chay lai nhieu lan cho ket qua giong nhau.
 *  - Chi tinh cac field suy ra duoc tu records; giu nguyen field ngoai
 *    (vidiqActiveCredits, topGrowthChannels30d) de tranh mat du lieu.
 *  - KHONG xoa du lieu. Backup truoc bang _backup/<YYYYMMDD-task>/ (theo RULE-LAM-VIEC).
 *
 * Usage:
 *   node scripts/rebuild-raw-summary.cjs          # ghi file
 *   node scripts/rebuild-raw-summary.cjs --dry     # chi in, khong ghi
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TAB = path.join(ROOT, 'data-tabs', 'raw-kenh-mau.json');
const DRY = process.argv.includes('--dry');

const text = fs.readFileSync(TAB, 'utf8');
const doc = JSON.parse(text);
const records = doc.records || [];

// --- Cac chi so suy ra tu records ---
const totalRecords = records.length;

const seenChannels = new Set();
let uniqueChannels = 0;
let aggSubs = 0;
let aggViews = 0;
for (const r of records) {
  const c = r.channel || {};
  const key = c.channelId || c.handle || r.id;
  if (seenChannels.has(key)) continue;
  seenChannels.add(key);
  uniqueChannels++;
  aggSubs += Number(c.subscribers) || 0;
  aggViews += Number(c.views) || 0;
}

const dupGroupSet = new Set();
let duplicateRecords = 0;
for (const r of records) {
  if (r.duplicateOf) {
    duplicateRecords++;
    dupGroupSet.add(r.duplicateOf);
  }
}

const edSet = new Set();
for (const r of records) if (r.editorialNiche) edSet.add(r.editorialNiche);

let vidiqVerified = 0;
const vidiqIds = new Set();
for (const r of records) {
  const v = r.vidiqVerification;
  if (v && (v.status === 'VERIFIED' || v.verifiedAt)) {
    vidiqVerified++;
    if (v.channelId) vidiqIds.add(v.channelId);
  }
}

// --- Ghep summary moi (giu thu tu key goc + field ngoai) ---
const prev = doc.summary || {};
const computed = {
  totalRecords,
  uniqueChannels,
  duplicateRecords,
  duplicateGroups: dupGroupSet.size,
  editorialNichesCount: edSet.size,
  vidiqVerified,
  vidiqActiveCredits: prev.vidiqActiveCredits != null ? prev.vidiqActiveCredits : null,
  totalAggregatedSubscribers: aggSubs,
  totalAggregatedViews: aggViews,
  vidiqVerifiedUnique: vidiqIds.size,
  topGrowthChannels30d: prev.topGrowthChannels30d || [],
};

const nextSummary = {};
for (const k of Object.keys(prev)) {
  nextSummary[k] = k in computed ? computed[k] : prev[k];
}
for (const k of Object.keys(computed)) {
  if (!(k in nextSummary)) nextSummary[k] = computed[k];
}

console.log('BEFORE summary:', JSON.stringify(prev));
console.log('AFTER  summary:', JSON.stringify(nextSummary));

if (JSON.stringify(prev) === JSON.stringify(nextSummary) && doc.totalRecords === totalRecords) {
  console.log('Khong co thay doi — summary da dong bo.');
  process.exit(0);
}

// --- Phau thuat: thay khoi "summary" (key cuoi cung), giu CRLF + phan con lai ---
const marker = '\r\n  "summary":';
const idx = text.lastIndexOf(marker);
if (idx === -1) {
  console.error('Khong tim thay khoi "summary" — huy de an toan.');
  process.exit(1);
}
const head = text.slice(0, idx);

// Serialize summary voi indent 2, chuan CRLF.
// Dong dau '{' gan lien sau marker; cac dong sau thut leo 2 space (thanh 4 space).
const lines = JSON.stringify(nextSummary, null, 2).split('\n');
const body = lines.map((l, i) => (i === 0 ? l : '  ' + l)).join('\r\n');
const newBlock = marker + ' ' + body + '\r\n}';

if (DRY) {
  console.log('DRY RUN — khong ghi file. Block moi:');
  console.log(newBlock.slice(0, 600));
} else {
  fs.writeFileSync(TAB, head + newBlock, 'utf8');
  console.log('Da ghi', TAB);
}
