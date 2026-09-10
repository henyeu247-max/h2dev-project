// Gắn market chuẩn cho video chưa gắn (dựa trên channels[] đã xác minh online)
// + chuẩn hóa 2 kênh "Khác" (đã verify nội dung thật bằng Exa/fetch youtube)
// Có backup. Dựa trên ngôn ngữ/ngách kênh đối thủ === thị trường video.
const fs = require('fs');
const path = require('path');
const R = path.resolve(__dirname, '..');

// ---------- A) videos.json ----------
const vf = path.join(R, 'data-tabs', 'videos.json');
const bak1 = vf + '.bak-mkt-20260817-' + Date.now();
fs.copyFileSync(vf, bak1);
console.log('Backup videos: ' + path.basename(bak1));
const v = JSON.parse(fs.readFileSync(vf, 'utf8'));

// market theo channels[] của từng video (xác minh bằng tên kênh/handle)
const marketByChannels = {
  'VIDEO-e24c31': ['🇰🇷 Hàn', '🇯🇵 Nhật'],      // @복이오는길(Hàn) + @mokamoka-e9f(Nhật)
  'VIDEO-a7bfd0': ['🇰🇷 Hàn'],                   // @은밀한응답 + @장수채소습관 (Hàn)
  'VIDEO-d2cd90': ['🇰🇷 Hàn', '🇯🇵 Nhật'],      // 2 Hàn + 3 Nhật
  'VIDEO-9aff6d': ['🇯🇵 Nhật', '🇺🇸 US'],       // kurumanozokitai(Nhật) 昔の人の知恵(Nhật) + 2 bác sĩ US
  'VIDEO-84a039': ['🇯🇵 Nhật'],                  // asuhetsudukumichi + イエスのアファメーション (Nhật)
  'VIDEO-acd33f': ['🇨🇳 Trung', '🇻🇳 Việt'],    // ChuXinDiaoYu01(Trung) + mimymedia + kyzoravietsub(Việt)
  'VIDEO-5785a5': ['🇻🇳 Việt'],                  // @Tieulongreview2026 = Tiểu Long Review (Việt)
  'VIDEO-54422c': ['🇰🇷 Hàn'],                   // baeksehealth + 실버라디오 (Hàn)
};

let changed = 0;
v.forEach(x => {
  if (marketByChannels[x.sku] && (!x.market || !x.market.length)) {
    x.market = marketByChannels[x.sku];
    changed++;
  }
});
fs.writeFileSync(vf, JSON.stringify(v, null, 2), 'utf8');
console.log('Videos market added: ' + changed);

// ---------- B) kenh-mau.json ----------
const kf = path.join(R, 'data-tabs', 'kenh-mau.json');
const bak2 = kf + '.bak-mkt-20260817-' + Date.now();
fs.copyFileSync(kf, bak2);
console.log('Backup kenh: ' + path.basename(bak2));
const k = JSON.parse(fs.readFileSync(kf, 'utf8'));

// 2 kênh "Khác" đã verify nội dung thật online
let kc = 0;
k.forEach(ch => {
  if (ch.handle === '@kienthucthanhoc9') {
    ch.niche = 'Sức khỏe / Lão hóa';           // "Kiến Thức Thận Học" = sức khỏe đông y
    if (!ch.niches) ch.niches = [];
    if (!ch.niches.includes(ch.niche)) ch.niches.push(ch.niche);
    ch.markets = ['🇻🇳 Việt'];
    kc++;
  }
  if (ch.handle === '@HinognaKaalamanYT') {
    // "Hinog na Kaalaman" = PH (Filipino, education) — niche không khớp 12 nhãn → giữ Khác
    ch.markets = ['🇵🇭 Philippines'];
    kc++;
  }
});
fs.writeFileSync(kf, JSON.stringify(k, null, 2), 'utf8');
console.log('Kenh fixed: ' + kc);
console.log('Khac con lai: ' + k.filter(x => x.niche === 'Khác').length);
console.log('Done.');