/**
 * build-modules-v2.js — Gom 129 bài từ data/catalog_full.json vào 11 module
 * + enrich dữ liệu duration/badge/access/seq/totalDuration từ site gốc h2dev.vn
 *
 * Data site gốc được extract qua chrome-devtools evaluate_script (21-08-2026)
 * Lưu vào data/h2dev-raw.json
 *
 * Cách chạy: node scripts/build-modules-v2.js
 * Output:  data/modules.json (v2 — có duration, badge, seq, totalDuration)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'catalog_full.json');
const RAW = path.join(ROOT, 'data', 'h2dev-raw.json');
const OUT = path.join(ROOT, 'data', 'modules.json');

const catalog = JSON.parse(fs.readFileSync(SRC, 'utf8'));
if (!Array.isArray(catalog)) { console.error('catalog_full.json không phải array'); process.exit(1); }

// Data site gốc (extract qua chrome-devtools, lưu dạng JSON string bọc trong "...")
let rawContent = fs.readFileSync(RAW, 'utf8');
// Parse 2 lần: lần 1 → string, lần 2 → array
let SITE_RAW = JSON.parse(rawContent);
if (typeof SITE_RAW === 'string') SITE_RAW = JSON.parse(SITE_RAW);
if (!Array.isArray(SITE_RAW)) { console.error('h2dev-raw.json không phải array', typeof SITE_RAW); process.exit(1); }

// Map catalog theo title (normalized) → site raw
function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9\u00C0-\u024F\u4e00-\u9fff]/gi, '').trim(); }

// Build lookup từ site raw
const siteLookup = new Map();
SITE_RAW.forEach(mod => {
  mod.items.forEach(item => {
    siteLookup.set(norm(item.title), item);
  });
});

// Thử match bằng title normalized, nếu không khớp thì fallback match theo thứ tự
const MODULES = [
  { id: 'M00', title: 'Bắt đầu tại đây — Cộng đồng & Hỗ trợ', desc: 'Hướng dẫn tham gia cộng đồng VIP riêng tư — Giao lưu, trao đổi và hỗ trợ YouTube H2DEV.', siteIdx: 0 },
  { id: 'M01', title: 'Xử lý & Kháng lỗi kênh YouTube', desc: 'Tổng hợp các video kháng lỗi sử dụng lại nội dung, trùng lặp, bản quyền, Fix GA, ...', siteIdx: 1 },
  { id: 'M02', title: 'Module 1 — Nền tảng & Setup kênh chuẩn (BẮT BUỘC XEM TRƯỚC)', desc: 'Quy trình setup setting kênh chuẩn ngay từ đầu theo chính sách mới nhất 2026.', siteIdx: 2 },
  { id: 'M03', title: 'Module 2 — Tự tìm Key/Ngách & Phân tích đối thủ', desc: 'Hướng dẫn tư duy tìm, lọc Key YouTube View Ngoại, xác định Key Trends, Key Ngon.', siteIdx: 3 },
  { id: 'M04', title: 'Hướng dẫn quy trình dùng Claude AI', desc: 'Nên dùng bản web hay app? Train prompt Claude cho bất kỳ ngách nào, đóng gói Skill.', siteIdx: 4 },
  { id: 'M05', title: 'Module 3 — Tự train Prompt', desc: 'Tự train prompt + phân tích kênh đối thủ + share ngách nhỏ sức khỏe thị trường Hàn.', siteIdx: 5 },
  { id: 'M06', title: 'VIP — Module 4 — Thực chiến Share key (86 bài)', desc: 'Module lớn nhất 86 bài. Share key + thực chiến các ngách nhỏ trên mọi thị trường: Nhật · Hàn · Việt · US · Canada · Philippines. Cập nhật liên tục.', siteIdx: 6 },
  { id: 'M07', title: 'Module 5 — Edit video & Thumbnail chuẩn A-Z', desc: 'Hướng dẫn quy trình làm thumb, clone thumb đối thủ, edit key Chill Dude / triết lý / Nonagon.', siteIdx: 7 },
  { id: 'M08', title: 'Module 6 — Mẹo & Thủ thuật (TÚT - TRICK)', desc: 'Tút mẹo khắc phục gãy view, bám theo key đối thủ không bị 0 view, edit tránh quét AI.', siteIdx: 8 },
  { id: 'M09', title: 'Module 7 — Nhân bản thị trường & Hệ thống kênh', desc: 'VIP — Tư duy nhân bản thị trường + hướng dẫn từ A-Z cách làm edit và thumb.', siteIdx: 9 },
  { id: 'M10', title: 'Module 8 — Công cụ & Tài nguyên', desc: 'Free tool tạo giọng đọc, tool dịch SRT VIP, 6 bộ tool miễn phí, Elevenlab / Minimax giá rẻ.', siteIdx: 10 }
];

// Phân loại catalog items vào module theo thứ tự published_at giảm dần
// (giống site gốc: mới nhất trước, nhưng trong từng module)
// Cách match: thử match title normalized với site raw
const assigned = new Set();
const modulesOut = MODULES.map(m => {
  const siteMod = SITE_RAW[m.siteIdx];
  const items = [];
  // Duyệt qua site items để tìm catalog match
  siteMod.items.forEach(siteItem => {
    const sn = norm(siteItem.title);
    // Tìm trong catalog
    let matched = null;
    for (const c of catalog) {
      if (assigned.has(c.sku)) continue;
      const cn = norm(c.title);
      // Match nếu title chứa nhau (không phân biệt hoa thường, bỏ dấu)
      if (cn.includes(sn) || sn.includes(cn) || cn.slice(0, 40) === sn.slice(0, 40)) {
        matched = c;
        break;
      }
    }
    // Nếu không match → thử match theo published_at giảm dần (chưa assign)
    if (!matched) {
      // Fallback: lấy bài chưa assign đầu tiên (theo thứ tự catalog)
      matched = catalog.find(c => !assigned.has(c.sku));
    }
    if (matched) {
      items.push({
        sku: matched.sku,
        title: matched.title,
        image: matched.image || '',
        mp4: matched.mp4 || '',
        origin: matched.origin || '',
        published_at: matched.published_at || '',
        free: !!matched.free,
        size: matched.size || 0,
        channels: Array.isArray(matched.channels) ? matched.channels : [],
        docsCount: Array.isArray(matched.docs) ? matched.docs.length : 0,
        // Enriched từ site gốc:
        seq: siteItem.seq,
        duration: siteItem.duration || '',
        badge: siteItem.badge || '',
        access: siteItem.access || (matched.free ? 'FREE' : 'PRO')
      });
      assigned.add(matched.sku);
    }
  });
  return {
    id: m.id,
    title: m.title,
    desc: m.desc,
    count: items.length,
    countOriginal: siteMod.items.length,
    totalDuration: (siteMod.totalDuration || '').replace('Thời lượng: ', ''),
    items: items
  };
});

// Tổng hợp
const totalAssigned = modulesOut.reduce((s, x) => s + x.items.length, 0);
console.log(`Tổng bài đã phân: ${totalAssigned}/${catalog.length}`);
modulesOut.forEach(x => {
  const diff = x.countOriginal - x.count;
  const flag = diff === 0 ? '✓' : (diff > 0 ? `-THIẾU ${diff}` : `+DƯ ${-diff}`);
  console.log(`  ${x.id}  ${String(x.count).padStart(3)} bài (gốc: ${x.countOriginal})  ${flag}  ${x.totalDuration.padEnd(12)}  ${x.title.slice(0, 50)}`);
});

// Ghi ra modules.json
const out = {
  generatedAt: new Date().toISOString(),
  source: 'data/catalog_full.json + data/h2dev-raw.json (site gốc h2dev.vn)',
  totalLessons: catalog.length,
  totalFree: catalog.filter(v => v.free).length,
  totalPro: catalog.filter(v => !v.free).length,
  modules: modulesOut
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log(`\nĐã ghi: ${path.relative(ROOT, OUT)}`);
console.log(`Kích thước: ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);
