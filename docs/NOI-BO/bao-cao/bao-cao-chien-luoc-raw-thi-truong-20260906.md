# Từ raw kênh đến mô hình YouTube bền vững

Ngày đối chiếu: **06/09/2026**. Phạm vi: dự án H2DEV, sản xuất không lộ mặt bằng AI, ưu tiên nội dung có căn cứ cho người trưởng thành. Đây là **xếp hạng ưu tiên thử nghiệm**, không phải chứng nhận ngách ít cạnh tranh, đã bật kiếm tiền hoặc có lợi nhuận.

## 1. Quyết định đề xuất

Nếu anh kiểm soát được tiếng Anh và chỉ khởi động một kênh, em ưu tiên **lịch sử đời sống qua đồ vật, thực phẩm và sinh hoạt**, phục vụ người muốn nghe một câu chuyện có thật, dễ hình dung, không cần nhìn màn hình liên tục. Định vị ban đầu nên hẹp: “Những thứ bình thường đã thay đổi cách chúng ta sống như thế nào?”. Không gom cả chiến tranh, triết lý, sức khỏe và vũ trụ vào cùng kênh.

**Phương án thứ hai:** khoa học tự nhiên kể chuyện, tập trung một miền như biển sâu hoặc các hệ thống tự nhiên. Dữ liệu lượt xem hiện tại mạnh hơn một số kênh lịch sử đời sống, nhưng việc kiểm chứng hình ảnh và giải thích khoa học khó hơn.

**Phương án thứ ba:** cơ chế đồ vật, dụng cụ và công nghệ quen thuộc. Có tín hiệu xem lặp lại ở nhiều chủ đề, nhưng cần hình vẽ đúng cơ chế; không phù hợp tuyệt đối với mục tiêu “chỉ nghe để ngủ”.

**Nhánh thương mại riêng đáng xem xét:** học tiếng Anh qua tình huống đời sống. Nhiều kênh raw đang có lượt xem cao. Tuy nhiên, đó là một sản phẩm học tập và có những kênh thiên về hoạt hình gia đình; chưa chứng minh là tệp trung niên Mỹ. Nếu chọn nhánh này, phải đổi giả thuyết khách hàng và cách kiểm tra chất lượng.

**Không giữ mặc định “Phật pháp Nhật đứng đầu” từ bảng cũ.** Chỉ ưu tiên khi có người kiểm duyệt tiếng Nhật và hiểu ngữ cảnh tôn giáo. Dữ liệu hiện tại không cho phép kết luận mọi kênh Nhật, mọi nội dung senior hoặc mọi video nghe chậm đều thuận lợi.

Không có bằng chứng để gọi bất kỳ lựa chọn nào là “luôn xanh”. Phần bền vững cần xây là nhu cầu quay lại, thư viện nội dung đúng và năng lực sản xuất có lãi. Chủ đề lâu lỗi thời vẫn có thể cạnh tranh mạnh hoặc không giữ được người xem.

## 2. Đã kiểm tra những gì, giới hạn ở đâu?

| Lớp dữ liệu | Phạm vi hoàn thành | Điều không được suy ra |
|---|---|---|
| Raw | Đọc 95/95 record, 419/419 dòng video OCR; phân lại 21 nhóm biên tập | 95 record không phải 95 kênh độc lập |
| Kênh core | Đọc metadata/ghi chú 161/161 record | Nhãn thị trường và ngách cũ không tự đúng |
| Danh mục ngách | Rà 34/34 record; bảng xử lý ở mục 12 | Điểm keyword tháng 8 không phải phép đo mới tháng 9 |
| Đối chiếu YouTube công khai | 243 khóa handle sau hợp nhất raw và core; lấy được trang có dữ liệu ở 221; 22 còn lỗi/không lấy được | Không đồng nghĩa xác nhận danh tính lịch sử của 221 kênh |
| Video công khai | Parser thu 5.445 dòng video trên trang đầu các kênh lấy được | Không phải 5.445 video đã xem; không phải toàn bộ lịch sử đăng |
| Bình luận | 84 record từ 7 video; 1/8 video chọn không lấy được bình luận | Không phải khảo sát đại diện, không suy ra tuổi hoặc nơi ở |
| Tài chính | Không có Analytics/AdSense riêng của các kênh mẫu | Không xác nhận RPM, lợi nhuận, YPP hoặc nguồn traffic |

Snapshot và phụ lục nằm trong [`_audit/20260906-raw-market`](../../../_audit/20260906-raw-market/). [95 raw cùng toàn bộ dòng OCR](../../../_audit/20260906-raw-market/appendix-raw-95.md), [243 handle và trạng thái đối chiếu](../../../_audit/20260906-raw-market/appendix-handles-243.md), [số liệu tổng hợp](../../../_audit/20260906-raw-market/channel-summary.json), [bình luận công khai](../../../_audit/20260906-raw-market/public-comments.json).

22 trường hợp chưa lấy được không được gọi là “kênh chết”. Có follow-up bằng URL channel ID: 2 trường hợp lấy được đã nhập kết quả, một trường hợp vẫn không có dữ liệu ban đầu. Các trạng thái gốc được giữ để truy vết.

Phương pháp so sánh dưới đây: trung vị lượt xem công khai của các video xuất hiện trên trang đầu, có nhãn tuổi từ **7 ngày đến 2 tháng**, quy đổi thô tuần/tháng để lọc. Ký hiệu **M; n** là trung vị và số video trong mẫu. Lượt xem và tuổi đều làm tròn. Đây không phải số xem D30, tốc độ tăng trưởng hay trung vị toàn kênh. Kênh đăng dày có cửa sổ mẫu khác kênh đăng thưa. Không dùng bảng này làm bảng xếp hạng lợi nhuận.

vidIQ trước đó trả lỗi insufficientCredits. Vì vậy, báo cáo **không có phép đo keyword/outlier mới đủ chuẩn để xác nhận cạnh tranh thấp**. Snapshot công khai bổ sung bằng chứng hoạt động và độ lặp lại, không thay thế dữ liệu đó.

## 3. Bốn sai lệch có thể làm anh chọn nhầm

**Đếm trùng tín hiệu.** 95 raw chỉ có 83 khóa handle khác nhau; 10 nhóm trùng tạo ra 12 record dư. Beyond the Blue xuất hiện 3 lần; Passion Learning cũng 3 lần. Đây không phải ba đối thủ độc lập cùng xác nhận một cơ hội. Raw hiện chỉ có hai cờ duplicateOf, chưa phản ánh toàn bộ trùng lặp.

**OCR sai đến 1.000 lần.** RAW-011 ghi một video của Dark Crimes History là 1,8 triệu view, trong khi kiểm tra lại ảnh bằng vision đọc được **1,8 nghìn**. Hai record RAW-038 và RAW-085 bị đặt tên “God’s Perspective” ở trường channel, nhưng ảnh và handle cho thấy lần lượt là HL Goo Daily English và 2ch英語スレ. RAW-063 có handle sai ở trường channel nhưng đúng trong OCR. Các phát hiện này được báo ở đây; chưa ghi đè dữ liệu gốc.

**Ngách của kênh thay đổi hoặc bị gán sai.** The Passive Explainer hiện có nội dung mẹo iPhone; không nên tiếp tục dùng làm bằng chứng trực tiếp cho lịch sử đời sống. “昔の人の知恵” có nội dung điện, làm mát, nhà ở: nên đọc là kiến thức ứng dụng. Một kênh senior Nhật thực tế kể tiểu sử người nổi tiếng; một kênh khác là truyện lịch sử. Cùng ngôn ngữ và giọng kể chậm không làm chúng thành cùng sản phẩm.

**Handle không đủ chứng minh danh tính qua thời gian.** RAW-091 chụp Everyday Explained 1,06K sub/10 video; handle hiện trả một kênh 3 sub/1 video cũ. The Helpful Christian hiện trả tên Lucas Smith. Chưa có canonical ID trên ảnh để nối chắc chắn, nên không kết luận tăng trưởng hay suy sụp. Ngày chạy OCR cũng không phải ngày chụp ảnh: không lấy chênh lệch sub chia số ngày từ OCR để tính tăng trưởng.

## 4. Lắng nghe khán giả trước khi chọn format

Tuổi 45–70 là phạm vi tuyển người thử nghe, **chưa phải tuổi khán giả đã xác nhận**. “Người lớn tuổi” cũng không đồng nghĩa cô đơn, rảnh rỗi hoặc thích được dạy cách sống. Nên chia theo tình huống sử dụng:

| Nhu cầu cần kiểm chứng | Họ muốn nhận được | Sản phẩm phù hợp | Lỗi dễ làm mất họ |
|---|---|---|---|
| Nghe khi nấu ăn, đi bộ, làm việc nhà | Theo được câu chuyện dù không nhìn | Lịch sử sinh hoạt, thực phẩm, câu chuyện khoa học | Nói “như hình này”, quá nhiều tên/ngày/số, nhảy ý |
| Thư giãn sau ngày dài | Tò mò vừa đủ, nhịp ổn định, không bị thúc ép | Khoa học kể chậm, lịch sử nhẹ nhàng | Nhạc/giọng đột ngột, câu hù dọa, kéo dài vô ích |
| Nhớ lại và hiểu thế giới từng sống | Chi tiết đúng, được tôn trọng trải nghiệm | Đồ vật, nhà ở, nghề nghiệp, thói quen cũ | Nói sai đồ dùng họ từng sử dụng, kể quá lời |
| Muốn hiểu thứ đang dùng | Giải thích cơ chế rõ, có ích | Công cụ, thiết bị, khoa học đời sống | Hình AI chạy sai, thumbnail không có trong video |
| Tìm ý nghĩa, thực hành đức tin | Ngữ cảnh đáng tin, sự đồng cảm | Một truyền thống cụ thể, giải nghĩa có nguồn | Trộn hệ phái, gán lời người nổi tiếng, hứa đổi vận |
| Học để sử dụng được | Nghe hiểu và nhớ được một tình huống | Tiếng Anh đời sống cho người lớn | Drama chiếm chỗ bài học, phát âm/ngữ pháp sai |

Mẫu bình luận đã đọc cho thấy những yêu cầu cụ thể:

- [Video wolf spider](https://www.youtube.com/watch?v=auKtFOo3grg): có người phản đối hình nhện không đúng loài và chất lượng AI. Bài học là hình minh họa phải khớp lời nói; chưa đủ dữ liệu để kết luận mọi người ghét giọng AI.
- [Video công cụ](https://www.youtube.com/watch?v=_lYp7I8JVLY): có phản hồi thumbnail không được giải đáp, chi tiết kỹ thuật sai và yêu cầu bớt footage AI. Lời hứa trong bao bì phải được thực hiện trong tập.
- [Video hộp cầu chì](https://www.youtube.com/watch?v=1iCnTzP2ETw): người bình luận kể kinh nghiệm nhà cũ, nghề nghiệp và phản biện chi tiết. Hoài niệm có thể tạo đối thoại, nhưng bình luận kỹ thuật vẫn cần nguồn độc lập để xác minh.
- [Video biển Nam Cực](https://www.youtube.com/watch?v=pZlzi5o6CD4): bên cạnh tò mò và thích nghe trước ngủ, có người chỉ lỗi đổi đơn vị, từ lặp và nhịp kể. “Nghe thư giãn” vẫn đòi hỏi biên tập chính xác.
- [Video nhà có sân trong ở Nhật](https://www.youtube.com/watch?v=kK9Zx7q2UNc): người xem quan tâm độ ẩm, diện tích đất, chi phí, bảo trì, tuyết và động đất. Dịch lời kể sang tiếng Nhật chưa giải quyết những nhu cầu đó.
- [Video James và Paul](https://www.youtube.com/watch?v=rpv0THFkKrI): có cả đánh giá tích cực và bất đồng diễn giải. Kênh đức tin cần công khai phạm vi truyền thống và cách xử lý khác biệt.

Cách lấy mẫu: video thứ tư hiển thị, hoặc video cuối nếu dưới bốn; trang bình luận đầu theo thứ tự mặc định. Có thiên lệch xếp hạng, tự lựa chọn và cỡ mẫu nhỏ. Dùng để đặt câu hỏi và sửa sản phẩm; không dùng để tính tỷ lệ nhu cầu toàn thị trường.

## 5. Xếp hạng ngách cho nguồn lực hiện tại

Thứ tự dưới đây là nhận định biên tập về mức phù hợp với mục tiêu của anh, dựa trên bằng chứng công khai và chi phí kiểm chứng dự kiến. Không gán điểm số giả chính xác hoặc xác suất thành công chưa đo.

| Ưu tiên | Cụm ngách và sản phẩm | Bằng chứng hiện tại | Bằng chứng ngược / điều kiện |
|---|---|---|---|
| **A1** | Lịch sử đời sống, thực phẩm, đồ vật; chuyện có thật dễ nghe | Crumb Lore M≈11.500;n26; The Origin ≈8.050;n24; History Beneath ≈5.150;n24 | Appetite for History ≈262;n24. Cùng chủ đề không bảo đảm đầu ra |
| **A2** | Khoa học tự nhiên kể chuyện; bắt đầu một miền kiến thức | Beyond the Blue ≈259.000;n16; nhiều video gần đây có sức xem | Kênh này bị đếm raw 3 lần; quy mô hiện tại lớn. Cần thêm đối chứng nhỏ và hình đúng |
| **A3** | Cơ chế công cụ, đồ vật và công nghệ đời sống | Mr Byte ≈16.000;n27; Workshop Decoded có nhiều chủ đề đạt hàng chục nghìn trở lên | Simple Concepts Explained ≈2.900;n27; Workshop chỉ 6 video và có phàn nàn kỹ thuật |
| **A4, có điều kiện** | Tiếng Anh qua tình huống, thiết kế riêng cho người lớn | Grace Daily English ≈76.000;n23; Family Life English ≈432.000;n23; HL Goo ≈56.000;n23 | Chưa biết địa lý/tuổi người xem; các mẫu hoạt hình gia đình không đại diện tệp senior. Cần giáo viên/biên tập ngôn ngữ |
| **B1** | Lịch sử tái dựng: một thành phố, một thời kỳ, một sinh hoạt | Animistry ≈122.000;n5; Worlds Before Us ≈15.000;n28 | Mẫu Animistry nhỏ; Arthur Revives ≈4.650;n10 dù từng có hit lớn. AI dễ sai kiến trúc/trang phục |
| **B2** | Khoa học nghe chậm, thư giãn | Calm Science ≈11.000;n27; No Fluff Academy ≈12.000;n21 | No Fluff Sleep ≈212;n23. Không coi thêm chữ sleep và kéo dài là lợi thế |
| **B3** | Kiến thức đời sống Nhật, cơ chế nhà ở và vật dụng | Hai kênh Nhật về kiến thức/công nghệ có nhiều video đang được xem | Cần người bản ngữ và kiểm chứng điều kiện Nhật; không lấy view của họ làm bằng chứng cho “triết lý senior” |
| **B4** | Giải nghĩa Kinh Thánh trong một truyền thống | Bible Made Clear, Scripture Made Simple, The Open Scriptures vẫn có tập mới được xem | Có kênh gần đây chỉ vài trăm view; tranh luận hệ phái; nhịp đăng dày không bảo đảm tin cậy |
| **B5** | Thiên nhiên quanh nhà, chim, côn trùng, thú cưng | Backyard Story có hit lớn trong raw; nguồn đề tài gần gũi | Hiện M≈1.300;n21; kênh chó Nhật ≈233;n6. Phải đúng loài, tránh bịa nguy cơ |
| **B6** | Địa lý văn hóa, đời sống các vùng | Happy Travel ≈68.500;n22; Best Travel ≈48.000;n23; Eon Atlas ≈17.000;n25 | View không chứng minh footage thật. Với AI 100%, nên làm bản đồ/giải thích, không giả trải nghiệm tại chỗ |
| **B7** | Lịch sử kinh doanh, thương hiệu, sản xuất | Có các mẫu đạt lượt xem; thư viện chủ đề rộng | Tony Talks Business ≈3.900;n27; Brand Report ≈221;n15. Không lấy nhãn finance để gán RPM cao |
| **C** | Senior wisdom tổng hợp, luật hấp dẫn, phong thủy cầu may | Có kênh và nhu cầu tìm ý nghĩa | Chưa chứng minh tính lặp lại phù hợp; dễ trượt sang hứa hẹn, gán lời, công thức rỗng |
| **C** | Sức khỏe senior, tài chính/pháp lý tư vấn, địa chính trị nóng | Có nhu cầu xã hội | Chi phí chuyên môn/cập nhật cao; đặc biệt không dùng persona AI giả chuyên gia |
| **C** | Tội phạm gây sốc, chiến tranh/động vật đau khổ, UFO khẳng định, hoạt hình reup | Có những hit trong raw | Rủi ro sai dữ kiện, quyền sử dụng, thao túng cảm xúc và kiếm tiền; không là đường khởi động đề xuất |

Nguồn số liệu: snapshot ngày 06/09, đối chiếu qua [Crumb Lore](https://www.youtube.com/@crumb.lore-yt/videos), [The Origin](https://www.youtube.com/@theorigin619/videos), [Beyond the Blue](https://www.youtube.com/@officialbeyondtheblue/videos), [Mr Byte](https://www.youtube.com/@mrbyte-exp/videos), [Workshop Decoded](https://www.youtube.com/@WorkshopDecoded/videos). Với handle có biến thể, dùng requestedHandle/canonical ID trong [phụ lục 243](../../../_audit/20260906-raw-market/appendix-handles-243.md) làm điểm tra cứu; không suy đoán ID từ tên hiển thị.

Các nhóm C không bị kết luận “không thể kinh doanh”. Chúng xếp sau **đối với yêu cầu cụ thể: AI, thông tin chuẩn, nguồn lực chưa rõ, xây thư viện lâu dài và phục vụ người trưởng thành**. Một đội có chuyên môn và quyền tư liệu sẽ có thứ tự khác.

## 6. Chọn thị trường: ngôn ngữ, người xem và doanh thu là ba việc khác nhau

| Thị trường / ngôn ngữ | Vị trí đề xuất | Sản phẩm nên thử | Điều kiện để tiến lên |
|---|---|---|---|
| **EN, hướng người trưởng thành Mỹ** | Lựa chọn đầu nếu QC tiếng Anh tốt | Lịch sử sinh hoạt, đồ vật, khoa học dễ nghe | Biên tập tự nhiên; nghiên cứu bối cảnh Mỹ; đo địa lý thực trong Analytics |
| **Nhật** | Lựa chọn đầu ngang EN chỉ khi có QC bản ngữ; nếu không xếp sau | Kiến thức đời sống địa phương; lịch sử sinh hoạt Nhật | Người hiểu văn hóa, phát âm, nhà ở, thói quen và nguồn Nhật |
| **Việt Nam** | Lựa chọn thực dụng nếu đây là ngôn ngữ anh kiểm soát tốt nhất | Chuyện đồ vật, thực phẩm, lịch sử đời sống có nguồn Việt | So chi phí thấp hơn với doanh thu thực; không mặc định RPM đủ sống |
| **Hàn Quốc** | Giai đoạn hai | Một chủ đề lịch sử/đời sống hẹp, phục vụ người trưởng thành | Thêm đối chứng long-form hiện tại, QC Hàn; phân biệt view Shorts |
| **Tây Ban Nha / Mexico** | Mở rộng có điều kiện | Đồ ăn, văn hóa, lịch sử sinh hoạt theo vùng | Chọn rõ Mexico hay vùng khác; kiểm chứng thị hiếu và địa lý thay vì dịch EN hàng loạt |
| **Bồ Đào Nha / Brazil** | Watchlist | Khoa học hoặc lịch sử sinh hoạt bản địa | Có mẫu Portuguese trong core nhưng chưa đủ hồ sơ cạnh tranh/khách hàng |
| **Đức** | Nghiên cứu trước khi sản xuất | Khoa học, cơ chế, lịch sử công nghiệp | Thiếu bằng chứng raw trực tiếp đủ mạnh; cần nguồn và QC Đức |

Pew 2025 cho thấy 85% người Mỹ 50–64 tuổi và 64% từ 65 tuổi nói từng dùng YouTube. Đây là bằng chứng nền tảng có tiếp cận người lớn tuổi; **không chứng minh họ cô đơn, nghe đêm hoặc là người xem các kênh trong kho**. [Nguồn và phương pháp Pew](https://www.pewresearch.org/internet/fact-sheet/social-media/).

Khảo sát ICT Nhật công bố tháng 7/2026 có 2.068 người dùng internet; báo cáo mức sử dụng YouTube 67,6%. Con số 16,7% của nhóm 60+ là cơ cấu người dùng YouTube trong bảng liên quan, không phải tỷ lệ mọi người 60+ dùng YouTube. Mẫu này khác Pew, không xếp hai nước bằng cách so trực tiếp tỷ lệ. [ICT Research & Consulting](https://ictr.co.jp/report/20260728.html/).

DataReportal 2026 ghi quy mô tiếp cận quảng cáo YouTube cuối 2025 khoảng 85 triệu ở Mexico và 62,1 triệu ở Việt Nam. Đây **không phải MAU, không phải số senior, không phải mức RPM**. Dùng để xác nhận thị trường rộng, không để dự báo thu nhập. [Mexico](https://datareportal.com/reports/digital-2026-mexico), [Việt Nam](https://datareportal.com/reports/digital-2026-vietnam).

Một video tiếng Anh có thể được xem ở nhiều quốc gia. Tên kênh, ngôn ngữ hoặc quốc gia khai báo của chủ kênh không cho biết tỷ trọng khán giả Mỹ. YouTube giải thích giá quảng cáo thay đổi theo địa lý, mùa và loại quảng cáo; cần đo RPM riêng sau khi có dữ liệu. [YouTube: doanh thu quảng cáo](https://support.google.com/youtube/answer/9314357?hl=en).

## 7. Ba phương án sản phẩm cụ thể

### Phương án chính: Everyday Life, Explained Through History

**Lời hứa:** mỗi tập giải đáp một câu hỏi quen thuộc bằng một câu chuyện có nguồn; người nghe hiểu được kể cả lúc không nhìn. Độ dài thử 10–16 phút, không kéo dài để đủ quảng cáo. Dùng một giọng ổn định, nhạc nhẹ nếu hữu ích, sơ đồ và minh họa AI có ghi rõ tái dựng.

Ba trụ thử trong cùng nhu cầu nghe: (1) đồ vật trong nhà, (2) cách bảo quản/nấu/ăn, (3) sinh hoạt trước hạ tầng hiện đại. Không gọi là kênh “mọi thứ lịch sử”.

Sáu đề bài mẫu **cần nghiên cứu trước khi viết**, chưa khẳng định sẵn câu trả lời:

1. Trước tủ lạnh điện, gia đình ở một thành phố cụ thể giữ thức ăn thế nào?
2. Chiếc gương đi từ vật liệu và cách chế tạo nào tới đồ dùng phổ biến?
3. Giặt quần áo thay đổi ra sao khi nước máy và điện xuất hiện?
4. Vì sao một loại bao bì thực phẩm được chấp nhận rồi thay thế?
5. Một công cụ nhà bếp thay đổi việc nấu ăn trong hoàn cảnh nào?
6. Đồng hồ trong nhà ảnh hưởng lịch làm việc và sinh hoạt ra sao?

Mỗi đề bài giới hạn địa điểm/thời kỳ. “Người xưa” hoặc “cả nước Mỹ” không phải phạm vi nghiên cứu đủ chính xác. Giữ hình dung cuộc sống và nhân quả làm trung tâm; ngày tháng chỉ đưa khi giúp hiểu.

**Lợi thế cần xây:** hồ sơ nguồn theo đồ vật, thư viện hình đúng thời kỳ, cách kể rõ, khả năng nhận và sửa lỗi. Không lấy việc dùng cùng bộ prompt của đối thủ làm lợi thế.

### Phương án dự phòng: Quiet Natural Science

Chọn một miền như biển sâu. Mỗi tập một câu hỏi, giải thích bằng các cơ chế và quan sát đã được xác nhận. Tách dữ kiện khỏi giả thuyết khoa học; nêu giới hạn hiểu biết đúng mức. Thử 12–20 phút trước khi nghĩ tới tập dài một giờ.

AI phù hợp sơ đồ, mô phỏng khái niệm và tái dựng có nhãn. Không để sinh vật sai loài hay hành vi tưởng tượng trở thành “bằng chứng quay được”. Cần kiểm tra tỷ lệ, đơn vị, môi trường sống và chuyển động. Nếu không làm đúng được bằng video AI, dùng hình tĩnh/sơ đồ đúng, thay vì tạo cảnh đẹp nhưng sai.

### Phương án có chuyên môn: Everyday English for Adults

Đổi lời hứa thành “nghe hiểu một tình huống và sử dụng lại được”. Nhắm một trình độ cụ thể, không mặc định mọi người già cần nội dung trẻ con. Tình huống: hỏi đường, mua sắm, gặp hàng xóm, đi lại, kể chuyện trong gia đình. Có phần nghe tự nhiên, giải thích ngắn và thực hành nhớ lại.

Nhân vật và truyện phải nguyên bản. Không dùng trẻ gặp nạn hoặc drama liên tục chỉ để giữ người xem. Đo hiểu bài và muốn học tiếp bên cạnh retention; một video giữ chân nhờ kịch tính nhưng không dạy được điều đã hứa là sai sản phẩm.

## 8. “100% AI” vận hành thế nào để thông tin vẫn đáng tin?

AI có thể tạo tài sản hình, giọng và hỗ trợ nghiên cứu; **mọi kết luận thực tế vẫn cần nguồn và người chịu trách nhiệm biên tập**. Không có cơ sở để hứa quy trình tự chạy không kiểm duyệt vẫn luôn đúng.

Luồng sản xuất đề xuất:

1. **Câu hỏi khán giả:** một tình huống xem, một điều họ muốn hiểu. Ghi cả điều họ đã biết để tránh giảng dạy dài dòng.
2. **Hồ sơ nguồn:** ưu tiên bảo tàng, tài liệu lưu trữ, cơ quan nghiên cứu, bài nghiên cứu hoặc tài liệu kỹ thuật phù hợp. Dùng nguồn thứ cấp tốt để tìm đường, không lấy lời AI làm nguồn.
3. **Sổ dữ kiện:** từng phát biểu quan trọng gắn URL, đoạn hỗ trợ, ngày truy cập, địa điểm/thời kỳ, mức chắc chắn. Hai bài sao chép cùng một nguồn không phải hai xác minh độc lập.
4. **Kịch bản nguyên bản:** viết từ câu hỏi và nguồn, không lấy 70% lời/chuỗi lập luận của một video rồi thay từ. Phân biệt sự kiện, diễn giải và tái dựng.
5. **Kiểm tra trước tạo tài sản:** lỗi sự kiện, mâu thuẫn, tên riêng, con số, đơn vị, thời lượng thật, lời hứa tiêu đề. Nghe bản đọc trước khi chi tiền render hàng loạt.
6. **Hình ảnh và âm thanh:** hình đúng chi tiết cần hiểu; chữ lớn; không giật âm lượng; không bắt buộc nhìn để theo dõi tuyến kể chính. Kiểm tra cả trên điện thoại và TV nếu có.
7. **Kiểm duyệt cuối:** đối chiếu từng cảnh có dữ kiện, hình và lời; quyền sử dụng tài sản; nhãn AI theo yêu cầu áp dụng. Lưu bản dự án, nguồn và các lần sửa.
8. **Sau xuất bản:** phân loại góp ý, xác minh lỗi, sửa công khai khi có lỗi trọng yếu; đưa bài học vào hồ sơ nguồn.

YouTube yêu cầu nội dung nguyên bản, có giá trị khác biệt giữa các tập; nội dung AI sản xuất theo mẫu chung chung hoặc lặp lại có thể không đủ điều kiện kiếm tiền. Nội dung tái sử dụng và bản quyền là hai lớp đánh giá khác nhau. Chính sách hiện có mục persona AI giả chuyên gia ở chủ đề nhạy cảm; không áp dụng suy diễn rằng mọi video giáo dục liên quan sức khỏe đều bị cấm. [Chính sách kiếm tiền](https://support.google.com/youtube/answer/1311392?hl=en).

Nội dung tổng hợp/thay đổi có vẻ thật cần công bố trong các trường hợp YouTube quy định; công bố không thay thế chất lượng và kiểm chứng. [Hướng dẫn công bố](https://support.google.com/youtube/answer/14328491?hl=en).

## 9. Pilot gương hiện tại chưa sẵn sàng sản xuất

File [`master-script.md`](../../../raw-niches/US_EverydayHistory/PILOT-01-THE-MIRROR/master-script.md) có khoảng **355 từ phần lời đọc**, dù ghi 1.400–1.600 từ và 10–12 phút. Thời lượng ghi đầu file chưa được nội dung hỗ trợ; cần đo bằng bản đọc thực.

Các mệnh đề như con người hàng nghìn năm không biết diện mạo của mình, thợ phần lớn chết trước tuổi 30, liên hệ vampire với mốc tráng bạc 1835, hoặc tự nhận thức xuất hiện nhờ gương đều cần kiểm chứng riêng. Không nên làm hook từ chúng khi chưa có nguồn.

The Met có hiện vật gương đồng cổ, cho thấy tuyến kể chỉ có nước rồi obsidian rồi gương hiện đại bỏ sót một mắt xích quan trọng. Versailles xác nhận 357 gương và bối cảnh cạnh tranh với Venice; nguồn đó không tự chứng minh mọi chi tiết giật gân về đầu độc hoặc tuổi thọ thợ. [The Met](https://www.metmuseum.org/art/collection/search/256949), [Versailles](https://www.chateauversailles.fr/decouvrir/domaine/chateau/galerie-glaces).

Đề xuất giữ câu hỏi thú vị, viết lại từ hồ sơ nguồn theo các loại gương và phạm vi xã hội cụ thể, rồi mới tạo ảnh/voice. Trong lượt phân tích này chưa sửa hoặc sản xuất pilot.

## 10. Kinh tế: dùng điểm hòa vốn, không dùng lời hứa RPM

Chi phí toàn phần của một tập = nghiên cứu + viết/biên tập + ngôn ngữ/chuyên môn + tạo tài sản và lần tạo lỗi + dựng/QC + phần mềm phân bổ + giá trị thời gian của anh. Chi phí tiền mặt và chi phí toàn phần phải theo dõi riêng.

Ví dụ dưới đây là **kịch bản tính toán**, không phải báo giá sản xuất hoặc dự báo RPM của thị trường. “RPM mô hình” là doanh thu trên 1.000 view theo một phạm vi thống nhất, sau chia sẻ nền tảng, trước thuế và chi phí sản xuất.

| Chi phí toàn phần/tập | RPM mô hình $1,5 | RPM mô hình $3 | RPM mô hình $6 |
|---|---:|---:|---:|
| $30 | 20.000 view hòa vốn | 10.000 | 5.000 |
| $60 | 40.000 | 20.000 | 10.000 |
| $120 | 80.000 | 40.000 | 20.000 |

Công thức: **view hòa vốn = chi phí × 1.000 / RPM**. Ví dụ tập $60 cần 20.000 view ở RPM $3. Nếu mức xem trưởng thành thực chỉ 5.000, doanh thu mô hình là $15, vẫn lỗ $45. Giảm lỗi render có ích, nhưng không cứu một sản phẩm chưa có người quay lại.

Ví dụ vận hành: 8 tập/tháng × $60 = $480, thêm $120 chi phí cố định = $600. Ở RPM $3 cần 200.000 view/tháng để hòa vốn, gồm tập mới và thư viện. Muốn dư $1.000 trước thuế cần khoảng 533.334 view/tháng. Các con số này không chứng minh kênh sẽ đạt được mức đó.

Trước khi bật chia sẻ doanh thu, dự toán quảng cáo nhận về **$0**. Không tính các view trước kiếm tiền như doanh thu được truy lĩnh. Phải có đủ tiền để hoàn thành thử nghiệm mà không phụ thuộc vào ngày được duyệt YPP.

AIR công bố dữ liệu 300 kênh, 3.595 channel-month từ 05/2025–05/2026; nhóm Education & Science có median RPM $10,22 nhưng khoảng phân vị 25–75 rất rộng, $2,31–$19,50. Mẫu đối tác và phân nhóm rộng không đại diện kênh mới của anh. Không lấy $10,22 nhân view raw để gọi đó là thu nhập thật. [AIR: phương pháp và bảng dữ liệu](https://air.io/en/air-data-findings/which-youtube-niche-makes-the-most-money-in-2026-ranked-by-real-rpm-and-cpm).

Nếu dùng RPM tổng của Studio đã gồm một số nguồn thu, không cộng lại chúng lần hai. Affiliate, tài trợ, sản phẩm số là những dòng thu riêng chỉ đưa vào khi có bằng chứng chuyển đổi. Không bán trước một khóa học hay gói tư vấn chỉ vì kênh có view.

Video từ 8 phút có thể bố trí mid-roll khi đủ điều kiện; một vị trí không bảo đảm quảng cáo được phát. Đối với sản phẩm nghe thư giãn, nhồi điểm ngắt có thể phá trải nghiệm. Ưu tiên nhịp nghỉ tự nhiên và kiểm tra phản hồi. [YouTube: mid-roll](https://support.google.com/youtube/answer/6175006?hl=en).

## 11. Kế hoạch 90 ngày và điều kiện ra quyết định

Chưa có câu trả lời về ngân sách và năng lực kiểm duyệt ngoại ngữ. Kế hoạch cơ sở giả định **một kênh, một ngôn ngữ, khoảng 1–2 tập/tuần sau giai đoạn chuẩn bị**. Đây là mức tổ chức thử nghiệm, không phải yêu cầu thuật toán.

### Ngày 1–14: khóa sản phẩm trước khi mở dây chuyền

- Chọn A1 nếu QC EN đủ tốt; nếu không, chọn thị trường anh kiểm soát ngôn ngữ tốt hoặc bố trí người QC trước.
- Làm hồ sơ 18 đề tài, ba trụ × sáu đề tài; giữ sáu đề tài có nguồn tốt và câu hỏi rõ nhất để khởi động.
- Hoàn thiện hai pilot và đo chi phí toàn phần. Không làm cả sáu khi chưa nghe bản đọc và kiểm tra nguồn của hai tập đầu.
- Tuyển 5–8 người phù hợp tình huống nghe, có thể gồm người 45–70 tuổi. Hỏi họ thường mở nội dung gì, lúc nào bỏ nghe, có thể kể lại điều gì sau tập. Đây là thử nghiệm định tính nhỏ, không phải ước lượng thị trường.
- Chỉ qua cửa sản xuất khi không còn lỗi thực tế trọng yếu đã biết, người thử hiểu lời hứa và tuyến kể, và chi phí nằm trong mức chịu lỗ đã định.

### Ngày 15–45: tạo đủ quan sát, sửa một vấn đề mỗi lần

Xuất bản khoảng sáu tập thuộc ba trụ. Ghi theo từng tập tại D7 và D28: impressions, nguồn traffic, CTR theo nguồn, retention 30 giây, thời lượng xem trung bình, điểm rơi lớn, người đăng ký, chi phí và lỗi phát sinh. Không so video 24 giờ với video một tháng.

Không đặt một CTR “chuẩn” áp cho mọi nguồn, mọi độ dài. Nếu ít impressions, chưa kết luận khán giả từ chối. Nếu impressions có nhưng ít click, kiểm tra lời hứa/tiêu đề/thumbnail. Nếu click rồi thoát, kiểm tra đoạn mở và sự khớp lời hứa. Nếu xem khá nhưng không muốn tập kế, kiểm tra mức gắn kết giữa các chủ đề và giá trị quay lại. Không thay cả tiêu đề, giọng, độ dài và chủ đề một lúc rồi không biết yếu tố nào tác động.

### Ngày 46–75: chọn trụ có khả năng lặp lại

Làm thêm khoảng sáu tập, thiên về trụ có tín hiệu tốt hơn trong cùng độ tuổi video và nguồn traffic. **Cửa quản trị đề xuất**, không phải chuẩn YouTube: cần ít nhất ba tập thuộc cùng trụ có tín hiệu tốt lặp lại so với nền của chính kênh, không chỉ một hit; chi phí vẫn trong trần; không có lỗi trọng yếu; xuất hiện bằng chứng muốn xem tiếp hoặc người quay lại.

Chưa qua cửa thì sửa sản phẩm trong giới hạn ngân sách. Không giải thích mọi thất bại bằng “thuật toán chưa đẩy”; cũng không tuyên bố ngách chết từ vài tập ít được phân phối.

### Ngày 76–90: quyết định tiếp tục, thu hẹp hoặc dừng

Đánh giá D28 cho các tập đã đủ tuổi; tập mới hơn chỉ dùng để theo dõi sớm. Tách ba câu hỏi: (1) người xem có muốn sản phẩm, (2) đội có làm đúng và đều được, (3) kinh tế có đường tới hòa vốn.

**Tiếp tục** khi có cụm thắng lặp lại, khán giả quay lại, chi phí kiểm soát được và kịch bản doanh thu thận trọng hợp lý. **Thu hẹp/đổi cách trình bày** khi một trụ hoạt động nhưng các trụ khác yếu. **Tạm dừng chi thêm** khi đã chạm trần ngân sách, chưa có mẫu lặp lại hoặc chất lượng chỉ đạt được với chi phí vượt khả năng kinh doanh. Việc dừng là quyết định vốn của dự án, không phải chứng minh toàn ngách vô dụng.

Ngân sách có thể tổ chức theo ba mức: dưới $300 tiền mặt thì chỉ nên làm ít pilot tiết kiệm, chưa đủ test nhiều thị trường; $300–$1.000 tập trung một kênh và ưu tiên QC; trên $1.000 vẫn không mở nhiều kênh trước khi có tín hiệu lặp lại. Đây là giới hạn phân bổ đề xuất; số tập thực tế phụ thuộc chi phí đã đo, không phải cam kết đủ ngân sách.

## 12. Xử lý đủ 34 ngách hiện có

Các hàng giữ thứ tự danh mục cũ; “A/B/C” tương ứng ưu tiên trong báo cáo, không tự thay field xanh của data core.

| # | Ngách hiện có, tên rút gọn | Quyết định mới |
|---|---|---|
| 1 | Kinh Thánh EN | B4; một truyền thống, nguồn và QC diễn giải |
| 2 | Phật pháp Nhật | B có điều kiện ngôn ngữ/chuyên môn; bỏ mặc định đứng đầu |
| 3 | Sức khỏe Nhật | C cho khởi động; cần chuyên môn, không persona giả bác sĩ |
| 4 | Sức khỏe Việt | C; cùng nguyên tắc, lợi thế tiếng Việt không thay thế chuyên môn |
| 5 | Phong thủy Việt | C nếu hứa đổi vận; nghiên cứu văn hóa/tín ngưỡng là sản phẩm khác |
| 6 | Chúa Hàn | B có điều kiện QC Hàn và truyền thống |
| 7 | Luật hấp dẫn | C; không biến niềm tin thành kết quả khoa học được bảo đảm |
| 8 | Danh ngôn Nhật | C nếu đọc/gán lời; tiểu sử có nguồn là nhánh lịch sử riêng |
| 9 | Senior Nhật | Tách truyện, tiểu sử, đời sống; chưa xếp hạng được như một ngách đồng nhất |
| 10 | May mắn Hàn | C nếu hứa hẹn; văn hóa có nguồn cần kiểm chứng riêng |
| 11 | Khoa học / Trái Đất | A2; chọn một miền và kiểm tra hình khoa học |
| 12 | Phật pháp Hàn | B có điều kiện; không lấy kênh Shorts làm chứng cứ long-form |
| 13 | Kinh tế Hàn | B7 cho lịch sử kinh tế; C cho tư vấn hoặc tin nóng thiếu chuyên môn |
| 14 | Kinh tế Nhật | B7 có QC bản địa; không gán RPM từ nhãn |
| 15 | Kaidan Nhật | B cho truyện nguyên bản ghi rõ hư cấu; ngoài tuyến factual chủ lực |
| 16 | Sức khỏe Hàn | C cho khởi động; kiểm chứng và chuyên môn bắt buộc |
| 17 | Nhà máy / sản xuất | B7; giải thích cơ chế, không giả footage dây chuyền thật |
| 18 | Địa chính trị | C với đội hiện tại; chi phí cập nhật và tranh chấp cao |
| 19 | Quân sự | C cho thời sự/giật gân; lịch sử kỹ thuật có nguồn xét riêng |
| 20 | Stoicism / triết lý | B cho giải nghĩa văn bản có nguồn; C cho motivational template |
| 21 | Lịch sử kinh tế | B7; kiểm tra luận điểm nhân quả và nguồn số liệu |
| 22 | Reup hoạt hình | C; quyền và giá trị nguyên bản phải giải quyết trước |
| 23 | Yadam Hàn | B có QC, truyện nguyên bản/nguồn rõ; không tự gọi là sự kiện thật |
| 24 | Sinh tồn Việt | C nếu giả trải nghiệm/hướng dẫn nguy hiểm; lịch sử sinh tồn xét riêng |
| 25 | Stick figure | Đây là cách thể hiện; xếp theo nội dung thực, không một ngách tự thân |
| 26 | Trẻ em Hàn | C cho mục tiêu người trưởng thành; sản phẩm/chuẩn chất lượng riêng |
| 27 | Tiền sử / Canada Police bị trộn | Tách trước: tiền sử giáo dục thuộc A2/B; police thuộc nhánh khác |
| 28 | Sinh học combat | C nếu khai thác đau khổ; giáo dục hành vi động vật xét A2/B5 |
| 29 | Wildlife | A2/B5 cho giáo dục đúng; C cho rescue/peril giả |
| 30 | Everyday History | A1; phạm vi sinh hoạt hẹp, không dựa nhãn kênh cũ |
| 31 | True Origin | Gộp A1 khi thực là nguồn gốc đồ vật; tránh hook “sự thật bị che giấu” vô căn cứ |
| 32 | Food History | A1; giữ như trụ cạnh đồ vật hoặc tách sau khi có dữ liệu |
| 33 | UFO | C cho khởi động; hồ sơ lời kể không tự chứng minh hiện tượng |
| 34 | Senior Hàn | Tách nhu cầu thực và format; chưa đủ để coi một thị trường xanh đồng nhất |

Các thư mục DE_ScienceParadox, JP_PhatPhap, KR_SeniorWisdom, MX_MythologyStories, US_EverydayHistory, VN_TrietLy chủ yếu mới có khung README. Sự tồn tại của thư mục không được tính là bằng chứng thị trường hay quy trình đã chạy thành công.

## 13. Từ 3 tháng tới 12 tháng

**Tháng 1–3:** chứng minh một lời hứa có người quay lại với chi phí phù hợp. Tài sản quan trọng nhất là dữ liệu từng tập, hồ sơ nguồn và khả năng sửa sản phẩm.

**Tháng 4–6:** mở rộng bên trong trụ đã có tín hiệu, tạo các tập liên quan để người xem chọn tiếp; cải thiện tập cũ khi có lỗi hoặc thông tin mới. Chỉ làm tập dài/tuyển tập khi tuyến nội dung đủ giá trị và trải nghiệm nghe đã được kiểm tra; không ghép hàng loạt để tăng thời lượng.

**Tháng 7–12:** xem doanh thu và phần đóng góp từ thư viện, tỷ lệ người quay lại, thời gian xử lý mỗi tập, số lỗi phải sửa. Chỉ thêm ngôn ngữ khi có nhu cầu phù hợp, người QC và kinh tế đủ tốt; dịch còn phải nghiên cứu lại bối cảnh. Chỉ thêm kênh khi kênh đầu đã có quy trình và bằng chứng, không vì còn nhiều thư mục ngách.

Đề xuất nhịp kiểm tra: hàng tuần đọc phản hồi/lỗi; hàng tháng đo cùng một cohort video và chi phí; mỗi quý xem lại các nguồn/chính sách biến động. Đây là lịch vận hành đề xuất, chưa tạo automation.

## 14. Kết luận quyết định

**Có bằng chứng:** các cụm lịch sử sinh hoạt, khoa học tự nhiên, công cụ và tiếng Anh có những kênh hiện đang được xem; một số có nhiều tập đạt tín hiệu lặp lại. Có phản hồi khán giả cụ thể về độ chính xác, tính hữu ích, lời hứa thumbnail và trải nghiệm nghe.

**Không có cơ sở để khẳng định:** ngách luôn xanh, xác suất kiếm tiền gần chắc chắn, kênh tiếng Anh đồng nghĩa khán giả Mỹ, 39 nhãn monetized trong OCR là 39 kênh YPP đã được xác minh, hoặc AI tự động có thể bỏ qua biên tập.

**Chưa xác minh được:** cạnh tranh keyword hiện tại theo cùng thị trường, doanh thu/chi phí đối thủ, tuổi/địa lý thực của phần lớn người xem, hiệu quả của chính kênh anh. Đây là lý do phải thử có giới hạn, không phải lý do dừng phân tích.

Quyết định vốn đề xuất: **một kênh lịch sử đời sống có nguồn ở ngôn ngữ anh kiểm soát được; hai pilot trước, khoảng 12 tập để quan sát ban đầu, một lần đánh giá sau 90 ngày.** Khoa học tự nhiên là lựa chọn dự phòng; tiếng Anh là một nhánh kinh doanh khác nếu anh có năng lực giáo dục ngôn ngữ. Chỉ tăng sản lượng khi người xem và chi phí cùng cho thấy đường đi.
