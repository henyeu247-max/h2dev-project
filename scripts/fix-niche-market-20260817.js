// Fix niche + market cho videos.json (đã tự xác minh bằng title/desc/channels)
// Có backup .bak trước khi ghi. Chạy bằng node.
const fs = require('fs');
const path = require('path');
const R = path.resolve(__dirname, '..');
const file = path.join(R, 'data-tabs', 'videos.json');

// Backup
const bak = file + '.bak-fix-20260817-' + Date.now();
fs.copyFileSync(file, bak);
console.log('Backup: ' + path.basename(bak));

const videos = JSON.parse(fs.readFileSync(file, 'utf8'));
const idx = {};
videos.forEach(v => { idx[v.sku] = v; });

// ---------- FIX NGÁCH (8 video đã xác minh qua title) ----------
const nicheFix = {
  'VIDEO-64130d': 'Nền tảng / Tool',   // tool dịch phụ đề SRT
  'VIDEO-04c2e3': 'Nền tảng / Tool',   // bán tool voice/clone
  'VIDEO-cb907b': 'Reup / Hoạt hình',  // hướng dẫn reup
  'VIDEO-ed1be9': 'Edit / Thumb',      // hướng dẫn edit
  'VIDEO-b559c8': 'Edit / Thumb',      // hướng dẫn làm thumb
  'VIDEO-a348a5': 'Edit / Thumb',      // làm thumb key triết lý
  'VIDEO-b96929': 'Edit / Thumb',      // edit key triết lý
  'VIDEO-61e354': 'Share key / Ngách nhỏ', // tư duy tìm lọc key
};

// ---------- FIX MARKET (đã xác minh qua title/desc/channels) ----------
const marketFix = {
  // bỏ Trung (chữ "không trung thực" = inauthentic, không phải Trung Quốc)
  'VIDEO-6ad3fe': { remove: ['🇨🇳 Trung'] },
  'VIDEO-9a6957': { remove: ['🇨🇳 Trung'] },
  'VIDEO-1a7f58': { remove: ['🇨🇳 Trung'] },
  'VIDEO-33d701': { remove: ['🇨🇳 Trung'] },
  'VIDEO-8b69c9': { remove: ['🇨🇳 Trung'] },
  'VIDEO-1b4be3': { remove: ['🇨🇳 Trung'] },
  'VIDEO-502960': { remove: ['🇨🇳 Trung'] },  // "thời gian trung bình" không phải Trung
  'VIDEO-7e00ee': { remove: ['🇨🇳 Trung'] },  // "thời gian trung bình"
  // bỏ Nga (title/desc nói US/Nhật)
  'VIDEO-9f9fbc': { remove: ['🇷🇺 Nga'], add: ['🇯🇵 Nhật'] },  // desc kênh đối thủ tiếng Nhật
  'VIDEO-a2b317': { remove: ['🇷🇺 Nga'] },  // title chỉ nói US
  // bỏ Anh (title/desc không nói Anh)
  'VIDEO-2ed37a': { remove: ['🇬🇧 Anh'] },  // title nói PH + US
  'VIDEO-9ef6fe': { remove: ['🇬🇧 Anh'] },  // title nói US
  'VIDEO-ffccd2': { remove: ['🇬🇧 Anh'] },  // title nói Hàn
  'VIDEO-806c0c': { remove: ['🇬🇧 Anh'] },  // không nói nước nào
  'VIDEO-e91589': { remove: ['🇬🇧 Anh'] },  // title nói Nhật
  'VIDEO-f77c31': { remove: ['🇬🇧 Anh'] },  // title nói Việt
  'VIDEO-4a5aac': { remove: ['🇬🇧 Anh'] },  // title nói Việt (vietsub)
  'VIDEO-d84a78': { remove: ['🇬🇧 Anh'], add: ['🇰🇷 Hàn'] }, // desc: ngách phật pháp thị trường Hàn
};

let nicheChanged = 0, marketChanged = 0;
videos.forEach(v => {
  if (nicheFix[v.sku]) { v.niche = nicheFix[v.sku]; nicheChanged++; }
  if (marketFix[v.sku]) {
    const f = marketFix[v.sku];
    let m = v.market || [];
    (f.remove || []).forEach(r => { m = m.filter(x => x !== r); });
    (f.add || []).forEach(a => { if (!m.includes(a)) m.push(a); });
    v.market = m;
    marketChanged++;
  }
});

fs.writeFileSync(file, JSON.stringify(videos, null, 2), 'utf8');
console.log('Niche fixed: ' + nicheChanged);
console.log('Market fixed: ' + marketChanged);
console.log('Done.');
