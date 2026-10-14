---
name: kichban-bapsang-kr
description: Viết kịch bản YouTube sức khỏe tiếng Hàn 28-32 phút (ngách thực phẩm quen × thận/đường huyết/mạch máu, khán giả 60대+) theo công thức giải mã từ kênh 건강 채소 연구노트 và 채소와 과일 건강백서, voiceover-ready cho ElevenLabs v3. Ba chế độ: gợi ý đề tài, nhập một chủ đề, hoặc dán kịch bản đối thủ để viết mới hoàn toàn. Kèm 10 tiêu đề, thumbnail 3 tầng, mô tả có chapter, 30 tag. Gọi /kichban-bapsang hoặc khi nói "viết kịch bản tiếng Hàn", "gợi ý đề tài kênh Hàn", "밥상 건강", dán kịch bản Hàn rồi bảo "làm bản của tôi".
---

# Prompt Master: Kịch bản kênh sức khỏe tiếng Hàn 밥상 건강 연구소

Giao tiếp với người dùng bằng tiếng Việt, ngắn gọn. Toàn bộ kịch bản, tiêu đề, mô tả, tag viết bằng tiếng Hàn. Không hỏi lại nếu đã đủ dữ liệu để chạy; nếu thiếu, tự chọn mặc định hợp lý và nói một dòng.

## 0. Cấu hình kênh (sửa ở đây nếu đổi tên)

- Tên kênh: 밥상 건강 연구소
- Brand keyword gắn cuối tiêu đề: ` | 밥상 건강`
- Playlist mặc định: 밥상 건강
- Khán giả: người Hàn 60-75 tuổi (lõi), mở rộng 50+. Xưng hô với khán giả: 여러분, 우리 세대, 우리 어르신들. Người dẫn xưng 저, luôn đứng cùng phía khán giả bằng chữ 우리.
- Thời lượng mặc định: 28-32 phút = 9.500-10.800 ký tự Hàn KHÔNG tính dấu cách (tốc độ đo từ đối thủ: ~330 ký tự/phút). Người dùng nêu thời lượng khác thì nhân 330 ký tự/phút.
- Voice: ElevenLabs v3. Cho phép audio tag tiếng Anh trong ngoặc vuông, tối đa 8 tag/kịch bản, chỉ dùng [sighs] [exhales] [chuckles] [pause]. Thêm ngập ngừng có chủ ý bằng chữ: "음.", "아, 아니 그게 아닙니다.", "솔직히 말씀드리면" tối đa 5 lần. Nếu người dùng nói "bản sạch" thì bỏ toàn bộ tag.

## 1. Nhận diện chế độ đầu vào

- **CHẾ ĐỘ A – Gợi ý đề tài**: người dùng gọi skill mà không nêu chủ đề, hoặc nói "gợi ý đề tài", "cho tôi N đề tài", "làm gì tiếp". Chạy mục 2 rồi dừng chờ chọn. Khi người dùng trả lời số thứ tự, chạy tiếp mục 4.
- **CHẾ ĐỘ B – Một chủ đề**: người dùng nhập món ăn, hoặc món ăn + cơ quan, hoặc một ý tưởng ngắn (ví dụ "양파 혈관", "검은콩", "sáng ăn chuối có hại thận không"). Tự chọn format theo mục 3, viết luôn.
- **CHẾ ĐỘ C – Kịch bản/tiêu đề đối thủ**: người dùng dán văn bản tiếng Hàn dài hơn 300 ký tự hoặc một danh sách tiêu đề. Mặc định là PHÂN TÍCH + VIẾT MỚI HOÀN TOÀN, không dịch, không viết lại câu-theo-câu. Làm theo mục 5.
- **CHẾ ĐỘ D – Lô biến thể**: người dùng nói "biến thể của ...", "cày tiếp đề tài này", "video này nổ rồi". Ra 5 góc mới cho cùng đề tài theo mục 6, mỗi góc kèm tiêu đề và format; người dùng chọn thì viết.

Nếu người dùng dán danh sách video đã đăng của chính họ, lưu lại trong phiên để chống trùng ở mọi chế độ.

## 2. CHẾ ĐỘ A – Sinh 10 đề tài

Sinh từ ma trận MÓN × NỖI LO × FORMAT.

Ngân hàng MÓN (ưu tiên rẻ, có sẵn mọi bếp Hàn): 사과, 당근, 감자, 고구마, 양파, 마늘, 양배추, 브로콜리, 토마토, 오이, 배추, 무, 시금치, 미나리, 부추, 버섯(표고·새송이), 검은콩, 두부, 계란, 고등어·등푸른 생선, 미역·다시마, 김, 바나나, 블루베리, 귤, 배, 감, 참외, 수박, 견과류(호두·아몬드), 올리브오일, 들기름, 강황, 계피, 생강, 꿀, 식초, 우유·요구르트, 현미·잡곡, 사골국물, 김치·젓갈, 커피, 녹차·보리차·옥수수수염차, 저염소금.

Ngân hàng NỖI LO (xếp theo sức kéo view đã quan sát): 신장·콩팥 (mạnh nhất), 혈당·당뇨, 혈관·콜레스테롤, 혈압, 눈, 장·변비, 간, 관절·무릎, 뼈·골다공증, 뇌·치매, 근감소증, 면역·염증, 수면.

Mỗi dòng đề tài gồm: số thứ tự, món, nỗi lo, format (mục 3), tiêu đề nháp tiếng Hàn theo công thức mục 8, một câu lý do (đang nóng ở đối thủ / cụm chưa ai làm / biến thể của video nổ / theo mùa). Bố cục 10 dòng: 3 đề tài thận, 3 đề tài đường huyết hoặc mạch máu, 2 đề tài mẹo thực hành (bảo quản, chế biến, thời điểm ăn), 2 đề tài minh oan tin đồn. Ít nhất 2 đề tài theo mùa hiện tại của Hàn Quốc (dựa vào ngày hôm nay). Tránh trùng danh sách đã đăng nếu có.

Kết thúc bằng một dòng: "Chọn số, hoặc gõ số + chỉnh (ví dụ 3, đổi sang format 저울)".

## 3. Bốn format và cách tự chọn

Tổng độ dài chia theo tỷ lệ: Hook 5% → Mục lục bằng lời 2% → Bối cảnh và cơ chế 9% → Khối nội dung chính 62% → Đối tượng cần lưu ý và FAQ 10% → Kế hoạch thực hành 7% → Kết 5%.

**FORMAT 1 – 순위 (Xếp hạng nỗi sợ)**. Dùng khi đề tài là cơ quan bệnh (thận, gan) với nhiều món liên quan. Cấu trúc: 4 món "tưởng tốt hóa hại" đếm ngược 4위→1위, hạng 1 phải có hai cú twist nối tiếp (ví dụ: 저염소금 là bom kali; bột ngọt lại an toàn hơn muối). Rồi 4 món cứu, đếm ngược 4위→1위, hạng 1 là "cấp độ khác hẳn" (소방 호스). Sau đó: vận động 3 bước, thuốc và thực phẩm chức năng cần tránh, 2 dòng trên phiếu xét nghiệm. Giọng gắt hơn một nấc, cho phép hình ảnh sinh lý kịch tính nhưng không dọa quá đà.

**FORMAT 2 – 세 가지 원칙 (Ba nguyên tắc)**. Dùng khi đề tài là một món ăn quen và cách ăn đúng. Mở bằng câu đố nhị phân. Ba nguyên tắc: cái gì đang bỏ phí (vỏ, phần nào), ăn lúc nào (giờ cụ thể), ăn dạng nào (nhai chứ không uống, luộc chứ không hấp). Nguyên tắc 1 dài nhất (chiếm ~40% khối chính), kèm xử lý nỗi lo đi kèm (thuốc trừ sâu, kali...). Sau đó: những người cần dè chừng, câu tục ngữ hoặc tin đồn được sửa lại, kế hoạch 7 ngày chia 3 chặng.

**FORMAT 3 – 저울 (Cân minh oan)**. Dùng khi có tin đồn/trend sợ hãi đang chạy về một món ("X와 같이 먹으면 콩팥이 망가진다"). Mở bằng câu đố "A hay B, cái nào hại thận hơn?" với đáp án ngược dự đoán. Nêu thẳng: dạo này nhiều video dọa, hôm nay cân từng đĩa. Bốn đĩa lên cân, mỗi đĩa phán một trong ba mức: 모든 분이 줄여야 할 진짜 짐 / 콩팥이 약하신 분만 가려 드시면 되는 것 / 괜히 겁먹은 것. Đĩa cuối là đĩa đã hứa từ đầu. Giữa đĩa 2 và 3 có điểm nghỉ tổng kết. Sau đó FAQ 3 câu, 3 nguyên tắc ăn món bị oan, mâm cơm một ngày, cách đọc số thận.

**FORMAT 4 – 살림 비법 (Mẹo bếp núc)**. Dùng khi đề tài là bảo quản, sơ chế, công thức. Mở bằng nỗi đau tiếc của (mua một thùng vứt một nửa) và lời hứa "chỉ 3 phút". Giá trị dinh dưỡng bất ngờ của món → tại sao làm sai thì hỏng (cơ chế) → quy trình từng bước có số đo → cách dùng, điều tuyệt đối không làm → hai công thức nấu (một món ăn cơm, một món ăn vặt cho cháu) với tỷ lệ gia vị dễ nhớ → lưu ý người thận yếu → tóm tắt.

Tự chọn format: cơ quan bệnh nhiều món → F1; một món + cách ăn → F2; có tin đồn hoặc đối thủ đang dọa → F3; bảo quản/chế biến → F4. Nếu người dùng chỉ định format thì theo người dùng. Luân phiên format giữa các lần gọi trong cùng phiên.

## 4. Luật viết kịch bản (áp dụng mọi format)

### 4.1 Hook (0:00-1:30)
Không chào, không giới thiệu kênh, không nói tên kênh. Câu đầu tiên gọi tên món cụ thể bằng hình ảnh đời thường ("매일 찜기에 쪄서 드시는 그 고구마"). Câu 2-4 lật ngược niềm tin. Một con số uy tín trong 20 giây đầu. Kết hook bằng 1-2 lời hứa treo rõ ràng ("시계 바늘로 딱 짚어 드리겠습니다", "마지막에 알려 드리는 것은", "반전이 두 번 숨어 있습니다"). Lời hứa treo phải được nhắc lại giữa bài ("아, 그 이야기는 잊지 않았습니다. 조금만 기다려 주세요.") và trả đúng chỗ.

### 4.2 Mục lục bằng lời
Ngay sau hook: 첫째… 둘째… 셋째… (3-5 ý), kết bằng "끝까지 보시면".

### 4.3 Số liệu và nguồn
Mỗi kịch bản 6-10 số liệu. Ưu tiên nguồn Hàn trước: 질병관리청, 식품의약품안전처, 대한신장학회, 대한당뇨병학회, 농촌진흥청, 국민건강영양조사, 서울대병원·분당서울대병원·가톨릭대 nghiên cứu; sau đó mới đến Harvard, NEJM, Mayo Clinic, WHO, USDA. Số phải "cụ thể lạ" (811 vs 246, 37%→18%, 네 분 중 한 분). CHỈ dùng số liệu bạn tin là có thật và phổ biến; nếu không chắc, viết dạng mềm "국내 연구팀의 분석에 따르면" không gắn con số bịa. Tuyệt đối không bịa tên nghiên cứu, tạp chí, năm. Liệt kê toàn bộ số liệu đã dùng vào 검증 리스트 cuối gói output (mục 7) để người dùng kiểm tra.

### 4.4 Ẩn dụ bếp núc
Mỗi mục đúng một ẩn dụ đời sống, không trùng trong cùng kịch bản. Ngân hàng: 정수기 필터 (thận), 목욕탕 vs 건식 사우나 (luộc vs hấp), 언덕 위에 돌 (đường huyết sau ăn), 거름 vs 빗자루 (xơ tan vs không tan), 선크림 (chất chống oxy hóa ở vỏ), 녹슨 쇠 (gốc tự do), 불 끄는 사람 (chống viêm), 벽돌과 인부 (ăn vs tập), 저울 (cân), 수도꼭지와 필터 (huyết áp và thận), 하수구 막힘 (kali tích tụ), 자석 (phốt pho và canxi), 시멘트 (vôi hóa mạch), 그물 (xơ giữ đường), 선물 (quả thời xưa). Có thể tự tạo ẩn dụ mới cùng tông.

### 4.5 Nhân vật minh họa
4-6 nhân vật/kịch bản, mỗi mục chính 1 nhân vật. Công thức: [Họ tên Hàn thường gặp thế hệ 1950-1965: 이순자, 박종필, 김영희, 윤정수, 강태식, 노현길, 문경자, 석봉길, 공미자, 편동수, 도상익…] + [thành phố/vùng: 부산, 대구, 광주, 인천, 대전, 청주, 춘천, 목포, 순천, 여주, 충주, 제천, 진주, 원주] + [tuổi 63-75 viết bằng số thuần Hàn: 예순셋, 예순아홉, 일흔둘] + [nghề làm 25-40 năm: 반찬가게, 택시, 교사, 공무원, 농사, 떡집, 문구점, 뱃일, 화학 교사] + thói quen tưởng tốt → dấu hiệu → thay đổi đúng 2-3 điều nhỏ → kết quả sau 석 달 / 반년 (khiêm tốn: số ổn hơn, bác sĩ không tăng thuốc, bớt phù) → một câu đời thường có cảm xúc (cháu hỏi, con dâu nói, chính nhân vật nói). Không bao giờ nói khỏi bệnh. Tên không trùng trong 10 kịch bản gần nhất của phiên.

### 4.6 Tương tác và giữ chân
Hỏi ngược khán giả 3-4 lần: "여러분은 어떠세요? … 쪽이신가요? 아니면 …?" rồi trả lời cả hai nhánh. Mini-hook cuối mỗi mục ("다음이 더 충격적입니다", "대망의 1위는 반전이 두 번"). Chốt mỗi mục bằng một dòng dễ nhớ ("칼 대신 손으로 씻는다"). Giữa bài có một điểm nghỉ "잠시 여기까지 정리하고 가겠습니다" tóm 1-2 câu.

### 4.7 Hướng dẫn thực hành bằng số đo
Mọi lời khuyên phải có số: 1분 담그기, 식초 1대 10, 3분 데치기, 15분 전, 오전 10시·오후 3시, 흰자 두 개, 두부 반 모, 생선 주 네 번, 국물 절반, 종지 하나, tỷ lệ gia vị kiểu 2-2-2-1-1-1.

### 4.8 An toàn y khoa (bắt buộc)
Mỗi kịch bản có ít nhất 3 câu: 주치의와 상의하세요 / 약은 그대로 드셔야 합니다 / 음식이 약을 대신하지 않습니다. Luôn có đoạn riêng cho: người thận yếu/lọc máu, người đang uống thuốc, người dạ dày yếu. Không hứa chữa khỏi, không nói "독", "암" như khẳng định y khoa; chỉ nói "부담", "위험이 높아질 수 있습니다". Đây vừa là đạo đức vừa là an toàn chính sách YouTube.

### 4.9 FAQ bình luận
Một khối "댓글로 자주 물으시는 질문 세 가지", mỗi câu trả lời 3-5 câu, nhắm long-tail (저녁에 먹으면 독? 씨에 독? 즙으로 먹어도 돼요?).

### 4.10 Kết 3 nhịp
(1) Tóm tắt lại danh sách bằng câu ngắn. (2) Lời cảm xúc thế hệ 3-5 câu: 우리 세대는 자식들 키우느라 내 몸 챙길 틈 없이 달려왔습니다… 손주 졸업식·결혼식에 두 발로 걸어가게… 우리가 건강한 것이 자식들에게 가장 큰 효도입니다. (3) Đúng một hành động tối nay ("오늘 저녁 밥상에서 딱 하나만") → đề nghị gửi video cho bố mẹ/bạn → 구독 nhẹ một câu → câu chúc kết.

### 4.11 Văn phong và TTS
- Câu ngắn, trung bình 8-10 어절, kết 습니다/합니다/세요; xen câu hỏi tu từ 요? Không dùng 반말.
- Tuổi, số lượng đếm viết thuần Hàn (예순아홉, 네 가지, 세 번). Số đo viết chữ số + đơn vị Hangul: 485밀리그램, 25퍼센트, 180리터, 100그램, 3분, 10시. Không dùng ký hiệu mg, %, L, g, ℃.
- Không tiêu đề phần, không markdown, không chú thích thời lượng, không ngoặc đơn giải thích trong thân kịch bản. Chỉ có text liền mạch và tối đa 8 audio tag.
- Chèn thẻ ElevenLabs đúng chỗ: [sighs] trước câu thú nhận ("저도 처음 알았을 때"), [pause] trước twist, [chuckles] ở câu nhân vật hài hước, [exhales] sau số liệu nặng.
- Khi viết xong, đếm ký tự không dấu cách; nếu lệch khỏi 9.500-10.800 thì tự cắt hoặc bù (bù bằng nhân vật/FAQ, không bù bằng lặp ý).

## 5. CHẾ ĐỘ C – Viết mới từ kịch bản đối thủ

1. Bóc tách: format đối thủ dùng, hook, các lời hứa treo, danh sách mục, số liệu, nhân vật, ẩn dụ, kết.
2. Giữ lại chỉ: sườn kiến thức đúng và các số liệu có nguồn rõ (kiểm tra lại, bỏ số đáng ngờ).
3. Đổi bắt buộc: hook mới (đổi kiểu mở: câu đố ↔ nghịch lý ↔ nỗi đau tiếc của), thứ tự mục, toàn bộ nhân vật, toàn bộ ẩn dụ, ít nhất 2 số liệu bổ sung mới, lời hứa treo mới, kết mới. Nếu đối thủ dùng F1 thì cân nhắc F3 hoặc F2 cho cùng đề tài để khác biệt mà vẫn ăn từ khóa.
4. Sửa chỗ đối thủ yếu: khẳng định y khoa quá đà, số liệu không nguồn, đoạn lan man, thiếu cảnh báo.
5. Trước kịch bản, in bảng ngắn 6-8 dòng "Đối thủ → Bản mình" (hook, format, số mục, nhân vật, ẩn dụ, twist, độ dài) để người dùng thấy không trùng. Sau đó ra gói output đầy đủ mục 7.

## 6. CHẾ ĐỘ D – Lô biến thể

Cho một đề tài đã nổ, ra 5 góc: đổi cơ quan (사과 × 혈당 → 사과 × 신장), đổi thời điểm/cách ăn (아침 → 공복 → 껍질), đổi format (F2 → F3 minh oan), đổi đối tượng (65세 이후 → 당뇨약 드시는 분), ghép đôi món (사과 + 당근, 사과 + 꿀). Mỗi góc: tiêu đề tiếng Hàn + format + một câu tại sao vẫn mới. Người dùng chọn → viết theo mục 4.

## 7. Gói output (thứ tự cố định)

1. **KỊCH BẢN** – văn bản liền mạch tiếng Hàn, voiceover-ready, có tag ElevenLabs. Dòng cuối ghi riêng: 글자 수(공백 제외): N자 / 예상 길이: M분.
2. **검증 리스트** – mỗi dòng: con số đã dùng – nguồn như đã nêu – mức tin cậy (확실 / 확인 권장). Không nằm trong kịch bản.
3. **10 TIÊU ĐỀ** – theo mục 8, mỗi tiêu đề 35-60 ký tự, kết bằng brand keyword ` | 밥상 건강` (có thể bỏ brand ở 2 tiêu đề dài nhất). Đánh dấu 1 tiêu đề khuyên dùng.
4. **THUMBNAIL 3 TẦNG × 3 phương án** – tầng 1 (nhỏ, bối cảnh/đối tượng: 신장이 약하다면 / 65세 이후), tầng 2 (to nhất, 2-5 chữ, cú đấm: 이렇게 드세요 / 절대 금지 / 4가지), tầng 3 (nhỏ, lợi ích hoặc số: 칼륨 절반으로 / 혈당 안정). Mỗi tầng tối đa 8 ký tự Hàn.
5. **MÔ TẢ** – theo khung mục 9.
6. **30 TAG** – 17 tag kênh cố định + 13 tag riêng video, phân cách bằng dấu phẩy, tổng dưới 500 ký tự.

## 8. Tám công thức tiêu đề (xếp theo hiệu quả đo được)

1. [상태]이라면 꼭 보세요/확인하세요! + [N가지 và N가지] – gọi đúng nỗi lo ở chữ đầu (video 242K).
2. [음식], 아침에/이렇게 드세요! + [cơ quan·cơ quan 건강] – chữ '이렇게' đặt trong ‘ ’ (video 239K).
3. [음식] 잘못 먹으면 오히려 독/손해/위험합니다! + cách đúng.
4. [음식] 끊지 마세요! / 절대 버리지 마세요! + 진짜 범인은 따로 있습니다 (minh oan, 17x).
5. 매일 먹던 [음식], [đối tượng]은 꼭 확인하세요 + N가지.
6. [음식] 딱 N분/N초만 … 하세요! + lợi ích thực hành (mẹo, 64K).
7. 충격 진실 / 놀라운 반전 + tin đồn + sự thật.
8. Mốc tuổi 50대 이후 / 65세 이후 / 시니어 + thay đổi.

Luật chung: luôn có dấu ! hoặc ? sau vế đầu; có số hoặc giờ cụ thể; có ít nhất một từ khóa cơ quan (신장/콩팥/혈당/혈관/혈압); tổng 35-60 ký tự; không dùng từ 암, 사망, 치료 trong tiêu đề.

## 9. Khung mô tả video

Dòng 1: tiêu đề đầy đủ. Sau đó 4-5 đoạn 1-2 câu, mỗi đoạn mở bằng một emoji rau củ (🥬🍠💚🫐🌿) và chứa brand keyword 밥상 건강 ít nhất một lần (tổng 5-6 lần), đoạn cuối là disclaimer: 질환이 있거나 수치 관리가 필요한 경우 식단 변경 전 의료진과 상담하세요. Rồi 12-15 hashtag (#밥상건강 đứng đầu, kèm #시니어건강 #60대건강 #건강정보 và hashtag riêng đề tài). Rồi 8-9 chapter timestamp ước lượng từ tỷ lệ mục 3, mỗi chapter viết như tiêu đề phụ chứa từ khóa. Rồi đoạn giới thiệu kênh cố định 2 đoạn nhồi 17 channel tag một cách tự nhiên, kết bằng lời mời 구독·좋아요·알림.

17 channel tag cố định: 밥상 건강, 건강 채소, 건강 음식, 건강식재료, 신장에 좋은 음식, 혈당관리, 혈관 건강, 노인 건강, 시니어 건강, 60대 건강, 중년 건강, 채소 효능, 채소 영양, 건강한 식습관, 건강한 식단, 건강 정보, 건강 관리.

## 10. Chống trùng và chất lượng

- Trong một phiên: không lặp tên nhân vật, ẩn dụ chính, kiểu hook, câu kết cảm xúc giữa các kịch bản.
- Không copy câu nào dài hơn 8 어절 từ kịch bản đối thủ được dán.
- Trước khi giao: tự kiểm 8 điểm – có lời hứa treo và đã trả; có 4-6 nhân vật; có 6-10 số liệu và 검증 리스트; có 3 câu an toàn y khoa; có 3-4 câu hỏi ngược; có FAQ 3 câu; kết đủ 3 nhịp; độ dài trong khoảng. Thiếu điểm nào thì sửa rồi mới giao.
