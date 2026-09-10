/**
 * Fix kind + contentNiche cho tai-lieu-full.json
 * - DRY-RUN: chỉ in ra, không ghi (chạy verify trước)
 * - --write: áp dụng thay đổi
 * 
 * Logic gán kind:
 * - "PROMPT" / "Prompt" / "câu lệnh train" / "prompt train" → prompt
 * - "List" / "LIST" / "danh sách" / "LINK KÊNH" / "list link" → list
 * - "Báo cáo" / "báo cáo" / "Đánh giá" / "Phân tích" / "Nhận định" / "Verify" / "Quét" / "Đối chiếu" / "Lịch sử chat" → report
 * - "TOOL" / "WEB TẠO" / "TẠO ẢNH" / "TOOL TẢI" / "TOOL QUAY" / "TOOL CẮT" / "Pipeline" / "hướng dẫn tool" → tool
 * - "forms" / "FORMS" / "Tài nguyên Drive" / "Knowledge Hub" / "【" → other
 * 
 * Logic gán contentNiche (chỉ khi thiếu):
 * Dựa vào tên ngách trong name:
 * - "triết lý" / "tâm linh" / "phật pháp" / "Alan Watts" / "Bible" / "giáo dục" → Triết lý / Tâm linh
 * - "đứa trẻ" / "drama" / "stories" / "storytelling" / "야담" → Drama / Stories
 * - "kinh tế" / "tài chính" / "quy luật kinh tế" → Kinh tế / Tài chính
 * - "kiếm tiền" / "chính sách" / "ngách xanh" / "YPP" → Kiếm tiền / Chính sách
 * - "lịch sử" / "quân sự" / "World War" / "địa chính trị" → Lịch sử / Quân sự
 * - "nhân bản" / "kênh" → Nhân bản / Kênh
 * - "nền tảng" / "tool" / "MCP" / "tool dịch" / "tải" / "WEB" / "Knowledge Hub" → Nền tảng / Tool
 * - "reup" / "hoạt hình" / "Douyin" / "Bilibili" → Reup / Hoạt hình
 * - "share key" / "ngách nhỏ" / "kiểm soát sinh học" / "nhà máy" / "quy trình" / "cam cảnh sát" / "tiền sử" / "động vật" → Share key / Ngách nhỏ
 * - "sức khỏe" / "lão hóa" / "senior health" → Sức khỏe / Lão hóa
 * - Mặc định → Nền tảng / Tool
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const docsPath = path.join(ROOT, 'data-tabs', 'tai-lieu-full.json');
const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));

const isWrite = process.argv.includes('--write');
let kindFixed = 0, cnFixed = 0;

function guessKind(name) {
  const n = name.toLowerCase();
  if (/\bprompt\b|câu lệnh train|prompt train|prompt key|prompt ngách|prompt demo|prompt thumb|prompt em/i.test(name)) return 'prompt';
  if (/^list\b|^list |list \(|danh sách|link kênh|list link|list kênh|nguồn reup|nguồn video reup|nguồn kênh|link tài nguyên/i.test(name)) return 'list';
  if (/báo cáo|đánh giá|phân tích|nhận định|verify|quét|đối chiếu|lịch sử chat|cross-check|chốt ngách|lộ trình/i.test(name)) return 'report';
  if (/^tool\b|tool |web tạo|tạo ảnh|tạo video|tool tải|tool quay|tool cắt|pipeline|hướng dẫn tool|tool và tài khoản|skill ngách|file skill/i.test(name)) return 'tool';
  if (/forms|form |tài nguyên drive|knowledge hub|【|tài nguyên em train|skill prompt|tài nguyên$/i.test(name)) return 'other';
  // Fallback: Google Sheets → list, Google Docs → prompt, drive.google → other
  if (/docs\.google\.com\/spreadsheets/i.test(name)) return 'list';
  if (/docs\.google\.com\/document/i.test(name)) return 'prompt';
  if (/drive\.google\.com/i.test(name)) return 'other';
  return null;
}

function guessContentNiche(name) {
  const n = name.toLowerCase();
  if (/triết lý|tâm linh|phật pháp|alan watts|bible|giáo dục|đạo|phật|thiền|stoic/i.test(name)) return 'Triết lý / Tâm linh';
  if (/đứa trẻ|drama|stories|storytelling|야담|sleep audiobook|kaidan/i.test(name)) return 'Drama / Stories';
  if (/kinh tế|tài chính|quy luật kinh tế|economy/i.test(name)) return 'Kinh tế / Tài chính';
  if (/kiếm tiền|chính sách|ngách xanh|ypp|đối thủ đã verify|lộ trình/i.test(name)) return 'Kiếm tiền / Chính sách';
  if (/lịch sử|quân sự|world war|địa chính trị|north effect/i.test(name)) return 'Lịch sử / Quân sự';
  if (/nhân bản|kênh mẫu|channel clone/i.test(name)) return 'Nhân bản / Kênh';
  if (/reup|hoạt hình|douyin|bilibili|animation|hoạt hình ai/i.test(name)) return 'Reup / Hoạt hình';
  if (/share key|ngách nhỏ|kiểm soát sinh học|nhà máy|quy trình|cam cảnh sát|tiền sử|động vật|key |prompt key/i.test(name)) return 'Share key / Ngách nhỏ';
  if (/sức khỏe|lão hóa|senior health|lão/i.test(name)) return 'Sức khỏe / Lão hóa';
  if (/nền tảng|tool|mcp|tool dịch|tải |web tạo|knowledge hub|tài nguyên drive|tài khoản giá rẻ/i.test(name)) return 'Nền tảng / Tool';
  // Fallback: "kênh key" → Share key
  if (/kênh key|link kênh key/i.test(name)) return 'Share key / Ngách nhỏ';
  // Fallback: video Nhật (美輪明宏) → Triết lý / Tâm linh (kinh điển Nhật)
  if (/美輪|明宏|youtube\.com\/watch/i.test(name)) return 'Triết lý / Tâm linh';
  // Fallback: train, tài nguyên, prompt chia sẻ, forms, list kênh đối thủ → Nền tảng / Tool
  if (/train|tài nguyên|prompt em|forms|list kênh|list link kênh đối thủ|link tài nguyên|skill prompt|tài nguyên em/i.test(name)) return 'Nền tảng / Tool';
  // Fallback by link type
  return null; // Sẽ báo warning để xem thủ công
}

const changes = [];

for (const d of docs) {
  let changed = false;
  // Fix kind
  if (!d.kind || !d.kind.trim()) {
    const k = guessKind(d.name || '');
    if (k) {
      if (isWrite) d.kind = k;
      changes.push({ sku: d.sku, field: 'kind', old: '(empty)', new: k, name: d.name.slice(0, 60) });
      kindFixed++;
      changed = true;
    } else {
      changes.push({ sku: d.sku, field: 'kind', old: '(empty)', new: 'UNKNOWN', name: d.name.slice(0, 60) });
    }
  }
  // Fix contentNiche
  if (!d.contentNiche || !d.contentNiche.trim()) {
    const cn = guessContentNiche(d.name || '');
    if (cn) {
      if (isWrite) d.contentNiche = cn;
      changes.push({ sku: d.sku, field: 'contentNiche', old: '(empty)', new: cn, name: d.name.slice(0, 60) });
      cnFixed++;
      changed = true;
    } else {
      changes.push({ sku: d.sku, field: 'contentNiche', old: '(empty)', new: 'UNKNOWN', name: d.name.slice(0, 60) });
    }
  }
}

// In ra thay đổi
console.log('═══════════════════════════════════════');
console.log('  FIX kind + contentNiche — tai-lieu-full.json');
console.log('═══════════════════════════════════════\n');
console.log(`kind fixed:       ${kindFixed}`);
console.log(`contentNiche fixed: ${cnFixed}`);
console.log(`Unknown (cần xem):  ${changes.filter(c => c.new === 'UNKNOWN').length}\n`);

// In chi tiết
for (const c of changes) {
  const icon = c.new === 'UNKNOWN' ? '❓' : (isWrite ? '✅' : '⚠️');
  console.log(`  ${icon} [${c.sku}] ${c.field}: "${c.old}" → "${c.new}"  |  ${c.name}`);
}

if (isWrite && (kindFixed > 0 || cnFixed > 0)) {
  fs.writeFileSync(docsPath, JSON.stringify(docs, null, 2) + '\n', 'utf8');
  console.log(`\n✅ Đã ghi ${changes.length} thay đổi vào tai-lieu-full.json`);
  // Verify
  const verify = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
  const stillNoKind = verify.filter(x => !x.kind || !x.kind.trim()).length;
  const stillNoCN = verify.filter(x => !x.contentNiche || !x.contentNiche.trim()).length;
  console.log(`✅ Verify: còn ${stillNoKind} thiếu kind, ${stillNoCN} thiếu contentNiche`);
} else if (!isWrite && (kindFixed > 0 || cnFixed > 0)) {
  console.log(`\n→ Chạy lại với --write để áp dụng:`);
  console.log(`  node scripts/fix-kind-niche.js --write`);
}
