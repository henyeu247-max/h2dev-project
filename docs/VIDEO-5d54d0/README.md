# VIDEO-5d54d0 — Thực chiến hướng dẫn train Claude làm prompt bám theo kịch bản đối thủ xào nấu cho bất kỳ chủ đề (ngách) nào muốn - Quy trình chuẩn bán content dành cho ngách bám theo 70% kịch bản đối thủ

## 1. Thông Tin Tổng Quan
- **SKU:** `VIDEO-5d54d0`
- **Tiêu đề bài giảng:** Thực chiến hướng dẫn train Claude làm prompt bám theo kịch bản đối thủ xào nấu cho bất kỳ chủ đề (ngách) nào muốn - Quy trình chuẩn bán content dành cho ngách bám theo 70% kịch bản đối thủ
- **Chủ đề thực tế:** Quy trình Bán Content chuẩn 70/30: Huấn luyện Claude xào nấu kịch bản đối thủ & Kỹ thuật tạo sóng âm Audio Waveform 4K né quét AI
- **Ngách nội dung:** Bán Content Triết Lý Nhật Bản (Prompt AI & Nhân Bản Kịch Bản)
- **Thị trường mục tiêu:** 🇯🇵 Nhật Bản (Mã: `JP`)
- **Thời lượng:** 60:58 (`3659.17s`)
- **Dung lượng MP4:** 711.8 MB
- **File Video:** [`video/VIDEO-5d54d0/VIDEO-5d54d0.mp4`](/video/VIDEO-5d54d0/VIDEO-5d54d0.mp4)
- **Ảnh đại diện:** [`assets/thumbs/VIDEO-5d54d0.png`](/assets/thumbs/VIDEO-5d54d0.png)
- **File Phụ đề bóc tách:** [`video/VIDEO-5d54d0/transcript.txt`](/video/VIDEO-5d54d0/transcript.txt)
- **Nguồn bài giảng gốc:** [https://h2dev.vn/learn/study/thuc-chien-huong-dan-train-claude-lam-prompt-bam-theo-kich-ban-doi-thu-xao-nau-cho-bat-ky-chu-de-ngach-nao-muon-quy-trinh-chuan-ban-content-danh-cho-ngach-bam-theo-70-kich-ban-doi-thu](https://h2dev.vn/learn/study/thuc-chien-huong-dan-train-claude-lam-prompt-bam-theo-kich-ban-doi-thu-xao-nau-cho-bat-ky-chu-de-ngach-nao-muon-quy-trinh-chuan-ban-content-danh-cho-ngach-bam-theo-70-kich-ban-doi-thu)

---

## 2. Tư Duy Cốt Lõi: Quy Trình Bán Content 70/30 & Khảo Sát Kênh Mẫu
- **Định nghĩa Bán Content 70/30:** Thay vì tự nghĩ chủ đề từ con số 0, phương pháp này bám sát những kịch bản đã viral của đối thủ: giữ lại **70% cấu trúc và nội dung cốt lõi** từ kịch bản gốc của đối thủ, kết hợp **30% do AI tự sáng tạo viết mới** để tránh trùng lặp máy móc.
- **Ví dụ thực tế trong bài:** Một kênh ngách triết lý Nhật Bản (nhân vật Akihiro Miwa) của học viên trong group Pro mới lập ngày 5/5 (chỉ mới 11 ngày trước thời điểm quay), chỉ cần 1-2 video nổ view là đã đủ lượt đăng ký và bật kiếm tiền thành công.
- **Triết lý "Lựa chọn hơn nỗ lực":** Làm bán content là sao chép có chọn lọc từ những kênh đã chứng minh thành công thông qua chỉ số VPH và lượng view thực tế, áp dụng được cho mọi ngách từ triết lý, Phật pháp đến sức khỏe ở Nhật, Hàn, Mỹ hay Việt Nam.

---

## 3. Chiến Lược Cốt Lõi & Key Takeaways
1. Hướng dẫn dùng Claude làm bán content kiểu 70/30: lấy khoảng 70% cấu trúc của kịch bản đối thủ cho AI học, 30% còn lại để AI tự sáng tạo viết thêm; ví dụ ngách triết lý Nhật, kênh mới lập 5/5 (11 ngày trước), chỉ 1-2 video nổ là đủ lượt đăng ký và kiếm tiền.
2. Cách nạp dữ liệu: copy data của 2-3 kênh đối thủ (khoảng một nửa số video đã quét) dán vào Claude cùng câu lệnh phân tích kỹ; tác giả dùng model Opus 4.7 (đôi khi Sonnet 4.6); chọn video cao view theo chỉ số VPH, ví dụ video 1,3 triệu view cách 3 tuần, chỉ cần một video để cho AI học.
3. Nhân vật nổi tiếng: trong kịch bản đối thủ không dám đặt tên nhân vật vì dễ bị coi là không trung thực, nên chọn phương án ẩn danh (ban đầu để chưa quyết định); chọn viết template kịch bản master trước và chia thành 2 lần gửi lệnh, không gửi một lần vì dễ sai.
4. Đóng gói thành skill để lần sau chỉ cần dán kịch bản đối thủ vào; tiêu đề tạo ra dựa trên tiêu đề gốc chứ không copy nguyên, theo kiểu tạo tiêu đề tương tự.
5. Edit: kênh đối thủ ghép nhiều video tự nhiên, cắt khoảng 5-6 giây rồi chuyển cảnh, kèm thanh sóng âm thanh chạy trên video; phụ đề lấy bằng CapCut chỉ tương đối, không chính xác 100% nên khi làm thị trường Nhật có thể bị khán giả comment sai.

---

## 4. Quy Trình Thực Chiến Huấn Luyện Claude, Đóng Gói Skill & Edit Video (SOP)
- **Mục tiêu trọng tâm:** Train Claude bám theo kịch bản đối thủ (70% kịch bản gốc, 30% sáng tạo) cho ngách triết lý, đóng gói thành Skill tái sử dụng 1-click, tạo voice, dựng video sóng nhạc và tối ưu tiêu đề.
- **Các bước triển khai chi tiết:**
  - Copy dữ liệu 2 đến 3 kênh đối thủ cho Claude phân tích kỹ trước, sau đó chọn video cao view nhất của kênh (ví dụ video 1,3 triệu view có chỉ số VPH cao) để dán kịch bản vào cho AI học cấu trúc 10 lớp.
  - Yêu cầu Claude viết một form Prompt Master duy nhất dùng 70% kịch bản gốc cộng 30% sáng tạo, chia thành 2 bước gửi lệnh để kiểm soát đầu vào/đầu ra (output bắt buộc là kịch bản tiếng Nhật sạch trơn tru, không có chú thích hay ký tự thừa), sau đó đóng gói thành file Skill (`Script_Akihiro Miwa_JP`), đổi đuôi thành `.zip` và upload lên mục Skills của Claude.
  - Mỗi khi làm video mới: Mở một cuộc trò chuyện (New Chat) mới, dán toàn bộ kịch bản đối thủ vào và gõ dấu `/` gọi Skill ra chạy; sao chép kịch bản hoàn chỉnh đem tạo giọng đọc bằng ElevenLabs hoặc công cụ clone giọng.
  - Quy trình dựng trong CapCut (tỷ lệ 16:9): Ghép nhiều đoạn video thiên nhiên miễn phí cắt ngắn khoảng 5 đến 6 giây rồi chuyển cảnh; chèn ảnh nhân vật đã xóa nền tự động (đổi ảnh sau mỗi hơn 10 giây); ghép hiệu ứng sóng âm thanh phông xanh (Audio Waveform 4K từ Vecteezy) dùng tính năng xóa phông xanh (Chroma Key); chèn tên nhân vật bên dưới và tạo phụ đề bằng cách bấm trích xuất ở bảng chọn tiếng Nhật.
  - Tạo tiêu đề bằng form prompt riêng bám sát tiêu đề gốc của đối thủ, luôn giữ nguyên 100% từ khóa ngách (ví dụ `【美輪明宏】`) ở đầu tiêu đề, xuất ra 3 phiên bản để đưa vào tính năng thử nghiệm tiêu đề (A/B testing) của YouTube.

---

## 5. Cảnh Báo Đỏ & Rào Chắn Phòng Thủ (Avoid Flags)
- ⚠️ **Không gộp toàn bộ yêu cầu vào 1 câu lệnh duy nhất khi train:** Phải chia quá trình yêu cầu viết Prompt Master thành 2 lần gửi lệnh nối tiếp nhau, nếu nhồi vào 1 lần Claude rất dễ làm sai hoặc tách thành nhiều form rời rạc.
- ⚠️ **Không nhắc trực tiếp tên nhân vật nổi tiếng bên trong lời thoại kịch bản:** Đối thủ chỉ để tên nhân vật ở tiêu đề/thumbnail còn trong kịch bản phải dùng phương án ẩn danh để tránh bị YouTube quét lỗi nội dung không trung thực.
- ⚠️ **Kênh mới tuyệt đối không chỉ ghép 1 ảnh nền đen tĩnh với ảnh nhân vật:** Các kênh lớn lâu năm làm nền đen tĩnh có thể không bị quét, nhưng kênh mới bắt buộc phải ghép nhiều video thiên nhiên chuyển động liên tục (5-6 giây/cảnh) kèm sóng nhạc để né quét Reused Content / Không trung thực.
- ⚠️ **Không trích xuất phụ đề bằng cách bấm chuột phải trực tiếp vào thanh âm thanh trên timeline CapCut:** Cách đó sẽ làm phụ đề bị ngắt nhịp rất xấu; phải vào mục Văn bản -> Phụ đề tự động -> chọn ngôn ngữ tiếng Nhật rồi bấm Tạo.
- ⚠️ **Không đứng núi này trông núi nọ:** Tránh nhảy qua lại liên tục giữa các ngách; hãy chọn đúng 1 ngách và kiên trì làm theo quy trình.

---

## 6. Mốc Thời Gian Chi Tiết (Timestamps) & Công Cụ Sử Dụng
- **Công cụ & Nền tảng sử dụng:** `Claude` (Opus 4.7 / Sonnet 4.6), `Google Dịch`, `YouTube`, `ElevenLabs`, `CapCut`, `Vecteezy`
- **Timeline phân đoạn thực chiến:**
  - `00:00` (`0s`) — Giới thiệu kênh mẫu bán content triết lý Nhật Bản 11 ngày nổ view đủ bật kiếm tiền
  - `10:43` (`643s`) — Hướng dẫn cấu trúc prompt xào nấu 70% kịch bản đối thủ + 30% sáng tạo (chia 2 bước lệnh)
  - `22:04` (`1324s`) — Kỹ thuật đóng gói Skill Claude (`.zip`), gọi lệnh `/` tái sử dụng và tạo giọng đọc
  - `32:51` (`1971s`) — Demo quy trình tải video thiên nhiên và ghép phông xanh sóng âm (Audio Waveform) trong CapCut
  - `42:41` (`2561s`) — Hướng dẫn xử lý phụ đề tiếng Nhật, train prompt tạo 3 phiên bản tiêu đề giữ nguyên từ khóa `【美輪明宏】` và thử nghiệm A/B trên YouTube

---

## 7. Bộ Prompt Thực Chiến & Tài Nguyên Gốc Từ Tác Giả
- **Prompt 1 (Phân tích kênh đối thủ):**
  > đây là 2 kênh đối thủ và tôi đang định hướng sắp tới sẽ làm chủ đề này, trước tiên bạn hãy phân tích thật kỹ 3 kênh này, phân tích làm về chủ đề ngách gì... viết kịch bản như nào... độ trends ra sao... nếu cần tôi cấp kịch bản cao view nhất để bạn phân tích thêm thì hãy nói tôi sẽ cung cấp
- **Prompt 2 (Yêu cầu tạo Prompt Master 70/30 — Bước 1):**
  > Dựa trên phân tích toàn bộ 2 kênh và cấu trúc kịch bản tôi gửi và bạn đã phân tích, bây giờ tôi muốn đi theo hướng làm bán content, có nghĩa là sẽ bám theo những kịch bản viral nhất của họ đã làm lên rồi và tôi sẽ tận dùng làm tiếp, bạn hãy viết PROMPT HOÀN CHỈNH master để tôi có thể dùng lấy 70% nội dung kịch bản từ video gốc đối thủ + 30% bạn sáng tạo thêm, đồng thời tự động chia kịch bản thành nhiều phần theo đúng chuẩn yêu cầu phân tích
- **Prompt 3 (Tối ưu thành 1 Prompt Master duy nhất & lọc sạch chú thích — Bước 2):**
  > tôi cần bạn tối ưu lại chỉ 1 prompt master thôi và prompt đó tôi sẽ dùng thường xuyên và nhiều lần mỗi khi viết kịch bản cho video. lưu ý quan trọng: input sẽ là dán full kịch bản đối thủ bất kỳ kèm prompt master.. sau đó prompt sẽ phân tích.. và cho ra các dàn ý cụ thể chia từng phần, sau đó tiếp tục viết lại thành kịch bản hoàn chỉnh từng phần từ dàn ý trên và cuối cùng là lọc lại 1 lần nữa và cho ra file full kịch bản tất cả các phần hoàn thiện (không được có chú thích, ký tự đặc biệt dư thừa, lời nhắc...) full kịch bản phải trơn ru và chỉ việc đem đi tạo giọng đọc. Và lưu ý nhớ loại bỏ các yếu tố viết máy móc tránh bị ytb phát hiện là AI và phải viết như con người.
- **Prompt 4 (Đóng gói thành Skill):**
  > ok tốt rồi, bây giờ tôi muốn bạn lưu prompt master vừa tạo ra này thành skill luôn, mỗi khi tôi tạo new chat mới chỉ cần dán full kịch bản đối thủ vào và gọi skill ra thì là chạy luôn. hãy đặt tên skill cho tôi là: Script_Akihiro Miwa_JP. lưu ý chỉ lưu đúng prompt master đó thành skill
- **Prompt 5 (Tạo 3 phiên bản tiêu đề chuẩn CTR Nhật Bản):**
  > tiếp theo bạn hãy làm cho tôi prompt tạo tiêu đề từ những phân tích của các kênh đối thủ trên, với yêu cầu là phải bám theo đối thủ và làm ra lại tiêu đề mới mạnh hơn, tỉ lệ CTR cao hơn... input là tôi nhập tiêu đề gốc của đối thủ vào và output là ra 3 phiên bản mới đúng như yêu cầu của tôi. Lưu ý quan trọng phải giữ lại đúng 100% từ khóa ngách ví dụ như: 【美輪明宏】 luôn luôn ở đầu của tiêu đề.
- **Link video nền xanh sóng nhạc 4K:**
  - [https://www.vecteezy.com/video/77042599-music-audio-waveform-visualizer-equalizer-effect-green-screen-4k](https://www.vecteezy.com/video/77042599-music-audio-waveform-visualizer-equalizer-effect-green-screen-4k)
