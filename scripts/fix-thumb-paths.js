// Chuẩn hóa đường dẫn thumbnail cho khớp file thực tế trên đĩa.
// Với mỗi SKU, tìm file thật trong assets/thumbs (bất kể png/jpeg/jpg),
// rồi cập nhật image/thumb trong videos.json, catalog.json, catalog_full.json.
// Có backup .bak trước khi ghi. KHÔNG xóa/sửa record hay SKU.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const THUMBS_DIR = path.join(ROOT, 'assets', 'thumbs');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}
function writeJson(rel, data) {
  const full = path.join(ROOT, rel);
  const bak = `${full}.bak-thumbfix-${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)}`;
  fs.copyFileSync(full, bak);
  fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  backed up -> ${path.basename(bak)}`);
}

// Build map: SKU -> thực file name (bỏ placeholder.svg)
const thumbFiles = fs.readdirSync(THUMBS_DIR).filter(f => f !== 'placeholder.svg');
const thumbBySku = new Map();
for (const f of thumbFiles) {
  const m = f.match(/^(VIDEO-[0-9a-fA-F]+)\.[a-zA-Z0-9]+$/);
  if (m && !thumbBySku.has(m[1])) thumbBySku.set(m[1], f);
}

function fixRecord(rec, field) {
  let changed = 0;
  for (const item of rec) {
    const val = item[field];
    if (!val || typeof val !== 'string') continue;
    const m = val.match(/^(.*\/)?(VIDEO-[0-9a-fA-F]+)\.[a-zA-Z0-9]+$/);
    if (!m) continue;
    const sku = m[2];
    const real = thumbBySku.get(sku);
    if (!real) {
      console.log(`  !! ${sku}: no thumb on disk`);
      continue;
    }
    const prefix = m[1] || '';
    const fixed = `${prefix}${real}`;
    if (fixed !== val) {
      item[field] = fixed;
      changed++;
    }
  }
  return changed;
}

console.log(`Thumb files on disk: ${thumbFiles.length}`);
console.log('Fixing videos.json ...');
const videos = readJson('data-tabs/videos.json');
let c1 = fixRecord(videos, 'image');
if (c1) writeJson('data-tabs/videos.json', videos);
console.log(`  changed: ${c1}`);

console.log('Fixing catalog.json ...');
const catalog = readJson('data/catalog.json');
let c2 = fixRecord(catalog, 'thumb');
if (c2) writeJson('data/catalog.json', catalog);
console.log(`  changed: ${c2}`);

console.log('Fixing catalog_full.json ...');
const catalogFull = readJson('data/catalog_full.json');
let c3 = fixRecord(catalogFull, 'image');
if (c3) writeJson('data/catalog_full.json', catalogFull);
console.log(`  changed: ${c3}`);

console.log('Done.');
