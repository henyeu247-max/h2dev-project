// Gán niche/markets cho 49 kênh mẫu còn dùng schema cũ (market/category) — chạy một lần, có thể chạy lại (idempotent).
// Bằng chứng: kênh sống = tiêu đề 8 video gần nhất lấy bằng yt-dlp (_audit/20261015-niche/live25-titles.json);
//             kênh đã dừng = tên kênh + bài giảng dẫn chứng (không còn nội dung để đối chiếu).
// Chạy: node scripts/apply-kenh-mau-phanloai.js [--dry]
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'data-tabs', 'kenh-mau.json');
const DRY = process.argv.includes('--dry');
const NGAY = '2026-10-15';
const SRC_LIVE = 'tiêu đề 8 video gần nhất (yt-dlp ' + NGAY + ')';
const SRC_DEAD = 'tên kênh + bài giảng dẫn chứng (kênh đã dừng, không còn nội dung để đối chiếu)';

const HAN = '🇰🇷 Hàn', NHAT = '🇯🇵 Nhật', TRUNG = '🇨🇳 Trung', US = '🇺🇸 US', VIET = '🇻🇳 Việt';
const TL = 'Triết lý / Tâm linh', SK = 'Sức khỏe / Lão hóa', KT = 'Kinh tế / Tài chính', DR = 'Drama / Stories',
  LS = 'Lịch sử / Quân sự', TS = 'Tâm sự tuổi già / Dưỡng sinh', KH = 'Khác', TLK = 'Tâm lý / Kỹ năng', SOTHO = 'Bí mật sống thọ 100 tuổi';

// [handle, niche, markets, nguồn]
const L = SRC_LIVE, D = SRC_DEAD;
const MAP = [
  // --- kênh còn sống (đọc tiêu đề thật) ---
  ['@지혜샘라디오', TS, [HAN], L], ['@노을빛시간', TS, [HAN, US], L], ['@한국사이야기100', LS, [HAN, US], L],
  ['@ApocalypseSurvivorsHQ', DR, [US], L], ['@ZestRankEverything', LS, [US], L], ['@trueglobe66', KH, [US], L],
  ['@fortune68studio', TL, [TRUNG], L], ['@WiseListen2Wise', TL, [TRUNG], L], ['@wealtharrow', KT, [HAN, US], L],
  ['@은빛인생여행', TS, [HAN, US], L], ['@黒猫の予言', DR, [NHAT], L], ['@誇りを守った日本人.8386', DR, [NHAT, US], L],
  ['@wise-stories-2504', KT, [HAN], L], ['@SeniorLab2025', TS, [NHAT], L], ['@지혜의샘-h2f', KH, [VIET], L],
  ['@1-ji2mx', SK, [NHAT], L], ['@노후클라스', TS, [HAN], L], ['@olderhealth-z8z', SK, [NHAT], L],
  ['@百寿の知恵', SK, [NHAT], L], ['@지혜의벤치', KT, [HAN], L], ['@やさしい人生の知恵', TS, [NHAT], L],
  ['@건강지혜사전', SK, [HAN], L], ['@mindorosi', TLK, [HAN, US], L],
  ['@TâmBìnhAnLạc', TL, [VIET], 'tên kênh (kênh sống nhưng chỉ có 1 video, không đủ tiêu đề để đối chiếu)'],
  ['@건행시대', SK, [HAN], 'tên kênh (kênh sống nhưng không có tab video, không đủ nội dung để đối chiếu)'],
  // --- kênh đã dừng (tên kênh + bài giảng) ---
  ['@人生の感動物語-d7f', DR, [NHAT], D], ['@賢者の灯', TL, [NHAT], D], ['@노인건강습관-m3o', SK, [HAN], D],
  ['@당신의경제학', KT, [HAN], D], ['@あの年の空', DR, [NHAT], D], ['@만사형통2', TL, [HAN], D],
  ['@튼튼라디오', SK, [HAN], D], ['@지혜로운하루-k6h', TS, [HAN], D], ['@세월의지혜TV', TS, [HAN], D],
  ['@ijinmeigench', TL, [NHAT], D], ['@시니어톡톡2025', TS, [HAN], D], ['@KonosukeMatsushitaquote', TL, [NHAT], D],
  ['@USAMilitaryNews-8', LS, [US], D], ['@운세박사-공식', TL, [HAN], D], ['@풍수연구소999', TL, [HAN], D],
  ['@ni-i7i', KH, [NHAT, HAN], D], ['@금빛노', TS, [HAN], D], ['@老後の物語', TS, [NHAT], D],
  ['@다시_청춘', TS, [HAN], D], ['@医師たちの言葉', SK, [NHAT], D], ['@지혜의보물-v5w', TS, [HAN], D],
  ['@은빛-노후', TS, [HAN], D], ['@100年の歩み百寿', SOTHO, [NHAT], D], ['@노을꽃길', TS, [HAN], D],
];

const raw = fs.readFileSync(FILE, 'utf8');
const crlf = raw.includes('\r\n');
const data = JSON.parse(raw);
const arr = Array.isArray(data) ? data : data.channels;
const norm = s => String(s || '').toLowerCase();
let applied = 0;
const seen = new Set();
for (const [handle, niche, markets, nguon] of MAP) {
  const ch = arr.find(c => norm(c.handle) === norm(handle));
  if (!ch) throw new Error('Không thấy kênh: ' + handle);
  if (seen.has(norm(handle))) throw new Error('Trùng trong MAP: ' + handle);
  seen.add(norm(handle));
  if (ch.niche && ch.markets && ch.markets.length && ch.phanLoaiNgay !== NGAY) continue; // đã có phân loại gốc: không ghi đè
  ch.niche = niche;
  ch.niches = [niche];
  ch.markets = markets;
  ch.phanLoaiNguon = nguon;
  ch.phanLoaiNgay = NGAY;
  applied++;
}
const left = arr.filter(c => !c.niche || !(c.markets && c.markets.length));
console.log(`MAP ${MAP.length} · áp dụng ${applied} · còn thiếu niche/markets: ${left.length}${left.length ? ' → ' + left.map(c => c.handle).join(', ') : ''}`);
if (!DRY) {
  let out = JSON.stringify(data, null, 2) + (raw.endsWith('\n') ? '\n' : '');
  if (crlf) out = out.replace(/\n/g, '\r\n');
  fs.writeFileSync(FILE, out);
  console.log('đã ghi ' + path.relative(ROOT, FILE));
}
