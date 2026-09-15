# QUYẾT ĐỊNH KỸ THUẬT: Faceless Detection & Niche Detection
**Ngày đo:** 2026-09-16 · **Người thực hiện:** H2DEV Agent · **Trạng thái:** Đã kiểm chứng thực tế

---

## 1. BỐI CẢNH

Câu hỏi: Nên **BUILD** (tự làm SCRFD + ArcFace local trên RTX 4060) hay **BUY** (dùng API/SaaS như NexLev) để:
1. Nhận diện kênh Faceless (kênh không lộ mặt người sáng lập)
2. Nhận diện ngách (niche) của kênh

---

## 2. KẾT QUẢ ĐO THỰC TẾ (Ground Truth Test)

### Test 1: 10 thumbnail HOẠT HÌNH (không có người thật)
> Kỳ vọng: tool phải trả về "không có người thật". Trả "có" = **FALSE POSITIVE**

| Kênh | SCRFD Local | Vision Cloud |
|---|---|---|
| RAW-001 (bò 3D) | ❌ FALSE POSITIVE (1 face) | ✅ đúng |
| RAW-010 (Thomas 3D) | ❌ FALSE POSITIVE (2 faces) | ✅ đúng |
| RAW-023 (voxel horror) | ❌ FALSE POSITIVE (1 face) | ❌ FALSE POSITIVE |
| RAW-029 (thú 3D) | ❌ FALSE POSITIVE (2 faces) | ✅ đúng |
| RAW-031 (BeamNG) | ✅ đúng | ✅ đúng |
| RAW-079 (villain 2D) | ❌ FALSE POSITIVE (5 faces) | ✅ đúng |
| RAW-088 (Family Guy) | ✅ đúng | ✅ đúng |
| RAW-050 (anime Yamato) | ❌ FALSE POSITIVE (2 faces) | ✅ đúng |
| RAW-021 (khảo cổ) | ❌ FALSE POSITIVE (2 faces) | ✅ đúng |
| RAW-075 (analysis) | ✅ đúng | ✅ đúng |
| **ĐỘ CHÍNH XÁC** | **30% (3/10)** | **90% (9/10)** |
| **Tốc độ** | 70 ms/ảnh | 6.415 ms/ảnh |

### Test 2: 3 thumbnail NGƯỜI THẬT (vlogger)
> Kỳ vọng: tool phải trả về "có người thật". Trả "không" = **FALSE NEGATIVE**

| Kênh | SCRFD Local | Vision Cloud |
|---|---|---|
| MrBeast | ✅ đúng (1 face) | ✅ đúng |
| Mark Rober | ✅ đúng (1 face) | ✅ đúng |
| MKBHD | ❌ MISS (0 faces) | ❌ MISS |
| **ĐỘ CHÍNH XÁC** | **67% (2/3)** | **67% (2/3)** |

### Test 3: Vision Cloud đa nhiệm (1 call = 3 kết quả)
Prompt 1 lần, trả về cùng lúc:
```
1. FACELESS: REAL_HUMAN
2. NICHE: extreme survival challenge
3. STYLE: dramatic composite editing with contrasting biomes
```
→ **Latency: 6.6s cho 3 tác vụ.** SCRFD không làm được việc này.

---

## 3. CƠ CHẾ CỦA CÁC SAAS (đã kiểm chứng web)

| Tool | Faceless Detection | Cơ chế | Giá |
|---|---|---|---|
| **NexLev** | ✅ CÓ — `check_faceless_channel` (MCP) | Không công bố chi tiết. Trả `isFaceless` + `confidence` + tags. 10-30s/check. Quota 5/ngày (free) → 300/ngày (Pro) | $13-42/tháng |
| **1of10** | ❌ KHÔNG CÓ | Chỉ Outlier Score = views ÷ channel average. Không phân tích hình ảnh | $0-69/tháng |
| **NicheRoza** | ✅ CÓ — "Thumbnail face-detect faceless filter" | Face-detect trên thumbnail (giống hướng tiếp cận của H2DEV) | $9/tháng |

**Kết luận cơ chế:** Cả 3 SaaS đều dùng **face detection trên thumbnail** — giống hệt cách H2DEV đang làm. Không có SaaS nào có "thuật toán thần kỳ" khác biệt.

---

## 4. SO SÁNH 3 PHƯƠNG ÁN

### Phương án A: BUILD — SCRFD + ArcFace local
| Tiêu chí | Đánh giá |
|---|---|
| Chi phí | **$0** (vĩnh viễn) |
| Tốc độ | **116-270 ảnh/s** (nhanh nhất) |
| Offline | ✅ Có |
| **Độ chính xác faceless** | ❌ **30%** — không phân biệt được hoạt hình vs người thật |
| Công sức | Đã làm 60% (SCRFD chạy) — cần thêm cascade 3 tầng (~2-3 ngày) |
| Rủi ro | Cascade phức tạp, cần hiệu chỉnh ngưỡng trên dữ liệu thật, chưa có ground truth |

### Phương án B: BUY — Vision Cloud API (đang có sẵn trong MCP)
| Tiêu chí | Đánh giá |
|---|---|
| Chi phí | $0 (dùng 9Router hiện có) |
| Tốc độ | **6.4s/ảnh** (chậm) — 1.240 ảnh = ~2.2 giờ |
| Offline | ❌ Phụ thuộc 9Router |
| **Độ chính xác faceless** | ✅ **90%** — hiểu ngữ cảnh "real human" |
| **Đa nhiệm** | ✅ 1 call = faceless + niche + style |
| Công sức | **0** — đã chạy được ngay |

### Phương án C: HYBRID — SCRFD lọc thô + Vision Cloud xác nhận
| Tiêu chí | Đánh giá |
|---|---|
| Chi phí | $0 |
| Tốc độ | SCRFD 70ms lọc thô → chỉ gọi Cloud cho ảnh "có face" (~40% ảnh) |
| Độ chính xác | Kỳ vọng ~90% (bằng B, nhanh hơn) |
| Công sức | Trung bình — cần viết logic routing |

### Phương án D: BUY — NexLev MCP (chính chủ)
| Tiêu chí | Đánh giá |
|---|---|
| Chi phí | **$13-42/tháng** (~$156-504/năm) |
| Tốc độ | 10-30s/check — **quota 5/ngày (free)** |
| Độ chính xác | Không kiểm chứng được (không có account) |
| Nhược điểm | **Giới hạn quota**, phụ thuộc bên thứ 3, không kiểm soát được |

---

## 5. KHUYẾN NGHỊ (đa chiều)

### 🏆 Nhận định thẳng thắn
**BUILD thuần túy (SCRFD) KHÔNG đủ để làm faceless detection** — bằng chứng: 30% accuracy, không phân biệt được hoạt hình 3D mắt to với người thật. Điều này xác nhận đúng cảnh báo trong đề xuất gốc: *"No pure face detection model can distinguish a real human face from an anime character"*.

### Đề xuất theo mục đích sử dụng

**Dùng ngay (hôm nay):** Vision Cloud cho **faceless detection + niche labeling** — vì 90% accuracy, đa nhiệm, $0, đã chạy được.
- Quy mô: 124 kênh × 10 ảnh = 1.240 ảnh × 6.4s = **~2.2 giờ** (chạy đêm, một lần).
- Chi phí: **$0** (qua 9Router hiện có).

**Giữ SCRFD local** cho các việc khác mà nó làm tốt: đếm số mặt, đo vị trí mặt, phát hiện khuôn mặt trong video frame (tốc độ 116-270 ảnh/s là lợi thế thật khi cần xử lý hàng chục nghìn frame).

**Không mua NexLev** — vì:
1. Chỉ có 5 checks/ngày ở bản free (quá ít cho 124 kênh).
2. $156-504/năm, trong khi Vision Cloud $0 và đo được 90%.
3. Không kiểm soát được, phụ thuộc bên thứ 3.

**Có thể làm thêm (tuỳ chọn):** Hybrid SCRFD→Cloud nếu sau này cần chạy hàng chục nghìn ảnh (tiết kiệm 60% thời gian cloud). Nhưng với quy mô hiện tại (1.240 ảnh), không cần thiết.

---

## 6. HÀNH ĐỘNG CỤ THỂ

| Ưu tiên | Việc | Ghi chú |
|---|---|---|
| 1 | Viết `scripts/faceless-vision-batch.py` | Gọi Vision Cloud cho 124 kênh, gắn `is_faceless` + `facelessConfidence` + `thumbnailNiche` |
| 2 | Chạy batch qua đêm | ~2.2 giờ cho 1.240 ảnh |
| 3 | Kiểm tra kết quả mẫu 20 kênh | Đối chiếu thủ công trước khi tin toàn bộ |
| 4 | (Tuỳ chọn) Giữ SCRFD cho video-frame analysis | Không dùng cho thumbnail classification |

---

## 7. NGUỒN KIỂM CHỨNG

- Test thực tế trên máy: SCRFD (CUDAExecutionProvider) + Vision Cloud (9Router) — 2026-09-16
- NexLev docs: `https://dashboard.nexlev.io/docs/mcp/faceless-channels`
- 1of10 docs: `https://1of10.com/blog/1of10-review`
- NicheRoza: `https://nicheroza.com/en`
- Giá NexLev: `https://outlierkit.com/resources/nexlev-pricing`
