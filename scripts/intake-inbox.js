/**
 * Nhận file mới từ inbox/ → đúng chỗ NOI-BO + (tuỳ chọn) card tai-lieu.
 * Không ghi đè file đã có. Không đụng catalog.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const H2 = path.resolve(__dirname, '..');
const INBOX = path.join(H2, 'inbox');
const TL = path.join(H2, 'data-tabs', 'tai-lieu-full.json');

function slug(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function classify(name) {
  const n = name.toLowerCase();
  if (/\.(xlsx|csv)$/.test(n) || /douyin|bilibili|list kênh|list kenh/.test(n)) {
    return { dir: 'docs/NOI-BO/nguon', kind: 'list', niche: 'Reup / Hoạt hình' };
  }
  if (/bao-cao|báo cáo|nhan-dinh|nhận định|verify|quet|quét|cross-check|danh-gia|đánh giá|doi-chieu|đối chiếu/.test(n)) {
    return { dir: 'docs/NOI-BO/bao-cao', kind: 'report', niche: 'Kiếm tiền / Chính sách' };
  }
  if (/prompt|skill|wedge/.test(n)) {
    return { dir: 'docs/NOI-BO/prompt', kind: 'prompt', niche: 'Prompt / AI' };
  }
  return { dir: null, kind: 'other', niche: 'Khác' };
}

function digest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function stem(name) {
  return name.replace(/\.[^.]+$/, '').trim();
}

const docs = JSON.parse(fs.readFileSync(TL, 'utf8'));
const names = new Set(docs.map(d => String(d.name || '').trim().toLowerCase()));
const files = fs.readdirSync(INBOX, { withFileTypes: true }).filter(d => d.isFile() && d.name !== 'README.md');

if (!files.length) {
  console.log('inbox trống — không có file mới.');
  process.exit(0);
}

let added = 0;
let conflicts = 0;
const backupDir = path.join(H2, '_backup', `intake-${new Date().toISOString().replace(/[:.]/g, '-')}`);
fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(TL, path.join(backupDir, 'tai-lieu-full.json'));
for (const ent of files) {
  const cls = classify(ent.name);
  if (!cls.dir) {
    console.log('CẦN DUYỆT TAY (chưa phân loại):', ent.name);
    continue;
  }
  const destRel = `${cls.dir}/${slug(ent.name)}`;
  const dest = path.join(H2, destRel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest)) {
    if (digest(dest) !== digest(path.join(INBOX, ent.name))) {
      console.log('XUNG ĐỘT nội dung, giữ file trong inbox để duyệt:', ent.name, '→', destRel);
      conflicts += 1;
      continue;
    }
    console.log('MATCH cùng nội dung, không ghi đè:', destRel);
  } else {
    fs.copyFileSync(path.join(INBOX, ent.name), dest);
    console.log('GÔM →', destRel);
  }
  const normalizedName = stem(ent.name).toLowerCase();
  const existingCard = docs.find(d => String(d.name || '').trim().toLowerCase() === normalizedName || d.file === destRel.replace(/\\/g, '/'));
  if (!existingCard && !names.has(normalizedName)) {
    docs.push({
      sku: 'NOI-BO',
      name: ent.name.replace(/\.[^.]+$/, ''),
      link: '',
      file: destRel.replace(/\\/g, '/'),
      kind: cls.kind,
      contentNiche: cls.niche,
      source: 'noi-bo',
    });
    names.add(normalizedName);
    added += 1;
  }
  const doneDir = path.join(INBOX, '_done');
  fs.mkdirSync(doneDir, { recursive: true });
  let donePath = path.join(doneDir, ent.name);
  if (fs.existsSync(donePath)) donePath = path.join(doneDir, `${Date.now()}-${ent.name}`);
  fs.renameSync(path.join(INBOX, ent.name), donePath);
}

if (added) fs.writeFileSync(TL, JSON.stringify(docs, null, 2) + '\n', 'utf8');
if (conflicts) {
  console.log(`Dừng an toàn: ${conflicts} xung đột chưa chuyển; card mới ${added}. Backup: ${backupDir}`);
  process.exitCode = 1;
} else {
  console.log(`Xong. Card mới: ${added}. Backup: ${backupDir}. Chạy: node scripts/validate-project.js`);
}
