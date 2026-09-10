/**
 * Fix size mp4 — cập nhật size trong videos.json cho khớp đĩa
 * - DRY-RUN mode: chỉ in ra, không ghi (chạy verify trước)
 * - Chạy mode thật khi có --write
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const videosPath = path.join(ROOT, 'data-tabs', 'videos.json');
const videos = JSON.parse(fs.readFileSync(videosPath, 'utf8'));

const isWrite = process.argv.includes('--write');
let ok = 0, mismatch = 0, missing = 0;
const changes = [];

for (const v of videos) {
  if (!v.mp4) { missing++; continue; }
  const mp4Path = path.join(ROOT, v.mp4);
  if (!fs.existsSync(mp4Path)) {
    console.log(`  ❌ MISSING: ${v.sku} → ${v.mp4}`);
    missing++;
    continue;
  }
  const diskSize = fs.statSync(mp4Path).size;
  if (v.size === diskSize) {
    ok++;
  } else {
    mismatch++;
    changes.push({ sku: v.sku, oldSize: v.size, newSize: diskSize, delta: diskSize - v.size });
    if (!isWrite) {
      const deltaStr = (diskSize - v.size > 0 ? '+' : '') + ((diskSize - v.size) / 1024 / 1024).toFixed(1) + 'MB';
      console.log(`  ⚠️  ${v.sku}: ${v.size} → ${diskSize} (delta ${deltaStr})`);
    }
  }
}

console.log(`\n─── TỔNG KẾT ───`);
console.log(`OK (không đổi):     ${ok}`);
console.log(`MISMATCH (cần sửa): ${mismatch}`);
console.log(`MISSING:            ${missing}`);
console.log(`Tổng:               ${videos.length}`);

if (isWrite && mismatch > 0) {
  // Áp dụng thay đổi
  for (const c of changes) {
    const v = videos.find(x => x.sku === c.sku);
    if (v) v.size = c.newSize;
  }
  // Ghi file (pretty print 2 spaces)
  fs.writeFileSync(videosPath, JSON.stringify(videos, null, 2) + '\n', 'utf8');
  console.log(`\n✅ Đã cập nhật ${mismatch} size trong videos.json`);
  // Verify lại
  const verify = JSON.parse(fs.readFileSync(videosPath, 'utf8'));
  let verifyOk = 0;
  for (const v of verify) {
    if (!v.mp4) continue;
    const mp4Path = path.join(ROOT, v.mp4);
    if (!fs.existsSync(mp4Path)) continue;
    if (v.size === fs.statSync(mp4Path).size) verifyOk++;
  }
  console.log(`✅ Verify: ${verifyOk}/${videos.filter(v => v.mp4).length} size khớp đĩa`);
} else if (!isWrite && mismatch > 0) {
  console.log(`\n→ Chạy lại với --write để áp dụng:`);
  console.log(`  node scripts/fix-mp4-size.js --write`);
}
