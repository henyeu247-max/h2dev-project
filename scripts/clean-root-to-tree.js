/**
 * Dọn gốc dự án → cây chuẩn.
 * H2DEV-Project = não. Ngoài chỉ còn README + _archive + (IDE).
 * Không xóa: MOVE vào _archive sau khi hash khớp bản đã nằm trong H2DEV.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const H2 = path.resolve(__dirname, '..');
const ARCHIVE = path.join(ROOT, '_archive', '20260818-root');
const SECRETS = path.join(ROOT, '_archive', 'secrets');

function hashFile(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}
function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
function exists(p) { return fs.existsSync(p); }
function move(src, dest) {
  ensureDir(path.dirname(dest));
  if (exists(dest)) {
    const bak = dest + '.already';
    if (!exists(bak)) fs.renameSync(dest, bak);
  }
  fs.renameSync(src, dest);
}
function copyDir(src, dest) {
  ensureDir(dest);
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    const st = fs.statSync(s);
    if (st.isDirectory()) copyDir(s, d);
    else {
      ensureDir(path.dirname(d));
      fs.copyFileSync(s, d);
    }
  }
}

const log = [];
function note(m) { log.push(m); console.log(m); }

ensureDir(ARCHIVE);
ensureDir(SECRETS);
ensureDir(path.join(H2, 'inbox'));
ensureDir(path.join(H2, '_private'));
ensureDir(path.join(H2, '_backup'));
ensureDir(path.join(H2, 'docs', 'NOI-BO', 'bao-cao'));

const errors = [];

// --- 1) Gom backup H2DEV ---
for (const name of ['_backup-20260815', '_backup-20260818-dongbo']) {
  const src = path.join(H2, name);
  const dest = path.join(H2, '_backup', name.replace(/^_backup-/, ''));
  if (exists(src) && !exists(dest)) {
    fs.renameSync(src, dest);
    note(`BACKUP ${name} → _backup/${path.basename(dest)}`);
  }
}

// --- 2) Báo cáo DOI-CHIEU đang nằm root H2DEV ---
const doiChieuSrc = path.join(H2, 'DOI-CHIEU-NGACH-MARKET-H2DEV-2026-08-17.md');
const doiChieuDest = path.join(H2, 'docs', 'NOI-BO', 'bao-cao', 'DOI-CHIEU-NGACH-MARKET-H2DEV-2026-08-17.md');
if (exists(doiChieuSrc) && !exists(doiChieuDest)) {
  fs.renameSync(doiChieuSrc, doiChieuDest);
  note('MOVE H2DEV DOI-CHIEU → docs/NOI-BO/bao-cao/');
}

// --- 3) Knowledge-hub vào H2DEV (kho sống) ---
const khSrc = path.join(ROOT, 'knowledge-hub');
const khDest = path.join(H2, 'knowledge-hub');
if (exists(khSrc) && !exists(khDest)) {
  fs.renameSync(khSrc, khDest);
  note('MOVE knowledge-hub → H2DEV-Project/knowledge-hub');
} else if (exists(khSrc) && exists(khDest)) {
  note('WARN knowledge-hub exists both sides — leave source, inspect');
  errors.push('knowledge-hub dual');
}

// --- 4) Verify + archive file lẻ ở gốc ---
const reportNames = [
  'BAO-CAO-NGACH-NHAT-HAN.md',
  'CROSS-CHECK-BIBLE-NEXLEV-2026-07-27.md',
  'DANH-GIA-HOAT-HINH-AI-KE-CHUYEN-2026-07-30.md',
  'DANH-GIA-TAI-SAN-DU-AN-2026-07-27.md',
  'DOI-THU-VERIFIED-2026-07-27.md',
  'NGACH-XANH-LO-TRINH-2026-07-27.md',
  'NHAN-DINH-CHOT-NGACH-ON-DINH-US-NHAT-HAN-2026-07-27.md',
  'NHAN-DINH-NGACH-MAI-XANH-2026-07-27.md',
  'PHAN-TICH-MCP-DAY-DU-2026-07-27.md',
  'QUET-FACELESS-2026-07-30.md',
  'QUET-MU-TOAN-THI-TRUONG-FACELESS-2026-07-27.md',
  'VERIFY-NGACH-MAI-XANH-LAN-2-2026-07-27.md',
];

function findRootFile(pred) {
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isFile())
    .map(d => d.name)
    .find(pred);
}

// reports: must match H2DEV copy
for (const name of reportNames) {
  const src = path.join(ROOT, name);
  const dest = path.join(H2, 'docs', 'NOI-BO', 'bao-cao', name);
  if (!exists(src)) { note(`OK already gone: ${name}`); continue; }
  if (!exists(dest)) {
    fs.copyFileSync(src, dest);
    note(`COPY missing report into H2DEV: ${name}`);
  }
  const hs = hashFile(src);
  const hd = hashFile(dest);
  if (hs !== hd) {
    const newer = fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs ? src : dest;
    if (newer === src) fs.copyFileSync(src, dest);
    note(`HASH DIFF ${name} — kept newer, then archive`);
  }
  move(src, path.join(ARCHIVE, 'bao-cao', name));
  note(`ARCHIVE ${name}`);
}

const promptSlugs = [
  { slug: 'north-effect.md', test: n => /north effect/i.test(n) },
  { slug: 'key-nhat.md', test: n => /prompt key/i.test(n) && /nhật|nhat/i.test(n) && !/north/i.test(n) },
  { slug: 'nha-may-san-xuat.md', test: n => /nhà máy|nha may|quy trình|quy trinh/i.test(n) && /sản xuất|san xuat|prompt key/i.test(n) },
  { slug: 'phat-phap-han.md', test: n => /phật pháp|phat phap/i.test(n) },
  { slug: 'triet-ly.md', test: n => /triết lý|triet ly/i.test(n) },
  { slug: 'quy-luat-kinh-te.md', test: n => /quy luật kinh tế|quy luat kinh te/i.test(n) },
  { slug: 'tien-su-veo3.md', test: n => /tiền sử|tien su|veo 3/i.test(n) },
  { slug: 'thumb-seo-hashtag.md', test: n => /thumb/i.test(n) && /seo|hashtag/i.test(n) },
  { slug: 'kinh-te-han.md', test: n => /kinh tế|kinh te/i.test(n) && /hàn|han/i.test(n) && !/quy luật|quy luat/i.test(n) },
  { slug: 'sinh-hoc-combat.md', test: n => /sinh học|sinh hoc|chiến thuật|chien thuat/i.test(n) },
  { slug: 'dua-tre-han.md', test: n => /đứa trẻ|dua tre/i.test(n) },
];
for (const item of promptSlugs) {
  const name = findRootFile(item.test);
  if (!name) { note(`OK prompt already gone: ${item.slug}`); continue; }
  const src = path.join(ROOT, name);
  const dest = path.join(H2, 'docs', 'NOI-BO', 'prompt', item.slug);
  if (!exists(dest)) fs.copyFileSync(src, dest);
  move(src, path.join(ARCHIVE, 'prompt', name));
  note(`ARCHIVE prompt ${name}`);
}

const excelMap = [
  { slug: 'list-kenh-douyin.xlsx', test: n => /list/i.test(n) && /douyin/i.test(n) },
  { slug: 'nguon-video-reup-douyin-bilibili.xlsx', test: n => /nguồn video|nguon video/i.test(n) && /reup/i.test(n) },
];
for (const item of excelMap) {
  const name = findRootFile(item.test);
  if (!name) { note(`OK excel already gone: ${item.slug}`); continue; }
  const src = path.join(ROOT, name);
  const dest = path.join(H2, 'docs', 'NOI-BO', 'nguon', item.slug);
  if (!exists(dest)) fs.copyFileSync(src, dest);
  move(src, path.join(ARCHIVE, 'nguon', name));
  note(`ARCHIVE excel ${name}`);
}

// bak + tmp + leftover scripts
for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!ent.isFile()) continue;
  const n = ent.name;
  const src = path.join(ROOT, n);
  if (n.endsWith('.bak') || n.includes('.bak-') || n.endsWith('.bak-verify-20260818')) {
    move(src, path.join(ARCHIVE, 'bak', n));
    note(`ARCHIVE bak ${n}`);
    continue;
  }
  if (n.startsWith('_tmp_')) {
    move(src, path.join(ARCHIVE, 'tmp', n));
    note(`ARCHIVE tmp ${n}`);
    continue;
  }
  if (['export_chat.py', 'fix-layout.py', 'serve_h2dev.js', 'requirements.txt', '.mcp.json'].includes(n)) {
    move(src, path.join(ARCHIVE, 'legacy', n));
    note(`ARCHIVE legacy ${n}`);
    continue;
  }
  if (/mcp-keys/i.test(n)) {
    move(src, path.join(SECRETS, n));
    note(`SECRETS ${n}`);
  }
}

// leftover root *.md except we will write README after
for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!ent.isFile()) continue;
  if (!/\.(md|xlsx|py|js|txt|json)$/i.test(ent.name)) continue;
  if (ent.name === 'README.md') continue;
  const src = path.join(ROOT, ent.name);
  move(src, path.join(ARCHIVE, 'leftover', ent.name));
  note(`ARCHIVE leftover ${ent.name}`);
}

// folders already synced into pipelines / chat
const folderMoves = [
  { src: 'chat-exports', dest: path.join(ARCHIVE, 'chat-exports') },
  { src: 'hoat-hinh-ai', dest: path.join(ARCHIVE, 'pipelines-original', 'hoat-hinh-ai') },
  { src: 'skill-tao-video-Youtube-ton-giao', dest: path.join(ARCHIVE, 'pipelines-original', 'ton-giao') },
  { src: 'wildlife-survival-H2dev-20260726T192553Z-1-001', dest: path.join(ARCHIVE, 'pipelines-original', 'wildlife') },
  { src: 'skill prompt - Bible Explainer-20260726T192647Z-1-001', dest: path.join(ARCHIVE, 'pipelines-original', 'bible-explainer') },
];
for (const job of folderMoves) {
  const src = path.join(ROOT, job.src);
  if (!exists(src)) { note(`OK folder already gone: ${job.src}`); continue; }
  if (exists(job.dest)) {
    note(`WARN archive dest exists, skip move ${job.src}`);
    continue;
  }
  ensureDir(path.dirname(job.dest));
  fs.renameSync(src, job.dest);
  note(`ARCHIVE DIR ${job.src}`);
}

// --- 5) Update tai-lieu: DOI-CHIEU + knowledge-hub path ---
const tlPath = path.join(H2, 'data-tabs', 'tai-lieu-full.json');
const docs = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
const names = new Set(docs.map(d => d.name));
if (!names.has('Đối chiếu ngách + market kho H2DEV 17/08')) {
  docs.push({
    sku: 'NOI-BO',
    name: 'Đối chiếu ngách + market kho H2DEV 17/08',
    link: '',
    file: 'docs/NOI-BO/bao-cao/DOI-CHIEU-NGACH-MARKET-H2DEV-2026-08-17.md',
    kind: 'report',
    contentNiche: 'Kiếm tiền / Chính sách',
    source: 'noi-bo',
  });
  note('ADD tai-lieu DOI-CHIEU');
}
const khRow = docs.find(d => /Knowledge Hub/i.test(d.name || ''));
if (khRow) {
  khRow.file = 'knowledge-hub/README.md';
  khRow.name = 'Knowledge Hub — archive NotebookLM (nằm trong H2DEV)';
  note('UPDATE knowledge-hub tai-lieu path');
}
fs.writeFileSync(tlPath, JSON.stringify(docs, null, 2) + '\n', 'utf8');

// pointer
const khNote = [
  '# Knowledge Hub',
  '',
  'Kho sống **đã chuyển vào H2DEV**: `knowledge-hub/`.',
  '',
  '- README: `knowledge-hub/README.md`',
  '- Index: `knowledge-hub/notebooks-index.md`',
  '- Thả batch mới vào `knowledge-hub/batches/`',
  '',
  'Không giữ bản thứ hai ở gốc Y:\\YTB.',
  '',
].join('\n');
fs.writeFileSync(path.join(H2, 'docs', 'NOI-BO', 'knowledge-hub-POINTER.md'), khNote, 'utf8');

  const clPath = path.join(H2, 'data-tabs', 'chien-luoc.json');
  const cl = JSON.parse(fs.readFileSync(clPath, 'utf8'));
  // [2026-08-19] va idempotent: chi nang updated, khong ha (tranh hoi quy du lieu khi chay lai)
  if (!cl.updated || String(cl.updated) < '2026-08-18') cl.updated = '2026-08-18';
if (Array.isArray(cl.taiSanNoiBo)) {
  const kh = cl.taiSanNoiBo.find(t => /Knowledge/i.test(t.loai || ''));
  if (kh) kh.path = 'knowledge-hub/';
}
fs.writeFileSync(clPath, JSON.stringify(cl, null, 2) + '\n', 'utf8');

fs.writeFileSync(path.join(ARCHIVE, 'CLEAN-LOG.txt'), log.join('\n') + '\n', 'utf8');
note('DONE clean-root-to-tree');
if (errors.length) {
  console.error('WARNINGS:', errors);
  process.exitCode = 0;
}
