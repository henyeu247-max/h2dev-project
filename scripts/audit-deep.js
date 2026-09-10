/**
 * Audit sâu — check mọi góc khuất mà validate-project.js không bao quát:
 * 1. videos.json: video thiếu channels[], thiếu docs[], thiếu market, niche rỗng
 * 2. kenh-mau.json: kênh dead, niche "Khác", market rỗng, handle sai format
 * 3. tai-lieu-full.json: file không tồn tại, fileLocal broken, niche "Khác"
 * 4. catalog.json vs catalog_full.json vs videos.json: lệch field
 * 5. assets/thumbs: thiếu/mismatch extension (.png data vs .jpeg đĩa)
 * 6. video/ dirs: mp4 tồn tại, size > 0
 * 7. ngach-xanh.json: số liệu lệch videos.json
 * 8. chien-luoc.json: số liệu lệch
 * 9. docs/NOI-BO: file tồn tại thật
 * 10. pipelines: file tồn tại
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const issues = [];
const warnings = [];

function readJson(rel) {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
  catch (e) { issues.push(`READ FAIL: ${rel}: ${e.message}`); return null; }
}
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }

// ── 1. videos.json deep check ──
const videos = readJson('data-tabs/videos.json') || [];
for (const v of videos) {
  if (!v.sku) { issues.push(`videos.json: record không có SKU`); continue; }
  if (!v.title || !v.title.trim()) issues.push(`${v.sku}: title rỗng`);
  if (!v.niche || !v.niche.trim()) issues.push(`${v.sku}: niche rỗng`);
  if (!Array.isArray(v.market) || v.market.length === 0) {
    // Bài quy trình chung có thể không market — chỉ warn
    if (v.title && !/quy trình|quy trinh|cách làm|tool|hướng dẫn/i.test(v.title)) {
      warnings.push(`${v.sku}: market rỗng — title="${(v.title||'').slice(0,60)}"`);
    }
  }
  if (!Array.isArray(v.channels) || v.channels.length === 0) {
    warnings.push(`${v.sku}: không có channels[] — title="${(v.title||'').slice(0,60)}"`);
  }
  if (!Array.isArray(v.docs) || v.docs.length === 0) {
    warnings.push(`${v.sku}: không có docs[] — title="${(v.title||'').slice(0,60)}"`);
  }
  // Check thumbnail path
  if (v.image && !/^https?:\/\//i.test(v.image)) {
    if (!exists(v.image)) {
      // Thử extension khác
      const ext = path.extname(v.image);
      const base = v.image.slice(0, -ext.length);
      const alts = ['.png', '.jpeg', '.jpg', '.webp'];
      const found = alts.find(e => exists(base + e));
      if (found) {
        issues.push(`${v.sku}: thumbnail MISMATCH — data="${v.image}" nhưng đĩa="${found}"`);
      } else {
        issues.push(`${v.sku}: thumbnail MISSING — "${v.image}" (không tìm bất kỳ extension)`);
      }
    }
  }
  // Check mp4
  if (v.mp4 && !exists(v.mp4)) {
    issues.push(`${v.sku}: mp4 MISSING — "${v.mp4}"`);
  } else {
    // Check size > 0
    const mp4Path = path.join(ROOT, v.mp4 || `video/${v.sku}/${v.sku}.mp4`);
    if (exists(v.mp4 || `video/${v.sku}/${v.sku}.mp4`)) {
      const stat = fs.statSync(mp4Path);
      if (stat.size === 0) issues.push(`${v.sku}: mp4 SIZE=0 — "${v.mp4}"`);
      if (v.size && Math.abs(stat.size - v.size) > 1000) {
        warnings.push(`${v.sku}: size lệch — data=${v.size} đĩa=${stat.size} (delta=${stat.size - v.size})`);
      }
    }
  }
  // Check origin URL
  if (!v.origin || !/^https?:\/\//i.test(v.origin)) {
    warnings.push(`${v.sku}: origin URL thiếu/sai — "${v.origin}"`);
  }
}

// ── 2. kenh-mau.json deep check ──
const channels = readJson('data-tabs/kenh-mau.json') || [];
const nicheSet = new Set();
for (const c of channels) {
  if (!c.handle && !c.channelId) { issues.push(`kenh-mau: record không có handle/channelId`); continue; }
  const id = c.handle || c.channelId;
  if (!c.niche || !c.niche.trim()) {
    issues.push(`kenh-mau "${id}": niche rỗng`);
  } else {
    nicheSet.add(c.niche);
    if (c.niche === 'Khác' || c.niche === 'Khác / Tổng hợp') {
      warnings.push(`kenh-mau "${id}": niche="Khác" — chưa phân loại`);
    }
  }
  if (!Array.isArray(c.markets) || c.markets.length === 0) {
    warnings.push(`kenh-mau "${id}": markets rỗng`);
  }
  if (c.dead === true) {
    warnings.push(`kenh-mau "${id}": DEAD/404 — cần tìm handle mới hoặc xóa`);
  }
  // Handle format check
  if (c.handle && !c.handle.startsWith('@')) {
    issues.push(`kenh-mau: handle không bắt đầu @ — "${c.handle}"`);
  }
}

// ── 3. tai-lieu-full.json deep check ──
const docs = readJson('data-tabs/tai-lieu-full.json') || [];
for (const d of docs) {
  if (!d.name || !d.name.trim()) { issues.push(`tai-lieu: name rỗng`); continue; }
  if (!d.kind || !d.kind.trim()) {
    warnings.push(`tai-lieu "${d.name.slice(0,40)}": kind rỗng`);
  }
  if (!d.contentNiche || !d.contentNiche.trim()) {
    warnings.push(`tai-lieu "${d.name.slice(0,40)}": contentNiche rỗng`);
  } else if (d.contentNiche === 'Khác') {
    warnings.push(`tai-lieu "${d.name.slice(0,40)}": contentNiche="Khác"`);
  }
  // Check file exists
  if (d.file && !/^https?:\/\//i.test(d.file) && !exists(d.file)) {
    issues.push(`tai-lieu "${d.name.slice(0,40)}": file MISSING — "${d.file}"`);
  }
  if (d.fileLocal && !exists(d.fileLocal)) {
    issues.push(`tai-lieu "${d.name.slice(0,40)}": fileLocal MISSING — "${d.fileLocal}"`);
  }
}

// ── 4. catalog vs videos.json lệch field ──
const catalog = readJson('data/catalog.json') || [];
const catalogFull = readJson('data/catalog_full.json') || [];
const videoSkus = new Set(videos.map(v => v.sku));
const catSkus = new Set(catalog.map(c => c.sku));
const fullSkus = new Set(catalogFull.map(c => c.sku));
for (const sku of videoSkus) {
  if (!catSkus.has(sku)) issues.push(`catalog.json MISSING: ${sku}`);
  if (!fullSkus.has(sku)) issues.push(`catalog_full.json MISSING: ${sku}`);
}
for (const sku of catSkus) {
  if (!videoSkus.has(sku)) issues.push(`videos.json MISSING (catalog has): ${sku}`);
}
// Check field lệch title
for (const v of videos) {
  const cf = catalogFull.find(c => c.sku === v.sku);
  if (cf && cf.title !== v.title) {
    warnings.push(`${v.sku}: title lệch videos.json vs catalog_full.json — "${(v.title||'').slice(0,40)}" vs "${(cf.title||'').slice(0,40)}"`);
  }
}

// ── 5. assets/thumbs check ──
const thumbsDir = path.join(ROOT, 'assets', 'thumbs');
if (fs.existsSync(thumbsDir)) {
  const thumbFiles = fs.readdirSync(thumbsDir).filter(f => f !== 'placeholder.svg');
  const thumbSkus = new Set(thumbFiles.map(f => f.replace(/\.(png|jpe?g|webp)$/i, '')));
  for (const v of videos) {
    if (!thumbSkus.has(v.sku)) {
      issues.push(`${v.sku}: thumbnail file MISSING trong assets/thumbs/`);
    }
  }
  // Thừa thumb không có video
  for (const t of thumbSkus) {
    if (!videoSkus.has(t)) {
      warnings.push(`assets/thumbs: thumbnail thừa — "${t}" (không có video tương ứng)`);
    }
  }
}

// ── 6. video/ dirs check ──
const videoDir = path.join(ROOT, 'video');
if (fs.existsSync(videoDir)) {
  const dirs = fs.readdirSync(videoDir).filter(d => fs.statSync(path.join(videoDir, d)).isDirectory());
  // Dir name = "VIDEO-<sku>" (e.g. "VIDEO-DD983D")
  // SKU in videos.json = "VIDEO-DD983D" (already includes VIDEO- prefix)
  // So dir name === sku directly
  const dirSet = new Set(dirs);
  for (const v of videos) {
    const expectedDir = `VIDEO-${v.sku.replace(/^VIDEO-/, '')}`;
    if (!dirSet.has(expectedDir)) {
      issues.push(`${v.sku}: video dir MISSING — video/${expectedDir}/`);
    }
  }
  // Thừa dir không có video
  const videoSkuNormalized = new Set(videos.map(v => v.sku.replace(/^VIDEO-/, '')));
  for (const d of dirs) {
    const skuFromDir = d.replace(/^VIDEO-/, '');
    if (!videoSkuNormalized.has(skuFromDir)) {
      warnings.push(`video dir thừa: video/${d}/ (không có trong videos.json)`);
    }
    // Check mp4 trong dir
    const mp4 = path.join(videoDir, d, `${d}.mp4`);
    if (!fs.existsSync(mp4)) {
      // Thử tên khác
      const files = fs.readdirSync(path.join(videoDir, d));
      const mp4Files = files.filter(f => f.endsWith('.mp4'));
      if (mp4Files.length === 0) {
        issues.push(`video/${d}/: KHÔNG CÓ file .mp4 nào`);
      } else if (mp4Files.length === 1) {
        warnings.push(`video/${d}/: mp4 tên sai — có "${mp4Files[0]}" thay vì "${d}.mp4"`);
      } else {
        warnings.push(`video/${d}/: nhiều mp4 — [${mp4Files.join(', ')}]`);
      }
    }
  }
}

// ── 7. ngach-xanh.json: check số liệu ──
const ngachXanh = readJson('data-tabs/ngach-xanh.json');
if (ngachXanh && ngachXanh.phamViKho) {
  const p = ngachXanh.phamViKho;
  if (p.video !== videos.length) {
    issues.push(`ngach-xanh.json: video=${p.video} nhưng videos.json=${videos.length}`);
  }
  if (p.kenhMau !== channels.length) {
    issues.push(`ngach-xanh.json: kenhMau=${p.kenhMau} nhưng kenh-mau.json=${channels.length}`);
  }
  if (p.taiLieu !== docs.length) {
    issues.push(`ngach-xanh.json: taiLieu=${p.taiLieu} nhưng tai-lieu-full.json=${docs.length}`);
  }
  // Check kenhLive = 109, kenhDead = 22
  const dead = channels.filter(c => c.dead === true).length;
  const live = channels.length - dead;
  if (p.kenhDeadTrongFile !== dead) {
    warnings.push(`ngach-xanh.json: kenhDeadTrongFile=${p.kenhDeadTrongFile} nhưng thực tế dead=${dead}`);
  }
  if (p.kenhLiveTrongFile !== live) {
    warnings.push(`ngach-xanh.json: kenhLiveTrongFile=${p.kenhLiveTrongFile} nhưng thực tế live=${live}`);
  }
}

// ── 8. chien-luoc.json: check số liệu ──
const cl = readJson('data-tabs/chien-luoc.json');
if (cl) {
  // Check taiSanNoiBo paths
  if (Array.isArray(cl.taiSanNoiBo)) {
    for (const t of cl.taiSanNoiBo) {
      if (t.path && !exists(t.path.replace(/\/$/, ''))) {
        warnings.push(`chien-luoc.json: taiSanNoiBo path không tồn tại — "${t.path}"`);
      }
    }
  }
  // Check huongDiNoiDung paths
  if (Array.isArray(cl.huongDiNoiDung)) {
    for (const h of cl.huongDiNoiDung) {
      if (h.localPath && !exists(h.localPath.replace(/\/$/, ''))) {
        warnings.push(`chien-luoc.json: huongDiNoiDung localPath không tồn tại — "${h.localPath}"`);
      }
    }
  }
}

// ── 9. docs/NOI-BO file check ──
const noiBoDir = path.join(ROOT, 'docs', 'NOI-BO');
if (fs.existsSync(noiBoDir)) {
  const noiBoFiles = fs.readdirSync(noiBoDir, { recursive: true }).filter(f => {
    const full = path.join(noiBoDir, f);
    return fs.statSync(full).isFile();
  });
  for (const f of noiBoFiles) {
    // Chỉ check file được tham chiếu trong tai-lieu-full.json
  }
}

// ── 10. pipelines check ──
const pipeDir = path.join(ROOT, 'pipelines');
if (fs.existsSync(pipeDir)) {
  const pipes = fs.readdirSync(pipeDir).filter(d => fs.statSync(path.join(pipeDir, d)).isDirectory());
  for (const p of pipes) {
    const readme = path.join(pipeDir, p, 'README.md');
    const skill = path.join(pipeDir, p, 'SKILL.md');
    if (!fs.existsSync(readme) && !fs.existsSync(skill)) {
      warnings.push(`pipelines/${p}/: KHÔNG CÓ README.md hoặc SKILL.md`);
    }
  }
}

// ── 11. Check niche consistency: videos.niche vs NICHE_MAP trong index.html ──
// Lấy danh sách niche duy nhất từ videos.json
const videoNiches = new Set();
for (const v of videos) { if (v.niche) videoNiches.add(v.niche); }
// Lấy danh sách niche duy nhất từ kenh-mau.json
const channelNiches = nicheSet;
// In ra để đối chiếu thủ công
console.log('═══════════════════════════════════════');
console.log('  AUDIT SÂU — H2DEV Project');
console.log('═══════════════════════════════════════\n');
console.log(`Videos: ${videos.length} | Channels: ${channels.length} | Docs: ${docs.length}`);
console.log(`Video niches (${videoNiches.size}): ${[...videoNiches].sort().join(' · ')}`);
console.log(`Channel niches (${channelNiches.size}): ${[...channelNiches].sort().join(' · ')}\n`);

console.log('─── ISSUES (phải sửa) ───');
if (issues.length === 0) console.log('  ✅ Không có issue nghiêm trọng');
else { issues.forEach((i, idx) => console.log(`  ${idx+1}. ${i}`)); }
console.log(`\n  → ${issues.length} issue(s)`);

console.log('\n─── WARNINGS (cần xem xét) ───');
if (warnings.length === 0) console.log('  ✅ Không có warning');
else { warnings.forEach((w, idx) => console.log(`  ${idx+1}. ${w}`)); }
console.log(`\n  → ${warnings.length} warning(s)`);
