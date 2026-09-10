// Chuẩn hóa kenh-mau.json: gắn lại niche cho kênh "Khác" (theo handle/nghĩa tên)
// + sửa kênh gắn nhầm + gắn markets thiếu. Có backup. Đã xác minh thủ công.
const fs = require('fs');
const path = require('path');
const R = path.resolve(__dirname, '..');
const file = path.join(R, 'data-tabs', 'kenh-mau.json');

const bak = file + '.bak-fix-20260817-' + Date.now();
fs.copyFileSync(file, bak);
console.log('Backup: ' + path.basename(bak));

const kenh = JSON.parse(fs.readFileSync(file, 'utf8'));

// niche đúng theo handle (phân tích nghĩa tên kênh)
const nicheFix = {
  // --- SỨC KHỎE / LÃO HÓA ---
  '@시니어살림노트': 'Sức khỏe / Lão hóa',        // senior life notes
  '@HealthyToday0': 'Sức khỏe / Lão hóa',
  '@desidilse': 'Sức khỏe / Lão hóa',           // (Hàn, ẩn ý sức khỏe - giữ mức thận trọng)
  '@의사가숨긴건강법-z9n': 'Sức khỏe / Lão hóa',  // bác sĩ giấu cách khỏe
  '@みんなの若返りアカデミア': 'Sức khỏe / Lão hóa', // trẻ hóa
  '@식탁보약·백세비결': 'Sức khỏe / Lão hóa',     // thuốc bổ trăm tuổi
  '@노후건강한끼': 'Sức khỏe / Lão hóa',         // bữa ăn khỏe tuổi già
  '@건강백단-c2u': 'Sức khỏe / Lão hóa',        // sức khỏe
  '@ThựcPhẩmSứcKhoẻ-u8y': 'Sức khỏe / Lão hóa',
  '@漫画で学ぶシニアの健康CH-n8i': 'Sức khỏe / Lão hóa', // sức khỏe senior manga
  '@SuGia_SucKhoe': 'Sức khỏe / Lão hóa',
  '@suckhoedongy99': 'Sức khỏe / Lão hóa',      // đông y
  '@KhỏeVềGià': 'Sức khỏe / Lão hóa',
  '@baeksehealth': 'Sức khỏe / Lão hóa',        // (sửa: đang nhầm Prompt/AI)
  // --- TRIẾT LÝ / TÂM LINH ---
  '@quietstrength88': 'Triết lý / Tâm linh',
  '@アマテラス巫女あまね': 'Triết lý / Tâm linh',  // miko/spiritual
  '@スピリチュアルの泉-l4z': 'Triết lý / Tâm linh',// spiritual
  '@金運と言葉の力': 'Triết lý / Tâm linh',      // lời nói/vận khí
  '@偉人の救い': 'Triết lý / Tâm linh',        // cứu rỗi vĩ nhân
  '@izinnokatari': 'Triết lý / Tâm linh',     // chuyện vĩ nhân
  '@kotobano-housekibako': 'Triết lý / Tâm linh', // hộp kho báu ngôn từ
  '@IjinNoNouri': 'Triết lý / Tâm linh',      // năng lực vĩ nhân
  '@空海の真理': 'Triết lý / Tâm linh',        // chân lý Phật
  '@PHONGTHUYTIEMTANG': 'Triết lý / Tâm linh', // phong thủy
  '@tritueconhanradio': 'Triết lý / Tâm linh',  // trí tuệ nhân sinh
  '@gockhuatnhansinh-official': 'Triết lý / Tâm linh', // góc khuất nhân sinh
  '@노년의마음': 'Triết lý / Tâm linh',        // tâm hồn tuổi già
  // --- KINH TẾ / TÀI CHÍNH ---
  '@RichPatternResearchInstitute': 'Kinh tế / Tài chính',
  '@お金の心理': 'Kinh tế / Tài chính',        // tâm lý tiền bạc
  '@성실한경제학': 'Kinh tế / Tài chính',      // kinh tế học
  '@당신의경제학': 'Kinh tế / Tài chính',      // kinh tế học của bạn
  '@오싹한경제': 'Kinh tế / Tài chính',        // (sửa: đang nhầm Sức khỏe)
  // --- DRAMA / STORIES ---
  '@シルバー世代の語り部': 'Drama / Stories',   // người kể chuyện thế hệ bạc
  // --- LỊCH SỬ / QUÂN SỰ ---
  '@thecoldwartales': 'Lịch sử / Quân sự',   // chiến tranh lạnh
  '@militarytactics113': 'Lịch sử / Quân sự', // chiến thuật quân sự
};

// markets thiếu (suy từ ngôn ngữ handle)
const marketFix = {
  '@복이오는길': ['🇰🇷 Hàn'],
  '@mokamoka-e9f': ['🇯🇵 Nhật'],
  '@은밀한응답': ['🇰🇷 Hàn'],
  '@quietstrength88': ['🇺🇸 US'],
  '@アマテラス巫女あまね': ['🇯🇵 Nhật'],
  '@みんなの若返りアカデミア': ['🇯🇵 Nhật'],
  '@スピリチュアルの泉-l4z': ['🇯🇵 Nhật'],
  '@kurumanozokitai': ['🇯🇵 Nhật'],
  '@昔の人の知恵': ['🇯🇵 Nhật'],
  '@DoctorJohnMeyers': ['🇺🇸 US'],
  '@EricBennettMD': ['🇺🇸 US'],
  '@asuhetsudukumichi': ['🇯🇵 Nhật'],
  '@イエスのアファメーション': ['🇯🇵 Nhật'],
  '@ChuXinDiaoYu01': ['🇨🇳 Trung'],
  '@mimymedia': ['🇰🇷 Hàn'],
  '@kyzoravietsub': ['🇻🇳 Việt'],
  '@Tieulongreview2026': ['🇻🇳 Việt'],
  '@HDVietsub-h7u': ['🇻🇳 Việt'],
  '@redvoices90': ['🇻🇳 Việt'],
  '@baeksehealth': ['🇰🇷 Hàn'],
  '@실버라디오-z4u': ['🇰🇷 Hàn'],
};

let n1=0, n2=0;
kenh.forEach(ch => {
  if (nicheFix[ch.handle]) { 
    ch.niche = nicheFix[ch.handle];
    if (!ch.niches) ch.niches = [];
    if (!ch.niches.includes(ch.niche)) ch.niches.push(ch.niche);
    n1++;
  }
  if (marketFix[ch.handle] && !(ch.markets && ch.markets.length)) {
    ch.markets = marketFix[ch.handle];
    n2++;
  }
});

fs.writeFileSync(file, JSON.stringify(kenh, null, 2), 'utf8');
console.log('Niche fixed: ' + n1);
console.log('Markets added: ' + n2);
console.log('Khac con lai: ' + kenh.filter(x=>x.niche==='Khác').length);
console.log('Done.');
