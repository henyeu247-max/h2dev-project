/**
 * Đồng bộ tài sản ngoài Y:\YTB vào H2DEV-Project.
 * Nguyên tắc: COPY, không xóa gốc. Không copy .env / key / .bak / _tmp.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const H2 = path.resolve(__dirname, '..');
const STAMP = '20260818-dongbo';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return dest;
}

function shouldSkip(name) {
  const n = name.toLowerCase();
  return (
    n === '.env' ||
    n === '.env.example' && false ||
    n.endsWith('.bak') ||
    n.endsWith('.pyc') ||
    n === '__pycache__' ||
    n === 'node_modules' ||
    n === '.git' ||
    n.startsWith('_tmp') ||
    n === 'mcp-keys-du-phong.md'
  );
}

function copyTree(src, dest, stats) {
  if (!fs.existsSync(src)) return;
  const st = fs.statSync(src);
  if (st.isFile()) {
    if (shouldSkip(path.basename(src))) return;
    copyFile(src, dest);
    stats.files += 1;
    stats.bytes += st.size;
    return;
  }
  if (shouldSkip(path.basename(src))) return;
  ensureDir(dest);
  for (const name of fs.readdirSync(src)) {
    if (shouldSkip(name)) continue;
    copyTree(path.join(src, name), path.join(dest, name), stats);
  }
}

function findRootFile(predicate) {
  const files = fs.readdirSync(ROOT, { withFileTypes: true }).filter(d => d.isFile());
  const hit = files.find(d => predicate(d.name));
  return hit ? path.join(ROOT, hit.name) : null;
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(H2, rel), 'utf8'));
}

function writeJson(rel, data) {
  fs.writeFileSync(path.join(H2, rel), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

const log = [];
function note(msg) {
  log.push(msg);
  console.log(msg);
}

// --- 1. Backup JSON đang sống ---
const bakDir = path.join(H2, `_backup-${STAMP}`, 'data-tabs');
ensureDir(bakDir);
for (const f of ['tai-lieu-full.json', 'nguon-reup.json', 'chien-luoc.json', 'ngach-xanh.json', 'kenh-mau.json', 'videos.json', 'kich-ban.json']) {
  const src = path.join(H2, 'data-tabs', f);
  if (fs.existsSync(src)) copyFile(src, path.join(bakDir, f));
}
note(`Backup JSON → _backup-${STAMP}/data-tabs/`);

// --- 2. Thư mục đích ---
const dest = {
  baoCao: path.join(H2, 'docs', 'NOI-BO', 'bao-cao'),
  prompt: path.join(H2, 'docs', 'NOI-BO', 'prompt'),
  nguon: path.join(H2, 'docs', 'NOI-BO', 'nguon'),
  chat: path.join(H2, 'docs', 'NOI-BO', 'chat'),
  pipe: path.join(H2, 'pipelines'),
};
Object.values(dest).forEach(ensureDir);

// --- 3. Copy báo cáo (unique) ---
const reports = [
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
const copiedReports = [];
for (const name of reports) {
  const src = path.join(ROOT, name);
  if (!fs.existsSync(src)) {
    note(`SKIP report missing: ${name}`);
    continue;
  }
  copyFile(src, path.join(dest.baoCao, name));
  copiedReports.push(name);
}
note(`Copied reports: ${copiedReports.length}`);

// --- 4. Copy prompt MD gốc (match bằng tên đọc được) ---
const promptMap = [
  { slug: 'north-effect.md', test: n => /north effect/i.test(n), unique: true, matchName: null },
  { slug: 'key-nhat.md', test: n => /prompt key/i.test(n) && /nhật|nhat/i.test(n) && !/north/i.test(n), unique: false, matchName: 'Prompt Key Nhật' },
  { slug: 'nha-may-san-xuat.md', test: n => /nhà máy|nha may|quy trình|quy trinh/i.test(n) && /sản xuất|san xuat|prompt key/i.test(n), unique: false, matchName: 'PROMPT KEY QUY TRÌNH/ NHÀ MÁY SẢN XUẤT' },
  { slug: 'phat-phap-han.md', test: n => /phật pháp|phat phap/i.test(n), unique: false, matchName: 'Prompt + tài nguyên ngách nhỏ phật pháp (thị trường Hàn)' },
  { slug: 'triet-ly.md', test: n => /triết lý|triet ly/i.test(n), unique: false, matchName: 'PROMPT NGÁCH NHỎ TRIẾT LÝ (H2Dev)' },
  { slug: 'quy-luat-kinh-te.md', test: n => /quy luật kinh tế|quy luat kinh te/i.test(n), unique: false, matchName: 'PROMPT NGÁCH QUY LUẬT KINH TẾ' },
  { slug: 'tien-su-veo3.md', test: n => /tiền sử|tien su|veo 3/i.test(n), unique: false, matchName: 'PROMPT TRAIN NGÁCH TIỀN SỬ' },
  { slug: 'thumb-seo-hashtag.md', test: n => /thumb/i.test(n) && /seo|hashtag/i.test(n), unique: false, matchName: 'PROMPT THUMB + TỪ KHÓA SEO / HASHTAGS KEY SENIOR' },
  { slug: 'kinh-te-han.md', test: n => /kinh tế|kinh te/i.test(n) && /hàn|han/i.test(n) && !/quy luật|quy luat/i.test(n), unique: false, matchName: 'PROMPT: NGÁCH KINH TẾ - THỊ TRƯỜNG HÀN' },
  { slug: 'sinh-hoc-combat.md', test: n => /sinh học|sinh hoc|chiến thuật|chien thuat/i.test(n), unique: false, matchName: 'PROMPT: NGÁCH Kiểm soát sinh học - chiến thuật - tâm lý (UPDATE 26/02/2026) - H2DEV' },
  { slug: 'dua-tre-han.md', test: n => /đứa trẻ|dua tre/i.test(n), unique: false, matchName: 'PROMPT NGÁCH ĐỨA TRẺ (UPDATE 24/01/2026) - H2DEV' },
];
const promptHits = [];
for (const item of promptMap) {
  const src = findRootFile(item.test);
  if (!src) {
    note(`SKIP prompt not found: ${item.slug}`);
    continue;
  }
  const destRel = `docs/NOI-BO/prompt/${item.slug}`;
  copyFile(src, path.join(H2, destRel));
  promptHits.push({ ...item, src: path.basename(src), destRel });
  note(`Prompt ${item.unique ? 'UNIQUE' : 'MATCH'} ${path.basename(src)} → ${destRel}`);
}

const excelHits = [];
const excelMap = [
  { slug: 'list-kenh-douyin.xlsx', test: n => /list/i.test(n) && /douyin/i.test(n), matchName: 'LIST KÊNH DOUYIN NGUỒN TÀI NGUYÊN REUP' },
  { slug: 'nguon-video-reup-douyin-bilibili.xlsx', test: n => /nguồn video|nguon video/i.test(n) && /reup/i.test(n), matchName: 'NGUỒN VIDEO REUP DOUYIN + BILIBILI' },
];
for (const item of excelMap) {
  const src = findRootFile(item.test);
  if (!src) {
    note(`SKIP excel not found: ${item.slug}`);
    continue;
  }
  const destRel = `docs/NOI-BO/nguon/${item.slug}`;
  copyFile(src, path.join(H2, destRel));
  excelHits.push({ ...item, src: path.basename(src), destRel });
  note(`Excel MATCH ${path.basename(src)} → ${destRel}`);
}

// --- 5. Copy chat-exports ---
const chatSrc = path.join(ROOT, 'chat-exports');
const chatStats = { files: 0, bytes: 0 };
if (fs.existsSync(chatSrc)) copyTree(chatSrc, dest.chat, chatStats);
note(`Chat-exports copied: ${chatStats.files} files`);

// --- 6. Copy pipelines (không .env) ---
const pipeJobs = [
  { id: 'hoat-hinh-ai', src: path.join(ROOT, 'hoat-hinh-ai'), dest: path.join(dest.pipe, 'hoat-hinh-ai') },
  { id: 'ton-giao', src: path.join(ROOT, 'skill-tao-video-Youtube-ton-giao'), dest: path.join(dest.pipe, 'ton-giao') },
  { id: 'wildlife', src: path.join(ROOT, 'wildlife-survival-H2dev-20260726T192553Z-1-001'), dest: path.join(dest.pipe, 'wildlife') },
  { id: 'bible-explainer', src: path.join(ROOT, 'skill prompt - Bible Explainer-20260726T192647Z-1-001'), dest: path.join(dest.pipe, 'bible-explainer') },
];
const pipeStats = {};
for (const job of pipeJobs) {
  const s = { files: 0, bytes: 0 };
  copyTree(job.src, job.dest, s);
  pipeStats[job.id] = s;
  note(`Pipeline ${job.id}: ${s.files} files, ${(s.bytes / 1024 / 1024).toFixed(2)} MB`);
}

// Pointer knowledge-hub (không copy kho sống)
const khNote = [
  '# Knowledge Hub — pointer',
  '',
  'Kho sống nằm ngoài H2DEV (archive transcript / batch NotebookLM). Không copy vào web để tránh lệch 2 nơi.',
  '',
  '- Path gốc: `Y:\\\\YTB\\\\knowledge-hub\\\\`',
  '- README: `Y:\\\\YTB\\\\knowledge-hub\\\\README.md`',
  '- Index notebook: `Y:\\\\YTB\\\\knowledge-hub\\\\notebooks-index.md`',
  '- Hiện có: 1 batch smoke (`batches/smoke-google-dev`) + 1 kênh `UC_x5XG1OV2P6uZZ5FSM9Ttw`',
  '',
  'Muốn archive kênh Bible / History thì chạy script trong knowledge-hub, rồi ghi lại vào `notebooks-index.md`.',
  '',
].join('\n');
fs.writeFileSync(path.join(H2, 'docs', 'NOI-BO', 'knowledge-hub-POINTER.md'), khNote, 'utf8');

// --- 7. Cập nhật tai-lieu-full.json ---
const docs = readJson('data-tabs/tai-lieu-full.json');
const byName = new Map(docs.map(d => [d.name, d]));

function attachLocal(name, destRel) {
  const row = byName.get(name);
  if (!row) {
    note(`WARN no tai-lieu row for match: ${name}`);
    return false;
  }
  row.fileLocal = destRel.replace(/\\/g, '/');
  return true;
}

for (const p of promptHits) {
  if (!p.unique && p.matchName) attachLocal(p.matchName, p.destRel);
}
for (const e of excelHits) attachLocal(e.matchName, e.destRel);

const wildlifeRow = byName.get('file Skill ngách động vật');
if (wildlifeRow) {
  wildlifeRow.fileLocal = 'pipelines/wildlife/wildlife-survival-H2dev/script-wildlife-survival/SKILL.md';
  wildlifeRow.file = wildlifeRow.file || 'pipelines/wildlife/wildlife-survival-H2dev/script-wildlife-survival/SKILL.md';
}

const north = promptHits.find(p => p.unique);
const newRows = [];

if (north) {
  newRows.push({
    sku: 'VIDEO-2aa1f7',
    name: 'PROMPT KEY The North Effect (địa chính trị EN) — bản MD gốc',
    link: '',
    file: north.destRel.replace(/\\/g, '/'),
    kind: 'prompt',
    contentNiche: 'Lịch sử / Quân sự',
    source: 'noi-bo',
  });
}

const reportMeta = {
  'BAO-CAO-NGACH-NHAT-HAN.md': ['Báo cáo ngách Nhật–Hàn (senior storytelling)', 'Drama / Stories'],
  'CROSS-CHECK-BIBLE-NEXLEV-2026-07-27.md': ['Cross-check Bible Explainer vs NexLev', 'Triết lý / Tâm linh'],
  'DANH-GIA-HOAT-HINH-AI-KE-CHUYEN-2026-07-30.md': ['Đánh giá pipeline hoạt hình AI kể chuyện', 'Reup / Hoạt hình'],
  'DANH-GIA-TAI-SAN-DU-AN-2026-07-27.md': ['Đánh giá toàn bộ tài sản dự án YTB', 'Prompt / AI'],
  'DOI-THU-VERIFIED-2026-07-27.md': ['Đối thủ đã verify (scrape + RSS)', 'Key / Đối thủ'],
  'NGACH-XANH-LO-TRINH-2026-07-27.md': ['Lộ trình ngách xanh', 'Kiếm tiền / Chính sách'],
  'NHAN-DINH-CHOT-NGACH-ON-DINH-US-NHAT-HAN-2026-07-27.md': ['Chốt ngách ổn định US / Nhật / Hàn', 'Triết lý / Tâm linh'],
  'NHAN-DINH-NGACH-MAI-XANH-2026-07-27.md': ['Nhận định ngách mãi xanh', 'Triết lý / Tâm linh'],
  'PHAN-TICH-MCP-DAY-DU-2026-07-27.md': ['Phân tích MCP dùng cho YTB', 'Nền tảng / Tool'],
  'QUET-FACELESS-2026-07-30.md': ['Quét faceless niches NexLev 30/07', 'Share key / Ngách nhỏ'],
  'QUET-MU-TOAN-THI-TRUONG-FACELESS-2026-07-27.md': ['Quét mũ toàn thị trường faceless', 'Share key / Ngách nhỏ'],
  'VERIFY-NGACH-MAI-XANH-LAN-2-2026-07-27.md': ['Verify ngách mãi xanh lần 2', 'Triết lý / Tâm linh'],
};

for (const name of copiedReports) {
  const [title, niche] = reportMeta[name] || [name, 'Khác'];
  newRows.push({
    sku: 'NOI-BO',
    name: title,
    link: '',
    file: `docs/NOI-BO/bao-cao/${name}`,
    kind: 'report',
    contentNiche: niche,
    source: 'noi-bo',
  });
}

newRows.push(
  {
    sku: 'NOI-BO',
    name: 'Pipeline hoạt hình AI (5 bước · kie.ai + Grok Imagine)',
    link: '',
    file: 'pipelines/hoat-hinh-ai/README.md',
    kind: 'tool',
    contentNiche: 'Reup / Hoạt hình',
    source: 'noi-bo',
  },
  {
    sku: 'NOI-BO',
    name: 'Pipeline video tôn giáo EN (script + ElevenLabs + merge)',
    link: '',
    file: 'pipelines/ton-giao/skill-tao-video-Youtube-ton-giao/SKILL.md',
    kind: 'tool',
    contentNiche: 'Triết lý / Tâm linh',
    source: 'noi-bo',
  },
  {
    sku: 'NOI-BO',
    name: 'Skill Wildlife Survival + motion prompt Veo',
    link: '',
    file: 'pipelines/wildlife/wildlife-survival-H2dev/script-wildlife-survival/SKILL.md',
    kind: 'tool',
    contentNiche: 'Reup / Hoạt hình',
    source: 'noi-bo',
  },
  {
    sku: 'NOI-BO',
    name: 'Bible Explainer V2.1 (script + image + thumb + 24 ảnh mẫu)',
    link: '',
    file: 'pipelines/bible-explainer/skill prompt - Bible Explainer',
    kind: 'tool',
    contentNiche: 'Triết lý / Tâm linh',
    source: 'noi-bo',
  },
  {
    sku: 'NOI-BO',
    name: 'Knowledge Hub — pointer kho archive NotebookLM',
    link: '',
    file: 'docs/NOI-BO/knowledge-hub-POINTER.md',
    kind: 'other',
    contentNiche: 'Nền tảng / Tool',
    source: 'noi-bo',
  },
  {
    sku: 'NOI-BO',
    name: 'Lịch sử chat dự án YTB (phiên 1–4 + 30/07)',
    link: '',
    file: 'docs/NOI-BO/chat/README.md',
    kind: 'report',
    contentNiche: 'Nhân bản / Kênh',
    source: 'noi-bo',
  },
);

// Tránh nhân đôi nếu chạy lại script
const existingKeys = new Set(docs.map(d => `${d.name}::${d.file || ''}`));
for (const row of newRows) {
  const key = `${row.name}::${row.file || ''}`;
  if (existingKeys.has(key)) continue;
  docs.push(row);
  existingKeys.add(key);
}

writeJson('data-tabs/tai-lieu-full.json', docs);
note(`tai-lieu-full.json now ${docs.length} records`);

// --- 8. nguon-reup: gắn file xlsx local, không thêm bản trùng ---
const nguon = readJson('data-tabs/nguon-reup.json');
for (const e of excelHits) {
  const row = nguon.find(x => (x.name || '').toLowerCase() === e.matchName.toLowerCase());
  if (row) {
    row.file = e.destRel.replace(/\\/g, '/');
    note(`nguon-reup fileLocal ${e.matchName}`);
  }
}
writeJson('data-tabs/nguon-reup.json', nguon);

// --- 9. chien-luoc: trỏ pack về pipelines trong H2DEV ---
const cl = readJson('data-tabs/chien-luoc.json');
cl.updated = '2026-08-18';
cl.nguonDuLieu = `${cl.nguonDuLieu || ''} Đồng bộ tài sản ngoài vào docs/NOI-BO + pipelines/ (18/08/2026).`.trim();
if (Array.isArray(cl.huongDiNoiDung)) {
  for (const h of cl.huongDiNoiDung) {
    if (/wildlife/i.test(h.pack || '')) {
      h.localPath = 'pipelines/wildlife/';
      h.lyDo = 'Skill 6-beat + Veo motion đã kéo vào H2DEV. Kênh mẫu Wild Bird Survival — kênh mới, view triệu, RPM Mỹ cao. Tự viết 100% chuyện.';
    } else if (/bible/i.test(h.pack || '')) {
      h.localPath = 'pipelines/bible-explainer/';
      h.lyDo = 'RPM Mỹ, khán giả trung thành. Skill V2.1 + 24 ảnh mẫu nằm trong pipelines/bible-explainer. Copy công thức, không copy script.';
    } else if (/đứa trẻ|dua tre/i.test(h.pack || '')) {
      h.localPath = 'docs/NOI-BO/prompt/dua-tre-han.md';
      h.lyDo = 'Công thức 구름야담 nhân bản được. Prompt MD gốc đã match vào tab Kịch bản. Tự sáng tác 100% cốt, không giữ 70% đối thủ.';
    }
  }
}
if (!Array.isArray(cl.taiSanNoiBo)) {
  cl.taiSanNoiBo = [
    { loai: 'Báo cáo nghiên cứu', path: 'docs/NOI-BO/bao-cao/', so: copiedReports.length, tab: 'kichban', kind: 'report' },
    { loai: 'Prompt MD gốc (đã match)', path: 'docs/NOI-BO/prompt/', so: promptHits.length, tab: 'kichban', kind: 'prompt' },
    { loai: 'Pipeline sản xuất', path: 'pipelines/', so: pipeJobs.length, tab: 'kichban', kind: 'tool' },
    { loai: 'Nguồn Excel Douyin/Bilibili', path: 'docs/NOI-BO/nguon/', so: excelHits.length, tab: 'nguonreup' },
    { loai: 'Knowledge Hub (pointer)', path: 'docs/NOI-BO/knowledge-hub-POINTER.md', so: 1, tab: 'kichban' },
  ];
}
writeJson('data-tabs/chien-luoc.json', cl);

// --- 10. Bảng đồng bộ ---
const inventory = {
  updated: '2026-08-18',
  note: 'H2DEV-Project là nguồn sự thật vận hành. File gốc ngoài Y:\\YTB vẫn giữ. Không copy mcp-keys / .env / _tmp / .bak.',
  khongGom: [
    { item: 'mcp-keys-du-phong.md', lyDo: 'bí mật — không đưa vào web' },
    { item: '_tmp_*', lyDo: 'script/json tạm phiên 30/07' },
    { item: '*.bak-verify-20260818', lyDo: 'bản backup trước verify' },
    { item: 'knowledge-hub/ (nội dung)', lyDo: 'kho sống — chỉ pointer' },
    { item: '.env trong pipeline', lyDo: 'API key — không copy' },
  ],
  matched: promptHits.filter(p => !p.unique).map(p => ({
    goc: p.src,
    trongH2dev: p.matchName,
    fileLocal: p.destRel,
    hanhDong: 'MATCH — gắn fileLocal, không tạo card trùng',
  })).concat(excelHits.map(e => ({
    goc: e.src,
    trongH2dev: e.matchName,
    fileLocal: e.destRel,
    hanhDong: 'MATCH — gắn fileLocal lên card Excel đã có',
  }))).concat([
    { goc: 'file Skill ngách động vật (Drive)', trongH2dev: 'VIDEO-e91589', fileLocal: 'pipelines/wildlife/.../SKILL.md', hanhDong: 'MATCH + bổ sung file local' },
  ]),
  merged: newRows.map(r => ({
    name: r.name,
    file: r.file,
    kind: r.kind,
    contentNiche: r.contentNiche,
    hanhDong: 'GÔM — card mới tab Kịch bản & Tài liệu',
  })),
  pipelines: pipeJobs.map(j => ({
    id: j.id,
    dest: path.relative(H2, j.dest).replace(/\\/g, '/'),
    files: pipeStats[j.id].files,
    mb: +(pipeStats[j.id].bytes / 1024 / 1024).toFixed(2),
  })),
  taiLieuTruoc: 57,
  taiLieuSau: docs.length,
};

writeJson('data-tabs/dong-bo-ngoai.json', inventory);

const readme = `# NOI-BO — tài sản ngoài đã đồng bộ vào H2DEV

Cập nhật: **2026-08-18**

H2DEV-Project là **não vận hành**. Thư mục này + \`pipelines/\` là chỗ gôm tài sản từng nằm rải ở \`Y:\\YTB\`.

## Quy tắc

- **MATCH** nếu H2DEV đã có (prompt Drive extract, list Douyin…) → chỉ gắn \`fileLocal\` bản MD/XLSX đọc được.
- **GÔM** nếu chưa có (báo cáo, pipeline, North Effect, chat, pointer Knowledge Hub) → copy vào đây / \`pipelines/\` và thêm card tab **Kịch bản & Tài liệu**.
- **Không gôm:** \`mcp-keys-du-phong.md\`, \`.env\`, \`_tmp_*\`, \`.bak\`.
- File gốc ngoài **không xóa**.

## Map nhanh

| Ngoài (Y:\\YTB) | Trong H2DEV | Tab |
|---|---|---|
| 11 prompt MD H2Dev | \`docs/NOI-BO/prompt/\` + card cũ | Kịch bản |
| The North Effect | \`prompt/north-effect.md\` (card mới) | Kịch bản |
| 12 báo cáo ngách | \`docs/NOI-BO/bao-cao/\` | Kịch bản (chip Báo cáo) |
| 2 Excel Douyin/Bilibili | \`docs/NOI-BO/nguon/\` | Kịch bản + Nguồn reup |
| hoat-hinh-ai | \`pipelines/hoat-hinh-ai/\` | Kịch bản / Tool |
| skill tôn giáo | \`pipelines/ton-giao/\` | Kịch bản / Tool |
| wildlife-survival | \`pipelines/wildlife/\` | Kịch bản / Tool |
| Bible Explainer | \`pipelines/bible-explainer/\` | Kịch bản / Tool |
| knowledge-hub | \`knowledge-hub-POINTER.md\` | Kịch bản |
| chat-exports | \`docs/NOI-BO/chat/\` | Kịch bản |

Bảng chi tiết máy đọc: \`data-tabs/dong-bo-ngoai.json\`.
`;
fs.writeFileSync(path.join(H2, 'docs', 'NOI-BO', 'README.md'), readme, 'utf8');

fs.writeFileSync(path.join(H2, `_backup-${STAMP}`, 'SYNC-LOG.txt'), log.join('\n') + '\n', 'utf8');
note('DONE');
note(JSON.stringify({ taiLieu: docs.length, prompts: promptHits.length, reports: copiedReports.length, pipes: pipeStats }, null, 2));
