/**
 * build-modules.js — Gom 129 bài từ data/catalog_full.json vào 11 module
 * theo đúng thứ tự gốc h2dev.vn (lấy từ firecrawl 21/08/2026).
 *
 * Cách chạy: node scripts/build-modules.js
 * Output:  data/modules.json
 *
 * Logic:
 *  - Mỗi module có: id (M01..M11), title, description, count, items[]
 *  - Mỗi item = 1 bài (sku, title, image, mp4, origin, published_at, free, duration_label, channels, docs)
 *  - Sort trong module: theo published_at giảm dần (mới trước) — đúng site gốc
 *  - Module 4 (86 bài) là lớn nhất: "VIP — Thực chiến Share key"
 *  - Module 8 (4 bài) nhỏ nhất: "Công cụ & Tài nguyên"
 *
 * Map thứ tự gốc → SKU:
 *   Site gốc h2dev.vn sắp xếp theo thứ tự published_at giảm dần.
 *   Em map 1-1 theo url_key/origin.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'data', 'catalog_full.json');
const OUT = path.join(ROOT, 'data', 'modules.json');

const catalog = JSON.parse(fs.readFileSync(SRC, 'utf8'));
if (!Array.isArray(catalog)) {
  console.error('catalog_full.json không phải array');
  process.exit(1);
}

// Module definition (theo đúng site gốc h2dev.vn, scrape 21/08/2026)
// count gốc site: 2 + 6 + 12 + 1 + 4 + 3 + 86 + 6 + 4 + 1 + 4 = 129 ✅
const MODULES = [
  {
    id: 'M00',
    title: 'Bắt đầu tại đây — Cộng đồng & Hỗ trợ',
    desc: 'Hướng dẫn tham gia cộng đồng VIP riêng tư — Giao lưu, trao đổi và hỗ trợ YouTube H2DEV.',
    count: 2,
    keywords: ['huong-dan-tham-gia-cong-dong-vip', 'show-kham-kenh-ket-qua-sau-1-video']
  },
  {
    id: 'M01',
    title: 'Xử lý & Kháng lỗi kênh YouTube',
    desc: 'Tổng hợp các video kháng lỗi sử dụng lại nội dung, trùng lặp, bản quyền, Fix GA, ...',
    count: 6,
    keywords: [
      '16-trieu-1-ngay-doanh-thu-kenh-thi-truong-nhat',
      'bat-kiem-tien-kenh-hoc-vien-pro',
      'doanh-thu-kenh-lam-ban-content-ngach-view-viet-sau-10-ngay',
      'khang-loi-su-dung-lai-noi-dung-trung-lap-noi-dung-moi-nhat-2026',
      'khang-su-dung-lai-noi-dung-trung-lap-noi-dung-gay-ban-quyen',
      'huong-dan-fix-va-giai-thich-cach-tao-tai-khoan-google-adsense-ga-an-toan'
    ]
  },
  {
    id: 'M02',
    title: 'Module 1 — Nền tảng & Setup kênh chuẩn (BẮT BUỘC XEM TRƯỚC)',
    desc: 'Quy trình setup setting kênh chuẩn ngay từ đầu theo chính sách mới nhất 2026.',
    count: 12,
    keywords: [
      'hop-tac-lam-kenh-youtube-an-chia-doanh-thu',
      'giai-thich-va-huong-dan-dua-ra-cach-chon-mail',
      'bat-buoc-phai-xem-danh-cho-nguoi-moi-hoan-toan-chua-biet-gi-huong-dan-full-quy-trinh-setup-setting-kenh',
      'cach-seo-chuan-tu-khoa-kenh-tu-khoa-video',
      'ngam-kenh-chuan-va-xac-minh-do-trust',
      'xac-dinh-bao-nhieu-video-khong-len-la-bo',
      'fix-loi-noi-dung-khong-trung-thuc',
      'cach-tao-kenh-lap-kenh-chuyen-doi-kenh-sang-thi-truong-ngoai',
      'meo-tips-phan-chia-nuoi-cac-mail-kenh-tren-cung-1-thiet-bi',
      'huong-dan-cach-ngam-kenh-va-cac-thu-thuat-meo-tuong-tac-kenh-doi-thu',
      'huong-dan-add-quyen-quan-ly-kenh-va-mail-khoi-phuc-tranh-bi-google-quet-loi-spam',
      'huong-dan-fix-add-quyen-cho-tk-google-adsense-khong-bi-die'
    ]
  },
  {
    id: 'M03',
    title: 'Module 2 — Tự tìm Key/Ngách & Phân tích đối thủ',
    desc: 'Hướng dẫn tư duy tìm, lọc Key YouTube View Ngoại, xác định Key Trends, Key Ngon.',
    count: 1,
    keywords: ['huong-dan-tu-duy-tim-loc-key-youtube-view-ngoai']
  },
  {
    id: 'M04',
    title: 'Hướng dẫn quy trình dùng Claude AI làm YouTube',
    desc: 'Nên dùng bản web hay app? Train prompt Claude cho bất kỳ ngách nào, đóng gói Skill.',
    count: 4,
    keywords: [
      'nen-dung-ban-web-hay-app-va-giai-thich-nen-dung-goi-nao-cua-claude-ai',
      'full-quy-trinh-thuc-chien-huong-dan-dung-claude-train-prompt-bat-ky-chu-de-ngach',
      'thuc-chien-huong-dan-train-claude-lam-prompt-bam-theo-kich-ban-doi-thu',
      'tang-prompt-master-tu-nhan-ban-sang-moi-thi-truong'
    ]
  },
  {
    id: 'M05',
    title: 'Module 3 — Tự train Prompt bất kỳ chủ đề mình muốn',
    desc: 'Tự train prompt + phân tích kênh đối thủ + share ngách nhỏ sức khỏe thị trường Hàn.',
    count: 3,
    keywords: [
      'huong-dan-chi-tiet-tu-train-prompt-va-phan-tich-kenh-doi-thu',
      'huong-dan-tu-train-prompt-tu-tao-prompt-cho-bat-ky-chu-de-nao-muon',
      'share-key-ngach-cuc-nho-view-viet-moi-va-huong-dan-tu-tao-prompt-lay-kich-ban'
    ]
  },
  {
    id: 'M06',
    title: 'VIP — Module 4 — Thực chiến Share key / Hướng dẫn chi tiết quy trình làm, edit, train prompt, tạo thumbnail — Nhiều thị trường (ngách nhỏ) — Cập nhật thường xuyên liên tục',
    desc: 'Module lớn nhất 86 bài. Share key + thực chiến các ngách nhỏ trên mọi thị trường: Nhật · Hàn · Việt · US · Canada · Philippines. Đây là phần dài nhất và update liên tục.',
    count: 86,
    keywords: [
      // 86 url_key theo thứ tự gốc — sẽ match tự động theo origin
      // Em để trống → gán những bài còn lại chưa match vào module này
    ],
    fallback: true // nhận tất cả bài chưa match
  },
  {
    id: 'M07',
    title: 'Module 5 — Edit video & Thumbnail chuẩn A-Z',
    desc: 'Hướng dẫn quy trình làm thumb, clone thumb đối thủ, edit key Chill Dude / triết lý / Nonagon.',
    count: 6,
    keywords: [
      'huong-dan-quy-trinh-lam-thumb-clone-thumb-theo-giong-100-doi-thu',
      'huong-dan-lam-thumb-ngach-nho-trong-key-nguoi-que',
      'huong-dan-edit-key-chill-dudechi-tiet-tu-a-z',
      'huong-dan-edit-key-triet-ly-khac-ky-chi-tiet-tu-a-z',
      'huong-dan-lam-thumb-key-triet-ly-khac-ky',
      'huong-dan-tao-edit-thumb-key-nonagon'
    ]
  },
  {
    id: 'M08',
    title: 'Module 6 — Mẹo & Thủ thuật khắc phục lỗi gãy view và chống die kênh (TÚT - TRICK)',
    desc: 'Tút mẹo khắc phục gãy view, bám theo key đối thủ không bị 0 view, edit tránh quét AI.',
    count: 4,
    keywords: [
      'tut-meo-huong-dan-cach-khac-phuc-gay-view-moi-nhat-2026',
      'chia-se-tut-meo-bam-theo-key-lam-video-khong-bao-gio-bi-0-view',
      'update-moi-27-12-2025-ngach-thi-truong-nhat-ban-viet-huong-dan-cach-edit-video',
      'tut-trick-meo-test-ban-quyen-khi-reup-ban-content-dang-nguon-tu-douyin'
    ]
  },
  {
    id: 'M09',
    title: 'Module 7 — Nhân bản thị trường & Xây dựng hệ thống kênh',
    desc: 'VIP — Tư duy nhân bản thị trường + hướng dẫn từ A-Z cách làm edit và thumb.',
    count: 1,
    keywords: ['vip-tu-duy-nhan-ban-thi-truong-va-huong-dan-tu-a-z-cach-lam-edit-va-thumb']
  },
  {
    id: 'M10',
    title: 'Module 8 — Công cụ & Tài nguyên hỗ trợ',
    desc: 'Free tool tạo giọng đọc, tool dịch SRT VIP, 6 bộ tool miễn phí, Elevenlab / Minimax giá rẻ.',
    count: 4,
    keywords: [
      'update-free-tool-tao-giong-doc-tieng-viet-ngoc-huyen-vao-tool-dich-phu-de-srt',
      'tool-dich-phu-de-srt-vip-huong-dan-dung-tool-dich-phu-de-srt',
      'nhan-va-tai-mien-phi-6-bo-tool-tai-day',
      'tool-elevenlab-clone-minimax-dich-srt-tai-khoan-chatgpt-plus-capcut-pro-gia-re'
    ]
  }
];

// Map bài theo url_key (lấy từ origin field)
function urlKeyOf(item) {
  if (item.url_key) return item.url_key;
  if (item.origin) {
    const m = String(item.origin).match(/\/study\/([^/?#]+)/);
    if (m) return m[1];
  }
  return '';
}

// Phân loại
const assigned = new Set();
const modulesOut = MODULES.map((m, idx) => {
  const items = [];
  for (const item of catalog) {
    if (assigned.has(item.sku)) continue;
    const uk = urlKeyOf(item);
    if (!uk) continue;
    // Match nếu module có keyword chưa rỗng và keyword nào khớp
    if (m.keywords && m.keywords.length) {
      const hit = m.keywords.some(k => uk.includes(k) || uk.startsWith(k) || uk === k);
      if (hit) {
        items.push(item);
        assigned.add(item.sku);
      }
    }
  }
  return { module: m, items };
});

// Fallback module (M06) — nhận tất cả bài chưa match
const fallbackMod = modulesOut.find(x => x.module.fallback);
if (fallbackMod) {
  for (const item of catalog) {
    if (assigned.has(item.sku)) continue;
    fallbackMod.items.push(item);
    assigned.add(item.sku);
  }
}

// Sort trong module: published_at giảm dần (mới trước) — đúng site gốc
modulesOut.forEach(x => {
  x.items.sort((a, b) => String(b.published_at || '').localeCompare(String(a.published_at || '')));
});

// Tổng hợp
const totalAssigned = modulesOut.reduce((s, x) => s + x.items.length, 0);
console.log(`Tổng bài đã phân: ${totalAssigned}/${catalog.length}`);
modulesOut.forEach(x => {
  const diff = x.module.count - x.items.length;
  const flag = diff === 0 ? '✓' : (diff > 0 ? `-THIẾU ${diff}` : `+DƯ ${-diff}`);
  console.log(`  ${x.module.id}  ${String(x.items.length).padStart(3)} bài (gốc: ${x.module.count})  ${flag}  ${x.module.title.slice(0, 50)}`);
});

// Ghi ra modules.json — chỉ giữ field cần thiết để file nhỏ + reader nhanh
const out = {
  generatedAt: new Date().toISOString(),
  source: 'data/catalog_full.json',
  totalLessons: catalog.length,
  totalFree: catalog.filter(v => v.free).length,
  totalPro: catalog.filter(v => !v.free).length,
  modules: modulesOut.map(x => ({
    id: x.module.id,
    title: x.module.title,
    desc: x.module.desc,
    count: x.items.length,
    countOriginal: x.module.count,
    items: x.items.map(v => ({
      sku: v.sku,
      title: v.title,
      image: v.image || '',
      mp4: v.mp4 || '',
      origin: v.origin || '',
      published_at: v.published_at || '',
      free: !!v.free,
      size: v.size || 0,
      channels: Array.isArray(v.channels) ? v.channels : [],
      docsCount: Array.isArray(v.docs) ? v.docs.length : 0,
      durationLabel: '' // site gốc có duration mm:ss nhưng catalog không lưu → để trống, có thể bổ sung sau
    }))
  }))
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log(`\nĐã ghi: ${path.relative(ROOT, OUT)}`);
console.log(`Kích thước: ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);
