#!/usr/bin/env node
/**
 * gen-research-catalog.cjs — Sinh 43 entry catalog cho kho prompt research
 * (data/research-20260916/) va merge vao data-tabs/tai-lieu-full.json.
 *
 * - Idempotent: bo qua entry co sku da ton tai.
 * - kind = 'prompt'; contentNiche phan loai theo keyword ten file.
 * - file = data/research-20260916/<file> (duong dan tuong doi goc du an, server serve tinh).
 * - --dry: chi in entry, khong ghi.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'data', 'research-20260916', 'manifest.json');
const CATALOG = path.join(ROOT, 'data-tabs', 'tai-lieu-full.json');
const DRY = process.argv.includes('--dry');

// ---- Nguon theo tien to ten file ----------------------------------------
function sourceOf(file) {
  const b = path.basename(file).toLowerCase();
  if (b.startsWith('ailockup')) return 'AiLockup';
  if (b.startsWith('aiplaybook')) return 'AI Playbook';
  if (b.startsWith('aipreneur')) return 'AIpreneur';
  if (b.startsWith('bytegenius')) return 'TheByteGenius';
  if (b.startsWith('markaiguy')) return 'Markaiguy';
  if (b.startsWith('mm-')) return 'MonetizeMind';
  if (b.startsWith('crayon-capital')) return 'MonetizeMind Telegram';
  return 'Telegram Desktop';
}

// ---- Phan loai ngach noi dung (keyword) ---------------------------------
function nicheOf(file, source) {
  const t = (path.basename(file) + ' ' + source).toLowerCase();
  if (/finance|tài chính|mr-finance|magial|capital|kinh tế/.test(t)) return 'Kinh tế / Tài chính';
  if (/history|historical|fifa|war|foods|viral/.test(t)) return 'Lịch sử / Quân sự';
  if (/horror|dark|ledger|scary|drama|story/.test(t)) return 'Drama / Stories';
  if (/stick|whiteboard|anime|cinematic|vox|paper|music|fern|zenn|animation|hoạt hình/.test(t)) return 'Reup / Hoạt hình';
  if (/faceless|nhân bản/.test(t)) return 'Nhân bản / Kênh';
  return 'Nền tảng / Tool';
}

// ---- Tieu de doc duoc tu ten file ---------------------------------------
function titleOf(file) {
  let base = path.basename(file).replace(/\.txt$/i, '').replace(/\.docx$/i, '');
  base = base.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  // Title-case neu ten toan chu HOA
  const letters = base.replace(/[^A-Za-z]/g, '');
  if (letters && letters === letters.toUpperCase()) {
    base = base.toLowerCase().replace(/\b([a-z0-9])/g, (m) => m.toUpperCase());
  }
  // Khoi phuc acronym
  base = base.replace(/\b3d\b/gi, '3D').replace(/\bai\b/gi, 'AI')
    .replace(/\bvox\b/gi, 'VOX').replace(/\bfifa\b/gi, 'FIFA')
    .replace(/\bhd\b/gi, 'HD').replace(/\bii\b/gi, 'II').replace(/\bwwii\b/gi, 'WWII');
  return base;
}

// ---- Sinh entry ----------------------------------------------------------
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const docs = manifest.docs || [];

const entries = docs.map((d, i) => {
  const src = sourceOf(d.file);
  const title = titleOf(d.file);
  const name = src === 'Telegram Desktop' ? title : `${src} — ${title}`;
  return {
    sku: 'RESEARCH-' + String(i + 1).padStart(2, '0'),
    name,
    link: '',
    file: 'data/research-20260916/' + d.file,
    contentNiche: nicheOf(d.file, src),
    kind: 'prompt',
    source: src,
  };
});

// ---- Merge vao catalog ---------------------------------------------------
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const existing = new Set(catalog.map((c) => c.sku));
const toAdd = entries.filter((e) => !existing.has(e.sku));

console.log('Manifest docs:', docs.length);
console.log('Entry sinh ra:', entries.length, '| Them moi:', toAdd.length, '| Da co:', entries.length - toAdd.length);
console.log('Catalog hien tai:', catalog.length, '-> sau khi them:', catalog.length + toAdd.length);
console.log('--- 5 entry dau ---');
entries.slice(0, 5).forEach((e) => console.log('  ', e.sku, '|', e.name, '|', e.contentNiche));
console.log('--- phan bo ngach ---');
const dist = {};
entries.forEach((e) => { dist[e.contentNiche] = (dist[e.contentNiche] || 0) + 1; });
console.log('  ', JSON.stringify(dist));
console.log('--- phan bo nguon ---');
const ds = {};
entries.forEach((e) => { ds[e.source] = (ds[e.source] || 0) + 1; });
console.log('  ', JSON.stringify(ds));

if (DRY) { console.log('\n[DRY-RUN] khong ghi file.'); process.exit(0); }

const merged = catalog.concat(toAdd);
fs.writeFileSync(CATALOG, JSON.stringify(merged, null, 2) + '\n', 'utf8');
console.log(`\nDa ghi ${merged.length} entry vao ${path.relative(ROOT, CATALOG)}`);
