/**
 * build_raw_niches_dossiers.cjs
 * Xây dựng hồ sơ chiến lược & công thức kịch bản thực chiến chuẩn chỉnh 100% cho từng ngách trong raw-niches/
 * Dựa trên đối soát 1:1 từ 95 ảnh raw gốc và dữ liệu thị trường đã kiểm chứng.
 */

const fs = require('fs');
const path = require('path');

const ROOT = 'd:/YTB/H2DEV-Project';
const rawNichesDir = path.join(ROOT, 'raw-niches');

// 1. US_EverydayHistory (Trụ cột số 1 - Phục vụ trực tiếp PILOT-01-THE-MIRROR)
const usEverydayHistory = `# Hồ Sơ Ngách Thực Chiến: US_EverydayHistory (Lịch Sử Đời Sống, Đồ Vật & Thực Phẩm)

> **Mã ngách:** \`US_EverydayHistory\` · **Thị trường:** 🇺🇸 Hoa Kỳ / Toàn cầu (Tiếng Anh) · **Trạng thái:** TRỤ CỘT ĐỀ XUẤT SỐ 1  
> **Cơ sở dữ liệu:** Bóc tách 1:1 từ các kênh đối thủ trong kho 95 ảnh raw (\`RAW-044\`, \`RAW-042\`, \`RAW-045\`, \`RAW-046\`, \`RAW-047\`, \`RAW-015\`, \`RAW-026\`, \`RAW-007\`, \`RAW-048\`).

---

## 1. Định Vị Khán Giả & Nhu Cầu Cốt Lõi
- **Tệp khán giả mục tiêu:** Người trưởng thành và trung niên (30–65 tuổi), có thói quen nghe YouTube khi làm việc nhà, nấu ăn, đi dạo, hoặc thư giãn trước khi ngủ.
- **Nhu cầu tâm lý:** Muốn nghe một câu chuyện có thật, dễ hình dung về những thứ bình thường xung quanh mình ("Tại sao món này ngày xưa từng bị cấm?", "Chiếc gương hay cái nĩa đã thay đổi thế giới như thế nào?").
- **Hành vi xem:** **Nghe thụ động (Passive Listening)** — Không đòi hỏi phải nhìn màn hình liên tục. Ngôn từ phải giàu tính miêu tả, mạch lạc, không nhảy ý, không lạm dụng biệt ngữ phức tạp.

---

## 2. Danh Mục Kênh Đối Thủ Chuẩn Xác (Từ Kho 95 Ảnh Raw)

| Mã Raw | Tên Kênh | Handle / URL | Số liệu từ ảnh Raw | Video Outlier Tiêu Biểu |
| :--- | :--- | :--- | :--- | :--- |
| **RAW-044** | **Crumb Lore** | [@crumb.lore-yt](https://www.youtube.com/@crumb.lore-yt) | 16.5K sub · 22 videos | *"Why Old-Time Soda Was Actually Poisonous"* (320k view, 11k VPH, **outlier 28x**) |
| **RAW-042** | **The Origin** | [@theorigin619](https://www.youtube.com/@theorigin619) | 8.2K sub · 30 videos | *"The Accidental Invention of Everyday Objects"* (Trung vị ~8.050 view) |
| **RAW-045** | **History Beneath** | [@Historybeneathofficial](https://www.youtube.com/@Historybeneathofficial) | 12.1K sub · 18 videos | *"What People Actually Ate in 1800s England"* (Trung vị ~5.150 view) |
| **RAW-047** | **Appetite for History** | [@AppetiteForHistory](https://www.youtube.com/@AppetiteForHistory) | 2.4K sub · 24 videos | *"The Bizarre Food Trends That Vanished"* (Nhóm đối chứng sản xuất nhỏ) |
| **RAW-015** | **Vanished Britain** | [@VanishedBritainUK](https://www.youtube.com/@VanishedBritainUK) | 28.3K sub · 30 videos | *"What Life Was Truly Like in Victorian Kitchens"* |
| **RAW-046** | **Weirdward Bound** | [@WeirdwardBound](https://www.youtube.com/@WeirdwardBound) | 5.8K sub · 14 videos | *"Odd Traditions and Forgotten Habits of History"* |

---

## 3. Công Thức Kịch Bản Thực Chiến 3 Hồi (Script Blueprint)

Áp dụng cho chuỗi video tài liệu lịch sử đồ vật (đặc biệt là **PILOT-01-THE-MIRROR**):

### Hồi 1: The Ordinary Hook (00:00 – 01:30)
- **Mở màn bằng một nghịch lý thường nhật:** Bắt đầu bằng một vật thể mà ai cũng thấy hàng ngày nhưng không hề biết quá khứ chết chóc hoặc bất ngờ của nó.
- *Ví dụ:* "Mỗi buổi sáng, bạn nhìn vào chiếc gương để chải tóc. Nhưng vào thế kỷ 16 tại Venice, việc nhìn thấy hình ảnh phản chiếu hoàn hảo của chính mình có thể khiến một người thợ thủ công phải trả giá bằng mạng sống..."
- **Lời hứa kịch bản:** Đặt câu hỏi lớn mà người nghe muốn biết lời giải trước khi video kết thúc.

### Hồi 2: The Dark Discovery & Evolutionary Struggle (01:30 – 05:30)
- **Giai đoạn sơ khai & Bi kịch:** Những nỗ lực đầu tiên của con người (dùng đá mài, kim loại đánh bóng).
- **Cái giá phải trả:** Chất độc thủy ngân tàn phá phổi thợ tráng gương Venice, sự độc quyền bí mật của hoàng gia, những cuộc đào tẩu và ám sát gián điệp công nghiệp.
- **Bước ngoặt khoa học:** Nhà hóa học người Đức Justus von Liebig phát minh phương pháp tráng bạc hóa học an toàn năm 1835, biến chiếc gương từ biểu tượng xa xỉ chết người thành đồ dùng phổ thông.

### Hồi 3: The Psychological Shift & Epilogue (05:30 – 08:00)
- **Tác động lên tâm thức nhân loại:** Chiếc gương thay đổi hội họa (chân dung tự họa), tâm lý học (khái niệm bản ngã / ego), và văn hóa đại chúng.
- **Kết luận chiêm nghiệm nhẹ nhàng:** Kết lại bằng thông điệp sâu sắc, để lại dư âm trầm lắng cho người nghe lúc làm việc hoặc đi ngủ.

---

## 4. Quy Tắc Biên Tập & Dựng Phim (Edit SOP)
- **Giọng đọc (Voiceover):** Giọng Anh–Mỹ trầm ấm, tốc độ vừa phải (~130–145 từ/phút), không dùng ngữ điệu giật gân rẻ tiền của tin tức TikTok.
- **Hình ảnh:** Tranh khắc gỗ cổ, hiện vật bảo tàng thật kết hợp zoom/pan chậm (Ken Burns effect), hạn chế lạm dụng ảnh AI biến dạng.
- **Âm thanh:** Nhạc nền cello, piano acoustic hoặc ambient hoài niệm; tuyệt đối không dùng nhạc beat dồn dập.

---

## 5. Cảnh Báo Đỏ (Fact-Checking & Quality Guardrails)
- ⚠️ **Kiểm chứng bảo tàng bắt buộc:** Mọi niên đại, tên nhà phát minh và cơ chế hóa học phải được kiểm chứng qua tư liệu bảo tàng / bách khoa toàn thư uy tín (như British Museum, Smithsonian).
- ⚠️ **Không biến tướng thành giả thuyết âm mưu:** Tránh giật tít sai lệch hoặc đưa tin đồn huyền ảo không có căn cứ lịch sử.
`;

// 2. DE_ScienceParadox (Khoa học kể chuyện & Tự nhiên)
const deScienceParadox = `# Hồ Sơ Ngách Thực Chiến: DE_ScienceParadox (Khoa Học Tự Nhiên, Nghịch Lý & Ru Ngủ)

> **Mã ngách:** \`DE_ScienceParadox\` · **Thị trường:** Toàn cầu / Đức / Âu-Mỹ · **Trọng tâm:** Khoa học thư giãn  
> **Cơ sở dữ liệu:** Bóc tách 1:1 từ \`RAW-054\`, \`RAW-090\`, \`RAW-094\` (BeyondTheBlue), \`RAW-003\` (No Fluff Sleep), \`RAW-014\` (Calm Science), \`RAW-024\` (Ao Infinito e Além), \`RAW-077\` (Kurzgesagt).

---

## 1. Định Vị Khán Giả & Nhu Cầu
- **Tệp khán giả:** Người khó ngủ, người tò mò về vũ trụ/đại dương, học sinh sinh viên thích khoa học cơ chế nhưng dị ứng với công thức toán khô khan.
- **Nhu cầu:** Cần một không gian thư thái, kỳ vĩ nhưng êm dịu ("Âm thanh đáy biển Nam Cực", "Nghịch lý Fermi ru ngủ", "Hố đen vũ trụ").

## 2. Kênh Đối Thủ Trọng Yếu
- **BeyondTheBlue** (\`@OfficialBeyondTheBlue\`, \`RAW-054\`): Kênh biển sâu khổng lồ, trung vị ~259.000 view/video.
- **No Fluff Sleep** (\`@NoFluffSleep\`, \`RAW-003\`): Khoa học vật lý và thiên văn thiết kế đặc biệt cho việc đi ngủ (30 video trang đầu).
- **Calm Science** (\`@CalmScienceToSleep\`, \`RAW-014\`): Khoa học chậm, nhịp điệu giọng đọc êm ái.

## 3. Công Thức Kịch Bản & Edit SOP
- **Công thức:** Dẫn dắt từ một hiện tượng kỳ vĩ $\rightarrow$ Giải thích cơ chế vật lý bằng ẩn dụ đời sống $\rightarrow$ Mở rộng sang quy mô vũ trụ/đáy đại dương $\rightarrow$ Đưa người nghe vào trạng thái thư giãn tuyệt đối.
- **Edit SOP:** Sử dụng tông màu xanh thẳm (Deep Blue), hình ảnh chuyển động cực chậm (0.5x speed), chèn tiếng ồn trắng (White Noise / Ocean Waves / Rain).
`;

// 3. JP_PhatPhap (Trí Tuệ Người Lớn Tuổi & Triết Lý Nhật Bản)
const jpPhatPhap = `# Hồ Sơ Ngách Thực Chiến: JP_PhatPhap (Lời Dạy Người Xưa & Đời Sống Senior Nhật Bản)

> **Mã ngách:** \`JP_PhatPhap\` · **Thị trường:** 🇯🇵 Nhật Bản · **Trọng tâm:** Người cao tuổi, triết lý sống  
> **Cơ sở dữ liệu:** \`RAW-009\` (シニアお困りごと相談室), \`RAW-049\` (ゆっくり雑学ちゃんねるEX), cùng 5 kênh mẫu H2DEV (\`@元気な老後-t5d\`, \`@涙のひと駅\`, \`@新しい私の毎日\`, \`@心に残る話-y10k\`, \`@明日へ歩く日々\`).

---

## 1. Định Vị Khán Giả
- Người cao tuổi hưu trí tại Nhật Bản (từ 55–80 tuổi), có nhiều thời gian rảnh, quan tâm đến sức khỏe, sự cô đơn, cách sống tự chủ và những lời dạy của cổ nhân (Kukai, Phật giáo Thiền tông).
- **Thị trường có RPM cực cao:** Tệp khán giả Nhật lớn tuổi có sức mua tài chính và mức chi trả quảng cáo rất lớn.

## 2. Quy Trình Kịch Bản & Dựng Video Né Quét AI
- **Kịch bản:** Câu chuyện cảm động nhẹ nhàng (không đấu tố gay gắt), triết lý nhân sinh, mẹo sống khỏe tuổi già.
- **Edit SOP:** Tự quay video B-roll sạch (hồ cá sân vườn, thiên nhiên bốn mùa, bàn tay gõ phím) làm nền $\rightarrow$ Giảm sáng $\rightarrow$ Lồng tiếng AI tiếng Nhật chuẩn ngữ điệu người bản xứ $\rightarrow$ Phụ đề chữ to rõ cho người mắt kém.
`;

// 4. KR_SeniorWisdom (Tâm Sự Đời Sống & Gia Đình Hàn Quốc)
const krSeniorWisdom = `# Hồ Sơ Ngách Thực Chiến: KR_SeniorWisdom (Tâm Sự Đời Sống & Mâu Thuẫn Gia Đình Hàn Quốc)

> **Mã ngách:** \`KR_SeniorWisdom\` · **Thị trường:** 🇰🇷 Hàn Quốc · **Trọng tâm:** Drama đời sống, tâm sự, triết lý  
> **Cơ sở dữ liệu:** \`RAW-009\`, \`@사연만남1짱\`, \`@simbot2\` (노년의 마음소리), \`@복이오는길\`, \`@시어머니와며느리\`.

---

## 1. Bản Chất Ngách
- Khai thác mâu thuẫn gia đình (mẹ chồng - nàng dâu, chia tài sản, sự hy sinh của cha mẹ, biến cố hôn nhân) chạm vào lòng trắc ẩn của người xem Hàn Quốc.
- Khả năng cắn đề xuất cực kỳ nhanh (nhiều kênh chỉ 5–10 video đã nổ 80k–100k view).

## 2. Kỹ Thuật Kịch Bản & Sản Xuất
- Tiêu đề ngôi thứ nhất giật tít cảm xúc: "Vào ngày họp mặt gia đình...", "Mẹ chồng đã để lại cho tôi thứ này...".
- Chuỗi ảnh minh họa AI giàu cảm xúc kết hợp chuyển cảnh chậm và lồng voice AI tiếng Hàn truyền cảm.
`;

// 5. MX_MythologyStories (Thần Thoại & Huyền Tích Bản Địa)
const mxMythologyStories = `# Hồ Sơ Ngách Thực Chiến: MX_MythologyStories (Thần Thoại & Huyền Tích Châu Mỹ)

> **Mã ngách:** \`MX_MythologyStories\` · **Thị trường:** 🇲🇽 Mexico / Nam Mỹ / Toàn cầu (Tây Ban Nha & Tiếng Anh)  
> **Cơ sở dữ liệu:** \`RAW-053\` (Worlds Before Us), \`RAW-006\` (Arthur Revives the Past).

---

## 1. Định Vị Khán Giả & Đề Tài
- Huyền tích Aztec, Maya, thần thoại Hy Lạp và các sinh vật huyền bí trong truyền thuyết dân gian.
- Khán giả thích phiêu lưu, hình ảnh kỳ ảo, bí ẩn khảo cổ học.

## 2. Sản Xuất
- Tranh minh họa concept art chất lượng cao, lồng tiếng hào hùng, nhạc nền sử thi epic.
`;

// 6. VN_TrietLy (Triết Lý Nhân Sinh & Phật Pháp Việt Nam)
const vnTrietLy = `# Hồ Sơ Ngách Thực Chiến: VN_TrietLy (Triết Lý Đời Sống & Lời Dạy Phật Pháp Việt Nam)

> **Mã ngách:** \`VN_TrietLy\` · **Thị trường:** 🇻🇳 Việt Nam · **Trọng tâm:** Bình an tâm hồn, đạo hiếu  
> **Cơ sở dữ liệu:** Bóc tách từ bài học \`VIDEO-484f9e\` (Thầy Thích Pháp Hòa), \`@MộtĐờiBìnhAn-v6s\`.

---

## 1. Tư Duy Cốt Lõi: "Lựa Chọn Hơn Nỗ Lực"
- Đi sâu vào nhân vật cụ thể có sức hút lớn (Thầy Thích Pháp Hòa, thiền sư) thay vì làm "Phật dạy" chung chung không có điểm nhấn.
- **3 Vùng cấm kỵ tuyệt đối:** 1. Xuyên tạc tôn giáo; 2. Chính trị; 3. Phân biệt vùng miền.

## 2. Edit SOP Chuẩn Né Quét
- Đặt máy tự quay B-roll cảnh hồ cá, sân vườn, lá rơi 1 tiếng làm nguồn video sạch 100% độc quyền.
- Lồng tiếng AI truyền cảm, ghép phụ đề to rõ, thumbnail tôn kính đúng mực.
`;

// Ghi file
const dossiers = [
  { dir: 'US_EverydayHistory', content: usEverydayHistory },
  { dir: 'DE_ScienceParadox', content: deScienceParadox },
  { dir: 'JP_PhatPhap', content: jpPhatPhap },
  { dir: 'KR_SeniorWisdom', content: krSeniorWisdom },
  { dir: 'MX_MythologyStories', content: mxMythologyStories },
  { dir: 'VN_TrietLy', content: vnTrietLy },
];

for (const d of dossiers) {
  const filePath = path.join(rawNichesDir, d.dir, 'README.md');
  fs.writeFileSync(filePath, d.content, 'utf8');
  console.log(`✅ Đã nâng cấp hồ sơ chiến lược cho raw-niches/${d.dir}/README.md`);
}
