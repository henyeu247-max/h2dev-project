// DEEP-AUDIT toàn diện dữ liệu H2DEV-Project — kiểm tra 100% record, không tượng trưng.
// Chạy: node scripts/deep-audit.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const issues = [];      // lỗi / mâu thuẫn
const notes = [];       // thông tin
const stats = {};

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')); }
  catch (e) { issues.push(`KHONG DOC DUOC ${p}: ${e.message}`); return null; }
}
function skuOf(s) { return typeof s === 'string' ? s : (s && s.sku); }

// ===== 1. NẠP DỮ LIỆU =====
const videos = readJson('data-tabs/videos.json') || [];
const channels = readJson('data-tabs/kenh-mau.json') || [];
const ngach = readJson('data-tabs/ngach-xanh.json') || {};
const taiLieu = readJson('data-tabs/tai-lieu-full.json') || [];
const kichBan = readJson('data-tabs/kich-ban.json') || [];
const nguonReup = readJson('data-tabs/nguon-reup.json') || [];
const catalog = readJson('data/catalog.json') || [];
const catalogFull = readJson('data/catalog_full.json') || [];
const chienLuoc = readJson('data-tabs/chien-luoc.json') || {};

stats.videos = videos.length;
stats.channels = channels.length;
stats.taiLieu = taiLieu.length;
stats.kichBan = kichBan.length;
stats.nguonReup = nguonReup.length;
stats.ngachXanh = (ngach.ngachXanh || []).length;
stats.catalog = catalog.length;
stats.catalogFull = catalogFull.length;

// ===== 2. VIDEOS: từng video có đủ field & hợp lệ =====
const vidSkuSet = new Set();
for (const v of videos) {
  vidSkuSet.add(v.sku);
  if (!v.sku) issues.push('VIDEO thiếu sku');
  if (!v.title) issues.push(`${v.sku}: thiếu title`);
  if (!Array.isArray(v.market)) issues.push(`${v.sku}: market không phải mảng`);
  if (!Array.isArray(v.channels)) issues.push(`${v.sku}: channels không phải mảng`);
  if (!Array.isArray(v.docs)) issues.push(`${v.sku}: docs không phải mảng`);
  if (!v.niche) issues.push(`${v.sku}: thiếu niche`);
  if (v.market && v.market.length === 0) notes.push(`${v.sku}: market rỗng`);
}
// duplicate sku
const dupVid = videos.filter((v, i) => videos.findIndex(x => x.sku === v.sku) !== i);
if (dupVid.length) issues.push(`VIDEO duplicate sku: ${[...new Set(dupVid.map(v => v.sku))].join(', ')}`);

// ===== 3. PHÂN BỐ NICHE / MARKET =====
const nicheDist = {};
const marketDist = {};
for (const v of videos) {
  nicheDist[v.niche] = (nicheDist[v.niche] || 0) + 1;
  (v.market || []).forEach(m => { marketDist[m] = (marketDist[m] || 0) + 1; });
}
stats.nicheDist = nicheDist;
stats.marketDist = marketDist;

// ===== 4. NGACH-XANH: đối chiếu sku =====
const ngachXanh = ngach.ngachXanh || [];
const metaKho = ngach.ngachMetaKho || [];
const ngachSkuSet = new Set();
const metaSkuSet = new Set();
for (const n of ngachXanh) (n.skus || []).forEach(s => ngachSkuSet.add(skuOf(s)));
for (const m of metaKho) (m.skus || []).forEach(s => metaSkuSet.add(skuOf(s)));

const xanhTrue = ngachXanh.filter(n => n.xanh === true);
const xanhStr = ngachXanh.filter(n => typeof n.xanh === 'string');
const xanhNull = ngachXanh.filter(n => n.xanh === undefined || n.xanh === null);
stats.ngachXanhTotal = ngachXanh.length;
stats.ngachXanhTrue = xanhTrue.length;
stats.ngachXanhString = xanhStr.length;
stats.ngachXanhNull = xanhNull.length;

// sku lạ (không tồn tại trong videos)
const orphNgach = [...ngachSkuSet].filter(s => !vidSkuSet.has(s));
const orphMeta = [...metaSkuSet].filter(s => !vidSkuSet.has(s));
if (orphNgach.length) issues.push(`ngachXanh sku không tồn tại: ${orphNgach.join(', ')}`);
if (orphMeta.length) issues.push(`ngachMetaKho sku không tồn tại: ${orphMeta.join(', ')}`);

// video nào không nằm trong ngach nào
const covered = new Set([...ngachSkuSet]);
const notInNgach = [...vidSkuSet].filter(s => !covered.has(s));
stats.notInNgach = notInNgach.length;
const notInAnything = [...vidSkuSet].filter(s => !ngachSkuSet.has(s) && !metaSkuSet.has(s));
stats.notInAnything = notInAnything.length;
if (notInAnything.length) issues.push(`Video không nằm trong ngachXanh lẫn meta: ${notInAnything.join(', ')}`);

// số ngách theo mức xanh
const xanhLevel = {};
for (const n of ngachXanh) {
  const lv = n.xanh === true ? 'XANH-TRUE' : (typeof n.xanh === 'string' ? n.xanh : 'UNDEFINED');
  xanhLevel[lv] = (xanhLevel[lv] || 0) + 1;
}
stats.xanhLevel = xanhLevel;

// ===== 5. KENH-MAU =====
const channelNiche = {};
const deadCh = channels.filter(c => c.dead);
for (const c of channels) channelNiche[c.niche] = (channelNiche[c.niche] || 0) + 1;
stats.channelDead = deadCh.length;
stats.channelLive = channels.length - deadCh.length;
stats.channelNiche = channelNiche;

// kênh 'Khác' thực sự
const khacCh = channels.filter(c => c.niche === 'Khác');
stats.channelKhac = khacCh.length;
if (khacCh.length) {
  notes.push(`KENH 'Khác' (${khacCh.length}): ${khacCh.map(c => c.handle).join(', ')}`);
}

// ===== 6. TÀI LIỆU =====
const tlNiche = {};
const tlKind = {};
for (const t of taiLieu) {
  tlNiche[t.contentNiche] = (tlNiche[t.contentNiche] || 0) + 1;
  tlKind[t.kind] = (tlKind[t.kind] || 0) + 1;
}
stats.tlNiche = tlNiche;
stats.tlKind = tlKind;
// file tồn tại?
const missingFile = [];
for (const t of taiLieu) {
  const f = t.fileLocal || t.file;
  if (f && !/^https?:/.test(f) && !fs.existsSync(path.join(ROOT, f))) missingFile.push(`${t.sku}: ${f}`);
}
stats.missingFile = missingFile.length;
if (missingFile.length) issues.push(`Tài liệu thiếu file local (${missingFile.length}): ${missingFile.slice(0, 10).join(' | ')}`);

// ===== 7. ĐỐI CHIẾU SỐ LIỆU KHỐI META với phân bố niche thực =====
// meta 5 khối
const metaNames = metaKho.map(m => m.ngach);
stats.metaNames = metaNames;
// tổng sku meta
stats.metaTotalSku = metaSkuSet.size;

// ===== 8. KIỂM TRA TRÙNG NGÁCH + sku xuất hiện nhiều ngách =====
const skuNgachMap = {};
for (const n of ngachXanh) {
  (n.skus || []).forEach(s => {
    const sku = skuOf(s);
    (skuNgachMap[sku] = skuNgachMap[sku] || []).push(n.ngach);
  });
}
const multiNgach = Object.entries(skuNgachMap).filter(([, ng]) => new Set(ng).size > 1);
stats.multiNgach = multiNgach.length;
if (multiNgach.length) {
  notes.push(`SKU nằm trong nhiều ngách (${multiNgach.length}): ${multiNgach.map(([s, ng]) => s + '→' + [...new Set(ng)].join('/')).join('; ')}`);
}

// ===== 9. PHÂN BỐ KENH-MAU market =====
const chanMarket = {};
for (const c of channels) (c.markets || []).forEach(m => { chanMarket[m] = (chanMarket[m] || 0) + 1; });
stats.chanMarket = chanMarket;

// ===== IN BÁO CÁO =====
console.log('========== DEEP-AUDIT H2DEV-Project ==========');
console.log('Ngày chạy: ' + new Date().toISOString());
console.log('\n--- SỐ LƯỢNG ---');
for (const k of Object.keys(stats)) {
  if (['nicheDist', 'marketDist', 'xanhLevel', 'channelNiche', 'tlNiche', 'tlKind', 'chanMarket', 'metaNames'].includes(k)) continue;
  console.log(`${k}: ${JSON.stringify(stats[k])}`);
}
console.log('\n--- PHÂN BỐ NICHE VIDEO ---');
Object.entries(nicheDist).sort((a, b) => b[1] - a[1]).forEach(([k, c]) => console.log(`  ${c}\t${k}`));
console.log('\n--- PHÂN BỐ MARKET VIDEO ---');
Object.entries(marketDist).sort((a, b) => b[1] - a[1]).forEach(([k, c]) => console.log(`  ${c}\t${k}`));
console.log('\n--- NGACH THEO MỨC ---');
Object.entries(xanhLevel).sort((a, b) => b[1] - a[1]).forEach(([k, c]) => console.log(`  ${c}\t${k}`));
console.log('\n--- NICHE KENH-MAU ---');
Object.entries(channelNiche).sort((a, b) => b[1] - a[1]).forEach(([k, c]) => console.log(`  ${c}\t${k}`));
console.log('\n--- CONTENT-NICHE TÀI LIỆU ---');
Object.entries(tlNiche).sort((a, b) => b[1] - a[1]).forEach(([k, c]) => console.log(`  ${c}\t${k}`));
console.log('\n--- MARKET KENH-MAU ---');
Object.entries(chanMarket).sort((a, b) => b[1] - a[1]).forEach(([k, c]) => console.log(`  ${c}\t${k}`));

console.log('\n--- PHÁT HIỆN / CẢNH BÁO ---');
if (notes.length) { console.log('Ghi chú:'); notes.forEach(n => console.log('  * ' + n)); }
if (issues.length) { console.log('ISSUES:'); issues.forEach(i => console.log('  ! ' + i)); }
else console.log('  Không có ISSUES về tính toàn vẹn tham chiếu.');

console.log('\n========== KẾT THÚC ==========');
